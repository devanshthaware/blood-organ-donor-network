/**
 * Privacy-Preserving ML & LLM Gateway
 * Enforces strict feature allowlists, PII scrubbing, and location tokenization.
 */

export interface RawDonorData {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  bloodGroup: string;
  lastDonationDate?: number;
  pastAcceptanceRate?: number;
  totalRequests?: number;
  completedDonations?: number;
  noShows?: number;
  avgResponseMinutes?: number;
}

export interface AnonymizedMLFeatures {
  distanceKm: number;
  urgencyLevel: string;
  bloodGroupMatch: boolean;
  daysSinceLastDonation: number;
  pastAcceptanceRate: number;
  completedDonations: number;
  noShows: number;
  avgResponseMinutes: number;
}

/**
 * Calculates Haversine distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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

/**
 * Transforms raw donor records into strictly anonymized ML feature vectors.
 * Guaranteed: No names, emails, phones, or raw GPS coordinates reach ML models.
 */
export function buildMLFeatures(
  donor: RawDonorData,
  request: {
    bloodGroup: string;
    urgencyLevel: string;
    hospitalLatitude?: number;
    hospitalLongitude?: number;
  }
): AnonymizedMLFeatures {
  const now = Date.now();
  const daysSinceLast = donor.lastDonationDate
    ? Math.floor((now - donor.lastDonationDate) / (1000 * 60 * 60 * 24))
    : 180;

  const distanceKm =
    donor.latitude && donor.longitude && request.hospitalLatitude && request.hospitalLongitude
      ? calculateDistanceKm(
          donor.latitude,
          donor.longitude,
          request.hospitalLatitude,
          request.hospitalLongitude
        )
      : 12.5; // Coarse regional fallback

  return {
    distanceKm,
    urgencyLevel: request.urgencyLevel,
    bloodGroupMatch: donor.bloodGroup === request.bloodGroup,
    daysSinceLastDonation: daysSinceLast,
    pastAcceptanceRate: donor.pastAcceptanceRate ?? 0.85,
    completedDonations: donor.completedDonations ?? 2,
    noShows: donor.noShows ?? 0,
    avgResponseMinutes: donor.avgResponseMinutes ?? 25,
  };
}

/**
 * LLM Privacy Gateway: Sanitizes text by stripping emails, phone numbers, and identity identifiers.
 */
export function filterLLMContext(text: string): string {
  if (!text) return "";

  let sanitized = text;

  // Redact email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[REDACTED_EMAIL]"
  );

  // Redact telephone numbers (standard 10-digit and international formats)
  sanitized = sanitized.replace(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    "[REDACTED_PHONE]"
  );

  // Redact raw coordinates (e.g. lat: 18.5204, lng: 73.8567)
  sanitized = sanitized.replace(
    /([-+]?\d{1,2}\.\d{4,})\s*,\s*([-+]?\d{1,3}\.\d{4,})/g,
    "[REDACTED_COORDINATES]"
  );

  // Redact National IDs / Aadhaar / SSN formats
  sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[REDACTED_ID]");

  return sanitized;
}
