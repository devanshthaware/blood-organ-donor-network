# VeinLink — Blockchain Operational Runbook & Maintenance Guide

## 1. Operational Monitoring via `/admin/trust`

The Admin Trust Dashboard provides real-time visibility into the cryptographic trust layer:
- **Audit Integrity Rate**: Confirms continuous sequential validity of the local SHA-256 hash chain ($100\%$ expected).
- **Blockchain Anchored Rate**: Percentage of generated audit proofs confirmed on-chain.
- **Pending Anchors**: Queue of proofs waiting for the next Merkle batch anchor.
- **AI Decision Provenance Explorer**: Complete audit trail of AI model versions, feature hashes, and human override justifications.
- **Interactive Proof Verifier**: 3-point independent verification tool for auditors and coordinators.

---

## 2. Gas & Transaction Cost Control

To avoid excessive blockchain transaction fees:
1. **Selective Anchoring**: Only `CRITICAL` (allocation approval, override, CV mismatch) and `IMPORTANT` events are anchored. Routine UI actions are excluded.
2. **Merkle Batching**: Groups dozens of events into a single on-chain transaction per block, cutting transaction overhead by $>90\%$.
3. **Async Non-Blocking**: Healthcare operations never pay high gas prices to prioritize immediate block confirmation; transactions confirm in background queues.

---

## 3. Network Outage & Recovery Runbook

### Scenario: Blockchain RPC Downtime / Network Congestion
1. **Automatic Resilient Degradation**: Convex domain mutations and healthcare operations continue with zero interruption.
2. Proofs accumulate in status `PENDING` within the `auditProofs` table.
3. The local SHA-256 hash chain continues operating, preserving internal tamper evidence.
4. When the blockchain network or RPC endpoint recovers, the background scheduler automatically triggers `anchorPendingProofsAction`, compiling queued proofs into a Merkle batch and submitting the root hash.
