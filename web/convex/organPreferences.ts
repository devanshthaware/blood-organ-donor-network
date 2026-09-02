import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity, requireRole } from "./authHelpers";

export const SUPPORTED_ORGANS = [
  { organType: "KIDNEY", label: "Kidney", allowsLiving: true, allowsDeceased: true, description: "Single kidney donation (living or deceased)." },
  { organType: "LIVER", label: "Liver (Lobe)", allowsLiving: true, allowsDeceased: true, description: "Partial liver lobe (living) or whole liver (deceased)." },
  { organType: "HEART", label: "Heart", allowsLiving: false, allowsDeceased: true, description: "Whole heart donation (deceased pledge only)." },
  { organType: "LUNGS", label: "Lungs", allowsLiving: false, allowsDeceased: true, description: "Double or single lung donation (deceased pledge only)." },
  { organType: "PANCREAS", label: "Pancreas", allowsLiving: false, allowsDeceased: true, description: "Pancreas / islet cells (deceased pledge only)." },
  { organType: "INTESTINE", label: "Intestine", allowsLiving: false, allowsDeceased: true, description: "Small bowel donation (deceased pledge only)." },
  { organType: "CORNEA", label: "Cornea", allowsLiving: false, allowsDeceased: true, description: "Eye cornea tissue for sight restoration (deceased pledge only)." },
  { organType: "TISSUE", label: "Tissues & Bone", allowsLiving: false, allowsDeceased: true, description: "Skin, bone, tendons, and heart valves (deceased pledge only)." },
] as const;

export const getSupportedOrganTypes = query({
  args: {},
  handler: async () => {
    return SUPPORTED_ORGANS;
  },
});

export const getDonorOrganPreferences = query({
  args: {
    donorUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    const targetUserId = args.donorUserId || identity?.subject;
    if (!targetUserId) return [];

    const existingPreferences = await ctx.db
      .query("organDonationPreferences")
      .withIndex("by_donorUserId", (q) => q.eq("donorUserId", targetUserId))
      .collect();

    const existingMap = new Map(existingPreferences.map((p) => [p.organType, p]));

    // Return combined matrix ensuring all supported organs are present
    return SUPPORTED_ORGANS.map((organ) => {
      const existing = existingMap.get(organ.organType);
      if (existing) {
        return {
          ...organ,
          ...existing,
          configured: true,
        };
      }
      return {
        ...organ,
        donorUserId: targetUserId,
        donationType: organ.allowsLiving ? ("LIVING" as const) : ("DECEASED" as const),
        preferenceStatus: "WITHDRAWN" as const,
        eligibilityStatus: "NOT_EVALUATED" as const,
        configured: false,
      };
    });
  },
});

