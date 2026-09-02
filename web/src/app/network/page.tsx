"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Droplet,
    ExternalLink,
    Eye,
    FastForward,
    Fingerprint,
    Heart,
    HeartHandshake,
    LineChart,
    MapPin,
    Network,
    Plane,
    Scale,
    Shield,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Truck,
    Users,
    Zap,
} from "lucide-react"

export default function NetworkCommandCenter() {
    const [filterDomain, setFilterDomain] = useState<"ALL" | "BLOOD" | "ORGAN">("ALL")

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Top Navigation & Status Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Network className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Unified Healthcare Network Command Center</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Real-time integrated intelligence, emergency coordination, and multi-modal logistics across Blood and Organ domains.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 px-3 py-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ALL SYSTEMS OPERATIONAL
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                        Region: Pune Metropolitan Area
                    </Badge>
                </div>
            </div>

            {/* High-Level Network KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-red-600 flex items-center gap-1">
                            <Droplet className="h-3.5 w-3.5" /> Blood Requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono">17 Active</div>
                        <span className="text-[10px] text-muted-foreground">4 emergency trauma</span>
                    </CardContent>
                </Card>

                <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" /> Organ Resources
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono">6 Available</div>
                        <span className="text-[10px] text-muted-foreground">3 pending review</span>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> 72h Supply Risk
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono text-amber-600">HIGH (82%)</div>
                        <span className="text-[10px] text-muted-foreground">O- stockout lead time</span>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" /> Active Logistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono text-blue-600">5 In Transit</div>
                        <span className="text-[10px] text-muted-foreground">1 Air, 4 Ambulance</span>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> Trust Layer
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono text-emerald-600">Block #1845210</div>
                        <span className="text-[10px] text-muted-foreground">Zero-PHI on-ledger</span>
                    </CardContent>
                </Card>
            </div>

            {/* Main Dual-Domain Operations Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* LEFT: BLOOD DOMAIN REAL-TIME STATE */}
                <Card className="border-red-500/20">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Droplet className="h-5 w-5 text-red-500" />
                                <CardTitle className="text-base font-bold">Blood Network Operations</CardTitle>
                            </div>
                            <Link href="/blood">
                                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                                    Manage Blood <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                        <CardDescription>
                            Live inventory distribution, shortage risk detection, and proactive donor mobilization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        {/* Critical Inventory Notice */}
                        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="font-semibold text-red-600 flex items-center gap-1.5">
                                    <AlertOctagon className="h-3.5 w-3.5" />
                                    CRITICAL SHORTAGE ALARM: Type O- Negative
                                </div>
                                <p className="text-muted-foreground">
                                    Current Stock: 14 units across 4 regional hospitals. Depletion velocity: 3.8 units/hr. Projected stockout in 18 hours.
                                </p>
                            </div>
                            <Badge variant="destructive" className="text-[10px]">99% Risk</Badge>
                        </div>

                        {/* Recent Blood Requests */}
                        <div className="space-y-2">
                            <span className="font-semibold text-foreground">Active Emergency Blood Requisitions:</span>
                            <div className="p-2.5 rounded border bg-background flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium">Sassoon General Hospital — 6 Units O-</div>
                                    <div className="text-muted-foreground text-[11px]">Emergency Trauma Shock • Req #REQ-9812</div>
                                </div>
                                <Badge className="bg-red-600 text-white text-[10px]">CRITICAL</Badge>
                            </div>

                            <div className="p-2.5 rounded border bg-background flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium">Ruby Hall Clinic — 4 Units A+</div>
                                    <div className="text-muted-foreground text-[11px]">Surgical Pre-op Reservation • Req #REQ-9815</div>
                                </div>
                                <Badge variant="outline" className="text-[10px]">ROUTINE</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* RIGHT: ORGAN DOMAIN REAL-TIME STATE */}
                <Card className="border-purple-500/20">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Heart className="h-5 w-5 text-purple-500" />
                                <CardTitle className="text-base font-bold">Organ Network Operations</CardTitle>
                            </div>
                            <Link href="/organ">
                                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                                    Manage Organs <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                        <CardDescription>
                            Organ availability states, cold ischemia countdowns, candidate pools, and coordinator approval gates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        {/* Time-Critical Organ Case */}
                        <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="font-semibold text-purple-600 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    TIME-CRITICAL: Donor Heart (Case #ORG-1042)
                                </div>
                                <p className="text-muted-foreground">
                                    Preservation Window: 4h 15m remaining. Candidate Pool: 18 eligible recipients ranked. Air charter route assigned.
                                </p>
                            </div>
                            <Link href="/organ/review">
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] h-6 px-2.5">
                                    Review Match
                                </Button>
                            </Link>
                        </div>

                        {/* Recent Organ Allocations */}
                        <div className="space-y-2">
                            <span className="font-semibold text-foreground">Active Allocation & Preservation Status:</span>
                            <div className="p-2.5 rounded border bg-background flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium">Donor Kidney (Left) — KEM Hospital Pune</div>
                                    <div className="text-muted-foreground text-[11px]">Cold Ischemia: 18h 40m remaining • Candidate #04 Assigned</div>
                                </div>
                                <Badge className="bg-purple-600 text-white text-[10px]">IN TRANSIT</Badge>
                            </div>

                            <div className="p-2.5 rounded border bg-background flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium">Donor Liver (Whole) — Deenanath Mangeshkar</div>
                                    <div className="text-muted-foreground text-[11px]">Cold Ischemia: 8h 20m remaining • Awaiting Human Approval</div>
                                </div>
                                <Badge variant="destructive" className="text-[10px]">PENDING REVIEW</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* UNIFIED LOGISTICS & AI INTELLIGENCE ROW */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Active Logistics Stream */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-blue-500" />
                                <CardTitle className="text-base font-bold">Unified Logistics & Cold Ischemia In-Transit</CardTitle>
                            </div>
                            <Link href="/logistics">
                                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                                    Full Logistics <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                        <CardDescription>
                            Simultaneous tracking of temperature-controlled blood transports and cold ischemia organ flights.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-500/10 text-purple-600">
                                    <Plane className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="font-semibold">Flight VT-VEIN-01 (Air Charter) — Donor Heart</div>
                                    <div className="text-muted-foreground text-[11px]">Route: Mumbai Airport $\to$ Pune Heliport • ETA: 32 mins</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge className="bg-emerald-600 text-white text-[10px]">FEASIBLE (+3.8h BUFFER)</Badge>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-red-500/10 text-red-600">
                                    <Truck className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="font-semibold">Ambulance MH-12-BLD-04 — 6 Units O- Blood</div>
                                    <div className="text-muted-foreground text-[11px]">Route: Ruby Hall Clinic $\to$ Sassoon Trauma Center • ETA: 14 mins</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline" className="text-[10px]">ON SCHEDULE</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Regional Graph Resilience */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Network className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-base font-bold">Network Graph Resilience</CardTitle>
                        </div>
                        <CardDescription>
                            Topological graph density & regional supply interdependence.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        <div className="text-center p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20">
                            <span className="text-muted-foreground text-xs">Composite Resilience Score:</span>
                            <div className="text-3xl font-extrabold font-mono text-emerald-600 mt-1">82 / 100</div>
                            <Badge className="bg-emerald-600 text-white mt-1 text-[10px]">ROBUST STATUS</Badge>
                        </div>

                        <div className="space-y-1.5 text-muted-foreground text-[11px]">
                            <div className="flex justify-between">
                                <span>Network Hub Nodes:</span>
                                <strong className="text-foreground font-mono">14 Facilities</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Supply Interlinks:</span>
                                <strong className="text-foreground font-mono">38 Active Routes</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Single-Point Dependencies:</span>
                                <strong className="text-emerald-600 font-mono">0 Bottlenecks</strong>
                            </div>
                        </div>

                        <Link href="/intelligence">
                            <Button variant="outline" size="sm" className="w-full text-xs mt-1">
                                Open Graph Studio
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
