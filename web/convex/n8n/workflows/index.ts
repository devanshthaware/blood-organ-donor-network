/**
 * Central Workflow Dispatcher & Router
 * Dispatches domain events to their corresponding healthcare automation workflows.
 */

import { VeinLinkDomainEvent, EVENT_TYPES } from "../eventContract";
import { executeBloodShortageWorkflow, WorkflowResult } from "./bloodShortageWorkflow";
import { executeEmergencyBloodWorkflow } from "./emergencyBloodWorkflow";
import { executeOrganAvailableWorkflow } from "./organAvailableWorkflow";
import { executePreservationWarningWorkflow } from "./preservationWarningWorkflow";
import { executeLogisticsDelayWorkflow } from "./logisticsDelayWorkflow";
import { executeCvMismatchWorkflow } from "./cvMismatchWorkflow";
import { executeDonorFollowUpWorkflow } from "./donorFollowUpWorkflow";
import { executeUnresolvedEmergencyWorkflow } from "./unresolvedEmergencyWorkflow";

export function routeAndExecuteWorkflow(event: VeinLinkDomainEvent): WorkflowResult | null {
  switch (event.eventType) {
    case EVENT_TYPES.BLOOD_INVENTORY_LOW:
    case EVENT_TYPES.BLOOD_INVENTORY_CRITICAL:
      return executeBloodShortageWorkflow(event);

    case EVENT_TYPES.EMERGENCY_REQUEST_CREATED:
      return executeEmergencyBloodWorkflow(event);

    case EVENT_TYPES.ORGAN_AVAILABLE:
    case EVENT_TYPES.ORGAN_REGISTERED:
      return executeOrganAvailableWorkflow(event);

    case EVENT_TYPES.ORGAN_PRESERVATION_WARNING:
    case EVENT_TYPES.ORGAN_PRESERVATION_CRITICAL:
    case EVENT_TYPES.ORGAN_PRESERVATION_EXPIRED:
      return executePreservationWarningWorkflow(event);

    case EVENT_TYPES.TRANSPORT_DELAY_DETECTED:
      return executeLogisticsDelayWorkflow(event);

    case EVENT_TYPES.VERIFICATION_MISMATCH_DETECTED:
      return executeCvMismatchWorkflow(event);

    case EVENT_TYPES.BLOOD_DONATION_COMPLETED:
    case EVENT_TYPES.BLOOD_RESERVATION_EXPIRED:
      return executeDonorFollowUpWorkflow(event);

    case EVENT_TYPES.NETWORK_ESCALATION_TRIGGERED:
      return executeUnresolvedEmergencyWorkflow(event);

    default:
      return null;
  }
}
