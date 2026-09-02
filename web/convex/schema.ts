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
    purpose: v.optional(
      v.union(
        v.literal("DONATION"),
        v.literal("EMERGENCY_CONTACT"),
        v.literal("LOCATION_PROCESSING"),
        v.literal("AI_PROCESSING"),
        v.literal("COMMUNICATION"),
        v.literal("RESEARCH")
      )
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

  // ==========================================
  // LOGISTICS & TRANSPORT ENTITIES (STEP 6)
  // ==========================================

  transportRequests: defineTable({
    allocationId: v.string(),
    organId: v.string(),
    originFacilityId: v.string(),
    destinationFacilityId: v.string(),
    priority: v.union(
      v.literal("ROUTINE"),
      v.literal("URGENT"),
      v.literal("CRITICAL_EMERGENCY")
    ),
    status: v.union(
      v.literal("CREATED"),
      v.literal("PLANNING"),
      v.literal("READY"),
      v.literal("ASSIGNED"),
      v.literal("PICKUP_PENDING"),
      v.literal("IN_TRANSIT"),
      v.literal("ARRIVED"),
      v.literal("DELIVERED"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED"),
      v.literal("DELAYED"),
      v.literal("FAILED"),
      v.literal("EXPIRED")
    ),
    selectedTransportOptionId: v.optional(v.string()),
    assignedCarrier: v.optional(v.string()),
    trackingCode: v.string(),
    preservationDeadline: v.number(),
    estimatedArrival: v.optional(v.number()),
    feasibility: v.union(
      v.literal("FEASIBLE"),
      v.literal("RISKY"),
      v.literal("INFEASIBLE"),
      v.literal("UNKNOWN")
    ),
    riskLevel: v.union(
      v.literal("LOW"),
      v.literal("MODERATE"),
      v.literal("HIGH"),
      v.literal("CRITICAL"),
      v.literal("EXPIRED")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_allocationId", ["allocationId"])
    .index("by_organId", ["organId"])
    .index("by_status", ["status"])
    .index("by_riskLevel", ["riskLevel"]),

  transportOptions: defineTable({
    transportRequestId: v.string(),
    mode: v.union(
      v.literal("ROAD_AMBULANCE"),
      v.literal("AIR_CHARTER"),
      v.literal("COMMERCIAL_AIR"),
      v.literal("SPECIALIZED_MEDICAL_COURIER")
    ),
    provider: v.string(),
    estimatedDurationMinutes: v.number(),
    estimatedArrival: v.number(),
    safetyBufferMinutes: v.number(),
    feasibility: v.union(
      v.literal("FEASIBLE"),
      v.literal("RISKY"),
      v.literal("INFEASIBLE"),
      v.literal("UNKNOWN")
    ),
    riskLevel: v.union(
      v.literal("LOW"),
      v.literal("MODERATE"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    isRecommended: v.boolean(),
    isSimulation: v.boolean(),
    calculatedAt: v.number(),
  })
    .index("by_transportRequestId", ["transportRequestId"])
    .index("by_mode", ["mode"]),

  transportEvents: defineTable({
    transportRequestId: v.string(),
    eventType: v.union(
      v.literal("CREATED"),
      v.literal("PLANNING_STARTED"),
      v.literal("ROUTE_CALCULATED"),
      v.literal("TRANSPORT_ASSIGNED"),
      v.literal("PICKUP_STARTED"),
      v.literal("PICKUP_COMPLETED"),
      v.literal("DEPARTED"),
      v.literal("CHECKPOINT_REACHED"),
      v.literal("DELAY_DETECTED"),
      v.literal("ARRIVED"),
      v.literal("DELIVERED"),
      v.literal("DELIVERY_CONFIRMED"),
      v.literal("TRANSPORT_CANCELLED")
    ),
    actorId: v.string(),
    actorRole: v.string(),
    timestamp: v.number(),
    locationDescription: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_transportRequestId", ["transportRequestId"])
    .index("by_timestamp", ["timestamp"]),

  logisticsAlerts: defineTable({
    transportRequestId: v.string(),
    organId: v.string(),
    alertType: v.union(
      v.literal("ETA_RISK"),
      v.literal("TRANSPORT_DELAY"),
      v.literal("DEADLINE_APPROACHING"),
      v.literal("DEADLINE_EXCEEDED"),
      v.literal("ROUTE_FAILURE"),
      v.literal("NO_TRANSPORT")
    ),
    severity: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    message: v.string(),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("ACKNOWLEDGED"),
      v.literal("RESOLVED")
    ),
    detectedAt: v.number(),
    acknowledgedBy: v.optional(v.string()),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_transportRequestId", ["transportRequestId"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"]),

  // ==========================================
  // COMPUTER VISION & OCR VERIFICATION (STEP 7)
  // ==========================================

  verificationRequests: defineTable({
    entityType: v.union(
      v.literal("BLOOD_UNIT"),
      v.literal("ORGAN"),
      v.literal("DONOR"),
      v.literal("RECIPIENT"),
      v.literal("TRANSPORT"),
      v.literal("DOCUMENT")
    ),
    entityId: v.string(),
    verificationType: v.union(
      v.literal("BLOOD_LABEL_VERIFICATION"),
      v.literal("ORGAN_IDENTIFIER_VERIFICATION"),
      v.literal("BARCODE_SCAN"),
      v.literal("DOCUMENT_OCR"),
      v.literal("PACKAGE_VERIFICATION")
    ),
    imageReference: v.string(),
    imageQuality: v.optional(
      v.object({
        isUsable: v.boolean(),
        blurScore: v.number(),
        resolution: v.string(),
        warnings: v.array(v.string()),
      })
    ),
    extractedData: v.optional(v.any()),
    authoritativeSnapshot: v.any(),
    comparisonResult: v.optional(
      v.object({
        status: v.union(
          v.literal("MATCH"),
          v.literal("PARTIAL_MATCH"),
          v.literal("MISMATCH"),
          v.literal("REVIEW_REQUIRED")
        ),
        confidence: v.number(),
        mismatches: v.array(
          v.object({
            field: v.string(),
            expected: v.string(),
            observed: v.string(),
            severity: v.string(),
          })
        ),
        explanation: v.string(),
      })
    ),
    status: v.union(
      v.literal("UPLOADED"),
      v.literal("PROCESSING"),
      v.literal("EXTRACTED"),
      v.literal("REVIEW_REQUIRED"),
      v.literal("VERIFIED"),
      v.literal("REJECTED"),
      v.literal("FAILED")
    ),
    reviewedBy: v.optional(v.string()),
    reviewDecision: v.optional(v.string()),
    reviewReason: v.optional(v.string()),
    engine: v.string(),
    engineVersion: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_entityType_entityId", ["entityType", "entityId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // ==========================================
  // n8n WORKFLOW AUTOMATION & EVENTS (STEP 8)
  // ==========================================

  domainEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    version: v.string(),
    occurredAt: v.number(),
    actor: v.object({
      type: v.string(),
      id: v.optional(v.string()),
    }),
    source: v.object({
      system: v.string(),
      service: v.string(),
    }),
    aggregate: v.object({
      type: v.string(),
      id: v.string(),
    }),
    correlationId: v.string(),
    payload: v.any(),
    metadata: v.optional(v.any()),
    deliveryStatus: v.union(
      v.literal("PENDING"),
      v.literal("DELIVERED"),
      v.literal("FAILED"),
      v.literal("DEAD_LETTER")
    ),
    deliveryAttempts: v.number(),
    lastDeliveredAt: v.optional(v.number()),
  })
    .index("by_eventType", ["eventType"])
    .index("by_correlationId", ["correlationId"])
    .index("by_deliveryStatus", ["deliveryStatus"])
    .index("by_occurredAt", ["occurredAt"]),

  workflowExecutions: defineTable({
    executionId: v.string(),
    workflowName: v.string(),
    workflowVersion: v.string(),
    eventId: v.string(),
    correlationId: v.string(),
    status: v.union(
      v.literal("RECEIVED"),
      v.literal("PROCESSING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("RETRYING"),
      v.literal("DEAD_LETTER")
    ),
    attemptCount: v.number(),
    lastAttemptAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    idempotencyKey: v.string(),
    actionsTaken: v.array(v.string()),
  })
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_workflowName", ["workflowName"])
    .index("by_status", ["status"])
    .index("by_eventId", ["eventId"]),

  workflowEscalations: defineTable({
    escalationId: v.string(),
    workflowName: v.string(),
    severity: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    entityType: v.string(),
    entityId: v.string(),
    reason: v.string(),
    assignedRole: v.string(),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("ACKNOWLEDGED"),
      v.literal("RESOLVED")
    ),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_createdAt", ["createdAt"]),

  // ==========================================
  // BLOCKCHAIN TRUST & PROVENANCE LAYER (STEP 9)
  // ==========================================

  auditProofs: defineTable({
    proofId: v.string(),
    auditId: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    aggregateType: v.string(),
    aggregateId: v.string(),
    actorType: v.string(),
    actorId: v.optional(v.string()),
    occurredAt: v.number(),
    action: v.string(),
    result: v.string(),
    dataHash: v.string(),
    previousAuditHash: v.optional(v.string()),
    chainHash: v.string(),
    trustLevel: v.union(
      v.literal("STANDARD"),
      v.literal("IMPORTANT"),
      v.literal("CRITICAL")
    ),
    blockchainStatus: v.union(
      v.literal("PENDING"),
      v.literal("SUBMITTING"),
      v.literal("CONFIRMED"),
      v.literal("FAILED"),
      v.literal("RETRYING")
    ),
    blockchainTxId: v.optional(v.string()),
    blockchainBlock: v.optional(v.number()),
    blockchainNetwork: v.optional(v.string()),
    merkleBatchId: v.optional(v.string()),
    merkleRoot: v.optional(v.string()),
    anchoredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_dataHash", ["dataHash"])
    .index("by_chainHash", ["chainHash"])
    .index("by_blockchainStatus", ["blockchainStatus"])
    .index("by_trustLevel", ["trustLevel"]),

  merkleBatches: defineTable({
    batchId: v.string(),
    rootHash: v.string(),
    eventCount: v.number(),
    proofIds: v.array(v.string()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("SUBMITTING"),
      v.literal("CONFIRMED"),
      v.literal("FAILED")
    ),
    blockchainTxId: v.optional(v.string()),
    blockchainNetwork: v.string(),
    anchoredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_rootHash", ["rootHash"]),

  aiDecisionProvenance: defineTable({
    provenanceId: v.string(),
    decisionId: v.string(),
    modelType: v.string(),
    modelVersion: v.string(),
    inputHash: v.string(),
    outputHash: v.string(),
    confidence: v.number(),
    explanationHash: v.string(),
    recommendation: v.string(),
    humanDecision: v.optional(v.string()),
    isOverride: v.boolean(),
    overrideReason: v.optional(v.string()),
    proofId: v.string(),
    timestamp: v.number(),
  })
    .index("by_decisionId", ["decisionId"])
    .index("by_proofId", ["proofId"])
    .index("by_isOverride", ["isOverride"]),

  // ==========================================
  // PRIVACY, SECURITY & GOVERNANCE (STEP 10)
  // ==========================================

  securityEvents: defineTable({
    eventId: v.string(),
    eventType: v.union(
      v.literal("ACCESS_DENIED"),
      v.literal("AUTH_FAILURE"),
      v.literal("PRIVILEGE_ESCALATION_ATTEMPT"),
      v.literal("RATE_LIMIT_EXCEEDED"),
      v.literal("ACCOUNT_SUSPENDED"),
      v.literal("ACCOUNT_RESTORED"),
      v.literal("CONSENT_REVOKED"),
      v.literal("ROLE_CHANGED")
    ),
    actorId: v.optional(v.string()),
    actorRole: v.optional(v.string()),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    facilityId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    reason: v.string(),
    severity: v.union(
      v.literal("LOW"),
      v.literal("MEDIUM"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    timestamp: v.number(),
  })
    .index("by_eventType", ["eventType"])
    .index("by_severity", ["severity"])
    .index("by_timestamp", ["timestamp"]),
});
