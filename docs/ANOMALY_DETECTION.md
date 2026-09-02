# VeinLink — Statistical Anomaly Detection & Depletion Velocity

## 1. Outlier & Surge Detection

VeinLink detects acute operational deviations using normalized standard scores:
$$z = \frac{x - \mu}{\sigma}$$

- **Demand Surges**:
  - $z \ge 2.0$: `MEDIUM` severity surge.
  - $z \ge 2.8$: `HIGH` severity surge.
  - $z \ge 3.5$: `CRITICAL` severity surge requiring instant n8n notification escalation.

---

## 2. Inventory Depletion Velocity

Rather than waiting for stock to cross a static low-inventory threshold, VeinLink calculates consumption velocity:
$$v_{\text{depletion}} = \frac{1}{N} \sum_{i=1}^N \Delta \text{Units}_i \quad (\text{units/hr})$$

If $v_{\text{depletion}} \ge 3.5\text{ units/hr}$ and remaining stock is $\le 25\text{ units}$, the system emits a `RAPID_DEPLETION` event proactively.
