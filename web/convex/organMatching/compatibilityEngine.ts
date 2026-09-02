/**
 * Compatibility Engine for Organ Matching
 * Evaluates immunological (ABO) indicators, geographic distance, and data completeness.
 */

import { CandidateContext } from "./hardConstraints";

const ABO_COMPATIBILITY: Record<string, string[]> = {
  // Donor blood type -> Compatible Recipient blood types
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

export interface CompatibilityEvaluation {
  bloodCompatibility: boolean;
  isExactBloodMatch: boolean;
  distanceKm: number;
  dataCompleteness: number; // 0.0 to 1.0
  warnings: string[];
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
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

export function evaluateCompatibility(context: CandidateContext): CompatibilityEvaluation {
  const warnings: string[] = [];
  const { organ, recipient, distanceKm } = context;

  // 1. ABO Compatibility Check
  const organABO = organ.bloodType || "O-";
  const recipientABO = recipient.bloodType || "O-";
  const compatibleRecipients = ABO_COMPATIBILITY[organABO] || [];
  const bloodCompatibility = compatibleRecipients.includes(recipientABO);
  const isExactBloodMatch = organABO === recipientABO;

  if (!bloodCompatibility) {
    warnings.push(
      `ABO Incompatibility: Organ (${organABO}) is generally incompatible with recipient (${recipientABO}) without desensitization protocol.`
    );
  } else if (!isExactBloodMatch) {
    warnings.push(`Cross-type compatibility: Donor ${organABO} to Recipient ${recipientABO}`);
  }

  // 2. Geographic Warnings
  if (distanceKm > 500) {
    warnings.push(`Extended transit distance: ${Math.round(distanceKm)} km may require chartered air transport.`);
  }

  // 3. Data Completeness Calculation
  let completenessFields = 0;
  const totalCheckedFields = 5;

  if (recipient.bloodType) completenessFields++;
  if (recipient.location && recipient.location.lat && recipient.location.lng) completenessFields++;
  if (recipient.registeredAt) completenessFields++;
  if (recipient.verificationStatus === "VERIFIED") completenessFields++;
  if (organ.preservationDeadline > 0) completenessFields++;

  const dataCompleteness = Math.round((completenessFields / totalCheckedFields) * 100) / 100;

  if (dataCompleteness < 0.8) {
    warnings.push("Candidate record has partial clinical telemetry. Verification confirmation advised.");
  }

  return {
    bloodCompatibility,
    isExactBloodMatch,
    distanceKm,
    dataCompleteness,
    warnings,
  };
}
