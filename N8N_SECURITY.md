# VeinLink — n8n Security & Trust Boundary Specification

## 1. Webhook Authentication & Request Signing

All webhooks passing between Convex and n8n are authenticated via **HMAC SHA-256 cryptographic signatures**:
- When Convex emits an event, it calculates `HMAC-SHA256(payload, N8N_WEBHOOK_SECRET)` and transmits it in the `x-veinlink-signature` HTTP header.
- n8n validates the signature against its configured secret before evaluating any workflow nodes.
- Requests with invalid, missing, or tampered signatures are rejected immediately with HTTP 401 Unauthorized.

---

## 2. Secrets Management & Zero-Commitment Policy

- Webhook secrets (`N8N_WEBHOOK_SECRET`), API keys (Twilio, SendGrid, Clerk), and database connection strings are managed exclusively via environment variables.
- No secrets or credentials are ever stored in Git repositories or serialized into workflow JSON definitions.

---

## 3. Data Minimization & PHI Protection

- **Synthetic Identifiers**: Domain event envelopes transmit internal identifiers (`organId`, `requestId`, `recipientId`, `facilityId`) rather than plaintext Patient Identifiers or Protected Health Information (PHI).
- Sensitive clinical notes, crossmatch lab reports, and recipient legal identities remain inside the encrypted Convex database layer.
- External notification payloads (e.g. SMS messages) contain operational instructions rather than clinical diagnoses.

---

## 4. Least-Privilege Role Isolation

- Calls from n8n into Convex mutations are restricted to automated callback operations (`recordWorkflowExecution`, `recordWorkflowEscalation`).
- n8n credentials cannot execute clinical allocation approvals, consent modifications, or user credential updates.
- All actions taken by n8n are recorded in `auditLogs` under the actor identity `system:n8n`.

---

## 5. Multi-Environment Isolation

- Workflows are strictly isolated across environments:
  - `development`: Uses simulated local runner and mock webhook endpoints.
  - `staging`: Connected to testing telecommunications sandbox (Twilio Test Credentials).
  - `production`: Fully authenticated, rate-limited, and audited.
- Events originating in `development` or `staging` cannot trigger notifications to real-world healthcare personnel.
