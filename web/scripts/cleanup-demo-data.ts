/**
 * Cleanup Script: Remove Demo Data from Firestore
 * 
 * This script permanently removes all demo/test data from the database:
 * - Hospitals with "New York" in address or demo hospital IDs
 * - Donation requests from demo hospitals
 * - Reservations linked to demo requests
 * - Seed hospitals and requests
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Initialize Firebase Admin
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error("FIREBASE_PROJECT_ID not set in environment variables");
  process.exit(1);
}

// For emulator, use default credentials
if (process.env.FIREBASE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIREBASE_EMULATOR_HOST;
}

let app;
try {
  app = initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} catch (error: any) {
  if (error.code === "app/already-exists") {
    app = initializeApp();
  } else {
    throw error;
  }
}

const db = getFirestore(app);

async function cleanupDemoData() {
  console.log("🧹 Starting cleanup of demo data...\n");

  try {
    // 1. Find and delete demo hospitals
    console.log("1. Cleaning up demo hospitals...");
    const hospitalsSnapshot = await db.collection("hospitals").get();
    let deletedHospitals = 0;
    
    for (const doc of hospitalsSnapshot.docs) {
      const data = doc.data();
      const hospitalId = doc.id;
      const address = data.address || "";
      const name = data.name || "";
      
      // Check if it's a demo hospital
      const isDemoHospital = 
        hospitalId.startsWith("demo_") ||
        hospitalId.startsWith("seed_") ||
        address.includes("New York") ||
        address.includes("NY 100") ||
        name.includes("Demo") ||
        name.includes("Seed") ||
        (data.email && data.email.includes("@demo")) ||
        (data.email && data.email.includes("@veinlink.demo"));
      
      if (isDemoHospital) {
        console.log(`   Deleting demo hospital: ${hospitalId} (${name})`);
        await doc.ref.delete();
        deletedHospitals++;
        
        // Also delete from users collection
        const userRef = db.collection("users").doc(hospitalId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          await userRef.delete();
        }
      }
    }
    console.log(`   ✓ Deleted ${deletedHospitals} demo hospitals\n`);

    // 2. Find and delete donation requests from demo hospitals
    console.log("2. Cleaning up demo donation requests...");
    const requestsSnapshot = await db.collection("donation_requests").get();
    let deletedRequests = 0;
    const demoHospitalIds = new Set<string>();
    
    // Get all demo hospital IDs
    const allHospitals = await db.collection("hospitals").get();
    for (const doc of allHospitals.docs) {
      const data = doc.data();
      const address = data.address || "";
      if (address.includes("New York") || address.includes("NY 100") || 
          doc.id.startsWith("demo_") || doc.id.startsWith("seed_")) {
        demoHospitalIds.add(doc.id);
      }
    }
    
    for (const doc of requestsSnapshot.docs) {
      const data = doc.data();
      const requestId = doc.id;
      const hospitalId = data.hospitalId;
      
      if (demoHospitalIds.has(hospitalId) || requestId.startsWith("seed_") || requestId.startsWith("demo_")) {
        console.log(`   Deleting demo request: ${requestId}`);
        await doc.ref.delete();
        deletedRequests++;
      }
    }
    console.log(`   ✓ Deleted ${deletedRequests} demo requests\n`);

    // 3. Delete reservations linked to deleted requests
    console.log("3. Cleaning up demo reservations...");
    const reservationsSnapshot = await db.collection("reservations").get();
    let deletedReservations = 0;
    
    for (const doc of reservationsSnapshot.docs) {
      const data = doc.data();
      const requestId = data.requestId;
      
      // Check if the linked request was deleted (or is a demo request)
      if (requestId && (requestId.startsWith("seed_") || requestId.startsWith("demo_"))) {
        console.log(`   Deleting demo reservation: ${doc.id}`);
        await doc.ref.delete();
        deletedReservations++;
      }
    }
    console.log(`   ✓ Deleted ${deletedReservations} demo reservations\n`);

    // 4. Delete ML outputs for deleted reservations
    console.log("4. Cleaning up demo ML outputs...");
    const mlOutputsSnapshot = await db.collection("ml_outputs").get();
    let deletedMLOutputs = 0;
    
    for (const doc of mlOutputsSnapshot.docs) {
      const data = doc.data();
      const reservationId = data.reservationId;
      
      if (reservationId && (reservationId.startsWith("seed_") || reservationId.startsWith("demo_"))) {
        console.log(`   Deleting demo ML output: ${doc.id}`);
        await doc.ref.delete();
        deletedMLOutputs++;
      }
    }
    console.log(`   ✓ Deleted ${deletedMLOutputs} demo ML outputs\n`);

    console.log("✅ Cleanup complete!");
    console.log(`\nSummary:`);
    console.log(`- Hospitals deleted: ${deletedHospitals}`);
    console.log(`- Requests deleted: ${deletedRequests}`);
    console.log(`- Reservations deleted: ${deletedReservations}`);
    console.log(`- ML outputs deleted: ${deletedMLOutputs}`);
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

// Run cleanup
cleanupDemoData()
  .then(() => {
    console.log("\n✨ Cleanup script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Cleanup script failed:", error);
    process.exit(1);
  });
