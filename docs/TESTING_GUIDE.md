# VeinLink System - Comprehensive Testing Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Complete guide for testing all components of the VeinLink blood donation platform

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Health Checks](#quick-health-checks)
4. [Component Testing](#component-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Flow Testing](#end-to-end-flow-testing)
7. [UI/UX Testing](#uiux-testing)
8. [Security Testing](#security-testing)
9. [Performance Testing](#performance-testing)
10. [Error Handling Testing](#error-handling-testing)
11. [Automated Tests](#automated-tests)
12. [Test Data Management](#test-data-management)
13. [Verification Checklists](#verification-checklists)
14. [Troubleshooting](#troubleshooting)
15. [Test Scripts](#test-scripts)

---

## Overview

VeinLink is an event-driven, AI-powered blood donation platform with three main components:

1. **Next.js Frontend** - User interface for hospitals, donors, and admins
2. **Firebase Functions** - Event-driven backend that orchestrates ML calls
3. **ML Backend (FastAPI)** - Machine learning inference service

**Architecture Principle:** Frontend never calls ML directly. All ML decisions flow through Firebase Functions.

### Testing Strategy

- **Unit Tests:** ML backend modules
- **Integration Tests:** Firebase Functions + ML API
- **E2E Tests:** Complete user flows
- **Manual Tests:** UI/UX validation
- **Performance Tests:** Response times and load handling

---

## Prerequisites

Before testing, ensure:

- ✅ All services are installed and dependencies are up to date
- ✅ Firebase CLI is installed: `npm install -g firebase-tools`
- ✅ Node.js 18+ is installed
- ✅ Python 3.9+ is installed
- ✅ All three services can start without errors

### Initial Setup

```bash
# Install dependencies
cd functions && npm install
cd ../web && npm install
cd ../ml-backend && pip install fastapi uvicorn pandas scikit-learn joblib pydantic pytest

# Verify installations
firebase --version
node --version
python --version
```

---

## Quick Health Checks

### 1. Service Availability Tests

#### Test ML Backend Health
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "models_loaded": true
}
```

**Success Criteria:**
- Status code: 200
- Response contains `"status": "ok"`
- Response contains `"models_loaded": true`

#### Test Firebase Emulators
```bash
# Check if emulators are running
curl http://localhost:4000
```

**Expected:** HTML page loads (Emulator UI)

**Alternative Check:**
- Open browser: http://localhost:4000
- Should see Firebase Emulator Suite UI
- All emulators (Auth, Firestore, Functions) should show as "Running"

#### Test Next.js Frontend
```bash
curl http://localhost:3000
```

**Expected:** HTML page loads

**Alternative Check:**
- Open browser: http://localhost:3000
- Should see login page or application

### 2. Port Verification

Verify all required ports are available:

| Service | Port | Check Command |
|---------|------|---------------|
| Next.js | 3000 | `curl http://localhost:3000` |
| ML API | 8000 | `curl http://localhost:8000/health` |
| Emulator UI | 4000 | `curl http://localhost:4000` |
| Firestore | 8080 | Check Emulator UI |
| Functions | 5001 | Check Emulator UI |
| Auth | 9099 | Check Emulator UI |

---

## Component Testing

### 3. ML API Endpoint Testing

#### 3.1 Test Reliability Prediction

```bash
curl -X POST http://localhost:8000/predict/reliability \
  -H "Content-Type: application/json" \
  -d '{
    "total_requests": 40,
    "accepted_requests": 35,
    "completed_donations": 30,
    "no_shows": 5,
    "avg_response_time_minutes": 18.5
  }'
```

**Expected Response:**
```json
{
  "reliability_score": 0.85
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Response contains `reliability_score`
- ✅ Score is between 0.0 and 1.0
- ✅ Response time < 1 second

**Test Cases:**
1. **Valid Input:** Should return score between 0.0-1.0
2. **High Reliability:** `accepted_requests` close to `total_requests` → higher score
3. **Low Reliability:** High `no_shows` → lower score
4. **Invalid Input:** Missing fields → 422 error
5. **Edge Cases:** Zero values, negative values → handled gracefully

#### 3.2 Test Demand Forecasting

```bash
curl -X POST http://localhost:8000/predict/demand \
  -H "Content-Type: application/json" \
  -d '{
    "region": 1,
    "blood_group": 3,
    "demand_units": 120,
    "supply_units": 90,
    "month": 7,
    "day": 15
  }'
```

**Expected Response:**
```json
{
  "predicted_demand": 0.75
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Response contains `predicted_demand`
- ✅ Probability is between 0.0 and 1.0
- ✅ Response time < 1 second

**Test Cases:**
1. **High Demand:** `demand_units` > `supply_units` → higher probability
2. **Low Demand:** `supply_units` > `demand_units` → lower probability
3. **Seasonal:** Different months → different predictions
4. **Invalid Region/Blood Group:** Out of range → 422 error

#### 3.3 Test Availability Prediction

```bash
curl -X POST http://localhost:8000/predict/availability \
  -H "Content-Type: application/json" \
  -d '{
    "blood_group": 2,
    "distance_km": 8.5,
    "days_since_last_donation": 60,
    "past_acceptance_rate": 0.75,
    "urgency_level": 2,
    "time_of_day": 1
  }'
```

**Expected Response:**
```json
{
  "availability_probability": 0.7087
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Response contains `availability_probability`
- ✅ Probability is between 0.0 and 1.0
- ✅ Response time < 1 second

**Test Cases:**
1. **High Availability:** Low distance, high acceptance rate → higher probability
2. **Low Availability:** High distance, low acceptance rate → lower probability
3. **Recent Donation:** `days_since_last_donation` < 56 → lower probability
4. **Urgency Impact:** CRITICAL urgency → higher probability

### 4. Firebase Functions Testing

#### 4.1 Verify Functions Are Loaded

1. Open Emulator UI: http://localhost:4000
2. Navigate to **Functions** tab
3. Verify functions are listed:
   - `onDonationRequestCreated`
   - `onDemandForecastCreated`
   - `onReservationStatusChanged`

**Expected:** All three functions visible and no errors in logs

#### 4.2 Test Function Triggers

**Test `onDonationRequestCreated`:**

1. Create a donation request (via UI or API)
2. Check Functions logs in Emulator UI
3. Verify function executed

**Expected Behavior:**
- Function triggers within 1 second
- Function calls ML API: `POST /predict/demand`
- Function creates `ml_outputs/demand_{requestId}` document
- Function creates audit log entry

**Test `onDemandForecastCreated`:**

1. After demand forecast is created, check Functions logs
2. Verify function executed

**Expected Behavior:**
- Function triggers within 1 second
- Function queries eligible donors
- Function calls ML APIs for each donor (availability + reliability)
- Function creates reservations with rankings

**Test `onReservationStatusChanged`:**

1. Update reservation status (ACCEPTED or DECLINED)
2. Check Functions logs

**Expected Behavior:**
- Function triggers within 1 second
- Function updates reservation status to CONFIRMED (if ACCEPTED)
- Function updates request status to FULFILLED (if ACCEPTED)
- Function updates donor stats
- Function creates audit log entry

### 5. Firestore Testing

#### 5.1 Test Collections

Open Emulator UI → Firestore tab, verify collections exist:

- `users` - User profiles
- `donors` - Donor profiles with stats
- `hospitals` - Hospital profiles
- `donation_requests` - Blood donation requests
- `reservations` - Donor reservations
- `ml_outputs` - ML prediction results
- `audit_logs` - System audit trail
- `patients` - Hospital patient records
- `donation_history` - Historical donations

#### 5.2 Test Real-time Listeners

1. Open Next.js app: http://localhost:3000
2. Login as any user
3. Open browser DevTools → Network tab
4. Navigate to a page with data (e.g., Donor Dashboard)
5. Verify WebSocket connections are active

**Expected:** 
- WebSocket connection to Firestore emulator
- Real-time updates when data changes

#### 5.3 Test Security Rules

**Test as Donor:**
- ✅ Can read own donor profile
- ✅ Can read own reservations
- ✅ Cannot read other donors' profiles
- ✅ Cannot modify donation requests

**Test as Hospital:**
- ✅ Can create donation requests
- ✅ Can read own requests
- ✅ Can read reservations for own requests
- ✅ Cannot modify donor profiles

**Test as Admin:**
- ✅ Can read all collections
- ✅ Can read audit logs
- ✅ Can access admin pages

### 6. Authentication Testing

#### 6.1 Test User Login

**Test Donor Login:**
1. Go to http://localhost:3000
2. Click "Login"
3. Enter: `donor1@example.com` / `password123`
4. Click "Sign In"

**Expected:**
- Login succeeds
- Redirects to Donor Dashboard
- User role is "donor"
- Can access donor pages only

**Test Hospital Login:**
- Email: `hospital1@example.com` / `password123`
- Should redirect to Hospital Dashboard
- Role is "hospital"

**Test Admin Login:**
- Email: `admin@veinlink.com` / `admin123`
- Should redirect to Admin Dashboard
- Role is "admin"

#### 6.2 Test User Registration

1. Go to http://localhost:3000/register
2. Fill registration form
3. Submit

**Expected:**
- User created in Auth
- User profile created in Firestore `users` collection
- Role-based profile created (`donors` or `hospitals`)
- Redirects to appropriate dashboard

#### 6.3 Test Protected Routes

1. Try accessing protected pages without login
2. Try accessing pages with wrong role (e.g., donor accessing hospital pages)

**Expected:**
- Redirects to login page
- Shows appropriate error message

---

## Integration Testing

### 7. ML API + Functions Integration

#### 7.1 Test Demand Forecasting Flow

**Steps:**
1. Create donation request via UI
2. Monitor Functions logs
3. Check ML API is called
4. Verify ML output stored in Firestore

**Expected:**
- Function calls: `POST http://localhost:8000/predict/demand`
- ML API responds with `predicted_demand`
- Document created: `ml_outputs/demand_{requestId}`
- Document contains both input and output

**Verify in Firestore:**
```json
{
  "requestId": "...",
  "modelType": "demand_forecasting",
  "input": {
    "region": 1,
    "blood_group": 1,
    "demand_units": 2,
    "supply_units": 0,
    "month": 1,
    "day": 15
  },
  "output": {
    "predicted_demand": 0.85
  },
  "timestamp": "...",
  "modelVersion": "1.0.0"
}
```

#### 7.2 Test Donor Matching Flow

**Steps:**
1. Ensure demand forecast exists
2. Monitor Functions logs for `onDemandForecastCreated`
3. Check ML API calls for availability and reliability
4. Verify reservations created

**Expected:**
- Function queries eligible donors
- For each donor:
  - Calls `/predict/availability`
  - Calls `/predict/reliability`
- Creates `ml_outputs` documents for each prediction
- Creates `reservations` with rankings
- Reservations sorted by combined score

**Verify Reservations:**
- Each reservation has `rank` field (1, 2, 3, ...)
- Each reservation has `mlScores` object
- Each reservation has `explanation` text
- Reservations sorted by score (highest first)

### 8. Frontend + Backend Integration

#### 8.1 Test Request Creation Flow

**Steps:**
1. Login as hospital
2. Navigate to Hospital → Requests
3. Click "Create Request"
4. Fill form and submit

**Expected:**
- Request appears in list immediately
- Status is "PENDING"
- Request stored in Firestore
- Function triggers automatically
- ML processing begins

**Verify:**
- Check Firestore: `donation_requests/{id}` exists
- Check Functions logs: `onDonationRequestCreated` executed
- Check ML outputs: `ml_outputs/demand_{id}` created

#### 8.2 Test Reservation Acceptance Flow

**Steps:**
1. Login as donor
2. Navigate to Donor → Availability
3. See reservation (from previous test)
4. Click "Accept"

**Expected:**
- Reservation status changes to "CONFIRMED" immediately
- Request status changes to "FULFILLED"
- Donor stats updated
- Audit log created

**Verify:**
- Check Firestore: `reservations/{id}` status is "CONFIRMED"
- Check Firestore: `donation_requests/{id}` status is "FULFILLED"
- Check Firestore: `donors/{id}` stats updated
- Check Firestore: `audit_logs` has new entry

---

## End-to-End Flow Testing

### 9. Complete Donation Request Flow

This is the **primary test** that validates the entire system.

#### Prerequisites

1. **Seed Test Data:**
   ```bash
   cd web
   npm run seed
   ```

   This creates:
   - 3 donor users
   - 2 hospital users
   - 1 admin user
   - Sample data

2. **Start All Services:**
   - Terminal 1: `firebase emulators:start`
   - Terminal 2: `cd ml-backend && uvicorn ml_inference.api.main:app --reload --port 8000`
   - Terminal 3: `cd web && npm run dev`

#### Test Steps

**Step 1: Login as Hospital**
1. Open http://localhost:3000
2. Login: `hospital1@example.com` / `password123`
3. Verify: Redirects to Hospital Dashboard
4. Navigate to **Hospital → Requests**

**Step 2: Create Donation Request**
1. Click "Create Request" or "New Request"
2. Fill form:
   - **Blood Group:** O+
   - **Quantity:** 2
   - **Urgency:** CRITICAL
   - **Due Date:** 2 days from now
   - **Notes:** "Emergency surgery requirement"
3. Submit

**Step 3: Verify Request Creation**
- ✅ Request appears in list immediately (< 1 second)
- ✅ Status is "PENDING"
- ✅ Check Firestore: `donation_requests/{id}` exists
- ✅ Check Functions logs: `onDonationRequestCreated` executed

**Step 4: Verify ML Processing**
1. Open Emulator UI: http://localhost:4000
2. Go to **Firestore** tab
3. Check `ml_outputs` collection:
   - ✅ `demand_{requestId}` document exists
   - ✅ Contains input and output
   - ✅ `predicted_demand` value is between 0.0-1.0

4. Check Functions logs:
   - ✅ `onDonationRequestCreated` called ML API
   - ✅ `onDemandForecastCreated` executed
   - ✅ Multiple ML API calls for availability/reliability

**Step 5: Verify Reservations Created**
1. In Firestore, check `reservations` collection
2. Should see 2-4 reservations (depending on eligible donors)
3. Each reservation should have:
   - ✅ `status: "PENDING"`
   - ✅ `rank` field (1, 2, 3, etc.)
   - ✅ `mlScores` object with availability and reliability
   - ✅ `explanation` text
   - ✅ `requestId` matches the request

**Step 6: Login as Donor**
1. Open new browser window/incognito: http://localhost:3000
2. Login: `donor1@example.com` / `password123`
3. Navigate to **Donor → Availability** or **Donor → Requests**

**Step 7: Verify Real-time Updates**
- ✅ Reservation appears in real-time (< 1 second after creation)
- ✅ Shows hospital name
- ✅ Shows blood type needed
- ✅ Shows urgency level
- ✅ Shows match score/explanation

**Step 8: Accept Reservation**
1. Click "Accept" on the reservation
2. Wait 1-2 seconds

**Step 9: Verify Confirmation**
- ✅ Reservation status changes to "CONFIRMED"
- ✅ Check Functions logs: `onReservationStatusChanged` executed
- ✅ Check Firestore:
  - `reservations/{id}` status is "CONFIRMED"
  - `donation_requests/{id}` status is "FULFILLED"
  - `donors/{donorId}` stats updated (acceptedRequests incremented)
  - `audit_logs` has new entry

**Step 10: Verify Hospital View**
1. Go back to hospital browser window
2. Navigate to **Hospital → Reservations**

**Expected:**
- ✅ Reservation shows as "CONFIRMED"
- ✅ Request shows as "FULFILLED"
- ✅ Updates appear in real-time

### 10. Alternative Flows

#### 10.1 Test Reservation Decline

1. Create request (as hospital)
2. Login as donor
3. Click "Decline" on reservation
4. Verify:
   - Reservation status: "DECLINED"
   - Request remains "PENDING"
   - Next ranked donor can still accept

#### 10.2 Test Multiple Donors

1. Create request for blood type with multiple eligible donors
2. Verify:
   - Multiple reservations created
   - Rankings are correct
   - Top-ranked donor accepts → request fulfilled
   - Other reservations can be cancelled

#### 10.3 Test No Eligible Donors

1. Create request for rare blood type (e.g., AB-)
2. Verify:
   - No reservations created
   - Request remains "PENDING"
   - Appropriate message shown

---

## UI/UX Testing

### 11. Page Navigation Testing

#### 11.1 Donor Pages

Test each donor page:
- ✅ **Dashboard** - Shows stats and recent activity
- ✅ **Requests** - Lists available donation requests
- ✅ **Availability** - Shows reservations (pending/confirmed)
- ✅ **History** - Shows donation history
- ✅ **Profile** - Shows and allows editing profile

#### 11.2 Hospital Pages

Test each hospital page:
- ✅ **Dashboard** - Shows requests and reservations overview
- ✅ **Requests** - Create and view donation requests
- ✅ **Reservations** - View incoming reservations
- ✅ **Patients** - Manage patient records
- ✅ **Alerts** - View system alerts
- ✅ **Profile** - Hospital profile management

#### 11.3 Admin Pages

Test each admin page:
- ✅ **Dashboard** - System overview
- ✅ **AI Monitor** - ML model performance
- ✅ **Audit Logs** - System audit trail
- ✅ **Profile** - Admin profile

### 12. Form Validation Testing

#### 12.1 Request Creation Form

Test validation:
- ✅ Required fields enforced
- ✅ Blood group selection works
- ✅ Quantity must be positive integer
- ✅ Due date must be in future
- ✅ Urgency level selection works
- ✅ Invalid data shows error messages

#### 12.2 User Registration Form

Test validation:
- ✅ Email format validation
- ✅ Password strength requirements
- ✅ Role selection (donor/hospital)
- ✅ Required fields enforced
- ✅ Duplicate email detection

### 13. Real-time Updates Testing

#### 13.1 Test Real-time Data Updates

1. Open two browser windows:
   - Window 1: Hospital view
   - Window 2: Donor view

2. Create request in Window 1
3. Verify: Reservation appears in Window 2 immediately

4. Accept reservation in Window 2
5. Verify: Status updates in Window 1 immediately

**Expected:** All updates appear within 1 second

---

## Security Testing

### 14. Authentication & Authorization

#### 14.1 Test Unauthorized Access

1. Try accessing protected pages without login
2. Try accessing pages with wrong role
3. Try accessing API endpoints without auth

**Expected:**
- Redirects to login
- Returns 401/403 errors
- No data exposed

#### 14.2 Test Firestore Security Rules

**Test as Donor:**
- ✅ Can read own data only
- ✅ Cannot modify requests
- ✅ Cannot read other donors' data

**Test as Hospital:**
- ✅ Can create requests
- ✅ Can read own requests and reservations
- ✅ Cannot modify donor data

**Test as Admin:**
- ✅ Can read all data
- ✅ Can access audit logs

### 15. Input Validation

#### 15.1 Test SQL Injection (N/A - No SQL)

Not applicable (Firestore is NoSQL)

#### 15.2 Test XSS Prevention

1. Try entering script tags in forms
2. Verify: Scripts are sanitized/escaped

#### 15.3 Test API Input Validation

1. Send invalid data to ML API
2. Send invalid data to Next.js API routes

**Expected:**
- Returns 422 (Unprocessable Entity)
- Error messages are clear
- No crashes or data corruption

---

## Performance Testing

### 16. Response Time Testing

#### 16.1 Expected Response Times

| Operation | Expected Time | Max Acceptable |
|-----------|---------------|----------------|
| Request Creation | < 1 second | 2 seconds |
| ML Demand Prediction | < 1 second | 2 seconds |
| ML Availability (per donor) | < 1 second | 2 seconds |
| ML Reliability (per donor) | < 1 second | 2 seconds |
| Reservation Creation | < 15 seconds | 30 seconds |
| Real-time UI Update | < 1 second | 2 seconds |
| Reservation Confirmation | < 1 second | 2 seconds |

#### 16.2 Load Testing

**Test Concurrent Requests:**
1. Create 5 requests simultaneously
2. Monitor Functions logs
3. Verify all process correctly
4. Check for errors or timeouts

**Test Multiple Donors:**
1. Create request with 10 eligible donors
2. Verify all donors get reservations
3. Verify rankings are correct
4. Verify performance is acceptable

---

## Error Handling Testing

### 17. ML API Error Scenarios

#### 17.1 ML API Down

**Test:**
1. Stop ML service
2. Create donation request
3. Monitor Functions logs

**Expected:**
- Function handles error gracefully
- Error stored in `ml_outputs` with error details
- System doesn't crash
- Appropriate error message logged

#### 17.2 ML API Timeout

**Test:**
1. Simulate slow ML API response (> 60 seconds)
2. Create request

**Expected:**
- Function times out gracefully
- Error logged
- System continues to function

#### 17.3 Invalid ML API Response

**Test:**
1. Mock ML API to return invalid response
2. Create request

**Expected:**
- Function handles invalid response
- Error logged
- No data corruption

### 18. Firestore Error Scenarios

#### 18.1 Missing Data

**Test:**
1. Delete required document (e.g., hospital profile)
2. Try to create request

**Expected:**
- Function handles missing data gracefully
- Error logged
- Appropriate error message

#### 18.2 Permission Denied

**Test:**
1. Try to access data without permission
2. Try to modify data without permission

**Expected:**
- Security rules enforce permissions
- Returns 403 error
- No data exposed

### 19. Network Error Scenarios

#### 19.1 Network Interruption

**Test:**
1. Disconnect network temporarily
2. Try to create request
3. Reconnect network

**Expected:**
- Error message shown to user
- Operation can be retried
- No data loss

---

## Automated Tests

### 20. ML Backend Tests

#### 20.1 Run All Tests

```bash
cd ml-backend
python -m pytest ml_inference/tests/ -v
```

**Expected Output:**
```
test_api.py::test_health PASSED
test_api.py::test_reliability PASSED
test_api.py::test_demand PASSED
test_api.py::test_availability PASSED
test_reliability.py::test_reliability_prediction PASSED
test_demand.py::test_demand_prediction PASSED
test_availability.py::test_availability_prediction PASSED
```

#### 20.2 Run Specific Test Suites

```bash
# Test API endpoints
python -m pytest ml_inference/tests/test_api.py -v

# Test reliability module
python -m pytest ml_inference/tests/test_reliability.py -v

# Test demand module
python -m pytest ml_inference/tests/test_demand.py -v

# Test availability module
python -m pytest ml_inference/tests/test_availability.py -v
```

#### 20.3 Test Coverage

```bash
# Install coverage tool
pip install pytest-cov

# Run with coverage
python -m pytest ml_inference/tests/ --cov=ml_inference --cov-report=html
```

---

## Test Data Management

### 21. Seed Data

#### 21.1 Run Seed Script

```bash
cd web
npm run seed
```

**Creates:**
- 3 donor users (donor1@example.com, donor2@example.com, donor3@example.com)
- 2 hospital users (hospital1@example.com, hospital2@example.com)
- 1 admin user (admin@veinlink.com)
- Sample donation requests
- Sample patients
- Donation history

**Passwords:**
- Donors & Hospitals: `password123`
- Admin: `admin123`

#### 21.2 Manual Test Data Creation

**Via Emulator UI:**
1. Open http://localhost:4000
2. Go to **Authentication** tab
3. Create users manually
4. Go to **Firestore** tab
5. Create documents manually

**Via API:**
- Use seed script or create via Next.js UI

### 22. Data Cleanup

#### 22.1 Reset Emulator Data

```bash
# Stop emulators
# Restart without import
firebase emulators:start
```

**Note:** Emulator data is lost on restart unless exported.

#### 22.2 Export/Import Data

```bash
# Export data
firebase emulators:export ./emulator-data

# Import data
firebase emulators:start --import=./emulator-data
```

---

## Verification Checklists

### 23. Pre-Deployment Checklist

- [ ] All services start without errors
- [ ] ML API health check passes
- [ ] All ML endpoints return valid responses
- [ ] Firebase Functions load correctly
- [ ] Firestore collections accessible
- [ ] Authentication works (login/register)
- [ ] End-to-end flow completes successfully
- [ ] Real-time updates work
- [ ] Security rules enforced
- [ ] Error handling works
- [ ] Performance meets requirements
- [ ] All automated tests pass

### 24. Component Checklist

#### ML API
- [ ] Health endpoint works
- [ ] Reliability prediction works
- [ ] Demand forecasting works
- [ ] Availability prediction works
- [ ] Error handling works
- [ ] Response times acceptable

#### Firebase Functions
- [ ] All functions load
- [ ] `onDonationRequestCreated` triggers correctly
- [ ] `onDemandForecastCreated` triggers correctly
- [ ] `onReservationStatusChanged` triggers correctly
- [ ] ML API calls succeed
- [ ] Firestore writes succeed
- [ ] Error handling works

#### Frontend
- [ ] All pages load
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] Real-time updates work
- [ ] Authentication works
- [ ] Role-based access works
- [ ] Error messages display correctly

### 25. Flow Checklist

#### Request Creation Flow
- [ ] Hospital can create request
- [ ] Request stored in Firestore
- [ ] Function triggers
- [ ] ML API called
- [ ] ML output stored
- [ ] Reservations created
- [ ] Donors see reservations

#### Reservation Acceptance Flow
- [ ] Donor sees reservation
- [ ] Donor can accept
- [ ] Status updates correctly
- [ ] Request status updates
- [ ] Donor stats updated
- [ ] Audit log created
- [ ] Hospital sees confirmation

---

## Troubleshooting

### 26. Common Issues

#### Issue: ML API Not Responding

**Symptoms:**
- `curl http://localhost:8000/health` fails
- Functions logs show "ECONNREFUSED"

**Solutions:**
1. Check if ML service is running:
   ```bash
   cd ml-backend
   uvicorn ml_inference.api.main:app --reload --port 8000
   ```
2. Check port 8000 is available:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   
   # Linux/Mac
   lsof -i :8000
   ```
3. Verify model files exist:
   ```bash
   ls ml-backend/ml_inference/models/*.joblib
   ```

#### Issue: Functions Not Triggering

**Symptoms:**
- Creating documents doesn't trigger functions
- No logs in Functions tab

**Solutions:**
1. Check Functions are running (Emulator UI)
2. Verify Functions code compiles:
   ```bash
   cd functions
   npm run build
   ```
3. Check Functions logs for errors
4. Restart emulators

#### Issue: Real-time Updates Not Working

**Symptoms:**
- UI doesn't update when Firestore changes
- Data appears stale

**Solutions:**
1. Check browser console for WebSocket errors
2. Verify Firestore emulator is running (port 8080)
3. Check Firestore connection in `web/src/lib/firebase.ts`
4. Verify development mode (emulators connect automatically)

#### Issue: Authentication Fails

**Symptoms:**
- Can't login
- "User not found" errors

**Solutions:**
1. Run seed script:
   ```bash
   cd web
   npm run seed
   ```
2. Check Auth emulator is running (port 9099)
3. Verify user exists in Emulator UI → Authentication tab
4. Check custom claims (roles) are set correctly

#### Issue: ML Predictions Return Errors

**Symptoms:**
- Functions logs show ML API errors
- Invalid response from ML API

**Solutions:**
1. Test ML API directly (see Component Testing section)
2. Check ML API logs for errors
3. Verify input data matches ML contract
4. Check model files are loaded correctly

#### Issue: Reservations Not Created

**Symptoms:**
- Request created but no reservations appear
- Functions logs show errors

**Solutions:**
1. Check if eligible donors exist:
   - Blood group matches request
   - `isActive: true`
   - `lastDonationDate` allows new donation
2. Check Functions logs for matching errors
3. Verify ML API calls succeeded (check `ml_outputs` collection)
4. Check Firestore indexes are created

---

## Test Scripts

### 27. Quick Health Check Script

**Windows (`test-health.bat`):**
```batch
@echo off
echo Testing VeinLink System Health...
echo.

echo 1. Testing ML API Health...
curl -s http://localhost:8000/health
echo.
echo.

echo 2. Testing ML API Reliability...
curl -s -X POST http://localhost:8000/predict/reliability -H "Content-Type: application/json" -d "{\"total_requests\": 40, \"accepted_requests\": 35, \"completed_donations\": 30, \"no_shows\": 5, \"avg_response_time_minutes\": 18.5}"
echo.
echo.

echo 3. Testing Emulators (check http://localhost:4000 manually)
echo 4. Testing Next.js (check http://localhost:3000 manually)
echo.
echo Health check complete!
pause
```

**Linux/Mac (`test-health.sh`):**
```bash
#!/bin/bash
echo "Testing VeinLink System Health..."
echo ""

echo "1. Testing ML API Health..."
curl -s http://localhost:8000/health | jq .
echo ""

echo "2. Testing ML API Reliability..."
curl -s -X POST http://localhost:8000/predict/reliability \
  -H "Content-Type: application/json" \
  -d '{"total_requests": 40, "accepted_requests": 35, "completed_donations": 30, "no_shows": 5, "avg_response_time_minutes": 18.5}' | jq .
echo ""

echo "3. Testing Emulators (check http://localhost:4000 manually)"
echo "4. Testing Next.js (check http://localhost:3000 manually)"
echo ""
echo "Health check complete!"
```

### 28. E2E Test Script

Create a script that:
1. Seeds data
2. Creates request
3. Verifies ML processing
4. Verifies reservations
5. Accepts reservation
6. Verifies confirmation

(Implementation depends on your testing framework)

---

## Test Reporting

### 29. Test Results Template

**Test Execution Report:**

```
Date: [Date]
Tester: [Name]
Environment: Local Development

Service Health:
- ML API: ✅ PASS
- Firebase Emulators: ✅ PASS
- Next.js: ✅ PASS

Component Tests:
- ML API Endpoints: ✅ PASS (4/4)
- Firebase Functions: ✅ PASS (3/3)
- Firestore: ✅ PASS
- Authentication: ✅ PASS

Integration Tests:
- ML + Functions: ✅ PASS
- Frontend + Backend: ✅ PASS

E2E Tests:
- Request Creation Flow: ✅ PASS
- Reservation Acceptance: ✅ PASS

Performance:
- Request Creation: 0.8s ✅
- ML Processing: 8.5s ✅
- Reservation Creation: 12s ✅
- Real-time Updates: 0.5s ✅

Issues Found: [List any issues]
```

---

## Conclusion

This testing guide provides comprehensive coverage of all VeinLink system components. Follow the checklists and test procedures to ensure system reliability before deployment.

**Key Testing Priorities:**
1. ✅ End-to-end flow (most critical)
2. ✅ ML API functionality
3. ✅ Real-time updates
4. ✅ Security rules
5. ✅ Error handling

**Remember:** Always test in the emulator environment before deploying to production!

---

**For additional help:**
- See `docs/end_to_end_flow.md` for detailed flow documentation
- See `docs/ml_contract.md` for ML API specifications
- See `docs/firestore_data_model.md` for data structure
- See `docs/production_readiness.md` for deployment checklist
