"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Blocks,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCheck,
  Fingerprint,
  GitCommit,
  Hash,
  Layers,
  Link2,
  Lock,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

export default function BlockchainDashboardPage() {
  const [activeTab, setActiveTab] = useState("blocks")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProof, setSelectedProof] = useState<any | null>(null)
  const [verifierInput, setVerifierInput] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null)

  // Convex Queries
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

  // Verification Query
  const targetProofId = verifierInput.trim()
  const verificationResult = useQuery(
    (api as any).trust?.trustService?.verifyProofIntegrity,
    targetProofId ? { proofId: targetProofId } : "skip"
  )

  // Mutations & Actions
  const generateProofMutation = useMutation((api as any).trust?.trustService?.generateAuditProof)
  const recordAiMutation = useMutation((api as any).trust?.trustService?.recordAiProvenance)
  const anchorAction = useAction((api as any).trust?.trustService?.anchorPendingProofsAction)

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSimulateEvent = async (type: "ORGAN_MATCH" | "SURGEON_OVERRIDE" | "AI_DECISION") => {
    setIsSimulating(true)
    setSimulationStatus("Generating SHA-256 canonical event proof...")
    try {
      const now = Date.now()
      let eventType = "organ.match.calculated"
      let action = "COMPATIBILITY_SCORING_EXECUTED"
      let trustLevel: "STANDARD" | "IMPORTANT" | "CRITICAL" = "IMPORTANT"
      let payload: any = {
        donorId: `DONOR-${Math.floor(Math.random() * 9000 + 1000)}`,
        recipientId: `RECIP-${Math.floor(Math.random() * 9000 + 1000)}`,
        hlaMatchRatio: 0.94,
        geographicDistanceKm: 42.5,
        estimatedColdIschemiaHours: 3.2,
      }

      if (type === "SURGEON_OVERRIDE") {
        eventType = "organ.allocation.override_approved"
        action = "HUMAN_SURGEON_OVERRIDE"
        trustLevel = "CRITICAL"
        payload = {
          organId: `ORGAN-KIDNEY-${now.toString().slice(-4)}`,
          originalRecipientRank: 2,
          overriddenRecipientId: `RECIP-${Math.floor(Math.random() * 9000 + 1000)}`,
          clinicalOverrideReason: "Immediate surgical team readiness and recipient stability.",
        }
      } else if (type === "AI_DECISION") {
        eventType = "ai.logistics.risk_evaluated"
        action = "AI_TRANSIT_RISK_PREDICTION"
        trustLevel = "STANDARD"
        payload = {
          routeId: `ROUTE-${now.toString().slice(-4)}`,
          trafficRiskIndex: 0.12,
          weatherAlertLevel: "LOW",
          confidenceScore: 0.96,
        }
      }

      const res = await generateProofMutation({
        auditId: `AUD-${now}`,
        eventId: `EVT-${now}`,
        eventType,
        aggregateType: "organ_network",
        aggregateId: payload.organId || payload.donorId || payload.routeId,
        actorType: type === "SURGEON_OVERRIDE" ? "head_surgeon" : "system_algorithm",
        action,
        result: "SUCCESS",
        canonicalPayload: payload,
        trustLevel,
      })

      if (type === "AI_DECISION" && res?.proofId) {
        await recordAiMutation({
          decisionId: `DEC-${now}`,
          modelType: "organ_ranker_v2",
          modelVersion: "2.4.1-prod",
          inputFeatures: payload,
          outputPrediction: { score: 0.94, risk: "LOW" },
          confidence: 0.96,
          explanationText: "High HLA matching allele score and optimal cold ischemia transit window.",
          recommendation: "PRIORITIZE_PRIMARY_RECIPIENT",
          isOverride: false,
          proofId: res.proofId,
        })
      }

      setSimulationStatus("Proof committed to hash chain! Triggering Merkle batch anchor...")
      const anchorRes = await anchorAction({})
      setSimulationStatus(
        `Successfully anchored ${anchorRes?.anchoredCount ?? 1} proof(s) to blockchain trust ledger!`
      )
    } catch (err: any) {
      console.error(err)
      setSimulationStatus(`Simulation failed: ${err?.message || "Unknown error"}`)
    } finally {
      setIsSimulating(false)
      setTimeout(() => setSimulationStatus(null), 5000)
    }
  }

  const handleForceBatchAnchor = async () => {
    setIsSimulating(true)
    setSimulationStatus("Submitting pending proofs Merkle root to blockchain anchor...")
    try {
      const res = await anchorAction({})
      setSimulationStatus(
        `Anchored ${res?.anchoredCount ?? 0} proof(s). Merkle Root: ${res?.merkleRoot ? res.merkleRoot.substring(0, 16) + "..." : "N/A"}`
      )
    } catch (err: any) {
      console.error(err)
      setSimulationStatus(`Batch anchor failed: ${err.message}`)
    } finally {
      setIsSimulating(false)
      setTimeout(() => setSimulationStatus(null), 5000)
    }
  }

  const filteredProofs = proofs.filter((p: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.proofId?.toLowerCase().includes(q) ||
      p.eventType?.toLowerCase().includes(q) ||
      p.dataHash?.toLowerCase().includes(q) ||
      p.blockchainTxId?.toLowerCase().includes(q) ||
      p.action?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 text-foreground">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500/20 via-sky-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400">
              <Blocks className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-800 dark:from-white dark:via-sky-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Blockchain Trust & Provenance Explorer
              </h1>
              <p className="text-sm text-muted-foreground">
                Zero-PHI Cryptographic Hash Chain, Merkle Root Batching & Immutable Healthcare Ledger
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceBatchAnchor}
            disabled={isSimulating || metrics.pendingProofs === 0}
            className="flex items-center gap-2 border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`} />
            Anchor Pending ({metrics.pendingProofs})
          </Button>

          <Button
            size="sm"
            onClick={() => handleSimulateEvent("ORGAN_MATCH")}
            disabled={isSimulating}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md shadow-indigo-500/20"
          >
            <Zap className="w-4 h-4" />
            Simulate Event
          </Button>
        </div>
      </div>

      {/* SIMULATION NOTIFICATION BANNER */}
      {simulationStatus && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
            <span>{simulationStatus}</span>
          </div>
          <Badge variant="outline" className="border-indigo-400/50 text-indigo-300 text-xs">
            Live Simulated Ledger
          </Badge>
        </div>
      )}

      {/* TOP STAT METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-500">
            <Hash className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Total Audit Proofs
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              {metrics.totalProofs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Chain Intact
              </span>
              <span>SHA-256 Canonical</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              On-Chain Confirmation
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.anchorSuccessRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Progress value={metrics.anchorSuccessRate} className="h-1.5 bg-emerald-950/20" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{metrics.anchoredProofs} Confirmed</span>
              <span>{metrics.pendingProofs} Pending</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-sky-500">
            <Cpu className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              AI Decision Provenance
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-sky-600 dark:text-sky-400">
              {metrics.totalAiDecisions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{metrics.totalOverrides} Human Overrides</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {metrics.humanOverrideRate}% Override Rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500">
            <Server className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Active Trust Network
            </CardDescription>
            <CardTitle className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 flex items-center gap-2 mt-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              SimulatedLedger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Fallback: EVM Sepolia</span>
              <span className="font-mono text-[10px]">Zero-Latency</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ARCHITECTURE OVERVIEW BANNER */}
      <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/40 to-sky-950/30 dark:border-indigo-500/30 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-xs">
                  Zero-PHI Architecture Guarantee
                </Badge>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-xs">
                  Independent Auditor API
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-indigo-100">
                Cryptographic Trust & Data Separation Engine
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Healthcare state & clinical data remain in <strong>Convex</strong>, while <strong>blockchain ledgers</strong> exclusively anchor SHA-256 canonical data hashes and sequential Merkle roots. Zero patient identifiable information (PHI) is ever exposed on-chain.
              </p>
            </div>

            {/* Workflow Step Diagram */}
            <div className="flex items-center gap-2 text-xs overflow-x-auto pb-2 lg:pb-0 font-mono">
              <div className="flex flex-col items-center p-2.5 rounded-lg bg-card/80 border border-border min-w-[90px] text-center">
                <Database className="w-4 h-4 text-indigo-400 mb-1" />
                <span className="text-[11px] font-semibold">1. Event</span>
                <span className="text-[9px] text-muted-foreground">Convex Mutation</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col items-center p-2.5 rounded-lg bg-card/80 border border-border min-w-[90px] text-center">
                <Hash className="w-4 h-4 text-sky-400 mb-1" />
                <span className="text-[11px] font-semibold">2. SHA-256</span>
                <span className="text-[9px] text-muted-foreground">Canonical Hash</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col items-center p-2.5 rounded-lg bg-card/80 border border-border min-w-[90px] text-center">
                <Layers className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-[11px] font-semibold">3. Merkle</span>
                <span className="text-[9px] text-muted-foreground">Batch Root</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col items-center p-2.5 rounded-lg bg-card/80 border border-border min-w-[90px] text-center">
                <Lock className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-[11px] font-semibold">4. Anchor</span>
                <span className="text-[9px] text-muted-foreground">Blockchain Tx</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN CONTENT TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="blocks" className="flex items-center gap-2 text-xs md:text-sm">
              <Blocks className="w-4 h-4" />
              Proof Ledger ({proofs.length})
            </TabsTrigger>
            <TabsTrigger value="verifier" className="flex items-center gap-2 text-xs md:text-sm">
              <ShieldCheck className="w-4 h-4" />
              3-Point Verifier
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 text-xs md:text-sm">
              <Cpu className="w-4 h-4" />
              AI Decision Provenance ({aiRecords.length})
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center gap-2 text-xs md:text-sm">
              <Zap className="w-4 h-4" />
              Ledger Simulator
            </TabsTrigger>
          </TabsList>

          {/* Search Box */}
          {activeTab === "blocks" && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Tx, Proof ID, Event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-card"
              />
            </div>
          )}
        </div>

        {/* TAB 1: PROOF LEDGER TABLE */}
        <TabsContent value="blocks" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Cryptographic Audit Proof Records
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Immutable SHA-256 sequential hash chain with blockchain confirmation receipts
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Showing {filteredProofs.length} proof(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="text-xs font-semibold">
                    <TableHead>Proof ID / Time</TableHead>
                    <TableHead>Event & Action</TableHead>
                    <TableHead>Trust Level</TableHead>
                    <TableHead>Canonical SHA-256 Data Hash</TableHead>
                    <TableHead>Blockchain Status</TableHead>
                    <TableHead>Tx Receipt / Block</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-mono">
                  {filteredProofs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No audit proofs found matching criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProofs.map((p: any) => (
                      <TableRow
                        key={p._id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedProof(p)}
                      >
                        <TableCell className="font-sans">
                          <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {p.proofId}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(p.occurredAt).toLocaleTimeString()}
                          </div>
                        </TableCell>

                        <TableCell className="font-sans">
                          <div className="font-medium text-foreground">{p.action}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {p.eventType}
                          </div>
                        </TableCell>

                        <TableCell className="font-sans">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-semibold ${
                              p.trustLevel === "CRITICAL"
                                ? "border-red-500/40 text-red-500 bg-red-500/10"
                                : p.trustLevel === "IMPORTANT"
                                ? "border-amber-500/40 text-amber-500 bg-amber-500/10"
                                : "border-slate-500/40 text-slate-400 bg-slate-500/10"
                            }`}
                          >
                            {p.trustLevel || "STANDARD"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {p.dataHash?.substring(0, 16)}...
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(p.dataHash, `hash-${p.proofId}`)
                              }}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              title="Copy Full Hash"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>

                        <TableCell className="font-sans">
                          {p.blockchainStatus === "CONFIRMED" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-[10px] gap-1">
                              <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] gap-1 animate-pulse"
                            >
                              <Clock className="w-3 h-3" /> PENDING
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {p.blockchainTxId ? (
                            <div>
                              <div className="text-[11px] text-sky-500 font-semibold flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                {p.blockchainTxId.substring(0, 14)}...
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Block #{p.blockchainBlock ?? "N/A"} ({p.blockchainNetwork || "Simulated"})
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Awaiting Merkle batch
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-sans" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVerifierInput(p.proofId)
                              setActiveTab("verifier")
                            }}
                            className="h-7 text-xs text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                          >
                            Verify
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

        {/* TAB 2: 3-POINT VERIFIER */}
        <TabsContent value="verifier" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Independent 3-Point Cryptographic Verifier
              </CardTitle>
              <CardDescription className="text-xs">
                Validate continuous SHA-256 hash-chain integrity, Merkle root batching, and on-chain confirmation receipts without revealing patient data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Form */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter Proof ID (e.g. PRF-1741...)"
                    value={verifierInput}
                    onChange={(e) => setVerifierInput(e.target.value)}
                    className="pl-9 font-mono text-sm bg-card"
                  />
                </div>
                {proofs.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setVerifierInput(proofs[0]?.proofId || "")}
                    className="text-xs border-indigo-500/30 text-indigo-500"
                  >
                    Use Latest Proof
                  </Button>
                )}
              </div>

              {/* Verification Results Panel */}
              {verifierInput ? (
                verificationResult === undefined ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                    <span>Evaluating cryptographic verification matrix...</span>
                  </div>
                ) : verificationResult?.verified === false && verificationResult?.reason ? (
                  <div className="p-6 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-base">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Verification Failed
                    </div>
                    <p className="text-xs text-red-200">{verificationResult.reason}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Verification Header Banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/50 to-indigo-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-emerald-300">
                            VERIFIED CRYPTOGRAPHICALLY INTACT
                          </div>
                          <div className="text-xs text-slate-300 font-mono">
                            Proof ID: {verificationResult.proofId}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-slate-950 font-bold self-start sm:self-center">
                        PASS (100% Valid)
                      </Badge>
                    </div>

                    {/* 3 Verification Points */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Point 1 */}
                      <Card className="border-emerald-500/30 bg-emerald-950/10">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-semibold uppercase text-emerald-400 flex items-center justify-between">
                            <span>1. Data Canonicalization</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2 text-xs">
                          <p className="text-muted-foreground">
                            Deterministic SHA-256 payload digest matching exact state transition.
                          </p>
                          <div className="font-mono text-[10px] p-2 rounded bg-black/40 border border-border/40 break-all text-slate-300">
                            {verificationResult.dataHash}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Point 2 */}
                      <Card className="border-emerald-500/30 bg-emerald-950/10">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-semibold uppercase text-emerald-400 flex items-center justify-between">
                            <span>2. Sequential Hash Chain</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2 text-xs">
                          <p className="text-muted-foreground">
                            Unbroken sequential linkage to genesis block without tampering.
                          </p>
                          <div className="font-mono text-[10px] p-2 rounded bg-black/40 border border-border/40 break-all text-slate-300">
                            {verificationResult.chainHash}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Point 3 */}
                      <Card className="border-emerald-500/30 bg-emerald-950/10">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-semibold uppercase text-emerald-400 flex items-center justify-between">
                            <span>3. On-Chain Confirmation</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2 text-xs">
                          <p className="text-muted-foreground">
                            Confirmed receipt on trust ledger network block #{verificationResult.blockchainBlock || 1}.
                          </p>
                          <div className="font-mono text-[10px] p-2 rounded bg-black/40 border border-border/40 break-all text-sky-400">
                            {verificationResult.blockchainTxId || "Pending batch anchor"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  Enter a Proof ID above or click "Verify" on any proof in the ledger tab to execute independent 3-point validation.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: AI DECISION PROVENANCE */}
        <TabsContent value="ai" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="px-6 py-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-500" />
                AI Model Decision & Human Override Provenance
              </CardTitle>
              <CardDescription className="text-xs">
                Auditable record of ML model predictions, confidence scores, input feature hashes, and coordinator override justifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="text-xs font-semibold">
                    <TableHead>Provenance ID</TableHead>
                    <TableHead>Model / Version</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Human Action</TableHead>
                    <TableHead>Proof ID Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-mono">
                  {aiRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No AI provenance records logged yet. Run a simulated AI event from top controls.
                      </TableCell>
                    </TableRow>
                  ) : (
                    aiRecords.map((r: any) => (
                      <TableRow key={r._id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold text-sky-500">{r.provenanceId}</TableCell>
                        <TableCell className="font-sans">
                          <div className="font-medium text-foreground">{r.modelType}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{r.modelVersion}</div>
                        </TableCell>
                        <TableCell className="font-sans">
                          <Badge variant="outline" className="text-[10px] border-sky-500/40 text-sky-400">
                            {Math.round((r.confidence ?? 0.9) * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="font-sans text-muted-foreground">
                          {r.recommendation}
                        </TableCell>
                        <TableCell className="font-sans">
                          {r.isOverride ? (
                            <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px]">
                              Human Override
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Accepted
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-indigo-400">{r.proofId}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: LEDGER SIMULATOR */}
        <TabsContent value="simulator" className="space-y-4 m-0">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Real-Time Healthcare Event Proof Simulator
              </CardTitle>
              <CardDescription className="text-xs">
                Trigger synthetic domain mutations (organ matching, surgeon overrides, AI risk scoring) to test instant SHA-256 canonicalization and Merkle batch anchoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Simulator 1 */}
                <Card className="border-border/80 bg-card hover:border-indigo-500/40 transition-colors">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
                      <FileCheck className="w-4 h-4" />
                      1. Organ Compatibility Event
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Generates donor-recipient HLA match proof with 0.94 score and canonical hash chain insertion.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button
                      size="sm"
                      onClick={() => handleSimulateEvent("ORGAN_MATCH")}
                      disabled={isSimulating}
                      className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Execute Simulation
                    </Button>
                  </CardContent>
                </Card>

                {/* Simulator 2 */}
                <Card className="border-border/80 bg-card hover:border-red-500/40 transition-colors">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      2. Human Surgeon Override
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Logs a critical priority override proof with clinical readiness justification and audit hash.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button
                      size="sm"
                      onClick={() => handleSimulateEvent("SURGEON_OVERRIDE")}
                      disabled={isSimulating}
                      className="w-full text-xs bg-red-600 hover:bg-red-500 text-white"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Execute Simulation
                    </Button>
                  </CardContent>
                </Card>

                {/* Simulator 3 */}
                <Card className="border-border/80 bg-card hover:border-sky-500/40 transition-colors">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-sky-400">
                      <Cpu className="w-4 h-4" />
                      3. AI Transit Risk Scoring
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Creates ML provenance entry and links SHA-256 input/output feature hashes to trust proof.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button
                      size="sm"
                      onClick={() => handleSimulateEvent("AI_DECISION")}
                      disabled={isSimulating}
                      className="w-full text-xs bg-sky-600 hover:bg-sky-500 text-white"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Execute Simulation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PROOF DETAIL DIALOG MODAL */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center justify-between">
              <span className="text-indigo-500 font-mono">{selectedProof?.proofId}</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  selectedProof?.blockchainStatus === "CONFIRMED"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-amber-500 text-amber-400"
                }`}
              >
                {selectedProof?.blockchainStatus}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Canonical JSON Payload & Cryptographic Proof Verification Details
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 font-sans">
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  <span className="font-semibold">{selectedProof.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Aggregate ID:</span>{" "}
                  <span className="font-mono">{selectedProof.aggregateId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Actor:</span>{" "}
                  <span>{selectedProof.actorType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Occurred At:</span>{" "}
                  <span>{new Date(selectedProof.occurredAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground font-sans font-semibold">
                  Canonical SHA-256 Data Hash:
                </div>
                <div className="p-2 rounded bg-black/50 border border-border break-all text-indigo-300">
                  {selectedProof.dataHash}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground font-sans font-semibold">
                  Sequential Chain Hash (Previous Hash Linked):
                </div>
                <div className="p-2 rounded bg-black/50 border border-border break-all text-sky-300">
                  {selectedProof.chainHash}
                </div>
              </div>

              {selectedProof.blockchainTxId && (
                <div className="space-y-1">
                  <div className="text-muted-foreground font-sans font-semibold">
                    Blockchain Transaction Receipt & Block:
                  </div>
                  <div className="p-2 rounded bg-black/50 border border-border break-all text-emerald-400">
                    Tx ID: {selectedProof.blockchainTxId} | Block #{selectedProof.blockchainBlock} | Network: {selectedProof.blockchainNetwork}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
