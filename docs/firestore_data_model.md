# Firestore Data Model

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Authoritative

This document defines the Firestore collections, document structure, and indexing strategy for the VeinLink blood donation platform.

---

## Design Principles

1. **Denormalization for performance** — Store frequently accessed data together
2. **Security-first** — Structure supports role-based access control
3. **Audit trail** — All critical actions are logged
4. **ML integration** — Separate collections for ML outputs to enable explainability
5. **Event-driven** — Document structure supports Firebase Functions triggers

---

## Collection: `users`

**Purpose:** Core user authentication and profile data (Firebase Auth + Firestore profile)

### Document ID Strategy
- Use Firebase Auth UID as document ID
- One document per authenticated user

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email (from Auth) |
| `role` | string | Enum: `"donor"`, `"hospital"`, `"admin"` |
| `displayName` | string | User's display name |
| `createdAt` | timestamp | Account creation timestamp |
| `updatedAt` | timestamp | Last profile update timestamp |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | string | Contact phone number |
| `photoURL` | string | Profile photo URL |
| `metadata` | map | Additional role-specific metadata |

### Indexing Notes
- Index on `role` (for role-based queries)
- Index on `email` (for lookups)
- Composite index: `role` + `createdAt` (for admin dashboards)

### Example Document

```json
{
  "email": "donor@example.com",
  "role": "donor",
  "displayName": "John Doe",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "phoneNumber": "+1234567890"
}
```

---

## Collection: `donors`

**Purpose:** Extended donor-specific information and statistics

