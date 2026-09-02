# Firestore Security Rules — Role-Based Access Control

**Purpose:** Enforce Donor / Hospital / Admin separation and protect sensitive data.

---

## Overview

These security rules implement:
- **Role-based access control** (Donor, Hospital, Admin)
- **Resource ownership** (users can only access their own data)
- **Function-only writes** (ML outputs, alerts, audit logs)
- **Privacy protection** (donors can't see ML scores, hospitals can't see donor PII)

---

## Role Definitions

Roles are stored in `users/{uid}.role`:
- `"donor"` — Blood donors
- `"hospital"` — Hospitals creating requests
- `"admin"` — System administrators

---

## Rule Breakdown

### Helper Functions

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function getUserRole() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}

function isDonor() {
  return isAuthenticated() && getUserRole() == 'donor';
}

function isHospital() {
  return isAuthenticated() && getUserRole() == 'hospital';
}

function isAdmin() {
  return isAuthenticated() && getUserRole() == 'admin';
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

function isFunction() {
  return request.auth != null && request.auth.token.firebase.sign_in_provider == 'custom';
}
```

---

## Collection Rules

### 1. `users/{userId}`

**Read:**
- ✅ Users can read their own profile
- ✅ Admins can read all users

**Write:**
- ✅ Users can update their own profile (except `role` field)
- ✅ Functions can create users (on registration)

**Rationale:** Users own their profiles, but role changes must be admin-only.

---

### 2. `donors/{donorId}`

**Read:**
- ✅ Donors can read their own profile
- ✅ Hospitals can read donor profiles (for matching, limited fields)
- ✅ Admins can read all donors

**Write:**
- ✅ Donors can update their own profile
- ✅ Functions can create donor profiles

**Rationale:** Hospitals need donor data for matching, but not all fields.

---

### 3. `hospitals/{hospitalId}`

**Read:**
- ✅ Hospitals can read their own profile
- ✅ Donors can read hospital profiles (to see request details)
- ✅ Admins can read all hospitals

**Write:**
- ✅ Hospitals can update their own profile
- ✅ Functions can create hospital profiles

**Rationale:** Donors need hospital info to make informed decisions.

---

### 4. `patients/{patientId}`

**Read:**
- ✅ Hospitals can read their own patients
- ✅ Admins can read all patients

**Write:**
- ✅ Hospitals can create/update their own patients

**Rationale:** Patient data is hospital-specific and private.

---

### 5. `donation_requests/{requestId}`

**Read:**
- ✅ Hospitals can read their own requests
- ✅ Donors can read **pending** requests (for matching)
- ✅ Admins can read all requests

**Write:**
- ✅ Hospitals can create requests (must set `hospitalId` and `createdBy`)
- ✅ Hospitals can update their own requests (status, cancellation)
- ✅ Functions can update request status to `FULFILLED`

**Rationale:** Donors need to see pending requests, but not fulfilled/cancelled ones.

---

### 6. `reservations/{reservationId}`

**Read:**
- ✅ Donors can read their own reservations
- ✅ Hospitals can read reservations for their requests
- ✅ Admins can read all reservations

**Write:**
- ✅ Donors can update their own reservations (accept/decline)
- ✅ Hospitals can update reservation status (confirm arrival, mark completed)
- ✅ **Only Functions can create reservations** (matching engine)
- ✅ **Only Functions can set status to CONFIRMED** (after acceptance)

**Rationale:** Reservations are created by the matching engine, not manually.

---

### 7. `ml_outputs/{document=**}`

**Read:**
- ✅ Hospitals can read ML outputs for their requests/reservations
- ✅ Admins can read all ML outputs
- ❌ Donors **cannot** read ML outputs (privacy)

**Write:**
- ✅ **Only Functions can write ML outputs**

**Rationale:** ML outputs are sensitive and explainable. Only Functions create them.

---

### 8. `alerts/{alertId}`

**Read:**
- ✅ Hospitals can read all alerts
- ✅ Admins can read all alerts
- ❌ Donors **cannot** read alerts

**Write:**
- ✅ **Only Functions can create/update alerts**
- ✅ Hospitals can acknowledge alerts (update `acknowledgedAt`)

**Rationale:** Alerts are hospital-facing only. Functions generate them.

---

### 9. `audit_logs/{logId}`

**Read:**
- ✅ Users can read their own audit logs
- ✅ Admins can read all audit logs

**Write:**
- ✅ **Only Functions can write audit logs**

**Rationale:** Audit logs are immutable and function-generated only.

---

## Security Principles

### 1. **Least Privilege**
- Users can only access what they need
- Donors can't see ML scores or alerts
- Hospitals can't see donor PII beyond matching needs

### 2. **Function Authority**
- ML outputs, alerts, and audit logs are function-only
- Prevents client-side manipulation
- Ensures data integrity

### 3. **Resource Ownership**
- Users own their profiles
- Hospitals own their requests and patients
- Donors own their reservations

### 4. **Role Separation**
- Donors and Hospitals have different permissions
- Admins have read-only access everywhere (for monitoring)
- No cross-role data leakage

---

## Testing Rules

### Test in Emulator

```bash
firebase emulators:start
```

### Test with Firebase Rules Unit Testing

Create `tests/firestore.rules.test.ts`:

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  it('should allow donors to read their own profile', async () => {
    const testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
    });
    
    const donorContext = testEnv.authenticatedContext('donor-uid', {
      role: 'donor',
    });
    
    await firebase.assertSucceeds(
      donorContext.firestore()
        .collection('users')
        .doc('donor-uid')
        .get()
    );
  });
});
```

---

## Common Scenarios

### Scenario 1: Donor Accepts Reservation

1. Donor reads `reservations/{id}` where `donorId == auth.uid` ✅
2. Donor updates `reservations/{id}` with `status: "ACCEPTED"` ✅
3. Function triggers on update, sets `status: "CONFIRMED"` ✅

### Scenario 2: Hospital Creates Request

1. Hospital creates `donation_requests/{id}` with `hospitalId == auth.uid` ✅
2. Function triggers, calls ML API ✅
3. Function writes to `ml_outputs/demand/{id}` ✅
4. Donors can read `donation_requests/{id}` if `status == "PENDING"` ✅

### Scenario 3: Matching Engine Creates Reservations

1. Function reads eligible donors ✅ (Functions bypass rules)
2. Function creates `reservations/{id}` ✅ (Functions can write)
3. Donors can read their own reservations ✅

---

## Edge Cases

### Edge Case 1: Role Change

**Problem:** User changes role in `users/{uid}.role`

**Solution:** Rules prevent role updates:
```javascript
allow update: if isOwner(userId) 
  && (!('role' in request.resource.data.diff(resource.data).affectedKeys()));
```

Only admins (via Functions) can change roles.

### Edge Case 2: Donor Reads ML Outputs

**Problem:** Donor tries to read `ml_outputs/availability/{reservationId}`

**Solution:** Rules explicitly deny:
```javascript
// Donors cannot read ML outputs (privacy)
```

### Edge Case 3: Hospital Updates Reservation Status

**Problem:** Hospital tries to set `status: "CONFIRMED"` directly

**Solution:** Only Functions can set `CONFIRMED`:
```javascript
allow update: if isFunction() && request.resource.data.status == 'CONFIRMED';
```

---

## Deployment

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### Verify Rules

```bash
# Check rules syntax
firebase firestore:rules:validate

# Test in emulator
firebase emulators:start
```

---

## Monitoring

### Check Rule Violations

1. Open Firebase Console → Firestore → Usage
2. Check "Denied requests" tab
3. Review denied requests and adjust rules if needed

### Common Denial Reasons

- User not authenticated
- User doesn't own resource
- User role doesn't match requirement
- Function trying to write without proper auth token

---

## Next Steps

1. **Test rules in emulator** with different user roles
2. **Deploy rules** to production
3. **Monitor denied requests** and adjust as needed
4. **Step 6:** Create Functions that respect these rules

---

**Remember:** Security rules are your first line of defense. Test thoroughly before deploying.
