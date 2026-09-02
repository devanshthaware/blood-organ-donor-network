import { AIInsight } from "../../../contracts/llm_contract";

export function fallbackInsight(data: any): AIInsight {
    const bullets: string[] = [];

    if (data.blood_group) {
        bullets.push(`Compatible blood group: ${data.blood_group}`);
    }

    if (data.distance_km !== undefined) {
        bullets.push(`Donor distance is ${Number(data.distance_km).toFixed(1)} km`);
    }

    if (data.reliability) {
        bullets.push(`Historical reliability rated ${data.reliability}`);
    }

    if (data.urgency === "CRITICAL" || data.urgency === "HIGH") {
        bullets.push("Request marked as critical priority");
    }

    // Default bullets if none added
    if (bullets.length === 0) {
        bullets.push("Donor meets eligibility criteria");
        bullets.push("System-matched based on requirements");
    }

    return {
        source: "fallback",
        title: "Automated Decision Summary",
        summary:
            "This decision was generated using system rules due to temporary AI unavailability.",
        bullets,
        confidence: "MEDIUM"
    };
}
