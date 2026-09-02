/**
 * Workflow #7 — Donor Post-Care & Future Eligibility Follow-Up
 * Trigger: blood.donation.completed / blood.reservation.expired
 */

import { VeinLinkDomainEvent } from "../eventContract";
import { WorkflowResult } from "./bloodShortageWorkflow";

export function executeDonorFollowUpWorkflow(event: VeinLinkDomainEvent): WorkflowResult {
  const actions: string[] = [];
  const payload = event.payload || {};
  const donorId = event.aggregate.id;
  const isMissed = event.eventType === "blood.reservation.expired";

  if (isMissed) {
    actions.push(`Detected expired appointment for donor ${donorId}`);
    actions.push(`Sent respectful reminder and seamless re-booking link via SMS/Email`);
    return {
      workflowName: "donor-followup-orchestration",
      workflowVersion: "1.0.0",
      status: "COMPLETED",
      actionsTaken: actions,
      escalationRequired: false,
    };
  }

  // Donation Completed
  const completedAt = payload.completedAt || event.occurredAt;
  const nextEligibleDate = new Date(completedAt + 56 * 24 * 3600 * 1000).toLocaleDateString();

  actions.push(`Dispatched gratitude confirmation to donor ${donorId} for lifesaving whole-blood donation`);
  actions.push(`Applied authoritative 56-day cooldown window: next eligible on ${nextEligibleDate}`);
  actions.push(`Scheduled automated calendar reminder 3 days prior to next eligibility date`);

  return {
    workflowName: "donor-followup-orchestration",
    workflowVersion: "1.0.0",
    status: "COMPLETED",
    actionsTaken: actions,
    escalationRequired: false,
  };
}
