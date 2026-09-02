export type InsightSource = "llm" | "fallback";

export interface LLMInput {
    role: "donor" | "hospital" | "admin";
    screen:
    | "donor_dashboard"
    | "hospital_dashboard"
    | "request_detail"
    | "reservation"
    | "alert"
    | "admin_monitor";

    event:
    | "donor_match"
    | "request_created"
    | "reservation_confirmed"
    | "emergency_alert";

    data: Record<string, any>;
}

export interface AIInsight {
    source: InsightSource;
    title: string;
    summary: string;
    bullets: string[];
    confidence: "LOW" | "MEDIUM" | "HIGH";
}
