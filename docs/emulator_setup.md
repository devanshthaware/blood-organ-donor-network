# Emulator-First Configuration

**Purpose:** Set up Firebase Emulator Suite for local development that behaves like production.

---

## Overview

Firebase Emulator Suite allows you to:
- Develop locally without Firebase costs
- Test event-driven flows (Functions + Firestore triggers)
- Debug with Emulator UI
- Reset data easily for testing
- Work offline

**Principle:** Local development should mirror production behavior.

---

## Current Configuration

Your `firebase.json` is already configured with emulators:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  }
}
```

**Ports:**
- Auth: `9099`
- Functions: `5001`
- Firestore: `8080`
- UI: `4000` (default, not specified)

---

## Starting Emulators

### Basic Start

```bash
firebase emulators:start
```

This starts all configured emulators.

### Start Specific Emulators Only

```bash
# Only Firestore and Functions (for faster startup)
firebase emulators:start --only firestore,functions

# Only what you need
firebase emulators:start --only auth,firestore,functions
```

### Start with UI

The UI is enabled by default. Access at:
- **Emulator UI:** http://localhost:4000
- **Functions:** http://localhost:5001
- **Firestore:** http://localhost:8080
- **Auth:** http://localhost:9099

---

## Connecting Next.js to Emulators

### 1. Install Firebase SDK in Next.js

```bash
cd web
npm install firebase
# or
pnpm add firebase
```

### 2. Create Firebase Config File

Create `web/src/lib/firebase.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  // Only connect once
  if (!(global as any).__emulatorsConnected) {
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Connect to emulators
    if (!auth._delegate._config?.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    if (!db._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }

    (global as any).__emulatorsConnected = true;
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### 3. Environment Variables

Create `web/.env.local`:

```env
# Firebase Config (use emulator-safe values)
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=veinlink-cf53
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=veinlink-cf53.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# ML API (local)
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

**Note:** In emulator mode, most Firebase config values are ignored, but they must be present.

---

## Connecting Cloud Functions to Emulators

### 1. Functions Emulator Configuration

Functions automatically connect to emulators when running locally.

### 2. Environment Variables for Functions

Create `functions/.env` (not committed to git):

```env
# ML API URL (local FastAPI service)
ML_API_URL=http://localhost:8000

# Firebase Project (for admin SDK)
GCLOUD_PROJECT=veinlink-cf53
```

### 3. Load Environment Variables

Update `functions/src/index.ts`:

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

// Now use process.env.ML_API_URL
```

### 4. Admin SDK Configuration

In Functions, the Admin SDK automatically uses emulators when running locally:

```typescript
import * as admin from 'firebase-admin';

// Initialize Admin SDK (auto-detects emulators)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
// Automatically connects to Firestore emulator on port 8080
```

---

## Connecting ML Service

### Start ML Service Locally

```bash
cd ml-backend
# Activate virtual environment
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Start FastAPI
uvicorn ml_inference.api.main:app --reload --port 8000
```

### Verify ML Service

```bash
curl http://localhost:8000/health
# Should return: {"status": "ok", "models_loaded": true}
```

---

## Complete Development Workflow

### Terminal 1: Start Emulators

```bash
firebase emulators:start
```

### Terminal 2: Start ML Service

```bash
cd ml-backend
source venv/bin/activate
uvicorn ml_inference.api.main:app --reload --port 8000
```

### Terminal 3: Start Next.js

```bash
cd web
npm run dev
# or
pnpm dev
```

### Terminal 4: Build Functions (Watch Mode)

```bash
cd functions
npm run build:watch
# or
pnpm build:watch
```

---

## Emulator UI Features

Access http://localhost:4000 to:

1. **View Data:**
   - Firestore collections and documents
   - Auth users
   - Function logs

2. **Edit Data:**
   - Manually create/edit Firestore documents
   - Create test users
   - Trigger functions manually

3. **Monitor:**
   - Function execution logs
   - Firestore reads/writes
   - Auth events

---

## Data Management

### Export Emulator Data

```bash
# Export before stopping
firebase emulators:export ./emulator-data
```

### Import Emulator Data

```bash
# Start with imported data
firebase emulators:start --import=./emulator-data
```

### Clear All Data

```bash
# Start fresh (no import)
firebase emulators:start
```

### Seed Data Script

Create `scripts/seed-emulator.ts`:

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function seed() {
  // Create test users, requests, etc.
  await db.collection('users').doc('test-donor').set({
    email: 'donor@test.com',
    role: 'donor',
    displayName: 'Test Donor',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log('Seed data created!');
  process.exit(0);
}

seed();
```

Run with:
```bash
ts-node scripts/seed-emulator.ts
```

---

## Testing Event-Driven Flows

### Test Firestore Trigger

1. Start emulators
2. Open Emulator UI
3. Create a document in `donation_requests` collection
4. Watch Functions logs for trigger execution
5. Verify ML API was called
6. Check `ml_outputs` collection for results

### Test Auth Trigger

1. Create user in Auth emulator (via UI or SDK)
2. Verify `users/{uid}` document created
3. Check audit logs

---

## Common Issues & Solutions

### Issue: Functions not connecting to Firestore emulator

**Solution:** Ensure `firebase.json` has correct emulator ports and Functions are running in emulator mode.

### Issue: Next.js can't connect to Auth emulator

**Solution:** Check that `connectAuthEmulator` is called before any auth operations, and only in development.

### Issue: ML API calls failing from Functions

**Solution:** 
- Verify ML service is running: `curl http://localhost:8000/health`
- Check `ML_API_URL` in `functions/.env`
- Check Functions logs in Emulator UI

### Issue: CORS errors from ML API

**Solution:** Add CORS middleware to FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Production vs Emulator Differences

| Feature | Emulator | Production |
|---------|----------|------------|
| **Data Persistence** | Lost on restart (unless exported) | Permanent |
| **Performance** | Slower (local machine) | Cloud-optimized |
| **Quotas** | None | Firebase quotas apply |
| **Security Rules** | Enforced | Enforced |
| **Functions Timeout** | 60s (default) | 60s (Gen 2) |
| **Costs** | Free | Pay per use |

**Important:** Always test security rules and Functions in emulator before deploying.

---

## Verification Checklist

After setup, verify:

- [ ] Emulators start: `firebase emulators:start`
- [ ] Emulator UI accessible: http://localhost:4000
- [ ] Next.js connects to emulators (check browser console)
- [ ] Functions can read/write Firestore (check logs)
- [ ] Functions can call ML API (check logs)
- [ ] Auth emulator works (create test user)
- [ ] Firestore rules are enforced (test read/write)

---

## Next Steps

1. **Step 5:** Write Firestore security rules (test in emulator)
2. **Step 6:** Create Functions (test triggers in emulator)
3. **Step 10:** Integrate Next.js (use emulator endpoints)

---

**Remember:** Emulator-first development means you can iterate quickly without Firebase costs or deployment delays.
