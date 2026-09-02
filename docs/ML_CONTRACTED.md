
---

# ✅ STEP 1 — FREEZE THE ML CONTRACT

## Goal

Define **exact inputs, outputs, types, and meanings** for every ML endpoint so:

* FastAPI knows what to accept
* Firebase knows what to store
* Next.js knows what to send
* Tests stop breaking mysteriously

Once frozen, **do not change lightly**.

---

## 1️⃣ Create a Contracts Folder

Inside your project root:

```
docs/
  ml_contracts.md
```

This file is *human-readable truth*.
Code will mirror it later.

---

## 2️⃣ Donor Availability Model Contract

### Endpoint

```
POST /availability
```

### Model File

```
donor_availability_model.joblib
```

### Input Schema (REQUIRED)

| Field                    | Type   | Description                        |
| ------------------------ | ------ | ---------------------------------- |
| blood_group              | number | Encoded blood group (A+, O−, etc.) |
| distance_km              | number | Distance donor → hospital          |
| days_since_last_donation | number | Integer days                       |
| past_acceptance_rate     | number | 0.0 – 1.0                          |
| urgency_level            | number | Encoded urgency                    |
| time_of_day              | number | Encoded hour bucket                |

### Example JSON

```json
{
  "blood_group": 3,
  "distance_km": 12.5,
  "days_since_last_donation": 45,
  "past_acceptance_rate": 0.72,
  "urgency_level": 2,
  "time_of_day": 18
}
```

### Output

```json
{
  "availability_probability": 0.8342
}
```

### Guarantees

* Always returns `0.0 – 1.0`
* Never returns strings
* No side effects

---

## 3️⃣ Demand Forecasting Model Contract

### Endpoint

```
POST /demand
```

### Model File

```
demand_forecasting_model.joblib
```

### Input Schema

| Field        | Type   |
| ------------ | ------ |
| region       | number |
| blood_group  | number |
| demand_units | number |
| supply_units | number |
| month        | number |
| day          | number |

### Example JSON

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

### Output

```json
{
  "predicted_demand": 134.6
}
```

---

## 4️⃣ Donor Reliability Model Contract

### Endpoint

```
POST /reliability
```

### Model File

```
donor_reliability_model.joblib
```

### Input Schema

(Must match `feature_names_in_` exactly)

| Field                     | Type   |
| ------------------------- | ------ |
| total_requests            | number |
| accepted_requests         | number |
| completed_donations       | number |
| no_shows                  | number |
| avg_response_time_minutes | number |

### Example JSON

```json
{
  "total_requests": 40,
  "accepted_requests": 32,
  "completed_donations": 28,
  "no_shows": 4,
  "avg_response_time_minutes": 12.5
}
```

### Output

```json
{
  "reliability_score": 0.78
}
```

---

## 5️⃣ Contract Rules (Non-Negotiable)

Write this **verbatim** at the bottom of `ml_contracts.md`:

* Feature names **must match model.feature_names_in_**
* Frontend never transforms features
* All categorical encodings happen **before** API call
* Missing fields = 422 error
* Extra fields = ignored or rejected (choose one)

This prevents schema drift—the silent killer.

---

## 6️⃣ Lock It in Code (FastAPI)

Your Pydantic schemas must mirror this **exactly**.
Your tests must assert this shape.
Your frontend must copy-paste these examples.

At this point:

* Models ✔
* APIs ✔
* Tests ✔
* Humans ✔

---

## What You’ve Achieved

You just created:

* A **single source of truth**
* A contract that survives refactors
* A foundation for event-driven ML

Most teams skip this and pay for it later.

---

### NEXT STEP (Step 2 Preview)

**Run ML as a hardened standalone service**
→ health checks
→ timeouts
→ versioning
→ production-safe config

Say **“Step 2”** when ready.
