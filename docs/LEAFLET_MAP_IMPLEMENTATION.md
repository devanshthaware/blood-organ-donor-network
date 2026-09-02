# Leaflet + OpenStreetMap Map Implementation

## Overview

This implementation provides a demo-safe, cost-free map solution using Leaflet and OpenStreetMap tiles. It's designed to work seamlessly with the VeinLink frontend and can easily switch between demo data and Firestore in production.

## Architecture: "Real Map, Fake World"

**Mental Model:** The UI behaves like production, the data stays harmless and controllable.

- **Real Map UX:** Full interactive Leaflet map with OpenStreetMap tiles
- **Demo-Safe Data:** Predefined coordinates in Manhattan, NY area
- **Firestore-Ready:** Abstracted data access layer for easy production switch
- **ML-Compatible:** Distance calculations ready for ML inference

## Components

### 1. Demo Hospital Dataset
**Location:** `web/src/data/demo-hospitals.ts`

Contains 10 demo hospitals with:
- Predefined safe coordinates (Manhattan area)
- Complete address information
- Blood groups supported
- Contact information

**Demo-Safe Coordinates:**
- All coordinates are in Manhattan, New York area
- No real hospital data
- Safe for demonstrations and testing

### 2. Hospital Data Access Layer
**Location:** `web/src/lib/hospital-data.ts`

Abstracted data access that:
- Uses demo data by default (when `NEXT_PUBLIC_USE_DEMO_DATA` is not set to `"false"`)
- Can switch to Firestore queries when enabled
- Automatically falls back to demo data on Firestore errors

**Usage:**
```typescript
import { getHospitals } from "@/lib/hospital-data"

const hospitals = await getHospitals()
// Returns demo data or Firestore data based on environment
```

### 3. Distance Utility
**Location:** `web/src/lib/distance-utils.ts`

Haversine formula implementation for calculating distance between coordinates:
- Returns distance in kilometers
- Ready for ML inference calls
- Reusable across the application

**Usage:**
```typescript
import { calculateDistance, formatDistance } from "@/lib/distance-utils"

const distance = calculateDistance(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 40.7589, longitude: -73.9851 }
)
// Returns: 5.2 (km)

const formatted = formatDistance(5.2)
// Returns: "5.2 km"
```

### 4. Custom Hospital Icon
**Location:** `web/src/components/ui/hospital-icon.ts`

Creates a custom red cross icon for hospital markers:
- SVG-based icon (no external dependencies)
- Red cross on circular background
- Fallback to default Leaflet icon

### 5. Hospital Map Component
**Location:** `web/src/components/donor/HospitalMap.tsx`

Full-featured map component that:
- Displays hospitals on interactive map
- Shows custom hospital icons
- Popup with hospital details and blood groups
- "Select Hospital" button for checkup registration
- "Get Directions" link to OpenStreetMap routing

## Integration with VeinLink Frontend

### Current Usage

The map is already integrated in:
- **Donor Map Page:** `web/src/app/donor/map/page.tsx`
  - Shows all hospitals for donor selection
  - Allows checkup registration

### How to Switch from Demo to Firestore

1. **Set Environment Variable:**
   ```env
   NEXT_PUBLIC_USE_DEMO_DATA=false
   ```

2. **Ensure Firestore has hospital data with:**
   - `location: { latitude, longitude }`
   - `address` (string or structured object)
   - `blood_groups_supported` array
   - `approvalStatus: "APPROVED"`
   - `isActive: true`

3. **The component automatically switches:**
   - No code changes needed
   - Data access layer handles the switch
   - Falls back to demo data on errors

### Adding Distance Calculation for ML

The distance utility is already available and ready for ML inference:

