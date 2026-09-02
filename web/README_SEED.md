# Firebase Seed Script

This script seeds Firebase with initial data for development and testing.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install tsx (TypeScript executor):
```bash
npm install --save-dev tsx
```

3. Make sure Firebase emulators are running OR set up Firebase Admin credentials:
   - For emulators: `firebase emulators:start`
   - For production: Set environment variables:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`

## Running the Seed Script

```bash
npm run seed
```

Or directly with tsx:
```bash
npx tsx scripts/seed-firebase.ts
```

## What Gets Seeded

1. **Users & Profiles:**
   - 3 Donor accounts (donor1@example.com, donor2@example.com, donor3@example.com)
   - 2 Hospital accounts (hospital1@example.com, hospital2@example.com)
   - All passwords: `password123`

2. **Donation Requests:**
   - Sample pending requests
   - Sample fulfilled requests

3. **Patients:**
   - 3 sample patient records linked to hospitals

4. **Donation History:**
   - Historical donation records for donors

## Login Credentials

After seeding, you can login with:

**Donors:**
- Email: `donor1@example.com` | Password: `password123`
- Email: `donor2@example.com` | Password: `password123`
- Email: `donor3@example.com` | Password: `password123`

**Hospitals:**
- Email: `hospital1@example.com` | Password: `password123`
- Email: `hospital2@example.com` | Password: `password123`

**Admin:**
- Email: `admin@veinlink.com` | Password: `admin123`

## Notes

- The script is idempotent - it won't create duplicate users if they already exist
- All timestamps are set to realistic dates
- Location data is set for New York area
- Blood groups and other data match the application constants
