# VeinLink — Physical-to-Digital Verification Policy Specification

**Policy Version**: `1.0.0-PHYSICAL-DIGITAL-INTEGRITY`  
**Engine**: `VeinLink-Vision-OCR-Engine`  
**Classification**: Physical-to-Digital Verification Governance  

---

## 1. Supported Verification Types

| Verification Type | Target Physical Item | Primary Extracted Fields | Digital Validation Record |
| :--- | :--- | :--- | :--- |
| **`BLOOD_LABEL_VERIFICATION`** | Physical whole blood or component unit bag | Unit Identifier, ABO/Rh Blood Group, Expiry Date, Collection Center | `bloodInventory` |
| **`ORGAN_IDENTIFIER_VERIFICATION`** | Cold ischemia transit box or perfusion packaging | Organ Identifier, Organ Type, ABO Group, Donor Center, Barcode | `organInventory` |
| **`BARCODE_SCAN`** | 1D / 2D barcode labels on transit canisters | Serialized Barcode Payload | `transportRequests` / `organInventory` |
| **`DOCUMENT_OCR`** | Physical paper donor consent or handover forms | Donor Name, Consent Signature Presence, Date | `consentRecords` |

---

## 2. Confidence Thresholding Policy

| OCR Confidence Score | Verification State | Operational Routing |
| :---: | :---: | :--- |
| $\ge 85\%$ | High Confidence | Standard candidate for `MATCH` or `MISMATCH` verdict. |
| $65\% - 85\%$ | Moderate Confidence | Requires coordinator visual review before sign-off. |
| $< 65\%$ | Low Confidence | Enforces `REVIEW_REQUIRED`; coordinator must visually confirm or re-scan. |

---

## 3. Mismatch Severity Taxonomy

1. **`CRITICAL` Discrepancy**:
   - Mismatch in **Blood Group** (e.g. physical label shows `AB+` when digital record expects `O-`).
   - Mismatch in **Primary Specimen Identifier** (e.g. `ORG-1042` vs `ORG-1049`).
   - Mismatch in **Organ Type** (e.g. label indicates `LIVER` when record expects `KIDNEY`).
   - *Policy Action*: Sets verdict to `MISMATCH`, halts transit/handover, and prompts coordinator review.
2. **`WARNING` Discrepancy**:
   - Secondary facility naming discrepancies, minor timestamp formatting differences, or missing optional fields.
   - *Policy Action*: Sets verdict to `PARTIAL_MATCH`.
3. **`INFO` Discrepancy**:
   - Extra spaces, hyphens, or casing differences resolved by the canonical normalization engine.

---

## 4. Human Review & Non-Modification Invariants

- An algorithmic extraction or discrepancy **never** automatically mutates authoritative clinical records.
- To mark a verification request as `VERIFIED` or `REJECTED`, the coordinator must input a mandatory review reason string.
- Verification records, images references, and historical attempts are immutably preserved in `auditLogs` for forensic traceability.
