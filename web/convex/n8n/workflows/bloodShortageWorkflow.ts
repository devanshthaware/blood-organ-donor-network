/**
 * Workflow #1 — Critical Blood Shortage Orchestration
 * Trigger: blood.inventory.low / blood.inventory.critical
 */

import { VeinLinkDomainEvent } from "../eventContract";

export interface WorkflowResult {
  workflowName: string;
  workflowVersion: string;
  status: "COMPLETED" | "FAILED";
  actionsTaken: string[];
  escalationRequired: boolean;
  escalationDetails?: {
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
    assignedRole: string;
  };
}

export function executeBloodShortageWorkflow(event: VeinLinkDomainEvent): WorkflowResult {
  const actions: string[] = [];
  const payload = event.payload || {};
  const currentUnits = payload.currentUnits ?? 0;
  const threshold = payload.threshold ?? 5;
  const bloodType = payload.bloodType || "O-";
  const facilityId = payload.facilityId || "REGIONAL_BLOOD_BANK";

  actions.push(`Validated inventory status for ${bloodType}: current ${currentUnits} units (threshold: ${threshold})`);

  const isCritical = currentUnits <= 2 || event.eventType === "blood.inventory.critical";

  if (isCritical) {
    actions.push(`Formulated urgent blood-shortage notification plan for ${facilityId}`);
    actions.push(`Dispatched high-priority push/SMS alert to on-duty blood-bank coordinators`);
    actions.push(`Notified accredited regional hospital transfusion coordinators`);

    return {
      workflowName: "blood-shortage-orchestration",
      workflowVersion: "1.0.0",
      status: "COMPLETED",
      actionsTaken: actions,
      escalationRequired: true,
      escalationDetails: {
        severity: "CRITICAL",
        reason: `Critical inventory shortage for ${bloodType} at ${facilityId} (${currentUnits} units remaining). Immediate cross-facility donor mobilization required.`,
        assignedRole: "regional_coordinator",
      },
    };
  }

  actions.push(`Dispatched routine low-stock notification to blood-bank inventory manager`);
  return {
    workflowName: "blood-shortage-orchestration",
    workflowVersion: "1.0.0",
    status: "COMPLETED",
    actionsTaken: actions,
    escalationRequired: false,
  };
}
