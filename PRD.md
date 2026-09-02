# VeinLink — Product Requirements Document (PRD)

| **Document Title** | VeinLink: Unified Blood & Organ Network Intelligence Platform |
| :--- | :--- |
| **Document Type** | Product Requirements Document (PRD) |
| **Version** | 2.0.0 |
| **Status** | Approved / Fully Implemented |
| **Target Release** | Unified Healthcare Network |
| **Author** | Antigravity AI & Core Engineering Team |

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**VeinLink** is an AI-powered, real-time Blood & Organ Network Intelligence Platform connecting donors, patients, hospitals, blood banks and transplant coordination centers through predictive intelligence, resource matching, optimization, explainable decision support, real-time coordination and auditable workflows.

The platform treats **BLOOD** and **ORGAN** as two first-class resource domains inside one unified healthcare coordination platform.

### 1.2 The 5 Problem Statement Pillars
1. **Intelligent Blood Donor Matching & Emergency Allocation**: High-precision geodesic matching, reliability scoring, and clinical safety gates (56-day cooldown).
2. **Predictive Blood Shortage & Proactive Donor Mobilization**: Multi-horizon forecasting (6h to 14d) with 90% confidence intervals and depletion velocity alarms.
3. **Real-Time Donor–Hospital Coordination & Logistics**: Dynamic donor availability modeling, arrival ETA decomposition, and cold ischemia viability countdowns.
4. **Explainable & Fair Organ Allocation Decision Support**: Pareto multi-objective ranking, non-autonomous human coordinator review gates, and transparent XAI trade-off explanations.
5. **Unified Blood & Organ Network Intelligence Platform**: Heterogeneous topological graph modeling, regional resilience scoring, and digital twin simulation.

---

## 2. User Personas & Target Audience

### 2.1 Persona A: Dr. Sarah Lin — Hospital Blood Bank Coordinator
- **Role:** Head of Transfusion Logistics at a Tier-1 Trauma Center.
- **Goals:** Maintain sufficient blood supply across all blood types; fulfill emergency trauma requests in < 15 minutes; prevent inventory expiration.
- **Pain Points:** Too many disparate systems; manual phone calls during night shifts; unexpected stock depletion during mass trauma events.
- **Needs:** Single-pane dashboard showing live unit counts, one-click emergency broadcast by urgency tier, and real-time candidate donor acceptance status.

### 2.2 Persona B: Marcus Vance — Active Blood Donor
- **Role:** Regular donor (O-positive), working professional.
- **Goals:** Donate blood to save lives when truly needed; avoid unsolicited spam; understand donation eligibility and track health cooldowns.
- **Pain Points:** Bombarded by generic notifications when at work or ineligible due to recent donations; lack of transparency on whether their donation actually made a difference.
- **Needs:** Smart notifications only when nearby and eligible; clear driving directions via map; recovery progress tracking (56-day interval); personal impact statistics.

### 2.3 Persona C: Elena Rostova — Healthcare Network Administrator & Compliance Officer
- **Role:** Quality Assurance & System Auditor for Regional Health Authority.
- **Goals:** Ensure 100% compliance with medical safety rules; audit algorithmic fairness and decision accuracy; monitor technical latency and reliability.
- **Pain Points:** Lack of audit trails in existing manual processes; AI hallucinations or unverified models making opaque decisions.
- **Needs:** Immutable audit logs of every system interaction, real-time AI performance monitoring (latency, confidence scores, fallback rates), and verified donor accreditation records.

---

## 3. Product Scope & Milestones

