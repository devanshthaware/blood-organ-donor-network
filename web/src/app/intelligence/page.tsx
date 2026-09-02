"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Cpu,
    GitBranch,
    LineChart,
    Network,
    Scale,
    Sparkles,
    TrendingUp,
    Zap,
} from "lucide-react"

export default function UnifiedIntelligencePage() {
    return (
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Cpu className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-extrabold tracking-tight">VeinLink Healthcare Intelligence Studio</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Unified machine learning, graph-based network modeling, multi-objective Pareto optimization, and digital twin simulations.
                    </p>
                </div>

                <Link href="/admin/intelligence/simulation">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 text-xs">
                        <Zap className="h-4 w-4" /> Launch Digital Twin Studio
                    </Button>
                </Link>
            </div>

            {/* Core Intelligence Pillars Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* 1. Multi-Horizon Demand Forecasting */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-blue-500" />
                            <CardTitle className="text-base font-bold">Multi-Horizon Demand Forecaster v2</CardTitle>
                        </div>
                        <CardDescription>
                            Projects consumption across 5 distinct horizons (6h, 24h, 3d, 7d, 14d) with 90% confidence prediction intervals.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-foreground">72-Hour Weekend Stockout Risk:</span>
                                <Badge variant="destructive">82% Probability</Badge>
                            </div>
                            <div className="flex justify-between text-muted-foreground text-[11px]">
                                <span>Expected Demand: 18.2 Units</span>
                                <span>90% Interval: [12.4 - 24.1]</span>
                            </div>
                        </div>

                        <Link href="/admin/intelligence">
                            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                Open Forecast Monitor <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 2. Network Graph Topology & Resilience */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Network className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-base font-bold">Topological Network Graph</CardTitle>
                        </div>
                        <CardDescription>
                            Degree centrality, supply interlinks, and regional vulnerability assessments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 flex items-center justify-between">
                            <div>
                                <span className="text-muted-foreground">Regional Resilience Index:</span>
                                <div className="text-2xl font-bold font-mono text-emerald-600">82 / 100</div>
                            </div>
                            <Badge className="bg-emerald-600 text-white text-[10px]">ROBUST STATUS</Badge>
                        </div>

                        <Link href="/admin/intelligence">
                            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                View Graph Topology <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 3. Pareto Multi-Objective Optimization */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-purple-500" />
                            <CardTitle className="text-base font-bold">Pareto Multi-Objective Optimizer</CardTitle>
                        </div>
                        <CardDescription>
                            Solves trade-offs across response time, clinical reliability, and donor notification fatigue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                            <div className="font-semibold text-foreground">Anti-Fatigue Mitigation:</div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                                Balances urgent candidate mobilization against historical donor contact frequency (-72% alert fatigue reduction).
                            </p>
                        </div>

                        <Link href="/organ/review">
                            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                Inspect Pareto Trade-Offs <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 4. Digital Twin Simulation Studio */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-base font-bold">Digital Twin Simulation Studio</CardTitle>
                        </div>
                        <CardDescription>
                            Run synthetic what-if operational stress tests without impacting active hospital clinical workflows.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 space-y-1.5">
                            <div className="font-semibold text-foreground">Supported Scenarios:</div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                                Mass trauma surge (+30% demand), donor activation campaign, and inter-hospital emergency inventory transfers.
                            </p>
                        </div>

                        <Link href="/admin/intelligence/simulation">
                            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                Launch Simulation Studio <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
