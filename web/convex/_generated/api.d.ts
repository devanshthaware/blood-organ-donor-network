/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiEvents from "../aiEvents.js";
import type * as alerts from "../alerts.js";
import type * as audit from "../audit.js";
import type * as authHelpers from "../authHelpers.js";
import type * as checkups from "../checkups.js";
import type * as consent from "../consent.js";
import type * as crons from "../crons.js";
import type * as domainConstants from "../domainConstants.js";
import type * as donorVerification from "../donorVerification.js";
import type * as donors from "../donors.js";
import type * as governance_consentService from "../governance/consentService.js";
import type * as governance_privacyGate from "../governance/privacyGate.js";
import type * as governance_rateLimiter from "../governance/rateLimiter.js";
import type * as governance_securityService from "../governance/securityService.js";
import type * as hospitals from "../hospitals.js";
import type * as intelligence_anomaly_anomalyDetector from "../intelligence/anomaly/anomalyDetector.js";
import type * as intelligence_forecasting_demandForecastEngine from "../intelligence/forecasting/demandForecastEngine.js";
import type * as intelligence_intelligenceService from "../intelligence/intelligenceService.js";
import type * as intelligence_matching_dynamicAvailabilityEngine from "../intelligence/matching/dynamicAvailabilityEngine.js";
import type * as intelligence_matching_reliabilityVectorEngine from "../intelligence/matching/reliabilityVectorEngine.js";
import type * as intelligence_network_networkGraphModel from "../intelligence/network/networkGraphModel.js";
import type * as intelligence_optimization_multiObjectiveRanker from "../intelligence/optimization/multiObjectiveRanker.js";
import type * as intelligence_simulation_digitalTwinSimulator from "../intelligence/simulation/digitalTwinSimulator.js";
import type * as inventory from "../inventory.js";
import type * as matching from "../matching.js";
import type * as n8n_eventContract from "../n8n/eventContract.js";
import type * as n8n_eventPublisher from "../n8n/eventPublisher.js";
import type * as n8n_webhookDispatcher from "../n8n/webhookDispatcher.js";
import type * as n8n_workflowReceiver from "../n8n/workflowReceiver.js";
import type * as n8n_workflows_bloodShortageWorkflow from "../n8n/workflows/bloodShortageWorkflow.js";
import type * as n8n_workflows_cvMismatchWorkflow from "../n8n/workflows/cvMismatchWorkflow.js";
import type * as n8n_workflows_donorFollowUpWorkflow from "../n8n/workflows/donorFollowUpWorkflow.js";
import type * as n8n_workflows_emergencyBloodWorkflow from "../n8n/workflows/emergencyBloodWorkflow.js";
import type * as n8n_workflows_index from "../n8n/workflows/index.js";
import type * as n8n_workflows_logisticsDelayWorkflow from "../n8n/workflows/logisticsDelayWorkflow.js";
import type * as n8n_workflows_organAvailableWorkflow from "../n8n/workflows/organAvailableWorkflow.js";
import type * as n8n_workflows_preservationWarningWorkflow from "../n8n/workflows/preservationWarningWorkflow.js";
import type * as n8n_workflows_unresolvedEmergencyWorkflow from "../n8n/workflows/unresolvedEmergencyWorkflow.js";
import type * as notifications from "../notifications.js";
import type * as organAllocation_allocationPolicy from "../organAllocation/allocationPolicy.js";
import type * as organAllocation_approvalWorkflow from "../organAllocation/approvalWorkflow.js";
import type * as organAllocation_eligibilityGate from "../organAllocation/eligibilityGate.js";
import type * as organAllocation_multiObjectiveOptimizer from "../organAllocation/multiObjectiveOptimizer.js";
import type * as organAllocation_recommendationEngine from "../organAllocation/recommendationEngine.js";
import type * as organAllocations from "../organAllocations.js";
import type * as organDonors from "../organDonors.js";
import type * as organInventory from "../organInventory.js";
import type * as organLogistics_feasibilityEngine from "../organLogistics/feasibilityEngine.js";
import type * as organLogistics_logisticsConstants from "../organLogistics/logisticsConstants.js";
import type * as organLogistics_logisticsOrchestrator from "../organLogistics/logisticsOrchestrator.js";
import type * as organLogistics_routeEngine from "../organLogistics/routeEngine.js";
import type * as organLogistics_timeEngine from "../organLogistics/timeEngine.js";
import type * as organMatching from "../organMatching.js";
import type * as organMatching_actions from "../organMatching/actions.js";
import type * as organMatching_compatibilityEngine from "../organMatching/compatibilityEngine.js";
import type * as organMatching_explanationBuilder from "../organMatching/explanationBuilder.js";
import type * as organMatching_hardConstraints from "../organMatching/hardConstraints.js";
import type * as organMatching_matchingPolicy from "../organMatching/matchingPolicy.js";
import type * as organMatching_scoringEngine from "../organMatching/scoringEngine.js";
import type * as organPreferences from "../organPreferences.js";
import type * as organRequests from "../organRequests.js";
import type * as patients from "../patients.js";
import type * as recipients from "../recipients.js";
import type * as requests from "../requests.js";
import type * as reservations from "../reservations.js";
import type * as stats from "../stats.js";
import type * as systemHealth from "../systemHealth.js";
import type * as transplantCenters from "../transplantCenters.js";
import type * as trust_blockchainProvider from "../trust/blockchainProvider.js";
import type * as trust_canonicalizer from "../trust/canonicalizer.js";
import type * as trust_hashChain from "../trust/hashChain.js";
import type * as trust_merkleTree from "../trust/merkleTree.js";
import type * as trust_trustService from "../trust/trustService.js";
import type * as users from "../users.js";
import type * as verification_actions from "../verification/actions.js";
import type * as verification_comparisonEngine from "../verification/comparisonEngine.js";
import type * as verification_normalizationEngine from "../verification/normalizationEngine.js";
import type * as verification_verificationConstants from "../verification/verificationConstants.js";
import type * as verification_verificationService from "../verification/verificationService.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiEvents: typeof aiEvents;
  alerts: typeof alerts;
  audit: typeof audit;
  authHelpers: typeof authHelpers;
  checkups: typeof checkups;
  consent: typeof consent;
  crons: typeof crons;
  domainConstants: typeof domainConstants;
  donorVerification: typeof donorVerification;
  donors: typeof donors;
  "governance/consentService": typeof governance_consentService;
  "governance/privacyGate": typeof governance_privacyGate;
  "governance/rateLimiter": typeof governance_rateLimiter;
  "governance/securityService": typeof governance_securityService;
  hospitals: typeof hospitals;
  "intelligence/anomaly/anomalyDetector": typeof intelligence_anomaly_anomalyDetector;
  "intelligence/forecasting/demandForecastEngine": typeof intelligence_forecasting_demandForecastEngine;
  "intelligence/intelligenceService": typeof intelligence_intelligenceService;
  "intelligence/matching/dynamicAvailabilityEngine": typeof intelligence_matching_dynamicAvailabilityEngine;
  "intelligence/matching/reliabilityVectorEngine": typeof intelligence_matching_reliabilityVectorEngine;
  "intelligence/network/networkGraphModel": typeof intelligence_network_networkGraphModel;
  "intelligence/optimization/multiObjectiveRanker": typeof intelligence_optimization_multiObjectiveRanker;
  "intelligence/simulation/digitalTwinSimulator": typeof intelligence_simulation_digitalTwinSimulator;
  inventory: typeof inventory;
  matching: typeof matching;
  "n8n/eventContract": typeof n8n_eventContract;
  "n8n/eventPublisher": typeof n8n_eventPublisher;
  "n8n/webhookDispatcher": typeof n8n_webhookDispatcher;
  "n8n/workflowReceiver": typeof n8n_workflowReceiver;
  "n8n/workflows/bloodShortageWorkflow": typeof n8n_workflows_bloodShortageWorkflow;
  "n8n/workflows/cvMismatchWorkflow": typeof n8n_workflows_cvMismatchWorkflow;
  "n8n/workflows/donorFollowUpWorkflow": typeof n8n_workflows_donorFollowUpWorkflow;
  "n8n/workflows/emergencyBloodWorkflow": typeof n8n_workflows_emergencyBloodWorkflow;
  "n8n/workflows/index": typeof n8n_workflows_index;
  "n8n/workflows/logisticsDelayWorkflow": typeof n8n_workflows_logisticsDelayWorkflow;
  "n8n/workflows/organAvailableWorkflow": typeof n8n_workflows_organAvailableWorkflow;
  "n8n/workflows/preservationWarningWorkflow": typeof n8n_workflows_preservationWarningWorkflow;
  "n8n/workflows/unresolvedEmergencyWorkflow": typeof n8n_workflows_unresolvedEmergencyWorkflow;
  notifications: typeof notifications;
  "organAllocation/allocationPolicy": typeof organAllocation_allocationPolicy;
  "organAllocation/approvalWorkflow": typeof organAllocation_approvalWorkflow;
  "organAllocation/eligibilityGate": typeof organAllocation_eligibilityGate;
  "organAllocation/multiObjectiveOptimizer": typeof organAllocation_multiObjectiveOptimizer;
  "organAllocation/recommendationEngine": typeof organAllocation_recommendationEngine;
  organAllocations: typeof organAllocations;
  organDonors: typeof organDonors;
  organInventory: typeof organInventory;
  "organLogistics/feasibilityEngine": typeof organLogistics_feasibilityEngine;
  "organLogistics/logisticsConstants": typeof organLogistics_logisticsConstants;
  "organLogistics/logisticsOrchestrator": typeof organLogistics_logisticsOrchestrator;
  "organLogistics/routeEngine": typeof organLogistics_routeEngine;
  "organLogistics/timeEngine": typeof organLogistics_timeEngine;
  organMatching: typeof organMatching;
  "organMatching/actions": typeof organMatching_actions;
  "organMatching/compatibilityEngine": typeof organMatching_compatibilityEngine;
  "organMatching/explanationBuilder": typeof organMatching_explanationBuilder;
  "organMatching/hardConstraints": typeof organMatching_hardConstraints;
  "organMatching/matchingPolicy": typeof organMatching_matchingPolicy;
  "organMatching/scoringEngine": typeof organMatching_scoringEngine;
  organPreferences: typeof organPreferences;
  organRequests: typeof organRequests;
  patients: typeof patients;
  recipients: typeof recipients;
  requests: typeof requests;
  reservations: typeof reservations;
  stats: typeof stats;
  systemHealth: typeof systemHealth;
  transplantCenters: typeof transplantCenters;
  "trust/blockchainProvider": typeof trust_blockchainProvider;
  "trust/canonicalizer": typeof trust_canonicalizer;
  "trust/hashChain": typeof trust_hashChain;
  "trust/merkleTree": typeof trust_merkleTree;
  "trust/trustService": typeof trust_trustService;
  users: typeof users;
  "verification/actions": typeof verification_actions;
  "verification/comparisonEngine": typeof verification_comparisonEngine;
  "verification/normalizationEngine": typeof verification_normalizationEngine;
  "verification/verificationConstants": typeof verification_verificationConstants;
  "verification/verificationService": typeof verification_verificationService;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
