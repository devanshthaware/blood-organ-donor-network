"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    Bell,
    CheckCircle2,
    Cpu,
    FileCheck2,
    HeartHandshake,
    MapPin,
    Shield,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
    XCircle,
} from "lucide-react"

export default function UserPrivacyPage() {
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Current user consents
    const consents = useQuery((api as any).governance?.consentService?.getUserConsents, {}) || []

    const grantMutation = useMutation((api as any).governance?.consentService?.grantConsent)
    const revokeMutation = useMutation((api as any).governance?.consentService?.revokeConsent)

    const isGranted = (purpose: string) => {
        const c = consents.find((item: any) => item.purpose === purpose)
        return c?.status === "GRANTED"
    }

    const handleToggleConsent = async (
        purpose: "DONATION" | "EMERGENCY_CONTACT" | "LOCATION_PROCESSING" | "AI_PROCESSING" | "COMMUNICATION",
        currentlyGranted: boolean
    ) => {
        setActionLoading(purpose)
        try {
            if (currentlyGranted) {
                const reason = prompt("Optional: reason for revoking consent?")
                await revokeMutation({
                    donorId: "CURRENT_USER", // Resolved by auth helper on backend
                    purpose,
                    reason: reason || undefined,
                })
            } else {
                await grantMutation({
                    donorId: "CURRENT_USER",
                    consentType: "OPT_IN",
                    purpose,
                })
            }
        } catch (err: any) {
            alert(err?.message || "Failed to update consent.")
        } finally {
            setActionLoading(null)
        }
    }

    const consentPurposes = [
        {
            purpose: "DONATION" as const,
            title: "Blood & Organ Donor Registry",
            description: "Allows VeinLink to evaluate your eligibility, blood group, and organ preferences for clinical matching.",
            icon: HeartHandshake,
            critical: true,
        },
        {
            purpose: "EMERGENCY_CONTACT" as const,
            title: "Emergency Life-Saving Outreach",
            description: "Permits urgent notifications via SMS/Push when critical blood shortages or compatible organs are urgently requested within 15km.",
            icon: Bell,
            critical: false,
        },
        {
            purpose: "LOCATION_PROCESSING" as const,
            title: "Geographic Feasibility & Transit",
            description: "Derives travel distance (km) to destination hospitals without storing or exposing continuous GPS tracking coordinates.",
            icon: MapPin,
            critical: false,
        },
        {
            purpose: "AI_PROCESSING" as const,
            title: "AI Clinical Compatibility Ranking",
            description: "Permits inclusion of strictly anonymized numeric feature vectors in compatibility and logistics optimization models.",
            icon: Cpu,
            critical: false,
        },
        {
            purpose: "COMMUNICATION" as const,
            title: "Scheduled Appointment & Cooldown Reminders",
            description: "Sends post-donation gratitude messages and calendar reminders strictly adhering to the 56-day blood donation cooldown.",
            icon: Activity,
            critical: false,
        },
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-7 w-7 text-emerald-500" />
                    <h2 className="text-3xl font-bold tracking-tight">Privacy & Consent Center</h2>
                </div>
                <p className="text-muted-foreground mt-1">
                    Exercise granular, purpose-specific control over how your healthcare data, location, and notifications are processed.
                </p>
            </div>

            {/* Privacy Overview Banner */}
            <Card className="bg-muted/10 border-border/80">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileCheck2 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">Healthcare Data Governance Policy</CardTitle>
                        </div>
                        <Badge className="bg-emerald-600 text-white">POLICY V2.1.0 (2026)</Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4 text-xs">
                    <div>
                        <span className="text-muted-foreground">Zero-PHI to AI:</span>
                        <p className="font-semibold text-foreground mt-0.5">Strict feature allowlist active</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Location Privacy:</span>
                        <p className="font-semibold text-foreground mt-0.5">Coarse tokenization (derived km)</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Right of Revocation:</span>
                        <p className="font-semibold text-emerald-500 mt-0.5">Instant downstream enforcement</p>
                    </div>
                </CardContent>
            </Card>

            {/* Purpose-Specific Consent Toggles */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight">Purpose-Specific Data Authorizations</h3>

                {consentPurposes.map((item) => {
                    const granted = isGranted(item.purpose)
                    const Icon = item.icon

                    return (
                        <Card key={item.purpose} className="transition-all hover:border-primary/40">
                            <CardContent className="p-5 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className={`p-2.5 rounded-lg ${granted ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm">{item.title}</h4>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    granted
                                                        ? "text-emerald-500 border-emerald-500"
                                                        : "text-muted-foreground border-muted"
                                                }
                                            >
                                                {granted ? "ACTIVE CONSENT" : "REVOKED / NO CONSENT"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground max-w-xl">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    variant={granted ? "outline" : "default"}
                                    className={granted ? "text-xs text-red-500 hover:bg-red-500/10 border-red-500/30" : "text-xs bg-emerald-600 hover:bg-emerald-700 text-white"}
                                    onClick={() => handleToggleConsent(item.purpose, granted)}
                                    disabled={actionLoading === item.purpose}
                                >
                                    {granted ? "Revoke Consent" : "Grant Consent"}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
