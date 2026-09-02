/**
 * Seed data script for demonstrating real-time blood shortage prediction
 * 
 * This script creates:
 * - Blood inventory data (supply by region, blood group, date)
 * - Historical demand patterns
 * - Multiple scenarios (shortage and non-shortage)
 * - Hospitals in different regions
 * 
 * Run with: npm run seed:shortage
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

// Current date
const now = new Date();
const currentMonth = now.getMonth() + 1; // 1-12
const currentDay = now.getDate();

// Blood groups
const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

// Regions (40 regions - 10x of original 4)
const REGIONS = (() => {
  const regions = [];
  const baseRegions = [
    { name: "North Region", area: "North Zone" },
    { name: "South Region", area: "South Zone" },
    { name: "East Region", area: "East Zone" },
    { name: "West Region", area: "West Zone" },
  ];
  for (let i = 0; i < 40; i++) {
    const base = baseRegions[i % baseRegions.length];
    regions.push({
      id: i + 1,
      name: `${base.name} ${Math.floor(i / 4) + 1}`,
      area: `${base.area} ${Math.floor(i / 4) + 1}`,
    });
  }
  return regions;
})();

// Scenarios: Generate 80 scenarios (10x of original 8)
const SHORTAGE_SCENARIOS = (() => {
  const scenarios = [];
  const baseScenarios = [
    { bloodGroup: "O+", supply: 15, demand: 45, severity: "CRITICAL" },
    { bloodGroup: "A+", supply: 20, demand: 60, severity: "HIGH" },
    { bloodGroup: "B+", supply: 8, demand: 35, severity: "CRITICAL" },
    { bloodGroup: "O-", supply: 5, demand: 25, severity: "CRITICAL" },
    { bloodGroup: "AB+", supply: 30, demand: 50, severity: "MEDIUM" },
    { bloodGroup: "A-", supply: 25, demand: 40, severity: "MEDIUM" },
    { bloodGroup: "O+", supply: 80, demand: 30, severity: "LOW" },
    { bloodGroup: "A+", supply: 65, demand: 25, severity: "LOW" },
  ];
  
  for (let i = 0; i < 80; i++) {
    const base = baseScenarios[i % baseScenarios.length];
    scenarios.push({
      bloodGroup: base.bloodGroup,
      region: (i % REGIONS.length) + 1,
      supply: Math.floor(base.supply * (0.8 + Math.random() * 0.4)),
      demand: Math.floor(base.demand * (0.8 + Math.random() * 0.4)),
      severity: base.severity,
    });
  }
  return scenarios;
})();

async function seedData() {
  console.log("🌱 Starting shortage prediction seed data generation (10x scale)...\n");

  try {
    // 1. Create Hospitals in different regions (40 hospitals)
    console.log(`1. Creating ${REGIONS.length} hospitals...`);
    const hospitalIds: string[] = [];
    for (const region of REGIONS) {
      const hospitalId = `seed_hospital_region_${region.id}`;
      hospitalIds.push(hospitalId);
      
      const hospitalRef = db.collection("hospitals").doc(hospitalId);
      await hospitalRef.set({
        userId: hospitalId,
        name: `${region.name} Medical Center`,
        location: {
          latitude: 40.7128 + (region.id * 0.1),
          longitude: -74.0060 + (region.id * 0.1),
        },
        address: `${region.name} Medical Center, ${region.area}`,
        region: region.id,
        isActive: true,
        phoneNumber: `+1-212-555-${String(region.id).padStart(4, "0")}`,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Create user for hospital
      const hospitalUserRef = db.collection("users").doc(hospitalId);
      await hospitalUserRef.set({
        email: `hospital${region.id}@veinlink.demo`,
        role: "hospital",
        displayName: `${region.name} Medical Center`,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`   ✓ ${region.name} Medical Center created (Region ${region.id})`);
    }
    console.log("");

    // 2. Create Blood Inventory Data
    console.log("2. Creating blood inventory data...");
    for (const scenario of SHORTAGE_SCENARIOS) {
      const inventoryId = `inventory_${scenario.bloodGroup}_region_${scenario.region}`;
      const inventoryRef = db.collection("blood_inventory").doc(inventoryId);
      
      await inventoryRef.set({
        bloodGroup: scenario.bloodGroup,
        region: scenario.region,
        supplyUnits: scenario.supply,
        demandUnits: scenario.demand,
        lastUpdated: FieldValue.serverTimestamp(),
        month: currentMonth,
        day: currentDay,
        // Historical data for trend analysis
        historicalDemand: [
          scenario.demand * 0.8, // 3 days ago
          scenario.demand * 0.9, // 2 days ago
          scenario.demand * 0.95, // 1 day ago
          scenario.demand, // today
        ],
        historicalSupply: [
          scenario.supply + 5, // 3 days ago
          scenario.supply + 3, // 2 days ago
          scenario.supply + 1, // 1 day ago
          scenario.supply, // today (decreasing)
        ],
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`   ✓ ${scenario.bloodGroup} in Region ${scenario.region}: Supply=${scenario.supply}, Demand=${scenario.demand} (${scenario.severity} risk)`);
    }
    console.log("");

    // 3. Create Historical Demand Patterns (for ML training context)
    console.log("3. Creating historical demand patterns...");
    const historicalDays = 300; // Last 300 days (10x of original 30)
    for (let dayOffset = 0; dayOffset < historicalDays; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      const histMonth = date.getMonth() + 1;
      const histDay = date.getDate();

      for (const scenario of SHORTAGE_SCENARIOS) {
        // Vary demand based on day of week and historical patterns
        const dayOfWeek = date.getDay();
        const demandMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0; // Lower on weekends
        const historicalDemand = Math.floor(scenario.demand * demandMultiplier * (0.8 + Math.random() * 0.4));
        const historicalSupply = Math.floor(scenario.supply * (0.9 + Math.random() * 0.2));

        const historyId = `demand_history_${scenario.bloodGroup}_region_${scenario.region}_${date.toISOString().split('T')[0]}`;
        const historyRef = db.collection("demand_history").doc(historyId);
        
        await historyRef.set({
          bloodGroup: scenario.bloodGroup,
          region: scenario.region,
          demandUnits: historicalDemand,
          supplyUnits: historicalSupply,
          month: histMonth,
          day: histDay,
          date: date,
          shortageRisk: historicalDemand > historicalSupply * 1.5 ? "HIGH" : 
                       historicalDemand > historicalSupply * 1.2 ? "MEDIUM" : "LOW",
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }
    console.log(`   ✓ Created ${historicalDays} days of historical demand patterns\n`);

    // 4. Create Active Donation Requests (to trigger predictions)
    console.log("4. Creating active donation requests...");
    let requestCount = 0;
    for (const scenario of SHORTAGE_SCENARIOS) {
      if (scenario.severity === "CRITICAL" || scenario.severity === "HIGH") {
        const hospitalId = `seed_hospital_region_${scenario.region}`;
        const requestId = `seed_request_${scenario.bloodGroup}_region_${scenario.region}`;
        const requestRef = db.collection("donation_requests").doc(requestId);
        
        await requestRef.set({
          hospitalId,
          bloodGroup: scenario.bloodGroup,
          quantity: Math.ceil(scenario.demand * 0.3), // Request 30% of demand
          urgency: scenario.severity,
          status: "PENDING",
          region: scenario.region,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: hospitalId,
        }, { merge: true });
        
        requestCount++;
        console.log(`   ✓ Request created: ${scenario.bloodGroup} in Region ${scenario.region} (${scenario.severity})`);
      }
    }
    console.log(`\n   ✓ Created ${requestCount} active requests\n`);

    console.log("✅ Seed data generation complete!\n");
    console.log("📊 Summary:");
    console.log(`   - Hospitals: ${REGIONS.length} (across ${REGIONS.length} regions)`);
    console.log(`   - Blood Inventory Records: ${SHORTAGE_SCENARIOS.length}`);
    console.log(`   - Historical Demand Records: ${historicalDays * SHORTAGE_SCENARIOS.length}`);
    console.log(`   - Active Requests: ${requestCount}`);
    console.log("\n💡 Next Steps:");
    console.log("   1. Firebase Functions will automatically trigger shortage predictions");
    console.log("   2. Navigate to Hospital → Alerts page");
    console.log("   3. You should see ML-generated shortage alerts in real-time");
    console.log("   4. Try updating inventory supply/demand to see alerts update\n");

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
