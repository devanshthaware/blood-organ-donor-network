/**
 * Check Audit Logs
 * Dumps recent audit logs to check for Function errors.
 * 
 * Run with: npx tsx web/scripts/check-logs.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "veinlink-cf53";
    if (process.env.FIREBASE_CLIENT_EMAIL) {
        initializeApp({
            credential: cert({
                projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
        });
    } else {
        process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
        initializeApp({ projectId });
    }
}

const db = getFirestore();

async function checkLogs() {
    console.log("🔍 Checking Recent Audit Logs...");

    // Get recent logs
    const snapshots = await db.collection("audit_logs")
        .orderBy("timestamp", "desc")
        .limit(5)
        .get();

    if (snapshots.empty) {
        console.log("❌ No audit logs found.");
        return;
    }

    snapshots.forEach(doc => {
        const data = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`Action: ${data.action}`);
        console.log(`Result: ${data.result}`);
        console.log(`Error: ${data.errorMessage}`);
        console.log(`Timestamp: ${data.timestamp?.toDate()}`);
    });
}

checkLogs().catch(console.error);
