"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useDonorProfile } from "@/hooks/useUserProfile"
import { useReservations } from "@/hooks/useReservations"
import { LIVES_SAVED_PER_DONATION } from "@/lib/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Droplet,
    HeartHandshake,
    Lock,
    MapPin,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Heart,
} from "lucide-react"
import Link from "next/link"

export default function DonorDashboard() {
    const { profile, loading: profileLoading } = useDonorProfile()
    const { reservations, loading: reservationsLoading } = useReservations("donor")

    const verificationInfo = useQuery(api.donorVerification.getVerificationStatus, {})
    const nearbyHospitals = useQuery(api.donorVerification.getNearbyHospitalsForVerification, {})
    const organPreferences = useQuery(api.organPreferences.getDonorOrganPreferences, {})
    const updateAvailabilityMutation = useMutation(api.donors.updateAvailability)
    const requestVerificationMutation = useMutation(api.donorVerification.requestDonorVerification)

    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
    const [selectedHospitalId, setSelectedHospitalId] = useState("")
    const [selfReportedGroup, setSelfReportedGroup] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [dateOfBirth, setDateOfBirth] = useState("")
    const [address, setAddress] = useState("")
    const [submittingVerification, setSubmittingVerification] = useState(false)

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    const verificationStatus = verificationInfo?.verificationStatus || profile?.verificationStatus || "UNVERIFIED"
    const isVerified = verificationStatus === "VERIFIED" || profile?.donorStatus === "APPROVED" || profile?.verificationStatus === "VERIFIED"
    const isPending = (verificationStatus === "PENDING" || profile?.verificationStatus === "PENDING") && !isVerified
    const isFurtherEval = verificationStatus === "FURTHER_EVALUATION_REQUIRED" && !isVerified
    const isRejected = verificationStatus === "REJECTED" && !isVerified
    const isUnverified = !isVerified && !isPending && !isFurtherEval && !isRejected

    const verifiedBloodGroup = verificationInfo?.verifiedBloodGroup || profile?.verifiedBloodGroup
    const selfReportedBloodGroup = verificationInfo?.selfReportedBloodGroup || profile?.selfReportedBloodGroup || profile?.bloodType

    const totalDonations = profile?.totalDonations || profile?.completedDonations || 0
    const lastDonation = profile?.lastDonationDate
    const reliabilityScore = profile?.reliabilityScore ?? 0.5
    const isActive = profile?.isActive !== false

    // 56-day cooldown invariant check
    const lastDonationMs = lastDonation ? (lastDonation instanceof Date ? lastDonation.getTime() : new Date(lastDonation).getTime()) : null
    const daysSinceLastDonation = lastDonationMs ? Math.floor((Date.now() - lastDonationMs) / (1000 * 60 * 60 * 24)) : 999
    const isCooldownActive = daysSinceLastDonation < 56
    const daysRemainingCooldown = Math.max(0, 56 - daysSinceLastDonation)

    let bloodEligibility: "ELIGIBLE" | "NOT_ELIGIBLE" | "PENDING_VERIFICATION" | "TEMPORARILY_UNAVAILABLE" = "ELIGIBLE"
    if (!isVerified) {
        bloodEligibility = "PENDING_VERIFICATION"
    } else if (profile?.healthStatus === "UNFIT") {
        bloodEligibility = "NOT_ELIGIBLE"
    } else if (isCooldownActive || profile?.healthStatus === "TEMPORARILY_UNAVAILABLE" || !isActive) {
        bloodEligibility = "TEMPORARILY_UNAVAILABLE"
    }

    const pendingReservations = reservations.filter((r) => r.status === "PENDING").length

    const handleVerificationSubmit = async () => {
        if (!selectedHospitalId) {
            alert("Please choose a hospital.")
            return
        }

        const hospital = (nearbyHospitals || []).find((h) => h._id === selectedHospitalId)
        if (!hospital) return

        setSubmittingVerification(true)
        try {
            await requestVerificationMutation({
                hospitalId: hospital._id,
                hospitalName: hospital.name,
                selfReportedBloodGroup: selfReportedGroup || selfReportedBloodGroup || "O+",
                contactNumber: contactNumber || profile?.contactNumber,
                dateOfBirth: dateOfBirth || profile?.dateOfBirth,
                address: address || profile?.address,
            })
            setIsVerificationModalOpen(false)
            alert("Verification request submitted! Please visit the hospital for your clinical screening.")
        } catch (err: any) {
            alert(err.message || "Failed to submit verification request.")
        } finally {
            setSubmittingVerification(false)
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Donor Command Center</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Hospital verification, emergency donation availability, and living/deceased organ pledge matrix.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-card border border-border/60 rounded-full px-4 py-2 shadow-xs shrink-0 self-start sm:self-center">
                    <span className="text-xs text-muted-foreground font-medium">Ready for Matching:</span>
                    <Switch
                        checked={isActive}
                        onCheckedChange={async (checked) => {
                            try {
                                await updateAvailabilityMutation({ isActive: checked })
                            } catch (e) {
                                console.error(e)
                            }
                        }}
                    />
                    <span className={`text-xs font-bold ${isActive ? "text-emerald-500" : "text-zinc-400"}`}>
                        {isActive ? "Active" : "Paused"}
                    </span>
                </div>
            </div>

            {/* 1. TOP VERIFICATION STATUS BANNER */}
            {isUnverified && (
                <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-foreground">Hospital Medical Verification Required</h3>
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/40 text-[10px] font-semibold">
                                    UNVERIFIED
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                                Your profile requires clinical verification at an authorized hospital to confirm your official blood group and activate critical matching.
                            </p>
                        </div>
                    </div>

                    <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-amber-950/20 shrink-0">
                                Request Verification
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[540px] p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
                            <DialogHeader className="space-y-2 pb-2 border-b border-border/40">
                                <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-foreground">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    Request Hospital Medical Verification
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                    Choose an authorized medical center to visit for physical screening and certified blood typing.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-3 text-xs">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Select Registered Hospital</Label>
                                    <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
                                        <SelectTrigger className="h-10 w-full text-xs">
                                            <SelectValue placeholder="Choose a registered hospital..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {(nearbyHospitals || []).map((h) => (
                                                <SelectItem key={h._id} value={h._id} className="text-xs py-2">
                                                    <span className="font-semibold text-foreground">{h.name}</span>
                                                    <span className="text-muted-foreground ml-2">({h.distanceKm} km away) - {h.address}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Self-Reported Blood Group</Label>
                                        <Select value={selfReportedGroup || selfReportedBloodGroup || "O+"} onValueChange={setSelfReportedGroup}>
                                            <SelectTrigger className="h-10 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                                                    <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Date of Birth</Label>
                                        <Input
                                            type="date"
                                            className="h-10 text-xs"
                                            value={dateOfBirth || profile?.dateOfBirth || ""}
                                            onChange={(e) => setDateOfBirth(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Contact Phone Number</Label>
                                    <Input
                                        placeholder="+91 98765 43210"
                                        className="h-10 text-xs"
                                        value={contactNumber || profile?.contactNumber || ""}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Physical Address / City</Label>
                                    <Input
                                        placeholder="City, District, State"
                                        className="h-10 text-xs"
                                        value={address || profile?.address || ""}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>

                                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                                    ℹ️ <em>Note:</em> Your self-reported blood group will be officially confirmed by laboratory tests during your hospital visit.
                                </div>
                            </div>

                            <DialogFooter className="gap-2 pt-2 border-t border-border/40 sm:justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setIsVerificationModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold px-4"
                                    onClick={handleVerificationSubmit}
                                    disabled={submittingVerification || !selectedHospitalId}
                                >
                                    {submittingVerification ? "Submitting..." : "Submit Verification Request"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {verificationStatus === "PENDING" && (
                <div className="p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-500 shrink-0">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-foreground">Verification Pending Clinical Review</h3>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/40 text-[10px]">
                                    PENDING REVIEW
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Verification request submitted to <strong>{verificationInfo?.latestRequest?.hospitalName || "Registered Hospital"}</strong>. Please visit the OPD clinic with valid photo ID.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {verificationStatus === "FURTHER_EVALUATION_REQUIRED" && (
                <div className="p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-500 shrink-0">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-foreground">Additional Medical Screening Required</h3>
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/40 text-[10px]">
                                    SCREENING REQUIRED
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Hospital remarks: {verificationInfo?.latestRequest?.medicalNotes || "Additional blood tests and clinical examination requested."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {isVerified && (
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-500 shrink-0">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-foreground">Officially Verified Donor Profile</h3>
                                <Badge className="bg-emerald-600 text-white text-[10px]">VERIFIED</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Verified by <strong>{verificationInfo?.verifiedByHospitalName || "Registered Hospital"}</strong> on{" "}
                                {verificationInfo?.verifiedAt ? new Date(verificationInfo.verifiedAt).toLocaleDateString() : "Active Record"}.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. TWO MAJOR DOMAIN CARDS: BLOOD DONATION & ORGAN DONATION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CARD 1: BLOOD DONATION */}
                <Card className="rounded-2xl border-red-500/20 bg-gradient-to-br from-red-500/5 via-card to-card relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <div>
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                                        <Droplet className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Blood Donation</CardTitle>
                                        <CardDescription className="text-xs">Hospital-certified typing & cooldown</CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] shrink-0 ${
                                        bloodEligibility === "ELIGIBLE"
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                            : bloodEligibility === "PENDING_VERIFICATION"
                                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                            : "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                    }`}
                                >
                                    {bloodEligibility.replace("_", " ")}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border border-border/60 bg-background/80 space-y-1.5">
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                                        {isVerified ? <Lock className="h-3 w-3 text-emerald-500" /> : null}
                                        {isVerified ? "Verified Blood Group" : "Self-Reported Group"}
                                    </span>
                                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-red-500 tracking-tight">
                                        {isVerified ? verifiedBloodGroup : selfReportedBloodGroup || "?"}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block">
                                        {isVerified ? "Locked by Hospital" : "Pending Verification"}
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl border border-border/60 bg-background/80 space-y-1.5">
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                                        <Clock className="h-3 w-3 text-blue-500" />
                                        56-Day Cooldown
                                    </span>
                                    <div className={`text-lg sm:text-xl font-bold font-mono ${isCooldownActive ? "text-orange-500" : "text-emerald-500"} mt-1`}>
                                        {isCooldownActive ? `${daysRemainingCooldown} Days Left` : "Ready to Donate"}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block truncate">
                                        Last: {lastDonation ? new Date(lastDonation).toLocaleDateString() : "No Prior Donations"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Active Emergency Requisitions:</span>
                                <span className="font-mono font-bold text-purple-400">{pendingReservations} Pending Requests</span>
                            </div>
                        </CardContent>
                    </div>

                    <CardContent className="pt-0">
                        <div className="flex gap-2.5 pt-2">
                            <Link href="/donor/blood" className="flex-1">
                                <Button size="sm" variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5 h-9 rounded-xl">
                                    Blood Matches <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                            <Link href="/donor/history" className="flex-1">
                                <Button size="sm" variant="outline" className="w-full text-xs h-9 rounded-xl">
                                    Donation History
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 2: ORGAN DONATION (LIVING VS DECEASED) */}
                <Card className="rounded-2xl border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-card to-card relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <div>
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                        <HeartHandshake className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Organ Donation</CardTitle>
                                        <CardDescription className="text-xs">Living evaluations & post-mortem pledges</CardDescription>
                                    </div>
                                </div>
                                <Link href="/donor/organ/preferences">
                                    <Button size="sm" variant="ghost" className="text-xs text-purple-400 hover:text-purple-300 h-8 px-2.5">
                                        Manage →
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Living Candidates */}
                            <div className="space-y-2">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Living Candidate Workups:
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {["KIDNEY", "LIVER"].map((organType) => {
                                        const pref = (organPreferences || []).find((p) => p.organType === organType)
                                        const status = pref?.eligibilityStatus || "NOT_EVALUATED"
                                        return (
                                            <div key={organType} className="p-3 rounded-xl border border-border/60 bg-background/80 text-xs flex items-center justify-between">
                                                <span className="font-semibold text-foreground">{organType === "KIDNEY" ? "Kidney" : "Liver Lobe"}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] font-mono ${
                                                        status === "ELIGIBLE"
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                            : status === "PENDING"
                                                            ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {status.replace("_", " ")}
                                                </Badge>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Deceased Pledges */}
                            <div className="space-y-2">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Deceased Pledges:
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    {["HEART", "LUNGS", "CORNEA"].map((organType) => {
                                        const pref = (organPreferences || []).find((p) => p.organType === organType)
                                        const isPledged = pref?.preferenceStatus === "PLEDGED"
                                        return (
                                            <div key={organType} className="p-2.5 rounded-xl border border-border/60 bg-background/80">
                                                <div className="font-semibold text-foreground text-xs">{organType}</div>
                                                <div className={`text-[10px] mt-0.5 font-medium ${isPledged ? "text-emerald-500" : "text-muted-foreground"}`}>
                                                    {isPledged ? "✓ Pledged" : "Not Pledged"}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </div>

                    <CardContent className="pt-0">
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                            💡 <em>Note:</em> Living donation requires hospital cross-matching. Deceased pledges activate under statutory consent and clinical death determination.
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. IMPACT & COMMUNITY STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Cumulative Drives</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground mt-1">{totalDonations}</div>
                    <span className="text-[10px] text-muted-foreground">Successful donations</span>
                </Card>

                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Lives Impacted</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-pink-500 mt-1">{totalDonations * LIVES_SAVED_PER_DONATION}</div>
                    <span className="text-[10px] text-muted-foreground">~3 lives per unit</span>
                </Card>

                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Reliability Score</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-500 mt-1">{Math.round(reliabilityScore * 100)}%</div>
                    <span className="text-[10px] text-muted-foreground">Response & attendance</span>
                </Card>

                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Verification Status</span>
                    <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${isVerified ? "text-emerald-500" : isPending ? "text-blue-500" : "text-amber-500"} mt-1`}>
                        {isVerified ? "VERIFIED" : isPending ? "PENDING" : isFurtherEval ? "FURTHER SCREENING" : isRejected ? "REJECTED" : "UNVERIFIED"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        {isVerified ? "Hospital Certified" : isPending ? "Pending Review" : "Action Needed"}
                    </span>
                </Card>
            </div>
        </div>
    )
}
