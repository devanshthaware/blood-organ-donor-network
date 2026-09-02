
/**
 * Seed Audit Logs Script
 * Generates mock audit logs for development and testing.
 * 
 * Run with: npx tsx scripts/seed-audit-logs.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "veinlink-cf53";
    if (process.env.FIREBASE_CLIENT_EMAIL) {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    } else {
        process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
        process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
        initializeApp({ projectId });
    }
}

const db = getFirestore();

const ACTIONS = [
    "USER_LOGIN", "USER_LOGOUT", "PROFILE_UPDATE",
    "REQUEST_CREATED", "REQUEST_UPDATED", "REQUEST_FULFILLED",
    "DONOR_MATCHED", "RESERVATION_CREATED", "RESERVATION_CONFIRMED",
    "SYSTEM_ALERT", "SETTINGS_CHANGED"
];

const RESOURCES = [
    "user", "donation_request", "reservation", "hospital", "donor", "system"
];

async function seedAuditLogs() {
    console.log("📜 Seeding Audit Logs...");

    // Fetch some existing users to attribute logs to
    const usersSnapshot = await db.collection("users").limit(10).get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (users.length === 0) {
        console.log("⚠ No users found. Generating generic logs.");
    }

    const logs = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
        const user = users.length > 0 ? users[Math.floor(Math.random() * users.length)] : { id: "system", email: "system@veinlink.com" };
        const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        const resourceType = RESOURCES[Math.floor(Math.random() * RESOURCES.length)];
        const isError = Math.random() > 0.9; // 10% error rate

        // Random time in the last 7 days
        const timeOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
        const timestamp = Timestamp.fromMillis(now - timeOffset);

        logs.push({
            userId: user.id || "unknown",
            userEmail: user.email || "unknown@veinlink.com",
            action: action,
            resourceType: resourceType,
            resourceId: `res_${Math.random().toString(36).substring(7)}`,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            timestamp: timestamp,
            result: isError ? "FAILURE" : "SUCCESS",
            details: {
                browser: "Chrome 120.0.0",
                os: "Windows 10",
                userAgent: "Mozilla/5.0...",
                method: "POST"
            },
            errorMessage: isError ? "Permission denied or network timeout" : null
        });
    }

    // Sort logs by timestamp (newest first for better display logic, though DB rules differ)
    logs.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

    const batch = db.batch();
    logs.forEach(log => {
        const ref = db.collection("audit_logs").doc();
        batch.set(ref, log);
    });

    await batch.commit();
    console.log(`✅ Successfully created ${logs.length} audit logs.`);
}

seedAuditLogs().catch(console.error);
