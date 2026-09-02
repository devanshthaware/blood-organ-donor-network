import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";
import { logAuditAction, getUserEmail } from "@/lib/audit-helpers";

export async function POST(request: NextRequest) {
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
        { error: "Only hospitals can create patients" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, age, bloodGroup, status, notes } = body;

    // Validate required fields
    if (!name || !bloodGroup) {
      return NextResponse.json(
        { error: "Name and blood group are required" },
        { status: 400 }
      );
    }

    // Create patient document
    const patientRef = adminDb.collection("patients").doc();
    await patientRef.set({
      hospitalId: userId,
      name,
      age: age ? parseInt(age, 10) : undefined,
      bloodGroup,
      status: status || "Stable",
      admissionDate: FieldValue.serverTimestamp(),
      notes: notes || "",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Log to audit
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      "PATIENT_CREATED",
      "patient",
      patientRef.id,
      "SUCCESS",
      { name, bloodGroup, status: status || "Stable" }
    );

    logger.info(`Patient created: ${patientRef.id} by hospital ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Patient created successfully",
      patientId: patientRef.id,
    });
  } catch (error) {
    logger.error("Error creating patient", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
