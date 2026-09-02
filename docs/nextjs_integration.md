# Next.js Integration Guide

**Purpose:** Explain how Next.js should integrate with the Firebase backend, ensuring frontend never calls ML directly.

---

## Core Principle

> **Frontend reads decisions, never computes them.**

The Next.js frontend:
- ✅ Reads from Firestore (reservations, requests, ML outputs)
- ✅ Creates events (donation requests, reservation accept/decline)
- ✅ Listens to real-time updates
- ❌ **NEVER calls ML APIs directly**
- ❌ **NEVER computes matching logic**

---

## Architecture Overview

```
Next.js Frontend
    ↓ (writes)
Firestore (donation_requests, reservations)
    ↓ (triggers)
Firebase Functions
    ↓ (calls)
ML API
    ↓ (returns)
Firebase Functions
    ↓ (writes)
Firestore (ml_outputs, alerts)
    ↓ (updates)
Next.js Frontend (listens)
```

---

## Which Actions Use API Routes?

### ✅ Use Next.js API Routes For:

1. **Creating Donation Requests**
   - Hospital creates request → API route → Firestore write
   - API route validates data before writing

2. **User Registration/Profile Creation**
   - Create user profile in Firestore
   - Set custom claims for role

3. **File Uploads** (if needed)
   - Profile photos, documents

### ❌ Don't Use API Routes For:

- Reading data (use Firestore SDK directly)
- Real-time updates (use Firestore listeners)
- ML predictions (Functions handle this)

---

## Which Screens Use Firestore Listeners?

### Real-Time Listeners (Recommended):

1. **Donor Requests Screen**
   - Listen to `donation_requests` where `status == "PENDING"`
   - Real-time updates when new requests are created

2. **Hospital Reservations Screen**
   - Listen to `reservations` where `hospitalId == auth.uid`
   - Real-time updates when donors accept/decline

3. **Donor Reservations Screen**
   - Listen to `reservations` where `donorId == auth.uid`
   - Real-time updates when status changes

4. **Hospital Alerts Screen**
   - Listen to `alerts` where `relatedHospitalId == auth.uid`
   - Real-time updates when new alerts are created

### One-Time Reads:

1. **User Profile**
   - Read `users/{uid}` on page load
   - No real-time needed

2. **Donation History**
   - Read `reservations` where `donorId == auth.uid && status == "COMPLETED"`
   - Query on page load

---

## Example: Next.js API Route for Creating Donation Request

Create `web/src/app/api/requests/create/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin (server-side only)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verify user is a hospital
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    if (userData?.role !== "hospital") {
      return NextResponse.json(
        { error: "Only hospitals can create requests" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { bloodGroup, quantity, urgency, dueDate, notes } = body;

    // Validate input
    if (!bloodGroup || !quantity || !urgency) {
      return NextResponse.json(
        { error: "Missing required fields: bloodGroup, quantity, urgency" },
        { status: 400 }
      );
    }

    // Create donation request
    const requestRef = db.collection("donation_requests").doc();
    await requestRef.set({
      hospitalId: userId,
      bloodGroup,
      quantity: parseInt(quantity, 10),
      urgency: urgency.toUpperCase(),
      status: "PENDING",
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(notes && { notes }),
      createdAt: new Date(),
      createdBy: userId,
    });

    // Function will trigger automatically and call ML API

    return NextResponse.json(
      { 
        success: true,
        requestId: requestRef.id,
        message: "Request created. Matching donors...",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Example: React Hook for Listening to Reservations

Create `web/src/hooks/useReservations.ts`:

```typescript
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface Reservation {
  id: string;
  requestId: string;
  donorId: string;
  hospitalId: string;
  status: string;
  rank: number;
  mlScores?: {
    availability: number;
    reliability: number;
    combined: number;
  };
  explanation?: string;
  distanceKm?: number;
  createdAt: Date;
}

