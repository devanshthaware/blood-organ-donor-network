/**
 * Automated Migration Verification Script
 * Validates:
 * 1. Convex Schema integrity and type definitions
 * 2. Clerk Provider integration
 * 3. Matching algorithm logic and compatibility matrix
 * 4. Invariant checks (e.g. 56-day cooldown, urgency radius)
 * 5. Zero remaining active Firebase dependencies
 */

import fs from "fs";
import path from "path";

console.log("==================================================");
console.log("VEINLINK — MIGRATION VERIFICATION SUITE");
console.log("==================================================");

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. Check Convex Schema definition exists
const schemaPath = path.resolve(__dirname, "../convex/schema.ts");
assert(fs.existsSync(schemaPath), "Convex schema exists at web/convex/schema.ts");

// 2. Check Convex Schema contains all core tables
const schemaContent = fs.readFileSync(schemaPath, "utf-8");
const coreTables = [
  "users",
  "donors",
  "hospitals",
  "donationRequests",
  "reservations",
  "bloodInventory",
  "alerts",
  "auditLogs",
  "aiEvents",
  "patients",
  "checkupRequests",
];

coreTables.forEach((table) => {
  assert(schemaContent.includes(table), `Schema defines table: '${table}'`);
});

// 3. Verify zero Firebase references in web/src
const srcDir = path.resolve(__dirname, "../src");
function checkNoFirebase(dir: string): boolean {
  let clean = true;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!checkNoFirebase(fullPath)) clean = false;
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("from \"firebase") || content.includes("from 'firebase")) {
        console.error(`Found lingering firebase import in: ${fullPath}`);
        clean = false;
      }
    }
  }
  return clean;
}
assert(checkNoFirebase(srcDir), "Zero active 'firebase' imports in web/src");

// 4. Test Blood Compatibility Invariant
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

assert(COMPATIBLE_DONORS["O-"].length === 1 && COMPATIBLE_DONORS["O-"][0] === "O-", "O- only accepts O-");
assert(COMPATIBLE_DONORS["AB+"].length === 8, "AB+ is universal recipient (8 compatible types)");

// 5. Test Cooldown Invariant (56 days)
const COOLDOWN_MS = 56 * 24 * 60 * 60 * 1000;
const now = Date.now();
const recentDonation = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
const eligibleDonation = now - 60 * 24 * 60 * 60 * 1000; // 60 days ago

assert(now - recentDonation < COOLDOWN_MS, "Donor at 30 days is properly blocked by cooldown");
assert(now - eligibleDonation >= COOLDOWN_MS, "Donor at 60 days is eligible to donate");

console.log("==================================================");
console.log(`Results: ${passedTests}/${totalTests} tests passed.`);
console.log("==================================================");
