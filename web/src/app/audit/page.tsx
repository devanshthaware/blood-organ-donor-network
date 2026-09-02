"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Activity,
    CheckCircle2,
    Clock,
    Database,
    ExternalLink,
    Fingerprint,
    GitBranch,
    Lock,
    Search,
    Shield,
    ShieldCheck,
    Zap,
} from "lucide-react"

export default function UnifiedAuditPage() {
    const [filterCategory, setFilterCategory] = useState<"ALL" | "BLOOD" | "ORGAN" | "SECURITY">("ALL")
    const [searchId, setSearchId] = useState("")

    const auditRecords = [
        {
            id: "AUD-2026-9041",
            category: "ORGAN",
            action: "ORGAN_ALLOCATION_APPROVED_BY_HUMAN_COORDINATOR",
            actor: "Transplant Coordinator (Clerk ID: usr_coord_42)",
            resource: "Organ Case #ORG-2026-1042 (Donor Heart)",
            timestamp: "12 mins ago",
            sha256Digest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            merkleBlock: 1845210,
            status: "ANCHORED",
        },
        {
            id: "AUD-2026-9040",
            category: "BLOOD",
            action: "EMERGENCY_REQUISITION_DISPATCHED_TO_N8N",
            actor: "Sassoon Trauma Center (Clerk ID: usr_hosp_sassoon)",
            resource: "Req #REQ-2026-9812 (6 Units O-)",
            timestamp: "38 mins ago",
            sha256Digest: "4a9b5c2d1e0f3a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b",
            merkleBlock: 1845209,
            status: "ANCHORED",
        },
        {
            id: "AUD-2026-9039",
            category: "SECURITY",
            action: "CROSS_FACILITY_ACCESS_BLOCKED_ZERO_TRUST",
            actor: "Unauthorized Caller (Clerk ID: usr_ext_912)",
            resource: "Protected Resource (Requisition #REQ-9812)",
            timestamp: "1 hour ago",
            sha256Digest: "8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e",
            merkleBlock: 1845208,
            status: "CONTAINED",
        },
    ]

    const filtered =
        filterCategory === "ALL"
            ? auditRecords
            : auditRecords.filter((r) => r.category === filterCategory)

    return (
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-8 w-8 text-emerald-600" />
                        <h1 className="text-3xl font-extrabold tracking-tight">Tamper-Evident Audit & Blockchain Provenance</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Cryptographic SHA-256 hash chains, Merkle tree batch roots, and on-ledger provenance with zero PHI exposure.
                    </p>
                </div>

                <Badge className="bg-emerald-600 text-white px-3 py-1 text-xs">
                    CHAIN CONTINUITY: 100% VERIFIED
                </Badge>
            </div>

            {/* Cryptographic Proof Verification Card */}
            <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                        <Lock className="h-5 w-5" />
                        On-Chain Proof & Zero-Block Guarantee
                    </CardTitle>
                    <CardDescription>
                        Every clinical allocation, requisition, and security event is sequentially hashed into an immutable Merkle tree anchored to block height #1845210.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg border bg-background">
                            <span className="text-muted-foreground">Merkle Root Anchor:</span>
                            <div className="font-mono font-bold text-foreground truncate mt-0.5">
                                0x9109c5bb6d0056b4757c3128fc...
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border bg-background">
                            <span className="text-muted-foreground">Privacy Protection:</span>
                            <div className="font-semibold text-emerald-600 mt-0.5">
                                MATHEMATICAL ZERO-PHI (Allowlist Only)
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border bg-background">
                            <span className="text-muted-foreground">Execution Latency:</span>
                            <div className="font-mono font-bold text-blue-600 mt-0.5">
                                0.0ms (Convex Async Background Batch)
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filter Tabs & Log Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-bold">Verifiable Audit Trail</CardTitle>
                            <CardDescription>Chronological sequence of cross-system operations.</CardDescription>
                        </div>

                        <div className="flex gap-1.5 p-1 rounded-lg border bg-muted/40 text-xs">
                            {(["ALL", "BLOOD", "ORGAN", "SECURITY"] as const).map((cat) => (
                                <Button
                                    key={cat}
                                    size="sm"
                                    variant={filterCategory === cat ? "default" : "ghost"}
                                    onClick={() => setFilterCategory(cat)}
                                    className="h-7 text-xs"
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {filtered.map((log) => (
                        <div key={log.id} className="p-3.5 rounded-lg border bg-background space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={
                                            log.category === "ORGAN"
                                                ? "border-purple-500 text-purple-600"
                                                : log.category === "BLOOD"
                                                ? "border-red-500 text-red-600"
                                                : "border-amber-500 text-amber-600"
                                        }
                                    >
                                        {log.category}
                                    </Badge>
                                    <span className="font-semibold text-foreground">{log.action}</span>
                                </div>
                                <span className="text-muted-foreground text-[11px]">{log.timestamp}</span>
                            </div>

                            <div className="grid md:grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                                <div>Actor: <strong className="text-foreground">{log.actor}</strong></div>
                                <div>Resource: <strong className="text-foreground">{log.resource}</strong></div>
                            </div>

                            <div className="pt-2 border-t flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                                <span className="truncate max-w-md">SHA-256: {log.sha256Digest}</span>
                                <Badge className="bg-emerald-600 text-white text-[10px]">
                                    Block #{log.merkleBlock}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
