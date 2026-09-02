"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAIEvents } from "@/hooks/useAIEvents"

export default function AdminAIMonitorPage() {
    const [showDetails, setShowDetails] = useState(false)
    const { events, loading, error } = useAIEvents(100)

    // Format AI events for display
    const formatAIEvent = (event: typeof events[0]) => {
        const time = event.createdAt instanceof Date
            ? event.createdAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : typeof event.createdAt === 'object' && 'toDate' in event.createdAt
                ? event.createdAt.toDate().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let message = "";
        let severity: "Info" | "Success" | "Medium" | "Error" = event.status === "FAILED" ? "Error" : "Info";

        if (event.modelType === "demand_forecasting") {
            const predictedDemand = (event.outputSummary as any)?.predicted_demand || 0;
            const region = (event.inputSummary as any)?.region || "Unknown";
            message = `Demand forecast: ${(predictedDemand * 100).toFixed(1)}% for region ${region}`;
            if (event.status === "SUCCESS") {
                severity = predictedDemand > 0.7 ? "Medium" : "Info";
            }
        } else if (event.modelType === "donor_availability") {
            const availability = (event.outputSummary as any)?.availability_probability || 0;
            message = `Donor availability: ${(availability * 100).toFixed(1)}%`;
            if (event.status === "SUCCESS") {
                severity = availability > 0.8 ? "Success" : availability > 0.5 ? "Info" : "Medium";
            }
        } else if (event.modelType === "donor_reliability") {
            const reliability = (event.outputSummary as any)?.reliability_score || 0;
            message = `Donor reliability: ${(reliability * 100).toFixed(1)}%`;
            if (event.status === "SUCCESS") {
                severity = reliability > 0.8 ? "Success" : reliability > 0.5 ? "Info" : "Medium";
            }
        } else {
            message = event.status === "FAILED"
                ? `${event.modelName || event.modelType} inference failed`
                : `${event.modelName || event.modelType} inference completed`;
        }

        // Build technical details
        const technicalDetails: Record<string, unknown> = {
            modelName: event.modelName,
            modelType: event.modelType,
            modelVersion: event.modelVersion || "1.0.0",
            triggerSource: event.triggerSource || "system",
            status: event.status,
        };

        if (event.executionTimeMs) {
            technicalDetails.executionTimeMs = event.executionTimeMs;
        }

        if (event.confidence !== undefined) {
            technicalDetails.confidence = event.confidence;
        }

        if (event.requestId) {
            technicalDetails.requestId = event.requestId;
        }

        if (event.reservationId) {
            technicalDetails.reservationId = event.reservationId;
        }

        if (event.errorMessage) {
            technicalDetails.errorMessage = event.errorMessage;
        }

        technicalDetails.input = event.inputSummary;
        technicalDetails.output = event.outputSummary;

        return {
            id: event.id,
            time,
            module: (event.modelName || event.modelType).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            message,
            severity,
            details: JSON.stringify(technicalDetails, null, 2),
        };
    };

    const aiLogs = events.map(formatAIEvent);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">AI System Monitor</h2>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="show-details"
                        checked={showDetails}
                        onCheckedChange={setShowDetails}
                    />
                    <Label htmlFor="show-details">Show Technical Details</Label>
                </div>
            </div>
            <div className="rounded-md border p-4 bg-black font-mono text-sm text-green-500">
                <h3 className="mb-4 text-lg font-bold text-white">Live Intelligence Stream</h3>
                {loading && (
                    <div className="p-4 text-center text-neutral-400">
                        Loading AI events...
                    </div>
                )}
                {error && (
                    <div className="p-4 text-center text-red-500">
                        Error loading AI events: {error.message}
                    </div>
                )}
                {!loading && !error && aiLogs.length === 0 && (
                    <div className="p-4 text-center text-neutral-400">
                        No AI events yet. ML predictions will appear here as they are generated.
                    </div>
                )}
                {!loading && !error && aiLogs.length > 0 && (
                    <ScrollArea className="h-[500px] w-full rounded-md border border-neutral-800 p-4">
                        {aiLogs.map((log) => (
                            <div key={log.id} className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-neutral-500">[{log.time}]</span>
                                    <span className="text-blue-500 font-bold">{log.module}</span>
                                    <Badge variant="outline" className={`
                            ${log.severity === "Error" ? "text-red-500 border-red-500" : ""}
                            ${log.severity === "Medium" ? "text-yellow-500 border-yellow-500" : ""}
                            ${log.severity === "Success" ? "text-green-500 border-green-500" : ""}
                            ${log.severity === "Info" ? "text-blue-400 border-blue-400" : ""}
                            text-xs
                        `}>
                                        {log.severity}
                                    </Badge>
                                </div>
                                <div className="pl-24 text-neutral-300">
                                    {log.message}
                                </div>
                                {showDetails && (
                                    <div className="pl-24 mt-2 text-xs text-neutral-500">
                                        <pre className="p-2 border border-neutral-800 bg-neutral-900 rounded">
                                            {log.details}
                                        </pre>
                                    </div>
                                )}
                                <Separator className="my-2 bg-neutral-800" />
                            </div>
                        ))}
                        <div className="animate-pulse text-green-500">_</div>
                    </ScrollArea>
                )}
            </div>
        </div>
    )
}
