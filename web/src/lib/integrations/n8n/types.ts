/**
 * VeinLink n8n Automation Types & Domain Event Contract
 * Supports the 5 standard business orchestration workflows.
 */

export type N8NWorkflowType =
  | "EMERGENCY_COORDINATION"
  | "BLOOD_DONOR_MATCHING"
  | "ORGAN_ALLOCATION_REVIEW"
  | "INTELLIGENCE_ALERTS"
  | "LOGISTICS_AUDIT";

export type N8NDomain = "emergency" | "blood" | "organ" | "intelligence" | "logistics";

export type WorkflowExecutionStatus =
  | "IDLE"
  | "QUEUED"
  | "RUNNING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "ESCALATED"
  | "HUMAN_REVIEW";

export interface DomainEventActor {
  type: "hospital" | "donor" | "admin" | "coordinator" | "system";
  id?: string;
  email?: string;
  name?: string;
}

export interface N8NEventPayload<T = Record<string, any>> {
  eventId: string;
  correlationId: string;
  idempotencyKey: string;
  eventType: string;
  workflow: N8NWorkflowType;
  domain: N8NDomain;
  entityId: string;
  timestamp: number;
  actor: DomainEventActor;
  payload: T;
  isDemo?: boolean;
}

export interface N8NExecutionResponse {
  success: boolean;
  workflow: string;
  executionId?: string;
  correlationId: string;
  status: "accepted" | "completed" | "failed" | "escalated" | "human_review_required";
  message?: string;
  errorCode?: string;
  data?: Record<string, any>;
}

// Canonical Workflow Identifiers
export const N8N_WORKFLOW_NAMES = {
  EMERGENCY_COORDINATION: "VeinLink - Emergency Coordination",
  BLOOD_DONOR_MATCHING: "VeinLink - Blood Donor Matching",
  ORGAN_ALLOCATION_REVIEW: "VeinLink - Organ Allocation Review",
  INTELLIGENCE_ALERTS: "VeinLink - Intelligence Alerts",
  LOGISTICS_AUDIT: "VeinLink - Logistics + Audit",
} as const;
