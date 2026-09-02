# Model Card — Dynamic Donor Availability & Arrival ETA (Availability-v2.0)

## 1. Model Overview & Purpose
- **Architecture**: Cumulative time-decay exponential probability function:
  $$P(\text{acceptance within } T \text{ min}) = P_{\text{base}} \times \left(1 - e^{-\lambda T}\right)$$
- **Task**: Replaces static binary acceptance with continuous time-sensitive probabilities ($T \in \{15, 30, 60\}$ minutes) alongside segmented transit arrival estimates.
- **Status**: ACTIVE (`modelRegistry`).

---

## 2. Input Features & Allowlist
- `distanceKm`: Derived Haversine road distance (zero raw GPS coordinates).
- `urgencyLevel`: Requisition urgency tier (`ROUTINE`, `URGENT`, `CRITICAL`).
- `historicalAcceptanceRate`: Cumulative acceptance ratio ($\in [0.0, 1.0]$).
- `avgResponseMinutes`: Mean historical notification response latency.
- `timeOfDayHours`: 24-hour clock for circadian responsiveness penalties.

---

## 3. Outputs
- `pAcceptanceWithin15Min`: Immediate emergency response probability.
- `pAcceptanceWithin30Min`: Standard urgent response probability.
- `pAcceptanceWithin60Min`: Operational batch response probability.
- `expectedResponseMinutes`: Predicted latency before donor reviews notification.
- `expectedTransitMinutes`: Predicted travel transit duration.
- `totalArrivalMinutes`: Total estimated time until physical arrival at hospital facility.
