"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export interface Patient {
  id: string;
  hospitalId: string;
  name: string;
  age?: number;
  bloodGroup: string;
  status: string;
  admissionDate: Date;
  notes?: string;
  requestId?: string;
  createdAt: Date;
}

export function usePatients() {
  const { user } = useAuth();
  const patientsData = useQuery(
    api.patients.getPatients,
    user?.uid ? { hospitalId: user.uid } : "skip"
  );

  const patients: Patient[] = (patientsData || []).map((p: any) => ({
    id: p._id,
    hospitalId: p.hospitalId,
    name: p.name,
    age: p.age,
    bloodGroup: p.bloodType,
    status: p.condition || "ADMITTED",
    admissionDate: new Date(p.createdAt),
    notes: p.condition,
    createdAt: new Date(p.createdAt),
  }));

  return {
    patients,
    loading: patientsData === undefined,
    error: null,
  };
}
export default usePatients;
