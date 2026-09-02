"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export interface DonorProfile {
  userId: string;
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
  createdAt?: Date;
}

export function useDonorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "donors", user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setProfile({
            userId: user.uid,
            ...data,
            lastDonationDate: data.lastDonationDate?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            reliabilityUpdatedAt: data.reliabilityUpdatedAt?.toDate() || null,
          } as DonorProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { profile, loading, error };
}

export function useHospitalProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "hospitals", user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setProfile({
            userId: user.uid,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as HospitalProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { profile, loading, error };
}
