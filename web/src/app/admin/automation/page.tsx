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
    Activity,
    AlertOctagon,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Flame,
    GitCommit,
    Layers,
    Play,
    RefreshCw,
    Repeat,
    RotateCcw,
    Send,
    Server,
    ShieldAlert,
    Sliders,
    Zap,
} from "lucide-react"

export default function AutomationMonitorPage() {
    const [activeTab, setActiveTab] = useState("events")
    const [isSimulating, setIsSimulating] = useState(false)

    // Convex queries
    const domainEvents = useQuery((api as any).n8n?.workflowReceiver?.getAllDomainEvents, { limit: 100 }) || []
    const workflowExecutions = useQuery((api as any).n8n?.workflowReceiver?.getWorkflowExecutions, {}) || []
    const workflowEscalations = useQuery((api as any).n8n?.workflowReceiver?.getWorkflowEscalations, {}) || []

    // Mutations
    const publishDomainEventMutation = useMutation((api as any).n8n?.eventPublisher?.publishDomainEvent)
    const acknowledgeEscalationMutation = useMutation((api as any).n8n?.workflowReceiver?.acknowledgeEscalation)
    const resolveEscalationMutation = useMutation((api as any).n8n?.workflowReceiver?.resolveEscalation)
    const replayEventMutation = useMutation((api as any).n8n?.workflowReceiver?.replayDomainEvent)

    // Metrics computation
    const completedExecutions = workflowExecutions.filter((e: any) => e.status === "COMPLETED").length
    const deadLetterExecutions = workflowExecutions.filter((e: any) => e.status === "DEAD_LETTER").length
    const activeEscalations = workflowEscalations.filter((e: any) => e.status === "ACTIVE").length

    const handleAcknowledge = async (escalationId: string) => {
        try {
            await acknowledgeEscalationMutation({ escalationId })
            alert("Escalation acknowledged.")
        } catch (err: any) {
            alert(err?.message || "Failed to acknowledge escalation.")
        }
    }

    const handleResolve = async (escalationId: string) => {
        try {
            await resolveEscalationMutation({ escalationId })
            alert("Escalation marked as resolved.")
        } catch (err: any) {
            alert(err?.message || "Failed to resolve escalation.")
        }
    }

    const handleReplay = async (eventId: string) => {
        try {
            await replayEventMutation({ eventId })
            alert(`Authorized event replay initiated for: ${eventId}`)
        } catch (err: any) {
            alert(err?.message || "Failed to replay event.")
        }
    }

    const handleSimulateEvent = async (scenario: "SHORTAGE" | "ORGAN_AVAILABLE" | "DELAY" | "CV_MISMATCH") => {
        setIsSimulating(true)
        try {
            let eventType = "blood.inventory.critical"
            let aggregateType = "bloodInventory"
            let aggregateId = "BLD-INV-O-NEG"
            let payload: any = { bloodType: "O-", currentUnits: 1, threshold: 5, facilityId: "HOSP-METRO" }

            if (scenario === "ORGAN_AVAILABLE") {
                eventType = "organ.available"
                aggregateType = "organ"
                aggregateId = "ORG-2026-99"
                payload = { organType: "KIDNEY", bloodType: "O-", donorHospital: "General Hospital" }
            } else if (scenario === "DELAY") {
                eventType = "transport.delay.detected"
                aggregateType = "transport"
                aggregateId = "TR-2026-88"
                payload = { delayMinutes: 45, reason: "Severe fog & air-corridor hold", isCriticalToDeadline: true }
            } else if (scenario === "CV_MISMATCH") {
                eventType = "verification.mismatch.detected"
                aggregateType = "verification"
                aggregateId = "VR-2026-77"
                payload = {
                    mismatches: [
                        { field: "blood_group", expected: "O-", observed: "AB+", severity: "CRITICAL" }
                    ]
                }
            }

            const res = await publishDomainEventMutation({
                eventType,
                aggregateType,
                aggregateId,
                payload,
                actorType: "admin",
            })

            alert(`Simulated domain event [${eventType}] emitted!\nEvent ID: ${res.eventId}`)
        } catch (err: any) {
            alert(err?.message || "Simulation failed.")
        } finally {
            setIsSimulating(false)
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <div className="flex items-center gap-2">
                    <Zap className="h-7 w-7 text-amber-500 fill-amber-500/20" />
                    <h2 className="text-3xl font-bold tracking-tight">n8n Workflow Automation Monitor</h2>
                </div>
                <p className="text-muted-foreground mt-1">
                    Event-driven orchestration, domain event streams, automated escalation chains, and dead-letter queue management.
                </p>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Domain Events</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{domainEvents.length}</div>
                        <p className="text-xs text-muted-foreground">Emitted from Convex</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Completed Workflows</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedExecutions}</div>
                        <p className="text-xs text-muted-foreground">Idempotent executions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Escalations</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeEscalations}</div>
                        <p className="text-xs text-muted-foreground">Pending human review</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Dead Letter Queue</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{deadLetterExecutions}</div>
                        <p className="text-xs text-muted-foreground">&gt; 3 failed delivery retries</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">System Role</CardTitle>
                        <Server className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-bold text-primary">Orchestration</div>
                        <p className="text-xs text-muted-foreground">Convex = System of Record</p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-5 w-full max-w-4xl">
                    <TabsTrigger value="events" className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4" />
                        <span>Event Stream</span>
                    </TabsTrigger>
                    <TabsTrigger value="escalations" className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>Escalations</span>
                    </TabsTrigger>
                    <TabsTrigger value="executions" className="flex items-center gap-1.5">
                        <Play className="h-4 w-4 text-emerald-500" />
                        <span>Executions</span>
                    </TabsTrigger>
                    <TabsTrigger value="catalog" className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-blue-500" />
                        <span>Workflow Catalog</span>
                    </TabsTrigger>
                    <TabsTrigger value="simulate" className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>Simulate Events</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Domain Event Stream */}
                <TabsContent value="events" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Authoritative Domain Event Stream</CardTitle>
                            <CardDescription>
                                Immutable log of domain events emitted server-side by Convex mutations, signed with HMAC SHA-256.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event ID</TableHead>
                                        <TableHead>Event Type</TableHead>
                                        <TableHead>Aggregate</TableHead>
                                        <TableHead>Delivery Status</TableHead>
                                        <TableHead>Attempts</TableHead>
                                        <TableHead>Occurred At</TableHead>
                                        <TableHead className="text-right">Replay Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {domainEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No domain events emitted yet. Use the Simulate Events tab to generate live events.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        domainEvents.map((evt: any) => (
                                            <TableRow key={evt._id}>
                                                <TableCell className="font-mono text-xs font-semibold">{evt.eventId}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{evt.eventType}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {evt.aggregate?.type}: {evt.aggregate?.id?.substring(0, 10)}...
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            evt.deliveryStatus === "DELIVERED"
                                                                ? "default"
                                                                : evt.deliveryStatus === "DEAD_LETTER"
                                                                ? "destructive"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {evt.deliveryStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">{evt.deliveryAttempts}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(evt.occurredAt).toLocaleTimeString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleReplay(evt.eventId)}
                                                    >
                                                        <RotateCcw className="h-3 w-3 mr-1" /> Replay
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

                {/* Tab 2: Workflow Escalations */}
                <TabsContent value="escalations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Healthcare Operational Escalations</CardTitle>
                            <CardDescription>
                                Unresolved alarms escalated by n8n workflows requiring clinical or logistical coordinator review.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Escalation ID</TableHead>
                                        <TableHead>Workflow</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Entity</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Assigned Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Coordinator Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workflowEscalations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No active workflow escalations recorded.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        workflowEscalations.map((esc: any) => (
                                            <TableRow key={esc._id}>
                                                <TableCell className="font-mono text-xs font-semibold">{esc.escalationId}</TableCell>
                                                <TableCell className="text-xs">{esc.workflowName}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            esc.severity === "CRITICAL"
                                                                ? "destructive"
                                                                : esc.severity === "HIGH"
                                                                ? "secondary"
                                                                : "outline"
                                                        }
                                                    >
                                                        {esc.severity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">{esc.entityId}</TableCell>
                                                <TableCell className="text-xs max-w-xs truncate">{esc.reason}</TableCell>
                                                <TableCell className="text-xs font-medium">{esc.assignedRole}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{esc.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    {esc.status === "ACTIVE" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs"
                                                            onClick={() => handleAcknowledge(esc.escalationId)}
                                                        >
                                                            Acknowledge
                                                        </Button>
                                                    )}
                                                    {esc.status !== "RESOLVED" && (
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={() => handleResolve(esc.escalationId)}
                                                        >
                                                            Resolve
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

                {/* Tab 3: Workflow Executions */}
                <TabsContent value="executions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Idempotent Workflow Execution History</CardTitle>
                            <CardDescription>
                                Tracked n8n workflow executions with idempotency key enforcement and retry monitoring.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Execution ID</TableHead>
                                        <TableHead>Workflow</TableHead>
                                        <TableHead>Event ID</TableHead>
                                        <TableHead>Idempotency Key</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Attempts</TableHead>
                                        <TableHead>Actions Recorded</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workflowExecutions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No executions recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        workflowExecutions.map((ex: any) => (
                                            <TableRow key={ex._id}>
                                                <TableCell className="font-mono text-xs">{ex.executionId}</TableCell>
                                                <TableCell className="text-xs font-semibold">{ex.workflowName}</TableCell>
                                                <TableCell className="font-mono text-xs">{ex.eventId}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                                                    {ex.idempotencyKey}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            ex.status === "COMPLETED"
                                                                ? "default"
                                                                : ex.status === "DEAD_LETTER"
                                                                ? "destructive"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {ex.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">{ex.attemptCount}</TableCell>
                                                <TableCell className="text-xs">{ex.actionsTaken?.length ?? 0} steps</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: Workflow Catalog */}
                <TabsContent value="catalog" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-red-500" />
                                    <span>Workflow #1: Critical Blood Shortage</span>
                                </CardTitle>
                                <CardDescription>Trigger: blood.inventory.low / critical</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Evaluates reserve thresholds and routes urgent alerts to blood-bank coordinators.</p>
                                <p><strong>Target Roles:</strong> Regional Blood Bank Coordinator, Hospital Transfusion Lead.</p>
                                <p><strong>Safety Invariant:</strong> Convex remains authoritative on blood reserves and unit release.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <span>Workflow #2: Emergency Blood Request</span>
                                </CardTitle>
                                <CardDescription>Trigger: emergency.request.created</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Queries Convex matching engine to broadcast targeted alerts to nearby donors within 15km.</p>
                                <p><strong>Target Roles:</strong> Verified compatible donors, on-call transfusion officer.</p>
                                <p><strong>Safety Invariant:</strong> n8n never determines donor eligibility; uses Convex compatibility engine.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Workflow #3: Organ Available & Review</span>
                                </CardTitle>
                                <CardDescription>Trigger: organ.available</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Initiates matching and allocation optimization, creating a review task for coordinator.</p>
                                <p><strong>Target Roles:</strong> Accredited Transplant Coordinator, Surgical Lead.</p>
                                <p><strong>Safety Invariant:</strong> n8n NEVER allocates organs. Human approval is mandatory.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span>Workflow #4: Organ Preservation Warning</span>
                                </CardTitle>
                                <CardDescription>Trigger: organ.preservation.warning / critical</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Evaluates cold ischemia countdown and escalates alerts through Low to Critical tiers.</p>
                                <p><strong>Target Roles:</strong> Transplant Coordinator, Aeromedical Dispatch Crew, Chief Medical Officer.</p>
                                <p><strong>Safety Invariant:</strong> Never silently reallocates organs when preservation window changes.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlertOctagon className="h-4 w-4 text-red-500" />
                                    <span>Workflow #5: Logistics Delay Escalation</span>
                                </CardTitle>
                                <CardDescription>Trigger: transport.delay.detected</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Evaluates transit slippage against remaining cold ischemia time and alerts hospital team.</p>
                                <p><strong>Target Roles:</strong> Medical Transport Carrier, Destination Hospital Arrival Team.</p>
                                <p><strong>Safety Invariant:</strong> Preserves active allocation; routes re-routing decisions to human coordinator.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-cyan-500" />
                                    <span>Workflow #6: CV / OCR Mismatch Escalation</span>
                                </CardTitle>
                                <CardDescription>Trigger: verification.mismatch.detected</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Pauses transit/handover when physical label does not match authoritative digital record.</p>
                                <p><strong>Target Roles:</strong> Quality Assurance Coordinator, Transplant Center.</p>
                                <p><strong>Safety Invariant:</strong> OCR extractions NEVER automatically mutate database records.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Repeat className="h-4 w-4 text-purple-500" />
                                    <span>Workflow #7: Donor Follow-Up</span>
                                </CardTitle>
                                <CardDescription>Trigger: blood.donation.completed / expired</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Sends post-donation gratitude messages and schedules 56-day future eligibility reminders.</p>
                                <p><strong>Target Roles:</strong> Donors.</p>
                                <p><strong>Safety Invariant:</strong> Adheres strictly to authoritative 56-day medical cooldown state.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <GitCommit className="h-4 w-4 text-amber-500" />
                                    <span>Workflow #8: Unresolved Emergency Escalation</span>
                                </CardTitle>
                                <CardDescription>Trigger: network.escalation.triggered</CardDescription>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 text-muted-foreground">
                                <p><strong>Purpose:</strong> Escalates unfulfilled emergency blood requests to regional network operations directors.</p>
                                <p><strong>Target Roles:</strong> Network Operations Administrator, Regional Director.</p>
                                <p><strong>Safety Invariant:</strong> Preserves complete audit trail of timing and escalation decisions.</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 5: Event Simulation Panel */}
                <TabsContent value="simulate" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Healthcare Event Simulation Testing Suite</CardTitle>
                            <CardDescription>
                                Trigger realistic healthcare domain events to verify n8n dispatch, webhook HMAC validation, and escalation handling.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg border bg-card space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-red-500" /> Critical Blood Shortage Event
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Emits `blood.inventory.critical` with 1 unit remaining of O- blood. Tests coordinator alert dispatch and escalation creation.
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleSimulateEvent("SHORTAGE")}
                                    disabled={isSimulating}
                                >
                                    Emit Blood Shortage Event
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg border bg-card space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Organ Available Event
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Emits `organ.available` for verified donor kidney. Tests candidate retrieval and coordinator review task initialization.
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleSimulateEvent("ORGAN_AVAILABLE")}
                                    disabled={isSimulating}
                                >
                                    Emit Organ Available Event
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg border bg-card space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-500" /> Logistics Transit Delay Event
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Emits `transport.delay.detected` (45 min delay threatening deadline). Tests ETA recalculation and coordinator escalation.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-amber-500 border-amber-500 hover:bg-amber-500/10"
                                    onClick={() => handleSimulateEvent("DELAY")}
                                    disabled={isSimulating}
                                >
                                    Emit Transport Delay Event
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg border bg-card space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-cyan-500" /> CV / OCR Physical Discrepancy Event
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Emits `verification.mismatch.detected` (physical blood group conflict). Tests operational pause and QA coordinator escalation.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-cyan-500 border-cyan-500 hover:bg-cyan-500/10"
                                    onClick={() => handleSimulateEvent("CV_MISMATCH")}
                                    disabled={isSimulating}
                                >
                                    Emit CV Mismatch Event
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
