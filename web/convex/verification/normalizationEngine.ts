/**
 * Normalization Engine for OCR Extraction
 * Canonicalizes noisy real-world OCR strings into standard domain tokens.
 */

export function normalizeBloodGroup(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");

  const mapping: Record<string, string> = {
    "APOSITIVE": "A+",
    "APOS": "A+",
    "A+": "A+",
    "ANEGATIVE": "A-",
    "ANEG": "A-",
    "A-": "A-",
    "BPOSITIVE": "B+",
    "BPOS": "B+",
    "B+": "B+",
    "BNEGATIVE": "B-",
    "BNEG": "B-",
    "B-": "B-",
    "ABPOSITIVE": "AB+",
    "ABPOS": "AB+",
    "AB+": "AB+",
    "ABNEGATIVE": "AB-",
    "ABNEG": "AB-",
    "AB-": "AB-",
    "OPOSITIVE": "O+",
    "OPOS": "O+",
    "O+": "O+",
    "ONEGATIVE": "O-",
    "ONEG": "O-",
    "O-": "O-",
  };

  return mapping[cleaned] || cleaned;
}

export function normalizeIdentifier(raw: string): string {
  if (!raw) return "";
  // Strip whitespace around hyphens and convert to uppercase
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "");
}

export function normalizeOrganType(raw: string): string {
  if (!raw) return "";
  const upper = raw.trim().toUpperCase();
  if (upper.includes("KIDNEY")) return "KIDNEY";
  if (upper.includes("LIVER")) return "LIVER";
  if (upper.includes("HEART")) return "HEART";
  if (upper.includes("LUNG")) return "LUNGS";
  if (upper.includes("PANCREAS")) return "PANCREAS";
  if (upper.includes("CORNEA")) return "CORNEA";
  return upper;
}

export function normalizeFieldValue(field: string, value: any): string {
  if (value === null || value === undefined) return "";
  const strVal = String(value);

  if (field === "blood_group" || field === "bloodType") {
    return normalizeBloodGroup(strVal);
  }
  if (field === "identifier" || field === "unitId" || field === "organId") {
    return normalizeIdentifier(strVal);
  }
  if (field === "organ_type" || field === "organType") {
    return normalizeOrganType(strVal);
  }

  return strVal.trim().toUpperCase();
}
