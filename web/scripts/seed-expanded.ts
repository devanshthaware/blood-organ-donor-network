/**
 * Expanded Firebase Seed Script (10x Scale)
 * 
 * Generates:
 * - 30 Donors (Varied locations, blood groups, reliability)
 * - 5 Hospitals (Distributed)
 * - 30 Patients
 * - 10 Donation Requests (to trigger ML)
 * 
 * Run with: npx tsx scripts/seed-expanded.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase
if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "veinlink-cf53";

    // Check for credentials or use emulator
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
        });
    } else {
        process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";
        process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
        initializeApp({ projectId });
    }
}

const auth = getAuth();
const db = getFirestore();

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const NYC_CENTER = { lat: 40.7128, lon: -74.0060 };

// Helpers
function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomLocation(center: { lat: number, lon: number }, radiusKm: number) {
    const r = radiusKm / 111.32; // Rough conversion
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    // Adjust for longitude shrinking
    const newLat = center.lat + y;
    const newLon = center.lon + x / Math.cos(center.lat * Math.PI / 180);
    return { latitude: newLat, longitude: newLon };
}

async function seedHospitals() {
    console.log("🏥 Seeding 50 Hospitals...");
    const hospitals = [];
    for (let i = 1; i <= 50; i++) {
        const email = `hospital_expand_${i}@veinlink.demo`;
        const name = `General Hospital ${String.fromCharCode(64 + i)}`; // Hospital A, B, C...
        const loc = randomLocation(NYC_CENTER, 10);

        try {
            // Create Auth
            let uid;
            try {
                const user = await auth.createUser({ email, password: "password123", displayName: name });
                uid = user.uid;
            } catch (e: any) {
                if (e.code === 'auth/email-already-exists') {
                    const user = await auth.getUserByEmail(email);
                    uid = user.uid;
                } else throw e;
            }

            // Create Firestore
            await db.collection("users").doc(uid).set({
                email, name, role: "hospital", createdAt: FieldValue.serverTimestamp()
            }, { merge: true });

            await db.collection("hospitals").doc(uid).set({
                userId: uid,
                name,
                email,
                location: loc,
                address: `${Math.floor(Math.random() * 1000)} Hospital Ave`,
                region: Math.floor(Math.random() * 3),
                phoneNumber: "+1-555-000-" + String(i).padStart(4, '0'),
                isActive: true,
                createdAt: FieldValue.serverTimestamp()
            }, { merge: true });

            hospitals.push(uid);
            console.log(`   ✓ ${name}`);
        } catch (e) {
            console.error(`   ✗ Failed ${name}:`, e);
        }
    }
    return hospitals;
}

async function seedDonors() {
    console.log("🩸 Seeding 300 Donors...");
    for (let i = 1; i <= 300; i++) {
        const email = `donor_expand_${i}@veinlink.demo`;
        const name = `Donor User ${i}`;
        const bloodGroup = randomElement(BLOOD_GROUPS);
        const loc = randomLocation(NYC_CENTER, 15); // Donors spread wider
        const reliability = Math.random(); // 0.0 to 1.0

        try {
            let uid;
            try {
                const user = await auth.createUser({ email, password: "password123", displayName: name });
                uid = user.uid;
            } catch (e: any) {
                if (e.code === 'auth/email-already-exists') {
                    const user = await auth.getUserByEmail(email);
                    uid = user.uid;
                } else throw e;
            }

            await db.collection("users").doc(uid).set({
                email, name, role: "donor", createdAt: FieldValue.serverTimestamp()
            }, { merge: true });

            await db.collection("donors").doc(uid).set({
                userId: uid,
                name,
                email,
                bloodGroup,
                location: loc,
                address: `${Math.floor(Math.random() * 5000)} Residential St`,
                isActive: true,
                totalRequests: Math.floor(Math.random() * 20),
                acceptedRequests: Math.floor(Math.random() * 15),
                // reliability score logic for ML
                reliabilityScore: reliability,
                lastDonationDate: Math.random() > 0.3 ? Timestamp.fromDate(new Date(Date.now() - Math.random() * 100 * 24 * 60 * 60 * 1000)) : null,
                createdAt: FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            // ignore
        }
        if (i % 5 === 0) process.stdout.write(".");
    }
    console.log("\n   ✓ Donors seeded.");
}

async function seedRequests(hospitalIds: string[]) {
    console.log("🚑 Seeding 100 Requests to trigger ML...");
    if (hospitalIds.length === 0) return;

    for (let i = 1; i <= 100; i++) {
        const hospitalId = randomElement(hospitalIds);
        const bloodGroup = randomElement(BLOOD_GROUPS);
        const ref = db.collection("donation_requests").doc();

        await ref.set({
            hospitalId,
            bloodGroup,
            quantity: Math.floor(Math.random() * 4) + 1,
            urgency: randomElement(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
            status: "PENDING",
            createdAt: FieldValue.serverTimestamp(),
            createdBy: hospitalId,
        });
        console.log(`   ✓ Request ${ref.id} (${bloodGroup})`);
    }
}

async function main() {
    console.log("🚀 Starting 10x Seed Expansion (300 donors, 50 hospitals, 100 requests)...");
    const hospitalIds = await seedHospitals();
    await seedDonors();
    await seedRequests(hospitalIds);
    console.log("✅ Seed Expansion Complete.");
    process.exit(0);
}

main().catch(console.error);
