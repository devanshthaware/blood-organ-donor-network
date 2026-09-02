import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";
import { logAuditAction, getUserEmail } from "@/lib/audit-helpers";

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

    const { id: requestId } = await params;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    // Verify request exists
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

    // Verify user is the hospital that created the request
    if (requestData.hospitalId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only cancel your own requests" },
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
    if (userData?.role !== "hospital") {
      return NextResponse.json(
        { error: "Only hospitals can cancel requests" },
        { status: 403 }
      );
    }

    // Only allow canceling PENDING requests
    if (requestData.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot cancel request with status ${requestData.status}. Only PENDING requests can be cancelled.` },
        { status: 400 }
      );
    }

    // Update request status to CANCELLED
    await requestRef.update({
      status: "CANCELLED",
      cancelledAt: FieldValue.serverTimestamp(),
    });

    // Cancel all related PENDING reservations
    const reservationsSnapshot = await adminDb
      .collection("reservations")
      .where("requestId", "==", requestId)
      .where("status", "==", "PENDING")
      .get();

    const cancelPromises = reservationsSnapshot.docs.map((doc) =>
      doc.ref.update({
        status: "CANCELLED",
        cancelledAt: FieldValue.serverTimestamp(),
      })
    );

    await Promise.all(cancelPromises);

    // Log to audit
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      "REQUEST_CANCELLED",
      "donation_request",
      requestId,
      "SUCCESS",
      {
        bloodGroup: requestData.bloodGroup,
        quantity: requestData.quantity,
        urgency: requestData.urgency,
        cancelledReservations: reservationsSnapshot.size,
      }
    );

    logger.info(`Request ${requestId} cancelled by hospital ${userId}, ${reservationsSnapshot.size} reservations cancelled`);

    return NextResponse.json({
      success: true,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    logger.error("Error cancelling request", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
