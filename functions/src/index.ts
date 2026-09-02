/**
 * Firebase Cloud Functions for VeinLink
 * 
 * Architecture:
 * - Frontend never calls ML directly
 * - Firebase Functions orchestrate ML calls
 * - Firestore is the system of record
 * - All decisions must be explainable and auditable
 */

import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";
import { generateInsight } from "./llm/generateInsight";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Global options for all functions
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB",
});

// Get ML API URL from environment
const getMLApiUrl = (): string => {
  // Environment variable is required - no hardcoded fallbacks
  if (process.env.ML_API_URL) {
    return process.env.ML_API_URL;
  }

  // In emulator/development mode, use default localhost if not set
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isEmulator || isDevelopment) {
    const defaultPort = process.env.ML_API_PORT || "8000";
    const defaultHost = process.env.ML_API_HOST || "localhost";
    return `http://${defaultHost}:${defaultPort}`;
  }

  // Production: require environment variable
  throw new Error("ML_API_URL environment variable is required in production. Please set it in your environment or .env file.");
};

/**
 * Helper: Log action to audit_logs collection
 */
async function logAudit(
  userId: string,
  userEmail: string,
  action: string,
  resourceType: string,
  resourceId: string,
  ipAddress: string,
  result: "SUCCESS" | "FAILURE" | "ERROR",
  details?: Record<string, unknown>,
  errorMessage?: string
): Promise<void> {
  try {
    await db.collection("audit_logs").add({
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      ipAddress: ipAddress || "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      result,
      details: details || {},
      ...(errorMessage && { errorMessage }),
    });
  } catch (error) {
    logger.error("Failed to write audit log", error);
    // Don't throw - audit logging failure shouldn't break the function
  }
}

/**
 * Helper: Write AI event to ai_events collection for monitoring
 */
async function writeAIEvent(
  modelName: string,
  modelType: string,
  inputSummary: Record<string, unknown>,
  outputSummary: Record<string, unknown>,
  status: "SUCCESS" | "FAILED",
  options: {
    triggerSource?: string;
    requestId?: string;
    reservationId?: string;
    executionTimeMs?: number;
    modelVersion?: string;
    errorMessage?: string;
    confidence?: number;
  } = {}
): Promise<void> {
  try {
    await db.collection("ai_events").add({
      modelName,
      modelType,
      inputSummary,
      outputSummary,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      triggerSource: options.triggerSource || "system",
      requestId: options.requestId,
      reservationId: options.reservationId,
      executionTimeMs: options.executionTimeMs,
      modelVersion: options.modelVersion || "1.0.0",
      errorMessage: options.errorMessage,
      confidence: options.confidence,
    });
    logger.info(`AI event logged: ${modelName} - ${status}`);
  } catch (error) {
    logger.error("Failed to write AI event", error);
    // Don't throw - AI event logging failure shouldn't break the function
  }
}

/**
 * Helper: Call ML API with timeout and error handling
 */
