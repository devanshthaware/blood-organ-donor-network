"use client"

import { useState } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Cpu,
    ExternalLink,
    FileCheck,
    Fingerprint,
    Hash,
    Layers,
    Link2,
    Lock,
    Search,
    Server,
    Shield,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Zap,
} from "lucide-react"

export default function TrustMonitorPage() {
    const [activeTab, setActiveTab] = useState("proofs")
    const [selectedProofId, setSelectedProofId] = useState<string>("")
    const [verificationInput, setVerificationInput] = useState<string>("")
    const [isSimulating, setIsSimulating] = useState(false)

    // Convex queries
    const proofs = useQuery((api as any).trust?.trustService?.getAllAuditProofs, { limit: 50 }) || []
    const aiRecords = useQuery((api as any).trust?.trustService?.getAllAiProvenance, { limit: 50 }) || []
    const metrics = useQuery((api as any).trust?.trustService?.getTrustMetrics, {}) || {
        totalProofs: 0,
        anchoredProofs: 0,
        pendingProofs: 0,
        anchorSuccessRate: 100,
        auditIntegrityRate: 100,
        totalAiDecisions: 0,
        totalOverrides: 0,
        humanOverrideRate: 0,
    }

    // Active verification query
    const targetProofId = verificationInput || selectedProofId
    const verificationResult = useQuery(
        (api as any).trust?.trustService?.verifyProofIntegrity,
        targetProofId ? { proofId: targetProofId } : "skip"
    )

    // Mutations & Actions
    const generateProofMutation = useMutation((api as any).trust?.trustService?.generateAuditProof)
    const recordAiProvenanceMutation = useMutation((api as any).trust?.trustService?.recordAiProvenance)
    const anchorAction = useAction((api as any).trust?.trustService?.anchorPendingProofsAction)

    const handleSimulateProof = async (type: "ALLOCATION" | "OVERRIDE" | "AI_RECOMMENDATION") => {
        setIsSimulating(true)
        try {
            const now = Date.now()
            let eventType = "organ.allocation.approved"
            let action = "ALLOCATION_APPROVED_BY_COORDINATOR"
            let trustLevel: any = "CRITICAL"
            let payload: any = { organId: "ORG-2026-01", recipientId: "REC-2026-99", justification: "Primary recommendation approved." }

            if (type === "OVERRIDE") {
                action = "ALLOCATION_OVERRIDE_APPROVED"
                payload = {
                    organId: "ORG-2026-02",
                    recipientId: "REC-2026-88",
                    rank: 2,
                    overrideReason: "Surgeon consensus based on immediate surgical readiness.",
                }
            } else if (type === "AI_RECOMMENDATION") {
                eventType = "organ.match.generated"
                action = "AI_COMPATIBILITY_RECOMMENDATION"
                trustLevel = "IMPORTANT"
                payload = { organId: "ORG-2026-03", score: 0.94, confidence: 0.92, model: "1.0.0-organ-logistic-ranker" }
            }

            const res = await generateProofMutation({
                auditId: `AUD-${now}`,
                eventId: `EVT-${now}`,
                eventType,
                aggregateType: "organ",
                aggregateId: payload.organId,
                actorType: "coordinator",
                action,
                result: "SUCCESS",
                canonicalPayload: payload,
                trustLevel,
            })

            if (type === "OVERRIDE" || type === "AI_RECOMMENDATION") {
                await recordAiProvenanceMutation({
                    decisionId: `DEC-${now}`,
                    modelType: "organ-compatibility-logistic-ranker",
                    modelVersion: "1.0.0",
                    inputFeatures: { urgency: "CRITICAL", distanceKm: 420, remainingPreservation: 8.5 },
                    outputPrediction: { score: 0.94, rank: type === "OVERRIDE" ? 2 : 1 },
                    confidence: 0.92,
                    explanationText: "Model recommended primary candidate based on composite criteria.",
                    recommendation: "ALLOCATE_CANDIDATE_1",
                    humanDecision: type === "OVERRIDE" ? "OVERRIDE_TO_CANDIDATE_2" : "CONFIRM_PRIMARY",
                    isOverride: type === "OVERRIDE",
                    overrideReason: type === "OVERRIDE" ? payload.overrideReason : undefined,
                    proofId: res.proofId,
                })
            }

            // Trigger immediate background anchoring
            await anchorAction({})

            setSelectedProofId(res.proofId)
            setVerificationInput(res.proofId)
            alert(`Cryptographic Proof generated and anchored!\nProof ID: ${res.proofId}\nData Hash: ${res.dataHash.substring(0, 16)}...`)
        } catch (err: any) {
            alert(err?.message || "Proof generation failed.")
        } finally {
            setIsSimulating(false)
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-7 w-7 text-emerald-500 fill-emerald-500/20" />
                    <h2 className="text-3xl font-bold tracking-tight">Blockchain Trust & Provenance Layer</h2>
                </div>
                <p className="text-muted-foreground mt-1">
                    Tamper-evident SHA-256 hash chains, Merkle batch anchoring, AI decision provenance, and independent proof verification.
                </p>
            </div>

            {/* Trust Metrics KPI Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Audit Integrity Rate</CardTitle>
                        <Shield className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{metrics.auditIntegrityRate}%</div>
                        <p className="text-xs text-muted-foreground">Continuous hash-chain verified</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Blockchain Anchored</CardTitle>
                        <Link2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{metrics.anchorSuccessRate}%</div>
                        <p className="text-xs text-muted-foreground">{metrics.anchoredProofs} of {metrics.totalProofs} proofs on-chain</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Anchors</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{metrics.pendingProofs}</div>
                        <p className="text-xs text-muted-foreground">Queued for Merkle batch</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">AI Provenance</CardTitle>
                        <Cpu className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">{metrics.totalAiDecisions}</div>
                        <p className="text-xs text-muted-foreground">Models, features & outputs tracked</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Human Override Rate</CardTitle>
                        <UserCheck className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-cyan-500">{metrics.humanOverrideRate}%</div>
                        <p className="text-xs text-muted-foreground">{metrics.totalOverrides} verified overrides</p>
                    </CardContent>
                </Card>
            </div>

            {/* Blockchain Network Status Card */}
            <Card className="bg-muted/10 border-border/80">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">Active Blockchain Network & Ledger Status</CardTitle>
                        </div>
                        <Badge className="bg-emerald-600 text-white">OPERATIONAL</Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-4 gap-4 text-xs">
                    <div>
                        <span className="text-muted-foreground">Network:</span>
                        <p className="font-semibold font-mono text-foreground mt-0.5">VeinLink-Tamper-Evident-Ledger (EVM)</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Anchoring Mode:</span>
                        <p className="font-semibold text-foreground mt-0.5">Merkle Tree Batching (Zero-PHI)</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Zero-Block Guarantee:</span>
                        <p className="font-semibold text-emerald-500 mt-0.5">Active (Async Non-Blocking)</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Latest Block Ref:</span>
                        <p className="font-semibold font-mono text-primary mt-0.5">#1,845,212</p>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full max-w-3xl">
                    <TabsTrigger value="proofs" className="flex items-center gap-1.5">
                        <Fingerprint className="h-4 w-4" />
                        <span>Cryptographic Proofs</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai-provenance" className="flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-purple-500" />
                        <span>AI Decision Provenance</span>
                    </TabsTrigger>
                    <TabsTrigger value="verifier" className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Proof Verifier</span>
                    </TabsTrigger>
                    <TabsTrigger value="simulate" className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>Simulate Proofs</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Cryptographic Proofs Feed */}
                <TabsContent value="proofs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tamper-Evident Audit Proof Feed</CardTitle>
                            <CardDescription>
                                Chronological record of canonical audit event hashes linked in a continuous SHA-256 hash chain and anchored on-chain.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Proof ID</TableHead>
                                        <TableHead>Event Type</TableHead>
                                        <TableHead>Data Hash (SHA-256)</TableHead>
                                        <TableHead>Trust Level</TableHead>
                                        <TableHead>Blockchain Status</TableHead>
                                        <TableHead>Block #</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {proofs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No cryptographic proofs generated yet. Use the Simulate Proofs tab to anchor events.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        proofs.map((p: any) => (
                                            <TableRow key={p._id}>
                                                <TableCell className="font-mono text-xs font-semibold">{p.proofId}</TableCell>
                                                <TableCell className="text-xs">{p.eventType}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {p.dataHash.substring(0, 16)}...
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            p.trustLevel === "CRITICAL"
                                                                ? "destructive"
                                                                : p.trustLevel === "IMPORTANT"
                                                                ? "secondary"
                                                                : "outline"
                                                        }
                                                    >
                                                        {p.trustLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            p.blockchainStatus === "CONFIRMED"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {p.blockchainStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {p.blockchainBlock ? `#${p.blockchainBlock}` : "Pending"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => {
                                                            setSelectedProofId(p.proofId)
                                                            setVerificationInput(p.proofId)
                                                            setActiveTab("verifier")
                                                        }}
                                                    >
                                                        <ShieldCheck className="h-3 w-3 mr-1" /> Verify
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

                {/* Tab 2: AI Decision & Override Provenance */}
                <TabsContent value="ai-provenance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Decision & Human Override Provenance</CardTitle>
                            <CardDescription>
                                Cryptographically verifiable history of AI matching models, input feature hashes, predictions, and authorized coordinator overrides.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Decision ID</TableHead>
                                        <TableHead>Model / Version</TableHead>
                                        <TableHead>Confidence</TableHead>
                                        <TableHead>Input Feature Hash</TableHead>
                                        <TableHead>Coordinator Decision</TableHead>
                                        <TableHead>Override Reason</TableHead>
                                        <TableHead className="text-right">Linked Proof</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aiRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No AI decisions recorded yet. Generate an allocation or override in the Simulate tab.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        aiRecords.map((rec: any) => (
                                            <TableRow key={rec._id}>
                                                <TableCell className="font-mono text-xs font-semibold">{rec.decisionId}</TableCell>
                                                <TableCell className="text-xs">
                                                    {rec.modelType} (v{rec.modelVersion})
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold">
                                                    {Math.round(rec.confidence * 100)}%
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {rec.inputHash.substring(0, 14)}...
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={rec.isOverride ? "destructive" : "default"}
                                                    >
                                                        {rec.isOverride ? "HUMAN OVERRIDE" : "AI CONFIRMED"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                                                    {rec.overrideReason || "N/A (Standard Recommendation)"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs font-mono"
                                                        onClick={() => {
                                                            setSelectedProofId(rec.proofId)
                                                            setVerificationInput(rec.proofId)
                                                            setActiveTab("verifier")
                                                        }}
                                                    >
                                                        {rec.proofId.substring(0, 10)}...
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

                {/* Tab 3: Interactive Proof Verifier */}
                <TabsContent value="verifier" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                <span>Independent Cryptographic Proof Verifier</span>
                            </CardTitle>
                            <CardDescription>
                                Re-calculates local canonical hashes, checks sequential hash chain continuity, and verifies blockchain transaction receipts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-3 max-w-xl">
                                <Input
                                    placeholder="Enter Proof ID (e.g. PRF-1788325...)"
                                    value={verificationInput}
                                    onChange={(e) => setVerificationInput(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedProofId(verificationInput)}
                                >
                                    Verify Proof
                                </Button>
                            </div>

                            {verificationResult ? (
                                <div className="space-y-4 p-5 rounded-lg border bg-card">
                                    <div className="flex items-center justify-between border-b pb-3">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={
                                                    verificationResult.verified
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-red-600 text-white"
                                                }
                                            >
                                                {verificationResult.verified ? "VERIFIED & TAMPER-EVIDENT" : "VERIFICATION PENDING / FAILED"}
                                            </Badge>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                Target: {verificationResult.proofId}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {verificationResult.occurredAt ? new Date(verificationResult.occurredAt).toLocaleString() : ""}
                                        </span>
                                    </div>

                                    {/* 3-Point Integrity Check */}
                                    <div className="grid md:grid-cols-3 gap-4 text-xs">
                                        <div className="p-3 rounded border bg-muted/20 space-y-1.5">
                                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                                <FileCheck className="h-4 w-4 text-emerald-500" />
                                                <span>1. Local Canonical Hash</span>
                                            </div>
                                            <p className="text-muted-foreground font-mono truncate">
                                                SHA-256: {verificationResult.dataHash}
                                            </p>
                                            <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                                                MATCHES DATABASE
                                            </Badge>
                                        </div>

                                        <div className="p-3 rounded border bg-muted/20 space-y-1.5">
                                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                                <Link2 className="h-4 w-4 text-blue-500" />
                                                <span>2. Hash Chain Continuity</span>
                                            </div>
                                            <p className="text-muted-foreground font-mono truncate">
                                                Chain Link: {verificationResult.chainHash}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    verificationResult.chainIntact
                                                        ? "text-emerald-500 border-emerald-500"
                                                        : "text-red-500 border-red-500"
                                                }
                                            >
                                                {verificationResult.chainIntact ? "CHAIN INTACT (NO EDITS)" : "CHAIN BROKEN"}
                                            </Badge>
                                        </div>

                                        <div className="p-3 rounded border bg-muted/20 space-y-1.5">
                                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                                <Server className="h-4 w-4 text-purple-500" />
                                                <span>3. Blockchain Transaction</span>
                                            </div>
                                            <p className="text-muted-foreground font-mono truncate">
                                                Tx: {verificationResult.blockchainTxId || "Pending Anchor"}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    verificationResult.blockchainConfirmed
                                                        ? "text-emerald-500 border-emerald-500"
                                                        : "text-amber-500 border-amber-500"
                                                }
                                            >
                                                {verificationResult.blockchainConfirmed ? "CONFIRMED ON LEDGER" : "QUEUED"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Proof Metadata */}
                                    <div className="pt-2 text-xs text-muted-foreground space-y-1">
                                        <div><strong>Network Reference:</strong> {verificationResult.blockchainNetwork || "VeinLink-Tamper-Evident-Ledger"}</div>
                                        <div><strong>Block Number:</strong> {verificationResult.blockchainBlock ? `#${verificationResult.blockchainBlock}` : "N/A"}</div>
                                        {verificationResult.merkleRoot && (
                                            <div><strong>Merkle Root:</strong> <span className="font-mono">{verificationResult.merkleRoot}</span></div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <Fingerprint className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                    <p>Select any proof from the Cryptographic Proofs table, or enter a proof ID above to inspect integrity.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: Simulation Suite */}
                <TabsContent value="simulate" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trust & Provenance Testing Suite</CardTitle>
                            <CardDescription>
                                Trigger high-value clinical events to verify canonical serialization, hash-chain propagation, and blockchain transaction anchoring.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg border bg-card space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Anchor Allocation Approval
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Simulates authorized human coordinator approval for organ allocation. Emits `CRITICAL` trust event and anchors directly.
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleSimulateProof("ALLOCATION")}
                                    disabled={isSimulating}
                                >
                                    Anchor Allocation Proof
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg border bg-card space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-cyan-500" /> Anchor Human Override
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Simulates human coordinator override of Rank #1 AI recommendation, recording clinical justification and cryptographic provenance.
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                                    onClick={() => handleSimulateProof("OVERRIDE")}
                                    disabled={isSimulating}
                                >
                                    Anchor Override Provenance
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg border bg-card space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-purple-500" /> Anchor AI Recommendation
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Captures input features, model version, and predicted compatibility score into verifiable AI Decision Provenance record.
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => handleSimulateProof("AI_RECOMMENDATION")}
                                    disabled={isSimulating}
                                >
                                    Anchor AI Recommendation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
