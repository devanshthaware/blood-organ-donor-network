# ML Output Flow - How ML Predictions Reach the UI

## Overview

**Yes, ML outputs are computed from the ML API and displayed in the UI**, but **only if all services are running correctly**.

## Complete Flow

```
1. Donation Request Created (via seed or UI)
   ↓
2. Firebase Function: onDonationRequestCreated triggers
   ↓
3. Function calls ML API: POST /predict/demand
   ↓
4. ML output stored in: ml_outputs/demand_{requestId}
   ↓
5. Firebase Function: onDemandForecastCreated triggers
   ↓
6. Function queries eligible donors
   ↓
7. For each donor:
   - Calls ML API: POST /predict/availability
   - Calls ML API: POST /predict/reliability
   - Calculates combined score (60% availability + 40% reliability)
   ↓
8. Creates reservations with ML scores in: reservations/{id}
   ↓
9. UI displays ML scores via Firestore real-time listeners
```

## Prerequisites for ML Processing

### ✅ All Services Must Be Running

1. **Firebase Emulators** (including Functions)
   ```bash
   firebase emulators:start
   ```

2. **ML Backend API**
   ```bash
   cd ml-backend
   uvicorn ml_inference.api.main:app --reload --port 8000
   ```

3. **Next.js Frontend** (for UI)
   ```bash
   cd web
   pnpm dev
   ```

### ⚠️ Important Notes

- **Seed script creates requests, but ML processing only happens if Functions are running**
- **If Functions aren't running when you seed, ML outputs won't be generated**
- **You need to restart Functions or create new requests after starting all services**

## What Gets Computed

### 1. Demand Forecasting

**When:** Immediately after donation request is created  
**ML API:** `POST /predict/demand`  
**Stored in:** `ml_outputs/demand_{requestId}`

**Input:**
```json
{
  "region": 1,
  "blood_group": 1,
  "demand_units": 2,
  "supply_units": 0,
  "month": 1,
  "day": 15
}
```

**Output:**
```json
{
  "predicted_demand": 0.85
}
```

### 2. Donor Availability

**When:** After demand forecast is created  
**ML API:** `POST /predict/availability`  
**Stored in:** `ml_outputs/availability_{reservationId}`

**Input:**
```json
{
  "blood_group": 1,
  "distance_km": 12.5,
  "days_since_last_donation": 60,
  "past_acceptance_rate": 0.75,
  "urgency_level": 3,
  "time_of_day": 1
}
```

**Output:**
```json
{
  "availability_probability": 0.85
}
```

### 3. Donor Reliability

**When:** After demand forecast is created (for donors with history)  
**ML API:** `POST /predict/reliability`  
**Stored in:** `ml_outputs/reliability_{reservationId}`

**Input:**
```json
{
  "total_requests": 40,
  "accepted_requests": 35,
  "completed_donations": 30,
  "no_shows": 5,
  "avg_response_time_minutes": 18.5
}
```

**Output:**
```json
{
  "reliability_score": 0.78
}
```

### 4. Combined Score

**Calculation:**
```typescript
combinedScore = (availabilityScore * 0.6) + (reliabilityScore * 0.4)
```

**Stored in:** `reservations/{id}.mlScores.combined`

## Where ML Scores Are Displayed in UI

### 1. Donor Availability Page (`/donor/availability`)

**Shows:**
- Match score as percentage: `82.2%`
- Status: PENDING, CONFIRMED, DECLINED
- Blood group needed
- Actions: Accept/Decline

**Code:**
```typescript
{reservation.mlScores?.combined
  ? `${(reservation.mlScores.combined * 100).toFixed(1)}%`
  : "N/A"}
```

### 2. Hospital Reservations Page (`/hospital/reservations`)

**Shows:**
- Match score for each reservation
- Donor ID
- Blood group
- Status
- Sorted by rank (highest score first)

**Code:**
```typescript
{reservation.mlScores?.combined
  ? `${(reservation.mlScores.combined * 100).toFixed(1)}%`
  : "N/A"}
```

### 3. Hospital Dashboard (`/hospital/dashboard`)

**Shows:**
- Match scores in recent reservations widget
- Example: "82% match"

## Verification Steps

### Step 1: Verify All Services Are Running

```bash
# Terminal 1: Check emulators
curl http://localhost:4000
# Should return HTML (Emulator UI)

# Terminal 2: Check ML API
curl http://localhost:8000/health
# Should return: {"status": "ok", "models_loaded": true}

# Terminal 3: Check Next.js
curl http://localhost:3000
# Should return HTML
```

### Step 2: Check Functions Are Loaded

