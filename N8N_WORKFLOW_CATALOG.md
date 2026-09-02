# VeinLink — n8n Workflow Catalog

This catalog documents the 8 core automated healthcare workflows orchestrated by n8n.

---

## Workflow #1: Critical Blood Shortage Orchestration

- **Name**: `blood-shortage-orchestration`
- **Version**: `1.0.0`
- **Purpose**: Evaluates regional inventory thresholds and notifies on-call blood-bank coordinators.
- **Trigger**: `blood.inventory.low`, `blood.inventory.critical`
- **Inputs**: `bloodType`, `currentUnits`, `threshold`, `facilityId`
- **Actions**:
  1. Validates real-time Convex inventory.
  2. If $\le 2$ units, formulates urgent cross-facility mobilization plan.
  3. Dispatches SMS/Push alerts to verified blood-bank coordinators and hospital transfusion leads.
  4. Records `CRITICAL` operational escalation in Convex.
- **External Services**: Twilio SMS, Firebase Cloud Messaging (Push), SendGrid.
- **Human Checkpoint**: Regional Blood Bank Coordinator review.
- **Failure Behavior**: Retries up to 3 times before dead-letter queue.
- **Audit Behavior**: Writes `WORKFLOW_ESCALATION_TRIGGERED` to `auditLogs`.

---

## Workflow #2: Emergency Blood Request Orchestration

- **Name**: `emergency-blood-orchestration`
- **Version**: `1.0.0`
- **Purpose**: Orchestrates urgent donor communications around active emergency trauma blood requisitions.
- **Trigger**: `emergency.request.created`
- **Inputs**: `requestId`, `hospitalId`, `bloodType`, `urgency`
- **Actions**:
  1. Queries Convex matching engine for verified compatible donors within 15km.
  2. Broadcasts push alerts to matched donors.
  3. Alerts on-call hospital transfusion team.
  4. Arms 30-minute fulfillment monitor timer.
- **External Services**: Push Notifications, SMS Gateway.
- **Human Checkpoint**: Hospital Transfusion Officer.
- **Failure Behavior**: Retries failed notification deliveries with exponential backoff.
- **Audit Behavior**: Emits `EMERGENCY_DONOR_OUTREACH_DISPATCHED`.

---

## Workflow #3: Organ Available & Review Orchestration

- **Name**: `organ-available-orchestration`
- **Version**: `1.0.0`
- **Purpose**: Triggers candidate matching and allocation recommendation, generating a coordinator review task.
- **Trigger**: `organ.available`, `organ.registered`
- **Inputs**: `organId`, `organType`, `bloodType`, `preservationDeadline`
- **Actions**:
  1. Validates organ verification status in Convex.
  2. Triggers matching engine & multi-objective allocation optimizer.
  3. Creates `PENDING_REVIEW` task in Hospital Coordinator Portal.
  4. Dispatches emergency alert to on-call transplant coordinator.
- **Safety Invariant**: Autonomous allocation is strictly blocked.
- **External Services**: PagerDuty / On-Call Alerting, Email, SMS.
- **Human Checkpoint**: Mandatory Transplant Coordinator Approval.
- **Failure Behavior**: Escalates to secondary on-call coordinator if unread after 15 minutes.
- **Audit Behavior**: Logs `ORGAN_MATCHING_EVALUATED` in `auditLogs`.

---

## Workflow #4: Organ Preservation Warning & Escalation

- **Name**: `organ-preservation-escalation`
- **Version**: `1.0.0`
- **Purpose**: Evaluates remaining cold ischemia countdown and escalates alerts through graduated risk tiers.
- **Trigger**: `organ.preservation.warning`, `organ.preservation.critical`
- **Inputs**: `organId`, `remainingHours`, `riskTier`
- **Actions**:
  - `MODERATE` ($< 6\text{h}$): In-app status alert.
  - `HIGH` ($< 4\text{h}$): SMS alert to transplant coordinator + aeromedical carrier.
  - `CRITICAL` ($< 2\text{h}$): Emergency dispatch to Lead Surgeon and Operating Room Lead.
  - `EXPIRED` ($0\text{h}$): Operation paused for clinical advisory committee review.
