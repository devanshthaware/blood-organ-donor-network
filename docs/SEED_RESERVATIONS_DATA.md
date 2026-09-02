# Seed Reservations Data Guide

This guide explains how to seed demonstration data for the Hospital Reservations page, showing distance calculation and ML reliability prediction features.

## Overview

The seed script creates:
- **1 Hospital** with a known location (New York City - Central)
- **5 Donors** with varying distances from the hospital (0.1 km to 8.5 km)
- **1 Donation Request** (O+ blood, HIGH urgency)
- **5 Reservations** linking donors to the request
- **ML Outputs** with varying reliability scores (35% to 92%)

## Prerequisites

1. Firebase emulators running (or production Firebase project configured)
2. ML backend service running (for real-time reliability predictions)
3. Node.js dependencies installed in `web/` directory

## Running the Seed Script

### Option 1: Using npm script (Recommended)

```bash
cd web
npm run seed:reservations
```

### Option 2: Using tsx directly

```bash
cd web
npx tsx scripts/seed-reservations-data.ts
```

## What Gets Created

### Hospital
- **ID**: `seed_hospital_001`
- **Email**: `hospital@veinlink.demo`
- **Location**: 40.7589°N, 73.9851°W (New York City - Central)
- **Name**: Central Medical Center

### Donors

| Donor | Distance | Reliability | Stats |
|-------|----------|-------------|-------|
| Donor 1 - Close | 0.7 km | 92% (High) | Excellent donor history |
| Donor 2 - Medium | 1.2 km | 75% (Medium-High) | Good donor history |
| Donor 3 - Far | 8.5 km | 58% (Medium) | Average donor history |
| Donor 4 - Very Close | 0.1 km | 35% (Low-Medium) | Below average history |
| Donor 5 - Medium-Far | 5.2 km | 82% (High) | Very good donor history |

### Donation Request
- **ID**: `seed_request_001`
- **Blood Group**: O+
- **Quantity**: 3 units
- **Urgency**: HIGH
- **Status**: PENDING

### Reservations
Each reservation includes:
- Real-time calculated distance from hospital to donor
- ML-predicted reliability score
- Combined match score (60% availability + 40% reliability)
- ML output documents in `ml_outputs` collection

## Viewing the Data

1. **Start the application**:
   ```bash
   # Terminal 1: Firebase Emulators
   firebase emulators:start
   
   # Terminal 2: ML Backend
   cd ml-backend
   uvicorn ml_inference.api.main:app --reload --port 8000
   
   # Terminal 3: Next.js
   cd web
   npm run dev
   ```

2. **Run the seed script**:
   ```bash
   cd web
   npm run seed:reservations
   ```

3. **Log in as hospital**:
   - Use the Firebase Auth emulator UI (http://localhost:4000)
   - Create a user with email: `hospital@veinlink.demo`
   - Or use the existing hospital user if already created

4. **View reservations**:
   - Navigate to: http://localhost:3000/hospital/reservations
   - You should see all 5 reservations with:
     - **Distance**: Calculated in real-time from coordinates
     - **Reliability**: ML-predicted scores (35% to 92%)
     - **Match Score**: Combined availability + reliability

## Features Demonstrated

### 1. Real-Time Distance Calculation
- Distance is calculated using the Haversine formula
- Based on hospital and donor location coordinates
- Updates automatically when locations change
- Displayed in km (or meters if < 1 km)

### 2. ML Reliability Prediction
- Reliability scores are fetched from ML API in real-time
- Based on donor history (requests, acceptances, completions, no-shows)
- Color-coded in UI:
  - **Green** (≥80%): High reliability
  - **Blue** (60-79%): Medium-High reliability
  - **Yellow** (40-59%): Medium reliability
  - **Red** (<40%): Low reliability

### 3. Combined Match Score
- Weighted combination: 60% availability + 40% reliability
- Helps hospitals prioritize which donors to contact first

## Data Structure

### Reservation Document
```json
{
  "requestId": "seed_request_001",
  "donorId": "seed_donor_001",
  "hospitalId": "seed_hospital_001",
  "status": "PENDING",
  "rank": 1,
  "mlScores": {
    "availability": 0.85,
    "reliability": 0.92,
    "combined": 0.878
  },
  "distanceKm": 0.7,
  "explanation": "Donor 1 - Close: Availability 85.0%, Reliability 92.0%, Combined 87.8%. Distance: 0.7 km.",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### ML Output Documents
- `ml_outputs/availability_{reservationId}` - Availability prediction
- `ml_outputs/reliability_{reservationId}` - Reliability prediction

## Troubleshooting

### No reservations showing
- Check that the seed script ran successfully
- Verify Firebase emulators are running
- Check browser console for errors

### Distance showing as "N/A"
- Ensure hospital and donor documents have `location` fields with `latitude` and `longitude`
- Check that the hospital user ID matches `seed_hospital_001`

### Reliability showing as "N/A"
- Ensure ML backend is running on port 8000
- Check that ML API is accessible: `http://localhost:8000/health`
- Verify donor documents have stats fields (totalRequests, acceptedRequests, etc.)

### ML API not responding
- Start ML backend: `cd ml-backend && uvicorn ml_inference.api.main:app --reload --port 8000`
- Check ML API health: `curl http://localhost:8000/health`
- Verify `ML_API_URL` environment variable if using production

## Cleaning Up

To remove seed data:

```bash
# Using Firebase CLI (if connected to emulator)
firebase firestore:delete --all-collections --yes

# Or manually delete via Emulator UI
# Navigate to http://localhost:4000 and delete collections:
# - reservations
# - donation_requests
# - donors
# - hospitals
# - users
# - ml_outputs
```

## Next Steps

After seeding:
1. Test distance calculation by updating donor locations
2. Test reliability prediction by updating donor stats
3. Verify real-time updates work when data changes
4. Test the complete flow: accept reservation → complete donation
