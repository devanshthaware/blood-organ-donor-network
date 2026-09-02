"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
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
} from "lucide-react"
import { ORGAN_TYPES } from "@/lib/domain-types"

export default function HospitalOrgansPage() {
    const [activeTab, setActiveTab] = useState("inventory")

    const inventory = useQuery((api as any).organInventory?.getAllOrganInventory, {}) || []
    const recipients = useQuery((api as any).recipients?.getAllRecipients, {}) || []
    const requests = useQuery((api as any).organRequests?.getAllOrganRequests, {}) || []
    const allocations = useQuery((api as any).organAllocations?.getAllocations, {}) || []

    const approveAllocationMutation = useMutation((api as any).organAllocations?.approveAllocation)
    const rejectAllocationMutation = useMutation((api as any).organAllocations?.rejectAllocation)

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
                    Manage organ inventory, recipient candidate waitlists, transplant requests, and authorized allocations.
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
                        <p className="text-xs text-muted-foreground">Verified in preservation window</p>
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
                <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                    <TabsTrigger value="inventory" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>Organ Inventory</span>
                    </TabsTrigger>
                    <TabsTrigger value="recipients" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Recipients</span>
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4" />
                        <span>Organ Requests</span>
                    </TabsTrigger>
                    <TabsTrigger value="allocations" className="flex items-center gap-2">
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
                                Organs currently tracked in the network with active cold ischemia preservation clocks.
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
                                        <TableHead>Current Facility</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Recipients */}
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

                {/* Tab 3: Organ Requests */}
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

                {/* Tab 4: Allocations */}
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
