# FIREBASE_DEPENDENCY_MATRIX.md — Complete Dependency Inventory

## 1. Executive Summary
This document provides a comprehensive audit of every Firebase SDK dependency, configuration point, and module in the repository, mapping each to its architectural replacement in **Convex** and **Clerk**.

---

## 2. Master Firebase Dependency Matrix

| Firebase Component | Current Usage | Files | Purpose | Convex / Clerk Replacement | Migration Complexity |
|---|---|---|---|---|---|
| **Firebase Client SDK (`firebase/app`)** | `initializeApp`, `getApps` | `web/src/lib/firebase.ts` | Initialize browser Firebase instance | Replaced by `ConvexProvider` + `ClerkProvider` in `app/layout.tsx` | Low |
| **Firebase Auth Client (`firebase/auth`)** | `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `onAuthStateChanged` | `web/src/lib/firebase.ts`, `web/src/hooks/useAuth.ts`, `web/src/app/login/[role]/page.tsx`, `web/src/app/register/[role]/page.tsx`, `web/src/components/auth/ProtectedRoute.tsx` | User login, registration, session management, client route protection | **Clerk** (`useAuth`, `useUser`, `SignIn`, `SignUp`, Middleware) | Medium |
| **Firestore Client (`firebase/firestore`)** | `getFirestore`, `collection`, `doc`, `query`, `where`, `orderBy`, `onSnapshot`, `addDoc`, `updateDoc`, `setDoc`, `deleteDoc`, `Timestamp` | `web/src/hooks/useUserProfile.ts`<br>`web/src/hooks/useDonationRequests.ts`<br>`web/src/hooks/useReservations.ts`<br>`web/src/hooks/useHospitals.ts`<br>`web/src/hooks/useAlerts.ts`<br>`web/src/hooks/useAuditLogs.ts`<br>`web/src/hooks/useAIEvents.ts`<br>`web/src/hooks/useDonationHistory.ts`<br>`web/src/hooks/usePatients.ts`<br>`web/src/hooks/useCheckupRequests.ts`<br>`web/src/hooks/useSystemStats.ts`<br>`web/src/hooks/useMLOutputs.ts` | Reactive real-time data streaming to Next.js components | **Convex Queries (`useQuery`)** with built-in reactive subscriptions | Medium |
| **Firebase Admin SDK (`firebase-admin`)** | `admin.initializeApp`, `admin.firestore()`, `admin.auth()`, `FieldValue.serverTimestamp()` | `web/src/lib/firebase-admin.ts`, `web/src/lib/auth-helpers.ts`, `web/src/lib/audit-helpers.ts`, `web/src/app/api/**/route.ts` (9 API routes) | Privileged server-side mutations in Next.js App Router API routes | **Convex Mutations (`mutation`)** with server identity validation via Clerk token | Medium |
| **Cloud Functions v2 (`firebase-functions/v2`)** | `onDocumentCreated`, `onDocumentWritten`, `setGlobalOptions`, `logger` | `functions/src/index.ts` (1566 lines) | Orchestrates asynchronous pipelines: ML inference, matching engine, reservation state transitions, inventory alerts | **Convex Mutations + Actions (`action`) + Scheduled Functions (`ctx.scheduler.runAfter`)** | High |
| **Firestore Security Rules** | RBAC rules for Donor, Hospital, Admin | `docs/firestore_security_rules.md` (no physical file in repo) | Authorize reads/writes by role and ownership | **Convex Authentication Helper & Row-Level Authorization** (`ctx.auth.getUserIdentity()`) | Medium |
| **Firebase Storage** | Not active in codebase | N/A | Document and file storage | **Convex File Storage (`ctx.storage`)** | Low |
| **Firebase Environment Variables** | `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` | `web/.env.example`, `web/src/lib/config.ts`, `functions/.env.example` | Client and Server Firebase credentials | **Convex URL + Clerk Secret Keys** in `.env.local` | Low |
| **Seed & Test Scripts** | Admin SDK batch writes | `web/scripts/seed-firebase.ts`, `seed-reservations-data.ts`, `seed-shortage-prediction-data.ts`, `seed-audit-logs.ts`, `cleanup-demo-data.ts` | Populating test users, hospitals, requests, and reservations | **Convex Internal Mutations (`internalMutation`)** or TS node script calling Convex client | Low |

---

## 3. Deep-Dive on Specific File Coupling

### 3.1 Next.js API Routes (`web/src/app/api/`)
Currently, 9 API endpoints instantiate `firebase-admin` directly:
1. `api/requests/create/route.ts` — writes `donation_requests`
2. `api/requests/[id]/respond/route.ts` — creates `reservations`
3. `api/requests/[id]/cancel/route.ts` — updates request status
4. `api/reservations/[id]/accept/route.ts` — updates reservation to `ACCEPTED`
5. `api/reservations/[id]/decline/route.ts` — updates reservation to `DECLINED`
6. `api/reservations/[id]/complete/route.ts` — updates reservation to `COMPLETED`
7. `api/patients/create/route.ts` — writes `patients`
8. `api/patients/[id]/delete/route.ts` — deletes `patients`
9. `api/shortages/create/route.ts` — writes `alerts`

**Architectural Assessment:**
In Convex, **Next.js API routes are completely unnecessary for database operations**. Next.js components invoke Convex mutations directly using `useMutation()`, with security enforced server-side inside Convex via Clerk identity claims.

### 3.2 Reactive Hooks (`web/src/hooks/`)
12 client hooks wrap `onSnapshot`:
- Each hook manages manual state (`data`, `loading`, `error`, `unsubscribe`).
- Memory leaks can occur if `unsubscribe()` is omitted on unmount.
- Network over-fetching occurs because Firestore cannot easily join or project relational data.

**Convex Advantage:**
Each hook becomes a single line: `const data = useQuery(api.module.queryName, args);` with zero boilerplate, automatic caching, consistent reactivity, and TypeScript end-to-end type safety.
