import { n8nClient } from "./client";
import {
  DomainEventActor,
  N8NEventPayload,
  N8NExecutionResponse,
} from "./types";

/**
 * 1. VeinLink - Emergency Coordination
 * Supports both Blood Emergency and Organ Emergency escalation.
 */
export async function triggerEmergencyWorkflow(params: {
  emergencyId: string;
  domain: "blood" | "organ";
  emergencyType: string;
  urgency: "ROUTINE" | "URGENT" | "CRITICAL";
  hospitalId: string;
  hospitalName: string;
  requiredResource: string;
  bloodGroup?: string;
  organType?: string;
  patientReference?: string;
  actor: DomainEventActor;
  isDemo?: boolean;
}): Promise<N8NExecutionResponse> {
  const correlationId = n8nClient.generateCorrelationId("EMG");
  const idempotencyKey = n8nClient.generateIdempotencyKey(
    `emergency.${params.domain}.created`,
    params.emergencyId
  );

  const event: N8NEventPayload = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    correlationId,
    idempotencyKey,
    eventType: `emergency.${params.domain}.coordination`,
    workflow: "EMERGENCY_COORDINATION",
    domain: "emergency",
    entityId: params.emergencyId,
    timestamp: Date.now(),
    actor: params.actor,
    isDemo: params.isDemo,
    payload: {
      emergencyId: params.emergencyId,
      domain: params.domain,
      emergencyType: params.emergencyType,
      urgency: params.urgency,
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
      requiredResource: params.requiredResource,
      bloodGroup: params.bloodGroup,
      organType: params.organType,
      patientReference: params.patientReference,
    },
  };

  return await n8nClient.dispatchWorkflow(event);
}

/**
 * 2. VeinLink - Blood Donor Matching
 * Dispatches blood request matching events, notifies eligible donors, and tracks responses.
 */
export async function triggerBloodMatchingWorkflow(params: {
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  bloodGroup: string;
  unitsRequested: number;
  urgency: "ROUTINE" | "URGENT" | "CRITICAL";
  candidateDonorsCount: number;
  actor: DomainEventActor;
  isDemo?: boolean;
}): Promise<N8NExecutionResponse> {
  const correlationId = n8nClient.generateCorrelationId("BLD");
  const idempotencyKey = n8nClient.generateIdempotencyKey("blood.matching.dispatched", params.requestId);

  const event: N8NEventPayload = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    correlationId,
    idempotencyKey,
    eventType: "blood.donor.matching",
    workflow: "BLOOD_DONOR_MATCHING",
    domain: "blood",
    entityId: params.requestId,
    timestamp: Date.now(),
    actor: params.actor,
    isDemo: params.isDemo,
    payload: {
      requestId: params.requestId,
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
      bloodGroup: params.bloodGroup,
      unitsRequested: params.unitsRequested,
      urgency: params.urgency,
      candidateDonorsCount: params.candidateDonorsCount,
    },
  };

  return await n8nClient.dispatchWorkflow(event);
}

/**
 * 3. VeinLink - Organ Allocation Review
 * Enforces explainable AI recommendation with strict MANDATORY HUMAN REVIEW.
 */
export async function triggerOrganAllocationWorkflow(params: {
  allocationCaseId: string;
  organId: string;
  organType: string;
  donorBloodGroup: string;
  topCandidateScore: number;
  explainabilitySummary: string;
  uncertaintyScore: number;
  humanReviewRequired: boolean;
  hospitalId: string;
  hospitalName: string;
  actor: DomainEventActor;
  isDemo?: boolean;
}): Promise<N8NExecutionResponse> {
  const correlationId = n8nClient.generateCorrelationId("ORG");
  const idempotencyKey = n8nClient.generateIdempotencyKey(
    "organ.allocation.review",
    params.allocationCaseId
  );

  const event: N8NEventPayload = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    correlationId,
    idempotencyKey,
    eventType: "organ.allocation.review",
    workflow: "ORGAN_ALLOCATION_REVIEW",
    domain: "organ",
    entityId: params.allocationCaseId,
    timestamp: Date.now(),
    actor: params.actor,
    isDemo: params.isDemo,
    payload: {
      allocationCaseId: params.allocationCaseId,
      organId: params.organId,
      organType: params.organType,
      donorBloodGroup: params.donorBloodGroup,
      topCandidateScore: params.topCandidateScore,
      explainabilitySummary: params.explainabilitySummary,
      uncertaintyScore: params.uncertaintyScore,
      humanReviewRequired: params.humanReviewRequired, // Safety invariant: Always true
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
      requiresAuthorizedClinicianDecision: true,
    },
  };

  return await n8nClient.dispatchWorkflow(event);
}

/**
 * 4. VeinLink - Intelligence Alerts
 * Handles demand surges, shortage forecasts, network anomalies, and AI review requirements.
 */
export async function triggerIntelligenceWorkflow(params: {
  alertId: string;
  alertType: "SHORTAGE_PREDICTION" | "DEMAND_SURGE" | "NETWORK_ANOMALY" | "AI_HIGH_UNCERTAINTY";
  region: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details: string;
  metrics: Record<string, any>;
  actor: DomainEventActor;
  isDemo?: boolean;
}): Promise<N8NExecutionResponse> {
  const correlationId = n8nClient.generateCorrelationId("INT");
  const idempotencyKey = n8nClient.generateIdempotencyKey(
    `intelligence.${params.alertType.toLowerCase()}`,
    params.alertId
  );

  const event: N8NEventPayload = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    correlationId,
    idempotencyKey,
    eventType: "intelligence.alert.emitted",
    workflow: "INTELLIGENCE_ALERTS",
    domain: "intelligence",
    entityId: params.alertId,
    timestamp: Date.now(),
    actor: params.actor,
    isDemo: params.isDemo,
    payload: {
      alertId: params.alertId,
      alertType: params.alertType,
      region: params.region,
      severity: params.severity,
      details: params.details,
      metrics: params.metrics,
    },
  };

  return await n8nClient.dispatchWorkflow(event);
}

/**
 * 5. VeinLink - Logistics + Audit
 * Tracks blood and organ transport, cold-chain preservation, delay alarms, and Merkle hash verification.
 */
export async function triggerLogisticsAuditWorkflow(params: {
  transportId: string;
  domain: "blood" | "organ";
  resourceType: string;
  originFacility: string;
  destinationFacility: string;
  estimatedDurationHours: number;
  coldChainLimitHours?: number;
  delayDetected?: boolean;
  merkleRootHash?: string;
  actor: DomainEventActor;
  isDemo?: boolean;
}): Promise<N8NExecutionResponse> {
  const correlationId = n8nClient.generateCorrelationId("LOG");
  const idempotencyKey = n8nClient.generateIdempotencyKey(
    `logistics.${params.domain}.transport`,
    params.transportId
  );

  const event: N8NEventPayload = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    correlationId,
    idempotencyKey,
    eventType: "logistics.audit.tracked",
    workflow: "LOGISTICS_AUDIT",
    domain: "logistics",
    entityId: params.transportId,
    timestamp: Date.now(),
    actor: params.actor,
    isDemo: params.isDemo,
    payload: {
      transportId: params.transportId,
      domain: params.domain,
      resourceType: params.resourceType,
      originFacility: params.originFacility,
      destinationFacility: params.destinationFacility,
      estimatedDurationHours: params.estimatedDurationHours,
      coldChainLimitHours: params.coldChainLimitHours,
      delayDetected: params.delayDetected,
      merkleRootHash: params.merkleRootHash,
    },
  };

  return await n8nClient.dispatchWorkflow(event);
}
