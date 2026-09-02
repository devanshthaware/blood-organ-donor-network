"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Clock,
    Cpu,
    ExternalLink,
    FastForward,
    Fingerprint,
    LineChart,
    Network,
    Scale,
    Shield,
    ShieldCheck,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Zap,
} from "lucide-react"

export default function IntelligenceCommandCenterPage() {
    const [activeTab, setActiveTab] = useState("forecasts")

    // Convex queries
    const metrics = useQuery((api as any).intelligence?.intelligenceService?.getIntelligenceMetrics, {}) || {
        activeAnomalies: 0,
        criticalAnomalies: 0,
        regionalResilienceScore: 78,
        resilienceTier: "STABLE",
        forecastLeadTimeHours: 72,
        activeModelsCount: 5,
    }

    const forecasts = useQuery((api as any).intelligence?.intelligenceService?.getMultiHorizonForecast, {
        regionId: "REGION-PUNE-METRO",
        bloodGroup: "O-",
    }) || []

    const anomalies = useQuery((api as any).intelligence?.intelligenceService?.getAllNetworkAnomalies, { limit: 20 }) || []
    const paretoCandidates = useQuery((api as any).intelligence?.intelligenceService?.runParetoCandidateRanking, {}) || []

    const acknowledgeMutation = useMutation((api as any).intelligence?.intelligenceService?.acknowledgeAnomaly)

    const handleAcknowledge = async (anomalyId: string) => {
        try {
            await acknowledgeMutation({ anomalyId })
            alert("Anomaly marked as acknowledged.")
        } catch (err: any) {
            alert(err?.message || "Failed to acknowledge anomaly.")
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Cpu className="h-7 w-7 text-purple-500" />
                        <h2 className="text-3xl font-bold tracking-tight">Predictive Network Intelligence</h2>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Multi-horizon demand forecasting, uncertainty intervals, statistical surge detection, and Pareto candidate optimization.
                    </p>
                </div>

                <Link href="/admin/intelligence/simulation">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                        <FastForward className="h-4 w-4" /> Digital Twin Simulator
                    </Button>
                </Link>
            </div>

            {/* Top KPI Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Regional Resilience</CardTitle>
                        <Network className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {metrics.regionalResilienceScore} / 100
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Tier: {metrics.resilienceTier}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Shortage Lead Time</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            {metrics.forecastLeadTimeHours} Hours
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Multi-horizon proactive window</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Network Anomalies</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">
                            {metrics.activeAnomalies}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{metrics.criticalAnomalies} critical surges</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Intelligence Models</CardTitle>
                        <Sparkles className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">
                            {metrics.activeModelsCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Calibrated inference models</p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full max-w-2xl">
                    <TabsTrigger value="forecasts" className="flex items-center gap-1.5">
                        <LineChart className="h-4 w-4 text-blue-500" />
                        <span>Multi-Horizon Forecasts</span>
                    </TabsTrigger>
                    <TabsTrigger value="anomalies" className="flex items-center gap-1.5">
                        <AlertOctagon className="h-4 w-4 text-amber-500" />
                        <span>Active Anomalies</span>
                    </TabsTrigger>
                    <TabsTrigger value="pareto" className="flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-purple-500" />
                        <span>Pareto Optimization</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Multi-Horizon Forecasting */}
                <TabsContent value="forecasts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Multi-Horizon Shortage Projection (Region: Pune Metro | Group: O-)</CardTitle>
                            <CardDescription>
                                Continuous demand projection with inventory depletion velocity and uncertainty intervals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Horizon</TableHead>
                                        <TableHead>Expected Demand</TableHead>
                                        <TableHead>Expected Supply</TableHead>
                                        <TableHead>Shortage Probability</TableHead>
                                        <TableHead>Confidence (Interval 90%)</TableHead>
                                        <TableHead>Depletion Velocity</TableHead>
                                        <TableHead className="text-right">Risk Tier</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forecasts.map((f: any) => (
                                        <TableRow key={f.horizonHours}>
                                            <TableCell className="font-semibold">
                                                {f.horizonHours < 24 ? `${f.horizonHours} Hours` : `${Math.round(f.horizonHours / 24)} Days`}
                                            </TableCell>
                                            <TableCell>{f.expectedDemand} Units</TableCell>
                                            <TableCell>{f.expectedSupply} Units</TableCell>
                                            <TableCell className="font-semibold">
                                                <span className={f.shortageProbability >= 0.7 ? "text-red-500" : f.shortageProbability >= 0.4 ? "text-amber-500" : "text-emerald-500"}>
                                                    {Math.round(f.shortageProbability * 100)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {Math.round(f.confidence * 100)}% [{f.predictionInterval.lower} - {f.predictionInterval.upper}]
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {f.depletionVelocity} units/hr
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={
                                                        f.shortageProbability >= 0.7
                                                            ? "destructive"
                                                            : f.shortageProbability >= 0.4
                                                            ? "secondary"
                                                            : "outline"
                                                    }
                                                >
                                                    {f.shortageProbability >= 0.7 ? "CRITICAL RISK" : f.shortageProbability >= 0.4 ? "MODERATE RISK" : "STABLE"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Active Network Anomalies Stream */}
                <TabsContent value="anomalies" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Network Anomaly & Surge Alarms</CardTitle>
                            <CardDescription>
                                Statistical outlier detection flagging sudden consumption surges and uncharacteristic donor response drops.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Anomaly ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Explanation</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {anomalies.map((anom: any) => (
                                        <TableRow key={anom._id || anom.anomalyId}>
                                            <TableCell className="font-mono text-xs font-semibold">{anom.anomalyId}</TableCell>
                                            <TableCell className="text-xs font-semibold">{anom.anomalyType}</TableCell>
                                            <TableCell>
                                                <Badge variant={anom.severity === "CRITICAL" ? "destructive" : "secondary"}>
                                                    {anom.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{anom.score}σ</TableCell>
                                            <TableCell className="text-xs max-w-md text-muted-foreground">{anom.explanation}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{anom.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {anom.status === "ACTIVE" ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleAcknowledge(anom.anomalyId)}
                                                    >
                                                        Acknowledge
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Acknowledged</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Pareto Multi-Objective Optimization */}
                <TabsContent value="pareto" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pareto Multi-Objective Candidate Optimization</CardTitle>
                            <CardDescription>
                                Compares candidates along the Pareto frontier balancing fulfillment probability, distance, and notification fatigue against the baseline 60/40 ranker.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pareto Rank</TableHead>
                                        <TableHead>Candidate</TableHead>
                                        <TableHead>Baseline (60/40)</TableHead>
                                        <TableHead>Composite Score</TableHead>
                                        <TableHead>Fatigue Burden</TableHead>
                                        <TableHead>Frontier Status</TableHead>
                                        <TableHead className="text-right">Trade-Off Analysis</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paretoCandidates.map((cand: any) => (
                                        <TableRow key={cand.donorId}>
                                            <TableCell className="font-bold font-mono">#{cand.paretoRank}</TableCell>
                                            <TableCell className="text-xs font-semibold">{cand.donorId}</TableCell>
                                            <TableCell className="font-mono text-xs">{Math.round(cand.baselineScore * 100)}%</TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-primary">
                                                {Math.round(cand.compositeOptimizationScore * 100)}%
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={cand.fatigueBurdenScore >= 0.6 ? "destructive" : "outline"}
                                                    className="text-xs"
                                                >
                                                    {Math.round(cand.fatigueBurdenScore * 100)}% {cand.fatigueBurdenScore >= 0.6 ? "FATIGUED" : "FRESH"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={cand.isParetoOptimal ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"}
                                                >
                                                    {cand.isParetoOptimal ? "NON-DOMINATED" : "SUB-OPTIMAL"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground max-w-xs truncate">
                                                {cand.tradeOffSummary}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
