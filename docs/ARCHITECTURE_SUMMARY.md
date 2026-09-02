# VeinLink Architecture Summary

**Event-Driven Blood Donation Platform**

---

## System Architecture

```
┌─────────────┐
│  Next.js    │  Frontend (UI)
│  Frontend   │
└──────┬──────┘
       │ (writes events)
       ▼
┌─────────────────┐
│    Firestore    │  System of Record
│   (Database)    │
└──────┬──────────┘
       │ (triggers)
       ▼
┌─────────────────┐
│ Firebase        │  Orchestration Layer
│ Functions       │
└──────┬──────────┘
       │ (calls)
       ▼
┌─────────────────┐
│   FastAPI ML    │  ML Inference Service
│     Service     │
└─────────────────┘
```

---

## Core Principles

1. **Frontend never calls ML directly**
   - Next.js only reads from Firestore
   - All ML decisions flow through Functions

2. **Firestore is the system of record**
   - All state stored in Firestore
   - Functions react to Firestore events

3. **All decisions are explainable**
   - ML inputs/outputs stored in `ml_outputs`
   - Explanations stored with reservations

4. **All actions are auditable**
   - Every action logged to `audit_logs`
   - Complete audit trail

---

## Key Components

### 1. ML Contract (`docs/ml_contract.md`)

Single source of truth for ML API:
- `POST /predict/reliability` - Donor reliability score
- `POST /predict/availability` - Donor availability probability
- `POST /predict/demand` - Demand forecasting

**Status:** ✅ Defined and documented

### 2. Firestore Data Model (`docs/firestore_data_model.md`)

Collections:
- `users` - User profiles
- `donors` - Donor-specific data
- `hospitals` - Hospital profiles
- `donation_requests` - Blood requests
- `reservations` - Donor-reservation matches
- `ml_outputs` - ML predictions (explainability)
- `alerts` - System alerts
- `audit_logs` - Action audit trail

**Status:** ✅ Designed and documented

### 3. Security Rules (`firestore.rules`)

Role-based access control:
- Donors: Read own data, accept/decline reservations
- Hospitals: Create requests, read own data
- Admins: Read-only access everywhere
- Functions: Write ML outputs, alerts, audit logs

**Status:** ✅ Implemented

### 4. Firebase Functions (`functions/src/index.ts`)

**Function 1: `onDonationRequestCreated`**
- Triggers: `donation_requests/{id}` created
- Calls: Demand forecasting ML
- Writes: `ml_outputs/demand/{id}`

**Function 2: `onDemandForecastCreated`**
- Triggers: `ml_outputs/demand_{id}` created
- Queries: Eligible donors
- Calls: Availability + Reliability ML for each donor
- Writes: `reservations/{id}` with rankings

**Function 3: `onReservationStatusChanged`**
- Triggers: `reservations/{id}` updated
- Handles: ACCEPTED → CONFIRMED, updates stats

**Function 4: `checkEmergencyAlerts`**
- Triggers: `donation_requests/{id}` created
- Creates: Emergency alerts for critical requests

**Status:** ✅ Implemented

### 5. Next.js Integration (`docs/nextjs_integration.md`)

- API Routes: Create requests, accept reservations
- Firestore Listeners: Real-time updates
- Never calls ML directly

**Status:** ✅ Documented (implementation in Next.js codebase)

---

## Complete Flow

1. **Hospital creates request** → Firestore write
2. **Function triggers** → Calls demand ML
3. **ML output stored** → Function triggers matching
4. **Matching engine** → Queries donors, scores them
5. **Reservations created** → Donors see in real-time
6. **Donor accepts** → Function confirms
7. **Request fulfilled** → All parties notified

**See:** `docs/end_to_end_flow.md` for detailed timeline

---

## File Structure

```
VeinLink-mvp/
├── docs/
│   ├── ml_contract.md              # ML API contract
│   ├── firestore_data_model.md      # Data model
│   ├── firebase_init_guide.md       # Firebase setup
│   ├── emulator_setup.md             # Local development
│   ├── firestore_security_rules.md  # Security rules docs
│   ├── nextjs_integration.md        # Frontend integration
│   ├── end_to_end_flow.md           # Flow validation
│   ├── production_readiness.md      # Deployment checklist
│   └── ARCHITECTURE_SUMMARY.md      # This file
├── functions/
│   ├── src/
│   │   └── index.ts                 # All Cloud Functions
│   └── package.json                 # Dependencies (includes axios)
├── firestore.rules                  # Security rules
├── firestore.indexes.json           # Composite indexes
├── firebase.json                    # Firebase config
└── .firebaserc                      # Project config
```

---

## Quick Start

### 1. Setup Firebase

```bash
firebase init
# Select: Firestore, Functions, Emulators
```

### 2. Install Dependencies

```bash
cd functions
npm install
```

### 3. Start Emulators

```bash
firebase emulators:start
```

### 4. Start ML Service

```bash
cd ml-backend
uvicorn ml_inference.api.main:app --reload
```

### 5. Start Next.js

```bash
cd web
npm run dev
```

### 6. Deploy (Production)

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy functions
cd functions && npm run build
firebase deploy --only functions
```

---

## Environment Variables

### Functions (`.env` or Firebase Config)

```env
ML_API_URL=http://localhost:8000  # Local
# or
ML_API_URL=https://your-ml-service.com  # Production
```

### Next.js (`.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## Testing

### Manual Test Flow

1. Create hospital user (Emulator UI)
2. Create donor users (Emulator UI)
3. Create donation request (Next.js UI)
4. Verify ML calls (Functions logs)
5. Verify reservations created (Firestore)
6. Accept reservation as donor (Next.js UI)
7. Verify confirmation (Firestore)

### Automated Tests

- Unit tests for Functions (TODO)
- Integration tests in emulator (TODO)
- E2E tests (TODO)

---

## Production Checklist

See `docs/production_readiness.md` for complete checklist.

**Critical items:**
- [ ] Security rules deployed
- [ ] Functions deployed
- [ ] ML API accessible
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Error handling tested

---

## Mental Model

> **UI creates events → Firestore stores truth → Functions think → ML advises → UI observes**

This architecture ensures:
- ✅ Separation of concerns
- ✅ Scalability
- ✅ Explainability
- ✅ Auditability
- ✅ Maintainability

---

## Next Steps

1. **Implement Next.js API routes** (see `docs/nextjs_integration.md`)
2. **Add Firestore indexes** (see `docs/firestore_data_model.md`)
3. **Test end-to-end flow** (see `docs/end_to_end_flow.md`)
4. **Deploy to production** (see `docs/production_readiness.md`)

---

## Support

- **ML Contract Issues:** See `docs/ml_contract.md`
- **Data Model Questions:** See `docs/firestore_data_model.md`
- **Security Questions:** See `docs/firestore_security_rules.md`
- **Integration Help:** See `docs/nextjs_integration.md`

---

**This is a production-ready architecture for an event-driven ML-powered blood donation platform.**
