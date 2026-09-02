# GAP_ANALYSIS.md — Comprehensive Domain & Capabilities Gap Analysis

## 1. Executive Summary
The existing **VeinLink** codebase is a blood-donation-specific MVP built around Firebase and Firestore. The hackathon objective requires evolving this platform into a comprehensive **Blood & Organ Donor Network**.

This document audits what currently exists for the Blood domain, conducts an exhaustive gap analysis for the Organ domain, identifies core domain model conflicts, and categorizes technical debt and module reusability.

---

## 2. Blood Domain Audit (What Currently Exists)

### 2.1 Donors
- **Registration & Profile:** Implemented in `web/src/app/register/donor/page.tsx` and `web/src/app/donor/profile/page.tsx`. Stores name, phone, blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- **Availability:** Simple boolean toggle `isActive` and day/slot schedule preferences.
- **Health Status:** Basic field (`FIT`, `UNFIT`, `TEMPORARILY_UNAVAILABLE`).
- **Donation History:** Implemented in `useDonationHistory.ts` and `/donor/history`.
- **Cooldown Period:** 56-day cooldown enforced in matching engine (`functions/src/index.ts:605` checks `lastDonationDate <= now - 56 days`).

### 2.2 Blood Inventory
- **Model:** Tracked in `blood_inventory` by `hospitalId` and `bloodType`.
- **Status & Thresholds:** Tracks `unitsAvailable`, `minimumThreshold`, and `optimalThreshold`.
- **Deficiencies:** No batch/bag tracking, no barcode/QR code verification, no expiration tracking (blood units expire in 35–42 days depending on anticoagulant; platelets in 5 days).

### 2.3 Blood Requests
- **Model:** Hospital creates requests with `bloodType`, `unitsRequested`, and `urgency`.
- **Urgency Radius Stratification:** Dynamically expands search distance (`CRITICAL` = 100km, `HIGH` = 50km, `MEDIUM` = 75km, `LOW` = 100km).
- **Fulfillment:** Tracks `fulfilledUnits` vs `unitsRequested`.

### 2.4 Matching Engine Verification
Evidence found in `functions/src/index.ts` lines 580–840:
- ✅ **ABO/Rh Compatibility:** Enforced via `COMPATIBLE_DONORS` lookup table.
- ✅ **Active Status:** `isActive == true` filtered in query.
- ✅ **56-Day Cooldown:** Verified against `lastDonationDate`.
- ✅ **Health Status:** `healthStatus == "FIT"` verified.
- ✅ **Distance Calculation:** Haversine formula implemented in `functions/src/index.ts` and `web/src/lib/distance-utils.ts`.
- ✅ **Predictive ML Scores:** Calls `/predict/availability` and `/predict/reliability`.
- ✅ **Combined Scoring:** `(0.5 * availability) + (0.5 * reliability) - (distance_km / 100 * 0.1)`.
- ✅ **Top-N Selection:** Candidates sorted descending by score; top 5 selected.
- ✅ **Deterministic Fallback:** If ML fails, falls back to heuristic score based on distance and cooldown days.

---

## 3. Organ Domain Gap Analysis (What is Completely Missing)

| Clinical & Operational Dimension | Blood Domain (VeinLink MVP) | Organ Domain Requirement | Severity / Gap Level |
|---|---|---|---|
| **Donor Nature** | Living, recurring whole blood donor | Living donor (kidney, partial liver) OR Deceased donor (heart, lung, liver, kidneys, pancreas, tissue) | 🔴 **CRITICAL GAP** |
| **Recipient Registry & Waiting List** | Not modeled (requests only specify blood type and count) | Formal Waiting List: MELD score (liver), CPRA / HLA panel (kidney), Status 1A/1B (heart), waiting time, pediatric priority | 🔴 **CRITICAL GAP** |
| **Preservation Window (Ischemia Time)** | 35–42 days (refrigerated blood) | Strictly minutes to hours: Heart/Lung (4–6h), Liver/Intestine (8–12h), Kidney (24–36h on perfusion pump) | 🔴 **CRITICAL GAP** |
| **Matching Complexity** | ABO blood group + Rh factor + distance | Multi-locus HLA matching (HLA-A, B, C, DR, DQ, DP), Virtual Crossmatch, Donor Specific Antibodies (DSA), Donor-Recipient Size/BMI, Age matching | 🔴 **CRITICAL GAP** |
| **Legal Consent & Brain Death Certification** | Simple self-registration consent | Formal donor registry consent, Next-of-kin legal authorization, Brain death verification (2 independent physicians), Organ Procurement Organization (OPO) sign-off | 🔴 **CRITICAL GAP** |
| **Human In-The-Loop Approval** | Automated reservation direct to donor | Policy-constrained; mandatory multi-specialist sign-off (Transplant Surgeon, OPO Coordinator, Medical Director) | 🔴 **CRITICAL GAP** |
| **Logistics & Cold-Chain Transport** | Donor drives personal vehicle to hospital | Air charter, ground emergency transport, green corridor coordination, real-time GPS tracking, perfusion device monitoring | 🔴 **CRITICAL GAP** |
| **Allocation Ethics & Audit** | First-come, first-accept reservation | Strict UNOS / NOTTO algorithmic allocation guidelines, non-discrimination audit trail, tamper-evident refusal logging | 🔴 **CRITICAL GAP** |

