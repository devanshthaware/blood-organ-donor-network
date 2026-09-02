/**
 * Standardized Domain Event Contract & Envelope
 * Guarantees cross-system interoperability between Convex, n8n, and external services.
 */

import { createHmac } from "crypto";

export interface VeinLinkDomainEvent<T = Record<string, any>> {
  eventId: string;
  eventType: string;
  version: string;
  occurredAt: number;
  actor: {
    type: "user" | "system" | "coordinator" | "donor" | "admin";
    id?: string;
  };
  source: {
    system: "convex" | "n8n" | "fastapi" | "system";
    service: string;
  };
  aggregate: {
    type: "bloodInventory" | "donationRequest" | "organ" | "allocation" | "transport" | "verification";
    id: string;
  };
  correlationId: string;
  payload: T;
  metadata?: {
    facilityId?: string;
    priority?: "ROUTINE" | "URGENT" | "CRITICAL";
    environment?: "development" | "staging" | "production";
  };
}

// Canonical Event Taxonomy
export const EVENT_TYPES = {
  // Blood
  BLOOD_REQUEST_CREATED: "blood.request.created",
  BLOOD_REQUEST_UPDATED: "blood.request.updated",
  BLOOD_INVENTORY_LOW: "blood.inventory.low",
  BLOOD_INVENTORY_CRITICAL: "blood.inventory.critical",
  BLOOD_DONOR_MATCHED: "blood.donor.matched",
  BLOOD_RESERVATION_CREATED: "blood.reservation.created",
  BLOOD_RESERVATION_EXPIRED: "blood.reservation.expired",
  BLOOD_DONATION_COMPLETED: "blood.donation.completed",

  // Organ
  ORGAN_REGISTERED: "organ.registered",
  ORGAN_VERIFIED: "organ.verified",
  ORGAN_AVAILABLE: "organ.available",
  ORGAN_MATCH_GENERATED: "organ.match.generated",
  ORGAN_ALLOCATION_RECOMMENDED: "organ.allocation.recommended",
  ORGAN_ALLOCATION_APPROVED: "organ.allocation.approved",
  ORGAN_ALLOCATION_REJECTED: "organ.allocation.rejected",
  ORGAN_PRESERVATION_WARNING: "organ.preservation.warning",
  ORGAN_PRESERVATION_CRITICAL: "organ.preservation.critical",
  ORGAN_PRESERVATION_EXPIRED: "organ.preservation.expired",

  // Logistics
  TRANSPORT_REQUEST_CREATED: "transport.request.created",
  TRANSPORT_ASSIGNED: "transport.assigned",
  TRANSPORT_PICKUP_PENDING: "transport.pickup.pending",
  TRANSPORT_IN_TRANSIT: "transport.in_transit",
  TRANSPORT_DELAY_DETECTED: "transport.delay.detected",
  TRANSPORT_ETA_RISK: "transport.eta.risk",
  TRANSPORT_DELIVERED: "transport.delivered",
  TRANSPORT_RECEIPT_CONFIRMED: "transport.receipt.confirmed",

  // Verification
  VERIFICATION_CREATED: "verification.created",
  VERIFICATION_COMPLETED: "verification.completed",
  VERIFICATION_MISMATCH_DETECTED: "verification.mismatch.detected",
  VERIFICATION_REVIEW_REQUIRED: "verification.review.required",

  // Network & Emergency
  FACILITY_ALERT_CREATED: "facility.alert.created",
  EMERGENCY_REQUEST_CREATED: "emergency.request.created",
  NETWORK_SHORTAGE_DETECTED: "network.shortage.detected",
  NETWORK_ESCALATION_TRIGGERED: "network.escalation.triggered",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export function generateEventSignature(
  payloadString: string,
  secret: string = process.env.N8N_WEBHOOK_SECRET || "veinlink-default-hmac-secret-2026"
): string {
  return createHmac("sha256", secret).update(payloadString).digest("hex");
}

export function verifyEventSignature(
  payloadString: string,
  signature: string,
  secret: string = process.env.N8N_WEBHOOK_SECRET || "veinlink-default-hmac-secret-2026"
): boolean {
  const expected = generateEventSignature(payloadString, secret);
  return expected === signature;
}

export function validateEventEnvelope(event: any): { isValid: boolean; error?: string } {
  if (!event || typeof event !== "object") {
    return { isValid: false, error: "Event must be a non-null object" };
  }
  if (!event.eventId || typeof event.eventId !== "string") {
    return { isValid: false, error: "Missing or invalid eventId" };
  }
  if (!event.eventType || typeof event.eventType !== "string") {
    return { isValid: false, error: "Missing or invalid eventType" };
  }
  if (!event.occurredAt || typeof event.occurredAt !== "number") {
    return { isValid: false, error: "Missing or invalid occurredAt timestamp" };
  }
  if (!event.aggregate || !event.aggregate.id || !event.aggregate.type) {
    return { isValid: false, error: "Missing or invalid aggregate object" };
  }
  if (!event.correlationId || typeof event.correlationId !== "string") {
    return { isValid: false, error: "Missing or invalid correlationId" };
  }
  if (!event.payload || typeof event.payload !== "object") {
    return { isValid: false, error: "Missing or invalid payload object" };
  }
  return { isValid: true };
}
