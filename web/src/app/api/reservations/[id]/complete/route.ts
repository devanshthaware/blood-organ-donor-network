import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
    const userId = decodedToken.uid;

    const { id: reservationId } = await params;

    if (!reservationId || typeof reservationId !== "string") {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Verify reservation exists
    const reservationRef = adminDb.collection("reservations").doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const reservationData = reservationDoc.data();
    if (!reservationData) {
      return NextResponse.json(
        { error: "Reservation data not found" },
        { status: 404 }
      );
    }

    // Verify user is either the donor or the hospital
    const isDonor = reservationData.donorId === userId;
    const isHospital = reservationData.hospitalId === userId;

    if (!isDonor && !isHospital) {
      return NextResponse.json(
        { error: "Unauthorized - This reservation does not belong to you" },
        { status: 403 }
      );
    }

    // Verify user role
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const userRole = userData?.role;

    if (isDonor && userRole !== "donor") {
      return NextResponse.json(
        { error: "Only donors can complete their own reservations" },
        { status: 403 }
      );
    }

    if (isHospital && userRole !== "hospital") {
      return NextResponse.json(
        { error: "Only hospitals can complete their reservations" },
        { status: 403 }
      );
    }

    // Only allow completing ACCEPTED or CONFIRMED reservations
    if (reservationData.status !== "ACCEPTED" && reservationData.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: `Cannot complete reservation with status ${reservationData.status}. Reservation must be ACCEPTED or CONFIRMED.` },
        { status: 400 }
      );
    }

    // Update reservation status to COMPLETED
    await reservationRef.update({
      status: "COMPLETED",
      completedAt: FieldValue.serverTimestamp(),
    });

    // Get request data to get quantity
    let donationAmount = 450; // Default amount in ml
    if (reservationData.requestId) {
      const requestDoc = await adminDb.collection("donation_requests").doc(reservationData.requestId).get();
      if (requestDoc.exists) {
        const requestData = requestDoc.data();
        // Estimate amount: typically 1 unit = 450ml
        donationAmount = (requestData?.quantity || 1) * 450;
      }
    }

    // Get hospital name
    let hospitalName = "Unknown Hospital";
    if (reservationData.hospitalId) {
      const hospitalDoc = await adminDb.collection("hospitals").doc(reservationData.hospitalId).get();
      if (hospitalDoc.exists) {
        hospitalName = hospitalDoc.data()?.name || "Unknown Hospital";
      }
    }

    // Update donor stats (increment completedDonations)
    if (reservationData.donorId) {
      const donorRef = adminDb.collection("donors").doc(reservationData.donorId);
      const donorDoc = await donorRef.get();
      
      if (donorDoc.exists) {
        const donorData = donorDoc.data();
        await donorRef.update({
          completedDonations: (donorData?.completedDonations || 0) + 1,
          lastDonationDate: FieldValue.serverTimestamp(),
        });
      }
    }

    // Create donation history entry
    const historyRef = adminDb.collection("donation_history").doc();
    await historyRef.set({
      donorId: reservationData.donorId,
      hospitalId: reservationData.hospitalId,
      hospitalName: hospitalName,
      amount: donationAmount,
      donationDate: FieldValue.serverTimestamp(),
      status: "COMPLETED",
      reservationId: reservationId,
      requestId: reservationData.requestId,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Check if request should be marked as fulfilled
    // Count completed reservations for this request
    if (reservationData.requestId) {
      const requestRef = adminDb.collection("donation_requests").doc(reservationData.requestId);
      const requestDoc = await requestRef.get();
      
      if (requestDoc.exists) {
        const requestData = requestDoc.data();
        const completedReservations = await adminDb
          .collection("reservations")
          .where("requestId", "==", reservationData.requestId)
          .where("status", "==", "COMPLETED")
          .get();

        // If we have enough completed donations, mark request as fulfilled
        if (requestData && completedReservations.size >= (requestData.quantity || 1)) {
          await requestRef.update({
            status: "FULFILLED",
            fulfilledAt: FieldValue.serverTimestamp(),
          });
          logger.info(`Request ${reservationData.requestId} marked as FULFILLED after ${completedReservations.size} completed reservations`);
        }
      }
    }

    // Log to audit
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      "RESERVATION_COMPLETED",
      "reservation",
      reservationId,
      "SUCCESS",
      {
        requestId: reservationData.requestId,
        hospitalId: reservationData.hospitalId,
        donorId: reservationData.donorId,
        amount: donationAmount,
      }
    );

    logger.info(`Reservation ${reservationId} marked as completed by ${userRole} ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Reservation marked as completed",
    });
  } catch (error) {
    logger.error("Error completing reservation", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
