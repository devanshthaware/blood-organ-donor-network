export type BloodGroup = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";

const COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
};

/**
 * Returns a list of blood groups that a donor with the given blood type can donate to.
 */
export function getCompatibleRecipients(donorType: string): string[] {
    return COMPATIBILITY_MAP[donorType as BloodGroup] || [donorType];
}

/**
 * Returns a list of blood groups that can donate to a patient with the given blood type.
 */
export function getCompatibleDonors(patientType: string): string[] {
    const donors: string[] = [];
    for (const [donor, recipients] of Object.entries(COMPATIBILITY_MAP)) {
        if (recipients.includes(patientType as BloodGroup)) {
            donors.push(donor);
        }
    }
    return donors;
}
