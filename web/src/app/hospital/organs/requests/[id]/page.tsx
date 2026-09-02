"use client"

import { use } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    HeartHandshake,
    ShieldCheck,
    Stethoscope,
    Users,
} from "lucide-react"
import Link from "next/link"

export default function OrganRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const data = useQuery(api.organRequests.getOrganRequestDetails, {
        requestId: id as any,
    })

    if (data === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!data || !data.request) {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <h2 className="text-xl font-bold">Organ Request Not Found</h2>
                <Link href="/hospital/organs/requests">
                    <Button variant="outline" size="sm">Back to Requests</Button>
                </Link>
            </div>
        )
    }

    const { request, candidates } = data

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/hospital/organs/requests"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Organ Requests
                </Link>
            </div>

            {/* Request Summary Banner */}
            <Card className="rounded-2xl border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-card to-card p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground">
                                OR-{request._id.slice(-6).toUpperCase()}
                            </span>
                            <h1 className="text-2xl font-bold text-foreground">
                                {request.organType.replace(/_/g, " ")} Requisition
                            </h1>
                            <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                    request.urgency === "CRITICAL"
                                        ? "bg-red-500/10 text-red-500 border-red-500/30"
                                        : request.urgency === "URGENT"
                                        ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                        : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                }`}
                            >
                                {request.urgency}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                {request.donationType}
                            </Badge>
                            <Badge className="text-[10px] bg-emerald-600 text-white">
                                {request.status.replace(/_/g, " ")}
                            </Badge>
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                            {request.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground pt-1 font-medium">
                            <span>Patient: <strong className="text-foreground font-mono">{request.patientReference}</strong></span>
                            <span>Required Blood Group: <strong className="text-red-500 font-mono">{request.requiredBloodGroup}</strong></span>
                            <span>Department: <strong className="text-foreground">{request.department}</strong></span>
                            <span>Created By: <strong className="text-foreground">{request.createdBy}</strong></span>
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <div className="text-xs text-muted-foreground">Matched Candidates</div>
                        <div className="text-3xl font-mono font-extrabold text-emerald-500">{candidates.length}</div>
                    </div>
                </div>
            </Card>

            {/* Candidates Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" />
                            Potential Eligible Candidates ({candidates.length})
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Donors verified by hospital screening who match the clinical criteria.
                        </p>
                    </div>

                    <Link href="/hospital/organ-evaluations">
                        <Button size="sm" variant="outline" className="text-xs">
                            Open Evaluation Queue →
                        </Button>
                    </Link>
                </div>

                {candidates.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl bg-card/30">
                        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="font-semibold text-sm text-foreground">No Compatible Candidates Identified</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            The matching algorithm is actively scanning for newly verified donors with compatible ABO blood groups and relevant organ preferences.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {candidates.map((cand) => (
                            <Card key={cand._id} className="rounded-2xl border-border/60 bg-card/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted text-foreground">
                                            CAND-{cand._id.slice(-6).toUpperCase()}
                                        </span>
                                        <h3 className="font-bold text-base text-foreground">{cand.donorName}</h3>
                                        <Badge variant="outline" className="text-[10px] font-mono font-bold text-red-500 border-red-500/30">
                                            ABO: {cand.donorBloodGroup}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] ${
                                                cand.donorResponse === "INTERESTED"
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                    : cand.donorResponse === "DECLINED"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                                                    : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                            }`}
                                        >
                                            Response: {cand.donorResponse}
                                        </Badge>
                                        <Badge className="text-[10px] bg-purple-600 text-white">
                                            Eval: {cand.evaluationStatus.replace(/_/g, " ")}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
                                        <span>Match Confidence: <strong className="text-emerald-500 font-mono">{Math.round(cand.matchScore * 100)}%</strong></span>
                                        {cand.assignedDoctorName && (
                                            <span>Assigned Doctor: <strong className="text-foreground">{cand.assignedDoctorName}</strong></span>
                                        )}
                                        <span>Identified: <strong className="text-foreground">{new Date(cand.createdAt).toLocaleDateString()}</strong></span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Link href={`/hospital/organ-evaluations?candidateId=${cand._id}`}>
                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 h-9 rounded-xl">
                                            Clinical Review
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
