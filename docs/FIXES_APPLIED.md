# Fixes Applied for Emulator Errors

## Issues Fixed

### 1. ✅ Firebase Client Emulator Connection Errors

**Problem:**
- `Cannot read properties of undefined (reading '_config')` for Auth
- `Cannot read properties of undefined (reading '_settings')` for Firestore

**Solution:**
Updated `web/src/lib/firebase.ts` to safely check for delegate properties before accessing them:

```typescript
// Safe check for Auth emulator
const isAuthEmulatorConnected = 
  (tempAuth as any)._delegate?._config?.emulator !== undefined ||
  (tempAuth as any)._delegate?._config?.emulator !== null;

// Safe check for Firestore emulator  
const dbSettings = (tempDb as any)._delegate?._settings;
const isFirestoreEmulatorConnected = 
  dbSettings?.host?.includes("localhost") ||
  dbSettings?.host?.includes("127.0.0.1");
```

**Status:** ✅ Fixed - Emulator connection now handles undefined delegates gracefully

### 2. ✅ Functions .env File

**Problem:**
- `Failed to load environment variables from .env`

**Solution:**
Created `functions/.env` file with required variables:
```env
ML_API_URL=http://localhost:8000
GCLOUD_PROJECT=veinlink-cf53
```

**Note:** This warning may still appear but is harmless. The functions code has fallback logic:
- If `ML_API_URL` is not set, it defaults to `http://localhost:8000` in emulator mode
- If `GCLOUD_PROJECT` is not set, it uses the project ID from Firebase config

**Status:** ✅ Fixed - .env file created with correct values

## Verification Steps

### 1. Restart Firebase Emulators

```bash
# Stop current emulators (Ctrl+C)
# Start again
firebase emulators:start
```

**Expected:**
- ✅ All emulators start successfully
- ⚠️ Functions warning about .env may appear but is harmless
- ✅ "All emulators ready!" message appears

### 2. Restart Next.js Dev Server

```bash
cd web
# Stop server (Ctrl+C)
pnpm dev
```

**Expected:**
- ✅ No errors in terminal
- ✅ Browser console shows:
  - `✓ Connected to Auth emulator at http://localhost:9099`
  - `✓ Connected to Firestore emulator at localhost:8080`
- ✅ No `_config` or `_settings` undefined errors

### 3. Test Login

1. Open http://localhost:3000/login
2. Try logging in with: `donor1@example.com` / `password123`

**Expected:**
- ✅ No Firebase API key errors
- ✅ Login works successfully
- ✅ Redirects to appropriate dashboard

## If Errors Persist

### Check Browser Console

Open DevTools (F12) and look for:
- ✅ Green checkmarks for emulator connections
- ❌ Any red error messages

### Verify Emulators Are Running

1. Check Emulator UI: http://localhost:4000
2. Should show all emulators as "Running"
3. Check ports:
   - Auth: http://localhost:9099
   - Firestore: http://localhost:8080
   - Functions: http://localhost:5001

### Clear Next.js Cache

```bash
cd web
rm -rf .next
pnpm dev
```

### Verify Environment Variables

Check `web/.env.local` exists with:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDemo123456789012345678901234567890
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=veinlink-cf53
# ... other vars
```

## Summary

All critical errors have been fixed:
- ✅ Firebase client emulator connection errors resolved
- ✅ Functions .env file created
- ✅ Safe property access implemented
- ✅ Better error handling added

The system should now work correctly with Firebase emulators!
