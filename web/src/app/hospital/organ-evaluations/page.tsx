"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Activity,
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    Filter,
    HeartHandshake,
    MapPin,
    Phone,
    Search,
    ShieldAlert,
    ShieldCheck,
    Stethoscope,
    UserCheck,
    UserPlus,
    Users,
    XCircle,
} from "lucide-react"

export default function HospitalOrganEvaluationsPage() {
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "FURTHER_EVALUATION" | null>(null)
    const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false)

    // Form states
    const [medicalNotes, setMedicalNotes] = useState("")
    const [rejectionReason, setRejectionReason] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // Query all living organ evaluation requests submitted by donors
    const evaluationRequests = useQuery(api.organPreferences.getHospitalOrganEvaluationRequests, {
        status: statusFilter,
    })

    // Query candidates matched from organ requisitions
    const requisitionCandidates = useQuery(api.organRequests.getHospitalEvaluationQueue, {
        status: statusFilter,
    })

    const processEvaluationMutation = useMutation(api.organPreferences.processOrganEvaluation)
    const processCandidateMutation = useMutation(api.organRequests.processCandidateMedicalEvaluation)

    // Combine requests
    const allRequests: any[] = []

    if (evaluationRequests) {
        evaluationRequests.forEach((r) => {
            allRequests.push({
                ...r,
                sourceType: "DIRECT_DONOR_REQUEST",
            })
        })
    }

    if (requisitionCandidates) {
        requisitionCandidates.forEach((c) => {
            allRequests.push({
                _id: c._id,
                donorName: c.donorName,
                donorUserId: c.donorUserId,
                donorContact: undefined,
                donorAddress: undefined,
                bloodGroup: c.donorBloodGroup,
                organType: c.organType,
                donationType: c.donationType,
                status: c.evaluationStatus,
                requestedAt: c.createdAt,
                medicalNotes: c.medicalAssessment || c.diagnosticNotes,
                patientReference: c.patientReference,
                urgency: c.urgency,
                assignedDoctorName: c.assignedDoctorName,
                sourceType: "REQUISITION_CANDIDATE",
            })
        })
    }

    const filteredRequests = allRequests.filter((r) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            (r.donorName && r.donorName.toLowerCase().includes(q)) ||
            (r.organType && r.organType.toLowerCase().includes(q)) ||
            (r.bloodGroup && r.bloodGroup.toLowerCase().includes(q)) ||
            (r.appointmentDate && r.appointmentDate.toLowerCase().includes(q))
        )
    })

    const openDecisionModal = (req: any, action: "APPROVE" | "REJECT" | "FURTHER_EVALUATION") => {
        setSelectedRequest(req)
        setActionType(action)
        setMedicalNotes(req.medicalNotes || "")
        setRejectionReason("")
        setIsDecisionModalOpen(true)
    }

    const handleDecisionSubmit = async () => {
        if (!selectedRequest || !actionType) return

        if (actionType === "REJECT" && !rejectionReason.trim()) {
            alert("Please provide a clinical justification for rejection.")
            return
        }

        setSubmitting(true)
        try {
            if (selectedRequest.sourceType === "DIRECT_DONOR_REQUEST") {
                const decision =
                    actionType === "APPROVE"
                        ? "APPROVED"
                        : actionType === "REJECT"
                        ? "REJECTED"
                        : "FURTHER_EVALUATION_REQUIRED"

                await processEvaluationMutation({
                    requestId: selectedRequest._id,
                    decision,
                    rejectionReason: actionType === "REJECT" ? rejectionReason : undefined,
                    medicalNotes: medicalNotes || undefined,
                })
            } else {
                const evalStatus =
                    actionType === "APPROVE"
                        ? "ELIGIBLE"
                        : actionType === "REJECT"
                        ? "INELIGIBLE"
                        : "FURTHER_EVALUATION_REQUIRED"

                await processCandidateMutation({
                    candidateId: selectedRequest._id,
                    evaluationStatus: evalStatus,
                    medicalAssessment: medicalNotes || undefined,
                    diagnosticNotes: rejectionReason || undefined,
                })
            }

            setIsDecisionModalOpen(false)
            setSelectedRequest(null)
            alert("Clinical evaluation decision recorded and donor notified in real time.")
        } catch (err: any) {
            alert(err.message || "Failed to process decision.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Organ Medical Evaluation Queue
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Review incoming living donor appointment requests, candidate matches, and record official clinical eligibility decisions.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 rounded-2xl">
                <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-muted-foreground ml-1" />
                    <Input
                        placeholder="Search by Donor Name, Organ, Blood Group, Appointment Date..."
                        className="h-9 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 text-xs w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                            <SelectItem value="PENDING" className="text-xs">Pending Review</SelectItem>
                            <SelectItem value="APPROVED" className="text-xs">Approved / Eligible</SelectItem>
                            <SelectItem value="REJECTED" className="text-xs">Rejected / Ineligible</SelectItem>
                            <SelectItem value="FURTHER_EVALUATION_REQUIRED" className="text-xs">Further Screening</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl bg-card/30">
                        <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="font-semibold text-sm text-foreground">No Incoming Organ Evaluation Requests</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                            When donors request living organ evaluation appointments or match with hospital requisitions, they will appear in this real-time queue.
                        </p>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <Card key={req._id} className="rounded-2xl border-border/60 bg-card/80 hover:bg-card transition-all p-4 sm:p-5 shadow-xs overflow-hidden">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                            {req.donorName}
                                        </h3>
                                        {req.bloodGroup && (
                                            <Badge variant="outline" className="text-[10px] font-mono font-bold text-red-500 border-red-500/30">
                                                ABO: {req.bloodGroup}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                            {req.organType.replace(/_/g, " ")} ({req.donationType || "LIVING"})
                                        </Badge>
                                        <Badge
                                            className={`text-[10px] ${
                                                req.status === "APPROVED" || req.status === "ELIGIBLE"
                                                    ? "bg-emerald-600 text-white"
                                                    : req.status === "REJECTED" || req.status === "INELIGIBLE"
                                                    ? "bg-red-600 text-white"
                                                    : req.status === "FURTHER_EVALUATION_REQUIRED"
                                                    ? "bg-purple-600 text-white"
                                                    : "bg-amber-600 text-white"
                                            }`}
                                        >
                                            {req.status.replace(/_/g, " ")}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                                        {req.appointmentDate && (
                                            <span className="flex items-center gap-1 text-foreground font-semibold">
                                                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                                Appointment: {req.appointmentDate} ({req.appointmentTimeSlot || "Morning"})
                                            </span>
                                        )}
                                        {req.donorContact && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-blue-400" /> {req.donorContact}
                                            </span>
                                        )}
                                        {req.donorAddress && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {req.donorAddress}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            Requested: {new Date(req.requestedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {req.medicalNotes && (
                                        <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 mt-1">
                                            📝 <strong>Donor Notes / Health History:</strong> {req.medicalNotes}
                                        </div>
                                    )}

                                    {req.rejectionReason && (
                                        <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 mt-1">
                                            ⚠️ <strong>Clinical Reason:</strong> {req.rejectionReason}
                                        </div>
                                    )}
                                </div>

                                {req.status === "PENDING" && (
                                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 h-9 rounded-xl flex items-center gap-1.5 shadow-sm"
                                            onClick={() => openDecisionModal(req, "APPROVE")}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Clear
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs font-semibold px-3 h-9 rounded-xl flex items-center gap-1.5"
                                            onClick={() => openDecisionModal(req, "FURTHER_EVALUATION")}
                                        >
                                            Further Screening
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold px-3 h-9 rounded-xl flex items-center gap-1.5"
                                            onClick={() => openDecisionModal(req, "REJECT")}
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> Decline
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* CLINICAL DECISION MODAL */}
            <Dialog open={isDecisionModalOpen} onOpenChange={setIsDecisionModalOpen}>
                <DialogContent className="sm:max-w-[540px] p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
                    <DialogHeader className="space-y-2 pb-2 border-b border-border/40">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-foreground">
                            {actionType === "APPROVE" && <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="h-5 w-5" /></div>}
                            {actionType === "REJECT" && <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><XCircle className="h-5 w-5" /></div>}
                            {actionType === "FURTHER_EVALUATION" && <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><AlertCircle className="h-5 w-5" /></div>}
                            {actionType === "APPROVE" ? "Accept & Confirm Evaluation" : actionType === "REJECT" ? "Decline Organ Evaluation Request" : "Request Further Screening"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Donor: <strong className="text-foreground">{selectedRequest?.donorName}</strong> | Organ: <strong className="text-foreground">{selectedRequest?.organType}</strong> | Blood Group: <strong className="text-red-500 font-mono">{selectedRequest?.bloodGroup}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3 text-xs">
                        {actionType === "REJECT" && (
                            <div className="space-y-1.5">
                                <Label className="text-red-500 font-semibold text-xs">Clinical Reason for Ineligibility / Decline</Label>
                                <Textarea
                                    placeholder="Explain clinical contraindications, renal threshold, anatomical factors..."
                                    className="text-xs min-h-[80px]"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-foreground font-semibold text-xs">Medical Screening & Appointment Notes (Optional)</Label>
                            <Textarea
                                placeholder="Confirmed appointment date/time, lab instructions, fasting requirements..."
                                className="text-xs min-h-[70px]"
                                value={medicalNotes}
                                onChange={(e) => setMedicalNotes(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                            🔒 <em>Real-Time Notification:</em> Recording this decision will immediately update the donor's dashboard and send an alert with your appointment notes.
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2 border-t border-border/40 sm:justify-end">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setIsDecisionModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className={
                                actionType === "APPROVE"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4"
                                    : actionType === "REJECT"
                                    ? "bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4"
                                    : "bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4"
                            }
                            onClick={handleDecisionSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : `Confirm ${actionType?.replace(/_/g, " ")}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
