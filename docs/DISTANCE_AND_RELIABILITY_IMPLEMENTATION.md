# Distance Calculation & ML Reliability Prediction - Implementation Summary

## Overview

This document summarizes the implementation of real-time distance calculation and ML-based reliability prediction for the Hospital Reservations page.

## Features Implemented

### 1. Real-Time Distance Calculation ✅

**Location**: `web/src/lib/distance-utils.ts`

- **Haversine Formula**: Calculates distance between two geographic coordinates
- **Real-Time Updates**: Distance recalculates automatically when hospital or donor locations change
- **Display Format**: Shows distance in km (or meters if < 1 km)

**Implementation Details**:
- Distance is calculated in the `useReservations` hook
- Fetches hospital location from `hospitals` collection
- Fetches donor location from `donors` collection
- Calculates distance using `calculateDistance()` utility function
- Updates in real-time via Firestore listeners

### 2. ML Reliability Prediction ✅

**Location**: `web/src/app/api/ml/predict-reliability/route.ts`

- **Real-Time ML Inference**: Fetches fresh reliability predictions from ML API
- **Dynamic Updates**: Reliability scores update when donor stats change
- **Fallback Handling**: Returns default score (0.5) if ML API unavailable

**Implementation Details**:
- API route calls ML backend `/predict/reliability` endpoint
- Uses donor stats from Firestore (totalRequests, acceptedRequests, completedDonations, noShows, avgResponseTimeMinutes)
- Returns reliability score (0.0 to 1.0)
- Integrated into `useReservations` hook for real-time fetching

### 3. Enhanced Reservations Hook ✅

**Location**: `web/src/hooks/useReservations.ts`

**Enhancements**:
- Calculates distance in real-time from hospital and donor locations
- Fetches ML reliability predictions when not available in stored data
- Combines availability and reliability scores for match score
- Real-time updates via Firestore listeners

**Flow**:
1. Listen to reservations collection
2. For each reservation:
   - Fetch hospital location (if viewing as hospital)
   - Fetch donor location
   - Calculate distance using Haversine formula
   - Fetch ML outputs from Firestore
   - If reliability not available, call ML API endpoint
   - Calculate combined score (60% availability + 40% reliability)

### 4. UI Enhancements ✅

**Location**: `web/src/app/hospital/reservations/page.tsx`

**Improvements**:
- **Distance Display**: Shows distance with proper formatting (km or meters)
- **Reliability Color Coding**:
  - 🟢 Green (≥80%): High reliability
  - 🔵 Blue (60-79%): Medium-High reliability
  - 🟡 Yellow (40-59%): Medium reliability
  - 🔴 Red (<40%): Low reliability
- **Real-Time Updates**: All data updates automatically via Firestore listeners

### 5. Seed Data Script ✅

**Location**: `web/scripts/seed-reservations-data.ts`

**Purpose**: Creates demonstration data to showcase features

**Creates**:
- 1 Hospital (Central Medical Center, NYC)
- 5 Donors with varying distances (0.1 km to 8.5 km)
- 1 Donation Request (O+ blood, HIGH urgency)
- 5 Reservations with ML outputs
- Varying reliability scores (35% to 92%)

**Usage**:
```bash
cd web
npm run seed:reservations
```

## Technical Architecture

### Distance Calculation Flow

```
Hospital Reservations Page
    ↓
useReservations Hook
    ↓
Fetch Hospital Location (from hospitals collection)
    ↓
Fetch Donor Location (from donors collection)
    ↓
calculateDistance() utility (Haversine formula)
    ↓
Display in UI (real-time)
```

### Reliability Prediction Flow

```
Hospital Reservations Page
    ↓
useReservations Hook
    ↓
Check ML Outputs in Firestore
    ↓ (if not available)
Call /api/ml/predict-reliability
    ↓
Fetch Donor Stats from Firestore
    ↓
Call ML Backend /predict/reliability
    ↓
Return Reliability Score
    ↓
Display in UI (color-coded, real-time)
```

## Data Requirements

