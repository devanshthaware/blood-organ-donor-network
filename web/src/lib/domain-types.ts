/**
 * Frontend Domain Types
 * Mirrors the controlled enums and lifecycles defined in Convex.
 */

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

export const ORGAN_DONOR_STATUSES = [
  "REGISTERED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

export type OrganDonorStatus = (typeof ORGAN_DONOR_STATUSES)[number];

export const CONSENT_STATUSES = [
  "NO_CONSENT",
  "PENDING",
  "GRANTED",
  "WITHDRAWN",
  "EXPIRED_OR_INVALID",
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

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

export const ORGAN_MATCH_STATUSES = [
  "PROPOSED",
  "REVIEWING",
  "ACCEPTED_FOR_ALLOCATION",
  "REJECTED_BY_COORDINATOR",
  "SUPERSEDED",
  "EXPIRED",
] as const;

export type OrganMatchStatus = (typeof ORGAN_MATCH_STATUSES)[number];

export const ALLOCATION_STATUSES = [
  "PENDING_HUMAN_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXECUTED",
] as const;

export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export interface OrganLocation {
  lat: number;
  lng: number;
  address?: string;
}
