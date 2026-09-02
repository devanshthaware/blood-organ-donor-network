# Model Card — Multi-Horizon Demand Forecasting v2 (DemandForecast-v2.1)

## 1. Model Overview & Purpose
- **Architecture**: Temporal Poisson-Gaussian process with logistic sigmoid shortage estimation.
- **Task**: Predicts net blood unit demand, incoming supply, and localized shortage risk across 5 distinct horizons: 6 hours, 24 hours, 3 days (72h), 7 days (168h), and 14 days (336h).
- **Status**: ACTIVE (`modelRegistry`).

---

## 2. Input Features & Data Allowlist
- `regionId`: Regional network partition identifier.
- `bloodGroup`: Target ABO/Rh blood product.
- `currentInventory`: Immediate on-shelf usable units.
- `recentHourlyDepletions`: Observed consumption velocity over the preceding 6 hours ($\text{units/hr}$).
- `historicalDailyAverageDemand`: 30-day baseline consumption mean.
- `historicalDailyAverageSupply`: 30-day baseline donation replenishment mean.
- `isEmergencyHotspot`: Boolean surge multiplier ($1.45\times$).

---

## 3. Outputs & Uncertainty Bounds
- `shortageProbability`: Probability $\in [0.01, 0.99]$ that inventory drops below the safety buffer.
- `expectedDemand`: Point estimate of units required.
- `expectedSupply`: Point estimate of incoming replacements.
- `predictionInterval`: 90% confidence interval ($[\mu - 1.645\sigma, \mu + 1.645\sigma]$).
- `confidence`: Decays smoothly from $95\%$ at 6h to $60\%$ at 14d as temporal uncertainty grows.

---

## 4. Fallback Behavior
If temporal inference fails or recent history is unavailable, the model gracefully degrades to historical 30-day baseline moving averages without interrupting hospital queries.