async function callMLAPI(
  endpoint: string,
  payload: Record<string, unknown>,
  timeoutMs = 10000,
  options: {
    triggerSource?: string;
    requestId?: string;
    reservationId?: string;
    modelName?: string;
    modelType?: string;
  } = {}
): Promise<Record<string, unknown>> {
  const mlApiUrl = getMLApiUrl();
  const url = `${mlApiUrl}${endpoint}`;

  logger.info(`Calling ML API: ${url}`, { payload });

  const startTime = Date.now();
  let executionTimeMs: number | undefined;
  let output: Record<string, unknown> | undefined;
  let errorMessage: string | undefined;

  try {
    const response = await axios.post(url, payload, {
      timeout: timeoutMs,
      headers: {
        "Content-Type": "application/json",
      },
    });

    executionTimeMs = Date.now() - startTime;
    output = response.data;

    logger.info(`ML API response: ${endpoint}`, { data: output });

    // Extract confidence from output if available
    const confidence =
      (output.predicted_demand as number) ||
      (output.availability_probability as number) ||
      (output.reliability_score as number) ||
      undefined;

    // Write AI event for successful inference
    await writeAIEvent(
      options.modelName || endpoint.replace("/predict/", "").replace("/", "_"),
      options.modelType || endpoint.replace("/predict/", "").replace("_", " "),
      payload, // inputSummary
      output, // outputSummary
      "SUCCESS",
      {
        triggerSource: options.triggerSource || "api_call",
        requestId: options.requestId,
        reservationId: options.reservationId,
        executionTimeMs,
        modelVersion: "1.0.0",
        confidence,
      }
    );

    return output;
  } catch (error) {
    executionTimeMs = Date.now() - startTime;
    errorMessage = error instanceof Error ? error.message : String(error);

    // Write AI event for failed inference
    await writeAIEvent(
      options.modelName || endpoint.replace("/predict/", "").replace("/", "_"),
      options.modelType || endpoint.replace("/predict/", "").replace("_", " "),
      payload, // inputSummary
      {}, // outputSummary (empty on error)
      "FAILED",
      {
        triggerSource: options.triggerSource || "api_call",
        requestId: options.requestId,
        reservationId: options.reservationId,
        executionTimeMs,
        modelVersion: "1.0.0",
        errorMessage,
      }
    );

    if (axios.isAxiosError(error)) {
      logger.error(`ML API error: ${endpoint}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(
        `ML API call failed: ${error.message} (${error.response?.status || "timeout"})`
      );
    }
    throw error;
  }
}

/**
 * Helper: Get user email from userId
 */
async function getUserEmail(userId: string): Promise<string> {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data()?.email || "unknown@example.com";
    }
    return "unknown@example.com";
  } catch (error) {
    logger.error("Failed to get user email", error);
    return "unknown@example.com";
  }
}

/**
 * STEP 6: Blood Request Creation Function
 * 
 * Trigger: donation_requests/{requestId} document creation
 * 
 * Responsibilities:
 * 1. Validate request data
 * 2. Call demand_forecasting ML API
 * 3. Store result in ml_outputs/demand/{requestId}
 * 4. Log action to audit_logs
 */
export const onDonationRequestCreated = onDocumentCreated(
  "donation_requests/{requestId}",
  async (event) => {
    const requestId = event.params.requestId;
    const requestData = event.data?.data();

    if (!requestData) {
      logger.error(`Request data is null for ${requestId}`);
      return;
    }

    logger.info(`Processing donation request: ${requestId}`, requestData);

    const {
      hospitalId,
      bloodGroup,
      quantity,
      urgency,
      region,
      createdBy,
    } = requestData;

    // Validate required fields
    if (!hospitalId || !bloodGroup || !quantity || !urgency) {
      logger.error(`Invalid request data for ${requestId}`, requestData);
      await logAudit(
        createdBy || "system",
        await getUserEmail(createdBy || "system"),
        "REQUEST_CREATED",
        "donation_request",
        requestId,
        "system",
        "ERROR",
        { error: "Missing required fields" },
        "Missing required fields: hospitalId, bloodGroup, quantity, or urgency"
      );
      return;
    }

    try {
      // Get hospital data for region if not provided
      let requestRegion = region;
      if (!requestRegion) {
        const hospitalDoc = await db.collection("hospitals").doc(hospitalId).get();
        if (hospitalDoc.exists) {
          requestRegion = hospitalDoc.data()?.region || 0;
        } else {
          requestRegion = 0;
        }
      }

      // Get current date for ML input
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      const day = now.getDate(); // 1-31

      // Get current supply/demand
      // Note: In a production system, you would query actual inventory from a separate collection
      // For now, we use the requested quantity as demand and 0 as supply (indicating need)
      const demandUnits = quantity;
      const supplyUnits = 0; // In production: Query from inventory collection based on bloodGroup and region

      // Prepare ML input according to contract
      const mlInput = {
        region: requestRegion,
        blood_group: encodeBloodGroup(bloodGroup),
        demand_units: demandUnits,
        supply_units: supplyUnits,
        month: month,
        day: day,
      };

      logger.info(`Calling demand forecasting ML for ${requestId}`, { mlInput });

      // Call demand forecasting ML API
      const mlOutput = await callMLAPI("/predict/demand", mlInput, 10000, {
        triggerSource: "donation_request_created",
        requestId,
        modelName: "Demand Forecasting",
        modelType: "demand_forecasting",
      });

      // Store ML output in ml_outputs collection
      await db.collection("ml_outputs").doc(`demand_${requestId}`).set({
        requestId,
        modelType: "demand_forecasting",
        input: mlInput,
        output: mlOutput,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        modelVersion: "1.0.0",
      });

      logger.info(`Stored ML output for ${requestId}`, { mlOutput });

      // Log to audit_logs
      await logAudit(
        createdBy,
        await getUserEmail(createdBy),
        "REQUEST_CREATED",
        "donation_request",
        requestId,
        "system",
        "SUCCESS",
        {
          bloodGroup,
          quantity,
          urgency,
          predictedDemand: mlOutput.predicted_demand,
        }
      );

      logger.info(`Successfully processed donation request: ${requestId}`);

      // Create alert for critical requests
      if (urgency === "CRITICAL") {
        await createAlert(
          "SUPPLY_WARNING",
          "CRITICAL",
          bloodGroup,
          `Critical Supply Warning: ${bloodGroup} Blood`,
          `AI Prediction: Based on current trends, stock may run out soon.`,
          hospitalId,
          requestId,
          0.92,
          ["Create urgent request immediately", "Contact backup suppliers"]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error processing donation request ${requestId}`, error);

      // Log error to audit_logs
      await logAudit(
        createdBy || "system",
        await getUserEmail(createdBy || "system"),
        "REQUEST_CREATED",
        "donation_request",
        requestId,
        "system",
        "ERROR",
        { error: errorMessage },
        errorMessage
      );

      // Store error in ml_outputs for debugging
      await db.collection("ml_outputs").doc(`demand_${requestId}`).set({
        requestId,
        modelType: "demand_forecasting",
        input: {},
        output: { error: errorMessage },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        modelVersion: "1.0.0",
        error: true,
      });
    }
  }
);

/**
 * Helper: Encode blood group string to integer (per ML contract)
 * O_NEGATIVE=0, O_POSITIVE=1, A_NEGATIVE=2, A_POSITIVE=3,
 * B_NEGATIVE=4, B_POSITIVE=5, AB_NEGATIVE=6, AB_POSITIVE=7
 */
function encodeBloodGroup(bloodGroup: string): number {
  const mapping: Record<string, number> = {
    "O-": 0,
    "O+": 1,
    "A-": 2,
    "A+": 3,
    "B-": 4,
    "B+": 5,
    "AB-": 6,
    "AB+": 7,
  };

  const encoded = mapping[bloodGroup.toUpperCase()];
  if (encoded === undefined) {
    logger.warn(`Unknown blood group: ${bloodGroup}, defaulting to 0`);
    return 0;
  }
  return encoded;
}

/**
 * Helper: Encode urgency level string to integer (per ML contract)
 * LOW=0, MEDIUM=1, HIGH=2, CRITICAL=3
 */
function encodeUrgency(urgency: string): number {
  const mapping: Record<string, number> = {
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2,
    "CRITICAL": 3,
  };

  const encoded = mapping[urgency.toUpperCase()];
  if (encoded === undefined) {
    logger.warn(`Unknown urgency: ${urgency}, defaulting to 1`);
    return 1;
  }
  return encoded;
}

/**
 * Helper: Encode time of day to integer (per ML contract)
 * MORNING=0, AFTERNOON=1, EVENING=2, NIGHT=3
 */
