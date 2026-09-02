"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Activity,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    Heart,
    MapPin,
    Plus,
    Search,
    Shield,
    Sparkles,
    Truck,
    Users,
} from "lucide-react"

export default function OrganNetworkPage() {
    const organResources = [
        {
            id: "ORG-2026-1042",
            type: "HEART",
            donorSource: "Brain Death Confirmed (Ruby Hall Clinic)",
            location: "Pune, Maharashtra",
            availableSince: "1.5 hours ago",
            maxHours: 6.0,
            remainingHours: 4.5,
            status: "PENDING_REVIEW",
            candidateCount: 18,
            urgency: "CRITICAL",
        },
        {
            id: "ORG-2026-1043",
            type: "KIDNEY (LEFT)",
            donorSource: "Living Related Donor (KEM Hospital)",
            location: "Pune, Maharashtra",
            availableSince: "4.0 hours ago",
            maxHours: 24.0,
            remainingHours: 20.0,
            status: "IN_TRANSIT",
            candidateCount: 42,
            urgency: "HIGH",
        },
        {
            id: "ORG-2026-1044",
            type: "LIVER (WHOLE)",
            donorSource: "Deceased Donor (Deenanath Mangeshkar)",
            location: "Pune, Maharashtra",
            availableSince: "3.2 hours ago",
            maxHours: 12.0,
            remainingHours: 8.8,
            status: "PENDING_REVIEW",
            candidateCount: 29,
            urgency: "CRITICAL",
        },
        {
            id: "ORG-2026-1045",
            type: "LUNG (BILATERAL)",
            donorSource: "Deceased Donor (Jehangir Hospital)",
            location: "Pune, Maharashtra",
            availableSince: "0.8 hours ago",
            maxHours: 8.0,
            remainingHours: 7.2,
            status: "AVAILABLE",
            candidateCount: 12,
            urgency: "HIGH",
        },
    ]

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Heart className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Organ Network Intelligence & Coordination Hub</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Verified organ resource registry, candidate pool matching, cold ischemia clocks, and authorized clinical review.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/organ/review">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 text-xs">
                            <Sparkles className="h-4 w-4" /> Open Active Review Gate
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-purple-600">Available Organs</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono">6 Resources</div>
                        <span className="text-[10px] text-muted-foreground">Heart, Kidney, Liver, Lung</span>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-blue-600">Waiting Candidate Pool</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono">342 Patients</div>
                        <span className="text-[10px] text-muted-foreground">Across 8 regional centers</span>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-amber-600">Pending Human Review</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono text-amber-600">2 Urgent Cases</div>
                        <span className="text-[10px] text-muted-foreground">Awaiting coordinator authorization</span>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardHeader className="p-3 pb-1">
                        <CardDescription className="text-xs font-semibold text-emerald-600">Active Organ Transports</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold font-mono text-emerald-600">2 In-Transit</div>
                        <span className="text-[10px] text-muted-foreground">Air Charter + Ground Green Corridor</span>
                    </CardContent>
                </Card>
            </div>

            {/* Organ Resources Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold">Active Organ Resources & Viability Countdown</CardTitle>
                            <CardDescription>
                                Track remaining cold ischemia preservation buffers and review AI candidate rankings.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {organResources.map((org) => (
                        <div
                            key={org.id}
                            className="p-4 rounded-lg border bg-background hover:bg-muted/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs"
                        >
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">{org.type}</span>
                                    <Badge variant="outline" className="font-mono text-[10px]">{org.id}</Badge>
                                    <Badge
                                        variant={org.urgency === "CRITICAL" ? "destructive" : "secondary"}
                                        className="text-[10px]"
                                    >
                                        {org.urgency}
                                    </Badge>
                                </div>
                                <div className="text-muted-foreground text-[11px] flex items-center gap-3">
                                    <span>Source: {org.donorSource}</span>
                                    <span>•</span>
                                    <span>Location: {org.location}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="text-muted-foreground text-[10px]">Cold Ischemia Viability:</span>
                                    <div className="font-mono font-bold text-emerald-600 text-sm flex items-center gap-1 justify-end">
                                        <Clock className="h-3.5 w-3.5" />
                                        {org.remainingHours}h / {org.maxHours}h remaining
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-muted-foreground text-[10px]">Candidate Pool:</span>
                                    <div className="font-mono font-semibold text-foreground">
                                        {org.candidateCount} Eligible
                                    </div>
                                </div>

                                <Link href="/organ/review">
                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3">
                                        Review Allocation
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
