# VeinLink — Inter-Service API & Integration Contracts

```text
================================================================================
VEINLINK INTEGRATION CONTRACTS (v1.0.0)
================================================================================
```

## 1. Global Invariant: Correlation ID & Trace Propagation
All requests spanning service boundaries MUST include a correlation identifier:
- **Header**: `X-Correlation-ID: VL-YYYY-XXXX`
- **Payload Attribute**: `"correlationId": "VL-2026-XXXX"`

---

## 2. Contract 1: Convex $\longleftrightarrow$ FastAPI (ML Inference Boundary)

### Endpoint: `POST /predict/forecast/multi-horizon`
- **Security**: Service-to-service Bearer token (`ML_SERVICE_SECRET`).
- **Zero-PHI Check**: Must only contain aggregate/numeric fields.
- **Request Payload**:
  ```json
  {
    "correlation_id": "VL-2026-9812",
    "region_id": "REGION-PUNE-METRO",
    "blood_group": "O-",
    "current_inventory": 18,
    "recent_hourly_depletions": [2.0, 3.0, 2.5, 3.5],
    "historical_daily_average_demand": 24.0,
    "historical_daily_average_supply": 18.0,
    "is_emergency_hotspot": true
  }
  ```
- **Response Payload**:
  ```json
  {
    "region_id": "REGION-PUNE-METRO",
    "blood_group": "O-",
    "depletion_velocity": 2.8,
    "horizons": [
      {
        "horizon_hours": 6,
        "shortage_probability": 0.28,
        "expected_demand": 8.7,
        "expected_supply": 4.5,
        "net_projected_stock": 13.8,
        "confidence": 0.95,
        "lower_bound": 3.6,
        "upper_bound": 13.8
      }
    ],
    "model_version": "2.1.0-demand-forecast"
  }
  ```
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `500 Model Inference Error` (triggers Convex deterministic historical fallback).

---

## 3. Contract 2: Convex $\longleftrightarrow$ n8n (Event Automation Engine)

### Webhook Dispatch: `POST /webhook/veinlink-events`
- **Security**: HMAC-SHA256 Signature header (`X-VeinLink-Signature: sha256=<hex>`).
- **Delivery**: At-least-once with idempotency check via `eventId`.
- **Envelope Specification**:
  ```json
  {
    "eventId": "EVT-1725281920-ABCD",
    "eventType": "blood.shortage.critical",
    "timestamp": 1725281920000,
    "correlationId": "VL-2026-9812",
    "aggregate": {
      "type": "blood_inventory",
      "id": "INV-PUNE-O-NEG"
    },
    "payload": {
      "regionId": "REGION-PUNE-METRO",
      "bloodGroup": "O-",
      "currentUnits": 12,
      "projectedShortageHours": 18.5,
      "severity": "CRITICAL"
    }
  }
  ```
- **Response**: `200 OK` (`{"status": "queued", "executionId": "n8n-exec-4912"}`).
- **Retry Policy**: 3 exponential retries ($1\text{s}, 5\text{s}, 25\text{s}$), then routed to `DEAD_LETTER` queue.

---

## 4. Contract 3: FastAPI $\longleftrightarrow$ Computer Vision & OCR Verification

### Endpoint: `POST /ocr/verify-label`
- **Security**: Mutual internal container authentication.
- **Request Payload**:
  ```json
  {
    "extracted_fields": {
      "identifier": "ORG-1042",
      "blood_group": "A+",
      "organ_type": "KIDNEY"
    },
    "expected_fields": {
      "identifier": "ORG-1042",
      "blood_group": "A+",
      "organ_type": "KIDNEY"
    },
    "entity_type": "ORGAN"
  }
  ```
- **Response Payload**:
  ```json
  {
    "status": "MATCH",
    "confidence": 0.96,
    "mismatches": [],
    "explanation": "Physical label information matches authoritative digital record."
  }
  ```

---

## 5. Contract 4: Convex $\longleftrightarrow$ Blockchain Trust Layer

### Merkle Batch Anchoring Interface
- **Trigger**: Asynchronous cron job / threshold trigger (100 events or 10 minutes).
- **Request Payload**:
  ```json
  {
    "batchId": "BATCH-2026-09-02-01",
    "merkleRoot": "3f8b9e...64charhex",
    "recordCount": 64,
    "timestamp": 1725282000000
  }
  ```
- **Anchor Receipt**:
  ```json
  {
    "network": "SIMULATED_TESTNET",
    "transactionHash": "0x4a9b...hex",
    "blockNumber": 1849201,
    "confirmedAt": 1725282002000
  }
  ```