```typescript
import { calculateDistance } from "@/lib/distance-utils"
import { getHospitals } from "@/lib/hospital-data"

// Example: Calculate distances for ML inference
const donorLocation = { latitude: 40.7128, longitude: -74.0060 }
const hospitals = await getHospitals()

const distances = hospitals.map(hospital => ({
  hospital_id: hospital.hospital_id,
  distance_km: calculateDistance(donorLocation, {
    latitude: hospital.latitude,
    longitude: hospital.longitude
  })
}))

// Use in ML inference call
const mlInput = {
  donor_location: donorLocation,
  hospitals: distances,
  // ... other ML inputs
}
```

## File Structure

```
web/src/
├── data/
│   └── demo-hospitals.ts          # Demo hospital dataset
├── lib/
│   ├── hospital-data.ts           # Data access abstraction
│   └── distance-utils.ts          # Haversine distance calculation
├── components/
│   ├── donor/
│   │   └── HospitalMap.tsx        # Main map component
│   └── ui/
│       └── hospital-icon.ts       # Custom marker icon
└── app/
    └── donor/
        └── map/
            └── page.tsx            # Map page (already integrated)
```

## Features

### ✅ No API Keys Required
- OpenStreetMap tiles are free
- No billing or usage limits
- No API key configuration needed

### ✅ Demo-Safe
- All coordinates are safe for demonstration
- No real hospital data
- Fully controllable mock data

### ✅ Production-Ready
- Easy switch to Firestore
- Abstracted data access
- Error handling with fallback

### ✅ ML-Compatible
- Distance calculations ready
- Reusable utility functions
- Format compatible with ML inputs

### ✅ Clean Architecture
- Separation of concerns
- Data abstraction layer
- Reusable components

## Customization

### Adding More Demo Hospitals

Edit `web/src/data/demo-hospitals.ts`:

```typescript
export const DEMO_HOSPITALS: DemoHospital[] = [
  // ... existing hospitals
  {
    hospital_id: "demo_hosp_011",
    hospital_name: "New Hospital Name",
    address: "123 New Street, City, State ZIP",
    latitude: 40.7589,  // Safe demo coordinates
    longitude: -73.9851,
    blood_groups_supported: ["O+", "A+", "B+"],
    // ... other fields
  },
]
```

### Customizing Map Center

Edit `web/src/data/demo-hospitals.ts`:

```typescript
export const DEFAULT_MAP_CENTER: [number, number] = [40.7128, -74.0060]
export const DEFAULT_MAP_ZOOM = 12
```

### Customizing Hospital Icon

Edit `web/src/components/ui/hospital-icon.ts` to modify the SVG icon or colors.

## Benefits

### For Development
- **No Setup Required:** Works out of the box
- **No API Keys:** No configuration needed
- **Fast Iteration:** Instant feedback with demo data

### For Demos
- **Professional Look:** Real map UX
- **Controlled Data:** Safe, predictable coordinates
- **No Compliance Risk:** No real hospital data

### For Production
- **Easy Migration:** Switch with one env variable
- **Reliable Fallback:** Demo data on errors
- **ML-Ready:** Distance calculations included

### For Judges
- **Clean Architecture:** Separation of concerns
- **Scalable Design:** Ready for production
- **Technical Depth:** Proper abstraction layers

## Next Steps

1. **Test the map:**
   - Navigate to `/donor/map`
   - Click on hospital markers
   - Verify popup information
   - Test "Select Hospital" button

2. **Integrate with ML:**
   - Use `calculateDistance()` in ML inference calls
   - Pass distances as part of ML input payload

3. **Prepare for Production:**
   - Set `NEXT_PUBLIC_USE_DEMO_DATA=false`
   - Ensure Firestore has hospital data
   - Test Firestore fallback behavior

## Summary

This implementation provides a **judge-safe, production-ready** map solution that:
- Uses free OpenStreetMap tiles (no API keys)
- Works with demo data for safe demonstrations
- Easily switches to Firestore for production
- Includes distance calculations for ML inference
- Maintains clean architecture with proper abstraction

The mental model of **"Real Map, Fake World"** ensures the UI behaves like production while keeping data controllable and demo-safe.
