/**
 * Unified Healthcare Resource Domain Types
 * Establishes BLOOD and ORGAN as first-class resource domains across VeinLink.
 */

export type ResourceType = "BLOOD" | "ORGAN";

export type OrganType =
  | "KIDNEY"
  | "LIVER"
  | "HEART"
  | "LUNG"
  | "PANCREAS"
  | "CORNEA"
  | "TISSUE";

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export type EmergencyDomain = "BLOOD_EMERGENCY" | "ORGAN_EMERGENCY";

export interface UnifiedResourceSummary {
  resourceType: ResourceType;
  identifier: string;
  subType: string; // e.g. "O-" or "KIDNEY"
  facilityId: string;
  facilityName: string;
  status: "AVAILABLE" | "ALLOCATED" | "IN_TRANSIT" | "RESERVED" | "EXPIRED";
  availableSince: number;
  preservationDeadline?: number; // Crucial for organs, optional for blood
  urgencyLevel?: "ROUTINE" | "URGENT" | "CRITICAL";
}

export interface UnifiedRequestSummary {
  requestId: string;
  resourceType: ResourceType;
  subType: string; // e.g. "O-" or "HEART"
  hospitalId: string;
  hospitalName: string;
  unitsRequested: number;
  urgency: "ROUTINE" | "URGENT" | "CRITICAL";
  status: "OPEN" | "MATCHING" | "PENDING_REVIEW" | "ALLOCATED" | "FULFILLED" | "CANCELLED";
  createdAt: number;
}
