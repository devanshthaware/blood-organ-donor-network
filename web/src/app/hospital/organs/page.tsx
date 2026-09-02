"use client"

import { useState } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Heart,
    Activity,
    Users,
    GitPullRequest,
    Clock,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Building2,
    Calendar,
    AlertTriangle,
    Sparkles,
    ArrowRight,
    Search,
    Scale,
    SlidersHorizontal,
} from "lucide-react"

export default function HospitalOrgansPage() {
    const [activeTab, setActiveTab] = useState("inventory")
    const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null)
    const [isMatchingRunning, setIsMatchingRunning] = useState(false)
    const [isOptimizingRunning, setIsOptimizingRunning] = useState(false)

    const inventory = useQuery((api as any).organInventory?.getAllOrganInventory, {}) || []
    const recipients = useQuery((api as any).recipients?.getAllRecipients, {}) || []
    const requests = useQuery((api as any).organRequests?.getAllOrganRequests, {}) || []
    const allocations = useQuery((api as any).organAllocations?.getAllocations, {}) || []

    const selectedMatches = useQuery(
        (api as any).organMatching?.getMatchesByOrgan,
        selectedOrganId ? { organId: selectedOrganId } : "skip"
    ) || []

    const activeRecommendations = useQuery(
        (api as any).organAllocations?.getRecommendationsForOrgan,
        selectedOrganId ? { organId: selectedOrganId } : "skip"
    ) || []

    const runMatchingAction = useAction((api as any).organMatching?.actions?.runOrganMatching)
    const generateRecsAction = useAction(
        (api as any).organAllocation?.approvalWorkflow?.generateAllocationRecommendations
    )
    const approveWithRevalidationMutation = useMutation(
        (api as any).organAllocations?.approveAllocationWithRevalidation
    )
    const rejectWithReasonMutation = useMutation(
        (api as any).organAllocations?.rejectAllocationWithReason
    )

    const handleRunMatching = async (organId: string) => {
        setSelectedOrganId(organId)
        setActiveTab("matches")
        setIsMatchingRunning(true)
        try {
            const result = await runMatchingAction({ organId })
            alert(
                `Matching engine evaluated ${result.candidatesEvaluated} requests and generated ${result.matchesGenerated} ranked candidates.`
            )
        } catch (err: any) {
            alert(err?.message || "Failed to execute matching analysis.")
        } finally {
            setIsMatchingRunning(false)
        }
    }

    const handleGenerateRecommendations = async (organId: string) => {
        setSelectedOrganId(organId)
        setIsOptimizingRunning(true)
        try {
            const result = await generateRecsAction({ organId })
            if (result.recommendationsCount === 0) {
                alert("No candidates passed the multi-objective allocation eligibility gate.")
            } else {
                alert(`Generated ${result.recommendationsCount} multi-objective allocation recommendations.`)
            }
            setActiveTab("allocations")
        } catch (err: any) {
            alert(err?.message || "Failed to generate allocation recommendations.")
        } finally {
            setIsOptimizingRunning(false)
        }
    }

    const handleApproveRecommendation = async (rec: any, isOverride: boolean) => {
        let overrideReason: string | undefined = undefined

        if (isOverride) {
            const promptReason = prompt(
                `HUMAN OVERRIDE REQUIRED:\nYou are selecting Rank #${rec.rank} instead of the primary Rank #1 recommendation.\nEnter mandatory clinical/logistical justification:`,
                "Surgeon consensus based on immediate operating room readiness."
            )
            if (!promptReason || promptReason.trim().length === 0) {
                alert("Approval aborted: Override justification is mandatory.")
                return
            }
            overrideReason = promptReason
        }

        const justification = prompt(
            "Enter clinical justification to execute authorized organ allocation:",
            isOverride
                ? `Approved under human coordinator override: ${overrideReason}`
                : "Primary recommendation approved following clinical review."
        )
        if (!justification) return

        try {
            const result = await approveWithRevalidationMutation({
                recommendationId: rec._id,
                clinicalJustification: justification,
                isOverride,
                overrideReason,
            })
            alert(`Allocation AUTHORIZED successfully!\nAudit Reference: ${result.auditReference}\nOrgan status updated to ALLOCATED.`)
        } catch (err: any) {
            alert(err?.message || "Failed to authorize allocation.")
        }
    }

    const handleRejectRecommendation = async (rec: any) => {
        const category = prompt(
            "Select Rejection Category:\n1. Clinical Review Concern\n2. Logistics Unfeasible\n3. Patient Unavailable\n4. Other",
            "Clinical Review Concern"
        )
        if (!category) return

        const reason = prompt("Enter specific clinical/operational reason for rejection:")
        if (!reason) return

        try {
            await rejectWithReasonMutation({
                recommendationId: rec._id,
                rejectionCategory: category,
                rejectionReason: reason,
            })
            alert("Recommendation rejected and recorded in audit trail.")
        } catch (err: any) {
            alert(err?.message || "Failed to reject recommendation.")
        }
    }

    const formatRemainingPreservation = (deadline: number) => {
        const diffMs = deadline - Date.now()
        if (diffMs <= 0) return <span className="text-red-500 font-semibold">Expired</span>
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        return (
            <span className={hours < 4 ? "text-amber-500 font-semibold" : "text-green-500"}>
                {hours}h {mins}m remaining
            </span>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <div className="flex items-center gap-2">
                    <Heart className="h-7 w-7 text-red-500 fill-red-500/20" />
                    <h2 className="text-3xl font-bold tracking-tight">Organ Donor Network</h2>
                </div>
                <p className="text-muted-foreground mt-1">
                    Multi-objective optimization, candidate recommendations, and authorized human governance.
                </p>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Available Organs</CardTitle>
                        <Heart className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {inventory.filter((o: any) => o.status === "AVAILABLE").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Viable within cold ischemia clock</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Waitlisted Recipients</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {recipients.filter((r: any) => r.recipientStatus === "ACTIVE").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Active transplant candidates</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                        <GitPullRequest className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter((req: any) => req.status === "ACTIVE" || req.status === "MATCHING").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Matching or pending allocation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Authorized Allocations</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {allocations.filter((a: any) => a.decisionStatus === "APPROVED").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Formally approved by coordinators</p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                    <TabsTrigger value="inventory" className="flex items-center gap-1.5">
                        <Heart className="h-4 w-4" />
                        <span>Inventory</span>
                    </TabsTrigger>
                    <TabsTrigger value="matches" className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span>Candidate Matches</span>
                    </TabsTrigger>
                    <TabsTrigger value="allocations" className="flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-purple-500" />
                        <span>Allocation Review</span>
                    </TabsTrigger>
                    <TabsTrigger value="recipients" className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>Recipients</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-1.5">
                        <GitPullRequest className="h-4 w-4" />
                        <span>Requests</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Organ Inventory */}
                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identified & Available Organs</CardTitle>
                            <CardDescription>
                                Tracked organs with active preservation clocks. Run matching or optimize multi-objective allocation recommendations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organ Type</TableHead>
                                        <TableHead>Blood Group</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Preservation Window</TableHead>
                                        <TableHead>Facility</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No organs currently registered in network inventory.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inventory.map((organ: any) => (
                                            <TableRow key={organ._id}>
                                                <TableCell className="font-semibold text-red-500">
                                                    {organ.organType}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{organ.bloodType}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            organ.status === "AVAILABLE"
                                                                ? "default"
                                                                : organ.status === "ALLOCATED"
                                                                ? "secondary"
                                                                : "outline"
                                                        }
                                                    >
                                                        {organ.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {formatRemainingPreservation(organ.preservationDeadline)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs">
                                                    {organ.currentFacilityId.substring(0, 12)}...
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {(organ.status === "AVAILABLE" || organ.status === "MATCHING") && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleRunMatching(organ._id)}
                                                            >
                                                                <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" /> Match
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                                onClick={() => handleGenerateRecommendations(organ._id)}
                                                            >
                                                                <Scale className="h-3.5 w-3.5 mr-1" /> Optimize Allocation
                                                            </Button>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Candidate Matches */}
                <TabsContent value="matches" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recommended Candidate Matches</CardTitle>
                                    <CardDescription>
                                        Policy-constrained candidate ranking with deterministic explanations.
                                    </CardDescription>
                                </div>
                                {selectedOrganId && (
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRunMatching(selectedOrganId)}
                                            disabled={isMatchingRunning}
                                        >
                                            {isMatchingRunning ? "Analyzing..." : "Re-evaluate Matching"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                            onClick={() => handleGenerateRecommendations(selectedOrganId)}
                                        >
                                            <Scale className="h-3.5 w-3.5 mr-1" /> Optimize Allocation
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!selectedOrganId ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                    <p>Select an available organ from the <strong>Inventory</strong> tab to evaluate candidate matches.</p>
                                </div>
                            ) : selectedMatches.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <AlertTriangle className="h-10 w-10 mx-auto text-amber-500/50 mb-3" />
                                    <p className="font-medium text-foreground">No eligible candidates passed hard constraints.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedMatches.map((match: any) => (
                                        <Card key={match._id} className="border-border/60 hover:border-red-500/40 transition-colors">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-primary text-primary-foreground font-mono">
                                                                Rank #{match.ranking}
                                                            </Badge>
                                                            <span className="font-semibold text-base">
                                                                Recipient: {match.recipientId.substring(0, 10)}...
                                                            </span>
                                                            <Badge variant="outline">
                                                                Score: {Math.round(match.score * 100)}%
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-foreground/90 font-medium mt-1">
                                                            {match.explanation}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Allocations Review & Governance (Step 5 Core UI) */}
                <TabsContent value="allocations" className="space-y-4">
                    {/* Active Recommendations Multi-Candidate Comparison */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Multi-Objective Allocation Recommendations</CardTitle>
                                    <CardDescription>
                                        Candidate comparison across clinical urgency, waitlist equity, logistical transit, and cold ischemia viability.
                                    </CardDescription>
                                </div>
                                {selectedOrganId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGenerateRecommendations(selectedOrganId)}
                                        disabled={isOptimizingRunning}
                                    >
                                        {isOptimizingRunning ? "Optimizing..." : "Refresh Recommendations"}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!selectedOrganId ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Scale className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                    <p>Select an organ from <strong>Inventory</strong> to inspect multi-candidate allocation recommendations.</p>
                                </div>
                            ) : activeRecommendations.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <SlidersHorizontal className="h-10 w-10 mx-auto text-purple-500/50 mb-3" />
                                    <p className="font-medium text-foreground">No active recommendations generated for this organ.</p>
                                    <Button
                                        size="sm"
                                        className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => handleGenerateRecommendations(selectedOrganId)}
                                    >
                                        Generate Multi-Objective Recommendations
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Multi-Candidate Comparison Table */}
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Rank</TableHead>
                                                    <TableHead>Candidate</TableHead>
                                                    <TableHead>Urgency</TableHead>
                                                    <TableHead>Waitlist Days</TableHead>
                                                    <TableHead>Distance</TableHead>
                                                    <TableHead>Preservation</TableHead>
                                                    <TableHead>Score</TableHead>
                                                    <TableHead className="text-right">Coordinator Decision</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activeRecommendations.map((rec: any) => {
                                                    const isRank1 = rec.rank === 1
                                                    return (
                                                        <TableRow key={rec._id} className={isRank1 ? "bg-muted/30" : ""}>
                                                            <TableCell>
                                                                <Badge variant={isRank1 ? "default" : "secondary"}>
                                                                    Rank #{rec.rank}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs">
                                                                {rec.recipientId.substring(0, 10)}...
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        rec.objectives?.urgencyTier === "CRITICAL"
                                                                            ? "destructive"
                                                                            : "outline"
                                                                    }
                                                                >
                                                                    {rec.objectives?.urgencyTier || "N/A"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {rec.objectives?.waitlistDays ?? 0} days
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {rec.objectives?.distanceKm ?? 0} km
                                                            </TableCell>
                                                            <TableCell className="text-sm font-mono">
                                                                {rec.objectives?.preservationRemainingHours ?? 0}h
                                                            </TableCell>
                                                            <TableCell className="font-bold text-sm">
                                                                {Math.round(rec.score * 100)}%
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                {rec.status === "PENDING_REVIEW" ? (
                                                                    <>
                                                                        {isRank1 ? (
                                                                            <Button
                                                                                size="sm"
                                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                                onClick={() => handleApproveRecommendation(rec, false)}
                                                                            >
                                                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve Rank #1
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="text-amber-500 border-amber-500 hover:bg-amber-500/10"
                                                                                onClick={() => handleApproveRecommendation(rec, true)}
                                                                            >
                                                                                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Override & Approve
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="text-red-500 border-red-500 hover:bg-red-500/10"
                                                                            onClick={() => handleRejectRecommendation(rec)}
                                                                        >
                                                                            <XCircle className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Badge variant="outline">{rec.status}</Badge>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Recommendation Explanations */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {activeRecommendations.map((rec: any) => (
                                            <Card key={rec._id} className="text-xs">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm flex items-center justify-between">
                                                        <span>Recommendation Profile: Rank #{rec.rank}</span>
                                                        <Badge variant="outline">{rec.policyVersion}</Badge>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    <p className="font-medium text-foreground">{rec.explanation}</p>
                                                    <div className="pt-2 border-t space-y-1 text-muted-foreground">
                                                        <div>• Urgency Contribution: +{rec.objectiveBreakdown?.urgencyContribution}</div>
                                                        <div>• Waitlist Contribution: +{rec.objectiveBreakdown?.waitlistContribution}</div>
                                                        <div>• Logistics Contribution: +{rec.objectiveBreakdown?.logisticsContribution}</div>
                                                        <div>• Preservation Contribution: +{rec.objectiveBreakdown?.preservationContribution}</div>
                                                    </div>
                                                    {rec.warnings && rec.warnings.length > 0 && (
                                                        <div className="pt-2 border-t text-amber-500 space-y-0.5">
                                                            {rec.warnings.map((w: string, i: number) => (
                                                                <div key={i}>⚠ {w}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Authorized Allocation Records (History) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Authorized Allocation Records</CardTitle>
                            <CardDescription>
                                Immutable history of coordinator-authorized organ allocations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Audit Reference</TableHead>
                                        <TableHead>Organ ID</TableHead>
                                        <TableHead>Recipient ID</TableHead>
                                        <TableHead>Decision</TableHead>
                                        <TableHead>Coordinator Justification</TableHead>
                                        <TableHead>Approved At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allocations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                No formal allocations authorized yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        allocations.map((alloc: any) => (
                                            <TableRow key={alloc._id}>
                                                <TableCell className="font-mono text-xs font-semibold">
                                                    {alloc.auditReference}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{alloc.organId.substring(0, 8)}...</TableCell>
                                                <TableCell className="font-mono text-xs">{alloc.recipientId.substring(0, 8)}...</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            alloc.decisionStatus === "APPROVED"
                                                                ? "default"
                                                                : "destructive"
                                                        }
                                                    >
                                                        {alloc.isOverride ? "OVERRIDE APPROVED" : alloc.decisionStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs max-w-xs truncate">
                                                    {alloc.decisionReason}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {alloc.approvedAt ? new Date(alloc.approvedAt).toLocaleString() : "N/A"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: Recipients */}
                <TabsContent value="recipients" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transplant Waitlist Candidates</CardTitle>
                            <CardDescription>Verified recipients waiting for compatible organ matches.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Recipient ID</TableHead>
                                        <TableHead>Required Organ</TableHead>
                                        <TableHead>Blood Group</TableHead>
                                        <TableHead>Urgency Tier</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No recipients registered on the active waitlist.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recipients.map((rec: any) => (
                                            <TableRow key={rec._id}>
                                                <TableCell className="font-mono text-xs">{rec.userId}</TableCell>
                                                <TableCell className="font-medium text-red-500">
                                                    {rec.requiredOrganType}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{rec.bloodType}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            rec.urgency === "CRITICAL"
                                                                ? "destructive"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {rec.urgency}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{rec.recipientStatus}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 5: Organ Requests */}
                <TabsContent value="requests" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transplant Center Requests</CardTitle>
                            <CardDescription>Clinical organ requests initiated by accredited transplant centers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organ</TableHead>
                                        <TableHead>Blood Group</TableHead>
                                        <TableHead>Urgency</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No active organ requests found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requests.map((req: any) => (
                                            <TableRow key={req._id}>
                                                <TableCell className="font-semibold">{req.organType}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{req.bloodType}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={req.urgency === "CRITICAL" ? "destructive" : "secondary"}>
                                                        {req.urgency}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{req.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
