"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    HeartHandshake,
    Info,
    Lock,
    Phone,
    MapPin,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Heart,
} from "lucide-react"
import Link from "next/link"

export default function OrganPreferencesPage() {
    const preferences = useQuery(api.organPreferences.getDonorOrganPreferences, {})
    const supportedOrgans = useQuery(api.organPreferences.getSupportedOrganTypes, {})
    const nearbyHospitals = useQuery(api.donorVerification.getNearbyHospitalsForVerification, {})
    const verificationInfo = useQuery(api.donorVerification.getVerificationStatus, {})

    const setPreferenceMutation = useMutation(api.organPreferences.setOrganPreference)
    const requestEvaluationMutation = useMutation(api.organPreferences.requestOrganEvaluation)

    const [selectedOrganForEval, setSelectedOrganForEval] = useState<any>(null)
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)
    const [selectedHospitalId, setSelectedHospitalId] = useState("")
    const [donorName, setDonorName] = useState("")
    const [donorContact, setDonorContact] = useState("")
    const [donorAddress, setDonorAddress] = useState("")
    const [bloodGroup, setBloodGroup] = useState("O+")
    const [appointmentDate, setAppointmentDate] = useState("")
    const [appointmentTimeSlot, setAppointmentTimeSlot] = useState("09:00 AM - 12:00 PM")
    const [medicalNotes, setMedicalNotes] = useState("")
    const [submittingEval, setSubmittingEval] = useState(false)

    const isVerified = verificationInfo?.verificationStatus === "VERIFIED"
    const donorProfile = verificationInfo?.donor

    const handlePreferenceToggle = async (
        organ: any,
        donationType: "LIVING" | "DECEASED",
        preferenceStatus: "INTERESTED" | "PLEDGED" | "WITHDRAWN"
    ) => {
        try {
            await setPreferenceMutation({
                organType: organ.organType,
                donationType,
                preferenceStatus,
            })
        } catch (err: any) {
            alert(err.message || "Failed to update organ preference.")
        }
    }

    const openEvaluationModal = (organ: any) => {
        setSelectedOrganForEval(organ)
        setDonorName(donorProfile?.fullName || "")
        setDonorContact(donorProfile?.contactNumber || "")
        setDonorAddress(donorProfile?.address || "")
        setBloodGroup(verificationInfo?.verifiedBloodGroup || verificationInfo?.selfReportedBloodGroup || "O+")
        setIsEvaluationModalOpen(true)
    }

    const handleEvaluationSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedOrganForEval) return
        if (!selectedHospitalId) {
            alert("Please choose a registered hospital for your evaluation.")
            return
        }
        if (!appointmentDate) {
            alert("Please select a preferred appointment date.")
            return
        }

        const hospital = (nearbyHospitals || []).find((h: any) => h._id === selectedHospitalId)
        if (!hospital) return

        setSubmittingEval(true)
        try {
            await requestEvaluationMutation({
                organType: selectedOrganForEval.organType,
                hospitalId: hospital._id,
                hospitalName: hospital.name,
                donorName: donorName || donorProfile?.fullName,
                donorContact: donorContact || donorProfile?.contactNumber,
                donorAddress: donorAddress || donorProfile?.address,
                bloodGroup: bloodGroup || verificationInfo?.selfReportedBloodGroup,
                appointmentDate,
                appointmentTimeSlot,
                medicalNotes: medicalNotes || undefined,
            })
            setIsEvaluationModalOpen(false)
            setSelectedOrganForEval(null)
            setSelectedHospitalId("")
            setMedicalNotes("")
            alert(`Appointment request sent to ${hospital.name} for ${appointmentDate} (${appointmentTimeSlot})! The hospital will review and confirm.`)
        } catch (err: any) {
            alert(err.message || "Failed to request organ evaluation.")
        } finally {
            setSubmittingEval(false)
        }
    }

    if (!preferences || !supportedOrgans) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    const livingOrgans = preferences.filter((p: any) => p.allowsLiving)
    const deceasedOrgans = preferences.filter((p: any) => !p.allowsLiving)

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="border-b border-border/40 pb-5">
                <div className="flex items-center gap-2 mb-1">
                    <Link
                        href="/donor/dashboard"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Donor Command Center
                    </Link>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Organ Donation & Medical Evaluation Matrix
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Manage your living candidate workups and post-mortem pledges. Clinical eligibility is evaluated per-organ by transplant centers.
                </p>
            </div>

            {/* Medical / Legal UX Guidance Banner */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-muted-foreground flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-semibold text-foreground">Authoritative Clinical Governance Notice:</p>
                    <p className="leading-relaxed">
                        Living donation eligibility decisions are determined strictly by authorized transplant medical professionals following HLA and clinical cross-matching. Deceased pledges activate under statutory consent and clinical death determination protocols.
                    </p>
                </div>
            </div>

            {/* 1. LIVING ORGAN DONATION SECTION */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                        <Stethoscope className="h-5 w-5 text-purple-500" />
                        Living Organ Donation Candidates
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Organs legally and medically eligible for living donation (Kidney, Liver Lobe). Requires hospital screening appointment.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {livingOrgans.map((organ: any) => {
                        const isInterested = organ.preferenceStatus === "INTERESTED"
                        const status = organ.eligibilityStatus || "NOT_EVALUATED"

                        return (
                            <Card key={organ.organType} className="rounded-2xl border-purple-500/20 bg-card/80 flex flex-col justify-between overflow-hidden shadow-xs">
                                <div>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <CardTitle className="text-base font-bold text-foreground">{organ.label}</CardTitle>
                                                <CardDescription className="text-xs">{organ.description}</CardDescription>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] shrink-0 font-semibold ${
                                                    status === "ELIGIBLE"
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                        : status === "PENDING"
                                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                                        : status === "INELIGIBLE"
                                                        ? "bg-red-500/10 text-red-500 border-red-500/30"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                {status.replace(/_/g, " ")}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                                            <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                                                <span className="text-[10px] text-muted-foreground block font-medium">Candidate Status</span>
                                                <span className="font-bold text-foreground mt-0.5 block">
                                                    {isInterested ? "✓ Registered" : "Not Registered"}
                                                </span>
                                            </div>
                                            <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                                                <span className="text-[10px] text-muted-foreground block font-medium">Hospital Evaluation</span>
                                                <span className="font-bold text-foreground mt-0.5 block">{status.replace(/_/g, " ")}</span>
                                            </div>
                                        </div>

                                        {(organ as any).evaluatedByHospitalName && (
                                            <div className="text-[11px] text-muted-foreground p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                                                <div>Evaluated by: <strong className="text-foreground">{(organ as any).evaluatedByHospitalName}</strong></div>
                                                <div>Date: <strong className="text-foreground">{(organ as any).evaluatedAt ? new Date((organ as any).evaluatedAt).toLocaleDateString() : "-"}</strong></div>
                                                {(organ as any).evaluationNotes && <div>Remarks: {(organ as any).evaluationNotes}</div>}
                                            </div>
                                        )}
                                    </CardContent>
                                </div>

                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                                        {!isInterested ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-xs font-semibold h-9 rounded-xl"
                                                onClick={() => handlePreferenceToggle(organ, "LIVING", "INTERESTED")}
                                            >
                                                Register Interest
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs text-red-500 hover:text-red-400 h-9 rounded-xl px-3 shrink-0"
                                                    onClick={() => handlePreferenceToggle(organ, "LIVING", "WITHDRAWN")}
                                                >
                                                    Withdraw
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold h-9 rounded-xl truncate"
                                                    disabled={status === "PENDING"}
                                                    onClick={() => openEvaluationModal(organ)}
                                                >
                                                    {status === "PENDING" ? "Evaluation Pending..." : "Request Hospital Evaluation"}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* 2. DECEASED ORGAN PLEDGE SECTION */}
            <div className="space-y-4 pt-4 border-t border-border/40">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                        <Heart className="h-5 w-5 text-red-500" />
                        Deceased Organ & Tissue Pledges
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Post-mortem donation pledges under legal, ethical, and clinical consent protocols.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {deceasedOrgans.map((organ: any) => {
                        const isPledged = organ.preferenceStatus === "PLEDGED"

                        return (
                            <Card key={organ.organType} className="rounded-2xl border-border/60 bg-card/60 p-4 flex flex-col justify-between shadow-xs">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-sm text-foreground">{organ.label}</h3>
                                        <Badge
                                            variant="outline"
                                            className={`text-[9px] font-semibold ${isPledged ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}`}
                                        >
                                            {isPledged ? "PLEDGED" : "NOT PLEDGED"}
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{organ.description}</p>
                                </div>

                                <div className="pt-3">
                                    <Button
                                        size="sm"
                                        variant={isPledged ? "outline" : "default"}
                                        className={`w-full text-xs h-8 rounded-xl font-semibold ${
                                            isPledged ? "text-red-400 hover:text-red-300" : "bg-purple-600 hover:bg-purple-700 text-white"
                                        }`}
                                        onClick={() => handlePreferenceToggle(organ, "DECEASED", isPledged ? "WITHDRAWN" : "PLEDGED")}
                                    >
                                        {isPledged ? "Cancel Pledge" : "Pledge Organ"}
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* REQUEST HOSPITAL EVALUATION MODAL */}
            <Dialog open={isEvaluationModalOpen} onOpenChange={setIsEvaluationModalOpen}>
                <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleEvaluationSubmit}>
                        <DialogHeader className="space-y-2 pb-3 border-b border-border/40">
                            <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-foreground">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                    <Stethoscope className="h-5 w-5" />
                                </div>
                                Book Living {selectedOrganForEval?.label} Evaluation
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                Schedule a clinical workup appointment with an authorized regional transplant center for comprehensive laboratory and compatibility screening.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            <div className="space-y-1.5">
                                <Label className="text-foreground font-semibold text-xs">Select Transplant Center / Hospital</Label>
                                <Select value={selectedHospitalId} onValueChange={setSelectedHospitalId}>
                                    <SelectTrigger className="h-10 text-xs w-full">
                                        <SelectValue placeholder="Choose a registered hospital..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {(nearbyHospitals || []).map((h: any) => (
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
                                    <Label className="text-foreground font-semibold text-xs">Donor Full Name</Label>
                                    <Input
                                        className="h-10 text-xs"
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Blood Group</Label>
                                    <Select value={bloodGroup} onValueChange={setBloodGroup}>
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
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Contact Phone Number</Label>
                                    <Input
                                        placeholder="+91 98765 43210"
                                        className="h-10 text-xs"
                                        value={donorContact}
                                        onChange={(e) => setDonorContact(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Physical Address / City</Label>
                                    <Input
                                        placeholder="City, District, State"
                                        className="h-10 text-xs"
                                        value={donorAddress}
                                        onChange={(e) => setDonorAddress(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Preferred Appointment Date</Label>
                                    <Input
                                        type="date"
                                        className="h-10 text-xs"
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Preferred Time Slot</Label>
                                    <Select value={appointmentTimeSlot} onValueChange={setAppointmentTimeSlot}>
                                        <SelectTrigger className="h-10 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="09:00 AM - 12:00 PM" className="text-xs">Morning (09:00 AM - 12:00 PM)</SelectItem>
                                            <SelectItem value="02:00 PM - 05:00 PM" className="text-xs">Afternoon (02:00 PM - 05:00 PM)</SelectItem>
                                            <SelectItem value="05:00 PM - 08:00 PM" className="text-xs">Evening (05:00 PM - 08:00 PM)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-foreground font-semibold text-xs">Medical Notes & Health History (Optional)</Label>
                                <Textarea
                                    placeholder="Any previous surgeries, allergies, health conditions, or coordinator notes..."
                                    className="text-xs min-h-[60px]"
                                    value={medicalNotes}
                                    onChange={(e) => setMedicalNotes(e.target.value)}
                                />
                            </div>

                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-muted-foreground leading-relaxed">
                                💡 <em>Note:</em> Submitting will immediately transmit your appointment request to the hospital's Organ Medical Evaluation Queue.
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2 border-t border-border/40 sm:justify-end">
                            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsEvaluationModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4"
                                disabled={submittingEval || !selectedHospitalId || !appointmentDate}
                            >
                                {submittingEval ? "Sending..." : "Submit Appointment Request"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
