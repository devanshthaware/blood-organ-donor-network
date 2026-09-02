"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    Cpu,
    FastForward,
    Layers,
    Play,
    RefreshCw,
    Send,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react"

export default function SimulationStudioPage() {
    const [scenario, setScenario] = useState<"DONOR_ACTIVATION" | "INTER_HOSPITAL_TRANSFER" | "DEMAND_SURGE">("DONOR_ACTIVATION")
    const [donorCount, setDonorCount] = useState<number>(25)
    const [transferUnits, setTransferUnits] = useState<number>(12)
    const [surgeMultiplier, setSurgeMultiplier] = useState<number>(2.0)
    const [isSimulating, setIsSimulating] = useState(false)
    const [simResult, setSimResult] = useState<any>(null)

    const simulateMutation = useMutation((api as any).intelligence?.intelligenceService?.executeWhatIfSimulation)

    const handleRunSimulation = async () => {
        setIsSimulating(true)
        try {
            const res = await simulateMutation({
                scenarioType: scenario,
                activatedDonorsCount: scenario === "DONOR_ACTIVATION" ? donorCount : undefined,
                transferredUnitsCount: scenario === "INTER_HOSPITAL_TRANSFER" ? transferUnits : undefined,
                demandSurgeMultiplier: scenario === "DEMAND_SURGE" ? surgeMultiplier : undefined,
            })
            setSimResult(res)
        } catch (err: any) {
            alert(err?.message || "Simulation execution failed.")
        } finally {
            setIsSimulating(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/intelligence"
                        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" /> Back to Intelligence Command Center
                    </Link>
                    <div className="flex items-center gap-2">
                        <FastForward className="h-7 w-7 text-purple-500" />
                        <h2 className="text-3xl font-bold tracking-tight">Digital Twin Simulation Studio</h2>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Simulate operational interventions (donor activation, inter-hospital unit transfers, emergency shocks) in a synthetic sandbox.
                    </p>
                </div>
            </div>

            {/* Scenario Builder Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Simulation Scenario</CardTitle>
                    <CardDescription>
                        Configure virtual intervention parameters to project network impact before taking live clinical actions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-3">
                        <div
                            onClick={() => setScenario("DONOR_ACTIVATION")}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                scenario === "DONOR_ACTIVATION"
                                    ? "border-purple-500 bg-purple-500/10"
                                    : "border-border hover:border-muted-foreground/40"
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm">
                                <Users className="h-4 w-4 text-purple-500" />
                                <span>1. Targeted Mobilization</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Simulate notifying N eligible donors with predicted response rates.
                            </p>
                        </div>

                        <div
                            onClick={() => setScenario("INTER_HOSPITAL_TRANSFER")}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                scenario === "INTER_HOSPITAL_TRANSFER"
                                    ? "border-purple-500 bg-purple-500/10"
                                    : "border-border hover:border-muted-foreground/40"
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <span>2. Hospital Transfer</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Rebalance blood units from neighboring facility with surplus.
                            </p>
                        </div>

                        <div
                            onClick={() => setScenario("DEMAND_SURGE")}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                scenario === "DEMAND_SURGE"
                                    ? "border-purple-500 bg-purple-500/10"
                                    : "border-border hover:border-muted-foreground/40"
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <span>3. Emergency Shock</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Stress test system resilience against a sudden mass trauma surge.
                            </p>
                        </div>
                    </div>

                    {/* Parameter Controls */}
                    <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                        {scenario === "DONOR_ACTIVATION" && (
                            <div className="space-y-2 max-w-sm">
                                <label className="text-xs font-medium">Eligible Donors to Activate (Virtual Outreach):</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        min={5}
                                        max={100}
                                        value={donorCount}
                                        onChange={(e) => setDonorCount(Number(e.target.value))}
                                    />
                                    <span className="text-xs text-muted-foreground">Donors</span>
                                </div>
                            </div>
                        )}

                        {scenario === "INTER_HOSPITAL_TRANSFER" && (
                            <div className="space-y-2 max-w-sm">
                                <label className="text-xs font-medium">Units to Rebalance from Facility B:</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={transferUnits}
                                        onChange={(e) => setTransferUnits(Number(e.target.value))}
                                    />
                                    <span className="text-xs text-muted-foreground">Units</span>
                                </div>
                            </div>
                        )}

                        {scenario === "DEMAND_SURGE" && (
                            <div className="space-y-2 max-w-sm">
                                <label className="text-xs font-medium">Trauma Demand Surge Multiplier:</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        step={0.5}
                                        min={1.5}
                                        max={5.0}
                                        value={surgeMultiplier}
                                        onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                                    />
                                    <span className="text-xs text-muted-foreground">x Baseline</span>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleRunSimulation}
                            disabled={isSimulating}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
                        >
                            <Play className="h-4 w-4" /> Run Simulation
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Simulation Results Display */}
            {simResult && (
                <Card className="border-purple-500/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                                <span>Simulation Projection Results</span>
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-xs">
                                ID: {simResult.simulationId}
                            </Badge>
                        </div>
                        <CardDescription>
                            Comparative network forecast before and after the simulated intervention.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-4 gap-4 text-center">
                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Baseline Runway:</span>
                                <div className="text-xl font-bold font-mono mt-1">
                                    {simResult.baselineShortageHours} Hours
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Projected Runway:</span>
                                <div className="text-xl font-bold font-mono text-purple-500 mt-1">
                                    {simResult.projectedShortageHours} Hours
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Net Units Delta:</span>
                                <div className={`text-xl font-bold font-mono mt-1 ${simResult.netUnitsImpact >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {simResult.netUnitsImpact >= 0 ? `+${simResult.netUnitsImpact}` : simResult.netUnitsImpact} Units
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Resilience Delta:</span>
                                <div className={`text-xl font-bold font-mono mt-1 ${simResult.resilienceScoreDelta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {simResult.resilienceScoreDelta >= 0 ? `+${simResult.resilienceScoreDelta}` : simResult.resilienceScoreDelta} pts
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border bg-purple-500/10 border-purple-500/20 text-xs">
                            <span className="font-semibold text-purple-400">Digital Twin Recommendation Verdict:</span>
                            <p className="mt-1 text-foreground leading-relaxed">
                                {simResult.recommendationVerdict}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
