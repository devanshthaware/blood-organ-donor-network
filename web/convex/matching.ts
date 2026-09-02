import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

const COMPATIBLE_DONORS: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

const RADIUS_BY_URGENCY: Record<string, number> = {
  CRITICAL: 100,
  HIGH: 50,
  MEDIUM: 75,
  LOW: 100,
};

const COOLDOWN_MS = 56 * 24 * 60 * 60 * 1000; // 56 days

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

export const orchestrateRequestMatching = action({
  args: {
    requestId: v.string(),
    hospitalId: v.string(),
    bloodType: v.string(),
    urgency: v.string(),
    unitsRequested: v.number(),
  },
  handler: async (ctx, args): Promise<any> => {
    const mlApiUrl = process.env.ML_API_URL || "http://localhost:8000";

    // 1. Fetch hospital details
    const hospital: any = await ctx.runQuery(api.hospitals.getHospitalById, {
      hospitalId: args.hospitalId as any,
    });

    const hospLat = hospital?.lat ?? 19.076;
    const hospLng = hospital?.lng ?? 72.8777;
    const hospName = hospital?.name ?? "Regional Medical Center";

    // 2. Predict Demand via FastAPI (or fallback)
    let demandScore = 0.5;
    try {
      const demandRes = await fetch(`${mlApiUrl}/predict/demand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: hospital?.region ?? 0,
          blood_group: 0, // normalized
          demand_units: args.unitsRequested,
          supply_units: 10,
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
        }),
      });
      if (demandRes.ok) {
        const data = await demandRes.json();
        demandScore = data.predicted_demand || 0.5;
      }
    } catch {
      // Fallback: heuristic demand score based on urgency
      demandScore = args.urgency === "CRITICAL" ? 0.9 : args.urgency === "HIGH" ? 0.75 : 0.5;
    }

    // 3. Fetch Candidate Donors
    const allDonors: any = await ctx.runQuery(api.donors.getAllDonors, {});
    const compatibleGroups = COMPATIBLE_DONORS[args.bloodType] || [args.bloodType];
    const maxRadius = RADIUS_BY_URGENCY[args.urgency] || 100;
    const now = Date.now();

    const scoredCandidates = [];

    for (const donor of allDonors) {
      // Filter 1: Active
      if (!donor.isActive) continue;

      // Filter 2: Blood Compatibility
      if (!compatibleGroups.includes(donor.bloodType)) continue;

      // Filter 3: Health Status
      if (donor.healthStatus !== "FIT") continue;

      // Filter 4: 56-day Recovery Cooldown
      if (donor.lastDonationDate && now - donor.lastDonationDate < COOLDOWN_MS) {
        continue;
      }

      // Filter 5: Distance Radius
      const distance = calculateDistanceKm(hospLat, hospLng, donor.lat, donor.lng);
      if (distance > maxRadius) continue;

      // Predict Availability & Reliability via FastAPI (or fallback)
      let availScore = 0.7;
      let reliabScore = donor.reliabilityScore ?? 0.5;

      try {
        const [availRes, reliabRes] = await Promise.all([
          fetch(`${mlApiUrl}/predict/availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blood_group: 0,
              distance_km: distance,
              days_since_last_donation: donor.lastDonationDate
                ? Math.floor((now - donor.lastDonationDate) / 86400000)
                : 90,
              past_acceptance_rate: donor.pastAcceptanceRate ?? 0.8,
              urgency_level: args.urgency === "CRITICAL" ? 3 : 1,
              time_of_day: 1,
            }),
          }),
          fetch(`${mlApiUrl}/predict/reliability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              total_requests: donor.totalRequests || 5,
              accepted_requests: donor.acceptedRequests || 4,
              completed_donations: donor.completedDonations || 4,
              no_shows: donor.noShows || 0,
              avg_response_time_minutes: donor.avgResponseTimeMinutes || 20,
            }),
          }),
        ]);

        if (availRes.ok) {
          const aData = await availRes.json();
          availScore = aData.availability_probability ?? 0.7;
        }
        if (reliabRes.ok) {
          const rData = await reliabRes.json();
          reliabScore = rData.reliability_score ?? reliabScore;
        }
      } catch {
        // Fallback: heuristic scoring
        availScore = Math.max(0.3, 1 - distance / 100);
      }

      // Combined Match Score
      const matchScore = Number(
        (0.5 * availScore + 0.5 * reliabScore - (distance / 100) * 0.1).toFixed(3)
      );

      scoredCandidates.push({
        requestId: args.requestId,
        donorId: donor._id,
        donorName: donor.fullName,
        hospitalId: args.hospitalId,
        hospitalName: hospName,
        bloodType: donor.bloodType,
        urgency: args.urgency,
        matchScore,
        availabilityScore: Number(availScore.toFixed(2)),
        reliabilityScore: Number(reliabScore.toFixed(2)),
        distanceKm: distance,
        aiExplanation: {
          source: "llm_fallback",
          title: "Compatible Match Found",
          summary: `${donor.fullName} is a high-confidence match situated ${distance}km away.`,
          bullets: [
            `Blood Group ${donor.bloodType} compatible with requested ${args.bloodType}.`,
            `Recovery fitness confirmed; 56-day whole blood interval respected.`,
            `Historical reliability rating of ${(reliabScore * 100).toFixed(0)}%.`,
          ],
          confidence: matchScore > 0.7 ? "HIGH" : "MEDIUM",
        },
      });
    }

    // Sort by matchScore descending and take top 5
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
    const topCandidates = scoredCandidates.slice(0, 5);

    if (topCandidates.length > 0) {
      await ctx.runMutation(internal.reservations.createBatchReservations as any, {
        reservations: topCandidates,
      });
    }

    return { matchedCount: topCandidates.length };
  },
});
