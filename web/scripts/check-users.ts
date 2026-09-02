/**
 * Check Users Script
 * Lists all users and their roles from Firestore.
 * 
 * Run with: npx tsx web/scripts/check-users.ts
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
        process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
        initializeApp({ projectId });
    }
}

const db = getFirestore();

async function checkUsers() {
    console.log("🔍 Checking Users Collection...");

    const snapshot = await db.collection("users").get();

    if (snapshot.empty) {
        console.log("❌ No users found in 'users' collection.");
        return;
    }

    console.log(`Found ${snapshot.size} users. Searching for admin...`);

    let adminFound = false;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === 'admin' || data.email?.includes('admin')) {
            console.log(`✅ ADMIN FOUND: ID=${doc.id}, Email=${data.email}, Role=${data.role}`);
            adminFound = true;
        }
    });

    if (!adminFound) {
        console.log("❌ NO ADMIN USER FOUND.");
    }
}

checkUsers().catch(console.error);
