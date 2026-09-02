"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

export function useHospitals() {
  const hospitalsData = useQuery(api.hospitals.getAllHospitals, {});

  const hospitals: Hospital[] = (hospitalsData || []).map((h: any) => ({
    hospital_id: h._id,
    hospital_name: h.name,
    address: h.address,
    latitude: h.lat,
    longitude: h.lng,
    blood_groups_supported: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    email: h.contactEmail,
    phone_number: h.contactPhone,
    region: h.region || 0,
  }));

  return {
    hospitals,
    loading: hospitalsData === undefined,
  };
}
export default useHospitals;
