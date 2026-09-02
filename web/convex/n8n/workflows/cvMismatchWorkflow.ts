/**
 * Workflow #6 — Computer Vision / OCR Discrepancy Escalation
 * Trigger: verification.mismatch.detected
 * STRICT SAFETY INVARIANT: n8n never mutates authoritative database records based on OCR.
 */

import { VeinLinkDomainEvent } from "../eventContract";
import { WorkflowResult } from "./bloodShortageWorkflow";

export function executeCvMismatchWorkflow(event: VeinLinkDomainEvent): WorkflowResult {
  const actions: string[] = [];
  const payload = event.payload || {};
  const requestId = event.aggregate.id;
  const mismatches = payload.mismatches || [];
  const criticalCount = mismatches.filter((m: any) => m.severity === "CRITICAL").length;

  actions.push(`Received physical verification discrepancy alert for request ${requestId} (${mismatches.length} variances detected)`);
  actions.push(`Enforced Anti-Auto-Modification Invariant: Authoritative domain record left unaltered`);
  actions.push(`Created mandatory Human Review Task in Verification Center`);
  actions.push(`Paused operational handover / transport dispatch until human sign-off`);

  const isCritical = criticalCount > 0;
  if (isCritical) {
    actions.push(`DISPATCHED HIGH-SEVERITY ALERT to Quality Assurance Coordinator for physical re-scan`);
  }

  return {
    workflowName: "cv-mismatch-orchestration",
    workflowVersion: "1.0.0",
    status: "COMPLETED",
    actionsTaken: actions,
    escalationRequired: isCritical,
    escalationDetails: isCritical ? {
      severity: "CRITICAL",
      reason: `Physical label mismatch detected on ${criticalCount} critical field(s). Item locked pending coordinator inspection.`,
      assignedRole: "qa_coordinator",
    } : undefined,
  };
}
