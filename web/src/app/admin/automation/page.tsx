"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WorkflowStatus } from "@/components/automation/WorkflowStatus"
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
    ShieldCheck,
    Sliders,
    Stethoscope,
    Truck,
    Zap,
} from "lucide-react"

export default function AutomationMonitorPage() {
    const [activeTab, setActiveTab] = useState("workflows")
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

    const handleSimulateDemo = async (demoNumber: 1 | 2 | 3 | 4) => {
        setIsSimulating(true)
        try {
            if (demoNumber === 1) {
                // DEMO 1: Blood Emergency -> Donor Matching -> Notification
                await publishDomainEventMutation({
                    eventType: "emergency.request.created",
                    aggregateType: "donationRequest",
                    aggregateId: `EMG-${Date.now().toString().slice(-4)}`,
                    payload: {
                        bloodGroup: "O-",
                        urgency: "CRITICAL",
                        facilityId: "AIIMS-TRAUMA-01",
                        unitsRequested: 4,
                        patientReference: "#P-992",
                        isDemo: true,
                    },
                    metadata: { priority: "CRITICAL", environment: "staging" },
                })
                alert("DEMO 1 Dispatched: Blood emergency coordination triggered.")
            } else if (demoNumber === 2) {
                // DEMO 2: Organ Available -> AI Candidate Ranking -> Mandatory Human Review
                await publishDomainEventMutation({
                    eventType: "organ.available",
                    aggregateType: "organ",
                    aggregateId: `ORG-KIDNEY-${Date.now().toString().slice(-4)}`,
                    payload: {
                        organType: "KIDNEY",
                        bloodType: "O+",
                        donorHospital: "Apex Transplant Center",
                        requiresHumanApproval: true,
                        isDemo: true,
                    },
                    metadata: { priority: "CRITICAL", environment: "staging" },
                })
                alert("DEMO 2 Dispatched: Organ allocation review initiated with Mandatory Human Approval.")
            } else if (demoNumber === 3) {
                // DEMO 3: Shortage Forecast -> Intelligence Alert -> Admin Notification
                await publishDomainEventMutation({
                    eventType: "network.shortage.detected",
                    aggregateType: "bloodInventory",
                    aggregateId: "REGIONAL-SUPPLY-PUNE",
                    payload: {
                        region: "West Zone",
                        predictedShortageProbability: 0.94,
                        horizonHours: 72,
                        criticalBloodGroup: "B-",
                        isDemo: true,
                    },
                    metadata: { priority: "HIGH", environment: "staging" },
                })
                alert("DEMO 3 Dispatched: Predictive shortage intelligence alert emitted.")
            } else if (demoNumber === 4) {
                // DEMO 4: Transport Delay -> Cold-Chain Alarm -> Merkle Audit
                await publishDomainEventMutation({
                    eventType: "transport.delay.detected",
                    aggregateType: "transport",
                    aggregateId: `TR-AIR-${Date.now().toString().slice(-4)}`,
                    payload: {
                        delayMinutes: 35,
                        coldChainBufferRemainingHours: 4.8,
                        reason: "Air-traffic corridor hold",
                        merkleProofRequired: true,
                        isDemo: true,
                    },
                    metadata: { priority: "HIGH", environment: "staging" },
                })
                alert("DEMO 4 Dispatched: Transport delay detected with Merkle hash integrity verification.")
            }
        } catch (err: any) {
            alert(err?.message || "Failed to emit demo event.")
        } finally {
            setIsSimulating(false)
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        n8n Automation & Workflow Observability
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Unified monitoring of the 5 canonical business workflows, HMAC webhook security, idempotency keys, and correlation tracing.
                    </p>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-border/60 bg-card/60 p-4">
                    <span className="text-xs text-muted-foreground font-medium">Domain Events Stream</span>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground mt-1">{domainEvents.length}</div>
                    <span className="text-[10px] text-muted-foreground">Immutable audit stream</span>
                </Card>

                <Card className="rounded-2xl border-border/60 bg-card/60 p-4">
                    <span className="text-xs text-muted-foreground font-medium">Workflow Executions</span>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-500 mt-1">{completedExecutions}</div>
                    <span className="text-[10px] text-muted-foreground">Successfully orchestrated</span>
                </Card>

                <Card className="rounded-2xl border-border/60 bg-card/60 p-4">
                    <span className="text-xs text-muted-foreground font-medium">Active Escalations</span>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 mt-1">{activeEscalations}</div>
                    <span className="text-[10px] text-muted-foreground">Requiring coordinator review</span>
                </Card>

                <Card className="rounded-2xl border-border/60 bg-card/60 p-4">
                    <span className="text-xs text-muted-foreground font-medium">Dead Letter Queue</span>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-red-500 mt-1">{deadLetterExecutions}</div>
                    <span className="text-[10px] text-muted-foreground">Failed or poisoned events</span>
                </Card>
            </div>

            {/* Tabbed Views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-card border border-border/60 p-1 rounded-xl">
                    <TabsTrigger value="workflows" className="text-xs font-semibold rounded-lg">
                        <Layers className="w-3.5 h-3.5 mr-1.5" /> 5 Canonical Workflows
                    </TabsTrigger>
                    <TabsTrigger value="events" className="text-xs font-semibold rounded-lg">
                        <Activity className="w-3.5 h-3.5 mr-1.5" /> Event Stream ({domainEvents.length})
                    </TabsTrigger>
                    <TabsTrigger value="executions" className="text-xs font-semibold rounded-lg">
                        <Server className="w-3.5 h-3.5 mr-1.5" /> Executions ({workflowExecutions.length})
                    </TabsTrigger>
                    <TabsTrigger value="escalations" className="text-xs font-semibold rounded-lg">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Escalations ({workflowEscalations.length})
                    </TabsTrigger>
                    <TabsTrigger value="demo" className="text-xs font-semibold rounded-lg text-purple-400">
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Hackathon Demo Suite
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: 5 Canonical Workflows */}
                <TabsContent value="workflows" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 1. Emergency Coordination */}
                        <Card className="rounded-2xl border-border/60 bg-card/80 p-5 flex flex-col justify-between shadow-xs">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px] font-bold">
                                        WORKFLOW #1
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                        emergency.request.created
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-red-500" />
                                    VeinLink - Emergency Coordination
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Orchestrates multi-facility blood and organ emergencies. Dispatches regional notifications, mobilizes reserves, and handles critical escalations.
                                </p>
                            </div>
                            <div className="pt-4 border-t border-border/40 mt-3 text-[11px] text-muted-foreground space-y-1">
                                <div>Domains: <strong className="text-foreground">Blood Emergency & Organ Emergency</strong></div>
                                <div>Safety: <strong className="text-foreground">Zero autonomous decisions without human confirmation</strong></div>
                            </div>
                        </Card>

                        {/* 2. Blood Donor Matching */}
                        <Card className="rounded-2xl border-border/60 bg-card/80 p-5 flex flex-col justify-between shadow-xs">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                                        WORKFLOW #2
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                        blood.donor.matching
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    VeinLink - Blood Donor Matching
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Executes ABO compatibility queries on verified donors, sends real-time opt-in notifications, and updates hospital fulfillment queues.
                                </p>
                            </div>
                            <div className="pt-4 border-t border-border/40 mt-3 text-[11px] text-muted-foreground space-y-1">
                                <div>Matching: <strong className="text-foreground">Convex Authoritative Engine</strong></div>
                                <div>Safety: <strong className="text-foreground">Enforces strict 56-day medical cooldown</strong></div>
                            </div>
                        </Card>

                        {/* 3. Organ Allocation Review */}
                        <Card className="rounded-2xl border-border/60 bg-card/80 p-5 flex flex-col justify-between shadow-xs">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-[10px] font-bold">
                                        WORKFLOW #3
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                        organ.allocation.review
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-purple-500" />
                                    VeinLink - Organ Allocation Review
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Ranks compatible candidate pool with Pareto optimization, generates explainability rationale, and holds cases for Mandatory Human Clinician Review.
                                </p>
                            </div>
                            <div className="pt-4 border-t border-border/40 mt-3 text-[11px] text-muted-foreground space-y-1">
                                <div>Governance: <strong className="text-purple-400">Strict Human Oversight Invariant</strong></div>
                                <div>Safety: <strong className="text-foreground">Zero autonomous organ allocation</strong></div>
                            </div>
                        </Card>

                        {/* 4. Intelligence Alerts */}
                        <Card className="rounded-2xl border-border/60 bg-card/80 p-5 flex flex-col justify-between shadow-xs">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[10px] font-bold">
                                        WORKFLOW #4
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                        network.shortage.detected
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    VeinLink - Intelligence Alerts
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Monitors statistical surge anomalies (+3.5σ), runs 72h shortage forecasts with 90% prediction intervals, and alerts network operations directors.
                                </p>
                            </div>
                            <div className="pt-4 border-t border-border/40 mt-3 text-[11px] text-muted-foreground space-y-1">
                                <div>Forecasting: <strong className="text-foreground">ARIMA/Ensemble ML Service</strong></div>
                                <div>Alerts: <strong className="text-foreground">Low / Medium / High / Critical Tiers</strong></div>
                            </div>
                        </Card>

                        {/* 5. Logistics + Audit */}
                        <Card className="rounded-2xl border-border/60 bg-card/80 p-5 flex flex-col justify-between shadow-xs">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                                        WORKFLOW #5
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                        transport.delay.detected
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-emerald-500" />
                                    VeinLink - Logistics + Audit
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Tracks active aeromedical and cold-chain transports, monitors cold ischemia buffer limits, emits delay alarms, and anchors Merkle root proofs on-ledger.
                                </p>
                            </div>
                            <div className="pt-4 border-t border-border/40 mt-3 text-[11px] text-muted-foreground space-y-1">
                                <div>Cold Ischemia: <strong className="text-foreground">Dynamic Time-to-Expire Alarms</strong></div>
                                <div>Trust: <strong className="text-foreground">Zero-PHI On-Chain Merkle Provenance</strong></div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab 2: Domain Events Stream */}
                <TabsContent value="events" className="space-y-4">
                    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/60 bg-muted/30">
                                    <TableHead className="text-xs">Event ID / Type</TableHead>
                                    <TableHead className="text-xs">Aggregate / Entity</TableHead>
                                    <TableHead className="text-xs">Correlation ID</TableHead>
                                    <TableHead className="text-xs">Actor / Source</TableHead>
                                    <TableHead className="text-xs">Timestamp</TableHead>
                                    <TableHead className="text-xs text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {domainEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                            No domain events recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    domainEvents.map((evt: any) => (
                                        <TableRow key={evt._id} className="border-border/40">
                                            <TableCell className="text-xs font-mono">
                                                <div className="font-bold text-foreground">{evt.eventType}</div>
                                                <div className="text-[10px] text-muted-foreground">{evt.eventId}</div>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">
                                                {evt.aggregate?.type}:{evt.aggregate?.id}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-purple-400">
                                                {evt.correlationId}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <Badge variant="outline" className="text-[9px]">
                                                    {evt.actor?.type || "system"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(evt.occurredAt).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleReplay(evt.eventId)}
                                                >
                                                    <RotateCcw className="w-3 h-3 mr-1" /> Replay
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Tab 3: Workflow Executions */}
                <TabsContent value="executions" className="space-y-4">
                    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/60 bg-muted/30">
                                    <TableHead className="text-xs">Workflow Name</TableHead>
                                    <TableHead className="text-xs">Execution ID</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs">Duration</TableHead>
                                    <TableHead className="text-xs">Correlation ID</TableHead>
                                    <TableHead className="text-xs">Executed At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workflowExecutions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                            No workflow execution logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    workflowExecutions.map((exec: any) => (
                                        <TableRow key={exec._id} className="border-border/40">
                                            <TableCell className="text-xs font-bold text-foreground">
                                                {exec.workflowName}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                {exec.executionId}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <Badge
                                                    className={`text-[10px] ${
                                                        exec.status === "COMPLETED"
                                                            ? "bg-emerald-600 text-white"
                                                            : exec.status === "DEAD_LETTER"
                                                            ? "bg-red-600 text-white"
                                                            : "bg-amber-600 text-white"
                                                    }`}
                                                >
                                                    {exec.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                {exec.durationMs ? `${exec.durationMs}ms` : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-purple-400">
                                                {exec.correlationId}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(exec.startedAt).toLocaleTimeString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Tab 4: Escalations */}
                <TabsContent value="escalations" className="space-y-4">
                    <div className="space-y-3">
                        {workflowEscalations.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl bg-card/30">
                                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-60" />
                                <h3 className="font-semibold text-sm text-foreground">All Escalations Resolved</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                    No unresolved alarms requiring clinical coordinator intervention.
                                </p>
                            </div>
                        ) : (
                            workflowEscalations.map((esc: any) => (
                                <Card key={esc._id} className="rounded-2xl border-border/60 bg-card/80 p-4 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px]">
                                                    {esc.severity || "CRITICAL"}
                                                </Badge>
                                                <h3 className="font-bold text-sm text-foreground">{esc.escalationType}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{esc.reason || "Automated escalation triggered by workflow policy."}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {esc.status === "ACTIVE" && (
                                                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleAcknowledge(esc._id)}>
                                                    Acknowledge
                                                </Button>
                                            )}
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8" onClick={() => handleResolve(esc._id)}>
                                                Mark Resolved
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Tab 5: Hackathon Demo Suite */}
                <TabsContent value="demo" className="space-y-4">
                    <Card className="rounded-2xl border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-card to-card p-6 shadow-sm">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Play className="w-5 h-5 text-purple-500" />
                                VeinLink Hackathon Live Judge Demonstration Scenarios
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Trigger the 4 end-to-end automation workflows. Each scenario creates real-time domain events, updates Convex, and streams real-time updates.
                            </CardDescription>
                        </CardHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* DEMO 1 */}
                            <div className="p-4 rounded-xl border border-red-500/30 bg-card/90 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-red-600 text-white text-[10px] font-bold">DEMO 1</Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono">[DEMO DATA]</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-red-500" /> Blood Emergency & Matching
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Emits `emergency.request.created` for O- mass casualty shock. Executes candidate matching and broadcasts donor notifications.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold h-9 rounded-xl"
                                    onClick={() => handleSimulateDemo(1)}
                                    disabled={isSimulating}
                                >
                                    Execute Demo 1 (Blood Emergency)
                                </Button>
                            </div>

                            {/* DEMO 2 */}
                            <div className="p-4 rounded-xl border border-purple-500/30 bg-card/90 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-purple-600 text-white text-[10px] font-bold">DEMO 2</Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono">[DEMO DATA]</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-purple-500" /> Organ Allocation Review
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Emits `organ.available` for verified donor kidney. Computes AI match scores, generates explainability, and pauses for Mandatory Human Review.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold h-9 rounded-xl"
                                    onClick={() => handleSimulateDemo(2)}
                                    disabled={isSimulating}
                                >
                                    Execute Demo 2 (Organ Review)
                                </Button>
                            </div>

                            {/* DEMO 3 */}
                            <div className="p-4 rounded-xl border border-blue-500/30 bg-card/90 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-blue-600 text-white text-[10px] font-bold">DEMO 3</Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono">[DEMO DATA]</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-500" /> Shortage Intelligence Alert
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Emits `network.shortage.detected` (94% shortage risk within 72h). Evaluates risk thresholds and alerts regional network directors.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 rounded-xl"
                                    onClick={() => handleSimulateDemo(3)}
                                    disabled={isSimulating}
                                >
                                    Execute Demo 3 (Shortage Alert)
                                </Button>
                            </div>

                            {/* DEMO 4 */}
                            <div className="p-4 rounded-xl border border-emerald-500/30 bg-card/90 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">DEMO 4</Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono">[DEMO DATA]</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-emerald-500" /> Logistics Delay & Merkle Audit
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Emits `transport.delay.detected` (35 min air hold). Re-estimates cold ischemia safety buffer and stamps cryptographic hash on-ledger.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 rounded-xl"
                                    onClick={() => handleSimulateDemo(4)}
                                    disabled={isSimulating}
                                >
                                    Execute Demo 4 (Logistics + Audit)
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
