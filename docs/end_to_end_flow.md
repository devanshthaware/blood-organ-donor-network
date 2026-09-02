# End-to-End Flow Validation

**Purpose:** Prove the system works from Hospital creates request → Donor accepts → Reservation confirmed.

---

## Complete Flow Timeline

### 1. Hospital Creates Donation Request

**Actor:** Hospital User  
**Action:** Submits form in Next.js UI

**Execution:**
1. User fills form: Blood Type (O+), Quantity (2), Urgency (CRITICAL)
2. Next.js calls `/api/requests/create` (API route)
3. API route validates input and user role
4. API route writes to Firestore: `donation_requests/{requestId}`
   ```json
   {
     "hospitalId": "hosp123",
     "bloodGroup": "O+",
     "quantity": 2,
     "urgency": "CRITICAL",
     "status": "PENDING",
     "createdAt": "2024-01-15T10:30:00Z",
     "createdBy": "hosp123"
   }
   ```

**Firestore Write:**
- ✅ `donation_requests/{requestId}` created

**Trigger:**
- ✅ `onDonationRequestCreated` Function fires

---

### 2. Function Calls Demand Forecasting ML

**Actor:** Firebase Function (`onDonationRequestCreated`)  
**Action:** Processes request creation

**Execution:**
1. Function reads `donation_requests/{requestId}`
2. Function gets hospital data to extract `region`
3. Function prepares ML input:
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
4. Function calls ML API: `POST /predict/demand`
5. ML API returns:
   ```json
   {
     "predicted_demand": 0.85
   }
   ```
6. Function writes to Firestore: `ml_outputs/demand_{requestId}`
   ```json
   {
     "requestId": "req789",
     "modelType": "demand_forecasting",
     "input": {...},
     "output": {"predicted_demand": 0.85},
     "timestamp": "2024-01-15T10:30:05Z",
     "modelVersion": "1.0.0"
   }
   ```
7. Function logs to `audit_logs`:
   ```json
   {
     "userId": "hosp123",
     "action": "REQUEST_CREATED",
     "resourceType": "donation_request",
     "resourceId": "req789",
     "result": "SUCCESS"
   }
   ```

**Firestore Writes:**
- ✅ `ml_outputs/demand_{requestId}` created
- ✅ `audit_logs/{logId}` created

**Trigger:**
- ✅ `onDemandForecastCreated` Function fires

---

### 3. Matching Engine Queries Eligible Donors

**Actor:** Firebase Function (`onDemandForecastCreated`)  
**Action:** Matches donors to request

**Execution:**
1. Function reads `ml_outputs/demand_{requestId}`
2. Function reads `donation_requests/{requestId}`
3. Function queries eligible donors:
   ```typescript
   db.collection("donors")
     .where("bloodGroup", "==", "O+")
     .where("isActive", "==", true)
     .where("lastDonationDate", "<", cutoffDate)
   ```
4. Function finds 5 eligible donors

**Firestore Reads:**
- ✅ `donation_requests/{requestId}` read
- ✅ `hospitals/{hospitalId}` read
- ✅ `donors` collection queried (5 results)

---

### 4. Matching Engine Scores Each Donor

**Actor:** Firebase Function (`onDemandForecastCreated`)  
**Action:** Calls ML APIs for each donor

**Execution (for each donor):**

**Donor 1 (donor456):**
1. Calculate distance: 12.5 km
2. Call Availability ML:
   ```json
   POST /predict/availability
   {
     "blood_group": 1,
     "distance_km": 12.5,
     "days_since_last_donation": 60,
     "past_acceptance_rate": 0.8,
     "urgency_level": 3,
     "time_of_day": 1
   }
   ```
   Response: `{"availability_probability": 0.85}`

3. Call Reliability ML:
   ```json
   POST /predict/reliability
   {
     "total_requests": 40,
     "accepted_requests": 32,
     "completed_donations": 28,
     "no_shows": 4,
     "avg_response_time_minutes": 12.5
   }
   ```
   Response: `{"reliability_score": 0.78}`