- **Safety Invariant**: Never silently cancels or reallocates an organ.
- **External Services**: Twilio Voice Call, Priority Push.
- **Human Checkpoint**: Chief Medical Officer & Surgical Lead.
- **Failure Behavior**: Exponential backoff retry.

---

## Workflow #5: Time-Critical Logistics Delay Escalation

- **Name**: `logistics-delay-orchestration`
- **Version**: `1.0.0`
- **Purpose**: Evaluates transit delays against the preservation deadline and alerts surgical arrival teams.
- **Trigger**: `transport.delay.detected`
- **Inputs**: `transportId`, `delayMinutes`, `reason`, `isCriticalToDeadline`
- **Actions**:
  1. Recalculates destination ETA against remaining preservation buffer.
  2. Notifies transport carrier and destination hospital receiving bay.
  3. If delay threatens preservation deadline, generates `CRITICAL` escalation.
- **Safety Invariant**: Enforces Anti-Autonomous Reallocation Invariant.
- **External Services**: Transport Telemetry Webhook, SMS.
- **Human Checkpoint**: Logistics Coordinator & Destination Surgeon.
- **Failure Behavior**: Retries 3 times before routing to DLQ.

---

## Workflow #6: Computer Vision / OCR Discrepancy Escalation

- **Name**: `cv-mismatch-orchestration`
- **Version**: `1.0.0`
- **Purpose**: Pauses operational handoff when physical label extraction diverges from the authoritative digital record.
- **Trigger**: `verification.mismatch.detected`
- **Inputs**: `requestId`, `entityType`, `mismatches`
- **Actions**:
  1. Locks operational handover and transport transition.
  2. Creates mandatory Human Review Task in Verification Center.
  3. Dispatches high-severity alert to Quality Assurance Coordinator for physical inspection.
- **Safety Invariant**: Anti-Auto-Modification Invariant (DB records left untouched).
- **External Services**: Quality Management Webhook, Email.
- **Human Checkpoint**: Quality Assurance Coordinator.

---

## Workflow #7: Donor Post-Care & Future Eligibility Follow-Up

- **Name**: `donor-followup-orchestration`
- **Version**: `1.0.0`
- **Purpose**: Automates post-donation gratitude messages and calendar reminders for 56-day future donation eligibility.
- **Trigger**: `blood.donation.completed`, `blood.reservation.expired`
- **Inputs**: `donorId`, `completedAt`, `eventType`
- **Actions**:
  1. Sends personalized thank-you message to donor.
  2. Calculates next eligible donation date ($+56$ days).
  3. Schedules automated calendar reminder 3 days prior to eligibility date.
- **Safety Invariant**: Adheres strictly to Convex 56-day cooldown rule.
- **External Services**: Email, WhatsApp.
- **Human Checkpoint**: None (Non-clinical outreach).

---

## Workflow #8: Unresolved Emergency Request Escalation

- **Name**: `unresolved-emergency-escalation`
- **Version**: `1.0.0`
- **Purpose**: Multi-tier escalation for blood requisitions remaining unfulfilled after automated timer expiration.
- **Trigger**: `network.escalation.triggered`
- **Inputs**: `requestId`, `elapsedMinutes`, `bloodType`, `hospitalName`
- **Actions**:
  1. Evaluates elapsed requisition duration ($>45$ mins).
  2. Escalates alert to Regional Network Operations Administrator.
  3. Broadcasts transfer queries to neighboring hospital blood networks.
  4. Records operational escalation incident in Network Audit Trail.
- **External Services**: Senior Leadership Alerting, SMS.
- **Human Checkpoint**: Regional Network Director.
- **Failure Behavior**: Re-queues alert every 15 minutes until acknowledged.