### Document ID Strategy
- Use Firebase Auth UID (same as `users/{uid}`)
- One document per donor

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Reference to `users/{uid}` |
| `bloodGroup` | string | Enum: `"O+"`, `"O-"`, `"A+"`, `"A-"`, `"B+"`, `"B-"`, `"AB+"`, `"AB-"` |
| `location` | geopoint | Donor's location (lat/lng) |
| `address` | string | Full address |
| `isActive` | boolean | Whether donor is currently active |
| `lastDonationDate` | timestamp | Date of last completed donation |
| `createdAt` | timestamp | Profile creation timestamp |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalRequests` | number | Total requests sent (for ML) |
| `acceptedRequests` | number | Total accepted (for ML) |
| `completedDonations` | number | Total completed (for ML) |
| `noShows` | number | Total no-shows (for ML) |
| `avgResponseTimeMinutes` | number | Average response time (for ML) |
| `pastAcceptanceRate` | number | Historical acceptance rate (0.0-1.0) |
| `preferences` | map | Donor preferences (notifications, etc.) |

### Indexing Notes
- Index on `bloodGroup` (for matching)
- Index on `isActive` (for filtering)
- Geospatial index on `location` (for distance queries)
- Composite index: `bloodGroup` + `isActive` + `lastDonationDate`

### Example Document

```json
{
  "userId": "abc123",
  "bloodGroup": "O+",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "address": "123 Main St, New York, NY 10001",
  "isActive": true,
  "lastDonationDate": "2024-01-01T00:00:00Z",
  "totalRequests": 40,
  "acceptedRequests": 32,
  "completedDonations": 28,
  "noShows": 4,
  "avgResponseTimeMinutes": 12.5,
  "pastAcceptanceRate": 0.8,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

## Collection: `hospitals`

**Purpose:** Hospital profile and location data

### Document ID Strategy
- Use Firebase Auth UID (same as `users/{uid}`)
- One document per hospital

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Reference to `users/{uid}` |
| `name` | string | Hospital name |
| `location` | geopoint | Hospital location (lat/lng) |
| `address` | string | Full address |
| `region` | number | Encoded region identifier (0-100, for ML) |
| `isActive` | boolean | Whether hospital is active |
| `createdAt` | timestamp | Profile creation timestamp |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | string | Contact phone |
| `email` | string | Contact email |
| `capacity` | number | Donation center capacity |
| `operatingHours` | map | Operating hours schedule |

### Indexing Notes
- Index on `region` (for demand forecasting)
- Geospatial index on `location`
- Index on `isActive`

### Example Document

```json
{
  "userId": "hosp456",
  "name": "City General Hospital",
  "location": {
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "address": "456 Medical Center Dr, New York, NY 10002",
  "region": 1,
  "isActive": true,
  "phoneNumber": "+1987654321",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

## Collection: `patients`

**Purpose:** Patient records linked to donation requests (optional, for tracking)

### Document ID Strategy
- Auto-generated document ID
- One document per patient record

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `hospitalId` | string | Reference to `hospitals/{uid}` |
| `name` | string | Patient name (can be anonymized) |
| `bloodGroup` | string | Required blood group |
| `createdAt` | timestamp | Record creation timestamp |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string | Reference to `donation_requests/{id}` |
| `medicalRecordId` | string | External medical record ID |
| `notes` | string | Medical notes |

### Indexing Notes
- Index on `hospitalId` (for hospital queries)
- Index on `bloodGroup` (for analytics)

---

## Collection: `donation_requests`

**Purpose:** Blood donation requests created by hospitals

### Document ID Strategy
- Auto-generated document ID
- One document per request

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `hospitalId` | string | Reference to `hospitals/{uid}` |
| `bloodGroup` | string | Required blood group |
| `quantity` | number | Number of units needed |
| `urgency` | string | Enum: `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"` |
| `status` | string | Enum: `"PENDING"`, `"FULFILLED"`, `"CANCELLED"`, `"EXPIRED"` |
| `createdAt` | timestamp | Request creation timestamp |
| `createdBy` | string | User ID who created the request |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `patientId` | string | Reference to `patients/{id}` |
| `region` | number | Hospital region (copied for ML) |
| `dueDate` | timestamp | When blood is needed by |
| `notes` | string | Additional request notes |
| `fulfilledAt` | timestamp | When request was fulfilled |
| `cancelledAt` | timestamp | When request was cancelled |
| `cancelledReason` | string | Reason for cancellation |

### Indexing Notes
- Index on `hospitalId` (for hospital queries)
- Index on `status` (for filtering)
- Index on `bloodGroup` (for matching)
- Index on `urgency` (for prioritization)
- Index on `createdAt` (for sorting)
- Composite index: `status` + `bloodGroup` + `createdAt`
- Composite index: `hospitalId` + `status` + `createdAt`

### Example Document

```json
{
  "hospitalId": "hosp456",
  "bloodGroup": "O+",
  "quantity": 2,
  "urgency": "CRITICAL",
  "status": "PENDING",
  "region": 1,
  "dueDate": "2024-01-16T12:00:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "hosp456"
}
```

---

## Collection: `reservations`

**Purpose:** Donor reservations for donation requests (matches)

### Document ID Strategy
- Auto-generated document ID
- One document per reservation (one donor per request)

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string | Reference to `donation_requests/{id}` |
| `donorId` | string | Reference to `donors/{uid}` |
| `hospitalId` | string | Reference to `hospitals/{uid}` |
| `status` | string | Enum: `"PENDING"`, `"ACCEPTED"`, `"DECLINED"`, `"CONFIRMED"`, `"COMPLETED"`, `"NO_SHOW"`, `"CANCELLED"` |
| `rank` | number | Donor ranking (1 = best match) |
| `createdAt` | timestamp | Reservation creation timestamp |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `mlScores` | map | ML prediction scores (see below) |
| `explanation` | string | Human-readable explanation of match |
| `acceptedAt` | timestamp | When donor accepted |
| `declinedAt` | timestamp | When donor declined |
| `confirmedAt` | timestamp | When reservation was confirmed |
| `completedAt` | timestamp | When donation was completed |
| `eta` | timestamp | Estimated time of arrival |
| `distanceKm` | number | Distance from donor to hospital |
| `notes` | string | Additional notes |

### ML Scores Structure

```json
{
  "mlScores": {
    "availability": 0.8342,
    "reliability": 0.78,
    "combined": 0.8071
  }
}
```

### Indexing Notes
- Index on `requestId` (for request queries)
- Index on `donorId` (for donor queries)
- Index on `status` (for filtering)
- Index on `rank` (for sorting)
- Composite index: `requestId` + `status` + `rank`
- Composite index: `donorId` + `status` + `createdAt`

### Example Document

```json
{
  "requestId": "req789",
  "donorId": "abc123",
  "hospitalId": "hosp456",
  "status": "PENDING",
  "rank": 1,
  "mlScores": {
    "availability": 0.8342,
    "reliability": 0.78,
    "combined": 0.8071
  },
  "explanation": "High availability (83%) and good reliability (78%). Distance: 12.5 km.",
  "distanceKm": 12.5,
  "createdAt": "2024-01-15T10:35:00Z"
}
```

---

## Collection: `ml_outputs`

**Purpose:** Store ML model predictions for explainability and audit

### Document ID Strategy
- Subcollections: `demand/{requestId}`, `availability/{reservationId}`, `reliability/{reservationId}`
- Or flat structure: `ml_outputs/{modelType}_{entityId}`

### Structure: Demand Forecasts

**Path:** `ml_outputs/demand/{requestId}`

| Field | Type | Description |
|-------|------|-------------|
| `requestId` | string | Reference to `donation_requests/{id}` |
| `modelType` | string | `"demand_forecasting"` |
| `input` | map | ML input payload (from contract) |
| `output` | map | ML output (from contract) |
| `timestamp` | timestamp | When prediction was made |
| `modelVersion` | string | ML model version |

### Structure: Availability Predictions

**Path:** `ml_outputs/availability/{reservationId}`

| Field | Type | Description |
|-------|------|-------------|
| `reservationId` | string | Reference to `reservations/{id}` |
| `modelType` | string | `"donor_availability"` |
| `input` | map | ML input payload |
| `output` | map | ML output |
| `timestamp` | timestamp | When prediction was made |
| `modelVersion` | string | ML model version |

### Structure: Reliability Scores

**Path:** `ml_outputs/reliability/{reservationId}`

| Field | Type | Description |
|-------|------|-------------|
| `reservationId` | string | Reference to `reservations/{id}` |
| `modelType` | string | `"donor_reliability"` |
| `input` | map | ML input payload |
| `output` | map | ML output |
| `timestamp` | timestamp | When prediction was made |
| `modelVersion` | string | ML model version |

### Indexing Notes
- Index on `requestId` (for demand queries)
- Index on `reservationId` (for availability/reliability queries)
- Index on `modelType` (for filtering)
- Index on `timestamp` (for time-based queries)

### Example Document (Demand)

```json
{
  "requestId": "req789",
  "modelType": "demand_forecasting",
  "input": {
    "region": 1,
    "blood_group": 1,
    "demand_units": 120,
    "supply_units": 95,
    "month": 1,
    "day": 15
  },
  "output": {
    "predicted_demand": 0.85
  },
  "timestamp": "2024-01-15T10:31:00Z",
  "modelVersion": "1.0.0"
}
```

---

## Collection: `alerts`

**Purpose:** System alerts and AI insights (emergency warnings, supply predictions)

### Document ID Strategy
- Auto-generated document ID
- One document per alert

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Enum: `"SUPPLY_WARNING"`, `"DEMAND_SURGE"`, `"NO_DONOR_RESPONSE"`, `"SYSTEM_ANALYSIS"` |
| `severity` | string | Enum: `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"` |
| `bloodGroup` | string | Affected blood group (or `"ALL"`) |
| `title` | string | Alert title |
| `message` | string | Alert description |
| `createdAt` | timestamp | Alert creation timestamp |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `region` | number | Affected region |
| `confidence` | number | ML confidence score (0.0-1.0) |
| `recommendedActions` | array | Array of recommended action strings |
| `relatedRequestId` | string | Reference to `donation_requests/{id}` |
| `relatedHospitalId` | string | Reference to `hospitals/{uid}` |
| `acknowledgedAt` | timestamp | When alert was acknowledged |
| `acknowledgedBy` | string | User ID who acknowledged |
| `resolvedAt` | timestamp | When alert was resolved |

### Indexing Notes
- Index on `type` (for filtering)
- Index on `severity` (for prioritization)
- Index on `bloodGroup` (for filtering)
- Index on `createdAt` (for sorting)
- Composite index: `severity` + `createdAt`
- Composite index: `bloodGroup` + `severity` + `createdAt`

### Example Document

```json
{
  "type": "SUPPLY_WARNING",
  "severity": "CRITICAL",
  "bloodGroup": "O+",
  "title": "Critical Supply Warning: O+ Blood",
  "message": "AI Prediction: Based on current trends, stock may run out in 4 hours.",
  "confidence": 0.92,
  "recommendedActions": [
    "Create urgent request immediately",
    "Contact backup suppliers"
  ],
  "region": 1,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

## Collection: `audit_logs`

**Purpose:** Security and action audit trail

### Document ID Strategy
- Auto-generated document ID
- One document per action

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User ID who performed action |
| `userEmail` | string | User email (for readability) |
| `action` | string | Action type (e.g., `"REQUEST_CREATED"`, `"RESERVATION_ACCEPTED"`) |
| `resourceType` | string | Enum: `"donation_request"`, `"reservation"`, `"user"`, `"system"` |
| `resourceId` | string | ID of affected resource |
| `ipAddress` | string | IP address of request |
| `timestamp` | timestamp | When action occurred |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `details` | map | Additional action-specific details |
| `result` | string | Enum: `"SUCCESS"`, `"FAILURE"`, `"ERROR"` |
| `errorMessage` | string | Error message if result is failure |

### Indexing Notes
- Index on `userId` (for user queries)
- Index on `action` (for filtering)
- Index on `resourceType` (for filtering)
- Index on `timestamp` (for time-based queries)
- Composite index: `userId` + `timestamp`
- Composite index: `action` + `timestamp`

### Example Document

```json
{
  "userId": "hosp456",
  "userEmail": "hospital@example.com",
  "action": "REQUEST_CREATED",
  "resourceType": "donation_request",
  "resourceId": "req789",
  "ipAddress": "192.168.1.1",
  "timestamp": "2024-01-15T10:30:00Z",
  "result": "SUCCESS",
  "details": {
    "bloodGroup": "O+",
    "quantity": 2,
    "urgency": "CRITICAL"
  }
}
```

---

## Indexing Strategy Summary

### Required Composite Indexes

Create these in `firestore.indexes.json`:

1. `users`: `role` + `createdAt`
2. `donors`: `bloodGroup` + `isActive` + `lastDonationDate`
3. `donation_requests`: `status` + `bloodGroup` + `createdAt`
4. `donation_requests`: `hospitalId` + `status` + `createdAt`
5. `reservations`: `requestId` + `status` + `rank`
6. `reservations`: `donorId` + `status` + `createdAt`
7. `alerts`: `severity` + `createdAt`
8. `alerts`: `bloodGroup` + `severity` + `createdAt`
9. `audit_logs`: `userId` + `timestamp`
10. `audit_logs`: `action` + `timestamp`

---

## Data Relationships

```
users/{uid}
  ├── donors/{uid} (same uid)
  ├── hospitals/{uid} (same uid)
  └── audit_logs (userId reference)

donation_requests/{id}
  ├── reservations (requestId reference)
  ├── ml_outputs/demand/{id}
  └── alerts (relatedRequestId reference)

reservations/{id}
  ├── ml_outputs/availability/{id}
  └── ml_outputs/reliability/{id}
```

---

## Security Considerations

- **Role-based access**: Enforced via Firestore Security Rules (see Step 5)
- **PII protection**: Patient names can be anonymized
- **Audit trail**: All critical actions logged
- **ML explainability**: All predictions stored with inputs/outputs

---

**This data model supports the event-driven architecture where:**
- UI creates events → Firestore stores truth → Functions think → ML advises → UI observes
