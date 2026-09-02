"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    HeartHandshake,
    ShieldCheck,
    Stethoscope,
    ThumbsDown,
    ThumbsUp,
    Users,
} from "lucide-react"
import Link from "next/link"

export default function DonorOrganOpportunitiesPage() {
    const opportunities = useQuery(api.organRequests.getDonorEligibleOpportunities, {})
    const respondMutation = useMutation(api.organRequests.respondToOrganOpportunity)
    const [submittingId, setSubmittingId] = useState<string | null>(null)

    const handleResponse = async (candidateId: string, response: "INTERESTED" | "DECLINED") => {
        setSubmittingId(candidateId)
        try {
            await respondMutation({
                candidateId: candidateId as any,
                response,
            })
            alert(
                response === "INTERESTED"
                    ? "Thank you! The transplant center has been notified of your interest and will coordinate your medical workup."
                    : "Response recorded. You have declined this organ match opportunity."
            )
        } catch (err: any) {
            alert(err.message || "Failed to submit response.")
        } finally {
            setSubmittingId(null)
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href="/donor/organ/preferences"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Organ Preferences
                        </Link>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Organ Donation Opportunities</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Hospital requisitions where your verified profile has been identified as a potential clinical match.
                    </p>
                </div>
            </div>

            {/* Opportunities Feed */}
            {opportunities === undefined ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : opportunities.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl bg-card/30">
                    <HeartHandshake className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="font-semibold text-base text-foreground">No Active Requisitions Found</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                        You currently have no pending organ donation match requests. When authorized transplant centers publish compatible requisitions, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {opportunities.map(({ candidate, request }) => (
                        <Card
                            key={candidate._id}
                            className="rounded-2xl border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-card to-card p-5 sm:p-6 shadow-sm overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-2.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                                            <HeartHandshake className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground">
                                            {candidate.organType.replace(/_/g, " ")} Donation Opportunity
                                        </h3>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-bold ${
                                                candidate.urgency === "CRITICAL"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                                                    : candidate.urgency === "URGENT"
                                                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                                    : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                            }`}
                                        >
                                            {candidate.urgency}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                            {candidate.donationType}
                                        </Badge>
                                        <Badge
                                            className={`text-[10px] ${
                                                candidate.donorResponse === "INTERESTED"
                                                    ? "bg-emerald-600 text-white"
                                                    : candidate.donorResponse === "DECLINED"
                                                    ? "bg-red-600 text-white"
                                                    : "bg-amber-600 text-white"
                                            }`}
                                        >
                                            {candidate.donorResponse === "PENDING" ? "Response Required" : candidate.donorResponse}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {request?.description || "Clinical organ requisition from authorized regional transplant center."}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground pt-1 font-medium">
                                        <span>Hospital: <strong className="text-foreground">{candidate.hospitalName || "Registered Hospital"}</strong></span>
                                        <span>Required ABO: <strong className="text-red-500 font-mono">{request?.requiredBloodGroup || candidate.donorBloodGroup}</strong></span>
                                        <span>Identified: <strong className="text-foreground">{new Date(candidate.createdAt).toLocaleDateString()}</strong></span>
                                        <span>Evaluation Status: <strong className="text-purple-400 font-mono">{candidate.evaluationStatus.replace(/_/g, " ")}</strong></span>
                                    </div>

                                    {candidate.diagnosticNotes && (
                                        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
                                            🏥 <strong>Hospital Clinical Notes:</strong> {candidate.diagnosticNotes}
                                        </div>
                                    )}
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                    {candidate.donorResponse === "PENDING" ? (
                                        <>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 h-9 rounded-xl flex items-center gap-1.5"
                                                onClick={() => handleResponse(candidate._id, "INTERESTED")}
                                                disabled={submittingId === candidate._id}
                                            >
                                                <ThumbsUp className="w-3.5 h-3.5" /> Interested
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold px-3 h-9 rounded-xl flex items-center gap-1.5"
                                                onClick={() => handleResponse(candidate._id, "DECLINED")}
                                                disabled={submittingId === candidate._id}
                                            >
                                                <ThumbsDown className="w-3.5 h-3.5" /> Not Interested
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-right text-xs">
                                            <span className="text-muted-foreground block font-medium">Status</span>
                                            <span className={`font-bold ${candidate.donorResponse === "INTERESTED" ? "text-emerald-500" : "text-zinc-400"}`}>
                                                {candidate.donorResponse === "INTERESTED" ? "✓ Opted-In for Evaluation" : "Declined"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
