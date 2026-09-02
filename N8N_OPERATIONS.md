# VeinLink — n8n Operational Runbook & Maintenance Guide

## 1. Operational Monitoring via `/admin/automation`

The Admin Operations Monitor provides continuous visibility into the event-driven platform:
- **KPI Metrics**: Real-time counters for Domain Events, Completed Executions, Active Escalations, and Dead Letter Queue.
- **Event Stream**: Live chronological log of all domain events with delivery status badges.
- **Escalations Dashboard**: Interactive table with *Acknowledge* and *Resolve* controls for clinical/operational alarms.
- **Executions Log**: Execution attempts, errors, and actions taken per workflow.
- **Event Simulator**: Interactive trigger panel to test Shortage, Organ Available, Delay, and CV Mismatch flows.

---

## 2. Workflow Versioning Protocol

Every workflow definition must specify:
```json
{
  "workflowName": "organ-preservation-escalation",
  "workflowVersion": "1.0.0",
  "environment": "production"
}
```
- **Patch (1.0.x)**: Minor template wording updates or notification channel preference adjustments.
- **Minor (1.x.0)**: Adding secondary notification recipients or non-breaking escalation tiers.
- **Major (x.0.0)**: Modifying event triggers, envelope inputs, or state transition handoffs.

---

## 3. Incident Response Runbook

### Scenario A: Spike in Dead-Letter Queue Events
1. Navigate to `/admin/automation` $\to$ **Executions**.
2. Filter by status `DEAD_LETTER` to inspect the error messages.
3. Check upstream provider status (e.g. Twilio or SendGrid service disruption).
4. Once provider service is restored, select the failed event in **Event Stream** and click **Replay**.

### Scenario B: Unacknowledged Emergency Escalation
1. Navigate to `/admin/automation` $\to$ **Escalations**.
2. Identify escalations with status `ACTIVE` and severity `CRITICAL`.
3. Directly contact the assigned role (e.g. `regional_coordinator` or `network_admin`) via manual emergency backup line.
4. Once verbally confirmed, click **Acknowledge** followed by **Resolve** with incident notes.
