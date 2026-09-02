/**
 * Verification Script
 * Checks if ML pipeline triggered for recent requests.
 * 
 * Run with: npx tsx web/scripts/verify-backend.ts
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

async function verify() {
    console.log("🔍 Verifying ML Pipeline Execution...");

    // 1. Get recent requests
    const snapshots = await db.collection("donation_requests")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

    if (snapshots.empty) {
        console.log("❌ No requests found.");
        return;
    }

    let successCount = 0;

    for (const doc of snapshots.docs) {
        const requestId = doc.id;
        console.log(`\nChecking Request: ${requestId}`);

        // 2. Check Demand Forecast
        const demandDoc = await db.collection("ml_outputs").doc(`demand_${requestId}`).get();
        if (demandDoc.exists) {
            console.log("   ✅ Demand Forecast Generated");
            const data = demandDoc.data();
            console.log(`      Payload: ${JSON.stringify(data?.output)}`);
        } else {
            console.log("   ❌ Missing Demand Forecast (Function trigger fail?)");
        }

        // 3. Check Reservations (Matching)
        const resSnap = await db.collection("reservations")
            .where("requestId", "==", requestId)
            .get();

        if (!resSnap.empty) {
            console.log(`   ✅ ${resSnap.size} Reservations Created (Matching worked)`);
            successCount++;
        } else {
            console.log("   ⚠️ No Reservations (Could be valid if no donors matched, OR function fail)");
        }
    }

    console.log(`\nSUMMARY: Found ML activity for ${successCount}/${snapshots.size} recent requests.`);
}

verify().catch(console.error);
