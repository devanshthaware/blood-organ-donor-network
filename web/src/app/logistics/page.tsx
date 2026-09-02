"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Droplet,
    Heart,
    Lock,
    MapPin,
    Navigation,
    Plane,
    Route,
    Shield,
    ShieldCheck,
    Thermometer,
    Truck,
} from "lucide-react"

export default function UnifiedLogisticsPage() {
    const transports = [
        {
            id: "TRP-2026-081",
            resourceType: "ORGAN",
            subType: "HEART",
            origin: "Ruby Hall Clinic (Pune)",
            destination: "Sahyadri Super Speciality (Pune)",
            carrierType: "AIR_CHARTER",
            carrierCode: "VT-VEIN-01",
            status: "IN_TRANSIT",
            departureTime: "12:45 PM",
            estimatedArrival: "01:17 PM (32 mins)",
            preservationWindowHours: 6.0,
            elapsedHours: 1.8,
            remainingBufferHours: 4.2,
            temperatureC: 3.8,
            temperatureStatus: "OPTIMAL (2-6°C)",
            chainOfCustodyCustodian: "Dr. K. Sharma (Transplant Logistics Officer)",
            isViable: true,
        },
        {
            id: "TRP-2026-082",
            resourceType: "BLOOD",
            subType: "O- NEGATIVE (6 UNITS)",
            origin: "Ruby Hall Blood Bank",
            destination: "Sassoon General Hospital Trauma Center",
            carrierType: "ROAD_AMBULANCE",
            carrierCode: "MH-12-BLD-04",
            status: "IN_TRANSIT",
            departureTime: "01:02 PM",
            estimatedArrival: "01:16 PM (14 mins)",
            preservationWindowHours: 24.0,
            elapsedHours: 0.5,
            remainingBufferHours: 23.5,
            temperatureC: 4.1,
            temperatureStatus: "OPTIMAL (2-6°C)",
            chainOfCustodyCustodian: "Nurse Coordinator P. Deshmukh",
            isViable: true,
        },
        {
            id: "TRP-2026-083",
            resourceType: "ORGAN",
            subType: "KIDNEY (LEFT)",
            origin: "KEM Hospital Pune",
            destination: "Deenanath Mangeshkar Hospital",
            carrierType: "ROAD_AMBULANCE",
            carrierCode: "MH-14-ORG-02 (Green Corridor)",
            status: "PICKUP_PENDING",
            departureTime: "Pending Final Handover",
            estimatedArrival: "22 mins transit",
            preservationWindowHours: 24.0,
            elapsedHours: 4.0,
            remainingBufferHours: 20.0,
            temperatureC: 3.9,
            temperatureStatus: "OPTIMAL (2-6°C)",
            chainOfCustodyCustodian: "Dr. A. Patil (Procurement Team)",
            isViable: true,
        },
    ]

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Truck className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Multi-Modal Healthcare Logistics & Cold Chain Center</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Unified real-time transport intelligence, cold ischemia viability tracking, and chain-of-custody verification.
                    </p>
                </div>

                <Badge className="bg-emerald-600 text-white px-3 py-1 text-xs flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> GPS TELEMETRY & TEMPERATURE SYNC ACTIVE
                </Badge>
            </div>

            {/* Active Logistics Table */}
            <div className="space-y-4">
                {transports.map((trp) => (
                    <Card key={trp.id} className="border-border">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {trp.resourceType === "ORGAN" ? (
                                        <Badge className="bg-purple-600 text-white text-[10px]">ORGAN</Badge>
                                    ) : (
                                        <Badge className="bg-red-600 text-white text-[10px]">BLOOD</Badge>
                                    )}
                                    <CardTitle className="text-base font-bold">{trp.subType}</CardTitle>
                                    <span className="font-mono text-xs text-muted-foreground font-semibold">({trp.id})</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {trp.carrierCode}
                                    </Badge>
                                    <Badge className="bg-blue-600 text-white text-xs">
                                        {trp.status}
                                    </Badge>
                                </div>
                            </div>
                            <CardDescription className="text-xs flex items-center gap-2 mt-1">
                                <span>{trp.origin}</span>
                                <span>$\longrightarrow$</span>
                                <strong className="text-foreground">{trp.destination}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-2.5 rounded border bg-muted/20">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-blue-500" /> Transit ETA:
                                    </span>
                                    <div className="font-bold font-mono text-foreground mt-0.5">{trp.estimatedArrival}</div>
                                </div>

                                <div className="p-2.5 rounded border bg-muted/20">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Thermometer className="h-3 w-3 text-emerald-500" /> Temperature:
                                    </span>
                                    <div className="font-bold font-mono text-emerald-600 mt-0.5">
                                        {trp.temperatureC}°C ({trp.temperatureStatus})
                                    </div>
                                </div>

                                <div className="p-2.5 rounded border bg-muted/20">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-purple-500" /> Viability Buffer:
                                    </span>
                                    <div className="font-bold font-mono text-purple-600 mt-0.5">
                                        +{trp.remainingBufferHours}h Remaining
                                    </div>
                                </div>

                                <div className="p-2.5 rounded border bg-muted/20">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Lock className="h-3 w-3 text-emerald-500" /> Custodian:
                                    </span>
                                    <div className="font-semibold text-foreground truncate mt-0.5">{trp.chainOfCustodyCustodian}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