export function useReservations(role: "donor" | "hospital") {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Build query based on role
    let q;
    if (role === "donor") {
      q = query(
        collection(db, "reservations"),
        where("donorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "reservations"),
        where("hospitalId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Reservation[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            ...docData,
            createdAt: docData.createdAt?.toDate() || new Date(),
          } as Reservation);
        });
        setReservations(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to reservations:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user, role]);

  return { reservations, loading, error };
}
```

---

## Example: Donor Accepts Reservation

Create `web/src/app/api/reservations/[id]/accept/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// ... (same initialization as above)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const reservationId = params.id;

    // Verify reservation belongs to user
    const reservationRef = db.collection("reservations").doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const reservationData = reservationDoc.data()!;
    if (reservationData.donorId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (reservationData.status !== "PENDING") {
      return NextResponse.json(
        { error: "Reservation already processed" },
        { status: 400 }
      );
    }

    // Update reservation status
    await reservationRef.update({
      status: "ACCEPTED",
      acceptedAt: new Date(),
    });

    // Function will trigger and set status to CONFIRMED

    return NextResponse.json({
      success: true,
      message: "Reservation accepted",
    });
  } catch (error) {
    console.error("Error accepting reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Example: React Component Using Hook

Create `web/src/components/DonorReservations.tsx`:

```typescript
"use client";

import { useReservations } from "@/hooks/useReservations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DonorReservations() {
  const { reservations, loading, error } = useReservations("donor");

  const handleAccept = async (reservationId: string) => {
    try {
      const token = await getAuthToken(); // Your auth helper
      const response = await fetch(`/api/reservations/${reservationId}/accept`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to accept reservation");
      }

      // UI will update automatically via Firestore listener
    } catch (error) {
      console.error("Error accepting reservation:", error);
      // Show error toast
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hospital</TableHead>
          <TableHead>Blood Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Match Score</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell>{reservation.hospitalId}</TableCell>
            <TableCell>O+</TableCell>
            <TableCell>
              <Badge>{reservation.status}</Badge>
            </TableCell>
            <TableCell>
              {(reservation.mlScores?.combined * 100).toFixed(1)}%
            </TableCell>
            <TableCell>
              {reservation.status === "PENDING" && (
                <Button onClick={() => handleAccept(reservation.id)}>
                  Accept
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Firebase Client SDK Setup

Create `web/src/lib/firebase.ts`:

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Connect to emulators in development
if (process.env.NODE_ENV === "development") {
  if (!(global as any).__emulatorsConnected) {
    const auth = getAuth(app);
    const db = getFirestore(app);

    if (!auth._delegate._config?.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    }
    if (!db._delegate._settings?.host?.includes("localhost")) {
      connectFirestoreEmulator(db, "localhost", 8080);
    }

    (global as any).__emulatorsConnected = true;
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

---

## Best Practices

### 1. **Never Call ML APIs from Frontend**

❌ **Don't do this:**
```typescript
// BAD - Don't do this!
const response = await fetch("http://localhost:8000/predict/availability", {
  method: "POST",
  body: JSON.stringify(payload),
});
```

✅ **Do this instead:**
```typescript
// GOOD - Create a request, let Functions handle ML
await db.collection("donation_requests").add({
  hospitalId: userId,
  bloodGroup: "O+",
  // ... Functions will call ML
});
```

### 2. **Use Real-Time Listeners for Dynamic Data**

✅ **Use listeners for:**
- Reservations (status changes)
- Requests (new requests)
- Alerts (new alerts)

❌ **Don't poll:**
```typescript
// BAD - Don't poll
setInterval(async () => {
  const snapshot = await db.collection("reservations").get();
  // ...
}, 5000);
```

### 3. **Validate on Both Client and Server**

- Client-side validation: Better UX (immediate feedback)
- Server-side validation: Security (API routes)

### 4. **Handle Loading and Error States**

Always show loading states and handle errors gracefully.

---

## Summary

| Action | Method | Location |
|--------|--------|----------|
| Create request | API route → Firestore write | `/api/requests/create` |
| Read requests | Firestore listener | `useReservations` hook |
| Accept reservation | API route → Firestore update | `/api/reservations/[id]/accept` |
| View ML scores | Firestore read | `ml_outputs` collection |
| View alerts | Firestore listener | `alerts` collection |

---

**Remember:** Frontend creates events → Firestore stores truth → Functions think → ML advises → UI observes.
