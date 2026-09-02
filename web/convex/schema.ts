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
});
