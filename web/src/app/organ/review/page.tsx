"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileText,
    Heart,
    HelpCircle,
    Lock,
    Scale,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    User,
    Users,
    XCircle,
} from "lucide-react"

export default function OrganAllocationReviewPage() {
    const [selectedCandidate, setSelectedCandidate] = useState("CANDIDATE_07")
    const [decisionStatus, setDecisionStatus] = useState<"PENDING" | "APPROVED" | "MODIFIED" | "REJECTED">("PENDING")
    const [justificationReason, setJustificationReason] = useState("")
    const [showExplanation, setShowExplanation] = useState(true)

    const organData = {
        organId: "ORG-2026-1042",
        organType: "KIDNEY (LEFT)",
        donorSource: "Deceased Donor (Brain Death Confirmed)",
        originFacility: "Ruby Hall Clinic, Pune",
        destinationFacility: "Sassoon General Hospital, Pune",
        procurementTimestamp: Date.now() - 3600000 * 4, // 4 hrs ago
        maximumColdIschemiaHours: 24.0,
        remainingHours: 19.5,
        verificationStatus: "VERIFIED",
        candidatePoolCount: 18,
    }

    const candidates = [
        {
            id: "CANDIDATE_07",
            rank: 1,
            compositeScore: 0.94,
            urgencyScore: 0.96,
            compatibilityScore: 0.98,
            waitlistDays: 412,
            distanceKm: 8.5,
            confidence: 0.86,
            uncertainty: "MEDIUM",
            isPrimaryRecommended: true,
            summary: "Optimal crossmatch match with high clinical urgency; closest recipient with minimal cold ischemia transit penalty.",
        },
        {
            id: "CANDIDATE_03",
            rank: 2,
            compositeScore: 0.89,
            urgencyScore: 0.88,
            compatibilityScore: 0.95,
            waitlistDays: 780,
            distanceKm: 14.2,
            confidence: 0.84,
            uncertainty: "LOW",
            isPrimaryRecommended: false,
            summary: "Significantly longer waitlist duration (780 days) with compatible blood and HLA markers; slightly longer transit ETA.",
        },
        {
            id: "CANDIDATE_11",
            rank: 3,
            compositeScore: 0.82,
            urgencyScore: 0.82,
            compatibilityScore: 0.91,
            waitlistDays: 290,
            distanceKm: 4.1,
            confidence: 0.79,
            uncertainty: "MEDIUM",
            isPrimaryRecommended: false,
            summary: "Immediate geographic proximity to donor procurement center, stable pre-op condition.",
        },
        {
            id: "CANDIDATE_15",
            rank: 4,
            compositeScore: 0.76,
            urgencyScore: 0.75,
            compatibilityScore: 0.88,
            waitlistDays: 145,
            distanceKm: 22.0,
            confidence: 0.74,
            uncertainty: "HIGH",
            isPrimaryRecommended: false,
            summary: "Compatible pediatric recipient candidate; higher uncertainty due to recent antibody panel update.",
        },
    ]

    const handleApprove = () => {
        setDecisionStatus("APPROVED")
    }

    const handleModify = () => {
        if (!justificationReason.trim()) {
            alert("Clinical Governance Mandate: Human coordinators modifying or overriding AI recommendations must record written clinical justification.")
            return
        }
        setDecisionStatus("MODIFIED")
    }

    const handleReject = () => {
        if (!justificationReason.trim()) {
            alert("Clinical Governance Mandate: Please enter clinical reason for rejecting the candidate pool recommendations.")
            return
        }
        setDecisionStatus("REJECTED")
    }

    const activeCandidate = candidates.find((c) => c.id === selectedCandidate) || candidates[0]

    return (
        <div className="space-y-6 p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link href="/organ">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Heart className="h-7 w-7 text-purple-600" />
                        <h1 className="text-2xl font-bold tracking-tight">Organ Allocation Human Review Gate</h1>
                    </div>
                    <p className="text-muted-foreground text-xs pl-10">
                        Multi-objective Pareto recommendation with transparent explainability. Human decision is the final clinical authority.
                    </p>
                </div>

                <Badge className="bg-purple-600 text-white px-3 py-1 font-mono text-xs">
                    CASE #{organData.organId}
                </Badge>
            </div>

            {/* Organ Resource Summary Card */}
            <Card className="border-purple-500/30 bg-purple-500/5">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <span>Organ Resource:</span>
                            <span className="text-purple-600 font-extrabold">{organData.organType}</span>
                        </CardTitle>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                            {organData.verificationStatus}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded border bg-background">
                            <span className="text-muted-foreground">Source Facility:</span>
                            <div className="font-semibold text-foreground truncate mt-0.5">{organData.originFacility}</div>
                        </div>

                        <div className="p-2.5 rounded border bg-background">
                            <span className="text-muted-foreground">Candidate Pool:</span>
                            <div className="font-bold text-foreground font-mono mt-0.5">{organData.candidatePoolCount} Verified Candidates</div>
                        </div>

                        <div className="p-2.5 rounded border bg-background">
                            <span className="text-muted-foreground">Cold Ischemia Remaining:</span>
                            <div className="font-bold text-emerald-600 font-mono mt-0.5">{organData.remainingHours}h / {organData.maximumColdIschemiaHours}h</div>
                        </div>

                        <div className="p-2.5 rounded border bg-background">
                            <span className="text-muted-foreground">Human Authority Gate:</span>
                            <div className="font-semibold text-purple-600 mt-0.5">MANDATORY APPROVAL</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Decision Support Split */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Candidate Selection List */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-purple-600" />
                        Candidate Pool Alternatives
                    </h3>

                    <div className="space-y-2">
                        {candidates.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCandidate(c.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedCandidate === c.id
                                        ? "border-purple-600 bg-purple-500/10"
                                        : "border-border hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold font-mono">Rank #{c.rank}</span>
                                        <span className="font-medium text-muted-foreground">({c.id})</span>
                                    </div>
                                    {c.isPrimaryRecommended && (
                                        <Badge className="bg-purple-600 text-[10px] h-5">PRIMARY</Badge>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>Score: {(c.compositeScore * 100).toFixed(0)}%</span>
                                    <span>Waitlist: {c.waitlistDays}d</span>
                                    <span>Dist: {c.distanceKm}km</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Candidate Review & Explanation Pane */}
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    Candidate Details: {activeCandidate.id} (Rank #{activeCandidate.rank})
                                </CardTitle>
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-xs">
                                        Confidence: {(activeCandidate.confidence * 100).toFixed(0)}%
                                    </Badge>
                                    <Badge
                                        variant={activeCandidate.uncertainty === "LOW" ? "outline" : "secondary"}
                                        className={
                                            activeCandidate.uncertainty === "HIGH"
                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"
                                                : "text-xs"
                                        }
                                    >
                                        Uncertainty: {activeCandidate.uncertainty}
                                    </Badge>
                                </div>
                            </div>
                            <CardDescription className="text-xs">
                                Model: organ-allocation-v2 (Multi-Objective Pareto Engine + De-identified Feature Vectors)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs">
                            {/* High Uncertainty Warning */}
                            {activeCandidate.uncertainty === "HIGH" && (
                                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>High Model Uncertainty: Requires additional expert clinical review and antibody re-verification.</span>
                                </div>
                            )}

                            {/* Why this candidate? (XAI Explanation) */}
                            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-purple-600" />
                                        Structured Decision Support Explanation
                                    </span>
                                    <button
                                        onClick={() => setShowExplanation(!showExplanation)}
                                        className="text-[11px] text-purple-600 hover:underline"
                                    >
                                        {showExplanation ? "Collapse" : "Expand"}
                                    </button>
                                </div>

                                {showExplanation && (
                                    <p className="text-muted-foreground leading-relaxed pt-1">
                                        {activeCandidate.summary}
                                    </p>
                                )}
                            </div>

                            {/* Objective Factors Breakdown */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded border bg-background">
                                    <span className="text-[10px] text-muted-foreground">Clinical Urgency:</span>
                                    <div className="font-mono font-bold text-foreground mt-0.5">
                                        {(activeCandidate.urgencyScore * 100).toFixed(0)}%
                                    </div>
                                </div>
                                <div className="p-2 rounded border bg-background">
                                    <span className="text-[10px] text-muted-foreground">Crossmatch Compatibility:</span>
                                    <div className="font-mono font-bold text-foreground mt-0.5">
                                        {(activeCandidate.compatibilityScore * 100).toFixed(0)}%
                                    </div>
                                </div>
                                <div className="p-2 rounded border bg-background">
                                    <span className="text-[10px] text-muted-foreground">Waitlist Duration:</span>
                                    <div className="font-mono font-bold text-foreground mt-0.5">
                                        {activeCandidate.waitlistDays} Days
                                    </div>
                                </div>
                            </div>

                            {/* Verified Constraints */}
                            <div className="p-3 rounded-lg border bg-background space-y-1.5">
                                <span className="font-semibold text-foreground">Verified Hard Constraints:</span>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> ABO Blood Compatibility: PASS
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> HLA Crossmatch Negative: PASS
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Transit Feasibility Buffer: PASS (+15.2h)
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Medical Consent Verified: PASS
                                    </div>
                                </div>
                            </div>

                            {/* Override / Clinical Justification Input */}
                            <div className="space-y-1.5 pt-1">
                                <label className="font-semibold text-foreground">
                                    Clinical Justification & Medical Notes:
                                </label>
                                <Textarea
                                    placeholder="Enter coordinator clinical justification for approval, override selection, or rejection reason..."
                                    value={justificationReason}
                                    onChange={(e) => setJustificationReason(e.target.value)}
                                    className="text-xs min-h-[70px]"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t flex items-center justify-between">
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Lock className="h-3 w-3 text-emerald-500" />
                                    All human decisions are cryptographically signed & anchored on-chain.
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={handleReject}
                                    >
                                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                    </Button>

                                    {activeCandidate.rank !== 1 ? (
                                        <Button
                                            size="sm"
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                            onClick={handleModify}
                                        >
                                            <Scale className="h-3.5 w-3.5 mr-1" /> Override Selection
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={handleApprove}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve Allocation
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Decision Banner Feedback */}
                            {decisionStatus !== "PENDING" && (
                                <div
                                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                                        decisionStatus === "APPROVED"
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                                            : decisionStatus === "MODIFIED"
                                            ? "border-amber-500 bg-amber-500/10 text-amber-700"
                                            : "border-red-500 bg-red-500/10 text-red-700"
                                    }`}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Decision recorded: {decisionStatus} for {activeCandidate.id}. Immutable audit event dispatched with correlation ID.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