function encodeTimeOfDay(): number {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 0; // MORNING
  if (hour >= 12 && hour < 17) return 1; // AFTERNOON
  if (hour >= 17 && hour < 22) return 2; // EVENING
  return 3; // NIGHT
}

/**
 * Helper: Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * STEP 7: Donor Matching Engine with ML and Rule-Based Eligibility
 * 
 * Trigger: After demand forecast is written OR immediately after donation_request creation
 * 
 * Eligibility System:
 * ===================
 * Only eligible donors are notified (via reservation creation). Eligibility is determined by:
 * 
 * 1. RULE-BASED FILTERING:
 *    - Blood group must match request
 *    - Donor must be active (isActive === true)
 *    - Last donation must be > 56 days ago (or no previous donation)
 *    - Health status must not be UNFIT or TEMPORARILY_UNAVAILABLE
 *    - Distance must be within limit (varies by urgency: 50-100 km)
 * 
 * 2. ML-BASED FILTERING:
 *    - Availability score >= 30% (ML prediction)
 *    - Reliability score >= 20% (ML prediction)
 *    - Combined score >= 35% (weighted: 60% availability + 40% reliability)
 * 
 * Steps:
 * 1. Query donors matching basic criteria (blood group, active status)
 * 2. Apply rule-based filters (donation date, health, distance)
 * 3. For each rule-eligible donor:
 *    - Calculate distance to hospital
 *    - Call donor_availability ML API
 *    - Call donor_reliability ML API
 *    - Calculate combined score
 * 4. Filter by ML thresholds (only keep donors above minimum scores)
 * 5. Rank remaining donors by combined score
 * 6. Create reservations (notifications) for top N donors
 * 7. Store ML outputs and explanations
 * 
 * Result: Only donors passing BOTH rule-based AND ML-based filters receive notifications
 */
