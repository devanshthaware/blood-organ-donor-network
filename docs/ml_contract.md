# ML Contract — Single Source of Truth

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Authoritative

This document defines the exact inputs, outputs, types, and meanings for every ML endpoint. This contract must be respected by:
- FastAPI ML service
- Firebase Cloud Functions
- Next.js frontend
- All tests and integrations

**⚠️ Breaking changes require version bump and team notification.**

---

## Base URL

```
http://localhost:8000  (local)
https://your-ml-service.com  (production)
```

---

## Model 1: Donor Reliability

### Purpose
Predicts the likelihood that a donor will complete a donation request based on historical behavior.

### Endpoint
```
POST /predict/reliability
```

### Input JSON Schema

| Field | Type | Range | Description | Required |
|-------|------|-------|-------------|----------|
| `total_requests` | integer | 0-10000 | Total number of donation requests sent to this donor | ✅ |
| `accepted_requests` | integer | 0-10000 | Number of requests accepted by donor | ✅ |
| `completed_donations` | integer | 0-10000 | Number of completed donations | ✅ |
| `no_shows` | integer | 0-10000 | Number of accepted requests that resulted in no-show | ✅ |
| `avg_response_time_minutes` | float | 0.0-1440.0 | Average response time in minutes | ✅ |

**Validation Rules:**
- `accepted_requests` ≤ `total_requests`
- `completed_donations` ≤ `accepted_requests`
- `no_shows` ≤ `accepted_requests`
- `completed_donations + no_shows` ≤ `accepted_requests`

### Output JSON Schema

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `reliability_score` | float | 0.0-1.0 | Probability score (higher = more reliable) |

### Example Request

```json
{
  "total_requests": 40,
  "accepted_requests": 32,
  "completed_donations": 28,
  "no_shows": 4,
  "avg_response_time_minutes": 12.5
}
```

### Example Response

```json
{
  "reliability_score": 0.78
}
```

### Notes
- Score is clamped between 0.0 and 1.0
- Model file: `donor_reliability_model.joblib`
- Returns float, never string
- No side effects

---

## Model 2: Donor Availability

### Purpose
Predicts the probability that a donor will accept a specific donation request.

### Endpoint
```
POST /predict/availability
```

### Input JSON Schema

| Field | Type | Range | Description | Required |
|-------|------|-------|-------------|----------|
| `blood_group` | integer | 0-7 | Encoded blood group (see enum below) | ✅ |
| `distance_km` | float | 0.0-1000.0 | Distance from donor to donation center in kilometers | ✅ |
| `days_since_last_donation` | integer | 0-365 | Days since last donation | ✅ |
| `past_acceptance_rate` | float | 0.0-1.0 | Historical acceptance rate (0.0 to 1.0) | ✅ |
| `urgency_level` | integer | 0-3 | Encoded urgency level (see enum below) | ✅ |
| `time_of_day` | integer | 0-3 | Encoded time of day (see enum below) | ✅ |

**Blood Group Encoding:**
- `0` = O_NEGATIVE
- `1` = O_POSITIVE
- `2` = A_NEGATIVE
- `3` = A_POSITIVE
- `4` = B_NEGATIVE
- `5` = B_POSITIVE
- `6` = AB_NEGATIVE
- `7` = AB_POSITIVE

**Urgency Level Encoding:**
- `0` = LOW
- `1` = MEDIUM
- `2` = HIGH
- `3` = CRITICAL

**Time of Day Encoding:**
- `0` = MORNING
- `1` = AFTERNOON
- `2` = EVENING
- `3` = NIGHT

### Output JSON Schema

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `availability_probability` | float | 0.0-1.0 | Probability of acceptance (higher = more likely) |

### Example Request

```json
{
  "blood_group": 3,
  "distance_km": 12.5,
  "days_since_last_donation": 45,
  "past_acceptance_rate": 0.72,
  "urgency_level": 2,
  "time_of_day": 1
}
```

### Example Response

```json
{
  "availability_probability": 0.8342
}
```

### Notes
- Model file: `donor_availability_model.joblib`
- Returns probability rounded to 4 decimal places
- Categorical features (`blood_group`, `urgency_level`, `time_of_day`) must be encoded as integers
- No side effects

---

## Model 3: Demand Forecasting

### Purpose
Predicts future blood demand probability for a given region, blood group, and time period.

### Endpoint
```
POST /predict/demand
```

### Input JSON Schema

| Field | Type | Range | Description | Required |
|-------|------|-------|-------------|----------|
| `region` | integer | 0-100 | Encoded region identifier | ✅ |
| `blood_group` | integer | 0-7 | Encoded blood group (same as availability model) | ✅ |
| `demand_units` | integer | 0-10000 | Current demand in units | ✅ |
| `supply_units` | integer | 0-10000 | Current supply in units | ✅ |
| `month` | integer | 1-12 | Month of the year (1=January, 12=December) | ✅ |
| `day` | integer | 1-31 | Day of the month | ✅ |

**Day Validation:**
- Day must be valid for the given month (e.g., day 31 invalid for February)
- Maximum days per month: Jan(31), Feb(29), Mar(31), Apr(30), May(31), Jun(30), Jul(31), Aug(31), Sep(30), Oct(31), Nov(30), Dec(31)

### Output JSON Schema

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `predicted_demand` | float | 0.0-1.0 | Probability of high demand (higher = more likely high demand) |

### Example Request

```json
{
  "region": 1,
  "blood_group": 4,
  "demand_units": 120,
  "supply_units": 95,
  "month": 2,
  "day": 14
}
```

### Example Response

```json
{
  "predicted_demand": 0.85
}
```

### Notes
- Model file: `demand_forecasting_model.joblib`
- Model is a classifier with classes: ['High', 'Low', 'Medium']
- Returns probability of 'High' demand class
- Categorical features (`region`, `blood_group`) must be encoded as integers
- No side effects

---

## Health & Version Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "models_loaded": true
}
```

### Version
```
GET /version
```

**Response:**
```json
{
  "version": "1.0.0"
}
```

---

## Error Responses

All endpoints may return:

**400 Bad Request**
```json
{
  "detail": "Validation error message"
}
```

**422 Unprocessable Entity**
```json
{
  "detail": "Field validation error"
}
```

**500 Internal Server Error**
```json
{
  "detail": "Model inference error"
}
```

---

## Contract Rules (Non-Negotiable)

1. **Feature names must match `model.feature_names_in_` exactly**
2. **Frontend never transforms features** — all encoding happens in Firebase Functions
3. **All categorical encodings happen before API call** — send integers, not strings
4. **Missing required fields = 422 error**
5. **Extra fields = ignored** (FastAPI Pydantic behavior)
6. **All scores/probabilities are floats in range [0.0, 1.0]**
7. **No side effects** — ML service is stateless
8. **Idempotent** — same input always produces same output

---

## Integration Guidelines

### Firebase Functions
- Call ML API with exact field names from this contract
- Handle timeouts (recommended: 10s timeout)
- Retry on 500 errors (max 2 retries)
- Log all ML calls to `audit_logs` collection
- Store results in `ml_outputs` collection

### Next.js Frontend
- **NEVER call ML APIs directly**
- Only read from Firestore (`ml_outputs`, `reservations`, etc.)
- All ML decisions flow through Firebase Functions

### Testing
- Use exact examples from this document
- Assert response shape matches schema
- Test boundary conditions (min/max values)
- Test validation rules

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial contract definition |

---

**This document is authoritative. Code must conform to this contract.**
