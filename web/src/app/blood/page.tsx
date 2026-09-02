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
    LineChart,
    MapPin,
    Plus,
    Users,
    Zap,
} from "lucide-react"

export default function BloodNetworkPage() {
    const inventory = [
        { type: "O-", units: 14, status: "CRITICAL", velocity: "3.8 u/hr", risk: "99% 72h Shortage" },
        { type: "O+", units: 68, status: "STABLE", velocity: "2.1 u/hr", risk: "12% Shortage" },
        { type: "A-", units: 22, status: "LOW", velocity: "1.9 u/hr", risk: "68% Shortage" },
        { type: "A+", units: 84, status: "HEALTHY", velocity: "1.4 u/hr", risk: "5% Shortage" },
        { type: "B-", units: 18, status: "LOW", velocity: "1.6 u/hr", risk: "74% Shortage" },
        { type: "B+", units: 92, status: "HEALTHY", velocity: "1.2 u/hr", risk: "4% Shortage" },
        { type: "AB-", units: 16, status: "CRITICAL", velocity: "2.0 u/hr", risk: "85% Shortage" },
        { type: "AB+", units: 54, status: "STABLE", velocity: "0.8 u/hr", risk: "8% Shortage" },
    ]

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Droplet className="h-8 w-8 text-red-600" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Blood Network Operations & Shortage Intelligence</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Real-time blood bank inventory monitoring, multi-horizon demand forecasting, and proactive donor mobilization.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/emergency">
                        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 text-xs">
                            <AlertTriangle className="h-4 w-4" /> Issue Emergency Request
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {inventory.map((item) => (
                    <Card
                        key={item.type}
                        className={`transition-all ${
                            item.status === "CRITICAL"
                                ? "border-red-500 bg-red-500/10"
                                : item.status === "LOW"
                                ? "border-amber-500/50 bg-amber-500/5"
                                : "border-border"
                        }`}
                    >
                        <CardHeader className="p-3 pb-1">
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xl font-mono text-foreground">{item.type}</span>
                                <Badge
                                    variant={item.status === "CRITICAL" ? "destructive" : item.status === "LOW" ? "secondary" : "outline"}
                                    className="text-[10px]"
                                >
                                    {item.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 space-y-1">
                            <div className="text-2xl font-bold font-mono text-foreground">{item.units} Units</div>
                            <div className="text-[11px] text-muted-foreground flex justify-between">
                                <span>Depletion: {item.velocity}</span>
                                <span className={item.status === "CRITICAL" ? "text-red-500 font-semibold" : ""}>{item.risk}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Active Blood Requisitions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-bold">Active Hospital Blood Requisitions</CardTitle>
                    <CardDescription>
                        Emergency trauma and scheduled surgical reservations across Pune metropolitan facilities.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-lg border bg-background flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Sassoon General Hospital</span>
                                <Badge className="bg-red-600 text-white text-[10px]">CRITICAL TRAUMA</Badge>
                                <Badge variant="outline" className="font-mono text-[10px]">REQ-2026-9812</Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Requires 6 Units of O- Negative • 8 eligible donors mobilized via targeted n8n workflow.
                            </p>
                        </div>

                        <div className="text-right space-y-1">
                            <span className="text-[10px] text-muted-foreground">Arrival ETA:</span>
                            <div className="font-mono font-bold text-emerald-600">26 Mins (Dynamic ETA)</div>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-lg border bg-background flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Ruby Hall Clinic</span>
                                <Badge variant="outline" className="text-[10px]">SURGICAL PRE-OP</Badge>
                                <Badge variant="outline" className="font-mono text-[10px]">REQ-2026-9815</Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Requires 4 Units of A+ Positive • Scheduled for cardiovascular surgery pre-positioning.
                            </p>
                        </div>

                        <div className="text-right space-y-1">
                            <span className="text-[10px] text-muted-foreground">Status:</span>
                            <div className="font-mono font-bold text-blue-600">RESERVED IN BANK</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
