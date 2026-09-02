"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { calculateDistance, type Coordinates } from "@/lib/distance-utils";
import { getAuthToken } from "@/lib/auth-helpers";

export interface Reservation {
  id: string;
  requestId: string;
  donorId: string;
  hospitalId: string;
  status: string;
  rank: number;
  mlScores?: {
    availability: number;
    reliability: number;
    combined: number;
  };
  explanation?: string;
  distanceKm?: number;
  bloodGroup?: string; // Added from request
  createdAt: Date | Timestamp;
  expiresAt?: any;
  estArrival?: number; // Estimated arrival time in minutes
  acceptedAt?: Date | Timestamp;
  confirmedAt?: Date | Timestamp;
  completedAt?: Date | Timestamp;
}

export function useReservations(role: "donor" | "hospital") {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Build query based on role
    let q;
    if (role === "donor") {
      q = query(
        collection(db, "reservations"),
        where("donorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "reservations"),
        where("hospitalId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        let hospitalLocation: Coordinates | null = null;

        // Cache for requests and hospitals
        const requestCache = new Map<string, any>();
        const hospitalCache = new Map<string, any>();

        const getRequestData = async (requestId: string) => {
          if (requestCache.has(requestId)) return requestCache.get(requestId);
          try {
            const rDoc = await getDoc(doc(db, "donation_requests", requestId));
            const data = rDoc.exists() ? rDoc.data() : null;
            requestCache.set(requestId, data);
            return data;
          } catch { return null; }
        };

        if (role === "hospital" && user) {
          try {
            const hospitalDoc = await getDoc(doc(db, "hospitals", user.uid));
            if (hospitalDoc.exists()) {
              const loc = hospitalDoc.data().location;
              if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
                hospitalLocation = { latitude: loc.latitude, longitude: loc.longitude };
              }
            }
          } catch (err) {
            console.error("Error fetching hospital location:", err);
          }
        }

        const { getDocs } = await import("firebase/firestore");

        const enrichedReservations = await Promise.all(
          snapshot.docs.map(async (resDoc) => {
            const resData = resDoc.data();
            let bloodGroup = "";
            let distanceKm = resData.distanceKm as number | undefined;
            let mlScores = resData.mlScores;

            // Fetch the request to get blood group
            if (resData.requestId) {
              const reqData = await getRequestData(resData.requestId);
              if (reqData) bloodGroup = reqData.bloodGroup || "";
            }

            // Calculate distance in real-time if we have hospital and donor locations
            if (role === "hospital" && hospitalLocation && resData.donorId) {
              try {
                const donorDoc = await getDoc(doc(db, "donors", resData.donorId));
                if (donorDoc.exists()) {
                  const donorData = donorDoc.data();
                  const donorLoc = donorData.location;
                  if (donorLoc && typeof donorLoc.latitude === "number" && typeof donorLoc.longitude === "number") {
                    distanceKm = calculateDistance(hospitalLocation, {
                      latitude: donorLoc.latitude,
                      longitude: donorLoc.longitude,
                    });
                  }
                }
              } catch (err) {
                console.error("Error calculating distance:", err);
              }
            }

            // Fetch ML scores if missing (only for terminal/important ones or if viewing as hospital)
            if ((!mlScores || mlScores.reliability === undefined) && role === "hospital") {
              try {
                const mlSnapshot = await getDocs(
                  query(
                    collection(db, "ml_outputs"),
                    where("reservationId", "==", resDoc.id)
                  )
                );

                mlSnapshot.forEach((mlDoc) => {
                  const mlData = mlDoc.data() as any;
                  if (mlData.modelType === "donor_availability") {
                    mlScores = { ...mlScores, availability: mlData.output?.availability_probability };
                    if (distanceKm === undefined) distanceKm = mlData.input?.distance_km;
                  }
                  if (mlData.modelType === "donor_reliability") {
                    mlScores = { ...mlScores, reliability: mlData.output?.reliability_score };
                  }
                });
              } catch (err) {
                console.error("Error fetching ML outputs:", err);
              }

              // If still no ML scores, generate defaults based on donor data and status
              if (!mlScores || mlScores.reliability === undefined) {
                try {
                  const donorDoc = await getDoc(doc(db, "donors", resData.donorId));
                  let reliability = 0.5; // Default neutral score
                  let availability = 0.7; // Default moderate availability

                  if (donorDoc.exists()) {
                    const donorData = donorDoc.data();

                    // Calculate reliability based on donor's history
                    const totalDonations = donorData.totalDonations || 0;
                    const completedDonations = donorData.completedDonations || 0;
                    const reliabilityScore = donorData.reliabilityScore;

                    // Use stored reliability score if available, otherwise calculate
                    if (typeof reliabilityScore === "number") {
                      reliability = reliabilityScore;
                    } else if (totalDonations > 0) {
                      reliability = completedDonations / totalDonations;
                    } else if (resData.status === "COMPLETED") {
                      reliability = 0.9;
                    }

                    // Calculate availability based on distance
                    if (distanceKm !== undefined) {
                      if (distanceKm < 5) availability = 0.95;
                      else if (distanceKm < 10) availability = 0.85;
                      else if (distanceKm < 20) availability = 0.75;
                      else if (distanceKm < 50) availability = 0.65;
                      else availability = 0.5;
                    }
                  } else if (resData.status === "COMPLETED") {
                    // Even if donor record is missing, if reservation is completed, it was reliable
                    reliability = 0.95;
                    availability = 0.95;
                  }

                  // Boost scores for completed reservations
                  if (resData.status === "COMPLETED") {
                    availability = Math.min(1.0, availability + 0.1);
                    reliability = Math.min(1.0, reliability + 0.1);
                  }

                  mlScores = {
                    availability,
                    reliability,
                    combined: availability * 0.6 + reliability * 0.4
                  };
                } catch (err) {
                  console.error("Error generating default ML scores:", err);
                  mlScores = {
                    availability: 0.7,
                    reliability: 0.7,
                    combined: 0.7
                  };
                }
              }
            }

            // Calculate combined score if not already set
            if (mlScores && mlScores.combined === undefined &&
              typeof mlScores.availability === "number" &&
              typeof mlScores.reliability === "number") {
              mlScores.combined = mlScores.availability * 0.6 + mlScores.reliability * 0.4;
            }

            return {
              id: resDoc.id,
              ...resData,
              bloodGroup,
              distanceKm,
              mlScores,
              createdAt: resData.createdAt?.toDate() || new Date(),
              acceptedAt: resData.acceptedAt?.toDate(),
              confirmedAt: resData.confirmedAt?.toDate(),
              completedAt: resData.completedAt?.toDate(),
            } as Reservation;
          })
        );

        setReservations(enrichedReservations);
        setLoading(false);
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user, role]);

  return { reservations, loading, error };
}
