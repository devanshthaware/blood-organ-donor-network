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
    Truck,
    Plane,
    MapPin,
    Timer,
    AlertOctagon,
    Send,
    Scan,
    FileCheck,
    Eye,
} from "lucide-react"

export default function HospitalOrgansPage() {
    const [activeTab, setActiveTab] = useState("inventory")
    const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null)
    const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null)
    const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null)
    const [isMatchingRunning, setIsMatchingRunning] = useState(false)
    const [isOptimizingRunning, setIsOptimizingRunning] = useState(false)
    const [isCreatingTransport, setIsCreatingTransport] = useState(false)
    const [isScanning, setIsScanning] = useState(false)

    // Step 3 & 4 queries
    const inventory = useQuery((api as any).organInventory?.getAllOrganInventory, {}) || []
    const recipients = useQuery((api as any).recipients?.getAllRecipients, {}) || []
    const requests = useQuery((api as any).organRequests?.getAllOrganRequests, {}) || []
    const allocations = useQuery((api as any).organAllocations?.getAllocations, {}) || []

    const selectedMatches = useQuery(
        (api as any).organMatching?.getMatchesByOrgan,
        selectedOrganId ? { organId: selectedOrganId } : "skip"
    ) || []

    // Step 5 queries & mutations
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

    // Step 6 logistics queries & actions
    const transportRequests = useQuery(
        (api as any).organLogistics?.logisticsOrchestrator?.getTransportRequests,
        {}
    ) || []

    const transportDetails = useQuery(
        (api as any).organLogistics?.logisticsOrchestrator?.getTransportDetails,
        selectedTransportId ? { transportRequestId: selectedTransportId } : "skip"
    )

    const createTransportPlanAction = useAction(
        (api as any).organLogistics?.logisticsOrchestrator?.createTransportPlanAction
    )
    const assignTransportMutation = useMutation(
        (api as any).organLogistics?.logisticsOrchestrator?.assignTransportOption
    )
    const updateTransportStatusMutation = useMutation(
        (api as any).organLogistics?.logisticsOrchestrator?.updateTransportStatus
    )
    const reportDelayMutation = useMutation(
        (api as any).organLogistics?.logisticsOrchestrator?.reportTransportDelay
    )
    const acknowledgeAlertMutation = useMutation(
        (api as any).organLogistics?.logisticsOrchestrator?.acknowledgeLogisticsAlert
    )

    // Step 7 CV & OCR verification queries & actions
    const verificationRequests = useQuery(
        (api as any).verification?.verificationService?.getAllVerificationRequests,
        {}
    ) || []

    const selectedVerificationRequest = useQuery(
        (api as any).verification?.verificationService?.getVerificationRequestById,
        selectedVerificationId ? { verificationRequestId: selectedVerificationId } : "skip"
    )

    const createVerificationRequestMutation = useMutation(
        (api as any).verification?.verificationService?.createVerificationRequest
    )
    const runVerificationAction = useAction(
        (api as any).verification?.actions?.runVerificationAction
    )
    const submitHumanReviewMutation = useMutation(
        (api as any).verification?.verificationService?.submitHumanReview
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

    // Step 6 Logistics Actions
    const handleInitiateTransport = async (allocationId: string) => {
        setIsCreatingTransport(true)
        try {
            const result = await createTransportPlanAction({ allocationId })
            alert(`Transport Plan created! Generated ${result.optionsGenerated} multi-modal route options.`)
            setSelectedTransportId(result.transportRequestId)
            setActiveTab("logistics")
        } catch (err: any) {
            alert(err?.message || "Failed to initialize transport plan.")
        } finally {
            setIsCreatingTransport(false)
        }
    }

    const handleAssignCarrier = async (optionId: string, defaultCarrier: string) => {
        if (!selectedTransportId) return
        const carrier = prompt("Confirm assigned medical transport carrier:", defaultCarrier)
        if (!carrier) return

        try {
            await assignTransportMutation({
                transportRequestId: selectedTransportId as any,
                transportOptionId: optionId as any,
                assignedCarrier: carrier,
            })
            alert("Transport option assigned and status advanced to ASSIGNED.")
        } catch (err: any) {
            alert(err?.message || "Failed to assign transport carrier.")
        }
    }

    const handleUpdateMilestone = async (targetStatus: any, defaultLocation: string) => {
        if (!selectedTransportId) return
        const location = prompt("Enter verified milestone location:", defaultLocation)
        if (!location) return

        try {
            await updateTransportStatusMutation({
                transportRequestId: selectedTransportId as any,
                targetStatus,
                locationDescription: location,
            })
            alert(`Transport progress updated: status is now ${targetStatus}.`)
        } catch (err: any) {
            alert(err?.message || "Failed to update transport progress.")
        }
    }

    const handleReportDelay = async () => {
        if (!selectedTransportId) return
        const minutesStr = prompt("Enter delay in minutes from planned schedule:", "35")
        if (!minutesStr) return
        const delayMinutes = parseInt(minutesStr, 10)
        if (isNaN(delayMinutes) || delayMinutes <= 0) return

        const reason = prompt("Enter operational reason for delay:", "Air traffic ground hold / Adverse weather")
        if (!reason) return

        try {
            const res = await reportDelayMutation({
                transportRequestId: selectedTransportId as any,
                delayMinutes,
                reason,
            })
            if (res.isCriticalToDeadline) {
                alert(`WARNING: Delay of ${delayMinutes} mins threatens preservation deadline! Critical alert dispatched to coordinator.`)
            } else {
                alert(`Transport delay of ${delayMinutes} mins recorded and schedule updated.`)
            }
        } catch (err: any) {
            alert(err?.message || "Failed to report transport delay.")
        }
    }

    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            await acknowledgeAlertMutation({ alertId: alertId as any })
            alert("Logistics alert acknowledged.")
        } catch (err: any) {
            alert(err?.message || "Failed to acknowledge alert.")
        }
    }

    // Step 7 CV & OCR Verification Actions
    const handleInitiateScan = async (organ: any, scenario: "MATCH" | "MISMATCH" | "BLURRY") => {
        setIsScanning(true)
        try {
            let labelText = `VEINLINK ORGAN SPECIMEN LABEL\nIdentifier: ${organ._id.substring(0, 10)}\nOrgan Type: ${organ.organType}\nBlood Group: ${organ.bloodType}\nFacility: ${organ.currentFacilityId}`
            if (scenario === "MISMATCH") {
                labelText = `VEINLINK ORGAN SPECIMEN LABEL\nIdentifier: ${organ._id.substring(0, 10)}\nOrgan Type: ${organ.organType}\nBlood Group: AB+\nFacility: ${organ.currentFacilityId}`
            } else if (scenario === "BLURRY") {
                labelText = `BLURRY UNREADABLE SPECIMEN SCAN`
            }

            const reqId = await createVerificationRequestMutation({
                entityType: "ORGAN",
                entityId: organ._id,
                verificationType: "ORGAN_IDENTIFIER_VERIFICATION",
                imageReference: labelText,
                authoritativeSnapshot: {
                    identifier: organ._id.substring(0, 10),
                    organ_type: organ.organType,
                    blood_group: organ.bloodType,
                    facility: organ.currentFacilityId,
                },
            })

            setSelectedVerificationId(reqId)
            const result = await runVerificationAction({ verificationRequestId: reqId })
            alert(`OCR & Vision analysis complete: ${result.comparisonStatus} (Confidence: ${Math.round(result.confidence * 100)}%)`)
            setActiveTab("verification")
        } catch (err: any) {
            alert(err?.message || "Failed to process verification scan.")
        } finally {
            setIsScanning(false)
        }
    }

    const handleSubmitVerificationReview = async (decision: "VERIFIED" | "REJECTED" | "RETRY_REQUESTED") => {
        if (!selectedVerificationId) return
        const reason = prompt(
            `Enter clinical verification notes for decision [${decision}]:`,
            decision === "VERIFIED" ? "Visual inspection confirms physical package label matches digital record." : "Field discrepancy confirmed by coordinator."
        )
        if (!reason) return

        try {
            await submitHumanReviewMutation({
                verificationRequestId: selectedVerificationId as any,
                decision,
                reason,
            })
            alert(`Verification decision [${decision}] recorded in permanent audit trail.`)
        } catch (err: any) {
            alert(err?.message || "Failed to submit verification review.")
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
                    Multi-objective optimization, candidate recommendations, time-critical logistics, and physical-to-digital CV verification.
                </p>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Available Organs</CardTitle>
                        <Heart className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {inventory.filter((o: any) => o.status === "AVAILABLE").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Viable preservation window</p>
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
                        <p className="text-xs text-muted-foreground">Active candidates</p>
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
                        <p className="text-xs text-muted-foreground">Matching in progress</p>
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
                        <p className="text-xs text-muted-foreground">Coordinator approved</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Physical Verifications</CardTitle>
                        <Scan className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {verificationRequests.filter((v: any) => v.status === "VERIFIED").length}
                        </div>
                        <p className="text-xs text-muted-foreground">CV/OCR verified items</p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-7 w-full max-w-5xl">
                    <TabsTrigger value="inventory" className="flex items-center gap-1.5">
                        <Heart className="h-4 w-4" />
                        <span>Inventory</span>
                    </TabsTrigger>
                    <TabsTrigger value="matches" className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span>Matches</span>
                    </TabsTrigger>
                    <TabsTrigger value="allocations" className="flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-purple-500" />
                        <span>Allocations</span>
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-500" />
                        <span>Logistics</span>
                    </TabsTrigger>
                    <TabsTrigger value="verification" className="flex items-center gap-1.5">
                        <Scan className="h-4 w-4 text-cyan-500" />
                        <span>Verification</span>
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
                                Tracked organs with active preservation clocks. Run matching, optimize allocation, or scan physical label.
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
                                                                <Scale className="h-3.5 w-3.5 mr-1" /> Optimize
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-cyan-500 border-cyan-500 hover:bg-cyan-500/10"
                                                        onClick={() => handleInitiateScan(organ, "MATCH")}
                                                        disabled={isScanning}
                                                    >
                                                        <Scan className="h-3.5 w-3.5 mr-1" /> Verify Label
                                                    </Button>
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

                {/* Tab 3: Allocations Review & Governance */}
                <TabsContent value="allocations" className="space-y-4">
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
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Authorized Allocation Records with Dispatch Action */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Authorized Allocation Records</CardTitle>
                            <CardDescription>
                                Immutable history of coordinator-authorized organ allocations with dispatch handoff.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Audit Reference</TableHead>
                                        <TableHead>Organ ID</TableHead>
                                        <TableHead>Decision</TableHead>
                                        <TableHead>Justification</TableHead>
                                        <TableHead>Approved At</TableHead>
                                        <TableHead className="text-right">Logistics Dispatch</TableHead>
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
                                                <TableCell className="text-right">
                                                    {alloc.decisionStatus === "APPROVED" && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={() => handleInitiateTransport(alloc._id)}
                                                            disabled={isCreatingTransport}
                                                        >
                                                            <Truck className="h-3.5 w-3.5 mr-1" /> Dispatch Logistics
                                                        </Button>
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

                {/* Tab 4: Logistics & Transport */}
                <TabsContent value="logistics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-emerald-500" />
                                <span>Active Organ Transports & Route Intelligence</span>
                            </CardTitle>
                            <CardDescription>
                                Continuous cold ischemia countdown, multi-modal route feasibility, and milestone tracking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tracking Code</TableHead>
                                        <TableHead>Organ ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Preservation Window</TableHead>
                                        <TableHead>Risk Level</TableHead>
                                        <TableHead>Feasibility</TableHead>
                                        <TableHead className="text-right">Coordinator Control</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transportRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No active organ transport requests found. Dispatch a transport plan from the <strong>Allocations</strong> tab.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transportRequests.map((tr: any) => (
                                            <TableRow
                                                key={tr._id}
                                                className={selectedTransportId === tr._id ? "bg-muted/40 cursor-pointer" : "cursor-pointer"}
                                                onClick={() => setSelectedTransportId(tr._id)}
                                            >
                                                <TableCell className="font-mono text-xs font-semibold text-emerald-500">
                                                    {tr.trackingCode}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{tr.organId.substring(0, 8)}...</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            tr.status === "IN_TRANSIT"
                                                                ? "default"
                                                                : tr.status === "CONFIRMED"
                                                                ? "secondary"
                                                                : tr.status === "DELAYED"
                                                                ? "destructive"
                                                                : "outline"
                                                        }
                                                    >
                                                        {tr.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {formatRemainingPreservation(tr.preservationDeadline)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            tr.riskLevel === "LOW"
                                                                ? "outline"
                                                                : tr.riskLevel === "MODERATE"
                                                                ? "secondary"
                                                                : "destructive"
                                                        }
                                                    >
                                                        {tr.riskLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={tr.feasibility === "FEASIBLE" ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>
                                                        {tr.feasibility}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedTransportId(tr._id)}
                                                    >
                                                        Inspect
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Transport Detail Panel */}
                    {selectedTransportId && transportDetails && (
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <span>Multi-Modal Route Options</span>
                                        </CardTitle>
                                        <Badge variant="outline">SIMULATION</Badge>
                                    </div>
                                    <CardDescription>
                                        Evaluated transport modes against remaining cold ischemia clock.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {transportDetails.options.map((opt: any) => (
                                        <div
                                            key={opt._id}
                                            className={`p-3 rounded-lg border flex items-center justify-between ${
                                                opt.isRecommended ? "border-emerald-500/60 bg-emerald-500/5" : "border-border"
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {opt.mode === "AIR_CHARTER" ? (
                                                        <Plane className="h-4 w-4 text-blue-500" />
                                                    ) : (
                                                        <Truck className="h-4 w-4 text-emerald-500" />
                                                    )}
                                                    <span className="font-semibold text-sm">{opt.provider}</span>
                                                    {opt.isRecommended && (
                                                        <Badge className="bg-emerald-600 text-white text-[10px]">
                                                            RECOMMENDED
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Duration: ~{opt.estimatedDurationMinutes} mins | Safety Buffer: {opt.safetyBufferMinutes} mins
                                                </p>
                                            </div>
                                            {transportDetails.transport.status === "READY" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-primary text-primary-foreground"
                                                    onClick={() => handleAssignCarrier(opt._id, opt.provider)}
                                                >
                                                    Assign
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    <div className="pt-3 border-t space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Coordinator Milestone Updates
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {transportDetails.transport.status === "ASSIGNED" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateMilestone("PICKUP_PENDING", "Donor Hospital Operating Room")}
                                                >
                                                    Mark Pickup Started
                                                </Button>
                                            )}
                                            {transportDetails.transport.status === "PICKUP_PENDING" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => handleUpdateMilestone("IN_TRANSIT", "En Route via Medical Transit Corridor")}
                                                >
                                                    Mark In Transit
                                                </Button>
                                            )}
                                            {(transportDetails.transport.status === "IN_TRANSIT" || transportDetails.transport.status === "DELAYED") && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        onClick={() => handleUpdateMilestone("ARRIVED", "Destination Hospital Arrival Bay")}
                                                    >
                                                        Mark Arrived
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-amber-500 border-amber-500 hover:bg-amber-500/10"
                                                        onClick={handleReportDelay}
                                                    >
                                                        <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Report Delay
                                                    </Button>
                                                </>
                                            )}
                                            {transportDetails.transport.status === "ARRIVED" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => handleUpdateMilestone("DELIVERED", "Transplant Surgical Suite")}
                                                >
                                                    Mark Delivered
                                                </Button>
                                            )}
                                            {transportDetails.transport.status === "DELIVERED" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                                    onClick={() => handleUpdateMilestone("CONFIRMED", "Recipient Surgeon Handover Complete")}
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Handover
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span>Verified Transport Timeline</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Immutable chronological record of logistics dispatch events.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {transportDetails.alerts.length > 0 && (
                                        <div className="space-y-2">
                                            {transportDetails.alerts.map((al: any) => (
                                                <div
                                                    key={al._id}
                                                    className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                                                        al.severity === "CRITICAL"
                                                            ? "bg-red-500/10 border-red-500 text-red-500"
                                                            : "bg-amber-500/10 border-amber-500 text-amber-500"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <AlertOctagon className="h-4 w-4 shrink-0" />
                                                        <span>{al.message}</span>
                                                    </div>
                                                    {al.status === "ACTIVE" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[11px]"
                                                            onClick={() => handleAcknowledgeAlert(al._id)}
                                                        >
                                                            Acknowledge
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {transportDetails.events.map((ev: any) => (
                                            <div key={ev._id} className="flex items-start gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1">
                                                <div className="font-mono text-muted-foreground shrink-0">
                                                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{ev.eventType}</p>
                                                    <p className="text-muted-foreground">{ev.locationDescription}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* Tab 5: Verification Center (Step 7 Core UI) */}
                <TabsContent value="verification" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Scan className="h-5 w-5 text-cyan-500" />
                                        <span>Physical-to-Digital Verification Center</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Computer vision and OCR verification cross-referencing physical labels with authoritative records.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Selected Verification Request Inspector */}
                            {selectedVerificationRequest ? (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{selectedVerificationRequest.verificationType}</Badge>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    Request ID: {selectedVerificationRequest._id.substring(0, 10)}...
                                                </span>
                                            </div>
                                            <Badge
                                                variant={
                                                    selectedVerificationRequest.status === "VERIFIED"
                                                        ? "default"
                                                        : selectedVerificationRequest.status === "REJECTED"
                                                        ? "destructive"
                                                        : "secondary"
                                                }
                                            >
                                                {selectedVerificationRequest.status}
                                            </Badge>
                                        </div>

                                        {/* Side-by-Side Comparison */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-3.5 rounded border bg-card space-y-2 text-xs">
                                                <div className="font-semibold text-sm flex items-center gap-1.5 text-primary">
                                                    <ShieldCheck className="h-4 w-4" /> Authoritative Digital Record
                                                </div>
                                                <div className="space-y-1 text-muted-foreground pt-1">
                                                    <div><strong>Identifier:</strong> {selectedVerificationRequest.authoritativeSnapshot?.identifier || "N/A"}</div>
                                                    <div><strong>Organ Type:</strong> {selectedVerificationRequest.authoritativeSnapshot?.organ_type || "N/A"}</div>
                                                    <div><strong>Blood Group:</strong> {selectedVerificationRequest.authoritativeSnapshot?.blood_group || "N/A"}</div>
                                                    <div><strong>Facility:</strong> {selectedVerificationRequest.authoritativeSnapshot?.facility || "N/A"}</div>
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded border bg-card space-y-2 text-xs">
                                                <div className="font-semibold text-sm flex items-center justify-between text-cyan-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Scan className="h-4 w-4" /> Extracted Physical Label
                                                    </span>
                                                    {selectedVerificationRequest.extractedData?.confidence && (
                                                        <Badge variant="outline">
                                                            OCR: {Math.round(selectedVerificationRequest.extractedData.confidence * 100)}%
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-muted-foreground pt-1">
                                                    <div><strong>Identifier:</strong> {selectedVerificationRequest.extractedData?.fields?.identifier || "N/A"}</div>
                                                    <div><strong>Organ Type:</strong> {selectedVerificationRequest.extractedData?.fields?.organ_type || "N/A"}</div>
                                                    <div><strong>Blood Group:</strong> {selectedVerificationRequest.extractedData?.fields?.blood_group || "N/A"}</div>
                                                    <div><strong>Barcode:</strong> {selectedVerificationRequest.extractedData?.fields?.barcode || "N/A"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comparison Verdict & Explanation */}
                                        {selectedVerificationRequest.comparisonResult && (
                                            <div className={`p-3 rounded border text-xs space-y-1 ${
                                                selectedVerificationRequest.comparisonResult.status === "MATCH"
                                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                                                    : selectedVerificationRequest.comparisonResult.status === "MISMATCH"
                                                    ? "bg-red-500/10 border-red-500 text-red-500"
                                                    : "bg-amber-500/10 border-amber-500 text-amber-500"
                                            }`}>
                                                <div className="font-semibold flex items-center gap-1.5">
                                                    <span>Verdict: {selectedVerificationRequest.comparisonResult.status}</span>
                                                </div>
                                                <p>{selectedVerificationRequest.comparisonResult.explanation}</p>
                                                {selectedVerificationRequest.comparisonResult.mismatches?.length > 0 && (
                                                    <div className="pt-2 space-y-1">
                                                        {selectedVerificationRequest.comparisonResult.mismatches.map((m: any, idx: number) => (
                                                            <div key={idx}>
                                                                ⚠ Discrepancy on <strong>{m.field}</strong>: Expected [{m.expected}], Observed [{m.observed}] ({m.severity})
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Coordinator Action Buttons */}
                                        <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSubmitVerificationReview("RETRY_REQUESTED")}
                                            >
                                                Request Re-scan
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-500 border-red-500 hover:bg-red-500/10"
                                                onClick={() => handleSubmitVerificationReview("REJECTED")}
                                            >
                                                <XCircle className="h-3.5 w-3.5 mr-1" /> Flag Mismatch / Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => handleSubmitVerificationReview("VERIFIED")}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Verification
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <Scan className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                                    <p>Select a verification request from the history table below, or click <strong>Verify Label</strong> on an organ in Inventory.</p>
                                </div>
                            )}

                            {/* Verification History Table */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold">Verification Audit Records</h4>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Entity ID</TableHead>
                                                <TableHead>Verification Type</TableHead>
                                                <TableHead>Comparison Verdict</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Reviewer</TableHead>
                                                <TableHead>Created At</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {verificationRequests.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                                        No verification records yet. Run a label scan from the Inventory tab.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                verificationRequests.map((vr: any) => (
                                                    <TableRow
                                                        key={vr._id}
                                                        className={selectedVerificationId === vr._id ? "bg-muted/40 cursor-pointer" : "cursor-pointer"}
                                                        onClick={() => setSelectedVerificationId(vr._id)}
                                                    >
                                                        <TableCell className="font-mono text-xs">{vr.entityId.substring(0, 10)}...</TableCell>
                                                        <TableCell className="text-xs">{vr.verificationType}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    vr.comparisonResult?.status === "MATCH"
                                                                        ? "default"
                                                                        : vr.comparisonResult?.status === "MISMATCH"
                                                                        ? "destructive"
                                                                        : "secondary"
                                                                }
                                                            >
                                                                {vr.comparisonResult?.status || "PENDING"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{vr.status}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {vr.reviewedBy || "Unreviewed"}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {new Date(vr.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setSelectedVerificationId(vr._id)}
                                                            >
                                                                Inspect
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 6: Recipients */}
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

                {/* Tab 7: Organ Requests */}
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
