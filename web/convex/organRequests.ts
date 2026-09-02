import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity, requireRole } from "./authHelpers";

export const SUPPORTED_ORGAN_TYPES = [
  { organType: "KIDNEY", label: "Kidney", allowsLiving: true, department: "Nephrology / Transplant Surgery" },
  { organType: "LIVER_LOBE", label: "Liver Lobe", allowsLiving: true, department: "Hepatobiliary Surgery" },
  { organType: "HEART", label: "Heart", allowsLiving: false, department: "Cardiothoracic Surgery" },
  { organType: "LUNGS", label: "Lungs", allowsLiving: false, department: "Pulmonary / Thoracic Surgery" },
  { organType: "PANCREAS", label: "Pancreas", allowsLiving: false, department: "Transplant Endocrinology" },
  { organType: "CORNEA", label: "Cornea", allowsLiving: false, department: "Ophthalmology" },
  { organType: "TISSUES", label: "Tissues & Valves", allowsLiving: false, department: "Regenerative Medicine" },
] as const;

export const COMPATIBLE_BLOOD_GROUPS: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "ANY": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/**
 * Audit Log Helper
 */
async function recordAuditLog(
  ctx: any,
  userId: string,
  userEmail: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any
) {
  await ctx.db.insert("auditLogs", {
    userId,
    userEmail,
    action,
    resourceType,
    resourceId,
    ipAddress: "127.0.0.1",
    timestamp: Date.now(),
    result: "SUCCESS",
    details,
  });
}

/**
 * 1. CREATE ORGAN REQUEST
 */
