/**
 * Domain Constants & Controlled Enums
 * Source of truth for Blood & Organ Network state transitions and domain types.
 */

// Controlled representation for supported organ types
export const ORGAN_TYPES = [
  "KIDNEY",
  "LIVER",
  "HEART",
  "LUNGS",
  "PANCREAS",
  "CORNEA",
  "INTESTINE",
  "TISSUE",
] as const;

export type OrganType = (typeof ORGAN_TYPES)[number];

// Organ Donor Lifecycles
export const ORGAN_DONOR_STATUSES = [
  "REGISTERED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

export type OrganDonorStatus = (typeof ORGAN_DONOR_STATUSES)[number];

// Consent Lifecycles
export const CONSENT_STATUSES = [
  "NO_CONSENT",
  "PENDING",
  "GRANTED",
  "WITHDRAWN",
  "EXPIRED_OR_INVALID",
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

// Recipient Lifecycles
export const RECIPIENT_STATUSES = [
  "REGISTERED",
  "PENDING_VERIFICATION",
  "ACTIVE",
  "MATCHED",
  "ALLOCATED",
  "COMPLETED",
  "INACTIVE",
  "WITHDRAWN",
  "SUSPENDED",
] as const;

export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];

// Organ Inventory Lifecycles
export const ORGAN_INVENTORY_STATUSES = [
  "IDENTIFIED",
  "VERIFICATION_PENDING",
  "VERIFIED",
  "AVAILABLE",
  "MATCHING",
  "ALLOCATED",
  "IN_TRANSIT",
  "RECEIVED",
  "TRANSPLANTED",
  "EXPIRED",
  "REJECTED",
  "WITHDRAWN",
  "CANCELLED",
] as const;

export type OrganInventoryStatus = (typeof ORGAN_INVENTORY_STATUSES)[number];

// Organ Request Lifecycles
export const ORGAN_REQUEST_STATUSES = [
  "CREATED",
  "VERIFICATION_PENDING",
  "ACTIVE",
  "MATCHING",
  "MATCH_FOUND",
  "ALLOCATION_PENDING",
  "ALLOCATED",
  "CANCELLED",
  "EXPIRED",
  "REJECTED",
  "COMPLETED",
] as const;

export type OrganRequestStatus = (typeof ORGAN_REQUEST_STATUSES)[number];

// Candidate Match Lifecycles (Recommendations)
export const ORGAN_MATCH_STATUSES = [
  "PROPOSED",
  "REVIEWING",
  "ACCEPTED_FOR_ALLOCATION",
  "REJECTED_BY_COORDINATOR",
  "SUPERSEDED",
  "EXPIRED",
] as const;

export type OrganMatchStatus = (typeof ORGAN_MATCH_STATUSES)[number];

// Binding Allocation Lifecycles (Human Decisions)
export const ALLOCATION_STATUSES = [
  "PENDING_HUMAN_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXECUTED",
] as const;

export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

// Verification Statuses
export const VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
  "REJECTED",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

// Strict Lifecycle Transition Maps (State Machines)
export const VALID_ORGAN_DONOR_TRANSITIONS: Record<OrganDonorStatus, OrganDonorStatus[]> = {
  REGISTERED: ["PENDING_VERIFICATION", "INACTIVE"],
  PENDING_VERIFICATION: ["VERIFIED", "REJECTED" as any, "INACTIVE"],
  VERIFIED: ["ACTIVE", "INACTIVE", "SUSPENDED"],
  ACTIVE: ["INACTIVE", "SUSPENDED"],
  INACTIVE: ["ACTIVE", "SUSPENDED"],
  SUSPENDED: ["ACTIVE", "INACTIVE"],
};

export const VALID_ORGAN_INVENTORY_TRANSITIONS: Record<OrganInventoryStatus, OrganInventoryStatus[]> = {
  IDENTIFIED: ["VERIFICATION_PENDING", "WITHDRAWN", "CANCELLED"],
  VERIFICATION_PENDING: ["VERIFIED", "REJECTED", "WITHDRAWN"],
  VERIFIED: ["AVAILABLE", "WITHDRAWN", "EXPIRED"],
  AVAILABLE: ["MATCHING", "WITHDRAWN", "EXPIRED"],
  MATCHING: ["AVAILABLE", "ALLOCATED", "EXPIRED", "WITHDRAWN"],
  ALLOCATED: ["IN_TRANSIT", "CANCELLED", "EXPIRED"],
  IN_TRANSIT: ["RECEIVED", "CANCELLED", "EXPIRED"],
  RECEIVED: ["TRANSPLANTED", "REJECTED", "EXPIRED"],
  TRANSPLANTED: [],
  EXPIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
  CANCELLED: [],
};

export const VALID_ORGAN_REQUEST_TRANSITIONS: Record<OrganRequestStatus, OrganRequestStatus[]> = {
  CREATED: ["VERIFICATION_PENDING", "CANCELLED"],
  VERIFICATION_PENDING: ["ACTIVE", "REJECTED", "CANCELLED"],
  ACTIVE: ["MATCHING", "CANCELLED", "EXPIRED"],
  MATCHING: ["MATCH_FOUND", "ACTIVE", "CANCELLED", "EXPIRED"],
  MATCH_FOUND: ["ALLOCATION_PENDING", "ACTIVE", "CANCELLED"],
  ALLOCATION_PENDING: ["ALLOCATED", "MATCH_FOUND", "CANCELLED"],
  ALLOCATED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  EXPIRED: [],
  REJECTED: [],
  COMPLETED: [],
};

export const VALID_ALLOCATION_TRANSITIONS: Record<AllocationStatus, AllocationStatus[]> = {
  PENDING_HUMAN_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["EXECUTED", "CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
  EXECUTED: [],
};

export function isValidTransition<T extends string>(
  current: T,
  target: T,
  validMap: Record<T, T[]>
): boolean {
  const allowed = validMap[current];
  return allowed ? allowed.includes(target) : false;
}
