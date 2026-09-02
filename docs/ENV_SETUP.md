# Environment Variables Setup Guide

## Quick Fix for "api-key-not-valid" Error

The error occurs when Firebase tries to validate the API key against the real Firebase service instead of using emulators.

## Required Steps

### 1. Start Firebase Emulators (REQUIRED)

**This is the most important step!** The emulators MUST be running before starting Next.js.

```bash
# In project root
firebase emulators:start
```

Wait until you see:
```
✔  All emulators ready! It is now safe to connect.
```

### 2. Create Environment Files

#### For Next.js (`web/.env.local`)

Create `web/.env.local` with these values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDemo123456789012345678901234567890
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=veinlink-cf53
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=veinlink-cf53.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

**Important:** The API key format must start with `AIzaSy` for Firebase to accept it, even in emulator mode.

#### For Functions (`functions/.env`)

Create `functions/.env` with:

```env
ML_API_URL=http://localhost:8000
GCLOUD_PROJECT=veinlink-cf53
```

### 3. Restart Next.js Dev Server

**After creating/updating `.env.local`, you MUST restart Next.js:**

```bash
# Stop the server (Ctrl+C)
# Then restart
cd web
pnpm dev
```

**Why?** Next.js only loads environment variables on startup.

### 4. Verify Setup

1. **Check Emulator UI:** http://localhost:4000 should be accessible
2. **Check Browser Console:** Should see "✓ Connected to Auth emulator" and "✓ Connected to Firestore emulator"
3. **Try Login:** Should work without API key errors

## Troubleshooting

### Still Getting API Key Error?

1. **Verify emulators are running:**
   ```bash
   # Check if port 4000 is accessible
   curl http://localhost:4000
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for emulator connection messages
   - Look for any error messages

3. **Verify environment variables loaded:**
   - Add this temporarily to a page:
   ```typescript
   console.log("API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
   ```
   - Should show the value from `.env.local`

4. **Clear Next.js cache:**
   ```bash
   cd web
   rm -rf .next
   pnpm dev
   ```

5. **Check `.env.local` file location:**
   - Must be in `web/` directory (same level as `package.json`)
   - Not in `web/src/` or anywhere else

### Emulators Not Starting?

1. **Check Firebase CLI:**
   ```bash
   firebase --version
   ```

2. **Check ports are available:**
   - Port 4000 (UI)
   - Port 8080 (Firestore)
   - Port 9099 (Auth)
   - Port 5001 (Functions)

3. **Check `firebase.json` exists** in project root

### Environment Variables Not Loading?

1. **File name must be exactly:** `.env.local` (not `.env.local.txt`)
2. **Must be in `web/` directory**
3. **Must restart Next.js after creating/editing**
4. **Variables must start with `NEXT_PUBLIC_` to be available in browser**

## Complete Startup Sequence

**Terminal 1: Firebase Emulators**
```bash
firebase emulators:start
```

**Terminal 2: ML Backend**
```bash
cd ml-backend
uvicorn ml_inference.api.main:app --reload --port 8000
```

**Terminal 3: Next.js**
```bash
cd web
pnpm dev
```

**Order matters!** Start emulators FIRST, then Next.js.

## Verification Checklist

- [ ] Firebase emulators running (http://localhost:4000 accessible)
- [ ] `web/.env.local` file exists with correct values
- [ ] Next.js dev server restarted after creating `.env.local`
- [ ] Browser console shows "✓ Connected to Auth emulator"
- [ ] Browser console shows "✓ Connected to Firestore emulator"
- [ ] No "api-key-not-valid" errors in browser console
- [ ] Can access login page without errors

## Production vs Development

**Development (Emulators):**
- Uses `.env.local` with emulator-safe values
- Connects to local emulators
- No real Firebase credentials needed

**Production:**
- Uses real Firebase project credentials
- Requires valid Firebase API key from Firebase Console
- No emulators
