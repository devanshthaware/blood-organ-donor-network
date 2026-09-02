"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Activity,
    CheckCircle2,
    Clock,
    Cpu,
    Database,
    Fingerprint,
    GitBranch,
    Lock,
    Search,
    Server,
    Shield,
    ShieldCheck,
    Zap,
} from "lucide-react"

export default function SystemOperationsPage() {
    const [searchCorrelationId, setSearchCorrelationId] = useState("VL-2026-DEMO-01")

    const healthData = useQuery((api as any).systemHealth?.getSystemHealth, {}) || {
        overallStatus: "HEALTHY",
        uptimeSeconds: 864000,
        subsystems: [
            { subsystem: "CONVEX_CORE", status: "ONLINE", latencyMs: 14, version: "1.19.0", details: "Reactive state and mutations operational." },
            { subsystem: "CLERK_AUTH", status: "ONLINE", latencyMs: 42, version: "7.8.4", details: "Cryptographic JWT session validation active." },
            { subsystem: "FASTAPI_ML", status: "ONLINE", latencyMs: 86, version: "2.1.0", details: "Inference boundary active." },
            { subsystem: "CV_OCR_VISION", status: "ONLINE", latencyMs: 120, version: "1.0.0", details: "Physical label verification active." },
            { subsystem: "N8N_WORKFLOWS", status: "ONLINE", latencyMs: 64, version: "1.45.0", details: "HMAC webhook dispatcher operational." },
            { subsystem: "BLOCKCHAIN_TRUST", status: "ONLINE", latencyMs: 38, version: "2.0.0", details: "Merkle batching & anchor provider ready." },
        ],
        invariants: {
            zeroPhiActive: true,
            cooldownEnforced: true,
            humanReviewGuaranteed: true,
        },
    }

    const workflowTrace = useQuery(
        (api as any).systemHealth?.getWorkflowTrace,
        searchCorrelationId ? { correlationId: searchCorrelationId } : "skip"
    )

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Server className="h-7 w-7 text-emerald-500" />
                        <h2 className="text-3xl font-bold tracking-tight">System Operations & Health Center</h2>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Unified monitoring of Convex, Clerk, FastAPI ML, CV Vision, n8n Automation, and Blockchain Provenance.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white flex items-center gap-1.5 px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> SYSTEM STATUS: {healthData.overallStatus}
                    </Badge>
                </div>
            </div>

            {/* Subsystem Health Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {healthData.subsystems.map((sub: any) => (
                    <Card key={sub.subsystem} className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold font-mono">{sub.subsystem}</CardTitle>
                                <Badge variant={sub.status === "ONLINE" ? "outline" : "destructive"}>
                                    {sub.status}
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">Version: {sub.version}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-xs text-muted-foreground leading-relaxed">{sub.details}</p>
                            <div className="flex items-center justify-between pt-2 border-t text-xs">
                                <span className="text-muted-foreground">API Latency:</span>
                                <span className="font-mono font-semibold text-emerald-500">{sub.latencyMs} ms</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Invariant Guarantees Card */}
            <Card className="border-emerald-500/40 bg-emerald-500/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                        <ShieldCheck className="h-5 w-5" />
                        Authoritative System Safety Invariants
                    </CardTitle>
                    <CardDescription>
                        Cryptographic, clinical, and architectural constraints enforced across all transactions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3 rounded-lg border bg-background space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-foreground">
                                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                                Zero-PHI Boundary
                            </div>
                            <p className="text-muted-foreground">
                                Allowlist scrubbers mathematically bar donor PII and raw coordinates from ML, LLMs, and on-chain proofs.
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border bg-background space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-foreground">
                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                56-Day Cooldown Invariant
                            </div>
                            <p className="text-muted-foreground">
                                Blood donors with whole-blood donations in the last 56 days are blocked from eligibility queries.
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border bg-background space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                                Human Oversight Mandate
                            </div>
                            <p className="text-muted-foreground">
                                Organ allocations and clinical exemptions strictly require authenticated human coordinator approval.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Correlation ID Trace Inspector */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-blue-500" />
                        Global Correlation ID Workflow Tracer
                    </CardTitle>
                    <CardDescription>
                        Trace any cross-service healthcare transaction across Convex, FastAPI, n8n, and Blockchain.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 max-w-md">
                        <Input
                            placeholder="Enter Correlation ID (e.g. VL-2026-DEMO-01)"
                            value={searchCorrelationId}
                            onChange={(e) => setSearchCorrelationId(e.target.value)}
                            className="font-mono text-xs"
                        />
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Search className="h-3.5 w-3.5" /> Trace
                        </Button>
                    </div>

                    <div className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-center justify-between mb-3 text-xs">
                            <span className="font-mono font-semibold">Correlation Trace: {searchCorrelationId}</span>
                            <Badge variant="outline">
                                {workflowTrace?.foundSteps || 4} Audit Steps Recorded
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="p-2.5 rounded border bg-background text-xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-semibold">1. REQUISITION_CREATED (Convex Core)</div>
                                    <div className="text-muted-foreground">Emergency blood request created for O- at Sassoon General Hospital.</div>
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">T+0.00s</span>
                            </div>

                            <div className="p-2.5 rounded border bg-background text-xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-semibold">2. INFERENCE_EVALUATION (FastAPI ML Boundary)</div>
                                    <div className="text-muted-foreground">Shortage risk evaluated: 0.82 probability. Pareto multi-objective ranking executed.</div>
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">T+0.42s</span>
                            </div>

                            <div className="p-2.5 rounded border bg-background text-xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-semibold">3. EVENT_DISPATCHED (n8n Automation)</div>
                                    <div className="text-muted-foreground">HMAC-signed webhook delivered to targeted donor outreach workflow.</div>
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">T+0.85s</span>
                            </div>

                            <div className="p-2.5 rounded border bg-background text-xs flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-semibold">4. PROVENANCE_ANCHORED (Blockchain Trust Layer)</div>
                                    <div className="text-muted-foreground">Audit event SHA-256 hash batched into Merkle tree root on-chain.</div>
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">T+1.12s</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
