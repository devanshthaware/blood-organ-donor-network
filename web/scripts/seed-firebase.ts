/**
 * Firebase Seed Script
 * 
 * This script seeds Firebase with initial data for development and testing.
 * Run with: npx tsx scripts/seed-firebase.ts
 * 
 * Make sure Firebase emulators are running or you have proper credentials set.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "veinlink-cf53";

  // Check if we have credentials (production) or should use emulator
  const hasCredentials = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;

  if (hasCredentials) {
    // Use credentials for production
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("✓ Using Firebase credentials");
    } catch (error) {
      console.error("✗ Error initializing with credentials:", error);
      throw error;
    }
  } else {
    // Use emulator (local development)
    // Set emulator host if not already set (use environment variables or defaults)
    const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "localhost:8080";
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";

    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
    }

    initializeApp({
      projectId,
    });
    console.log("✓ Using Firebase emulator");
    console.log(`  Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    console.log(`  Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  }
}

const auth = getAuth();
const db = getFirestore();

// Configuration - use environment variables or defaults for development only
const SEED_CONFIG = {
  donorPassword: process.env.SEED_DONOR_PASSWORD || process.env.SEED_PASSWORD || "password123",
  hospitalPassword: process.env.SEED_HOSPITAL_PASSWORD || process.env.SEED_PASSWORD || "password123",
  adminPassword: process.env.SEED_ADMIN_PASSWORD || "admin123",
} as const;

// Blood groups
const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

// Sample data
const sampleDonors = [
  {
    email: "donor1@example.com",
    password: SEED_CONFIG.donorPassword,
    name: "John Smith",
    bloodGroup: "O+",
    location: { latitude: 40.7128, longitude: -74.0060 },
    address: "123 Main St, New York, NY 10001",
    totalDonations: 12,
    completedDonations: 10,
    lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    isActive: true,
    totalRequests: 15,
    acceptedRequests: 12,
    noShows: 1,
    avgResponseTimeMinutes: 15,
    pastAcceptanceRate: 0.8,
  },
  {
    email: "donor2@example.com",
    password: SEED_CONFIG.donorPassword,
    name: "Sarah Johnson",
    bloodGroup: "A+",
    location: { latitude: 40.7589, longitude: -73.9851 },
    address: "456 Park Ave, New York, NY 10002",
    totalDonations: 8,
    completedDonations: 7,
    lastDonationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    isActive: true,
    totalRequests: 10,
    acceptedRequests: 8,
    noShows: 0,
    avgResponseTimeMinutes: 20,
    pastAcceptanceRate: 0.9,
  },
  {
    email: "donor3@example.com",
    password: SEED_CONFIG.donorPassword,
    name: "Mike Davis",
    bloodGroup: "B+",
    location: { latitude: 40.7505, longitude: -73.9934 },
    address: "789 Broadway, New York, NY 10003",
    totalDonations: 5,
    completedDonations: 4,
    lastDonationDate: null, // Never donated
    isActive: true,
    totalRequests: 6,
    acceptedRequests: 5,
    noShows: 1,
    avgResponseTimeMinutes: 25,
    pastAcceptanceRate: 0.75,
  },
];

const sampleHospitals = [
  {
    email: "hospital1@example.com",
    password: SEED_CONFIG.hospitalPassword,
    name: "City General Hospital",
    location: { latitude: 40.7589, longitude: -73.9851 },
    address: "456 Medical Center Dr, New York, NY 10002",
    region: 1,
    phoneNumber: "+1-212-555-0100",
    isActive: true,
  },
  {
    email: "hospital2@example.com",
    password: SEED_CONFIG.hospitalPassword,
    name: "St. Mary's Medical Center",
    location: { latitude: 40.7505, longitude: -73.9934 },
    address: "789 Health Blvd, New York, NY 10003",
    region: 2,
    phoneNumber: "+1-212-555-0200",
    isActive: true,
  },
];

const sampleAdmins = [
  {
    email: "admin@veinlink.com",
    password: SEED_CONFIG.adminPassword,
    name: "System Administrator",
  },
];

const samplePatients = [
  {
    name: "John Smith",
    age: 45,
    bloodGroup: "O+",
    status: "Stable",
    admissionDate: new Date("2024-01-10"),
    notes: "Post-surgery recovery",
  },
  {
    name: "Jane Doe",
    age: 32,
    bloodGroup: "A-",
    status: "Critical",
    admissionDate: new Date("2024-01-14"),
    notes: "Emergency admission",
  },
  {
    name: "Bob Johnson",
    age: 60,
    bloodGroup: "AB+",
    status: "Stable",
    admissionDate: new Date("2024-01-05"),
    notes: "Regular treatment",
  },
];

async function seedUsers() {
  console.log("Seeding users...");

  // Generate 30 donors (10x of original 3)
  const generatedDonors = [];
  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const baseLocations = [
    { latitude: 40.7128, longitude: -74.0060 },
    { latitude: 40.7589, longitude: -73.9851 },
    { latitude: 40.7505, longitude: -73.9934 },
  ];

  for (let i = 0; i < 30; i++) {
    const baseLocation = baseLocations[i % baseLocations.length];
    generatedDonors.push({
      email: `donor${i + 1}@example.com`,
      password: SEED_CONFIG.donorPassword,
      name: `Donor ${i + 1}`,
      bloodGroup: bloodGroups[i % bloodGroups.length],
      location: {
        latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.1,
        longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.1,
      },
      address: `${100 + i} Main St, New York, NY 100${String(i + 1).padStart(2, '0')}`,
      totalDonations: Math.floor(Math.random() * 15) + 5,
      completedDonations: Math.floor(Math.random() * 12) + 4,
      lastDonationDate: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000) : null,
      isActive: true,
      totalRequests: Math.floor(Math.random() * 20) + 5,
      acceptedRequests: Math.floor(Math.random() * 15) + 5,
      noShows: Math.floor(Math.random() * 3),
      avgResponseTimeMinutes: Math.floor(Math.random() * 30) + 15,
      pastAcceptanceRate: 0.7 + Math.random() * 0.25,
    });
  }

  // Create donor users
  for (const donorData of generatedDonors) {
    try {
      const user = await auth.createUser({
        email: donorData.email,
        password: donorData.password,
        displayName: donorData.name,
      });

      // Create user profile
      await db.collection("users").doc(user.uid).set({
        email: donorData.email,
        name: donorData.name,
        role: "donor",
        createdAt: Timestamp.now(),
      });

      // Create donor profile
      await db.collection("donors").doc(user.uid).set({
        userId: user.uid,
        name: donorData.name,
        email: donorData.email,
        bloodGroup: donorData.bloodGroup,
        location: donorData.location,
        address: donorData.address,
        totalDonations: donorData.totalDonations,
        completedDonations: donorData.completedDonations,
        lastDonationDate: donorData.lastDonationDate ? Timestamp.fromDate(donorData.lastDonationDate) : null,
        isActive: donorData.isActive,
        totalRequests: donorData.totalRequests,
        acceptedRequests: donorData.acceptedRequests,
        noShows: donorData.noShows,
        avgResponseTimeMinutes: donorData.avgResponseTimeMinutes,
        pastAcceptanceRate: donorData.pastAcceptanceRate,
        createdAt: Timestamp.now(),
      });

      console.log(`✓ Created donor: ${donorData.email}`);
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        console.log(`⚠ User already exists: ${donorData.email}`);
      } else {
        console.error(`✗ Error creating donor ${donorData.email}:`, error.message);
      }
    }
  }

  // Generate 20 hospitals (10x of original 2)
  const generatedHospitals = [];
  const hospitalBaseLocations = [
    { latitude: 40.7589, longitude: -73.9851 },
    { latitude: 40.7505, longitude: -73.9934 },
  ];
  const hospitalNames = [
    "City General Hospital", "St. Mary's Medical Center", "Central Medical Center",
    "Northside Hospital", "Westside Medical", "Eastside Hospital", "Downtown Medical",
    "Uptown Hospital", "Riverside Medical", "Lakeside Hospital", "Parkview Hospital",
    "Memorial Hospital", "Community Medical", "Regional Hospital", "Metro Medical",
    "Sunset Hospital", "Sunrise Medical", "Pacific Hospital", "Atlantic Medical", "Coastal Hospital",
  ];

  for (let i = 0; i < 20; i++) {
    const baseLocation = hospitalBaseLocations[i % hospitalBaseLocations.length];
    generatedHospitals.push({
      email: `hospital${i + 1}@example.com`,
      password: SEED_CONFIG.hospitalPassword,
      name: hospitalNames[i],
      location: {
        latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.2,
        longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.2,
      },
      address: `${100 + i * 10} Medical Center Dr, New York, NY 100${String(i + 1).padStart(2, '0')}`,
      region: (i % 4) + 1,
      phoneNumber: `+1-212-555-${String(i + 1).padStart(4, '0')}`,
      isActive: true,
    });
  }

  // Create hospital users
  for (const hospitalData of generatedHospitals) {
    try {
      const user = await auth.createUser({
        email: hospitalData.email,
        password: hospitalData.password,
        displayName: hospitalData.name,
      });

      // Create user profile
      await db.collection("users").doc(user.uid).set({
        email: hospitalData.email,
        name: hospitalData.name,
        role: "hospital",
        createdAt: Timestamp.now(),
      });

      // Create hospital profile
      await db.collection("hospitals").doc(user.uid).set({
        userId: user.uid,
        name: hospitalData.name,
        email: hospitalData.email,
        location: hospitalData.location,
        address: hospitalData.address,
        region: hospitalData.region,
        phoneNumber: hospitalData.phoneNumber,
        isActive: hospitalData.isActive,
        createdAt: Timestamp.now(),
      });

      console.log(`✓ Created hospital: ${hospitalData.email}`);
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        console.log(`⚠ User already exists: ${hospitalData.email}`);
      } else {
        console.error(`✗ Error creating hospital ${hospitalData.email}:`, error.message);
      }
    }
  }

  // Create admin users
  for (const adminData of sampleAdmins) {
    try {
      const user = await auth.createUser({
        email: adminData.email,
        password: adminData.password,
        displayName: adminData.name,
      });

      // Create user profile
      await db.collection("users").doc(user.uid).set({
        email: adminData.email,
        name: adminData.name,
        role: "admin",
        createdAt: Timestamp.now(),
      });

      console.log(`✓ Created admin: ${adminData.email}`);
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        console.log(`⚠ User already exists: ${adminData.email}`);
      } else {
        console.error(`✗ Error creating admin ${adminData.email}:`, error.message);
      }
    }
  }
}

async function seedDonationRequests() {
  console.log("Seeding donation requests (10x scale)...");

  // Get hospital IDs (up to 20)
  const hospitalsSnapshot = await db.collection("hospitals").limit(20).get();
  const hospitalIds = hospitalsSnapshot.docs.map(doc => doc.id);

  if (hospitalIds.length === 0) {
    console.log("⚠ No hospitals found. Please seed users first.");
    return;
  }

  // Generate 30 requests (10x of original 3)
  const urgencyLevels = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const statuses = ["PENDING", "PENDING", "PENDING", "FULFILLED"]; // 75% pending, 25% fulfilled
  const requests = [];

  for (let i = 0; i < 30; i++) {
    const hospitalId = hospitalIds[i % hospitalIds.length];
    const isFulfilled = statuses[i % statuses.length] === "FULFILLED";
    const daysOffset = isFulfilled ? -Math.floor(Math.random() * 10) - 1 : Math.floor(Math.random() * 10) + 1;

    requests.push({
      hospitalId,
      bloodGroup: bloodGroups[i % bloodGroups.length],
      quantity: Math.floor(Math.random() * 4) + 1,
      urgency: urgencyLevels[i % urgencyLevels.length],
      status: statuses[i % statuses.length],
      dueDate: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000),
      notes: isFulfilled ? "Completed donation request" : `Emergency requirement #${i + 1}`,
      fulfilledAt: isFulfilled ? new Date(Date.now() + (daysOffset + 2) * 24 * 60 * 60 * 1000) : undefined,
    });
  }

  for (const requestData of requests) {
    const requestRef = db.collection("donation_requests").doc();
    await requestRef.set({
      ...requestData,
      createdBy: requestData.hospitalId,
      createdAt: Timestamp.now(),
      dueDate: Timestamp.fromDate(requestData.dueDate),
      fulfilledAt: requestData.fulfilledAt ? Timestamp.fromDate(requestData.fulfilledAt) : null,
    });
    console.log(`✓ Created request: ${requestRef.id}`);
  }
}

async function seedPatients() {
  console.log("Seeding patients (10x scale)...");

  // Get hospital IDs (up to 20)
  const hospitalsSnapshot = await db.collection("hospitals").limit(20).get();
  const hospitalIds = hospitalsSnapshot.docs.map(doc => doc.id);

  if (hospitalIds.length === 0) {
    console.log("⚠ No hospitals found. Please seed users first.");
    return;
  }

  // Generate 30 patients (10x of original 3)
  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const statuses = ["Stable", "Critical", "Stable", "Stable", "Recovering"];
  const notesTemplates = [
    "Post-surgery recovery",
    "Emergency admission",
    "Regular treatment",
    "Blood transfusion required",
    "Monitoring patient",
    "Pre-operative care",
  ];

  for (let i = 0; i < 30; i++) {
    const hospitalId = hospitalIds[i % hospitalIds.length];
    const patient = {
      name: `Patient ${i + 1}`,
      age: Math.floor(Math.random() * 60) + 20,
      bloodGroup: bloodGroups[i % bloodGroups.length],
      status: statuses[i % statuses.length],
      admissionDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      notes: notesTemplates[i % notesTemplates.length],
    };

    const patientRef = db.collection("patients").doc();
    await patientRef.set({
      hospitalId,
      name: patient.name,
      age: patient.age,
      bloodGroup: patient.bloodGroup,
      status: patient.status,
      admissionDate: Timestamp.fromDate(patient.admissionDate),
      notes: patient.notes,
      createdAt: Timestamp.now(),
    });
    console.log(`✓ Created patient: ${patient.name}`);
  }
}

async function seedDonationHistory() {
  console.log("Seeding donation history (10x scale)...");

  // Get donor IDs (up to 30)
  const donorsSnapshot = await db.collection("donors").limit(30).get();
  const donorIds = donorsSnapshot.docs.map(doc => doc.id);

  // Get hospital IDs (up to 20)
  const hospitalsSnapshot = await db.collection("hospitals").limit(20).get();
  const hospitalIds = hospitalsSnapshot.docs.map(doc => doc.id);
  const hospitalNames = hospitalsSnapshot.docs.map(doc => doc.data().name);

  if (donorIds.length === 0 || hospitalIds.length === 0) {
    console.log("⚠ No donors or hospitals found. Please seed users first.");
    return;
  }

  // Generate 50 history entries (10x of original 5)
  const historyEntries = [];
  for (let i = 0; i < 50; i++) {
    const donorId = donorIds[i % donorIds.length];
    const hospitalIndex = Math.floor(Math.random() * hospitalIds.length);
    const daysAgo = Math.floor(Math.random() * 365); // Random date in last year

    historyEntries.push({
      donorId,
      hospitalId: hospitalIds[hospitalIndex],
      hospitalName: hospitalNames[hospitalIndex],
      amount: 450,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    });
  }

  for (const entry of historyEntries) {
    const historyRef = db.collection("donation_history").doc();
    await historyRef.set({
      ...entry,
      createdAt: Timestamp.now(),
      donationDate: Timestamp.fromDate(entry.date),
    });
    console.log(`✓ Created donation history entry for donor ${entry.donorId.substring(0, 8)}...`);
  }
}

async function main() {
  console.log("🌱 Starting Firebase seed...\n");

  try {
    await seedUsers();
    console.log();
    await seedDonationRequests();
    console.log();
    await seedPatients();
    console.log();
    await seedDonationHistory();
    console.log();
    console.log("✅ Seed completed successfully!");
    console.log("\nYou can now login with:");
    console.log("Donors: donor1@example.com through donor30@example.com");
    console.log("Hospitals: hospital1@example.com through hospital20@example.com");
    console.log("Admin: admin@veinlink.com");
    console.log("\nPasswords:");
    console.log(`  - Donors & Hospitals: ${SEED_CONFIG.donorPassword}`);
    console.log(`  - Admin: ${SEED_CONFIG.adminPassword}`);
    console.log("\nNote: Set SEED_PASSWORD, SEED_DONOR_PASSWORD, SEED_HOSPITAL_PASSWORD, or SEED_ADMIN_PASSWORD");
    console.log("      environment variables to use custom passwords.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();
