/**
 * Application Constants
 * Centralized constants to avoid hardcoding values throughout the UI
 */

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

export const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const REQUEST_STATUSES = ["PENDING", "FULFILLED", "CANCELLED", "EXPIRED"] as const;

export const RESERVATION_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "CONFIRMED", "COMPLETED"] as const;

export const PATIENT_STATUSES = ["Stable", "Critical", "Recovering", "Discharged"] as const;

export const DONATION_STATUSES = ["COMPLETED", "CANCELLED", "NO_SHOW"] as const;

// Calculation constants
export const LIVES_SAVED_PER_DONATION = 3; // Average number of lives saved per blood donation

// Validation constants
export const REGION_MIN = 0;
export const REGION_MAX = 100; // Region identifier range for ML matching

export type BloodGroup = typeof BLOOD_GROUPS[number];
export type UrgencyLevel = typeof URGENCY_LEVELS[number];
export type RequestStatus = typeof REQUEST_STATUSES[number];
export type ReservationStatus = typeof RESERVATION_STATUSES[number];
export type PatientStatus = typeof PATIENT_STATUSES[number];
export type DonationStatus = typeof DONATION_STATUSES[number];
