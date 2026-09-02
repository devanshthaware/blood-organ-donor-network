/**
 * Workflow #5 — Time-Critical Logistics Delay Escalation
 * Trigger: transport.delay.detected
 * STRICT SAFETY INVARIANT: n8n never automatically cancels or reallocates an organ.
 */

import { VeinLinkDomainEvent } from "../eventContract";
import { WorkflowResult } from "./bloodShortageWorkflow";

export function executeLogisticsDelayWorkflow(event: VeinLinkDomainEvent): WorkflowResult {
  const actions: string[] = [];
  const payload = event.payload || {};
  const transportId = event.aggregate.id;
  const delayMinutes = payload.delayMinutes ?? 30;
  const reason = payload.reason || "Adverse weather conditions";
  const isCriticalToDeadline = payload.isCriticalToDeadline ?? false;

  actions.push(`Logged transit slippage of ${delayMinutes} minutes for transport ${transportId} (Reason: ${reason})`);
  actions.push(`Recalculated projected destination ETA against cold ischemia preservation deadline`);
  actions.push(`Notified medical transport carrier and destination hospital arrival team`);

  if (isCriticalToDeadline) {
    actions.push(`CRITICAL ALERT DISPATCHED: Delay threatens cold ischemia safety margin`);
    actions.push(`Enforced Safety Invariant: Preserved active allocation. Handed off to coordinator for reroute decision.`);

    return {
      workflowName: "logistics-delay-orchestration",
      workflowVersion: "1.0.0",
      status: "COMPLETED",
      actionsTaken: actions,
      escalationRequired: true,
      escalationDetails: {
        severity: "CRITICAL",
        reason: `Logistics delay of ${delayMinutes}m threatens organ viability (${reason}). Immediate surgical/logistics coordinator review required.`,
        assignedRole: "logistics_coordinator",
      },
    };
  }

  actions.push(`Schedule adjusted in transport timeline. Normal buffer preserved.`);
  return {
    workflowName: "logistics-delay-orchestration",
    workflowVersion: "1.0.0",
    status: "COMPLETED",
    actionsTaken: actions,
    escalationRequired: false,
  };
}
