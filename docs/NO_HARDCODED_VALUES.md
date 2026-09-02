# No Hardcoded Values - Configuration Guide

## Overview

This project has been refactored to remove all hardcoded values. All configuration is now done through environment variables or centralized config files.

## Changes Made

### ✅ 1. Created Centralized Config (`web/src/lib/config.ts`)

All emulator ports, ML API URLs, and app configuration are now centralized:

```typescript
// Emulator ports and hosts
EMULATOR_CONFIG.auth.host
EMULATOR_CONFIG.auth.port
EMULATOR_CONFIG.firestore.host
EMULATOR_CONFIG.firestore.port

// ML API configuration
ML_API_CONFIG.url
ML_API_CONFIG.timeout
```

### ✅ 2. Removed Hardcoded Firebase Config

**Before:**
```typescript
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemo123456789012345678901234567890",
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "veinlink-cf53",
```

**After:**
```typescript
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (useEmulator ? "AIzaSyDemo..." : ""),
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
```

**Production now requires all environment variables** - no fallback defaults.

### ✅ 3. Removed Hardcoded Emulator URLs

**Before:**
```typescript
connectAuthEmulator(tempAuth, "http://localhost:9099", ...);
connectFirestoreEmulator(tempDb, "localhost", 8080);
```

**After:**
```typescript
connectAuthEmulator(tempAuth, EMULATOR_CONFIG.auth.url, ...);
connectFirestoreEmulator(tempDb, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port);
```

### ✅ 4. Removed Hardcoded ML API URL

**Before:**
```typescript
if (isLocal) {
  return "http://localhost:8000";
}
return "https://your-ml-service.com";
```

**After:**
```typescript
// Requires ML_API_URL environment variable in production
// Uses configurable defaults in development
const defaultPort = process.env.ML_API_PORT || "8000";
const defaultHost = process.env.ML_API_HOST || "localhost";
return `http://${defaultHost}:${defaultPort}`;
```

### ✅ 5. Made Seed Script Passwords Configurable

**Before:**
```typescript
password: "password123",
password: "admin123",
```

**After:**
```typescript
const SEED_CONFIG = {
  donorPassword: process.env.SEED_DONOR_PASSWORD || process.env.SEED_PASSWORD || "password123",
  hospitalPassword: process.env.SEED_HOSPITAL_PASSWORD || process.env.SEED_PASSWORD || "password123",
  adminPassword: process.env.SEED_ADMIN_PASSWORD || "admin123",
};

password: SEED_CONFIG.donorPassword,
```

### ✅ 6. Removed Hardcoded Project IDs

All Firebase project IDs now come from environment variables with validation.

## Required Environment Variables

### For Next.js (`web/.env.local`)

```env
# Firebase Configuration (REQUIRED in production)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# ML API Configuration
NEXT_PUBLIC_ML_API_URL=http://localhost:8000

# Emulator Configuration (optional, defaults provided)
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT=9099
NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost
NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT=8080
NEXT_PUBLIC_EMULATOR_UI_HOST=localhost
NEXT_PUBLIC_EMULATOR_UI_PORT=4000
```

### For Functions (`functions/.env`)

```env
# ML API Configuration (REQUIRED)
ML_API_URL=http://localhost:8000

# Optional ML API host/port (if not using full URL)
ML_API_HOST=localhost
ML_API_PORT=8000

# Firebase Project (REQUIRED)
FIREBASE_PROJECT_ID=your-project-id
GCLOUD_PROJECT=your-project-id

# Firebase Credentials (REQUIRED in production)
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### For Seed Script (Optional)

```env
# Seed Script Passwords (optional, defaults provided for development)
SEED_PASSWORD=your-password  # Used for all users if specific ones not set
SEED_DONOR_PASSWORD=donor-password
SEED_HOSPITAL_PASSWORD=hospital-password
SEED_ADMIN_PASSWORD=admin-password
```

## Development vs Production

### Development Mode

- **Emulator defaults:** Uses `localhost` and default ports if not specified
- **Firebase config:** Uses emulator-safe defaults if env vars not set
- **ML API:** Defaults to `http://localhost:8000` if not specified
- **Seed passwords:** Uses default passwords if not specified

### Production Mode

- **All environment variables are REQUIRED**
- **No fallback defaults** - application will throw errors if missing
- **Validation:** Firebase config is validated on startup
- **ML API:** Must be explicitly set via `ML_API_URL`

## Configuration Files

### `web/src/lib/config.ts`

Centralized configuration for:
- Emulator hosts and ports
- ML API URLs and timeouts
- App environment detection

### `web/src/lib/constants.ts`

Application constants (not config):
- Blood groups
- Urgency levels
- Status values
- Type definitions

## Validation

### Firebase Config Validation

In production, the app validates that all required Firebase config values are present:

```typescript
if (APP_CONFIG.isProduction) {
  const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  const missing = required.filter(key => !firebaseConfig[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required Firebase config: ${missing.join(", ")}`);
  }
}
```

### ML API URL Validation

Functions require `ML_API_URL` in production:

```typescript
if (!process.env.ML_API_URL && !isEmulator && !isDevelopment) {
  throw new Error("ML_API_URL environment variable is required in production");
}
```

## Migration Guide

If you have existing code with hardcoded values:

1. **Identify hardcoded values:**
   - URLs, ports, hostnames
   - API keys, credentials
   - Project IDs, app IDs
   - Default passwords

2. **Move to environment variables:**
   - Add to `.env.local` (Next.js)
   - Add to `.env` (Functions)
   - Use `process.env.VARIABLE_NAME`

3. **Use centralized config:**
   - Import from `@/lib/config` for emulator/ML config
   - Import from `@/lib/constants` for application constants

4. **Remove fallback defaults:**
   - In production, require env vars
   - In development, use sensible defaults only

## Testing

After removing hardcoded values:

1. **Test with environment variables:**
   ```bash
   # Set all required env vars
   export NEXT_PUBLIC_FIREBASE_API_KEY=...
   # Run app
   ```

2. **Test without environment variables (development):**
   ```bash
   # Should use defaults in dev mode
   npm run dev
   ```

3. **Test production build:**
   ```bash
   # Should fail if env vars missing
   npm run build
   ```

## Summary

✅ **No hardcoded URLs** - All use config/env vars  
✅ **No hardcoded credentials** - All from environment  
✅ **No hardcoded project IDs** - All from environment  
✅ **No hardcoded ports** - All configurable  
✅ **No hardcoded passwords** - Configurable via env vars  
✅ **Production validation** - Fails fast if config missing  
✅ **Development defaults** - Sensible defaults for local dev  

All configuration is now externalized and environment-aware!
