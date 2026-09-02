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
} from "lucide-react"

export default function HospitalOrgansPage() {
    const [activeTab, setActiveTab] = useState("inventory")
    const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null)
    const [isMatchingRunning, setIsMatchingRunning] = useState(false)

    const inventory = useQuery((api as any).organInventory?.getAllOrganInventory, {}) || []
    const recipients = useQuery((api as any).recipients?.getAllRecipients, {}) || []
    const requests = useQuery((api as any).organRequests?.getAllOrganRequests, {}) || []
    const allocations = useQuery((api as any).organAllocations?.getAllocations, {}) || []

    const selectedMatches = useQuery(
        (api as any).organMatching?.getMatchesByOrgan,
        selectedOrganId ? { organId: selectedOrganId } : "skip"
    ) || []

    const runMatchingAction = useAction((api as any).organMatching?.actions?.runOrganMatching)
    const submitAllocationReviewMutation = useMutation(
        (api as any).organAllocations?.submitAllocationReview
    )
    const approveAllocationMutation = useMutation((api as any).organAllocations?.approveAllocation)
    const rejectAllocationMutation = useMutation((api as any).organAllocations?.rejectAllocation)

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

    const handleSelectForAllocationReview = async (match: any) => {
        const reason = prompt(
            "Enter preliminary clinical reason to advance candidate to allocation review:",
            "High priority matching candidate meeting clinical feasibility criteria."
        )
        if (!reason) return

        try {
            await submitAllocationReviewMutation({
                organId: match.organId,
                recipientId: match.recipientId,
                requestId: match.requestId,
                matchId: match._id,
                proposedReason: reason,
            })
            alert("Candidate advanced to Allocation Review. Organ placed in MATCHING review state.")
            setActiveTab("allocations")
        } catch (err: any) {
            alert(err?.message || "Failed to submit for allocation review.")
        }
    }

    const handleApprove = async (allocationId: string) => {
        const reason = prompt("Enter clinical justification for allocation approval:")
        if (!reason) return
        try {
            await approveAllocationMutation({
                allocationId: allocationId as any,
                clinicalJustification: reason,
            })
            alert("Allocation approved successfully. Organ allocated.")
        } catch (err: any) {
            alert(err?.message || "Failed to approve allocation.")
        }
    }

    const handleReject = async (allocationId: string) => {
        const reason = prompt("Enter clinical reason for rejecting allocation:")
        if (!reason) return
        try {
            await rejectAllocationMutation({
                allocationId: allocationId as any,
                rejectionReason: reason,
            })
            alert("Allocation rejected. Organ returned to available pool.")
        } catch (err: any) {
            alert(err?.message || "Failed to reject allocation.")
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
                    Multi-factor compatibility evaluation, candidate recommendation ranking, and authorized human governance.
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
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {allocations.filter((a: any) => a.decisionStatus === "PENDING_HUMAN_APPROVAL").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting human coordinator review</p>
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
                    <TabsTrigger value="recipients" className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>Recipients</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-1.5">
                        <GitPullRequest className="h-4 w-4" />
                        <span>Requests</span>
                    </TabsTrigger>
                    <TabsTrigger value="allocations" className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Allocations</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Organ Inventory */}
                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identified & Available Organs</CardTitle>
                            <CardDescription>
                                Tracked organs with active preservation clocks. Run the matching engine to rank eligible recipient candidates.
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
                                        <TableHead className="text-right">Action</TableHead>
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
                                                <TableCell className="text-right">
                                                    {(organ.status === "AVAILABLE" || organ.status === "MATCHING") && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                            onClick={() => handleRunMatching(organ._id)}
                                                        >
                                                            <Sparkles className="h-3.5 w-3.5 mr-1" /> Find Matches
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

                {/* Tab 2: Candidate Matches (Step 4 Core UI) */}
                <TabsContent value="matches" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recommended Candidate Matches</CardTitle>
                                    <CardDescription>
                                        Policy-constrained candidate ranking with deterministic explanations. (Recommendations only — does not allocate).
                                    </CardDescription>
                                </div>
                                {selectedOrganId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRunMatching(selectedOrganId)}
                                        disabled={isMatchingRunning}
                                    >
                                        {isMatchingRunning ? "Analyzing..." : "Re-evaluate Matching"}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!selectedOrganId ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                    <p>Select an available organ from the <strong>Inventory</strong> tab to evaluate and rank candidate matches.</p>
                                </div>
                            ) : isMatchingRunning ? (
                                <div className="text-center py-12 text-muted-foreground animate-pulse">
                                    Evaluating hard constraints, calculating multi-factor scores, and consulting ML layer...
                                </div>
                            ) : selectedMatches.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <AlertTriangle className="h-10 w-10 mx-auto text-amber-500/50 mb-3" />
                                    <p className="font-medium text-foreground">No eligible candidates passed hard constraints.</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Check organ type requisitions, active request statuses, and clinical verification states.
                                    </p>
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
                                                                Candidate Recipient: {match.recipientId.substring(0, 10)}...
                                                            </span>
                                                            <Badge variant="outline">
                                                                Score: {Math.round(match.score * 100)}%
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {match.dataConfidence || "HIGH"} Confidence
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-foreground/90 font-medium mt-1">
                                                            {match.explanation}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                                                        onClick={() => handleSelectForAllocationReview(match)}
                                                    >
                                                        Advance to Review <ArrowRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </div>

                                                {/* Factors & Warnings */}
                                                <div className="mt-4 grid md:grid-cols-2 gap-3 pt-3 border-t text-xs">
                                                    <div>
                                                        <span className="font-semibold text-muted-foreground block mb-1">
                                                            Evaluation Factors:
                                                        </span>
                                                        <ul className="space-y-0.5 text-muted-foreground">
                                                            <li>• Distance: {Math.round(match.compatibilitySummary.distanceKm)} km</li>
                                                            <li>• Blood Match: {match.compatibilitySummary.bloodCompatibility ? "Compatible" : "Incompatible"}</li>
                                                            <li>• Policy: {match.policyVersion || "2026.1-NATIONAL-POLICY"}</li>
                                                            <li>• Algorithm: {match.algorithmVersion || "1.0.0-DETERMINISTIC"}</li>
                                                        </ul>
                                                    </div>

                                                    {match.warnings && match.warnings.length > 0 && (
                                                        <div>
                                                            <span className="font-semibold text-amber-500 block mb-1">
                                                                Clinical & Logistical Warnings:
                                                            </span>
                                                            <ul className="space-y-0.5 text-amber-500/90">
                                                                {match.warnings.map((w: string, i: number) => (
                                                                    <li key={i}>{w}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Recipients */}
                <TabsContent value="recipients" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transplant Waitlist Candidates</CardTitle>
                            <CardDescription>
                                Verified recipients waiting for compatible organ matches.
                            </CardDescription>
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

                {/* Tab 4: Organ Requests */}
                <TabsContent value="requests" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transplant Center Requests</CardTitle>
                            <CardDescription>
                                Clinical organ requests initiated by accredited transplant centers.
                            </CardDescription>
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

                {/* Tab 5: Allocations */}
                <TabsContent value="allocations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Human Governance & Allocation Approvals</CardTitle>
                            <CardDescription>
                                Formal decisions assigning organs to recipients. Requires authorized human coordinator justification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organ ID</TableHead>
                                        <TableHead>Recipient ID</TableHead>
                                        <TableHead>Decision Status</TableHead>
                                        <TableHead>Audit Reference</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allocations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No allocation reviews pending.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        allocations.map((alloc: any) => (
                                            <TableRow key={alloc._id}>
                                                <TableCell className="font-mono text-xs">{alloc.organId}</TableCell>
                                                <TableCell className="font-mono text-xs">{alloc.recipientId}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            alloc.decisionStatus === "APPROVED"
                                                                ? "default"
                                                                : alloc.decisionStatus === "REJECTED"
                                                                ? "destructive"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {alloc.decisionStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {alloc.auditReference}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {alloc.decisionStatus === "PENDING_HUMAN_APPROVAL" ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => handleApprove(alloc._id)}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-500 border-red-500 hover:bg-red-500/10"
                                                                onClick={() => handleReject(alloc._id)}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" /> Reject
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            {alloc.decisionReason}
                                                        </span>
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
            </Tabs>
        </div>
    )
}
