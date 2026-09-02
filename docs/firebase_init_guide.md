# Firebase Init Guide

**Purpose:** Configure Firebase project with only the features needed for VeinLink, avoiding bloat and future refactors.

---

## Current Status

✅ **Already Configured:**
- Firestore Database
- Cloud Functions (TypeScript)
- Firebase Hosting
- Firebase Emulator Suite

This guide explains what to select if starting fresh or re-initializing.

---

## Step-by-Step: `firebase init`

### 1. Prerequisites

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

### 2. Initialize Project

```bash
cd /path/to/VeinLink-mvp
firebase init
```

---

## Feature Selection

### ✅ SELECT These Features

#### 1. **Firestore: Configure security rules and indexes files for Firestore?**

**Answer:** `Yes`

**Why:** 
- Firestore is our system of record
- Security rules enforce role-based access
- Indexes are required for complex queries

**What it creates:**
- `firestore.rules` — Security rules file
- `firestore.indexes.json` — Composite index definitions

**Configuration:**
- Use default database: `(default)`
- Location: Choose closest to your users (e.g., `asia-east1`, `us-central1`)

---

#### 2. **Functions: Configure a Cloud Functions directory and write files to it?**

**Answer:** `Yes`

**Why:**
- Functions orchestrate ML calls
- Functions handle event-driven logic
- Functions enforce business rules

**What it creates:**
- `functions/` directory
- `functions/package.json`
- `functions/tsconfig.json`
- `functions/src/index.ts`

**Configuration:**
- Language: **TypeScript** (not JavaScript)
- ESLint: `Yes` (for code quality)
- Install dependencies: `Yes`
- Use TypeScript: `Yes`

---

#### 3. **Emulators: Set up local emulators?**

**Answer:** `Yes`

**Why:**
- Local development without Firebase costs
- Fast iteration cycle
- Test event-driven flows locally

**What it creates:**
- Emulator configuration in `firebase.json`

**Configuration:**
- Which emulators: Select:
  - ✅ **Authentication Emulator**
  - ✅ **Functions Emulator**
  - ✅ **Firestore Emulator**
  - ❌ **Realtime Database Emulator** (not used)
  - ❌ **Storage Emulator** (not used)
  - ❌ **Pub/Sub Emulator** (not used)
  - ✅ **Emulator UI** (for debugging)

**Ports (use defaults):**
- Auth: `9099`
- Functions: `5001`
- Firestore: `8080`
- UI: `4000`

---

### ❌ SKIP These Features

#### 1. **Hosting: Configure files for Firebase Hosting?**

**Answer:** `No` (or `Yes` if you want static hosting)

**Why Skip:**
- We use Next.js for frontend (separate deployment)
- Firebase Hosting is only for static sites
- Next.js should deploy to Vercel/Netlify/own server

**If you select Yes:**
- Public directory: `public` (for static assets only)
- Single-page app: `No` (we have routing)
- GitHub Actions: `No` (use your own CI/CD)

---

#### 2. **Storage: Configure a security rules file for Cloud Storage?**

**Answer:** `No`

**Why:**
- We don't store files/images in Firebase Storage
- Profile photos can use external CDN or Next.js public folder
- Reduces complexity and costs

---

#### 3. **Realtime Database: Configure a security rules file for Realtime Database?**

**Answer:** `No`

**Why:**
- We use Firestore, not Realtime Database
- Firestore is more scalable and feature-rich
- Avoid confusion and costs

---

#### 4. **Remote Config: Configure a template file for Remote Config?**

**Answer:** `No`

**Why:**
- Not needed for MVP
- Can add later if needed for A/B testing
- Reduces initial complexity

---

#### 5. **Cloud Messaging: Configure a template file for Cloud Messaging?**

**Answer:** `No`

**Why:**
- Not needed for MVP
- Can add later for push notifications
- Focus on core functionality first

---

## Generated Project Structure

After `firebase init`, your project should look like:

```
VeinLink-mvp/
├── .firebaserc              # Project configuration
├── firebase.json            # Firebase services config
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Composite indexes
├── functions/               # Cloud Functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   └── index.ts
│   └── .eslintrc.js
└── public/                  # (Optional) Static hosting
    └── index.html
```

---

## Post-Init Configuration

### 1. Update `firebase.json` for Emulators

Ensure emulators section looks like:

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
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### 2. Set Node Version in `functions/package.json`

```json
{
  "engines": {
    "node": "18"
  }
}
```

**Note:** Your current config uses Node 24, which is fine, but Node 18 is the LTS version recommended by Firebase.

### 3. Install Function Dependencies

```bash
cd functions
npm install
# or
pnpm install
```

### 4. Verify Emulator Setup

```bash
firebase emulators:start
```

You should see:
- ✅ Authentication Emulator running on port 9099
- ✅ Functions Emulator running on port 5001
- ✅ Firestore Emulator running on port 8080
- ✅ Emulator UI running on port 4000

Open http://localhost:4000 to see the Emulator UI.

---

## Environment Variables

### For Cloud Functions (Production)

Set environment variables for ML API:

```bash
firebase functions:config:set ml.api_url="https://your-ml-service.com"
```

Access in code:
```typescript
const mlApiUrl = functions.config().ml.api_url;
```

### For Local Development (Emulators)

Create `functions/.env` (not committed to git):

```env
ML_API_URL=http://localhost:8000
```

Load in `functions/src/index.ts`:
```typescript
import * as dotenv from 'dotenv';
dotenv.config();
```

---

## Verification Checklist

After initialization, verify:

- [ ] `firebase.json` exists with emulators config
- [ ] `.firebaserc` has your project ID
- [ ] `firestore.rules` exists (we'll write rules in Step 5)
- [ ] `firestore.indexes.json` exists (we'll add indexes in Step 2)
- [ ] `functions/` directory exists with TypeScript setup
- [ ] `functions/package.json` has `firebase-functions` and `firebase-admin`
- [ ] Emulators start without errors: `firebase emulators:start`
- [ ] Emulator UI accessible at http://localhost:4000

---

## Common Mistakes to Avoid

### ❌ Don't Select:
- Realtime Database (we use Firestore)
- Cloud Storage (not needed for MVP)
- Remote Config (not needed for MVP)
- Cloud Messaging (can add later)

### ❌ Don't Use:
- JavaScript for Functions (use TypeScript)
- Default hosting public directory for Next.js (Next.js has its own build)

### ✅ Do:
- Use TypeScript for Functions
- Set up emulators for local development
- Configure Firestore rules and indexes
- Use environment variables for secrets

---

## Next Steps

After Firebase init:

1. **Step 4:** Configure emulator-first development
2. **Step 5:** Write Firestore security rules
3. **Step 6:** Create Cloud Functions

---

**Remember:** Firebase init is a one-time setup. Once configured, focus on building Functions and Rules.
