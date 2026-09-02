import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { logAuditAction, getUserEmail } from "@/lib/audit-helpers";

export async function DELETE(
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

    const { id: patientId } = await params;

    if (!patientId || typeof patientId !== "string") {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    // Verify user is a hospital
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
        { error: "Only hospitals can delete patients" },
        { status: 403 }
      );
    }

    // Verify patient exists and belongs to this hospital
    const patientRef = adminDb.collection("patients").doc(patientId);
    const patientDoc = await patientRef.get();

    if (!patientDoc.exists) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const patientData = patientDoc.data();
    if (patientData?.hospitalId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own patients" },
        { status: 403 }
      );
    }

    // Get patient data before deletion for audit log

    // Delete patient
    await patientRef.delete();

    // Log to audit
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      "PATIENT_DELETED",
      "patient",
      patientId,
      "SUCCESS",
      { name: patientData?.name, bloodGroup: patientData?.bloodGroup }
    );

    logger.info(`Patient deleted: ${patientId} by hospital ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting patient", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
