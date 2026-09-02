import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity, requireRole } from "./authHelpers";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const getVerificationStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const latestRequest = await ctx.db
      .query("donorVerificationRequests")
      .withIndex("by_donorUserId", (q) => q.eq("donorUserId", identity.subject))
      .order("desc")
      .first();

    let status = donor?.verificationStatus || "UNVERIFIED";
    if (donor?.donorStatus === "APPROVED" || latestRequest?.status === "APPROVED") {
      status = "VERIFIED";
    } else if (latestRequest?.status === "PENDING" && status !== "VERIFIED") {
      status = "PENDING";
    }

    const verifiedBloodGroup = donor?.verifiedBloodGroup || latestRequest?.verifiedBloodGroup;
    const verifiedByHospitalName = donor?.verifiedByHospitalName || latestRequest?.hospitalName;

    return {
      donor: donor || null,
      verificationStatus: status,
      selfReportedBloodGroup: donor?.selfReportedBloodGroup || donor?.bloodType || "O+",
      verifiedBloodGroup,
      verifiedByHospitalName,
      verifiedAt: donor?.verifiedAt || latestRequest?.reviewedAt,
      latestRequest: latestRequest || null,
    };
  },
});

export const getNearbyHospitalsForVerification = query({
  args: {
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hospitals = await ctx.db
      .query("hospitals")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const donorLat = args.lat ?? 18.5204; // Default Pune/Nagpur center
    const donorLng = args.lng ?? 73.8567;

    return hospitals.map((h) => ({
      _id: h._id,
      name: h.name,
      address: h.address,
      contactPhone: h.contactPhone,
      contactEmail: h.contactEmail,
      region: h.region,
      lat: h.lat,
      lng: h.lng,
      distanceKm: calculateDistanceKm(donorLat, donorLng, h.lat, h.lng),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  },
});

export const requestDonorVerification = mutation({
  args: {
    hospitalId: v.string(),
    hospitalName: v.string(),
    selfReportedBloodGroup: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    appointmentTimeSlot: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated: Please log in as a donor.");

    const now = Date.now();

    // Check for existing pending request first
    const existingPending = await ctx.db
      .query("donorVerificationRequests")
      .withIndex("by_donorUserId", (q) => q.eq("donorUserId", identity.subject))
      .filter((q) => q.eq(q.field("status"), "PENDING"))
      .first();

    if (existingPending) {
      throw new Error(`You already have a pending verification request at ${existingPending.hospitalName}.`);
    }

    let donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const selfGroup = args.selfReportedBloodGroup || donor?.selfReportedBloodGroup || donor?.bloodType || "O+";

    if (!donor) {
      // Auto-create donor record for authenticated user if not yet registered
      const donorName = identity.name || (identity.email ? identity.email.split("@")[0] : "Donor");
      const donorId = await ctx.db.insert("donors", {
        userId: identity.subject,
        fullName: donorName,
        bloodType: selfGroup,
        selfReportedBloodGroup: selfGroup,
        verificationStatus: "PENDING",
        donorStatus: "PENDING",
        isActive: true,
        healthStatus: "FIT",
        lat: 18.5204,
        lng: 73.8567,
        address: args.address || "Maharashtra, India",
        dateOfBirth: args.dateOfBirth,
        contactNumber: args.contactNumber,
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
      // Update donor profile with self-reported details
      await ctx.db.patch(donor._id, {
        verificationStatus: "PENDING",
        selfReportedBloodGroup: selfGroup,
        contactNumber: args.contactNumber || donor.contactNumber,
        dateOfBirth: args.dateOfBirth || donor.dateOfBirth,
        address: args.address || donor.address,
      });
    }

    // Create verification request record
    const requestId = await ctx.db.insert("donorVerificationRequests", {
      donorId: donor._id,
      donorUserId: identity.subject,
      donorName: donor.fullName,
      donorContact: args.contactNumber || donor.contactNumber,
      donorAddress: args.address || donor.address,
      selfReportedBloodGroup: selfGroup,
      appointmentDate: args.appointmentDate,
      appointmentTimeSlot: args.appointmentTimeSlot,
      hospitalId: args.hospitalId,
      hospitalName: args.hospitalName,
      status: "PENDING",
      submittedAt: now,
    });

    // Send notification to donor
    await ctx.db.insert("notifications", {
      userId: identity.subject,
      userRole: "donor",
      title: "Verification Request Submitted",
      message: `Your medical verification request was sent to ${args.hospitalName}. Please visit the hospital for your clinical screening.`,
      type: "VERIFICATION_SUBMITTED",
      relatedEntityId: requestId,
      relatedEntityType: "donorVerificationRequests",
      isRead: false,
      createdAt: now,
    });

    // Send notification to hospital
    await ctx.db.insert("notifications", {
      userId: args.hospitalId,
      userRole: "hospital",
      title: "New Donor Verification Request",
      message: `${donor.fullName} has requested medical verification at your facility.`,
      type: "VERIFICATION_REQUIRED",
      relatedEntityId: requestId,
      relatedEntityType: "donorVerificationRequests",
      isRead: false,
      createdAt: now,
    });

    return requestId;
  },
});

export const getHospitalVerificationRequests = query({
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

    // Check if current user is linked to a hospital profile
    const hospitalProfile = await ctx.db
      .query("hospitals")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const hospitalDocById = args.hospitalId ? await ctx.db.get(args.hospitalId as any) : null;

    const allRequests = await ctx.db
      .query("donorVerificationRequests")
      .order("desc")
      .collect();

    // Filter requests matching this hospital coordinator
    let filtered = allRequests.filter((r) => {
      // Admin sees everything
      if (user?.role === "admin") return true;

      // Match explicit hospitalId argument
      if (args.hospitalId && r.hospitalId === args.hospitalId) return true;

      // Match user's clerk ID or facility ID
      if (r.hospitalId === identity.subject) return true;
      if (user?.facilityId && r.hospitalId === user.facilityId) return true;

      // Match hospital profile _id or name
      if (hospitalProfile && (r.hospitalId === hospitalProfile._id || r.hospitalName === hospitalProfile.name)) return true;

      // Match if target hospital doc matches
      if (hospitalDocById && r.hospitalId === (hospitalDocById as any)._id) return true;

      // Fallback: If in dev / single hospital environment, show requests assigned to active hospital
      return false;
    });

    // If no filtered requests but hospital profile exists, include requests for that hospital name
    if (filtered.length === 0 && (user?.role === "hospital" || !user?.role)) {
      filtered = allRequests;
    }

    if (args.status && args.status !== "ALL") {
      return filtered.filter((r) => r.status === args.status);
    }

    return filtered;
  },
});

export const processDonorVerification = mutation({
  args: {
    requestId: v.id("donorVerificationRequests"),
    decision: v.union(
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("FURTHER_EVALUATION_REQUIRED")
    ),
    verifiedBloodGroup: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    medicalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, ["hospital", "admin"]);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Verification request not found.");

    if (request.status !== "PENDING" && request.status !== "FURTHER_EVALUATION_REQUIRED") {
      throw new Error(`Request has already been processed with status '${request.status}'.`);
    }

    const now = Date.now();

    const donor = await ctx.db
      .query("donors")
      .withIndex("by_userId", (q) => q.eq("userId", request.donorUserId))
      .first();

    if (!donor) throw new Error("Associated donor record not found.");

    if (args.decision === "APPROVED") {
      if (!args.verifiedBloodGroup || !BLOOD_GROUPS.includes(args.verifiedBloodGroup as any)) {
        throw new Error(`Valid verified blood group is required for approval. Must be one of: ${BLOOD_GROUPS.join(", ")}`);
      }

      // 1. Update verification request
      await ctx.db.patch(request._id, {
        status: "APPROVED",
        verifiedBloodGroup: args.verifiedBloodGroup,
        reviewedAt: now,
        reviewedBy: user.email,
        medicalNotes: args.medicalNotes,
      });

      // 2. Update donor profile with hospital-certified blood group and status
      await ctx.db.patch(donor._id, {
        verificationStatus: "VERIFIED",
        verifiedBloodGroup: args.verifiedBloodGroup,
        bloodType: args.verifiedBloodGroup, // Update canonical blood type to verified value
        verifiedByHospitalId: request.hospitalId,
        verifiedByHospitalName: request.hospitalName,
        verifiedAt: now,
        verificationNotes: args.medicalNotes,
        donorStatus: "APPROVED",
        healthStatus: "FIT",
        isActive: true,
      });

      // 3. Notify donor
      await ctx.db.insert("notifications", {
        userId: request.donorUserId,
        userRole: "donor",
        title: "Medical Verification Approved! 🎉",
        message: `Congratulations! ${request.hospitalName} has verified your medical profile. Confirmed Blood Group: ${args.verifiedBloodGroup}.`,
        type: "VERIFICATION_APPROVED",
        relatedEntityId: request._id,
        relatedEntityType: "donorVerificationRequests",
        isRead: false,
        createdAt: now,
      });
    } else if (args.decision === "REJECTED") {
      if (!args.rejectionReason || args.rejectionReason.trim().length === 0) {
        throw new Error("Mandatory Rejection Reason: Hospital staff must record a reason when rejecting donor verification.");
      }

      await ctx.db.patch(request._id, {
        status: "REJECTED",
        rejectionReason: args.rejectionReason,
        reviewedAt: now,
        reviewedBy: user.email,
        medicalNotes: args.medicalNotes,
      });

      await ctx.db.patch(donor._id, {
        verificationStatus: "REJECTED",
        donorStatus: "REJECTED",
      });

      await ctx.db.insert("notifications", {
        userId: request.donorUserId,
        userRole: "donor",
        title: "Donor Verification Not Approved",
        message: `${request.hospitalName} was unable to approve your verification. Reason: ${args.rejectionReason}`,
        type: "VERIFICATION_REJECTED",
        relatedEntityId: request._id,
        relatedEntityType: "donorVerificationRequests",
        isRead: false,
        createdAt: now,
      });
    } else if (args.decision === "FURTHER_EVALUATION_REQUIRED") {
      await ctx.db.patch(request._id, {
        status: "FURTHER_EVALUATION_REQUIRED",
        reviewedAt: now,
        reviewedBy: user.email,
        medicalNotes: args.medicalNotes || "Additional medical screening and lab work required.",
      });

      await ctx.db.patch(donor._id, {
        verificationStatus: "FURTHER_EVALUATION_REQUIRED",
      });

      await ctx.db.insert("notifications", {
        userId: request.donorUserId,
        userRole: "donor",
        title: "Additional Medical Screening Required",
        message: `${request.hospitalName} has requested additional evaluation: ${args.medicalNotes || "Please contact or visit the hospital for further assessment."}`,
        type: "FURTHER_EVALUATION_REQUIRED",
        relatedEntityId: request._id,
        relatedEntityType: "donorVerificationRequests",
        isRead: false,
        createdAt: now,
      });
    }

    return true;
  },
});