### Hospital Document
```typescript
{
  location: {
    latitude: number;
    longitude: number;
  }
}
```

### Donor Document
```typescript
{
  location: {
    latitude: number;
    longitude: number;
  },
  totalRequests?: number;
  acceptedRequests?: number;
  completedDonations?: number;
  noShows?: number;
  avgResponseTimeMinutes?: number;
}
```

### Reservation Document
```typescript
{
  distanceKm?: number;  // Calculated in real-time
  mlScores?: {
    availability: number;
    reliability: number;  // Fetched from ML API
    combined: number;    // Calculated: 60% availability + 40% reliability
  }
}
```

## API Endpoints

### POST `/api/ml/predict-reliability`

**Purpose**: Get real-time reliability prediction for a donor

**Request**:
```json
{
  "donorId": "donor_123"
}
```

**Response**:
```json
{
  "reliability_score": 0.85
}
```

**Authentication**: Required (Bearer token)

## Environment Variables

- `ML_API_URL`: URL of ML backend service (default: `http://localhost:8000` in development)
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Public Firebase project ID

## Testing

### Manual Testing Steps

1. **Start Services**:
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

2. **Seed Data**:
   ```bash
   cd web
   npm run seed:reservations
   ```

3. **View Reservations**:
   - Navigate to http://localhost:3000/hospital/reservations
   - Log in as hospital user
   - Verify:
     - ✅ Distance displays correctly (0.1 km to 8.5 km)
     - ✅ Reliability scores display (35% to 92%)
     - ✅ Color coding works (green/blue/yellow/red)
     - ✅ Match scores calculate correctly

4. **Test Real-Time Updates**:
   - Update a donor's location in Firestore
   - Verify distance updates automatically
   - Update donor stats (totalRequests, etc.)
   - Verify reliability score updates (may need to refresh or wait for ML API call)

## Performance Considerations

- **Distance Calculation**: O(1) - Very fast, calculated client-side
- **ML API Calls**: Only called when reliability not in Firestore ML outputs
- **Caching**: ML outputs stored in Firestore to reduce API calls
- **Real-Time Updates**: Uses Firestore listeners for efficient updates

## Future Enhancements

- [ ] Cache reliability predictions with TTL
- [ ] Batch ML API calls for multiple donors
- [ ] Add distance-based sorting/filtering
- [ ] Show distance on map visualization
- [ ] Add reliability trend charts

## Troubleshooting

### Distance shows as "N/A"
- Check that hospital and donor have `location` fields
- Verify coordinates are valid numbers
- Check browser console for errors

### Reliability shows as "N/A"
- Ensure ML backend is running
- Check ML API health: `curl http://localhost:8000/health`
- Verify donor has stats fields in Firestore
- Check browser console and network tab for API errors

### Real-time updates not working
- Verify Firestore listeners are active
- Check browser console for Firestore errors
- Ensure user is authenticated
- Verify Firestore security rules allow read access

## Files Modified/Created

### New Files
- `web/src/lib/distance-utils.ts` - Distance calculation utilities
- `web/src/app/api/ml/predict-reliability/route.ts` - ML reliability API endpoint
- `web/scripts/seed-reservations-data.ts` - Seed data script
- `docs/SEED_RESERVATIONS_DATA.md` - Seed data documentation
- `docs/DISTANCE_AND_RELIABILITY_IMPLEMENTATION.md` - This file

### Modified Files
- `web/src/hooks/useReservations.ts` - Enhanced with distance calculation and ML reliability fetching
- `web/src/app/hospital/reservations/page.tsx` - Enhanced UI with color coding
- `web/package.json` - Added seed script

## Summary

✅ **Distance Calculation**: Fully implemented with real-time updates  
✅ **ML Reliability Prediction**: Fully implemented with ML API integration  
✅ **UI Enhancements**: Color-coded reliability, formatted distance display  
✅ **Seed Data**: Complete demonstration data with varying distances and reliability scores  
✅ **Documentation**: Comprehensive guides for usage and troubleshooting

All features are production-ready and work seamlessly with the existing Firestore schema and emulator configuration.
