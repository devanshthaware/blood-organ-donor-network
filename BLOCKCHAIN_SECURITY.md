# VeinLink — Blockchain Security & Privacy Specification

## 1. Zero-PHI On-Chain Enforcement

VeinLink strictly prohibits the transmission or storage of Protected Health Information (PHI) on public or private blockchains.

### Explicitly Excluded from On-Chain Anchors:
- Donor & patient names, emails, and phone numbers.
- Detailed medical histories, HLA tissue typings, and viral markers.
- Raw computer vision / OCR images of physical donor specimens.
- Hospital internal clinical notes.

### Exclusively Anchored:
- 64-character SHA-256 event hashes.
- Merkle root digests.
- Block numbers, timestamps, and synthetic event identifiers.

---

## 2. Key Management & Wallet Isolation

- Dedicated service wallet identities are used exclusively for automated anchoring.
- Private keys are injected via environment variables (`BLOCKCHAIN_PRIVATE_KEY`) or cloud key management services (KMS / HashiCorp Vault).
- No developer personal wallets or hardcoded credentials are ever committed to source code.

---

## 3. Replay Protection

Every anchored proof includes:
- `eventId`: Unique per domain emission.
- `occurredAt`: Monotonically increasing server timestamp.
- `correlationId`: Distributed trace link.
- `chainHash`: Strictly dependent on the previous record's hash.

An attacker attempting to replay an older valid proof will fail hash-chain continuity verification.

---

## 4. Role-Based Access Control (RBAC)

- Inspecting full audit records and triggering event replays requires authenticated `admin` privileges via Clerk.
- Coordinators can verify proofs relevant to their authorized transplant center.
- Public auditor interfaces expose proof verification outcomes without revealing patient or donor identities.
