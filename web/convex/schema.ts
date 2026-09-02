import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    role: v.union(v.literal("donor"), v.literal("hospital"), v.literal("admin")),
    phoneNumber: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  donors: defineTable({
    userId: v.string(), // Clerk User ID or Convex User ID for flexibility
    fullName: v.string(),
    bloodType: v.string(), // "A+", "O-", etc.
    donorStatus: v.union(v.literal("PENDING"), v.literal("APPROVED"), v.literal("REJECTED")),
    isActive: v.boolean(),
    lastDonationDate: v.optional(v.number()),
    healthStatus: v.union(v.literal("FIT"), v.literal("UNFIT"), v.literal("TEMPORARILY_UNAVAILABLE")),
    lat: v.number(),
    lng: v.number(),
    address: v.optional(v.string()),
    reliabilityScore: v.number(),
    totalRequests: v.number(),
    acceptedRequests: v.number(),
    completedDonations: v.number(),
    noShows: v.number(),
    avgResponseTimeMinutes: v.number(),
    pastAcceptanceRate: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_bloodType", ["bloodType"])
    .index("by_active", ["isActive"]),

  hospitals: defineTable({
    userId: v.string(), // Clerk User ID or Convex User ID
    name: v.string(),
    address: v.string(),
    region: v.number(),
    lat: v.number(),
    lng: v.number(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    licenseNumber: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_region", ["region"])
    .index("by_active", ["isActive"]),

  donationRequests: defineTable({
    hospitalId: v.string(),
    hospitalName: v.string(),
    patientId: v.optional(v.string()),
    bloodType: v.string(),
    unitsRequested: v.number(),
    fulfilledUnits: v.number(),
    urgency: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    status: v.union(
      v.literal("PENDING"),
      v.literal("MATCHING"),
      v.literal("PARTIALLY_FULFILLED"),
      v.literal("FULFILLED"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED")
    ),
    requiredBy: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_hospitalId", ["hospitalId"])
    .index("by_status", ["status"])
    .index("by_bloodType", ["bloodType"]),

  reservations: defineTable({
    requestId: v.string(),
    donorId: v.string(),
    donorName: v.optional(v.string()),
    hospitalId: v.string(),
    hospitalName: v.optional(v.string()),
    bloodType: v.string(),
    urgency: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("ACCEPTED"),
      v.literal("DECLINED"),
      v.literal("CONFIRMED"),
      v.literal("COMPLETED"),
      v.literal("EXPIRED")
    ),
    matchScore: v.number(),
    availabilityScore: v.number(),
    reliabilityScore: v.number(),
    distanceKm: v.number(),
    aiExplanation: v.optional(
      v.object({
        source: v.string(),
        title: v.string(),
        summary: v.string(),
        bullets: v.array(v.string()),
        confidence: v.string(),
      })
    ),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_donorId", ["donorId"])
    .index("by_requestId", ["requestId"])
    .index("by_hospitalId", ["hospitalId"])
    .index("by_status", ["status"]),

  bloodInventory: defineTable({
    hospitalId: v.string(),
    bloodType: v.string(),
    unitsAvailable: v.number(),
    minimumThreshold: v.number(),
    optimalThreshold: v.number(),
    updatedAt: v.number(),
  })
    .index("by_hospitalId", ["hospitalId"])
    .index("by_hospital_bloodType", ["hospitalId", "bloodType"]),

  alerts: defineTable({
    hospitalId: v.optional(v.string()),
    hospitalName: v.optional(v.string()),
    type: v.string(), // "SHORTAGE", "EMERGENCY_REQUEST", "SYSTEM"
    severity: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    title: v.string(),
    message: v.string(),
    bloodType: v.optional(v.string()),
    status: v.union(v.literal("ACTIVE"), v.literal("RESOLVED")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_hospitalId", ["hospitalId"])
    .index("by_severity", ["severity"]),

  auditLogs: defineTable({
    userId: v.string(),
    userEmail: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    ipAddress: v.string(),
    timestamp: v.number(),
    result: v.union(v.literal("SUCCESS"), v.literal("FAILURE"), v.literal("ERROR")),
    details: v.any(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"])
    .index("by_userId", ["userId"]),

  aiEvents: defineTable({
    modelName: v.string(),
    modelType: v.string(),
    inputSummary: v.any(),
    outputSummary: v.any(),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILED")),
    executionTimeMs: v.optional(v.number()),
    modelVersion: v.string(),
    confidence: v.optional(v.number()),
    triggerSource: v.optional(v.string()),
    requestId: v.optional(v.string()),
    reservationId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_modelName", ["modelName"]),

  patients: defineTable({
    hospitalId: v.string(),
    name: v.string(),
    age: v.number(),
    bloodType: v.string(),
    condition: v.string(),
    urgency: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    createdAt: v.number(),
  }).index("by_hospitalId", ["hospitalId"]),

  checkupRequests: defineTable({
    hospitalId: v.string(),
    hospitalName: v.optional(v.string()),
    donorId: v.string(),
    donorName: v.optional(v.string()),
    date: v.string(),
    timeSlot: v.string(),
    status: v.union(v.literal("PENDING"), v.literal("CONFIRMED"), v.literal("COMPLETED"), v.literal("CANCELLED")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_hospitalId", ["hospitalId"])
    .index("by_donorId", ["donorId"]),

  mlOutputs: defineTable({
    modelType: v.string(), // "demand", "availability", "reliability"
    requestId: v.optional(v.string()),
    donorId: v.optional(v.string()),
    inputs: v.any(),
    outputs: v.any(),
    confidence: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_modelType", ["modelType"])
    .index("by_requestId", ["requestId"]),

  // ==========================================
  // ORGAN DOMAIN ENTITIES (STEP 3 FOUNDATION)
  // ==========================================

  organDonors: defineTable({
    userId: v.string(),
    donorStatus: v.union(
      v.literal("REGISTERED"),
      v.literal("PENDING_VERIFICATION"),
      v.literal("VERIFIED"),
      v.literal("ACTIVE"),
      v.literal("INACTIVE"),
      v.literal("SUSPENDED")
    ),
    donationPreferences: v.array(v.string()), // Controlled organ types
    verificationStatus: v.union(
      v.literal("UNVERIFIED"),
      v.literal("PENDING"),
      v.literal("VERIFIED"),
      v.literal("REJECTED")
    ),
    bloodType: v.optional(v.string()),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    }),
    registeredAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["donorStatus"]),

  consentRecords: defineTable({
    donorId: v.string(), // ID of organDonors or userId
    consentType: v.union(
      v.literal("OPT_IN"),
      v.literal("ORGAN_SPECIFIC"),
      v.literal("FIRST_PERSON"),
      v.literal("SURROGATE")
    ),
    status: v.union(
      v.literal("NO_CONSENT"),
      v.literal("PENDING"),
      v.literal("GRANTED"),
      v.literal("WITHDRAWN"),
      v.literal("EXPIRED_OR_INVALID")
    ),
    witnessName: v.optional(v.string()),
    recordedAt: v.number(),
    updatedAt: v.number(),
    source: v.string(),
    version: v.string(),
    withdrawnAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_donorId", ["donorId"])
    .index("by_status", ["status"]),

  recipients: defineTable({
    userId: v.string(),
    recipientStatus: v.union(
      v.literal("REGISTERED"),
      v.literal("PENDING_VERIFICATION"),
      v.literal("ACTIVE"),
      v.literal("MATCHED"),
      v.literal("ALLOCATED"),
      v.literal("COMPLETED"),
      v.literal("INACTIVE"),
      v.literal("WITHDRAWN"),
      v.literal("SUSPENDED")
    ),
    requiredOrganType: v.string(),
    bloodType: v.string(),
    urgency: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    verificationStatus: v.union(
      v.literal("UNVERIFIED"),
      v.literal("PENDING"),
      v.literal("VERIFIED"),
      v.literal("REJECTED")
    ),
    hospitalId: v.string(),
    transplantCenterId: v.optional(v.string()),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    }),
    registeredAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["recipientStatus"])
    .index("by_organType", ["requiredOrganType"])
    .index("by_hospitalId", ["hospitalId"]),

  organInventory: defineTable({
    organType: v.string(),
    bloodType: v.string(),
    status: v.union(
      v.literal("IDENTIFIED"),
      v.literal("VERIFICATION_PENDING"),
      v.literal("VERIFIED"),
      v.literal("AVAILABLE"),
      v.literal("MATCHING"),
      v.literal("ALLOCATED"),
      v.literal("IN_TRANSIT"),
      v.literal("RECEIVED"),
      v.literal("TRANSPLANTED"),
      v.literal("EXPIRED"),
      v.literal("REJECTED"),
      v.literal("WITHDRAWN"),
      v.literal("CANCELLED")
    ),
    donorId: v.optional(v.string()),
    currentFacilityId: v.string(),
    availabilityTimestamp: v.number(),
    preservationDeadline: v.number(), // Epoch ms
    verificationStatus: v.union(
      v.literal("UNVERIFIED"),
      v.literal("PENDING"),
      v.literal("VERIFIED"),
      v.literal("REJECTED")
    ),
    viabilityNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_organType", ["organType"])
    .index("by_currentFacilityId", ["currentFacilityId"]),

  organRequests: defineTable({
    requestingOrganizationId: v.string(),
    recipientId: v.string(),
    organType: v.string(),
    bloodType: v.string(),
    urgency: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    status: v.union(
      v.literal("CREATED"),
      v.literal("VERIFICATION_PENDING"),
      v.literal("ACTIVE"),
      v.literal("MATCHING"),
      v.literal("MATCH_FOUND"),
      v.literal("ALLOCATION_PENDING"),
      v.literal("ALLOCATED"),
      v.literal("CANCELLED"),
      v.literal("EXPIRED"),
      v.literal("REJECTED"),
      v.literal("COMPLETED")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_organType", ["organType"])
    .index("by_recipientId", ["recipientId"])
    .index("by_orgId", ["requestingOrganizationId"]),

  organMatches: defineTable({
    organId: v.string(),
    recipientId: v.string(),
    requestId: v.string(),
    compatibilitySummary: v.object({
      bloodCompatibility: v.boolean(),
      distanceKm: v.number(),
      waitingTimeScore: v.optional(v.number()),
    }),
    score: v.number(),
    ranking: v.number(),
    constraints: v.array(v.string()),
    explanation: v.string(),
    modelVersion: v.string(),
    policyVersion: v.optional(v.string()),
    algorithmVersion: v.optional(v.string()),
    warnings: v.optional(v.array(v.string())),
    factorBreakdown: v.optional(v.any()),
    dataConfidence: v.optional(v.string()),
    status: v.union(
      v.literal("PROPOSED"),
      v.literal("REVIEWING"),
      v.literal("ACCEPTED_FOR_ALLOCATION"),
      v.literal("REJECTED_BY_COORDINATOR"),
      v.literal("SUPERSEDED"),
      v.literal("EXPIRED")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organId", ["organId"])
    .index("by_requestId", ["requestId"])
    .index("by_recipientId", ["recipientId"])
    .index("by_status", ["status"]),

  allocationRecommendations: defineTable({
    organId: v.string(),
    requestId: v.string(),
    recipientId: v.string(),
    candidateMatchId: v.string(),
    score: v.number(),
    rank: v.number(),
    objectives: v.any(),
    objectiveBreakdown: v.any(),
    constraints: v.array(v.string()),
    constraintResults: v.any(),
    warnings: v.array(v.string()),
    policyVersion: v.string(),
    algorithmVersion: v.string(),
    modelVersion: v.optional(v.string()),
    explanation: v.string(),
    status: v.union(
      v.literal("GENERATED"),
      v.literal("PENDING_REVIEW"),
      v.literal("UNDER_REVIEW"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("SUPERSEDED"),
      v.literal("EXPIRED")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organId", ["organId"])
    .index("by_requestId", ["requestId"])
    .index("by_recipientId", ["recipientId"])
    .index("by_status", ["status"]),

  organAllocations: defineTable({
    organId: v.string(),
    recipientId: v.string(),
    requestId: v.string(),
    matchId: v.string(),
    recommendationId: v.optional(v.string()),
    isOverride: v.optional(v.boolean()),
    overrideReason: v.optional(v.string()),
    decisionStatus: v.union(
      v.literal("PENDING_HUMAN_APPROVAL"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("CANCELLED"),
      v.literal("EXECUTED")
    ),
    decisionReason: v.string(),
    decisionMakerId: v.string(),
    decisionMakerRole: v.string(),
    approvedAt: v.optional(v.number()),
    policyVersion: v.string(),
    algorithmVersion: v.optional(v.string()),
    auditReference: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organId", ["organId"])
    .index("by_recipientId", ["recipientId"])
    .index("by_requestId", ["requestId"])
    .index("by_decisionStatus", ["decisionStatus"]),

  transplantCenters: defineTable({
    name: v.string(),
    hospitalId: v.string(),
    address: v.string(),
    region: v.number(),
    lat: v.number(),
    lng: v.number(),
    accreditationCode: v.string(),
    supportedOrgans: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_hospitalId", ["hospitalId"])
    .index("by_region", ["region"])
    .index("by_active", ["isActive"]),
});