4. Calculate combined score: `(0.85 * 0.6) + (0.78 * 0.4) = 0.822`

5. Store ML outputs:
   - `ml_outputs/availability_temp_{requestId}_donor456`
   - `ml_outputs/reliability_temp_{requestId}_donor456`

**ML API Calls:**
- ✅ 5 availability predictions
- ✅ 5 reliability predictions (if donors have history)

**Firestore Writes:**
- ✅ 10 ML output documents created

---

### 5. Matching Engine Creates Reservations

**Actor:** Firebase Function (`onDemandForecastCreated`)  
**Action:** Creates ranked reservations

**Execution:**
1. Function sorts donors by combined score (descending)
2. Function creates top 4 reservations (2x quantity for buffer):

**Reservation 1:**
```json
{
  "requestId": "req789",
  "donorId": "donor456",
  "hospitalId": "hosp123",
  "status": "PENDING",
  "rank": 1,
  "mlScores": {
    "availability": 0.85,
    "reliability": 0.78,
    "combined": 0.822
  },
  "explanation": "High availability (85.0%) and good reliability (78.0%). Distance: 12.5 km.",
  "distanceKm": 12.5,
  "createdAt": "2024-01-15T10:30:15Z"
}
```

**Reservation 2-4:** Similar structure with lower ranks

**Firestore Writes:**
- ✅ 4 `reservations/{id}` documents created
- ✅ ML output documents updated with `reservationId`

**UI Updates:**
- ✅ Donor sees new reservation in real-time (Firestore listener)

---

### 6. Donor Views Request

**Actor:** Donor User  
**Action:** Opens requests page

**Execution:**
1. Next.js component uses `useReservations("donor")` hook
2. Hook sets up Firestore listener:
   ```typescript
   query(
     collection(db, "reservations"),
     where("donorId", "==", "donor456"),
     orderBy("createdAt", "desc")
   )
   ```
3. UI displays reservation with:
   - Hospital name
   - Blood type needed
   - Urgency level
   - Match score (82.2%)
   - Explanation text

**Firestore Reads:**
- ✅ Real-time listener active on `reservations` collection

---

### 7. Donor Accepts Reservation

**Actor:** Donor User  
**Action:** Clicks "Accept" button

**Execution:**
1. Next.js calls `/api/reservations/{id}/accept` (API route)
2. API route validates:
   - User is authenticated
   - Reservation belongs to user
   - Status is "PENDING"
3. API route updates Firestore: `reservations/{reservationId}`
   ```json
   {
     "status": "ACCEPTED",
     "acceptedAt": "2024-01-15T10:35:00Z"
   }
   ```

**Firestore Write:**
- ✅ `reservations/{reservationId}` updated (status: "ACCEPTED")

**Trigger:**
- ✅ `onReservationStatusChanged` Function fires

---

### 8. Function Confirms Reservation

**Actor:** Firebase Function (`onReservationStatusChanged`)  
**Action:** Processes acceptance

**Execution:**
1. Function detects status change: "PENDING" → "ACCEPTED"
2. Function updates reservation:
   ```json
   {
     "status": "CONFIRMED",
     "confirmedAt": "2024-01-15T10:35:01Z"
   }
   ```
3. Function updates donor stats:
   ```json
   {
     "acceptedRequests": 33  // was 32
   }
   ```
4. Function updates request status:
   ```json
   {
     "status": "FULFILLED",
     "fulfilledAt": "2024-01-15T10:35:01Z"
   }
   ```
5. Function logs to audit:
   ```json
   {
     "userId": "donor456",
     "action": "RESERVATION_ACCEPTED",
     "resourceType": "reservation",
     "resourceId": "res123",
     "result": "SUCCESS"
   }
   ```

**Firestore Writes:**
- ✅ `reservations/{reservationId}` updated (status: "CONFIRMED")
- ✅ `donors/{donorId}` updated (stats)
- ✅ `donation_requests/{requestId}` updated (status: "FULFILLED")
- ✅ `audit_logs/{logId}` created

**UI Updates:**
- ✅ Hospital sees reservation confirmed (real-time listener)
- ✅ Donor sees status updated (real-time listener)
- ✅ Other pending reservations for same request can be cancelled