export const onDemandForecastCreated = onDocumentCreated(
  "ml_outputs/{mlOutputId}",
  async (event) => {
    const mlOutputId = event.params.mlOutputId;
    const mlOutputData = event.data?.data();

    if (!mlOutputData) {
      return;
    }

    // Only process demand forecasting outputs
    if (mlOutputData.modelType !== "demand_forecasting" || !mlOutputId.startsWith("demand_")) {
      return;
    }

    // Extract requestId from document ID (format: demand_{requestId})
    const requestId = mlOutputId.replace("demand_", "");
    if (!requestId) {
      logger.error("Could not extract requestId from ML output document ID");
      return;
    }

    logger.info(`Starting donor matching for request: ${requestId}`);
    logger.info(`Starting donor matching for request: ${requestId}`);

    try {
      // Get the donation request
      const requestDoc = await db.collection("donation_requests").doc(requestId).get();
      if (!requestDoc.exists) {
        logger.error(`Donation request ${requestId} not found`);
        return;
      }

      const requestData = requestDoc.data()!;
      const {
        hospitalId,
        bloodGroup,
        quantity,
        urgency,
      } = requestData;

      // Get hospital location
      const hospitalDoc = await db.collection("hospitals").doc(hospitalId).get();
      if (!hospitalDoc.exists) {
        logger.error(`Hospital ${hospitalId} not found`);
        return;
      }

      const hospitalData = hospitalDoc.data()!;
      const hospitalLocation = hospitalData.location;
      if (!hospitalLocation) {
        logger.error(`Hospital ${hospitalId} has no location`);
        return;
      }

      // ============================================
      // ELIGIBILITY RULES (Rule-based filtering)
      // ============================================

      // Rule 1: Minimum days since last donation (56 days for whole blood)
      const minDaysSinceLastDonation = 56;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - minDaysSinceLastDonation);

      // Rule 2: Maximum distance (varies by urgency)
      const maxDistanceKm: Record<string, number> = {
        "LOW": 100,      // 100 km for low urgency
        "MEDIUM": 75,    // 75 km for medium urgency
        "HIGH": 50,      // 50 km for high urgency
        "CRITICAL": 100, // 100 km for critical (wider net)
      };
      const distanceLimit = maxDistanceKm[urgency] || 50;

      // Rule 3: Minimum ML score thresholds
      const MIN_AVAILABILITY_SCORE = 0.3;  // Minimum 30% availability probability
      const MIN_RELIABILITY_SCORE = 0.2;   // Minimum 20% reliability (lower for new donors)
      const MIN_COMBINED_SCORE = 0.35;     // Minimum 35% combined score

      // Query eligible donors (basic filters)
      // NOTE: System uses both 'bloodGroup' and 'bloodType' fields
      // Query active donors and filter by blood type in memory
      // Also check donorStatus == "APPROVED" as activated donors have this status
      const eligibleDonorsQuery = db
        .collection("donors")
        .where("isActive", "==", true);

      // Note: Firestore doesn't support OR queries directly
      // We'll filter in memory for blood type match (checking both bloodGroup and bloodType)
      const eligibleDonorsSnapshot = await eligibleDonorsQuery.get();

      logger.info(`Found ${eligibleDonorsSnapshot.size} active donors, filtering for blood group ${bloodGroup}`);

      // Apply rule-based filters
      const ruleEligibleDonors = eligibleDonorsSnapshot.docs.filter((doc) => {
        const data = doc.data();

        // CRITICAL: Check blood type match (support both bloodGroup and bloodType fields)
        // The system stores blood type in 'bloodType' field, but queries use 'bloodGroup'
        const donorBloodGroup = data.bloodGroup || data.bloodType;

        if (!donorBloodGroup) {
          logger.debug(`Donor ${doc.id} has no blood type (bloodGroup or bloodType field)`);
          return false;
        }

        if (donorBloodGroup !== bloodGroup) {
          logger.debug(
            `Donor ${doc.id} blood type mismatch: ` +
            `donor=${donorBloodGroup} (bloodGroup: ${data.bloodGroup}, bloodType: ${data.bloodType}), request=${bloodGroup}`
          );
          return false;
        }

        // Check donor status (should be APPROVED for activated donors)
        const donorStatus = data.donorStatus;
        if (donorStatus && donorStatus !== "APPROVED" && donorStatus !== "UNVERIFIED") {
          // Allow UNVERIFIED as some donors might not have gone through activation yet
          // But reject SUSPENDED or other non-active statuses
          logger.debug(`Donor ${doc.id} has non-approved status: ${donorStatus}`);
          // Don't return false here - isActive field is the primary indicator
        }

        // Rule 1: Check last donation date
        const lastDonation = data.lastDonationDate;
        const passedDonationRule = !lastDonation || (lastDonation.toDate() < cutoffDate);
        if (!passedDonationRule) {
          logger.debug(`Donor ${doc.id} failed donation date rule`);
          return false;
        }

        // Rule 2: Check health status (if available)
        const healthStatus = data.healthStatus;
        if (healthStatus === "UNFIT" || healthStatus === "TEMPORARILY_UNAVAILABLE") {
          logger.debug(`Donor ${doc.id} failed health status rule: ${healthStatus}`);
          return false;
        }

        // Rule 3: Check if donor has location (required for distance calculation)
        if (!data.location) {
          logger.debug(`Donor ${doc.id} has no location, will be filtered later`);
          // Don't filter here, will check distance after calculation
        }

        return true;
      });

      logger.info(`Found ${ruleEligibleDonors.length} rule-eligible donors for ${requestId} (blood group: ${bloodGroup})`);

      // Log details about why donors might have been filtered out
      if (ruleEligibleDonors.length === 0 && eligibleDonorsSnapshot.size > 0) {
        logger.warn(
          `No rule-eligible donors found for ${requestId}. ` +
          `Checked ${eligibleDonorsSnapshot.size} active donors. ` +
          `Blood group filter: ${bloodGroup}. ` +
          `Possible reasons: blood type mismatch, recent donation (< 56 days), health status, or missing location.`
        );

        // Log sample of filtered donors for debugging
        const sampleFiltered = eligibleDonorsSnapshot.docs.slice(0, 5).map(doc => {
          const data = doc.data();
          return {
            donorId: doc.id,
            bloodGroup: data.bloodGroup || "missing",
            bloodType: data.bloodType || "missing",
            isActive: data.isActive,
            donorStatus: data.donorStatus,
            hasLocation: !!data.location,
            lastDonation: data.lastDonationDate ? data.lastDonationDate.toDate().toISOString() : "none",
          };
        });
        logger.info(`Sample of filtered donors:`, sampleFiltered);
      }

      if (ruleEligibleDonors.length === 0) {
        logger.warn(`No eligible donors found for request ${requestId}`);
        // Create alert for no donors available
        await createAlert(
          "NO_DONOR_RESPONSE",
          "HIGH",
          bloodGroup,
          `No eligible donors found for ${bloodGroup} request`,
          `Request ${requestId} has no eligible donors available.`,
          hospitalId,
          requestId
        );
        return;
      }

      // ============================================
      // ML-BASED SCORING AND FILTERING
      // ============================================

      // Score each donor using ML
      const donorScores: Array<{
        donorId: string;
        donorData: admin.firestore.DocumentData;
        availabilityScore: number;
        reliabilityScore: number;
        combinedScore: number;
        distanceKm: number;
        explanation: string;
        llmExplanation?: LLMExplanation | null;
        passedFilters: boolean;
      }> = [];

      for (const donorDoc of ruleEligibleDonors) {
        const donorId = donorDoc.id;
        const donorData = donorDoc.data();

        try {
          // Calculate distance (Rule 2: Distance check)
          const donorLocation = donorData.location;
          if (!donorLocation) {
            logger.debug(`Donor ${donorId} has no location, skipping`);
            continue;
          }

          const distanceKm = calculateDistance(
            hospitalLocation.latitude,
            hospitalLocation.longitude,
            donorLocation.latitude,
            donorLocation.longitude
          );

          // Apply distance rule
          if (distanceKm > distanceLimit) {
            logger.debug(`Donor ${donorId} failed distance rule: ${distanceKm.toFixed(1)}km > ${distanceLimit}km`);
            continue;
          }

          // Calculate days since last donation
          const lastDonationDate = donorData.lastDonationDate?.toDate() || new Date(0);
          const daysSinceLastDonation = Math.floor(
            (Date.now() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Get donor stats for reliability
          const totalRequests = donorData.totalRequests || 0;
          const acceptedRequests = donorData.acceptedRequests || 0;
          const completedDonations = donorData.completedDonations || 0;
          const noShows = donorData.noShows || 0;
          const avgResponseTimeMinutes = donorData.avgResponseTimeMinutes || 60;
          const pastAcceptanceRate = donorData.pastAcceptanceRate || 0.5;

          // Get donor blood group (support both bloodGroup and bloodType fields)
          const donorBloodGroupValue = donorData.bloodGroup || donorData.bloodType || bloodGroup;

          // Call availability ML
          const availabilityInput = {
            blood_group: encodeBloodGroup(donorBloodGroupValue),
            distance_km: distanceKm,
            days_since_last_donation: daysSinceLastDonation,
            past_acceptance_rate: pastAcceptanceRate,
            urgency_level: encodeUrgency(urgency),
            time_of_day: encodeTimeOfDay(),
          };

          // Store availability ML output (will update with reservationId later)
          const tempReservationId = `temp_${requestId}_${donorId}`;

          const availabilityOutput = await callMLAPI(
            "/predict/availability",
            availabilityInput,
            10000,
            {
              triggerSource: "demand_forecast_created",
              requestId,
              reservationId: tempReservationId,
              modelName: "Donor Availability",
              modelType: "donor_availability",
            }
          );
          const availabilityScore = availabilityOutput.availability_probability as number;

          const availabilityDocRef = db.collection("ml_outputs").doc(`availability_${tempReservationId}`);
          await availabilityDocRef.set({
            reservationId: tempReservationId,
            modelType: "donor_availability",
            input: availabilityInput,
            output: availabilityOutput,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            modelVersion: "1.0.0",
          });

          // Call reliability ML (only if donor has history)
          let reliabilityScore = 0.5; // Default for new donors
          const hasHistory = (totalRequests || 0) > 0 || (acceptedRequests || 0) > 0 || (completedDonations || 0) > 0;

          if (hasHistory) {
            const reliabilityInput = {
              total_requests: Math.max(totalRequests || 0, acceptedRequests || 0, completedDonations || 0),
              accepted_requests: acceptedRequests || 0,
              completed_donations: completedDonations || 0,
              no_shows: noShows || 0,
              avg_response_time_minutes: avgResponseTimeMinutes || 60,
            };

            const reliabilityOutput = await callMLAPI(
              "/predict/reliability",
              reliabilityInput,
              10000,
              {
                triggerSource: "demand_forecast_created",
                requestId,
                reservationId: tempReservationId,
                modelName: "Donor Reliability",
                modelType: "donor_reliability",
              }
            );
            reliabilityScore = reliabilityOutput.reliability_score as number;

            // Store reliability ML output (will update with reservationId later)
            const reliabilityDocRef = db.collection("ml_outputs").doc(`reliability_${tempReservationId}`);
            await reliabilityDocRef.set({
              reservationId: tempReservationId,
              modelType: "donor_reliability",
              input: reliabilityInput,
              output: reliabilityOutput,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              modelVersion: "1.0.0",
            });

            try {
              await db.collection("donors").doc(donorId).update({
                reliabilityScore,
                reliabilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            } catch (error) {
              logger.warn(
                `Failed to update donor reliability for ${donorId}`,
                error
              );
            }

            const reliabilityAlertSeverity =
              reliabilityScore < 0.3 ? "HIGH" :
                reliabilityScore < 0.5 ? "MEDIUM" :
                  null;

            if (reliabilityAlertSeverity) {
              const reliabilityPercent = (
                reliabilityScore * 100
              ).toFixed(1);
              const reliabilityMessage =
                `Donor ${donorId} reliability ` +
                `${reliabilityPercent}% for request ${requestId}.`;

              await createAlert(
                "SYSTEM_ANALYSIS",
                reliabilityAlertSeverity,
                bloodGroup,
                "Donor reliability insight",
                reliabilityMessage,
                hospitalId,
                requestId,
                reliabilityScore,
                [
                  "Confirm donor availability again",
                  "Prepare backup donors for this request",
                ]
              );
            }
          }

          // Combine scores (weighted: 60% availability, 40% reliability)
          const combinedScore = (availabilityScore * 0.6) + (reliabilityScore * 0.4);

          // ============================================
          // ML-BASED FILTERING (Apply ML thresholds)
          // ============================================

          // Check if donor passes ML score thresholds
          const passedAvailabilityThreshold = availabilityScore >= MIN_AVAILABILITY_SCORE;
          const passedReliabilityThreshold = reliabilityScore >= MIN_RELIABILITY_SCORE;
          const passedCombinedThreshold = combinedScore >= MIN_COMBINED_SCORE;

          const passedMLFilters = passedAvailabilityThreshold &&
            passedReliabilityThreshold &&
            passedCombinedThreshold;

          if (!passedMLFilters) {
            logger.debug(
              `Donor ${donorId} failed ML thresholds: ` +
              `availability=${(availabilityScore * 100).toFixed(1)}% (min ${MIN_AVAILABILITY_SCORE * 100}%), ` +
              `reliability=${(reliabilityScore * 100).toFixed(1)}% (min ${MIN_RELIABILITY_SCORE * 100}%), ` +
              `combined=${(combinedScore * 100).toFixed(1)}% (min ${MIN_COMBINED_SCORE * 100}%)`
            );
            continue; // Skip this donor - not eligible based on ML scores
          }

          // Generate LLM explanation (with fallback)
          // Determine donor category and action priority for LLM input
          let donorCategory: "Highly Suitable" | "Moderately Suitable" | "Low Suitability" | "Not Recommended";
          if (combinedScore >= 0.7 && availabilityScore >= 0.6 && reliabilityScore >= 0.6) {
            donorCategory = "Highly Suitable";
          } else if (combinedScore >= 0.5) {
            donorCategory = "Moderately Suitable";
          } else if (combinedScore >= 0.35) {
            donorCategory = "Low Suitability";
          } else {
            donorCategory = "Not Recommended";
          }

          const llmInputData = {
            bloodGroup,
            urgency,
            distanceKm,
            quantity,
            availabilityScore,
            reliabilityScore,
            demandPrediction: mlOutputData.output?.predicted_demand || 0.5,
            donorCategory,
            daysSinceLastDonation
          };

          const insight = await generateInsight({
            role: "hospital",
            screen: "hospital_dashboard",
            event: "donor_match",
            data: llmInputData
          });

          // Map the new Insight format to the legacy structure expected by donorScores array (temporarily)
          // Or even better, just store the insight directly.
          donorScores.push({
            donorId,
            donorData,
            availabilityScore,
            reliabilityScore,
            combinedScore,
            distanceKm,
            explanation: insight.summary,
            llmExplanation: insight,
            passedFilters: true,
          });
        } catch (error) {
          logger.error(`Error scoring donor ${donorId}`, error);
          // Continue with other donors
        }
      }

      // Sort by combined score (descending) - best matches first
      donorScores.sort((a, b) => b.combinedScore - a.combinedScore);

      // Only donors who passed all filters (rules + ML) are in donorScores
      logger.info(
        `Found ${donorScores.length} eligible donors after ML filtering ` +
        `(from ${ruleEligibleDonors.length} rule-eligible donors) for request ${requestId}`
      );

      if (donorScores.length === 0) {
        logger.warn(`No eligible donors found after ML filtering for request ${requestId}`);
        await createAlert(
          "NO_DONOR_RESPONSE",
          "HIGH",
          bloodGroup,
          `No eligible donors found for ${bloodGroup} request`,
          `Request ${requestId} has no donors meeting ML and rule-based eligibility criteria.`,
          hospitalId,
          requestId
        );
        return;
      }

      // Create reservations for top N donors (or all if less than quantity needed)
      // Only notify donors who passed all filters
      const numReservations = Math.min(donorScores.length, quantity * 2); // Create 2x reservations for buffer

      logger.info(
        `Creating ${numReservations} reservations (notifications) for request ${requestId}. ` +
        `All donors passed eligibility rules and ML thresholds.`
      );

      for (let i = 0; i < numReservations; i++) {
        const score = donorScores[i];
        const reservationRef = db.collection("reservations").doc();
        const reservationId = reservationRef.id;
        const tempReservationId = `temp_${requestId}_${score.donorId}`;

        await reservationRef.set({
          requestId,
          donorId: score.donorId,
          hospitalId,
          status: "PENDING",
          rank: i + 1,
          mlScores: {
            availability: score.availabilityScore,
            reliability: score.reliabilityScore,
            combined: score.combinedScore,
          },
          explanation: score.explanation,
          distanceKm: score.distanceKm,
          // Store LLM explanation if available (UI-specific format)
          // Store the entire explanation object as it varies by screen type
          ...(score.llmExplanation && {
            llmExplanation: score.llmExplanation,
            // Also store screen context for frontend to know which format to use
            llmExplanationScreen: uiScreen,
          }),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update ML output references with actual reservationId
        try {
          await db.collection("ml_outputs").doc(`availability_${tempReservationId}`)
            .update({ reservationId });
          await db.collection("ml_outputs").doc(`reliability_${tempReservationId}`)
            .update({ reservationId });
        } catch (error) {
          logger.warn(`Failed to update ML output references for ${reservationId}`, error);
        }
      }

      logger.info(`Successfully created ${numReservations} reservations for request ${requestId}`);
    } catch (error) {
      logger.error(`Error in donor matching for request ${requestId}`, error);
    }
  }
);

/**
 * STEP 8: Donor Response Handler
 * 
 * Trigger: reservations/{id} write (create or update)
 * 
 * Logic:
 * - If status changes to ACCEPTED:
 *   - Confirm reservation
 *   - Notify hospital (Firestore write)
 *   - Update donor stats
 * - If DECLINED:
 *   - Update donor stats
 *   - Update audit_logs
 */
export const onReservationStatusChanged = onDocumentWritten(
  "reservations/{reservationId}",
  async (event) => {
    const reservationId = event.params.reservationId;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Skip if this is a create (no before data) - we only process updates
    if (!beforeData || !afterData) {
      logger.info(`Skipping reservation ${reservationId} - create event (no before data)`);
      return;
    }

    const beforeStatus = beforeData.status;
    const afterStatus = afterData.status;

    // Only process if status actually changed
    if (beforeStatus === afterStatus) {
      logger.info(`Skipping reservation ${reservationId} - status unchanged (${afterStatus})`);
      return;
    }

    // Extract required fields with validation
    const requestId = afterData.requestId;
    const donorId = afterData.donorId;
    const hospitalId = afterData.hospitalId;

    // Validate required fields
    if (!requestId || !donorId) {
      logger.error(`Reservation ${reservationId} missing required fields`, {
        requestId,
        donorId,
        hospitalId,
        afterStatus,
      });
      return;
    }

    logger.info(`Reservation ${reservationId} status changed: ${beforeStatus} -> ${afterStatus}`, {
      requestId,
      donorId,
      hospitalId,
    });

    try {
      if (afterStatus === "ACCEPTED") {
        // Confirm reservation (Functions can set CONFIRMED)
        await db.collection("reservations").doc(reservationId).update({
          status: "CONFIRMED",
          confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update donor stats (with error handling)
        try {
          const donorRef = db.collection("donors").doc(donorId);
          await donorRef.update({
            acceptedRequests: admin.firestore.FieldValue.increment(1),
            totalRequests: admin.firestore.FieldValue.increment(1),
          });
        } catch (donorError) {
          logger.error(`Error updating donor stats for ${donorId}`, donorError);
          // Don't fail the whole function if donor stats update fails
        }

        // Note: Request status is now updated atomically in the API route transaction
        // We don't update it here to avoid conflicts

        // Log to audit
        try {
          await logAudit(
            donorId,
            await getUserEmail(donorId),
            "RESERVATION_ACCEPTED",
            "reservation",
            reservationId,
            "system",
            "SUCCESS",
            { requestId, hospitalId }
          );
        } catch (auditError) {
          logger.error(`Error logging audit for reservation ${reservationId}`, auditError);
          // Don't fail the whole function if audit logging fails
        }

        logger.info(`Reservation ${reservationId} confirmed`);
      } else if (afterStatus === "DECLINED") {
        // Update donor stats (with error handling)
        try {
          const donorRef = db.collection("donors").doc(donorId);
          await donorRef.update({
            totalRequests: admin.firestore.FieldValue.increment(1),
          });
        } catch (donorError) {
          logger.error(`Error updating donor stats for ${donorId}`, donorError);
          // Don't fail the whole function if donor stats update fails
        }

        // Log to audit
        try {
          await logAudit(
            donorId,
            await getUserEmail(donorId),
            "RESERVATION_DECLINED",
            "reservation",
            reservationId,
            "system",
            "SUCCESS",
            { requestId, hospitalId }
          );
        } catch (auditError) {
          logger.error(`Error logging audit for reservation ${reservationId}`, auditError);
          // Don't fail the whole function if audit logging fails
        }

        logger.info(`Reservation ${reservationId} declined`);
      } else if (afterStatus === "COMPLETED") {
        // Handle reservation completion
        // Update donor stats (increment completedDonations)
        try {
          const donorRef = db.collection("donors").doc(donorId);
          await donorRef.update({
            completedDonations: admin.firestore.FieldValue.increment(1),
            lastDonationDate: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (donorError) {
          logger.error(`Error updating donor stats for ${donorId}`, donorError);
          // Don't fail the whole function if donor stats update fails
        }

        // Check if request should be marked as fulfilled
        if (requestId) {
          try {
            const requestRef = db.collection("donation_requests").doc(requestId);
            const requestDoc = await requestRef.get();

            if (requestDoc.exists) {
              const requestData = requestDoc.data();
              if (requestData) {
                // Count completed reservations for this request
                const completedReservations = await db
                  .collection("reservations")
                  .where("requestId", "==", requestId)
                  .where("status", "==", "COMPLETED")
                  .get();

                // If we have enough completed donations, mark request as fulfilled
                const requiredQuantity = requestData.quantity || 1;
                if (completedReservations.size >= requiredQuantity) {
                  await requestRef.update({
                    status: "FULFILLED",
                    fulfilledAt: admin.firestore.FieldValue.serverTimestamp(),
                  });
                  logger.info(`Request ${requestId} marked as FULFILLED after ${completedReservations.size} completed reservations`);
                }
              }
            } else {
              logger.warn(`Request ${requestId} not found when checking fulfillment for reservation ${reservationId}`);
            }
          } catch (requestError) {
            logger.error(`Error checking request fulfillment for ${requestId}`, requestError);
            // Don't fail the whole function if request update fails
          }
        }

        // Log to audit
        try {
          await logAudit(
            donorId,
            await getUserEmail(donorId),
            "RESERVATION_COMPLETED",
            "reservation",
            reservationId,
            "system",
            "SUCCESS",
            { requestId, hospitalId }
          );
        } catch (auditError) {
          logger.error(`Error logging audit for reservation ${reservationId}`, auditError);
          // Don't fail the whole function if audit logging fails
        }

        logger.info(`Reservation ${reservationId} completed`);
      }
    } catch (error) {
      // Catch any unexpected errors and log them without crashing the function
      logger.error(`Unexpected error processing reservation ${reservationId} status change`, {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        beforeStatus,
        afterStatus,
        requestId,
        donorId,
        hospitalId,
      });
      // Don't re-throw - we want the function to complete successfully even if side effects fail
    }
  }
);

/**
 * Helper: Create alert document
 */
async function createAlert(
  type: string,
  severity: string,
  bloodGroup: string,
  title: string,
  message: string,
  hospitalId?: string,
  requestId?: string,
  confidence?: number,
  recommendedActions?: string[],
  area?: string,
  region?: number
): Promise<void> {
  try {
    await db.collection("alerts").add({
      type,
      severity,
      bloodGroup,
      title,
      message,
      ...(hospitalId && { relatedHospitalId: hospitalId }),
      ...(requestId && { relatedRequestId: requestId }),
      ...(confidence !== undefined && { confidence }),
      ...(recommendedActions && { recommendedActions }),
      ...(area && { area }),
      ...(region !== undefined && { region }),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`Created alert: ${title}`);
  } catch (error) {
    logger.error("Failed to create alert", error);
  }
}

/**
 * STEP 9: Real-Time Blood Shortage Prediction
 * 
 * Trigger: blood_inventory/{inventoryId} write (create or update)
 * 
 * Responsibilities:
 * 1. Monitor blood inventory changes (supply/demand)
 * 2. Call demand forecasting ML API with real data from Firestore
 * 3. Generate alerts when ML predicts high shortage risk
 * 4. Link alerts to hospitals in the affected region
 * 
 * Alert Generation Logic:
 * - predicted_demand >= 0.7 (70%): CRITICAL alert
 * - predicted_demand >= 0.5 (50%): HIGH alert
 * - predicted_demand >= 0.3 (30%): MEDIUM alert
 * - predicted_demand < 0.3: No alert (sufficient supply)
 */
export const onBloodInventoryChanged = onDocumentWritten(
  "blood_inventory/{inventoryId}",
  async (event) => {
    const inventoryId = event.params.inventoryId;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Skip if this is a delete
    if (!afterData) {
      return;
    }

    // Skip if this is a create and we don't have enough data
    if (!beforeData && (!afterData.supplyUnits || !afterData.demandUnits)) {
      return;
    }

    // Only process if supply or demand changed significantly
    if (beforeData) {
      const supplyChanged = Math.abs((afterData.supplyUnits || 0) - (beforeData.supplyUnits || 0)) > 2;
      const demandChanged = Math.abs((afterData.demandUnits || 0) - (beforeData.demandUnits || 0)) > 2;
      if (!supplyChanged && !demandChanged) {
        return; // No significant change
      }
    }

    const {
      bloodGroup,
      region,
      supplyUnits,
      demandUnits,
      month,
      day,
    } = afterData;

    if (!bloodGroup || region === undefined || !supplyUnits || !demandUnits) {
      logger.warn(`Incomplete inventory data for ${inventoryId}`);
      return;
    }

    logger.info(`Processing inventory change for ${inventoryId}`, {
      bloodGroup,
      region,
      supplyUnits,
      demandUnits,
    });

    try {
      // Get current date if not provided
      const now = new Date();
      const mlMonth = month || (now.getMonth() + 1);
      const mlDay = day || now.getDate();

      // Prepare ML input with real data from Firestore
      const mlInput = {
        region: region,
        blood_group: encodeBloodGroup(bloodGroup),
        demand_units: demandUnits,
        supply_units: supplyUnits,
        month: mlMonth,
        day: mlDay,
      };

      logger.info(`Calling demand forecasting ML for inventory ${inventoryId}`, { mlInput });

      // Call demand forecasting ML API
      const mlOutput = await callMLAPI("/predict/demand", mlInput, 10000, {
        triggerSource: "blood_inventory_changed",
        requestId: inventoryId,
        modelName: "Demand Forecasting",
        modelType: "demand_forecasting",
      });

      const predictedDemand = mlOutput.predicted_demand as number;
      if (typeof predictedDemand !== "number" || isNaN(predictedDemand)) {
        logger.error(`Invalid ML output for ${inventoryId}`, mlOutput);
        return;
      }

      // Store ML output
      await db.collection("ml_outputs").doc(`shortage_${inventoryId}`).set({
        inventoryId,
        modelType: "demand_forecasting",
        input: mlInput,
        output: mlOutput,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        modelVersion: "1.0.0",
      });

      logger.info(`ML prediction for ${inventoryId}: ${(predictedDemand * 100).toFixed(1)}% demand probability`);

      // Generate alerts based on ML prediction
      let severity: string | null = null;
      let alertType = "SUPPLY_WARNING";
      let title = "";
      let message = "";
      let recommendedActions: string[] = [];

      if (predictedDemand >= 0.7) {
        // CRITICAL: High risk of shortage
        severity = "CRITICAL";
        title = `Critical Shortage Risk: ${bloodGroup} Blood in Region ${region}`;
        message = `AI Prediction: ${(predictedDemand * 100).toFixed(1)}% probability of high demand. Current supply (${supplyUnits} units) may be insufficient for expected demand (${demandUnits} units).`;
        recommendedActions = [
          "Immediate donor outreach campaign",
          "Contact regional blood banks",
          "Activate emergency protocols",
          "Notify all hospitals in region",
        ];
      } else if (predictedDemand >= 0.5) {
        // HIGH: Significant risk
        severity = "HIGH";
        title = `High Shortage Risk: ${bloodGroup} Blood in Region ${region}`;
        message = `AI Prediction: ${(predictedDemand * 100).toFixed(1)}% probability of high demand. Monitor supply closely. Current: ${supplyUnits} units supply, ${demandUnits} units demand.`;
        recommendedActions = [
          "Increase donor recruitment",
          "Prepare backup supply sources",
          "Monitor inventory levels hourly",
        ];
      } else if (predictedDemand >= 0.3) {
        // MEDIUM: Moderate risk
        severity = "MEDIUM";
        title = `Moderate Demand Surge: ${bloodGroup} Blood in Region ${region}`;
        message = `AI Prediction: ${(predictedDemand * 100).toFixed(1)}% probability of increased demand. Current supply appears adequate but monitor trends.`;
        recommendedActions = [
          "Track demand patterns",
          "Maintain current inventory levels",
        ];
      }

      // Create alert if risk detected
      if (severity) {
        // Find hospitals in this region
        const hospitalsSnapshot = await db
          .collection("hospitals")
          .where("region", "==", region)
          .where("isActive", "==", true)
          .get();

        // Create alert for each hospital in the region
        const alertPromises = hospitalsSnapshot.docs.map(async (hospitalDoc) => {
          const hospitalId = hospitalDoc.id;
          const hospitalData = hospitalDoc.data();
          const area = hospitalData.name || `Region ${region}`;

          await createAlert(
            alertType,
            severity,
            bloodGroup,
            title,
            message,
            hospitalId,
            undefined, // No specific requestId
            predictedDemand,
            recommendedActions,
            area,
            region
          );
        });

        // Also create a general alert if no hospitals found
        if (hospitalsSnapshot.empty) {
          await createAlert(
            alertType,
            severity,
            bloodGroup,
            title,
            message,
            undefined,
            undefined,
            predictedDemand,
            recommendedActions,
            `Region ${region}`,
            region
          );
        } else {
          await Promise.all(alertPromises);
        }

        logger.info(
          `Created ${severity} alert for ${bloodGroup} in Region ${region} ` +
          `(predicted demand: ${(predictedDemand * 100).toFixed(1)}%)`
        );
      } else {
        logger.info(
          `No alert needed for ${bloodGroup} in Region ${region} ` +
          `(predicted demand: ${(predictedDemand * 100).toFixed(1)}% - low risk)`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error processing inventory change for ${inventoryId}`, error);

      // Store error in ml_outputs
      await db.collection("ml_outputs").doc(`shortage_${inventoryId}`).set({
        inventoryId,
        modelType: "demand_forecasting",
        input: {},
        output: { error: errorMessage },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        modelVersion: "1.0.0",
        error: true,
      });
    }
  }
);

/**
 * STEP 10: Alerts & Emergency Logic (Legacy)
 * 
 * Creates emergency alerts when:
 * - forecasted demand > supply threshold
 * - no donor accepts within a time window
 * 
 * Note: This is handled in onDonationRequestCreated for critical requests
 * Additional alert logic can be added here for scheduled checks
 */

/**
 * STEP 11: Donor Profile Initialization
 * 
 * Trigger: donors/{donorId} document creation
 * 
 * Responsibilities:
 * 1. Initialize reliability metrics for new donors
 * 2. Set default counters to ensure data consistency
 */
export const onDonorCreated = onDocumentCreated(
  "donors/{donorId}",
  async (event) => {
    const donorId = event.params.donorId;
    const data = event.data?.data();

    if (!data) return;

    logger.info(`Initializing reliability for new donor: ${donorId}`);

    try {
      await db.collection("donors").doc(donorId).update({
        reliabilityScore: 0.5,
        reliabilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalRequests: 0,
        acceptedRequests: 0,
        completedDonations: 0,
        noShows: 0,
        pastAcceptanceRate: 0.5,
        avgResponseTimeMinutes: 60,
      });
    } catch (error) {
      logger.error(`Error initializing donor ${donorId}`, error);
    }
  }
);
