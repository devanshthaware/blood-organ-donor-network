/**
 * Workflow #4 — Organ Preservation Warning & Deadline Escalation
 * Trigger: organ.preservation.warning / organ.preservation.critical
 */

import { VeinLinkDomainEvent } from "../eventContract";
import { WorkflowResult } from "./bloodShortageWorkflow";

export function executePreservationWarningWorkflow(event: VeinLinkDomainEvent): WorkflowResult {
  const actions: string[] = [];
  const payload = event.payload || {};
  const organId = event.aggregate.id;
  const remainingHours = payload.remainingHours ?? 3.5;
  const riskTier = payload.riskTier || (remainingHours < 2 ? "CRITICAL" : remainingHours < 4 ? "HIGH" : "MODERATE");

  actions.push(`Evaluated cold ischemia countdown for organ ${organId}: ${remainingHours.toFixed(1)}h remaining`);

  let escalationRequired = false;
  let escalationDetails: any = undefined;

  switch (riskTier) {
    case "LOW":
      actions.push("Logged routine preservation status check");
      break;
    case "MODERATE":
      actions.push("Dispatched advisory status alert to transplant coordinator");
      break;
    case "HIGH":
      actions.push("Dispatched priority alert to transplant coordinator and aeromedical dispatch crew");
      escalationRequired = true;
      escalationDetails = {
        severity: "HIGH",
        reason: `Preservation buffer compression: Organ ${organId} has only ${remainingHours.toFixed(1)}h remaining. Expedite transit handoff.`,
        assignedRole: "logistics_coordinator",
      };
      break;
    case "CRITICAL":
      actions.push("DISPATCHED CRITICAL MULTI-CHANNEL EMERGENCY ESCALATION to lead surgical coordinator");
      actions.push("Alerted operating room surgical team of high ischemia deadline risk");
      escalationRequired = true;
      escalationDetails = {
        severity: "CRITICAL",
        reason: `CRITICAL ISCHEMIA DEADLINE: Organ ${organId} has <2 hours viable preservation remaining. Immediate emergency intervention required.`,
        assignedRole: "chief_medical_officer",
      };
      break;
    case "EXPIRED":
      actions.push("Cold ischemia preservation window EXPIRED. Halted active transport workflow.");
      actions.push("Flagged organ record for mandatory medical advisory review.");
      escalationRequired = true;
      escalationDetails = {
        severity: "CRITICAL",
        reason: `Preservation window expired for organ ${organId}. Operation stopped for clinical review.`,
        assignedRole: "transplant_committee",
      };
      break;
  }

  return {
    workflowName: "organ-preservation-escalation",
    workflowVersion: "1.0.0",
    status: "COMPLETED",
    actionsTaken: actions,
    escalationRequired,
    escalationDetails,
  };
}
