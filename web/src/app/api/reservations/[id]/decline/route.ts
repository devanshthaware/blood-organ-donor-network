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

    const { id: reservationId } = await params;

    if (!reservationId || typeof reservationId !== "string") {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Verify reservation belongs to user
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

    if (reservationData.donorId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - This reservation does not belong to you" },
        { status: 403 }
      );
    }

    if (reservationData.status !== "PENDING") {
      return NextResponse.json(
        { error: `Reservation already ${reservationData.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update reservation status
    await reservationRef.update({
      status: "DECLINED",
      declinedAt: FieldValue.serverTimestamp(),
    });

    // Log to audit (function will also log, but we log here for immediate tracking)
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      "RESERVATION_DECLINED",
      "reservation",
      reservationId,
      "SUCCESS",
      {
        requestId: reservationData.requestId,
        hospitalId: reservationData.hospitalId,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Reservation declined",
    });
  } catch (error) {
    logger.error("Error declining reservation", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
