# VeinLink — n8n Failure Handling, Retries & Dead-Letter Queue

## 1. Retry Strategy & Exponential Backoff

External integrations (telecommunications providers, email gateways, aeromedical carrier endpoints) can fail intermittently. VeinLink applies a controlled retry policy:
- **Maximum Retries**: 3 attempts.
- **Backoff Interval**:
  - Attempt 1: Immediate retry / $+5$ seconds.
  - Attempt 2: $+30$ seconds.
  - Attempt 3: $+120$ seconds.
- **Status Progression**: `RECEIVED` $\to$ `PROCESSING` $\to$ `RETRYING` $\to$ `COMPLETED` (or `DEAD_LETTER`).

---

## 2. Dead-Letter Queue (DLQ)

When an event exceeds the maximum retry limit (3 failures), it is automatically transitioned to `DEAD_LETTER`:
- Delivery status in `domainEvents` is set to `DEAD_LETTER`.
- Execution status in `workflowExecutions` is marked as `DEAD_LETTER` with the last recorded error stack trace.
- An alert is automatically published to the **Automation Monitor** dashboard (`/admin/automation`) for operator investigation.

---

## 3. Strict Idempotency Guarantees

To prevent repeated emergency side effects (e.g. sending 5 identical emergency SMS alerts during a network retry burst):
- Every workflow execution checks its compound `idempotencyKey` (`${workflowName}::${eventId}`).
- If an execution record with that key is already in status `COMPLETED`, the workflow engine bypasses all external notification side-effects and returns `{ alreadyProcessed: true, status: "ALREADY_COMPLETED" }`.

---

## 4. Controlled Event Replay

When an external outage is resolved (e.g. an SMS provider incident clears), administrators can replay failed or dead-letter events:
- **Authorized Replay Only**: Requires authenticated `admin` role.
- **Workflow State Reset**: The domain event's `deliveryStatus` is reset to `PENDING` and `deliveryAttempts` to 0.
- **Audit Logging**: Every replay action is logged with `DOMAIN_EVENT_REPLAY_AUTHORIZED` in `auditLogs`.
- **Idempotency Protection**: Workflows are re-evaluated safely without corrupting completed peer tasks.
