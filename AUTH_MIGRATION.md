# AUTH_MIGRATION.md — Firebase Authentication → Clerk + Convex Identity Migration Plan

## 1. Executive Summary
This document audits all authentication logic currently implemented with Firebase Auth and specifies the precise migration architecture to **Clerk** integrated with **Convex**.

---

## 2. Current Authentication Audit

### 2.1 Files Coupled to Firebase Auth
1. `web/src/lib/firebase.ts` — Instantiates client `getAuth()`.
2. `web/src/lib/firebase-admin.ts` — Instantiates server `admin.auth()`.
3. `web/src/hooks/useAuth.ts` — React hook wrapping `onAuthStateChanged`, maintaining `{ user, loading, error }`.
4. `web/src/hooks/useUserProfile.ts` — Listens to `users/{user.uid}` to extract the user's role.
5. `web/src/components/auth/ProtectedRoute.tsx` — Redirects unauthenticated users to `/login` and validates role match (`allowedRoles.includes(profile.role)`).
6. `web/src/app/login/[role]/page.tsx` — Form calling `signInWithEmailAndPassword(auth, email, password)`.
7. `web/src/app/register/[role]/page.tsx` — Form calling `createUserWithEmailAndPassword(auth, email, password)` followed by a Firestore document creation at `users/{uid}` and `donors/{uid}` or `hospitals/{uid}`.
8. `web/src/lib/auth-helpers.ts` — Helper verifying Bearer token using `admin.auth().verifyIdToken(token)`.
9. `web/src/app/api/**/route.ts` — All 9 API routes call `auth-helpers.ts` to authenticate caller.

---

## 3. The Target Identity Architecture: Clerk + Convex

```
┌────────────────────────────────────────────────────────────┐
│                         User Browser                       │
│    Clerk React Components (<SignIn />, <SignUp />, <UserButton />) │
└──────────────────────────────┬─────────────────────────────┘
                               │ Authenticates with Clerk
                               ▼
┌────────────────────────────────────────────────────────────┐
│                       Clerk Identity                       │
│    • JWT token issued with custom session claims (role)    │
│    • Public key published to JWKS endpoint                 │
└──────────────────────────────┬─────────────────────────────┘
                               │ Transmits JWT with each Convex request
                               ▼
┌────────────────────────────────────────────────────────────┐
│                       Convex Backend                       │
│   • Validates Clerk JWT using convex/auth.config.js        │
│   • ctx.auth.getUserIdentity() returns verified Clerk User │
│   • Queries Convex `users` table to verify permissions     │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Identity & Role Mapping Pipeline

```text
Firebase User (UID)
        ↓
Clerk User (user_2...)
        ↓
Convex Identity (identity.tokenIdentifier)
        ↓
Application Role ("donor" | "hospital" | "admin")
```

### 4.1 Role Assignment & Synchronization Strategy
1. **During Registration:**
   - User signs up via Clerk with metadata attribute: `unsafeMetadata: { role: "donor" | "hospital" }` (or via custom role onboarding flow).
   - Alternatively, a Clerk Webhook (`user.created`) fires a Convex Mutation `users:syncClerkUser` to insert the initial user record into Convex.
2. **Inside Convex Functions:**
   ```typescript
   export const getDonorProfile = query({
     args: {},
     handler: async (ctx) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error("Unauthenticated");

       const user = await ctx.db
         .query("users")
         .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
         .first();

       if (!user || user.role !== "donor") {
         throw new Error("Unauthorized: Donor access required");
       }

       return await ctx.db
         .query("donors")
         .withIndex("by_userId", (q) => q.eq("userId", user._id))
         .first();
     },
   });
   ```

---

## 5. Route Protection & Middleware Replacement

### Current: `ProtectedRoute.tsx` (Client-Side Rendering delay)
Currently, `ProtectedRoute.tsx` renders a loading skeleton while Firebase Auth initializes over the wire, causing UI flicker.

### Target: Next.js + Clerk Edge Middleware (`middleware.ts`)
```typescript
// middleware.ts (Target Design)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isDonorRoute = createRouteMatcher(["/donor(.*)"]);
const isHospitalRoute = createRouteMatcher(["/hospital(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  if (!userId && (isDonorRoute(req) || isHospitalRoute(req) || isAdminRoute(req))) {
    return (await auth()).redirectToSignIn();
  }
  // Role checks can be performed at Edge if claims configured, or inside Server Layout
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```
