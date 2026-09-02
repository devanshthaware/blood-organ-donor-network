"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    Award,
    CheckCircle2,
    Clock,
    Cpu,
    ExternalLink,
    Eye,
    FastForward,
    Fingerprint,
    HeartHandshake,
    LineChart,
    Lock,
    Network,
    Play,
    RefreshCw,
    Scale,
    Shield,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react"

export default function HackathonDemoPortal() {
    const [currentStep, setCurrentStep] = useState(0)
    const [selectedScenario, setSelectedScenario] = useState("SCENARIO_3_TRAUMA_SURGE")

    const demoSteps = [
        {
            time: "00:00",
            title: "Emergency Requisition Created",
            icon: AlertTriangle,
            tag: "Convex Core",
            color: "text-amber-500",
            summary: "Hospital records critical O- blood emergency requisition with correlation ID VL-2026-9812.",
        },
        {
            time: "00:30",
            title: "Surge Anomaly & Velocity Detected",
            icon: Zap,
            tag: "Anomaly Engine",
            color: "text-red-500",
            summary: "Consumption velocity spikes to 3.8 units/hr (+2.85σ surge); triggers proactive escalation.",
        },
        {
            time: "01:00",
            title: "Multi-Horizon Forecast Generated",
            icon: LineChart,
            tag: "Forecasting v2",
            color: "text-blue-500",
            summary: "72h shortage probability evaluated at 82% with 90% confidence prediction interval [12 - 24].",
        },
        {
            time: "01:30",
            title: "Graph Identifies Network Resources",
            icon: Network,
            tag: "Network Graph",
            color: "text-emerald-500",
            summary: "Topological graph locates surplus compatible O- inventory at Ruby Hall Clinic (14km away).",
        },
        {
            time: "02:00",
            title: "Pareto Multi-Objective Ranking",
            icon: Scale,
            tag: "Pareto Optimizer",
            color: "text-purple-500",
            summary: "Evaluates candidates balancing arrival speed, reliability, and donor fatigue burden.",
        },
        {
            time: "02:30",
            title: "XAI Transparent Explanation",
            icon: Sparkles,
            tag: "Decision Support",
            color: "text-purple-400",
            summary: "Coordinators inspect structured trade-offs: Candidate A has faster ETA; Candidate B has lower weekly fatigue.",
        },
        {
            time: "03:00",
            title: "n8n Targeted Outreach Dispatched",
            icon: Activity,
            tag: "n8n Automation",
            color: "text-amber-500",
            summary: "HMAC-signed webhook triggers targeted mobile outreach to top 3 non-fatigued eligible donors.",
        },
        {
            time: "03:30",
            title: "Donor Response & ETA Arrival",
            icon: Users,
            tag: "Dynamic ETA",
            color: "text-emerald-500",
            summary: "Donor accepts within 8 mins. Segmented arrival ETA projected at 26 minutes.",
        },
        {
            time: "04:00",
            title: "Physical Label CV Verification",
            icon: Eye,
            tag: "Computer Vision",
            color: "text-blue-500",
            summary: "Camera OCR verifies physical blood bag barcode BLD-9812 matching digital requisition record.",
        },
        {
            time: "04:30",
            title: "Sequential Hash Chaining",
            icon: Lock,
            tag: "Canonicalizer",
            color: "text-indigo-500",
            summary: "Audit record canonicalized and linked into SHA-256 tamper-evident hash chain.",
        },
        {
            time: "05:00",
            title: "Blockchain Proof Verified",
            icon: ShieldCheck,
            tag: "Trust Layer",
            color: "text-emerald-500",
            summary: "Merkle root anchored on-ledger (Tx: 0x4a9b... confirmed at block #1849201 with zero PHI).",
        },
    ]

    const scenarios = [
        { id: "SCENARIO_1_NORMAL", title: "1. Routine Blood Requisition", category: "Standard", desc: "Routine blood reservation with standard 60/40 candidate matching." },
        { id: "SCENARIO_2_SHORTAGE", title: "2. Proactive 72h Shortage", category: "Predictive", desc: "Multi-horizon forecaster detects upcoming weekend stockout 3 days early." },
        { id: "SCENARIO_3_TRAUMA_SURGE", title: "3. Trauma Demand Shock", category: "Emergency", desc: "Mass casualty trauma event triggers statistical surge anomaly and n8n escalation." },
        { id: "SCENARIO_4_ORGAN_ALLOCATION", title: "4. Organ Allocation Review", category: "Clinical", desc: "Heart allocation with cold ischemia clock, Pareto ranker, and mandatory human approval." },
        { id: "SCENARIO_5_CV_DISCREPANCY", title: "5. Physical Label Mismatch", category: "Computer Vision", desc: "Physical blood bag label blood group mismatch flagged as CRITICAL severity." },
        { id: "SCENARIO_6_LOGISTICS_DELAY", title: "6. Cold Ischemia Transit Delay", category: "Logistics", desc: "Road transit delay recalculates organ viability buffer and alerts transplant surgical team." },
        { id: "SCENARIO_7_LOW_CONFIDENCE", title: "7. Low AI Confidence Fallback", category: "Safety", desc: "Model confidence drops below 0.65; system triggers rule-based historical fallback." },
        { id: "SCENARIO_8_SECURITY_ATTACK", title: "8. Zero-Trust Access Violation", category: "Security", desc: "Cross-facility requisition query blocked, audited, and account suspended." },
    ]

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Award className="h-7 w-7 text-purple-500" />
                        <h2 className="text-3xl font-bold tracking-tight">Hackathon Demonstration Studio</h2>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Step through the 5-Minute Integrated Lifecycle and inspect 8 pre-seeded synthetic scenarios.
                    </p>
                </div>

                <Badge className="bg-purple-600 text-white px-3 py-1 text-xs">
                    100% SYNTHETIC ZERO-PHI DATA
                </Badge>
            </div>

            {/* Top "WOW" Dashboard for Judges */}
            <Card className="border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-background to-background">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2 text-purple-600">
                            <Sparkles className="h-5 w-5" />
                            VeinLink Live Network Status (Judges' Command View)
                        </CardTitle>
                        <Badge variant="outline" className="font-mono text-xs">
                            Region: Pune Metropolitan Area
                        </Badge>
                    </div>
                    <CardDescription>
                        Real-time synthesis of supply risk, predictive horizons, dynamic matching, and on-ledger trust.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 rounded-lg border bg-background">
                            <span className="text-xs text-muted-foreground">Supply Shortage Risk:</span>
                            <div className="text-2xl font-bold font-mono text-red-500 mt-0.5">HIGH (82%)</div>
                            <span className="text-[10px] text-muted-foreground">O- 72h lead time</span>
                        </div>

                        <div className="p-3 rounded-lg border bg-background">
                            <span className="text-xs text-muted-foreground">Active Requisitions:</span>
                            <div className="text-2xl font-bold font-mono text-foreground mt-0.5">17 Active</div>
                            <span className="text-[10px] text-muted-foreground">4 emergency traumas</span>
                        </div>

                        <div className="p-3 rounded-lg border bg-background">
                            <span className="text-xs text-muted-foreground">Eligible Donor Pool:</span>
                            <div className="text-2xl font-bold font-mono text-emerald-500 mt-0.5">428 Donors</div>
                            <span className="text-[10px] text-muted-foreground">Zero notification fatigue</span>
                        </div>

                        <div className="p-3 rounded-lg border bg-background">
                            <span className="text-xs text-muted-foreground">Blockchain Anchor:</span>
                            <div className="text-2xl font-bold font-mono text-purple-500 mt-0.5">Block #1849201</div>
                            <span className="text-[10px] text-muted-foreground">Verified Merkle root</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 5-Minute Hackathon Demo Runner */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Play className="h-5 w-5 text-emerald-500" />
                                5-Minute Hackathon Demo Progression
                            </CardTitle>
                            <CardDescription>
                                Click each milestone or advance sequentially to present the complete healthcare intelligence story.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                                disabled={currentStep === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => setCurrentStep((prev) => Math.min(demoSteps.length - 1, prev + 1))}
                                disabled={currentStep === demoSteps.length - 1}
                            >
                                Next Step ({currentStep + 1}/{demoSteps.length})
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Active Step Highlight Card */}
                    {(() => {
                        const active = demoSteps[currentStep]
                        const Icon = active.icon
                        return (
                            <div className="p-5 rounded-lg border bg-purple-500/5 border-purple-500/30 flex items-start gap-4">
                                <div className="p-3 rounded-full bg-purple-500/20 text-purple-500 mt-0.5">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded">
                                                {active.time}
                                            </span>
                                            <h3 className="font-bold text-base">{active.title}</h3>
                                        </div>
                                        <Badge variant="outline">{active.tag}</Badge>
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed pt-1">{active.summary}</p>
                                </div>
                            </div>
                        )
                    })()}

                    {/* Timeline Strip */}
                    <div className="grid grid-cols-11 gap-1.5 pt-2">
                        {demoSteps.map((step, idx) => (
                            <button
                                key={step.time}
                                onClick={() => setCurrentStep(idx)}
                                className={`p-2 rounded text-center border text-[11px] transition-all ${
                                    idx === currentStep
                                        ? "border-purple-500 bg-purple-500/20 font-bold"
                                        : "border-border hover:bg-muted/40 text-muted-foreground"
                                }`}
                            >
                                <div className="font-mono">{step.time}</div>
                                <div className="truncate text-[10px] mt-0.5">{step.tag}</div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 8 Pre-Seeded Synthetic Scenarios */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        8 Pre-Seeded Synthetic Scenarios (Zero-PHI Testing)
                    </CardTitle>
                    <CardDescription>
                        Trigger pre-configured healthcare events to demonstrate specific platform capabilities to judges.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-3">
                        {scenarios.map((sc) => (
                            <div
                                key={sc.id}
                                onClick={() => setSelectedScenario(sc.id)}
                                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                                    selectedScenario === sc.id
                                        ? "border-purple-500 bg-purple-500/10"
                                        : "border-border hover:border-muted-foreground/40"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs text-foreground">{sc.title}</span>
                                    <Badge variant="outline" className="text-[10px]">
                                        {sc.category}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sc.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 rounded-lg border bg-muted/20 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            Active Scenario: <strong className="text-foreground">{selectedScenario}</strong>
                        </span>
                        <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
                            onClick={() => alert(`Scenario ${selectedScenario} executed successfully in synthetic sandbox.`)}
                        >
                            <Play className="h-3.5 w-3.5" /> Execute Scenario
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
