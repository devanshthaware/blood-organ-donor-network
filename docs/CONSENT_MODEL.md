# VeinLink — Consent Management & Purpose Limitation Model

## 1. Purpose-Specific Consent Taxonomy

VeinLink treats consent not as an all-or-nothing checkbox, but as a granular, purpose-bound authorization contract:

1. **`DONATION`**: Authorizes registration in the donor network and evaluation of medical eligibility for blood/organ allocation.
2. **`EMERGENCY_CONTACT`**: Permits time-critical SMS and push notifications during emergency shortages within 15km.
3. **`LOCATION_PROCESSING`**: Authorizes the server-side calculation of travel distances (`distanceKm`) for logistical feasibility.
4. **`AI_PROCESSING`**: Permits the inclusion of de-identified numeric features in algorithmic matching and demand models.
5. **`COMMUNICATION`**: Authorizes routine operational messages, post-donation follow-ups, and cooldown reminders.
6. **`RESEARCH`**: Permits the use of aggregate, fully anonymized metrics for healthcare network optimization research.

---

## 2. Consent Lifecycle & Versioning

- **States**: `PENDING` $\to$ `GRANTED` $\to$ `WITHDRAWN` (or `EXPIRED_OR_INVALID`).
- **Policy Versioning**: Every consent grant references the active `version` (e.g., `2.1.0-2026`). If a major policy revision occurs, re-consent workflows are initiated.
- **Immediate Downstream Revocation**:
  - Revoking `COMMUNICATION` instructs the n8n automation bridge to filter the donor from scheduled reminders.
  - Revoking `EMERGENCY_CONTACT` excludes the donor from automated emergency dispatch rosters.
  - Revoking `DONATION` immediately sets registry status to `INACTIVE`.
