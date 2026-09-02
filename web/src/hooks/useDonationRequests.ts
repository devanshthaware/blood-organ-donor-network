"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
// Removed getCompatibleRecipients - using strict blood group matching instead

export interface DonationRequest {
  id: string;
  hospitalId: string;
  hospitalName?: string;
  bloodGroup: string;
  quantity: number;
  urgency: string;
  status: string;
  createdAt: Date | Timestamp;
  dueDate?: Date | Timestamp;
  notes?: string;
  distanceKm?: number;
  aiExplanation?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function useDonationRequests(role: "donor" | "hospital") {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Helper to fetch hospital details
    const fetchHospitalDetails = async (hospitalId: string) => {
      try {
        const hospitalDoc = await getDoc(doc(db, "hospitals", hospitalId));
        if (hospitalDoc.exists()) {
          return hospitalDoc.data();
        }
        // Fallback to users collection if not in hospitals
        const userDoc = await getDoc(doc(db, "users", hospitalId));
        return userDoc.exists() ? userDoc.data() : null;
      } catch (e) {
        console.error("Error fetching hospital:", e);
        return null;
      }
    };

    if (role === "hospital") {
      const q = query(
        collection(db, "donation_requests"),
        where("hospitalId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (!isMounted) return;

        const data: DonationRequest[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            ...docData,
            createdAt: docData.createdAt?.toDate() || new Date(),
            dueDate: docData.dueDate?.toDate(),
          } as DonationRequest);
        });
        setRequests(data);
        setLoading(false);
      }, (err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // DONOR LOGIC - STRICT STATE MACHINE: Only show PENDING requests with no terminal reservations
      const donorRef = doc(db, "donors", user.uid);

      const fetchData = async () => {
        try {
          const donorDoc = await getDoc(donorRef);
          if (!donorDoc.exists()) {
            if (isMounted) {
              setLoading(false);
              setRequests([]);
            }
            return;
          }

          const donorData = donorDoc.data();
          // Profile uses bloodType, but hook used bloodGroup internally
          const donorBloodGroup = donorData.bloodType || donorData.bloodGroup;
          const donorLocation = donorData.location; // { latitude, longitude }

          if (!donorBloodGroup) {
            if (isMounted) {
              setLoading(false);
              setRequests([]);
            }
            return;
          }

          // SINGLE SOURCE OF TRUTH: Get ALL reservations for this donor first
          const allReservationsQuery = query(
            collection(db, "reservations"),
            where("donorId", "==", user.uid),
            orderBy("createdAt", "desc")
          );

          // STRICT MATCHING: Only show requests that match the donor's exact blood type
          // O+ requests only show to O+ donors, A+ requests only show to A+ donors, etc.
          // This ensures donors only see requests they can actually fulfill
          const requestsQuery = query(
            collection(db, "donation_requests"),
            where("status", "==", "PENDING"),
            where("bloodGroup", "==", donorBloodGroup),
            orderBy("createdAt", "desc")
          );

          let allReservations: any[] = [];
          let openRequests: any[] = [];
          const hospitalCache = new Map<string, any>();

          const updateState = async () => {
            if (!isMounted) return;

            // Build map of requestId -> reservation status
            const reservationStatusMap = new Map<string, string>();
            allReservations.forEach((res) => {
              const requestId = res.requestId;
              if (requestId && !reservationStatusMap.has(requestId)) {
                reservationStatusMap.set(requestId, res.status);
              }
            });

            const results: DonationRequest[] = [];

            for (const req of openRequests) {
              const requestId = req.id;
              const reservationStatus = reservationStatusMap.get(requestId);

              // ONLY show if: No reservation exists OR Reservation exists but is PENDING
              if (!reservationStatus || reservationStatus === "PENDING") {
                // Fetch hospital with cache
                let hospitalData = hospitalCache.get(req.hospitalId);
                if (!hospitalData) {
                  hospitalData = await fetchHospitalDetails(req.hospitalId);
                  hospitalCache.set(req.hospitalId, hospitalData);
                }

                const pendingRes = allReservations.find(r => r.requestId === requestId && r.status === "PENDING");

                // Calculate distance - validate that locations are valid numbers
                let dist = undefined;
                if (donorLocation && hospitalData?.location) {
                  const donorLat = typeof donorLocation.latitude === "number" ? donorLocation.latitude : null;
                  const donorLng = typeof donorLocation.longitude === "number" ? donorLocation.longitude : null;
                  const hospLat = typeof hospitalData.location.latitude === "number" ? hospitalData.location.latitude : null;
                  const hospLng = typeof hospitalData.location.longitude === "number" ? hospitalData.location.longitude : null;

                  if (donorLat !== null && donorLng !== null && hospLat !== null && hospLng !== null) {
                    dist = calculateDistance(donorLat, donorLng, hospLat, hospLng);
                    // Validate distance is realistic (not more than 20,000 km - roughly half the Earth's circumference)
                    if (dist > 20000) {
                      console.warn(`Unrealistic distance calculated: ${dist} km for request ${requestId}`);
                      dist = undefined; // Don't show unrealistic distances
                    }
                  }
                }

                results.push({
                  id: requestId,
                  ...req,
                  status: "PENDING",
                  hospitalName: hospitalData?.name || hospitalData?.displayName || "Unknown Hospital",
                  createdAt: req.createdAt?.toDate() || new Date(),
                  dueDate: req.dueDate?.toDate(),
                  distanceKm: dist,
                  aiExplanation: pendingRes?.explanation || "Matching blood group availability.",
                } as DonationRequest);
              }
            }

            if (isMounted) {
              setRequests(results);
              setLoading(false);
            }
          };

          const unsubReservations = onSnapshot(allReservationsQuery, (snap) => {
            allReservations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            updateState();
          });

          const unsubRequests = onSnapshot(requestsQuery, (snap) => {
            openRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            updateState();
          });

          return () => {
            unsubReservations();
            unsubRequests();
          };

        } catch (err) {
          console.error(err);
          if (isMounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
          }
          return () => { };
        }
      };

      const cleanupPromise = fetchData();
      return () => {
        isMounted = false;
        cleanupPromise.then(cleanup => cleanup && cleanup());
      };
    }
  }, [user, role]);

  return { requests, loading, error };
}
