# VeinLink — Healthcare AI Governance, Ethics & Oversight Framework

## 1. Clinical Decision Support Mandate

In strict accordance with healthcare regulatory guidance and the hackathon problem statement:
- **AI is Decision Support, NOT Medical Authority**: Algorithmic models generate advisory rankings, logistical risk forecasts, and demand predictions.
- **No Autonomous Allocation**: The system is technically barred from modifying organ status from `AVAILABLE` to `ALLOCATED` without authenticated human coordinator sign-off.
- **Anti-Auto-Modification Invariant**: Computer vision label extractions cannot overwrite digital database records without human confirmation.

---

## 2. Uncertainty & Confidence Gates

Every algorithmic output exposes an uncertainty metric:
- **High Confidence ($\ge 85\%$)**: Advisory recommendation displayed with standard verification badge.
- **Moderate Confidence ($65\% - 84\%$)**: Advisory recommendation displayed with caution banner highlighting missing or noisy inputs.
- **Low Confidence ($< 65\%$)**: Automated recommendation is suppressed; case is routed directly to `REVIEW_REQUIRED` for full clinical review.

---

## 3. Human Override Governance & Analytics

When a transplant coordinator overrides an algorithmic recommendation:
1. An override flag (`isOverride: true`) is marked in `aiDecisionProvenance`.
2. The coordinator must provide an authorized clinical justification (`overrideReason`).
3. The recommendation, override, and reason are hashed and anchored to the blockchain ledger.
4. The system tracks the **Human Override Rate** on `/admin/trust` as an indicator of model alignment and clinical autonomy.
