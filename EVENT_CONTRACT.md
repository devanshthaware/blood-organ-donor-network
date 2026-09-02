# VeinLink — Standard Domain Event Contract & Envelope Specification

**Contract Version**: `1.0.0`  
**Protocol**: Authenticated HTTP Webhooks (HMAC SHA-256)  

---

## 1. Domain Event Envelope Specification

Every domain event emitted by Convex strictly adheres to the standard `VeinLinkDomainEvent` envelope:

```typescript
interface VeinLinkDomainEvent<T = Record<string, unknown>> {
  /** Globally unique UUID identifying this specific event emission */
  eventId: string;

  /** Canonical hierarchical event taxonomy identifier */
  eventType: string;

  /** Event contract schema version */
  version: "1.0.0";

  /** UTC epoch timestamp in milliseconds when the domain state change occurred */
  occurredAt: number;

  /** Identity of the user or subsystem initiating the state transition */
  actor: {
    type: "user" | "system" | "coordinator" | "donor" | "admin";
    id?: string;
  };

  /** Originating technical layer emitting the event */
  source: {
    system: "convex" | "n8n" | "fastapi" | "system";
    service: string;
  };

  /** Authoritative aggregate root entity */
  aggregate: {
    type: "bloodInventory" | "donationRequest" | "organ" | "allocation" | "transport" | "verification";
    id: string;
  };

  /** End-to-end distributed tracing correlation identifier */
  correlationId: string;

  /** Context-specific domain event payload */
  payload: T;

  /** Operational metadata */
  metadata?: {
    facilityId?: string;
    priority?: "ROUTINE" | "URGENT" | "CRITICAL";
    environment?: "development" | "staging" | "production";
  };
}
```

---

## 2. Standard Webhook HTTP Headers

When Convex dispatches an event to n8n, the following headers are included:

| Header | Description | Example |
| :--- | :--- | :--- |
| `Content-Type` | MIME payload type | `application/json` |
| `x-veinlink-signature` | Hex-encoded HMAC SHA-256 payload signature | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `x-veinlink-event-id` | Unique Event Identifier | `EVT-1788325000000-ABC1234` |
| `x-veinlink-event-type` | Canonical Event Taxonomy Code | `organ.available` |
| `x-veinlink-correlation-id` | End-to-end distributed tracing ID | `CORR-1788325000000-XYZ99` |

---

## 3. Distributed Tracing & Correlation

- Every operational lifecycle initiates a `correlationId` (e.g. `CORR-1788325000000-XYZ99`).
- Downstream events emitted as a result of that lifecycle (e.g. `organ.available` $\to$ `organ.allocation.recommended` $\to$ `transport.request.created`) inherit the exact same `correlationId`.
- This enables end-to-end auditability across Convex, n8n, FastAPI, and future blockchain trust anchors.
