"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export interface DonorProfile {
  userId: string;
  fullName?: string;
  name?: string;
  email?: string;
  bloodType?: string;
  totalDonations?: number;
  completedDonations?: number;
  lastDonationDate?: Date | null;
  isActive?: boolean;
  createdAt?: Date;
  reliabilityScore?: number;
  reliabilityUpdatedAt?: Date | null;
  donorStatus?: string;
  diseaseStatus?: string;
  approvedHospitalId?: string;
  address?: string;
}

export interface HospitalProfile {
  userId: string;
  name?: string;
  email?: string;
  region?: number;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: Date;
}

export function useDonorProfile() {
  const { user } = useAuth();
  const donorData = useQuery(
    api.donors.getDonorProfile,
    user?.uid ? { userId: user.uid } : "skip"
  );

  const profile: DonorProfile | null = donorData
    ? {
        userId: donorData.userId,
        fullName: donorData.fullName,
        name: donorData.fullName,
        bloodType: donorData.bloodType,
        completedDonations: donorData.completedDonations,
        totalDonations: donorData.completedDonations,
        lastDonationDate: donorData.lastDonationDate
          ? new Date(donorData.lastDonationDate)
          : null,
        isActive: donorData.isActive,
        createdAt: new Date(donorData.createdAt),
        reliabilityScore: donorData.reliabilityScore,
        donorStatus: donorData.donorStatus,
        address: donorData.address,
      }
    : null;

  return {
    profile,
    loading: donorData === undefined,
    error: null,
  };
}

export function useHospitalProfile() {
  const { user } = useAuth();
  const hospData = useQuery(
    api.hospitals.getHospitalProfile,
    user?.uid ? { userId: user.uid } : "skip"
  );

  const profile: HospitalProfile | null = hospData
    ? {
        userId: hospData.userId,
        name: hospData.name,
        address: hospData.address,
        contactEmail: hospData.contactEmail,
        contactPhone: hospData.contactPhone,
        email: hospData.contactEmail,
        region: hospData.region,
        createdAt: new Date(hospData.createdAt),
      }
    : null;

  return {
    profile,
    loading: hospData === undefined,
    error: null,
  };
}
