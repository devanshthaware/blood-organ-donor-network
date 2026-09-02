import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";
import { logAuditAction, getUserEmail } from "@/lib/audit-helpers";
import { BLOOD_GROUPS, URGENCY_LEVELS } from "@/lib/constants";

const VALID_BLOOD_GROUPS = BLOOD_GROUPS;
const VALID_URGENCY_LEVELS = URGENCY_LEVELS;

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token || token.trim() === "") {
      logger.error("Empty or missing token in Authorization header");
      return NextResponse.json(
        { error: "Invalid token: token is empty" },
        { status: 401 }
      );
    }

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
        { error: "Only hospitals can create requests" },
        { status: 403 }
      );
    }

    // Verify hospital profile exists
    const hospitalDoc = await adminDb.collection("hospitals").doc(userId).get();
    if (!hospitalDoc.exists) {
      return NextResponse.json(
        { error: "Hospital profile not found. Please complete your profile." },
        { status: 404 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { bloodGroup, quantity, urgency, dueDate, notes } = body;

    // Validate required fields
    if (!bloodGroup || quantity === undefined || !urgency) {
      return NextResponse.json(
        { error: "Missing required fields: bloodGroup, quantity, urgency" },
        { status: 400 }
      );
    }

    // Validate blood group
    const normalizedBloodGroup = bloodGroup.toUpperCase();
    if (!VALID_BLOOD_GROUPS.includes(normalizedBloodGroup)) {
      return NextResponse.json(
        { error: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate urgency
    const normalizedUrgency = urgency.toUpperCase();
    if (!VALID_URGENCY_LEVELS.includes(normalizedUrgency)) {
      return NextResponse.json(
        { error: `Invalid urgency level. Must be one of: ${VALID_URGENCY_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate quantity
    const quantityNum = typeof quantity === "string" ? parseInt(quantity, 10) : quantity;
    if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 100) {
      return NextResponse.json(
        { error: "Quantity must be a number between 1 and 100" },
        { status: 400 }
      );
    }

    // Validate dueDate if provided
    let dueDateTimestamp: Date | undefined;
    if (dueDate) {
      dueDateTimestamp = new Date(dueDate);
      if (isNaN(dueDateTimestamp.getTime())) {
        return NextResponse.json(
          { error: "Invalid dueDate format" },
          { status: 400 }
        );
      }
      if (dueDateTimestamp < new Date()) {
        return NextResponse.json(
          { error: "dueDate cannot be in the past" },
          { status: 400 }
        );
      }
    }

    // Get hospital data for region
    const hospitalData = hospitalDoc.data();
    const region = hospitalData?.region ?? 0;

    // Create donation request
    const requestRef = adminDb.collection("donation_requests").doc();
    await requestRef.set({
      hospitalId: userId,
      bloodGroup: normalizedBloodGroup,
      quantity: quantityNum,
      urgency: normalizedUrgency,
      status: "PENDING",
      region: region,
      ...(dueDateTimestamp && { dueDate: dueDateTimestamp }),
      ...(notes && typeof notes === "string" && { notes: notes.trim() }),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: userId,
    });

    // Log to audit (function will also log, but we log here for immediate tracking)
    const userEmail = await getUserEmail(userId);
    await logAuditAction(
      userId,
      userEmail,
      "REQUEST_CREATED",
      "donation_request",
      requestRef.id,
      "SUCCESS",
      {
        bloodGroup: normalizedBloodGroup,
        quantity: quantityNum,
        urgency: normalizedUrgency,
        region: region,
      }
    );

    // Function will trigger automatically and call ML API

    return NextResponse.json(
      { 
        success: true,
        requestId: requestRef.id,
        message: "Request created. Matching donors...",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error creating request", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