export const setOrganPreference = mutation({
  args: {
    organType: v.string(),
    donationType: v.union(v.literal("LIVING"), v.literal("DECEASED")),
    preferenceStatus: v.union(v.literal("INTERESTED"), v.literal("PLEDGED"), v.literal("WITHDRAWN")),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated: Please log in as a donor.");

    const organConfig = SUPPORTED_ORGANS.find((o) => o.organType === args.organType);
    if (!organConfig) throw new Error(`Unsupported organ type: ${args.organType}`);

    if (args.donationType === "LIVING" && !organConfig.allowsLiving) {
      throw new Error(`${organConfig.label} can only be registered for deceased organ donation.`);
    }

    let donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (!donor) {
      const donorName = identity.name || (identity.email ? identity.email.split("@")[0] : "Donor");
      const donorId = await ctx.db.insert("donors", {
        userId: identity.subject,
        fullName: donorName,
        bloodType: "O+",
        selfReportedBloodGroup: "O+",
        verificationStatus: "UNVERIFIED",
        donorStatus: "PENDING",
        isActive: true,
        healthStatus: "FIT",
        lat: 18.5204,
        lng: 73.8567,
        reliabilityScore: 0.5,
        totalRequests: 0,
        acceptedRequests: 0,
        completedDonations: 0,
        noShows: 0,
        avgResponseTimeMinutes: 30,
        pastAcceptanceRate: 0.8,
        createdAt: now,
      });
      donor = (await ctx.db.get(donorId))!;
    }

    const existing = await ctx.db
      .query("organDonationPreferences")
      .withIndex("by_donor_organ", (q) =>
        q.eq("donorUserId", identity.subject).eq("organType", args.organType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        donationType: args.donationType,
        preferenceStatus: args.preferenceStatus,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("organDonationPreferences", {
      donorId: donor._id,
      donorUserId: identity.subject,
      organType: args.organType,
      donationType: args.donationType,
      preferenceStatus: args.preferenceStatus,
      eligibilityStatus: args.donationType === "DECEASED" ? "NOT_APPLICABLE" : "NOT_EVALUATED",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const requestOrganEvaluation = mutation({
  args: {
    organType: v.string(),
    hospitalId: v.string(),
    hospitalName: v.string(),
    donorName: v.optional(v.string()),
    donorContact: v.optional(v.string()),
    donorAddress: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    appointmentTimeSlot: v.optional(v.string()),
    medicalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated: Please log in as a donor.");

    const organConfig = SUPPORTED_ORGANS.find((o) => o.organType === args.organType);
    if (!organConfig) throw new Error(`Unsupported organ type: ${args.organType}`);

    if (!organConfig.allowsLiving) {
      throw new Error(`${organConfig.label} is only permitted for deceased donation pledges; living evaluation cannot be requested.`);
    }

    let donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (!donor) {
      const donorName = args.donorName || identity.name || (identity.email ? identity.email.split("@")[0] : "Donor");
      const blood = args.bloodGroup || "O+";
      const donorId = await ctx.db.insert("donors", {
        userId: identity.subject,
        fullName: donorName,
        bloodType: blood,
        selfReportedBloodGroup: blood,
        verificationStatus: "UNVERIFIED",
        donorStatus: "PENDING",
        isActive: true,
        healthStatus: "FIT",
        lat: 18.5204,
        lng: 73.8567,
        contactNumber: args.donorContact,
        address: args.donorAddress,
        reliabilityScore: 0.5,
        totalRequests: 0,
        acceptedRequests: 0,
        completedDonations: 0,
        noShows: 0,
        avgResponseTimeMinutes: 30,
        pastAcceptanceRate: 0.8,
        createdAt: now,
      });
      donor = (await ctx.db.get(donorId))!;
    } else {
      if (args.donorContact || args.donorAddress) {
        await ctx.db.patch(donor._id, {
          ...(args.donorContact && { contactNumber: args.donorContact }),
          ...(args.donorAddress && { address: args.donorAddress }),
        });
      }
    }

    // Check for existing pending evaluation for this organ
    const existingPending = await ctx.db
      .query("organEvaluationRequests")
      .withIndex("by_donor_organ", (q) =>
        q.eq("donorUserId", identity.subject).eq("organType", args.organType)
      )
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();

    if (existingPending) {
      throw new Error(`You already have a pending ${organConfig.label} evaluation request at ${existingPending.hospitalName}.`);
    }

    // Ensure preference record is updated to PENDING
    const pref = await ctx.db
      .query("organDonationPreferences")
      .withIndex("by_donor_organ", (q) =>
        q.eq("donorUserId", identity.subject).eq("organType", args.organType)
      )
      .first();

    if (pref) {
      await ctx.db.patch(pref._id, {
        donationType: "LIVING",
        preferenceStatus: "INTERESTED",
        eligibilityStatus: "PENDING",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("organDonationPreferences", {
        donorId: donor._id,
        donorUserId: identity.subject,
        organType: args.organType,
        donationType: "LIVING",
        preferenceStatus: "INTERESTED",
        eligibilityStatus: "PENDING",
        createdAt: now,
        updatedAt: now,
      });
    }

    const finalBlood = args.bloodGroup || donor.verifiedBloodGroup || donor.selfReportedBloodGroup || donor.bloodType || "O+";
    const finalContact = args.donorContact || donor.contactNumber;
    const finalAddress = args.donorAddress || donor.address;
    const finalName = args.donorName || donor.fullName;

    const requestId = await ctx.db.insert("organEvaluationRequests", {
      donorId: donor._id,
      donorUserId: identity.subject,
      donorName: finalName,
      donorContact: finalContact,
      donorAddress: finalAddress,
      bloodGroup: finalBlood,
      appointmentDate: args.appointmentDate,
      appointmentTimeSlot: args.appointmentTimeSlot,
      hospitalId: args.hospitalId,
      hospitalName: args.hospitalName,
      organType: args.organType,
      donationType: "LIVING",
      status: "PENDING",
      medicalNotes: args.medicalNotes,
      requestedAt: now,
    });

    // Notify donor
    await ctx.db.insert("notifications", {
      userId: identity.subject,
      userRole: "donor",
      title: `${organConfig.label} Evaluation Requested`,
      message: `Your living ${organConfig.label} medical evaluation appointment request was sent to ${args.hospitalName} for ${args.appointmentDate || "clinical screening"}.`,
      type: "ORGAN_EVALUATION_SUBMITTED",
      relatedEntityId: requestId,
      relatedEntityType: "organEvaluationRequests",
      isRead: false,
      createdAt: now,
    });

    // Notify hospital
    await ctx.db.insert("notifications", {
      userId: args.hospitalId,
      userRole: "hospital",
      title: `New Organ Evaluation Request: ${organConfig.label}`,
      message: `${finalName} has requested living ${organConfig.label} donor evaluation (Appointment: ${args.appointmentDate || "Pending"}).`,
      type: "ORGAN_EVALUATION_SUBMITTED",
      relatedEntityId: requestId,
      relatedEntityType: "organEvaluationRequests",
      isRead: false,
      createdAt: now,
    });

    return requestId;
  },
});

export const getHospitalOrganEvaluationRequests = query({
  args: {
    hospitalId: v.optional(v.string()),
    status: v.optional(v.string()),
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

    const allRequests = await ctx.db
      .query("organEvaluationRequests")
      .order("desc")
      .collect();

    let filtered = allRequests.filter((r) => {
      if (user?.role === "admin") return true;
      if (args.hospitalId && r.hospitalId === args.hospitalId) return true;
      if (r.hospitalId === identity.subject) return true;
      if (user?.facilityId && r.hospitalId === user.facilityId) return true;
      if (hospitalProfile && (r.hospitalId === hospitalProfile._id || r.hospitalName === hospitalProfile.name)) return true;
      return false;
    });

    if (filtered.length === 0 && (user?.role === "hospital" || !user?.role)) {
      filtered = allRequests;
    }

    if (args.status && args.status !== "ALL") {
      filtered = filtered.filter((r) => r.status === args.status);
    }

    return filtered;
  },
});

export const processOrganEvaluation = mutation({
  args: {
    requestId: v.id("organEvaluationRequests"),
    decision: v.union(
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("FURTHER_EVALUATION_REQUIRED")
    ),
    rejectionReason: v.optional(v.string()),
    medicalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Organ evaluation request not found.");

    if (request.status !== "PENDING" && request.status !== "FURTHER_EVALUATION_REQUIRED") {
      throw new Error(`Request has already been processed with status '${request.status}'.`);
    }

    if (user.role === "hospital" && user.facilityId && user.facilityId !== request.hospitalId && user.clerkId !== request.hospitalId) {
      throw new Error("Unauthorized: You can only evaluate requests assigned to your hospital.");
    }

    const organConfig = SUPPORTED_ORGANS.find((o) => o.organType === request.organType);
    const organLabel = organConfig?.label || request.organType;
    const now = Date.now();

    const pref = await ctx.db
      .query("organDonationPreferences")
      .withIndex("by_donor_organ", (q) =>
        q.eq("donorUserId", request.donorUserId).eq("organType", request.organType)
      )
      .first();

    if (args.decision === "APPROVED") {
      await ctx.db.patch(request._id, {
        status: "APPROVED",
        decision: "ELIGIBLE",
        evaluatedAt: now,
        evaluatedBy: user.email,
        medicalNotes: args.medicalNotes,
      });

      if (pref) {
        await ctx.db.patch(pref._id, {
          eligibilityStatus: "ELIGIBLE",
          evaluatedByHospitalId: request.hospitalId,
          evaluatedByHospitalName: request.hospitalName,
          evaluatedAt: now,
          evaluationNotes: args.medicalNotes,
          updatedAt: now,
        });
      }

      await ctx.db.insert("notifications", {
        userId: request.donorUserId,
        userRole: "donor",
        title: `${organLabel} Evaluation Approved! 🫀`,
        message: `${request.hospitalName} has approved your living donor eligibility for ${organLabel}.`,
        type: "ORGAN_EVALUATION_APPROVED",
        relatedEntityId: request._id,
        relatedEntityType: "organEvaluationRequests",
        isRead: false,
        createdAt: now,
      });
    } else if (args.decision === "REJECTED") {
      if (!args.rejectionReason || args.rejectionReason.trim().length === 0) {
        throw new Error("Mandatory Clinical Justification: Hospital must record a clinical reason when rejecting organ eligibility.");
      }

      await ctx.db.patch(request._id, {
        status: "REJECTED",
        decision: "INELIGIBLE",
        rejectionReason: args.rejectionReason,
        evaluatedAt: now,
        evaluatedBy: user.email,
        medicalNotes: args.medicalNotes,
      });

      if (pref) {
        await ctx.db.patch(pref._id, {
          eligibilityStatus: "INELIGIBLE",
          evaluatedByHospitalId: request.hospitalId,
          evaluatedByHospitalName: request.hospitalName,
          evaluatedAt: now,
          evaluationNotes: args.rejectionReason,
          updatedAt: now,
        });
      }

      await ctx.db.insert("notifications", {
        userId: request.donorUserId,
        userRole: "donor",
        title: `${organLabel} Eligibility Update`,
        message: `${request.hospitalName} evaluated your ${organLabel} eligibility as Ineligible. Reason: ${args.rejectionReason}`,
        type: "ORGAN_EVALUATION_REJECTED",
        relatedEntityId: request._id,
        relatedEntityType: "organEvaluationRequests",
        isRead: false,
        createdAt: now,
      });
    } else if (args.decision === "FURTHER_EVALUATION_REQUIRED") {
      await ctx.db.patch(request._id, {
        status: "FURTHER_EVALUATION_REQUIRED",
        decision: "FURTHER_EVALUATION_REQUIRED",
        evaluatedAt: now,
        evaluatedBy: user.email,
        medicalNotes: args.medicalNotes || "Additional lab tests and specialist consultations required.",
      });

      if (pref) {
        await ctx.db.patch(pref._id, {
          eligibilityStatus: "FURTHER_EVALUATION_REQUIRED",
          evaluationNotes: args.medicalNotes,
          updatedAt: now,
        });
      }

      await ctx.db.insert("notifications", {
        userId: request.donorUserId,
        userRole: "donor",
        title: `Further ${organLabel} Testing Required`,
        message: `${request.hospitalName} requested additional evaluation for ${organLabel}: ${args.medicalNotes || "Please visit the clinic for further testing."}`,
        type: "FURTHER_EVALUATION_REQUIRED",
        relatedEntityId: request._id,
        relatedEntityType: "organEvaluationRequests",
        isRead: false,
        createdAt: now,
      });
    }

    return true;
  },
});
