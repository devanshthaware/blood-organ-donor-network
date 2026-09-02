"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Droplet,
    Heart,
    Lock,
    PhoneCall,
    Plane,
    Radio,
    Shield,
    Siren,
    Truck,
    Zap,
} from "lucide-react"

export default function EmergencyCoordinationPage() {
    const [activeTab, setActiveTab] = useState<"ALL" | "BLOOD" | "ORGAN">("ALL")

    const emergencies = [
        {
            id: "EMG-2026-001",
            domain: "BLOOD_EMERGENCY",
            title: "Mass Casualty Trauma Shock (Multiple Vehicle Collision)",
            facility: "Sassoon General Hospital Trauma Center",
            details: "Urgent requisition of 10 units O- Negative. Immediate inventory buffer exhausted.",
            status: "MOBILIZING",
            severity: "CRITICAL",
            timeRemaining: "18 mins to expected donor arrival",
            targetOutreach: "12 registered eligible donors targeted via n8n automated SMS/Push",
        },
        {
            id: "EMG-2026-002",
            domain: "ORGAN_EMERGENCY",
            title: "Critical Cold Ischemia Preservation Countdown: Donor Heart",
            facility: "Ruby Hall Clinic $\\to$ Sahyadri Super Speciality",
            details: "Donor Heart (Case #ORG-1042). Viability buffer: 4h 15m remaining. Green corridor requested.",
            status: "IN_TRANSIT",
            severity: "CRITICAL",
            timeRemaining: "32 mins estimated flight ETA",
            targetOutreach: "Police green corridor confirmed; surgical transplant team assembled",
        },
        {
            id: "EMG-2026-003",
            domain: "BLOOD_EMERGENCY",
            title: "Acute Platelet & AB- Depletion: Hemophilia Surgery",
            facility: "KEM Hospital Pune",
            details: "Single-donor platelets and AB- emergency units required before emergency vascular clamping.",
            status: "MATCHING",
            severity: "HIGH",
            timeRemaining: "45 mins buffer",
            targetOutreach: "Cross-facility transfer initiated from Ruby Hall Blood Bank",
        },
    ]

    const filtered =
        activeTab === "ALL"
            ? emergencies
            : emergencies.filter((e) => e.domain === `${activeTab}_EMERGENCY`)

    return (
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Siren className="h-8 w-8 text-red-600 animate-pulse" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Unified Emergency Resource Coordination Center</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        High-priority crisis escalation for both Blood Shortage Crises and Time-Critical Organ Allocation Emergencies.
                    </p>
                </div>

                <div className="flex gap-1.5 p-1 rounded-lg border bg-muted/40 text-xs">
                    <Button
                        size="sm"
                        variant={activeTab === "ALL" ? "default" : "ghost"}
                        onClick={() => setActiveTab("ALL")}
                        className="h-7 text-xs"
                    >
                        All Emergencies
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === "BLOOD" ? "default" : "ghost"}
                        onClick={() => setActiveTab("BLOOD")}
                        className="h-7 text-xs flex items-center gap-1"
                    >
                        <Droplet className="h-3 w-3 text-red-500" /> Blood
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === "ORGAN" ? "default" : "ghost"}
                        onClick={() => setActiveTab("ORGAN")}
                        className="h-7 text-xs flex items-center gap-1"
                    >
                        <Heart className="h-3 w-3 text-purple-500" /> Organ
                    </Button>
                </div>
            </div>

            {/* Active Emergency Feed */}
            <div className="space-y-4">
                {filtered.map((emg) => (
                    <Card
                        key={emg.id}
                        className={`border-l-4 transition-all ${
                            emg.domain === "BLOOD_EMERGENCY"
                                ? "border-l-red-600 bg-red-500/5"
                                : "border-l-purple-600 bg-purple-500/5"
                        }`}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {emg.domain === "BLOOD_EMERGENCY" ? (
                                        <Badge className="bg-red-600 text-white text-[10px]">BLOOD CRISIS</Badge>
                                    ) : (
                                        <Badge className="bg-purple-600 text-white text-[10px]">ORGAN TIME-CRITICAL</Badge>
                                    )}
                                    <span className="font-mono text-xs text-muted-foreground font-semibold">{emg.id}</span>
                                    <Badge variant="outline" className="text-[10px]">{emg.status}</Badge>
                                </div>
                                <Badge variant="destructive" className="text-[10px]">{emg.severity}</Badge>
                            </div>
                            <CardTitle className="text-base font-bold text-foreground mt-1.5">{emg.title}</CardTitle>
                            <CardDescription className="text-xs">{emg.facility}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                            <p className="text-foreground leading-relaxed">{emg.details}</p>

                            <div className="grid md:grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    <span>Preservation / Arrival: <strong className="text-foreground">{emg.timeRemaining}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Radio className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Intervention: <strong className="text-foreground">{emg.targetOutreach}</strong></span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {emg.domain === "ORGAN_EMERGENCY" ? (
                                    <Link href="/organ/review">
                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7">
                                            Open Allocation Review
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/blood">
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7">
                                            View Matching Donors
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
