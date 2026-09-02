/**
 * Hospital Data Access Layer
 */

export interface Hospital {
  hospital_id: string;
  hospital_name: string;
  address: string;
  latitude: number;
  longitude: number;
  blood_groups_supported: string[];
  email?: string;
  phone_number?: string;
  region?: number;
}

export async function getHospitals(): Promise<Hospital[]> {
  return [];
}
