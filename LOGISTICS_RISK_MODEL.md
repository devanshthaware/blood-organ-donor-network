# VeinLink — Organ Logistics Risk Model & Feasibility Specification

## 1. Risk Evaluation Principles

Transport feasibility must not assume that $\text{ETA} < \text{Deadline}$ is inherently safe. Real-world organ transit involves traffic unpredictability, flight dispatch clearances, and surgical prep handoffs.

The logistics risk model evaluates feasibility using the following formulation:

$$\text{Projected Arrival} = \text{Departure Time} + \text{Estimated Transit Duration}$$

$$\text{Committed Deadline} = \text{Projected Arrival} + \text{Operational Safety Buffer}$$

$$\text{Buffer Margin} = \text{Preservation Deadline} - \text{Committed Deadline}$$

---

## 2. Risk Classification Tiers

| Risk Tier | Buffer Margin Threshold | Feasibility Verdict | Clinical & Operational Implications |
| :--- | :---: | :---: | :--- |
| **LOW** | $> 60\text{ minutes}$ | `FEASIBLE` | Comfortable buffer margin. Standard routine tracking. |
| **MODERATE** | $0 \le \text{Margin} \le 60\text{ min}$ | `FEASIBLE` | Acceptable safety buffer. Coordinator monitors progress at waypoints. |
| **HIGH** | $\text{Margin} < 0\text{ min}$ but $\text{ETA} < \text{Deadline}$ | `RISKY` | Arrival projected before deadline, but required safety buffer is compressed. High vulnerability to unforeseen transit delays. |
| **CRITICAL** | $\text{ETA} \ge \text{Preservation Deadline}$ | `INFEASIBLE` | Projected arrival is past the cold ischemia deadline. Urgent escalation triggered. |
| **EXPIRED** | $\text{Current Time} \ge \text{Deadline}$ | `INFEASIBLE` | Cold ischemia preservation clock has run out. Organ is non-viable. |

---

## 3. Configurable Transport Mode Parameters

| Mode | Max Effective Range | Transit Speed | Prep / Handoff Buffer | Safety Buffer | Recommended Range |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Ground Ambulance** | $350\text{ km}$ | $75\text{ km/h}$ | $25\text{ min}$ | $30\text{ min}$ | Local & regional transfers within 200 km. |
| **Medical Air Charter** | $2500\text{ km}$ | $480\text{ km/h}$ | $50\text{ min}$ | $60\text{ min}$ | Cross-state or national corridor transfers $> 200\text{ km}$. |
| **Specialized Courier** | $200\text{ km}$ | $85\text{ km/h}$ | $20\text{ min}$ | $30\text{ min}$ | Urgent intra-city express courier transfers. |

---

## 4. Delay Detection & Escalation Logic

Milestone delay analysis evaluates schedule slippage:

$$\Delta_{\text{delay}} = \text{Actual Timestamp} - \text{Expected Milestone Timestamp}$$

1. **Minor Variance ($\Delta_{\text{delay}} < 15\text{ min}$)**: Absorbed by the operational buffer. No alerts generated.
2. **Operational Delay ($\Delta_{\text{delay}} \ge 15\text{ min}$)**: State advances to `DELAYED`, appends `DELAY_DETECTED` event, and adjusts projected arrival.
3. **Critical Delay**: If the new arrival plus remaining transit leaves $< 30\text{ minutes}$ of total preservation buffer, dispatches a **CRITICAL** logistics alert for immediate coordinator intervention.

---

## 5. Future Integration Points

### Future n8n Automation Workflows
Logistics alerts and milestone completions expose deterministic webhook payloads suitable for future external n8n orchestration:
- `CriticalTransportRisk`: Triggers SMS/WhatsApp alerts to surgical team and airport dispatchers.
- `DeliveryConfirmed`: Triggers hospital billing and registry closing automations.

### Future Blockchain Audit Anchoring
The sequence of verified transit events (`TransportAssigned` $\to$ `PickupCompleted` $\to$ `Departed` $\to$ `Arrived` $\to$ `DeliveryConfirmed`) is structured to allow immutable cryptographic hash-anchoring on a public/private blockchain without leaking protected patient health information.