---

## Complete Timeline Summary

| Time | Actor | Action | Firestore | ML Calls |
|------|-------|--------|-----------|----------|
| 10:30:00 | Hospital | Creates request | `donation_requests/{id}` created | - |
| 10:30:05 | Function | Calls demand ML | `ml_outputs/demand_{id}` created | 1 call |
| 10:30:10 | Function | Queries donors | - | - |
| 10:30:12 | Function | Scores donors | `ml_outputs/availability_{id}` x5 | 5 calls |
| 10:30:13 | Function | Scores donors | `ml_outputs/reliability_{id}` x5 | 5 calls |
| 10:30:15 | Function | Creates reservations | `reservations/{id}` x4 created | - |
| 10:30:16 | Donor | Views requests | Listener active | - |
| 10:35:00 | Donor | Accepts reservation | `reservations/{id}` updated | - |
| 10:35:01 | Function | Confirms reservation | Status → "CONFIRMED" | - |
| 10:35:01 | Function | Updates request | Status → "FULFILLED" | - |

**Total ML Calls:** 11 (1 demand + 5 availability + 5 reliability)  
**Total Firestore Writes:** ~20 documents  
**Total Time:** ~5 minutes (mostly waiting for donor response)

---

## Validation Checklist

### ✅ Flow Completeness

- [ ] Hospital can create request
- [ ] Function triggers on request creation
- [ ] ML API is called for demand forecasting
- [ ] ML output is stored in Firestore
- [ ] Matching engine queries eligible donors
- [ ] ML APIs are called for each donor (availability + reliability)
- [ ] Reservations are created with rankings
- [ ] Donor sees reservation in real-time
- [ ] Donor can accept reservation
- [ ] Function confirms reservation automatically
- [ ] Request status updates to FULFILLED
- [ ] All actions are logged to audit_logs

### ✅ Data Integrity

- [ ] All ML inputs match contract schema
- [ ] All ML outputs are stored with inputs
- [ ] Reservation rankings are correct
- [ ] Donor stats are updated correctly
- [ ] Request status transitions are valid

### ✅ Real-Time Updates

- [ ] Donor sees new reservations immediately
- [ ] Hospital sees reservation confirmations immediately
- [ ] Status changes propagate to all listeners

### ✅ Error Handling

- [ ] ML API timeout handled gracefully
- [ ] ML API errors stored in ml_outputs
- [ ] Invalid requests are rejected
- [ ] Missing data doesn't crash functions

---

## Testing the Flow

### Manual Test Steps

1. **Start all services:**
   ```bash
   # Terminal 1: Emulators
   firebase emulators:start
   
   # Terminal 2: ML API
   cd ml-backend && uvicorn ml_inference.api.main:app --reload
   
   # Terminal 3: Next.js
   cd web && npm run dev
   ```

2. **Create test hospital user:**
   - Use Emulator UI (http://localhost:4000)
   - Create user with role: "hospital"

3. **Create test donor users:**
   - Create 5 donors with bloodGroup: "O+"
   - Set different locations and stats

4. **Create donation request:**
   - Login as hospital
   - Navigate to Requests page
   - Create request: O+, 2 units, CRITICAL

5. **Verify:**
   - Check Functions logs for ML calls
   - Check Firestore for `ml_outputs` documents
   - Check Firestore for `reservations` documents
   - Login as donor, see reservation appear

6. **Accept reservation:**
   - Login as donor
   - Click "Accept" on reservation
   - Verify status changes to "CONFIRMED"
   - Verify request status changes to "FULFILLED"

---

## Expected Results

✅ **Success Criteria:**
- Request created in < 1 second
- ML predictions completed in < 10 seconds
- Reservations created in < 15 seconds
- Donor sees reservation in < 1 second (real-time)
- Reservation confirmed in < 1 second after acceptance
- All data is explainable (ML inputs/outputs stored)
- All actions are auditable (audit_logs created)

---

**This flow demonstrates the complete event-driven architecture working end-to-end.**
