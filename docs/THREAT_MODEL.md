# VeinLink — STRIDE Threat Model & Security Controls

## 1. STRIDE Threat Analysis & Implemented Mitigations

| Category | Threat Description | Attack Target | Implemented Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates hospital coordinator or donor. | Clerk / Next.js | Clerk cryptographic session tokens, JWT signature validation, MFA support. |
| **Tampering** | Rogue actor alters historical organ allocation or audit logs. | Convex Database | Local SHA-256 hash chains, Merkle roots, external blockchain anchoring. |
| **Repudiation** | Coordinator denies authorizing a specific organ override. | Allocation Engine | Cryptographic signature of audit proof with actor ID, timestamp, and justification. |
| **Information Disclosure**| Unauthorized access to donor medical profiles or raw coordinates. | Convex Queries / ML | Zero-trust ownership checks (`requireResourceOwnership`), ML feature allowlist, location tokenization. |
| **Denial of Service** | Flooding emergency blood requests or verification APIs. | API Endpoints | Sliding-window rate limiter per identity and IP, abuse detection. |
| **Elevation of Privilege**| Donor elevates privileges to access hospital requisitions. | Convex Mutations | Granular `requireRole` and `requireFacilityScope` checks, `securityEvents` logging. |

---

## 2. Attack Scenario Validations

1. **Cross-Tenant Hospital Query**:
   - Attack: Hospital A coordinator submits requisition query with `facilityId: "HOSP-B"`.
   - Mitigation: `requireFacilityScope` rejects execution, throws `403 Forbidden`, and records `ACCESS_DENIED` in `securityEvents`.

2. **Tampered n8n Webhook**:
   - Attack: External attacker posts forged domain event to webhook dispatcher.
   - Mitigation: Webhook dispatcher verifies HMAC SHA-256 signature in `x-veinlink-signature` header using shared secret.
