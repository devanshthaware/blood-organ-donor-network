"use client"

import MagicBento from "@/components/MagicBento"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useDonationRequests } from "@/hooks/useDonationRequests"
import { useReservations } from "@/hooks/useReservations"
import { useAlerts } from "@/hooks/useAlerts"
import { Activity, Users, AlertCircle, CheckCircle, Plus, ClipboardList, ShieldCheck, Stethoscope, HeartHandshake, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HospitalDashboard() {
    const { requests, loading: requestsLoading } = useDonationRequests("hospital")
    const { reservations, loading: reservationsLoading } = useReservations("hospital")
    const { alerts, loading: alertsLoading } = useAlerts()

    const pendingVerifications = useQuery(api.donorVerification.getHospitalVerificationRequests, {
        status: "PENDING",
    })
    const pendingOrganEvaluations = useQuery(api.organPreferences.getHospitalOrganEvaluationRequests, {
        status: "PENDING",
    })
    const allDonors = useQuery(api.donors.getAllDonors, {})

    if (requestsLoading || reservationsLoading) {
        return <div className="p-8 text-muted-foreground">Loading dashboard metrics...</div>
    }

    const activeRequests = requests.filter(r => r.status === "PENDING")
    const criticalRequests = requests.filter(r => r.urgency === "CRITICAL" && r.status === "PENDING")
    const criticalAlerts = alerts.filter(a => a.severity === "CRITICAL" || a.severity === "HIGH")
    const verifiedDonorsCount = (allDonors || []).filter(d => d.verificationStatus === "VERIFIED" || d.donorStatus === "APPROVED").length

    const pendingVerifCount = pendingVerifications?.length ?? 0
    const pendingOrganEvalCount = pendingOrganEvaluations?.length ?? 0

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hospital Clinical Command Center</h1>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        Emergency blood requisitions, donor medical verifications, and living organ transplant evaluations.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/hospital/requests">
                        <Button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold">
                            <Plus className="h-4 w-4 mr-1.5" /> Create Blood Request
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Action Clinical Queue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Donor Verification Card */}
                <Card className="border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">Donor Verifications</CardTitle>
                                    <CardDescription className="text-xs">Clinical screening & typing</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-xs">
                                {pendingVerifCount} PENDING
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-1">
                        <div className="text-2xl font-bold font-mono text-amber-500">{pendingVerifCount} Requests</div>
                        <p className="text-xs text-muted-foreground">
                            Donors awaiting physical screening and hospital blood group certification.
                        </p>
                        <Link href="/hospital/verification">
                            <Button size="sm" variant="outline" className="w-full text-xs text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1.5 mt-1">
                                Open Verification Queue <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 2. Organ Evaluation Card */}
                <Card className="border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                                    <Stethoscope className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">Organ Evaluations</CardTitle>
                                    <CardDescription className="text-xs">Living candidate assessment</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-purple-500 border-purple-500/40 text-xs">
                                {pendingOrganEvalCount} PENDING
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-1">
                        <div className="text-2xl font-bold font-mono text-purple-500">{pendingOrganEvalCount} Requests</div>
                        <p className="text-xs text-muted-foreground">
                            Living donor candidates for Kidney and Liver workup awaiting evaluation.
                        </p>
                        <Link href="/hospital/organ-evaluations">
                            <Button size="sm" variant="outline" className="w-full text-xs text-purple-500 hover:text-purple-400 flex items-center justify-center gap-1.5 mt-1">
                                Open Organ Evaluation Queue <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 3. Verified Donors in Network */}
                <Card className="border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">Verified Network</CardTitle>
                                    <CardDescription className="text-xs">Certified active donors</CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-emerald-600 text-white text-xs">ACTIVE</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-1">
                        <div className="text-2xl font-bold font-mono text-emerald-500">{verifiedDonorsCount} Donors</div>
                        <p className="text-xs text-muted-foreground">
                            Total medically certified donors in regional registry ready for dispatch.
                        </p>
                        <Link href="/hospital/blood">
                            <Button size="sm" variant="outline" className="w-full text-xs text-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-1.5 mt-1">
                                View Regional Donors <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Existing Hospital System Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-2">
                <Card className="p-4">
                    <span className="text-xs text-muted-foreground">Active Blood Requests</span>
                    <div className="text-3xl font-bold font-mono text-foreground mt-1">{activeRequests.length}</div>
                    <span className="text-[10px] text-red-400">{criticalRequests.length} Critical</span>
                </Card>

                <Card className="p-4">
                    <span className="text-xs text-muted-foreground">Confirmed Matches</span>
                    <div className="text-3xl font-bold font-mono text-blue-500 mt-1">
                        {reservations.filter(r => r.status === "CONFIRMED").length}
                    </div>
                    <span className="text-[10px] text-muted-foreground">En-route / scheduled</span>
                </Card>

                <Card className="p-4">
                    <span className="text-xs text-muted-foreground">Pending Verifications</span>
                    <div className="text-3xl font-bold font-mono text-amber-500 mt-1">{pendingVerifCount}</div>
                    <span className="text-[10px] text-muted-foreground">Clinical queue</span>
                </Card>

                <Card className="p-4">
                    <span className="text-xs text-muted-foreground">Critical Alerts</span>
                    <div className="text-3xl font-bold font-mono text-red-500 mt-1">{criticalAlerts.length}</div>
                    <span className="text-[10px] text-red-400">Immediate attention</span>
                </Card>
            </div>
        </div>
    )
}