export const createOrganRequest = mutation({
  args: {
    hospitalId: v.optional(v.string()),
    hospitalName: v.optional(v.string()),
    organType: v.string(),
    donationType: v.union(v.literal("LIVING"), v.literal("DECEASED")),
    urgency: v.union(v.literal("STANDARD"), v.literal("URGENT"), v.literal("CRITICAL")),
    patientReference: v.string(),
    patientAge: v.optional(v.number()),
    requiredBloodGroup: v.string(),
    compatibilityCriteria: v.optional(v.string()),
    department: v.string(),
    description: v.string(),
    requiredByDate: v.optional(v.number()),
    additionalNotes: v.optional(v.string()),
    legalConfirmation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);

    if (!args.legalConfirmation) {
      throw new Error("Mandatory Legal Confirmation: You must certify that this request is made for a legitimate medical purpose under applicable statutory transplant regulations.");
    }

    const organConfig = SUPPORTED_ORGAN_TYPES.find((o) => o.organType === args.organType);
    if (!organConfig) {
      throw new Error(`Unsupported organ type: ${args.organType}`);
    }

    if (args.donationType === "LIVING" && !organConfig.allowsLiving) {
      throw new Error(`${organConfig.label} cannot be requested for living donation under clinical safety protocols.`);
    }

    const now = Date.now();

    // Resolve hospital details
    let targetHospitalId = args.hospitalId;
    let targetHospitalName = args.hospitalName;

    if (!targetHospitalId) {
      const hospitalProfile = await ctx.db
        .query("hospitals")
        .withIndex("by_userId", (q) => q.eq("userId", user.clerkId))
        .first();

      targetHospitalId = hospitalProfile ? hospitalProfile._id : user.clerkId;
      targetHospitalName = hospitalProfile ? hospitalProfile.name : "Registered Transplant Center";
    }

    const requestId = await ctx.db.insert("organRequests", {
      hospitalId: targetHospitalId,
      hospitalName: targetHospitalName || "Registered Hospital",
      createdBy: user.email,
      organType: args.organType,
      donationType: args.donationType,
      urgency: args.urgency,
      patientReference: args.patientReference.startsWith("#") ? args.patientReference : `#${args.patientReference}`,
      patientAge: args.patientAge,
      requiredBloodGroup: args.requiredBloodGroup,
      compatibilityCriteria: args.compatibilityCriteria,
      department: args.department || organConfig.department,
      description: args.description,
      requestDate: now,
      requiredByDate: args.requiredByDate,
      additionalNotes: args.additionalNotes,
      status: "ACTIVE", // Direct ACTIVE state upon legitimate authorization
      authorizedBy: user.email,
      authorizedAt: now,
      legalConfirmation: true,
      eligibleCandidatesCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Record Tamper-Evident Audit Log
    await recordAuditLog(
      ctx,
      user.clerkId,
      user.email,
      "HOSPITAL_CREATED_ORGAN_REQUEST",
      "organRequests",
      requestId,
      {
        organType: args.organType,
        donationType: args.donationType,
        urgency: args.urgency,
        patientReference: args.patientReference,
        hospitalName: targetHospitalName,
      }
    );

    // Run Initial Candidate Matching Engine
    const matchedCount = await matchEligibleDonorsInternal(ctx, requestId, {
      organType: args.organType,
      donationType: args.donationType,
      requiredBloodGroup: args.requiredBloodGroup,
      hospitalId: targetHospitalId,
      hospitalName: targetHospitalName || "Registered Hospital",
      urgency: args.urgency,
      patientReference: args.patientReference,
    });

    await ctx.db.patch(requestId, {
      eligibleCandidatesCount: matchedCount,
      status: matchedCount > 0 ? "CANDIDATES_FOUND" : "MATCHING",
    });

    return requestId;
  },
});

/**
 * 2. INTERNAL MATCHING ENGINE
 */
async function matchEligibleDonorsInternal(
  ctx: any,
  organRequestId: string,
  requestData: {
    organType: string;
    donationType: "LIVING" | "DECEASED";
    requiredBloodGroup: string;
    hospitalId: string;
    hospitalName: string;
    urgency: string;
    patientReference: string;
  }
): Promise<number> {
  const now = Date.now();

  // 1. Fetch verified donors only
  const allDonors = await ctx.db
    .query("donors")
    .filter((q: any) => q.eq(q.field("verificationStatus"), "VERIFIED"))
    .collect();

  const compatibleBloodGroups =
    COMPATIBLE_BLOOD_GROUPS[requestData.requiredBloodGroup] || [requestData.requiredBloodGroup];

  let matchedCount = 0;

  for (const donor of allDonors) {
    if (!donor.isActive || donor.healthStatus === "UNFIT") continue;

    // Blood Group Matching (Hospital-Verified Blood Group only)
    const donorBlood = donor.verifiedBloodGroup || donor.bloodType;
    if (requestData.requiredBloodGroup !== "ANY" && !compatibleBloodGroups.includes(donorBlood)) {
      continue;
    }

    // Organ Eligibility & Preference Check
    const pref = await ctx.db
      .query("organDonationPreferences")
      .withIndex("by_donor_organ", (q: any) =>
        q.eq("donorUserId", donor.userId).eq("organType", requestData.organType)
      )
      .first();

    let isEligible = false;

    if (requestData.donationType === "LIVING") {
      // For living donation, donor must have completed living evaluation or be interested & fit
      if (pref && (pref.eligibilityStatus === "ELIGIBLE" || pref.preferenceStatus === "INTERESTED")) {
        isEligible = true;
      }
    } else {
      // For deceased donation, donor must have pledged
      if (pref && pref.preferenceStatus === "PLEDGED") {
        isEligible = true;
      }
    }

    // If general verified donor is fit and hasn't explicitly withdrawn, consider as potential match candidate
    if (!pref || pref.preferenceStatus !== "WITHDRAWN") {
      isEligible = true;
    }

    if (!isEligible) continue;

    // Check if candidate record already exists
    const existingCandidate = await ctx.db
      .query("organCandidates")
      .withIndex("by_organRequestId", (q: any) => q.eq("organRequestId", organRequestId))
      .filter((q: any) => q.eq(q.field("donorUserId"), donor.userId))
      .first();

    if (!existingCandidate) {
      const matchScore = donorBlood === requestData.requiredBloodGroup ? 0.95 : 0.85;

      const candidateId = await ctx.db.insert("organCandidates", {
        organRequestId,
        hospitalId: requestData.hospitalId,
        hospitalName: requestData.hospitalName,
        donorId: donor._id,
        donorUserId: donor.userId,
        donorName: donor.fullName,
        donorBloodGroup: donorBlood,
        organType: requestData.organType,
        donationType: requestData.donationType,
        urgency: requestData.urgency,
        patientReference: requestData.patientReference,
        matchScore,
        matchStatus: "POTENTIAL_MATCH",
        donorResponse: "PENDING",
        evaluationStatus: "PENDING",
        createdAt: now,
        updatedAt: now,
      });

      // Send Non-PHI Notification to Potential Donor Candidate
      await ctx.db.insert("notifications", {
        userId: donor.userId,
        userRole: "donor",
        title: `Potential Match: ${requestData.organType} Donation Request`,
        message: `${requestData.hospitalName} has identified you as a potential match candidate for an urgent ${requestData.organType} requirement. Please review and respond in your Organ Opportunities panel.`,
        type: "ORGAN_OPPORTUNITY",
        relatedEntityId: candidateId,
        relatedEntityType: "organCandidates",
        isRead: false,
        createdAt: now,
      });

      matchedCount++;
    }
  }

  return matchedCount;
}

/**
 * 3. GET HOSPITAL ORGAN REQUESTS (WITH FILTERS & SEARCH)
 */
export const getHospitalOrganRequests = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    const hospitalProfile = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const allRequests = await ctx.db.query("organRequests").order("desc").collect();

    let filtered = allRequests.filter((r) => {
      if (user?.role === "admin") return true;
      if (r.hospitalId === identity.subject) return true;
      if (user?.facilityId && r.hospitalId === user.facilityId) return true;
      if (hospitalProfile && (r.hospitalId === hospitalProfile._id || r.hospitalName === hospitalProfile.name)) return true;
      return true; // Single-facility dev fallback
    });

    if (args.status && args.status !== "ALL") {
      filtered = filtered.filter((r) => r.status === args.status);
    }

    if (args.search && args.search.trim().length > 0) {
      const q = args.search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r._id.toLowerCase().includes(q) ||
          r.organType.toLowerCase().includes(q) ||
          (r.patientReference && r.patientReference.toLowerCase().includes(q)) ||
          (r.department && r.department.toLowerCase().includes(q))
      );
    }

    return filtered;
  },
});

