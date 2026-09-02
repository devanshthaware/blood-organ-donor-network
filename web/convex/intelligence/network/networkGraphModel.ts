/**
 * Healthcare Network Graph Model & Topological Resilience Engine
 * Models donors, hospitals, inventory, and requests as a connected healthcare graph.
 */

export interface GraphNode {
  id: string;
  type: "DONOR" | "HOSPITAL" | "BLOOD_BANK" | "REQUEST" | "REGION";
  label: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  type: "SUPPLY_LINK" | "REQUEST_AT" | "LOCATED_IN" | "ELIGIBLE_FOR";
  weight: number;
}

export interface RegionalResilienceMetric {
  regionId: string;
  totalHospitals: number;
  activeDonors: number;
  totalSupplyUnits: number;
  averageDistanceKm: number;
  resilienceScore: number; // 0 to 100
  resilienceTier: "CRITICAL_DEFICIT" | "VULNERABLE" | "STABLE" | "ROBUST";
}

/**
 * Builds healthcare network graph topology and computes regional resilience.
 */
export class HealthcareNetworkGraph {
  nodes: Map<string, GraphNode> = new Map();
  edges: GraphEdge[] = [];

  addNode(node: GraphNode) {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: GraphEdge) {
    this.edges.push(edge);
  }

  /**
   * Calculates Degree Centrality for a given node.
   */
  getDegreeCentrality(nodeId: string): number {
    const connectedEdges = this.edges.filter(
      (e) => e.sourceId === nodeId || e.targetId === nodeId
    );
    return connectedEdges.length;
  }

  /**
   * Computes Regional Resilience based on supply buffer, donor density, and connectivity.
   */
  computeRegionalResilience(
    regionId: string,
    hospitalsCount: number,
    activeDonorsCount: number,
    inventoryUnits: number,
    expectedDailyDemand: number
  ): RegionalResilienceMetric {
    const daysOfSupply = expectedDailyDemand > 0 ? inventoryUnits / expectedDailyDemand : 5.0;
    const donorHospitalRatio = hospitalsCount > 0 ? activeDonorsCount / hospitalsCount : 10;

    // Resilience components (0 to 100 scale)
    // 1. Supply buffer component (up to 40 pts): 4+ days of supply = 40 pts
    const supplyScore = Math.min(40, (daysOfSupply / 4.0) * 40);

    // 2. Donor pool density component (up to 35 pts): 25+ donors/hospital = 35 pts
    const donorScore = Math.min(35, (donorHospitalRatio / 25.0) * 35);

    // 3. Network connectivity component (up to 25 pts)
    const connectivityScore = Math.min(25, hospitalsCount * 6.25);

    const totalResilience = Math.round(supplyScore + donorScore + connectivityScore);

    let tier: "CRITICAL_DEFICIT" | "VULNERABLE" | "STABLE" | "ROBUST" = "STABLE";
    if (totalResilience < 40) tier = "CRITICAL_DEFICIT";
    else if (totalResilience < 65) tier = "VULNERABLE";
    else if (totalResilience >= 85) tier = "ROBUST";

    return {
      regionId,
      totalHospitals: hospitalsCount,
      activeDonors: activeDonorsCount,
      totalSupplyUnits: inventoryUnits,
      averageDistanceKm: 14.2,
      resilienceScore: Math.min(100, Math.max(10, totalResilience)),
      resilienceTier: tier,
    };
  }
}
