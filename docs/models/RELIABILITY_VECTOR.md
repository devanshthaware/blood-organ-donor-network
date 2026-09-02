# Model Card — Decomposed 4-Factor Donor Reliability Vector (Reliability-v2.0)

## 1. Model Overview & Purpose
- **Architecture**: Multi-attribute linear utility function with explicit dimensional attribution.
- **Task**: Decomposes generic reliability into four auditable, explainable sub-scores.
- **Status**: ACTIVE (`modelRegistry`).

---

## 2. Mathematical Formulation
$$\text{Overall Reliability} = 0.30 R_{\text{accept}} + 0.30 R_{\text{attend}} + 0.20 R_{\text{response}} + 0.20 R_{\text{complete}}$$

Where:
1. **Acceptance Score ($R_{\text{accept}}$)**: $\frac{\text{accepted}}{\text{totalRequests}}$ (Willingness to respond favorably).
2. **Attendance Score ($R_{\text{attend}}$)**: $1.0 - \frac{\text{noShows}}{\text{accepted}}$ (Physical follow-through reliability post-acceptance).
3. **Response Score ($R_{\text{response}}$)**: $\max\left(0.1, 1.0 - \frac{\min(60, \text{avgResponseMinutes})}{60}\right)$ (Communication speed).
4. **Completion Score ($R_{\text{complete}}$)**: $\frac{\text{completed}}{\text{accepted}}$ (Successful clinical donation completion rate).

---

## 3. Explainability & Fair Oversight
Rather than black-box categorization, coordinators can inspect which specific factor lowered a donor's score (e.g., slow response time vs unfulfilled appointment).
