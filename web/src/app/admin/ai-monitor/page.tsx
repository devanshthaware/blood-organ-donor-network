"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAIEvents } from "@/hooks/useAIEvents"
import { useAction } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Activity, Brain, Cpu, Play, Radio, Sparkles, Zap } from "lucide-react"

export default function AdminAIMonitorPage() {
    const [showDetails, setShowDetails] = useState(false)
    const [isTriggering, setIsTriggering] = useState(false)
    const { events, loading, error } = useAIEvents(100)
    const triggerLiveMLInference = useAction(api.aiEvents.triggerLiveMLInference)

    const handleRunMLTest = async (modelType: "demand_forecasting" | "donor_reliability" | "donor_availability" | "organ_compatibility") => {
        setIsTriggering(true)
        try {
            await triggerLiveMLInference({ modelType })
        } catch (err: any) {
            console.error("Failed to run live ML inference:", err)
        } finally {
            setIsTriggering(false)
        }
    }

    // Format AI events for display
    const formatAIEvent = (event: typeof events[0]) => {
        const time = event.createdAt instanceof Date
            ? event.createdAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : new Date(event.createdAt as any).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let message = "";
        let severity: "Info" | "Success" | "Medium" | "Error" = event.status === "FAILED" ? "Error" : "Info";

        if (event.modelType === "demand_forecasting") {
            const predictedDemand = (event.outputSummary as any)?.predicted_demand || 0;
            const region = (event.inputSummary as any)?.region || "West Zone";
            message = `Demand forecast: ${(predictedDemand * 100).toFixed(1)}% predicted surge for ${region}`;
            if (event.status === "SUCCESS") {
                severity = predictedDemand > 0.7 ? "Medium" : "Info";
            }
        } else if (event.modelType === "donor_availability") {
            const availability = (event.outputSummary as any)?.availability_probability || 0;
            message = `Donor availability probability: ${(availability * 100).toFixed(1)}% (Optimal window: ${(event.outputSummary as any)?.optimal_contact_hour || "Morning"})`;
            if (event.status === "SUCCESS") {
                severity = availability > 0.8 ? "Success" : availability > 0.5 ? "Info" : "Medium";
            }
        } else if (event.modelType === "donor_reliability") {
            const reliability = (event.outputSummary as any)?.reliability_score || 0;
            message = `Donor clinical attendance reliability: ${(reliability * 100).toFixed(1)}%`;
            if (event.status === "SUCCESS") {
                severity = reliability > 0.8 ? "Success" : reliability > 0.5 ? "Info" : "Medium";
            }
        } else if (event.modelType === "organ_compatibility") {
            const score = (event.outputSummary as any)?.compatibility_score || 0;
            message = `Organ compatibility match score: ${(score * 100).toFixed(1)}% (HLA Match: ${(event.outputSummary as any)?.hla_match_ratio || "5/6"})`;
            severity = "Success";
        } else {
            message = event.status === "FAILED"
                ? `${event.modelName || event.modelType} inference failed`
                : `${event.modelName || event.modelType} inference completed`;
        }

        // Build technical details
        const technicalDetails: Record<string, unknown> = {
            modelName: event.modelName,
            modelType: event.modelType,
            modelVersion: event.modelVersion || "2.1.0-fastapi",
            triggerSource: event.triggerSource || "FastAPI ML Backend (:8000)",
            status: event.status,
        };

        if (event.executionTimeMs) {
            technicalDetails.executionTimeMs = `${event.executionTimeMs}ms`;
        }

        if (event.confidence !== undefined) {
            technicalDetails.confidence = event.confidence;
        }

        if (event.requestId) {
            technicalDetails.requestId = event.requestId;
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
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            AI System Monitor
                        </h1>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> Real-time Convex Sync
                        </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Live telemetry stream of FastAPI ML inference events, Pareto rankings, demand forecasts, and OCR verifications.
                    </p>
                </div>

                <div className="flex items-center space-x-3 bg-card border border-border/60 px-3 py-1.5 rounded-xl">
                    <Switch
                        id="show-details"
                        checked={showDetails}
                        onCheckedChange={setShowDetails}
                    />
                    <Label htmlFor="show-details" className="text-xs font-semibold cursor-pointer">
                        Technical JSON Payload
                    </Label>
                </div>
            </div>

            {/* Test Trigger Control Bar */}
            <div className="p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-card to-card flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-purple-400" /> Run Live ML Inference (FastAPI Server on :8000)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        Click any model to execute live inference. Results sync automatically to the telemetry stream below via Convex WebSockets.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 bg-background/80 hover:bg-purple-500/10 border-purple-500/30 text-purple-300 font-semibold"
                        onClick={() => handleRunMLTest("demand_forecasting")}
                        disabled={isTriggering}
                    >
                        <Zap className="w-3 h-3 mr-1 text-purple-400" /> Demand Forecast
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 bg-background/80 hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                        onClick={() => handleRunMLTest("donor_reliability")}
                        disabled={isTriggering}
                    >
                        <Activity className="w-3 h-3 mr-1 text-emerald-400" /> Donor Reliability
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 bg-background/80 hover:bg-blue-500/10 border-blue-500/30 text-blue-300 font-semibold"
                        onClick={() => handleRunMLTest("organ_compatibility")}
                        disabled={isTriggering}
                    >
                        <Sparkles className="w-3 h-3 mr-1 text-blue-400" /> Organ Match
                    </Button>
                </div>
            </div>

            {/* Terminal Live Stream */}
            <div className="rounded-2xl border border-border/60 p-5 bg-zinc-950 font-mono text-sm shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        Live Intelligence Stream
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                        {aiLogs.length} events captured
                    </span>
                </div>

                {loading && (
                    <div className="p-8 text-center text-xs text-zinc-500">
                        Connecting to real-time Convex telemetry stream...
                    </div>
                )}
                {error && (
                    <div className="p-8 text-center text-xs text-red-400">
                        Error loading AI events: {error.message}
                    </div>
                )}
                {!loading && !error && aiLogs.length === 0 && (
                    <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
                        <Cpu className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p>No AI events recorded yet. Click one of the test buttons above or trigger ML actions in the app to see predictions stream live.</p>
                    </div>
                )}
                {!loading && !error && aiLogs.length > 0 && (
                    <ScrollArea className="h-[520px] w-full pr-4">
                        <div className="space-y-4">
                            {aiLogs.map((log) => (
                                <div key={log.id} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 transition-all hover:border-zinc-700">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <span className="text-zinc-500 text-xs">[{log.time}]</span>
                                        <span className="text-purple-400 font-bold text-xs">{log.module}</span>
                                        <Badge variant="outline" className={`
                                            ${log.severity === "Error" ? "text-red-400 border-red-500/40 bg-red-500/10" : ""}
                                            ${log.severity === "Medium" ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" : ""}
                                            ${log.severity === "Success" ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" : ""}
                                            ${log.severity === "Info" ? "text-blue-400 border-blue-500/40 bg-blue-500/10" : ""}
                                            text-[10px] font-mono px-2 py-0.5
                                        `}>
                                            {log.severity}
                                        </Badge>
                                    </div>
                                    <div className="text-zinc-200 text-xs pl-2 border-l-2 border-zinc-700 font-sans">
                                        {log.message}
                                    </div>
                                    {showDetails && (
                                        <div className="mt-2 text-xs text-zinc-400">
                                            <pre className="p-2.5 border border-zinc-800 bg-zinc-950 rounded-lg text-[11px] overflow-x-auto text-emerald-400/90 font-mono">
                                                {log.details}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="animate-pulse text-emerald-500 mt-2 font-mono text-xs">_</div>
                    </ScrollArea>
                )}
            </div>
        </div>
    )
}