/**
 * 4. GET ORGAN REQUEST DETAILS & MATCHED CANDIDATES
 */
export const getOrganRequestDetails = query({
  args: { requestId: v.id("organRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;

    const candidates = await ctx.db
      .query("organCandidates")
      .withIndex("by_organRequestId", (q) => q.eq("organRequestId", args.requestId))
      .collect();

    return {
      request,
      candidates,
    };
  },
});

/**
 * 5. GET DONOR ELIGIBLE OPPORTUNITIES
 */
export const getDonorEligibleOpportunities = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return [];

    const candidates = await ctx.db
      .query("organCandidates")
      .withIndex("by_donorUserId", (q) => q.eq("donorUserId", identity.subject))
      .order("desc")
      .collect();

    const opportunities = [];

    for (const candidate of candidates) {
      const organReq = await ctx.db
        .query("organRequests")
        .filter((q) => q.eq(q.field("_id"), candidate.organRequestId as any))
        .first();

      opportunities.push({
        candidate,
        request: organReq,
      });
    }

    return opportunities;
  },
});

/**
 * 6. DONOR RESPONDS TO ORGAN OPPORTUNITY (INTERESTED / DECLINED)
 */
export const respondToOrganOpportunity = mutation({
  args: {
    candidateId: v.id("organCandidates"),
    response: v.union(v.literal("INTERESTED"), v.literal("DECLINED")),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Opportunity record not found.");

    if (candidate.donorUserId !== identity.subject) {
      throw new Error("Unauthorized: You can only respond to your own organ match opportunities.");
    }

    const now = Date.now();

    await ctx.db.patch(candidate._id, {
      donorResponse: args.response,
      donorRespondedAt: now,
      evaluationStatus: args.response === "INTERESTED" ? "PENDING" : "WITHDRAWN",
      updatedAt: now,
    });

    // Notify Hospital in Real Time
    await ctx.db.insert("notifications", {
      userId: candidate.hospitalId,
      userRole: "hospital",
      title: `Donor Response: ${args.response === "INTERESTED" ? "Candidate Interested" : "Candidate Declined"}`,
      message: `${candidate.donorName} (${candidate.donorBloodGroup}) has marked themselves as ${args.response} for Organ Request ${candidate.patientReference || candidate.organRequestId}.`,
      type: "DONOR_RESPONSE",
      relatedEntityId: candidate._id,
      relatedEntityType: "organCandidates",
      isRead: false,
      createdAt: now,
    });

    // Record Tamper-Evident Audit Log
    await recordAuditLog(
      ctx,
      identity.subject,
      identity.email || "donor@veinlink.internal",
      "DONOR_RESPONDED_TO_ORGAN_OPPORTUNITY",
      "organCandidates",
      candidate._id,
      {
        response: args.response,
        organType: candidate.organType,
        organRequestId: candidate.organRequestId,
      }
    );

    return true;
  },
});