---

## 4. Domain Model Conflict Analysis (Blood Assumptions vs. Organ Reality)

```text
1. Current assumption: "Donors can be notified simultaneously, and first to accept gets the reservation."
   Where found: `functions/src/index.ts` (broadcasts reservation invites to top 5 donors).
   Why valid for blood: Blood donations are volumetric and non-exclusive.
   Why insufficient for organs: An organ can only be given to ONE recipient. Parallel offers without strict ranked prioritization violate national transplant ethics.
   Required abstraction: Sequential, time-limited single-offer allocation queue (Rank 1 has 30 mins to accept, then Rank 2).

2. Current assumption: "Donors are recurring entities with cooldown timers."
   Where found: `donors.lastDonationDate`, 56-day cooldown check.
   Why valid for blood: Blood regenerates naturally.
   Why insufficient for organs: Deceased organ donation is a one-time irreversible lifecycle event; living donors can only donate specific single organs once in a lifetime.
   Required abstraction: Differentiate `BloodDonorProfile` vs `OrganDonorProfile` vs `DeceasedDonorCase`.

3. Current assumption: "Inventory is an on-shelf unit count per hospital."
   Where found: `blood_inventory` table (`unitsAvailable: number`).
   Why valid for blood: Blood bags of the same type are fungible commodity units.
   Why insufficient for organs: Organs are uniquely identified medical entities with specific donor anatomy, crossclamp timestamps, perfusion records, and preservation timers.
   Required abstraction: Individual `OrganAsset` entity with lifecycle states: `IDENTIFIED` → `CONSENTED` → `PROCURED` → `PERFUSED` → `IN_TRANSIT` → `TRANSPLANTED`.
```

---

## 5. Security & Privacy Audit

| Finding | Classification | Location | Impact |
|---|---|---|---|
| **Unprotected Direct Next.js Firestore Mutation Routes** | 🔴 **Critical** | `web/src/app/api/**/route.ts` | API routes instantiate `admin.firestore()` without checking custom claims. |
| **Absence of Physical Security Rules in Repo** | 🔴 **Critical** | Root directory | No `firestore.rules` file committed; client SDK could read/write open collections if unconfigured. |
| **PII in Client-Side State** | 🟠 **High** | `web/src/hooks/useDonors.ts`, `usePatients.ts` | Donor full names and patient names accessible across hospital boundaries. |
| **Hardcoded Test Secrets & Keys** | 🟡 **Medium** | `web/src/lib/config.ts`, `scripts/seed-firebase.ts` | Development API keys and demo credentials committed in script files. |
| **Lack of PHI / HIPAA Sanitization in Logs** | 🟠 **High** | `web/src/lib/logger.ts`, `functions/src/index.ts` | Full request and user objects logged to Cloud Logging and `audit_logs` without PII masking. |

---

## 6. Technical Debt Audit

1. **Dual Persistence Layer:** Codebase writes both from Cloud Functions and from Next.js server API routes to the same Firestore collections, leading to race conditions.
2. **Untyped Firestore Documents:** Multiple hooks cast Firestore documents using `as any` or loose interfaces, bypassing TypeScript validation.
3. **Implicit Dependencies:** Functions assume ML service is always available at `http://localhost:8000` or fails silently with local fallbacks.
4. **Zero Automated Unit/Integration Tests:** No test suite found for matching engine or state transitions (`TESTING_GUIDE.md` exists, but contains manual verification steps only).

---

## 7. Reusability Analysis (Keep / Adapt / Migrate / Rewrite / Remove)

| Codebase Module / File | Reusability Classification | Migration Rationale |
|---|---|---|
| `web/src/lib/blood-utils.ts` | **KEEP** | Pure TypeScript compatibility functions (ABO/Rh matrix). 100% reusable. |
| `web/src/lib/distance-utils.ts` | **KEEP** | Haversine distance formulas. Pure math, zero dependencies. |
| `ml-backend/**` | **KEEP** | FastAPI models for reliability, demand, availability. Well encapsulated with Pydantic schemas. |
| `contracts/llm_contract.ts` | **KEEP** | Strict TypeScript interfaces for LLM inputs and structured insights. |
| `web/src/components/donor/**` & `hospital/**` | **ADAPT** | UI components look great; adapt data-binding from Firestore hooks to Convex queries. |
| `web/src/hooks/**` (12 hooks) | **REWRITE** | Replace Firestore `onSnapshot` subscriptions with Convex `useQuery()`. |
| `web/src/lib/firebase.ts` & `firebase-admin.ts` | **REMOVE** | Completely obsolete once Convex + Clerk are integrated. |
| `web/src/app/api/**` (9 API routes) | **REMOVE** | Convex mutations replace Next.js API routes entirely. |
| `functions/src/index.ts` (1566 lines) | **MIGRATE & REFACTOR** | Migrate matching logic, alert checks, and status state machine into modular Convex internal mutations and actions. |
