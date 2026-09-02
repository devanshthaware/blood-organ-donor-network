# VeinLink — Pareto Multi-Objective Optimization & Fatigue Mitigation

## 1. Multi-Objective Optimization Problem

Rather than assuming one arbitrary weighting universally fits all healthcare crises, VeinLink's optimizer models matching as a multi-objective problem across four conflicting objectives:

$$\max f_1(\mathbf{x}) = \text{Fulfillment Probability (Availability)}$$
$$\max f_2(\mathbf{x}) = \text{Donor Reliability Score}$$
$$\min f_3(\mathbf{x}) = \text{Travel Distance / Transit Latency (km)}$$
$$\min f_4(\mathbf{x}) = \text{Notification Fatigue Burden}$$

Subject to authoritative hard constraints:
- Medical blood type compatibility ($ABO/Rh$)
- Minimum 56-day blood donation cooldown
- Maximum acceptable travel radius ($\le 35\text{km}$)
- Active purpose-specific donor consent (`GRANTED`)

---

## 2. Pareto Non-Dominated Solutions

A candidate donor $A$ dominates candidate $B$ ($A \succ B$) if and only if $A$ is no worse than $B$ across all objectives and strictly better in at least one:
$$\forall i \in \{1, 2, 3, 4\}: f_i(A) \ge f_i(B) \quad \land \quad \exists j: f_j(A) > f_j(B)$$

The optimizer presents the **Pareto Frontier** (set of non-dominated candidates) to the human coordinator alongside transparent trade-offs (e.g. *Candidate A has higher predicted response, while Candidate B is closer but has received more notifications this week*).

---

## 3. Baseline 60/40 Equivalence

The system preserves the existing baseline model:
$$\text{Baseline Score} = 0.60 \times \text{Availability} + 0.40 \times \text{Reliability}$$
Allowing medical coordinators to toggle between the classical baseline and the advanced Pareto optimizer during review.