### 3.1 In-Scope (MVP Release)
- Role-based authentication and navigation for Donors, Hospitals, and Admins.
- Live blood inventory management across 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- Multi-tier donation request workflow (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Automated multi-stage donor matching engine combining:
  - Rule-based safety filters (56-day cooldown, health fitness, urgency-adjusted distance).
  - ML predictive scoring (Availability model + Reliability model).
- Explainable AI (XAI) engine generating human-readable match explanations with deterministic fallback.
- Real-time donor acceptance/declination and atomic reservation confirmation.
- Spatial donor-to-hospital distance calculation and interactive Leaflet map navigation.
- Predictive regional blood shortage warning alerts triggered by inventory depletion.
- Administrative AI System Monitor (live telemetry) and Immutable Audit Logging.

### 3.2 Out-of-Scope (Future Releases)
- Direct integration with proprietary hospital Electronic Health Record (EHR) systems via HL7/FHIR (planned for Phase 2).
- Native iOS and Android mobile apps (PWA supported in MVP; native apps in Phase 2).
- Cold-chain transit IoT temperature sensor integration.
- Cross-border/national blood bank network federation.

---

## 4. Functional Requirements

### 4.1 Donor Portal (`/donor`)
| Req ID | Feature | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-D01** | **Bento Dashboard** | Display blood type badge, donor verification status, active availability toggle, recovery cooldown timer, and total lives saved. | P0 |
| **FR-D02** | **Safety Cooldown** | Enforce mandatory 56-day cooldown period between whole blood donations. Automatically toggle status to "Wait Period" until cooldown expires. | P0 |
| **FR-D03** | **Request Radar** | Real-time list of pending reservation invites displaying hospital name, urgency badge, distance (km), and required units. | P0 |
| **FR-D04** | **Explainable Match** | Display structured AI explanation detailing why the donor was prioritized (e.g. proximity, recovery fitness, historic reliability). | P1 |
| **FR-D05** | **Accept / Decline Action** | One-tap response to pending reservations. Instant atomic state transition to `ACCEPTED` or `DECLINED`. | P0 |
| **FR-D06** | **Hospital Map & Routing** | Interactive Leaflet map displaying hospital pinpoint, donor location, driving distance, and directions. | P1 |
| **FR-D07** | **Availability Schedule** | Donor can configure preferred recurring donation windows (days of week, morning/afternoon/evening slots). | P2 |
| **FR-D08** | **Donation History** | Tabular and historical view of completed donations, dates, locations, and units contributed. | P2 |

---

### 4.2 Hospital Portal (`/hospital`)
| Req ID | Feature | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-H01** | **Live Inventory Matrix** | Visual matrix showing real-time unit counts and safety thresholds for all 8 standard blood groups. | P0 |
| **FR-H02** | **Request Dispatcher** | Form to create emergency or scheduled blood requests specifying blood group, units needed, urgency, and clinical notes. | P0 |
| **FR-H03** | **Urgency Stratification** | System dynamically applies search radiuses based on urgency: `LOW` (100km), `MEDIUM` (75km), `HIGH` (50km), `CRITICAL` (100km). | P0 |
| **FR-H04** | **Donor Activation Tile** | Live list of top-ranked candidate donors with combined ML scores, availability probabilities, and reliability ratings. | P1 |
| **FR-H05** | **Pre-Donation Checkups** | Manage patient and donor clinical checkup appointments (hemoglobin, blood pressure, vitals screening). | P2 |
| **FR-H06** | **Shortage & Supply Alerts** | Proactive warning notifications when inventory or regional forecast predicts imminent depletion. | P0 |
| **FR-H07** | **Fulfillment Tracking** | Progress tracker displaying units requested vs units confirmed vs units completed. Auto-closes request when target reached. | P1 |

---

### 4.3 Administrator Portal (`/admin`)
| Req ID | Feature | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-A01** | **AI System Monitor** | Real-time observability dashboard streaming ML inference events across demand, availability, and reliability models. | P0 |
| **FR-A02** | **Inference Telemetry** | Displays model execution latency (ms), input parameters, output probabilities, model version, and confidence ratings. | P1 |
| **FR-A03** | **Audit Trail Explorer** | Searchable, filterable ledger of all system audit logs (`REQUEST_CREATED`, `RESERVATION_CONFIRMED`, `INVENTORY_CHANGED`). | P0 |
| **FR-A04** | **Donor & Hospital Directory**| Master list of registered donors and accredited hospitals with status overrides (Activate, Suspend, Verify). | P1 |
| **FR-A05** | **Regional Health Heatmap** | High-level regional view displaying supply vs demand balances and active emergency hotspots. | P2 |

---

## 5. Machine Learning & Decision Logic Requirements

### 5.1 Model Specifications
1. **Blood Demand Forecasting Model:**
   - **Goal:** Predict demand surge probability for specific regions and blood types.
   - **Inputs:** `region`, `blood_group`, `demand_units`, `supply_units`, `month`, `day`.
   - **Thresholds:** $\ge 0.70$ generates `CRITICAL` alert; $\ge 0.50$ generates `HIGH` alert; $\ge 0.30$ generates `MEDIUM` alert.
2. **Donor Reliability Model:**
   - **Goal:** Quantify historical commitment and likelihood of showing up.
   - **Inputs:** `total_requests`, `accepted_requests`, `completed_donations`, `no_shows`, `avg_response_time_minutes`.
   - **Output:** Continuous reliability score from $0.0$ to $1.0$. Default $0.5$ for new unverified donors.
3. **Donor Availability Model:**
   - **Goal:** Forecast real-time probability that an eligible donor will accept an incoming request.
   - **Inputs:** `distance_km`, `time_of_day` (0–3), `urgency_level` (0–3), `days_since_last_donation`, `past_acceptance_rate`.
   - **Output:** Continuous probability from $0.0$ to $1.0$.

### 5.2 Multi-Stage Filtering & Ranking Pipeline
```
[All Donors in Database]
         │
         ▼ (Rule 1: Blood Group Compatibility Match)
[Matched Blood Type Donors]
         │
         ▼ (Rule 2: isActive == true AND healthStatus != 'UNFIT')
[Active & Healthy Donors]
         │
         ▼ (Rule 3: Cooldown >= 56 Days Since Last Donation)
[Medically Eligible Donors]
         │
         ▼ (Rule 4: Geodesic Haversine Distance <= Urgency Limit)
[Geographically Viable Donors]
         │
         ▼ (ML Scoring: Availability & Reliability Inference)
[Scored Donors: Combined = 0.60*Avail + 0.40*Reliab]
         │
         ▼ (ML Thresholds: Avail >= 0.30, Reliab >= 0.20, Combined >= 0.35)
[Qualified Ranked Candidates]
         │
         ▼ (LLM / Fallback Explanation Generation)
[Top N Notified via Reservations (2x target units buffer)]
```

### 5.3 Explainable AI (XAI) Guardrails
- **Zero Generative Medical Diagnoses:** The LLM is strictly prohibited from rendering clinical diagnoses, health eligibility determinations, or independent donor rankings.
- **Input Grounding:** The LLM prompt only receives verified data: blood group, distance, urgency, demand forecast, and calculated ML scores.
- **Deterministic Fallback Engine:** If LLM inference latency exceeds 2.5 seconds or returns an error, the system must immediately fall back to local rule-based template generation without dropping the match.

---

## 6. Non-Functional Requirements (NFRs)

### 6.1 Performance & Latency
- **End-to-End Donor Dispatch:** From hospital request submission to donor notification creation must execute in $< 3.0$ seconds under normal load.
- **ML Inference Execution:** Each individual model inference endpoint on FastAPI must respond in $< 200$ ms.
- **Web UI Responsiveness:** First Contentful Paint (FCP) $< 1.2$ seconds; Time to Interactive (TTI) $< 2.0$ seconds on modern broadband.
- **Database Query Performance:** All queries on donors, reservations, and inventory must utilize composite indexes, ensuring $O(\log N)$ retrieval.

### 6.2 Availability & Resilience
- **Platform Availability Target:** 99.9% uptime for core donation request and reservation acceptance flows.
- **Graceful Degradation:** In the event of total ML microservice failure, Cloud Functions must default to geographic distance and rule-based sorting so emergency requests are never blocked.
- **Data Persistence:** Cloud Firestore multi-region active-active replication to prevent regional data loss.

### 6.3 Security, Privacy & Compliance
- **Zero Direct ML Exposure:** No client-side code may directly invoke the ML API. All calls are mediated by authenticated backend functions.
- **Role-Based Access Control (RBAC):** Donors can only inspect their own personal data and reservations. Hospitals can only inspect requests tied to their authorized facility.
- **Audit Logging:** Every critical state transition must be logged to an append-only collection with timestamp, IP address, user identity, and outcome.
- **PII De-identification in AI:** Feature vectors sent to ML inference services must contain solely anonymized numeric parameters; no donor names, phone numbers, or emails are transmitted.

---

## 7. Success Metrics & Key Performance Indicators (KPIs)

| KPI Category | Metric | Baseline / Legacy | VeinLink MVP Target |
| :--- | :--- | :--- | :--- |
| **Speed** | Mean Time to Donor Dispatch | 45–180 minutes (Manual) | **< 30 seconds** (Automated) |
| **Fulfillment** | Emergency Request Fulfillment Rate | ~65% | **> 92%** |
| **Donor Engagement** | Donor No-Show Rate | ~55%–65% | **< 20%** |
| **Supply Stability** | Advance Warning for Blood Deficits | 0–24 hours (Crisis Mode) | **7–14 days in advance** |
| **Observability** | Audit Log Capture Rate | Partial / Fragmented | **100% of state transitions** |
| **System Uptime** | Fallback Activation Success Rate | N/A | **100% (Zero dropped requests)** |

---

## 8. User Experience & UI Design Standards

1. **Rich Aesthetics:** Modern dark-mode-first aesthetic with curated HSL color schemes, glassmorphic panels, and dynamic cards.
2. **Bento Grid Architecture:** Multi-dimensional modular dashboard panels displaying key metrics without visual clutter.
3. **Clear Status Visuals:**
   - `PENDING`: Amber indicator
   - `ACCEPTED` / `CONFIRMED`: Emerald indicator
   - `CRITICAL`: Pulsing crimson alert
   - `DECLINED`: Muted slate indicator
4. **Accessible Geolocation:** Intuitive map controls with visual distance circles representing search radii.
