/**
 * Seed data script for demonstrating distance calculation and ML reliability prediction
 * 
 * This script creates:
 * - Multiple donors with different locations (varying distances)
 * - A hospital with a known location
 * - Donation requests
 * - Reservations linking donors to requests
 * - ML outputs with varying reliability scores
 * 
 * Run with: npx tsx scripts/seed-reservations-data.ts
 * Or: node --loader ts-node/esm scripts/seed-reservations-data.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "veinlink-cf53";

if (!getApps().length) {
  const hasCredentials = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
  
  if (hasCredentials) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Use emulator
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
    initializeApp({ projectId });
  }
}

const db = getFirestore();

// Hospital location (New York City - Central)
const HOSPITAL_LOCATION = {
  latitude: 40.7589,
  longitude: -73.9851,
};

// Generate 50 donors (10x of original 5)
const generateDonorLocations = () => {
  const baseLocations = [
    { latitude: 40.7614, longitude: -73.9776, distance: 0.7 },
    { latitude: 40.7505, longitude: -73.9934, distance: 1.2 },
    { latitude: 40.7282, longitude: -74.0776, distance: 8.5 },
    { latitude: 40.7580, longitude: -73.9855, distance: 0.1 },
    { latitude: 40.7128, longitude: -74.0060, distance: 5.2 },
  ];
  const locations = [];
  const distanceLabels = ["Very Close", "Close", "Medium", "Medium-Far", "Far"];
  
  for (let i = 0; i < 50; i++) {
    const base = baseLocations[i % baseLocations.length];
    locations.push({
      name: `Donor ${i + 1} - ${distanceLabels[i % distanceLabels.length]}`,
      latitude: base.latitude + (Math.random() - 0.5) * 0.05,
      longitude: base.longitude + (Math.random() - 0.5) * 0.05,
      distance: base.distance * (0.8 + Math.random() * 0.4), // Vary distance ±20%
    });
  }
  return locations;
};

const DONOR_LOCATIONS = generateDonorLocations();

// Reliability scores (varying to demonstrate ML prediction) - 50 scores
const generateReliabilityScores = () => {
  const baseScores = [
    { score: 0.92, label: "High" },
    { score: 0.75, label: "Medium-High" },
    { score: 0.58, label: "Medium" },
    { score: 0.35, label: "Low-Medium" },
    { score: 0.82, label: "High" },
  ];
  const scores = [];
  for (let i = 0; i < 50; i++) {
    const base = baseScores[i % baseScores.length];
    scores.push({
      score: Math.max(0.2, Math.min(0.98, base.score + (Math.random() - 0.5) * 0.3)),
      label: base.label,
    });
  }
  return scores;
};

const RELIABILITY_SCORES = generateReliabilityScores();

async function seedData() {
  console.log("🌱 Starting seed data generation...\n");

  try {
    // 1. Create/Get Hospitals (10 hospitals)
    console.log("1. Creating hospitals (10 hospitals)...");
    const hospitalIds: string[] = [];
    const baseHospitalLocation = { latitude: HOSPITAL_LOCATION.latitude, longitude: HOSPITAL_LOCATION.longitude };
    
    // Create 10 hospitals with slightly different locations
    for (let h = 0; h < 10; h++) {
      const hospitalId = `seed_hospital_${String(h + 1).padStart(3, "0")}`;
      hospitalIds.push(hospitalId);
      const hospitalRef = db.collection("hospitals").doc(hospitalId);
      const hospitalData = {
        userId: hospitalId,
        name: `Medical Center ${h + 1}`,
        location: {
          latitude: baseHospitalLocation.latitude + (h * 0.01),
          longitude: baseHospitalLocation.longitude + (h * 0.01),
        },
        address: `${100 + h * 10} Medical Center Dr, New York, NY 1000${h + 1}`,
        region: (h % 4) + 1,
        isActive: true,
        phoneNumber: `+1-212-555-${String(h + 1).padStart(4, "0")}`,
        createdAt: FieldValue.serverTimestamp(),
      };
      await hospitalRef.set(hospitalData, { merge: true });

      const hospitalUserRef = db.collection("users").doc(hospitalId);
      await hospitalUserRef.set({
        email: `hospital${h + 1}@veinlink.demo`,
        role: "hospital",
        displayName: `Medical Center ${h + 1}`,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    const hospitalId = hospitalIds[0]; // Use first hospital as primary
    console.log(`   ✓ Created ${hospitalIds.length} hospitals\n`);
    const hospitalRef = db.collection("hospitals").doc(hospitalId);
    const hospitalData = {
      userId: hospitalId,
      name: "Central Medical Center",
      location: {
        latitude: HOSPITAL_LOCATION.latitude,
        longitude: HOSPITAL_LOCATION.longitude,
      },
      address: "123 Medical Center Dr, New York, NY 10001",
      region: 1,
      isActive: true,
      phoneNumber: "+1-212-555-0100",
      createdAt: FieldValue.serverTimestamp(),
    };
    await hospitalRef.set(hospitalData, { merge: true });
    console.log(`   ✓ Hospital created: ${hospitalId}\n`);

    // 2. Create Hospital User
    const hospitalUserRef = db.collection("users").doc(hospitalId);
    await hospitalUserRef.set({
      email: "hospital@veinlink.demo",
      role: "hospital",
      displayName: "Central Medical Center",
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // 3. Create Donors (50 donors)
    console.log("2. Creating donors (50 donors)...");
    const donorIds: string[] = [];
    for (let i = 0; i < DONOR_LOCATIONS.length; i++) {
      const donorLoc = DONOR_LOCATIONS[i];
      const reliability = RELIABILITY_SCORES[i];
      const donorId = `seed_donor_${String(i + 1).padStart(3, "0")}`;
      donorIds.push(donorId);

      // Calculate donor stats based on reliability score
      const totalRequests = Math.floor(20 + (reliability.score * 30));
      const acceptedRequests = Math.floor(totalRequests * 0.85);
      const completedDonations = Math.floor(acceptedRequests * 0.9);
      const noShows = acceptedRequests - completedDonations;
      const avgResponseTimeMinutes = reliability.score > 0.8 ? 15 : reliability.score > 0.6 ? 30 : 45;

      const donorRef = db.collection("donors").doc(donorId);
      await donorRef.set({
        userId: donorId,
        name: donorLoc.name,
        bloodGroup: "O+", // All donors are O+ for this demo
        location: {
          latitude: donorLoc.latitude,
          longitude: donorLoc.longitude,
        },
        address: `${100 + i} Donor Street, New York, NY 1000${i + 1}`,
        isActive: true,
        totalRequests,
        acceptedRequests,
        completedDonations,
        noShows,
        avgResponseTimeMinutes,
        pastAcceptanceRate: acceptedRequests / totalRequests,
        lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Create user for donor
      const donorUserRef = db.collection("users").doc(donorId);
      await donorUserRef.set({
        email: `donor${i + 1}@veinlink.demo`,
        role: "donor",
        displayName: donorLoc.name,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`   ✓ ${donorLoc.name} created (Distance: ~${donorLoc.distance} km, Reliability: ${(reliability.score * 100).toFixed(1)}%)`);
    }
    console.log("");

    // 4. Create Donation Requests (10 requests)
    console.log("3. Creating donation requests (10 requests)...");
    const requestIds: string[] = [];
    const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    const urgencyLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    
    for (let r = 0; r < 10; r++) {
      const requestId = `seed_request_${String(r + 1).padStart(3, "0")}`;
      requestIds.push(requestId);
      const requestRef = db.collection("donation_requests").doc(requestId);
      const hospitalIdForRequest = hospitalIds[r % hospitalIds.length];
      
      await requestRef.set({
        hospitalId: hospitalIdForRequest,
        bloodGroup: bloodGroups[r % bloodGroups.length],
        quantity: Math.floor(Math.random() * 4) + 1,
        urgency: urgencyLevels[r % urgencyLevels.length],
        status: "PENDING",
        region: (r % 4) + 1,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: hospitalIdForRequest,
      }, { merge: true });
    }
    const primaryRequestId = requestIds[0]; // Use first request as primary
    console.log(`   ✓ Created ${requestIds.length} requests\n`);

    // 5. Create Reservations with ML outputs (50 reservations, distributed across requests)
    console.log("4. Creating reservations with ML outputs (50 reservations)...");
    for (let i = 0; i < donorIds.length; i++) {
      const donorId = donorIds[i];
      const donorLoc = DONOR_LOCATIONS[i];
      const reliability = RELIABILITY_SCORES[i];
      const requestIdForReservation = requestIds[i % requestIds.length]; // Distribute across requests
      const hospitalIdForReservation = hospitalIds[i % hospitalIds.length];
      
      const reservationId = `seed_reservation_${String(i + 1).padStart(3, "0")}`;
      const reservationRef = db.collection("reservations").doc(reservationId);

      // Calculate availability score (simulated, based on distance and reliability)
      const availabilityScore = Math.max(0.3, Math.min(0.95, 0.9 - (donorLoc.distance / 50) + (reliability.score * 0.2)));
      const combinedScore = (availabilityScore * 0.6) + (reliability.score * 0.4);

      await reservationRef.set({
        requestId: requestIdForReservation,
        donorId,
        hospitalId: hospitalIdForReservation,
        status: "PENDING",
        rank: i + 1,
        mlScores: {
          availability: availabilityScore,
          reliability: reliability.score,
          combined: combinedScore,
        },
        explanation: `${donorLoc.name}: Availability ${(availabilityScore * 100).toFixed(1)}%, Reliability ${(reliability.score * 100).toFixed(1)}%, Combined ${(combinedScore * 100).toFixed(1)}%. Distance: ${donorLoc.distance.toFixed(1)} km.`,
        distanceKm: donorLoc.distance,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Create ML output documents
      const availabilityMLRef = db.collection("ml_outputs").doc(`availability_${reservationId}`);
      await availabilityMLRef.set({
        reservationId,
        modelType: "donor_availability",
        input: {
          blood_group: 1, // O+
          distance_km: donorLoc.distance,
          days_since_last_donation: 60,
          past_acceptance_rate: 0.85,
          urgency_level: 2, // HIGH
          time_of_day: 1, // AFTERNOON
        },
        output: {
          availability_probability: availabilityScore,
        },
        timestamp: FieldValue.serverTimestamp(),
        modelVersion: "1.0.0",
      }, { merge: true });

      const reliabilityMLRef = db.collection("ml_outputs").doc(`reliability_${reservationId}`);
      const donorDoc = await db.collection("donors").doc(donorId).get();
      const donorData = donorDoc.data();
      await reliabilityMLRef.set({
        reservationId,
        modelType: "donor_reliability",
        input: {
          total_requests: donorData?.totalRequests || 0,
          accepted_requests: donorData?.acceptedRequests || 0,
          completed_donations: donorData?.completedDonations || 0,
          no_shows: donorData?.noShows || 0,
          avg_response_time_minutes: donorData?.avgResponseTimeMinutes || 60,
        },
        output: {
          reliability_score: reliability.score,
        },
        timestamp: FieldValue.serverTimestamp(),
        modelVersion: "1.0.0",
      }, { merge: true });

      console.log(`   ✓ Reservation ${i + 1} created for ${donorLoc.name}`);
      console.log(`     - Distance: ${donorLoc.distance.toFixed(1)} km`);
      console.log(`     - Reliability: ${(reliability.score * 100).toFixed(1)}%`);
      console.log(`     - Combined Score: ${(combinedScore * 100).toFixed(1)}%`);
    }
    console.log("");

    console.log("✅ Seed data generation complete!\n");
    console.log("📊 Summary:");
    console.log(`   - Hospitals: ${hospitalIds.length}`);
    console.log(`   - Donors: ${donorIds.length}`);
    console.log(`   - Requests: ${requestIds.length}`);
    console.log(`   - Reservations: ${donorIds.length}`);
    console.log("\n💡 To view the data:");
    console.log("   1. Log in as hospital@veinlink.demo (or the hospital user)");
    console.log("   2. Navigate to Hospital → Reservations");
    console.log("   3. You should see all reservations with distances and reliability scores\n");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

// Run the seed function
seedData()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed data:", error);
    process.exit(1);
  });
