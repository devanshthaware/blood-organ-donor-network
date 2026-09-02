import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";
import { logAuditAction, getUserEmail } from "@/lib/audit-helpers";

export async function POST(
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
    } catch (error: any) {
      logger.error("Token verification failed", {
        error: error?.message || String(error),
        errorCode: error?.code
      });
      return NextResponse.json(
        { error: `Invalid token: ${error?.message || "Token verification failed"}` },
        { status: 401 }
      );
    }
    const userId = decodedToken.uid;

    const { id: requestId } = await params;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    // Verify user is a donor
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    const userData = userDoc.data();
    if (userData?.role !== "donor") {
      return NextResponse.json(
        { error: "Only donors can respond to requests" },
        { status: 403 }
      );
    }

    // Verify donor profile exists
    const donorDoc = await adminDb.collection("donors").doc(userId).get();
    if (!donorDoc.exists) {
      return NextResponse.json(
        { error: "Donor profile not found. Please complete your profile." },
        { status: 404 }
      );
    }

    // Get request data
    const requestRef = adminDb.collection("donation_requests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data();
    if (!requestData) {
      return NextResponse.json(
        { error: "Request data not found" },
        { status: 404 }
      );
    }

    // Parse request body to get action
    const body = await request.json();
    const { action } = body;

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Check if request is still pending (secondary check)
    if (requestData.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request is already ${requestData.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const donorData = donorDoc.data();
    if (!donorData) {
      return NextResponse.json(
        { error: "Donor data not found" },
        { status: 404 }
      );
    }

    // Get donor's blood group (check both bloodType and bloodGroup for compatibility)
    const donorBloodGroup = donorData.bloodGroup || donorData.bloodType;

    if (!donorBloodGroup) {
      return NextResponse.json(
        { error: "Your blood type has not been verified. Please complete a checkup at a hospital first." },
        { status: 400 }
      );
    }

    // Check if donor's blood type matches
    if (donorBloodGroup !== requestData.bloodGroup) {
      return NextResponse.json(
        { error: `Your blood type (${donorBloodGroup}) does not match the required type (${requestData.bloodGroup})` },
        { status: 400 }
      );
    }

    // Check for existing reservation BEFORE transaction (queries not supported in transactions)
    const reservationQuerySnapshot = await adminDb
      .collection("reservations")
      .where("requestId", "==", requestId)
      .where("donorId", "==", userId)
      .limit(1)
      .get();

    const existingReservationDoc = reservationQuerySnapshot.empty
      ? null
      : reservationQuerySnapshot.docs[0];

    const existingReservationRef = existingReservationDoc?.ref;
    const existingReservationData = existingReservationDoc?.data();

    // Validate existing reservation status if it exists
    if (existingReservationData) {
      const currentStatus = existingReservationData.status;
      const terminalStates = ["DECLINED", "ACCEPTED", "CONFIRMED", "COMPLETED", "CANCELLED"];

      if (terminalStates.includes(currentStatus)) {
        return NextResponse.json(
          {
            error: `You have already ${currentStatus.toLowerCase()} this request`,
            code: "INVALID_STATE_TRANSITION",
            currentStatus
          },
          { status: 400 }
        );
      }

      if (currentStatus !== "PENDING") {
        return NextResponse.json(
          {
            error: `Request is in ${currentStatus} state and cannot be ${action === "accept" ? "accepted" : "rejected"}`,
            code: "INVALID_STATE_TRANSITION",
            currentStatus
          },
          { status: 400 }
        );
      }
    }

    // Use Firestore transaction for atomic state update
    // This ensures both reservation and request are updated atomically
    let reservationId: string = "";

    try {
      await adminDb.runTransaction(async (transaction) => {
        // Re-read request document in transaction to check current state
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists) {
          throw new Error("Request not found");
        }

        const currentRequestData = requestSnap.data();
        if (currentRequestData?.status !== "PENDING") {
          throw new Error(`Request is already ${currentRequestData?.status?.toLowerCase() || "processed"}`);
        }

        // Use existing reservation ref if it exists, otherwise create new
        let reservationRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
        let existingCreatedAt: any = null;

        if (existingReservationRef) {
          // Re-read reservation in transaction to check current state
          const reservationSnap = await transaction.get(existingReservationRef);
          if (reservationSnap.exists) {
            const reservationData = reservationSnap.data();
            const currentStatus = reservationData?.status;

            const terminalStates = ["DECLINED", "ACCEPTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
            if (terminalStates.includes(currentStatus)) {
              throw new Error(`You have already ${currentStatus.toLowerCase()} this request`);
            }

            if (currentStatus !== "PENDING") {
              throw new Error(`Request is in ${currentStatus} state`);
            }

            existingCreatedAt = reservationData?.createdAt;
            reservationRef = existingReservationRef;
          } else {
            // Reservation was deleted between check and transaction - create new
            reservationRef = adminDb.collection("reservations").doc();
          }
        } else {
          // Create new reservation
          reservationRef = adminDb.collection("reservations").doc();
        }

        reservationId = reservationRef.id;

        // Atomic update: Update both reservation and request in same transaction
        if (action === "accept") {
          transaction.set(reservationRef, {
            requestId,
            donorId: userId,
            hospitalId: requestData.hospitalId,
            status: "ACCEPTED",
            acceptedAt: FieldValue.serverTimestamp(),
            createdAt: existingCreatedAt || FieldValue.serverTimestamp(),
          }, { merge: true });

          // Update request document atomically
          transaction.update(requestRef, {
            status: "ACCEPTED",
            acceptedDonorId: userId,
            acceptedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          transaction.set(reservationRef, {
            requestId,
            donorId: userId,
            hospitalId: requestData.hospitalId,
            status: "DECLINED",
            declinedAt: FieldValue.serverTimestamp(),
            createdAt: existingCreatedAt || FieldValue.serverTimestamp(),
          }, { merge: true });

          // For decline, we don't update request status (request stays PENDING for other donors)
        }
      });
    } catch (transactionError: any) {
      // Handle transaction errors (state conflicts)
      const errorMessage = transactionError?.message || "Transaction failed";
      logger.error("Transaction error in request respond", {
        error: errorMessage,
        requestId,
        userId,
        action,
        errorStack: transactionError?.stack,
      });

      // Return structured error response
      if (errorMessage.includes("already") ||
        errorMessage.includes("state") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("already processed")) {
        return NextResponse.json(
          {
            error: errorMessage,
            code: "INVALID_STATE_TRANSITION"
          },
          { status: 400 }
        );
      }

      // Re-throw unexpected errors to be caught by outer try-catch
      throw transactionError;
    }

    // Log to audit
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      action === "accept" ? "REQUEST_ACCEPTED" : "REQUEST_DECLINED",
      "donation_request",
      requestId,
      "SUCCESS",
      {
        reservationId,
        hospitalId: requestData.hospitalId,
        bloodGroup: requestData.bloodGroup,
        action,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Request ${action === "accept" ? "accepted" : "declined"} successfully`,
      reservationId,
    });
  } catch (error: any) {
    let requestId = "unknown";
    try {
      const resolvedParams = await params;
      requestId = resolvedParams.id;
    } catch {
      // Ignore error getting params
    }

    logger.error("Error responding to request", {
      error: error?.message || String(error),
      stack: error?.stack,
      requestId,
    });

    // Return more detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === "development"
      ? error?.message || "Internal server error"
      : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
