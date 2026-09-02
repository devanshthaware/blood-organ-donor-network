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

    // Verify user is admin or hospital
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (userData?.role !== "admin" && userData?.role !== "hospital") {
      return NextResponse.json(
        { error: "Only admins and hospitals can create shortage alerts" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { area, bloodGroup, shortageRisk, region } = body;

    // Validate required fields
    if (!area || !bloodGroup || !shortageRisk) {
      return NextResponse.json(
        { error: "Area, blood group, and shortage risk are required" },
        { status: 400 }
      );
    }

    // Determine severity based on shortage risk
    let severity = "MEDIUM";
    if (shortageRisk === "CRITICAL") {
      severity = "CRITICAL";
    } else if (shortageRisk === "HIGH") {
      severity = "HIGH";
    }

    // Create alert for emergency shortage
    const alertRef = adminDb.collection("alerts").doc();
    await alertRef.set({
      type: "SUPPLY_WARNING",
      severity: severity,
      bloodGroup: bloodGroup,
      title: `Emergency Shortage Alert: ${bloodGroup} Blood in ${area}`,
      message: `AI Prediction: Critical shortage detected in ${area}. Immediate action required.`,
      region: region || 0,
      area: area,
      confidence: 0.95,
      recommendedActions: [
        "Expanded donor radius",
        "NGO partners notified",
        "Blood bank stock queried",
        "Urgent donor outreach initiated"
      ],
      createdAt: FieldValue.serverTimestamp(),
      ...(userData?.role === "hospital" && { relatedHospitalId: userId }),
    });

    // Log to audit
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      "SHORTAGE_ALERT_CREATED",
      "alert",
      alertRef.id,
      "SUCCESS",
      {
        area,
        bloodGroup,
        severity,
        shortageRisk,
        region: region || 0,
      }
    );

    logger.info(`Emergency shortage alert created: ${alertRef.id} for area ${area}, blood group ${bloodGroup}`);

    return NextResponse.json({
      success: true,
      message: "Emergency shortage alert created successfully",
      alertId: alertRef.id,
    });
  } catch (error) {
    logger.error("Error creating shortage alert", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
