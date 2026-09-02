# VeinLink — Machine Learning Privacy & Feature Allowlist Specification

## 1. Zero-PHI ML Pipeline

Machine Learning services (FastAPI compatibility ranker, demand forecaster, routing optimizer) operate strictly outside the Protected Health Information (PHI) trust zone:

```text
Convex Database
     │
     ▼ (Privacy Gateway)
buildMLFeatures()
     │
     ▼ (Strict Allowlist Feature Vector)
FastAPI / ML Engine
     │
     ▼ (Prediction Score + Uncertainty)
Convex Database
```

---

## 2. Mandatory Feature Allowlist

The feature extraction layer enforces an explicit allowlist. Any field not listed below is omitted by default:

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| `distanceKm` | Float | Derived Haversine distance from donor to hospital (km). |
| `urgencyLevel` | Categorical | Requisition urgency (`ROUTINE`, `URGENT`, `CRITICAL`). |
| `bloodGroupMatch` | Boolean | True if donor blood group is compatible with recipient. |
| `daysSinceLastDonation` | Integer | Normalized cooldown tracking metric. |
| `pastAcceptanceRate` | Float | Historical acceptance probability $\in [0.0, 1.0]$. |
| `completedDonations` | Integer | Total successful prior donations. |
| `noShows` | Integer | Total count of unfulfilled accepted reservations. |
| `avgResponseMinutes` | Float | Mean response latency to notification dispatches. |

### Explicitly Excluded Attributes:
- `donorName`, `patientName`
- `email`, `phone`
- `streetAddress`, `zipCode`
- Exact `latitude`, `longitude`
- National ID / SSN / Aadhaar numbers
- Detailed medical notes
