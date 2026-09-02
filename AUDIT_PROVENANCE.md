# VeinLink — Audit Provenance & Cryptographic Anchor Specification

## 1. Canonical Serialization Algorithm

To ensure that two logically equivalent audit events produce identical cryptographic hashes regardless of JSON key order or formatting:
1. **Key Sorting**: All object keys are recursively sorted in lexicographical ASCII order (`Object.keys(val).sort()`).
2. **Whitespace Normalization**: Extraneous whitespace between keys, colons, and values is removed.
3. **Primitive Standardization**: Numbers are formatted cleanly; booleans and nulls are canonicalized.
4. **Hashing**: The resulting string is passed to `SHA-256`.

---

## 2. Local Tamper-Evident Hash Chain

Before blockchain submission, audit records form an immediate sequential cryptographic hash chain:
$$H_0 = \text{SHA-256}(D_0 + \text{GENESIS\_HASH})$$
$$H_n = \text{SHA-256}(D_n + H_{n-1})$$

Where:
- $D_n$: Canonical SHA-256 data hash of audit record $n$.
- $H_{n-1}$: Previous record's chain hash.
- $H_n$: New chain link hash stored in `auditProofs.chainHash`.

### Tamper Detection Properties:
- **Modification Attack**: If a record in the database is modified, its recalculated $D_n$ changes, causing $H_n$ and all subsequent hashes $H_{n+1}, H_{n+2}$ to fail validation.
- **Deletion Attack**: If an audit record is dropped, the sequence link $H_{n-1} \to H_{n+1}$ breaks immediately.

---

## 3. Merkle Batching Strategy

For scalability and cost-efficiency, proofs are batched into a balanced binary Merkle Tree:
- Leaf nodes represent individual proof chain hashes ($H_n$).
- Intermediate nodes combine pairs: $\text{Node} = \text{SHA-256}(\text{Left} + \text{Right})$.
- The resulting **Merkle Root** is anchored in a single transaction on the blockchain ledger.
- Individual inclusion is mathematically provable using standard Merkle audit paths without revealing peer records.

---

## 4. Verifiable AI Decision & Override Provenance

For every AI matching recommendation, VeinLink records an immutable provenance snapshot in `aiDecisionProvenance`:

| Field | Description | Cryptographic Role |
| :--- | :--- | :--- |
| `decisionId` | Unique AI Recommendation ID | Correlation |
| `modelType` & `version` | Active inference model metadata | Reproducibility |
| `inputHash` | SHA-256 of normalized feature vector | Proves exact inputs evaluated |
| `outputHash` | SHA-256 of predicted scores & ranks | Proves exact model output |
| `confidence` | Model prediction confidence score | Uncertainty evaluation |
| `explanationHash`| SHA-256 of generated XAI text | Proves explanation fidelity |
| `isOverride` | Boolean flag indicating coordinator override | Governance indicator |
| `overrideReason` | Mandatory clinical reason for override | Accountability record |
| `proofId` | Linked cryptographic audit proof | Blockchain anchor link |
