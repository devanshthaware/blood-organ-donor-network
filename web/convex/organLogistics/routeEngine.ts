/**
 * Logistics Route Engine & Provider Abstraction
 * Generates multi-modal route estimates (ground vs air) with explicit simulation labeling.
 */

import { calculateDistanceKm } from "../organMatching/compatibilityEngine";
import { MODE_CONFIG, TransportMode } from "./logisticsConstants";

export interface RouteEstimate {
  mode: TransportMode;
  provider: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  safetyBufferMinutes: number;
  isSimulation: boolean;
  calculatedAt: number;
}

export interface RouteProvider {
  name: string;
  calculateRoutes(
    origin: { lat: number; lng: number; facilityName?: string },
    destination: { lat: number; lng: number; facilityName?: string }
  ): Promise<RouteEstimate[]>;
}

export class SimulatedMultiModalRouteProvider implements RouteProvider {
  name = "SIMULATED-MULTI-MODAL-DISPATCHER";

  async calculateRoutes(
    origin: { lat: number; lng: number; facilityName?: string },
    destination: { lat: number; lng: number; facilityName?: string }
  ): Promise<RouteEstimate[]> {
    const directDist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const now = Date.now();
    const estimates: RouteEstimate[] = [];

    // 1. Road Ambulance Option
    const roadDist = Math.round(directDist * 1.25); // 1.25 road curvature multiplier
    const roadTransitHours = roadDist / MODE_CONFIG.ROAD_AMBULANCE.speedKmh;
    const roadTotalMinutes = Math.round(
      roadTransitHours * 60 + MODE_CONFIG.ROAD_AMBULANCE.prepAndHandoffMinutes
    );

    if (roadDist <= MODE_CONFIG.ROAD_AMBULANCE.maxRangeKm) {
      estimates.push({
        mode: "ROAD_AMBULANCE",
        provider: "City Critical Care Ground Dispatch",
        distanceKm: roadDist,
        estimatedDurationMinutes: roadTotalMinutes,
        safetyBufferMinutes: MODE_CONFIG.ROAD_AMBULANCE.safetyBufferMinutes,
        isSimulation: true,
        calculatedAt: now,
      });
    }

    // 2. Air Charter Option (Available for any distance >= 60 km)
    const airDist = Math.round(directDist * 1.05); // Direct flight corridor
    const airFlightHours = airDist / MODE_CONFIG.AIR_CHARTER.speedKmh;
    const airTotalMinutes = Math.round(
      airFlightHours * 60 + MODE_CONFIG.AIR_CHARTER.prepAndHandoffMinutes
    );

    estimates.push({
      mode: "AIR_CHARTER",
      provider: "National Aeromedical Express (Air Charter)",
      distanceKm: airDist,
      estimatedDurationMinutes: airTotalMinutes,
      safetyBufferMinutes: MODE_CONFIG.AIR_CHARTER.safetyBufferMinutes,
      isSimulation: true,
      calculatedAt: now,
    });

    // 3. Specialized Medical Courier (Short hops <= 150 km)
    if (directDist <= MODE_CONFIG.SPECIALIZED_MEDICAL_COURIER.maxRangeKm) {
      const courierDist = Math.round(directDist * 1.2);
      const courierHours = courierDist / MODE_CONFIG.SPECIALIZED_MEDICAL_COURIER.speedKmh;
      const courierTotalMinutes = Math.round(
        courierHours * 60 + MODE_CONFIG.SPECIALIZED_MEDICAL_COURIER.prepAndHandoffMinutes
      );

      estimates.push({
        mode: "SPECIALIZED_MEDICAL_COURIER",
        provider: "Priority Organ Rush Courier",
        distanceKm: courierDist,
        estimatedDurationMinutes: courierTotalMinutes,
        safetyBufferMinutes: MODE_CONFIG.SPECIALIZED_MEDICAL_COURIER.safetyBufferMinutes,
        isSimulation: true,
        calculatedAt: now,
      });
    }

    return estimates;
  }
}

export function isRouteEstimateStale(
  calculatedAt: number,
  maxAgeMinutes: number = 30,
  currentTime: number = Date.now()
): boolean {
  return currentTime - calculatedAt > maxAgeMinutes * 60 * 1000;
}