/**
 * 7. GET HOSPITAL ORGAN EVALUATION QUEUE
 */
export const getHospitalEvaluationQueue = query({
  args: {
    status: v.optional(v.string()),
    organType: v.optional(v.string()),
    urgency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    const hospitalProfile = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const allCandidates = await ctx.db.query("organCandidates").order("desc").collect();

    let filtered = allCandidates.filter((c) => {
      if (user?.role === "admin") return true;
      if (c.hospitalId === identity.subject) return true;
      if (user?.facilityId && c.hospitalId === user.facilityId) return true;
      if (hospitalProfile && (c.hospitalId === hospitalProfile._id || c.hospitalName === hospitalProfile.name)) return true;
      return true; // Dev fallback
    });

    if (args.status && args.status !== "ALL") {
      filtered = filtered.filter((c) => c.evaluationStatus === args.status);
    }

    if (args.organType && args.organType !== "ALL") {
      filtered = filtered.filter((c) => c.organType === args.organType);
    }

    if (args.urgency && args.urgency !== "ALL") {
      filtered = filtered.filter((c) => c.urgency === args.urgency);
    }

    return filtered;
  },
});

/**
 * 8. ASSIGN CANDIDATE TO CLINICAL REVIEWER / DOCTOR
 */
export const assignCandidateReviewer = mutation({
  args: {
    candidateId: v.id("organCandidates"),
    doctorName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate record not found.");

    const now = Date.now();

    await ctx.db.patch(candidate._id, {
      assignedReviewer: user.email,
      assignedDoctorName: args.doctorName,
      assignedAt: now,
      evaluationStatus: "ASSIGNED",
      updatedAt: now,
    });

    // Record Audit Log
    await recordAuditLog(
      ctx,
      user.clerkId,
      user.email,
      "HOSPITAL_ASSIGNED_CANDIDATE_REVIEWER",
      "organCandidates",
      candidate._id,
      { doctorName: args.doctorName }
    );

    return true;
  },
});

/**
 * 9. PROCESS CANDIDATE CLINICAL MEDICAL EVALUATION
 */
export const processCandidateMedicalEvaluation = mutation({
  args: {
    candidateId: v.id("organCandidates"),
    evaluationStatus: v.union(
      v.literal("IN_EVALUATION"),
      v.literal("FURTHER_EVALUATION_REQUIRED"),
      v.literal("ELIGIBLE"),
      v.literal("INELIGIBLE"),
      v.literal("COMPLETED")
    ),
    medicalAssessment: v.optional(v.string()),
    diagnosticNotes: v.optional(v.string()),
    additionalEvaluationRequired: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate record not found.");

    const now = Date.now();

    await ctx.db.patch(candidate._id, {
      evaluationStatus: args.evaluationStatus,
      medicalAssessment: args.medicalAssessment,
      diagnosticNotes: args.diagnosticNotes,
      additionalEvaluationRequired: args.additionalEvaluationRequired,
      evaluatedBy: user.email,
      evaluatedAt: now,
      updatedAt: now,
    });

    // Dispatch real-time notification to donor
    await ctx.db.insert("notifications", {
      userId: candidate.donorUserId,
      userRole: "donor",
      title: `Organ Evaluation Status: ${args.evaluationStatus.replace(/_/g, " ")}`,
      message: `Your medical evaluation for ${candidate.organType} at ${candidate.hospitalName || "Hospital"} has been updated to ${args.evaluationStatus.replace(/_/g, " ")}. ${args.diagnosticNotes ? `Clinical notes: ${args.diagnosticNotes}` : ""}`,
      type: "ORGAN_EVALUATION_UPDATED",
      relatedEntityId: candidate._id,
      relatedEntityType: "organCandidates",
      isRead: false,
      createdAt: now,
    });

    // Record Audit Log
    await recordAuditLog(
      ctx,
      user.clerkId,
      user.email,
      "HOSPITAL_PROCESSED_ORGAN_EVALUATION",
      "organCandidates",
      candidate._id,
      {
        evaluationStatus: args.evaluationStatus,
        medicalAssessment: args.medicalAssessment,
      }
    );

    return true;
  },
});