1. Open Emulator UI: http://localhost:4000
2. Go to **Functions** tab
3. Verify functions are listed:
   - `onDonationRequestCreated`
   - `onDemandForecastCreated`
   - `onReservationStatusChanged`

### Step 3: Create a Test Request

**Option A: Via UI**
1. Login as hospital: `hospital1@example.com` / `password123`
2. Navigate to Hospital → Requests
3. Create a new request (O+, 2 units, CRITICAL)
4. Wait 10-15 seconds for ML processing

**Option B: Via Seed (if Functions are running)**
```bash
cd web
pnpm seed
```

### Step 4: Verify ML Outputs Were Created

1. Open Emulator UI: http://localhost:4000
2. Go to **Firestore** tab
3. Check collections:

**Expected Documents:**

1. **ml_outputs collection:**
   - `demand_{requestId}` - Demand forecasting result
   - `availability_{reservationId}` - Availability predictions (one per donor)
   - `reliability_{reservationId}` - Reliability predictions (one per donor)

2. **reservations collection:**
   - Multiple reservations with `mlScores` field:
     ```json
     {
       "mlScores": {
         "availability": 0.85,
         "reliability": 0.78,
         "combined": 0.822
       },
       "explanation": "High availability (85.0%) and good reliability (78.0%)...",
       "rank": 1
     }
     ```

### Step 5: Verify UI Shows ML Scores

1. **As Donor:**
   - Login: `donor1@example.com` / `password123`
   - Navigate to Donor → Availability
   - Should see reservations with match percentages (e.g., "82.2%")

2. **As Hospital:**
   - Login: `hospital1@example.com` / `password123`
   - Navigate to Hospital → Reservations
   - Should see reservations with match scores

## Troubleshooting

### Issue: No ML Outputs After Seeding

**Cause:** Functions weren't running when seed script executed

**Solution:**
1. Ensure all services are running (emulators, ML API)
2. Create a new request via UI (this will trigger Functions)
3. Or wait for Functions to process existing requests (may take a few minutes)

### Issue: ML Scores Show "N/A" in UI

**Possible Causes:**
1. ML processing hasn't completed yet (wait 10-15 seconds)
2. Functions failed to call ML API (check Functions logs)
3. ML API is not running (check http://localhost:8000/health)
4. No eligible donors found (check donors collection)

**Solution:**
1. Check Functions logs in Emulator UI
2. Verify ML API is running and accessible
3. Check Firestore for `ml_outputs` documents
4. Verify `reservations` have `mlScores` field

### Issue: Functions Not Triggering

**Check:**
1. Functions are loaded (Emulator UI → Functions tab)
2. Functions logs show execution
3. No errors in Functions logs

**Solution:**
1. Restart emulators: `firebase emulators:start`
2. Check Functions code compiles: `cd functions && npm run build`
3. Verify trigger paths match collection names

### Issue: ML API Calls Failing

**Check:**
1. ML API is running: `curl http://localhost:8000/health`
2. Functions can reach ML API (check Functions logs)
3. ML API returns valid responses

**Solution:**
1. Start ML API: `cd ml-backend && uvicorn ml_inference.api.main:app --reload --port 8000`
2. Check `functions/.env` has `ML_API_URL=http://localhost:8000`
3. Test ML API directly:
   ```bash
   curl -X POST http://localhost:8000/predict/demand \
     -H "Content-Type: application/json" \
     -d '{"region": 1, "blood_group": 1, "demand_units": 2, "supply_units": 0, "month": 1, "day": 15}'
   ```

## Expected Timeline

After creating a donation request:

- **0-1 seconds:** Request created in Firestore
- **1-2 seconds:** `onDonationRequestCreated` function executes
- **2-3 seconds:** ML API called for demand forecasting
- **3-4 seconds:** Demand forecast stored in `ml_outputs`
- **4-5 seconds:** `onDemandForecastCreated` function executes
- **5-10 seconds:** ML APIs called for each donor (availability + reliability)
- **10-15 seconds:** Reservations created with ML scores
- **15+ seconds:** UI updates in real-time showing match scores

## Summary

✅ **ML outputs ARE computed from the ML API**  
✅ **ML scores ARE displayed in the UI**  
⚠️ **BUT only if all services are running when requests are created**

**Key Points:**
- Seed script creates data, but ML processing requires Functions to be running
- ML processing happens automatically via Firebase Functions
- UI displays ML scores via real-time Firestore listeners
- All ML outputs are stored in `ml_outputs` collection for explainability

**To ensure ML outputs are generated:**
1. Start all services BEFORE seeding or creating requests
2. Wait 10-15 seconds after creating requests for ML processing
3. Verify ML outputs in Firestore (Emulator UI)
4. Check UI shows match scores
