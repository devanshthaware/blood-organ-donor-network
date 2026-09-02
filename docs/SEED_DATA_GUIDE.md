# Seed Data Guide

## Overview

All hardcoded values have been removed from the UI. The application now fetches all data from Firebase. To populate Firebase with initial data, use the seed script.

## Running the Seed Script

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Start Firebase Emulators (for local development):**
   ```bash
   firebase emulators:start
   ```

3. **Run the seed script:**
   ```bash
   npm run seed
   ```

   Or directly:
   ```bash
   npx tsx scripts/seed-firebase.ts
   ```

## What Gets Seeded

### Users & Profiles

**Donors (3):**
- `donor1@example.com` - O+ blood type, 12 total donations
- `donor2@example.com` - A+ blood type, 8 total donations  
- `donor3@example.com` - B+ blood type, 5 total donations

**Hospitals (2):**
- `hospital1@example.com` - City General Hospital
- `hospital2@example.com` - St. Mary's Medical Center

**Admin (1):**
- `admin@veinlink.com` - System Administrator

**Passwords:**
- Donors & Hospitals: `password123`
- Admin: `admin123`

### Data Collections

1. **donation_requests** - Sample blood requests (pending and fulfilled)
2. **patients** - 3 sample patient records
3. **donation_history** - Historical donation records for donors
4. **users** - User profiles with roles
5. **donors** - Extended donor profiles with stats
6. **hospitals** - Hospital profiles with locations

## Data Flow

All UI components now fetch data from Firebase:

- **Donor Dashboard** → `useDonorProfile()` → `donors/{uid}`
- **Donor History** → `useDonationHistory()` → `donation_history`
- **Donor Requests** → `useDonationRequests("donor")` → `donation_requests`
- **Donor Reservations** → `useReservations("donor")` → `reservations`
- **Hospital Dashboard** → `useDonationRequests("hospital")` + `useReservations("hospital")` + `useAlerts()`
- **Hospital Patients** → `usePatients()` → `patients`
- **Hospital Requests** → `useDonationRequests("hospital")` → `donation_requests`
- **Hospital Reservations** → `useReservations("hospital")` → `reservations`

## Constants

All constants are centralized in `src/lib/constants.ts`:
- `BLOOD_GROUPS` - All valid blood types
- `URGENCY_LEVELS` - Request urgency levels
- `REQUEST_STATUSES` - Request status values
- `RESERVATION_STATUSES` - Reservation status values
- `PATIENT_STATUSES` - Patient status values

## Real-time Updates

All hooks use Firestore real-time listeners (`onSnapshot`), so the UI automatically updates when data changes in Firebase.

## Removing Hardcoded Values

The following components were updated to remove hardcoded data:

1. ✅ `donor/history/page.tsx` - Now uses `useDonationHistory()`
2. ✅ `hospital/patients/page.tsx` - Now uses `usePatients()`
3. ✅ `hospital/requests/page.tsx` - Blood groups and urgency from constants
4. ✅ `api/requests/create/route.ts` - Uses constants
5. ✅ All dashboard pages - Fetch real data from Firebase

## Next Steps

After seeding:
1. Login with any of the seeded accounts
2. Navigate through the app - all data should be visible
3. Create new requests/reservations - they'll appear in real-time
4. All data persists in Firebase
