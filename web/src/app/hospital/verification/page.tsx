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
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    Filter,
    Phone,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    User,
    UserCheck,
    UserX,
    Users,
    XCircle,
} from "lucide-react"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export default function HospitalVerificationPage() {
    const [statusFilter, setStatusFilter] = useState<string>("PENDING")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form states
    const [verifiedBloodGroup, setVerifiedBloodGroup] = useState<string>("")
    const [medicalNotes, setMedicalNotes] = useState<string>("")
    const [rejectionReason, setRejectionReason] = useState<string>("")
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "FURTHER_EVALUATION" | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const verificationRequests = useQuery(api.donorVerification.getHospitalVerificationRequests, {
        status: statusFilter,
    })

    const processMutation = useMutation(api.donorVerification.processDonorVerification)

    const filteredRequests = (verificationRequests || []).filter((r) => {
        if (!searchQuery) return true
        return (
            r.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.selfReportedBloodGroup && r.selfReportedBloodGroup.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    })

    const openReviewModal = (request: any, action: "APPROVE" | "REJECT" | "FURTHER_EVALUATION") => {
        setSelectedRequest(request)
        setActionType(action)
        setVerifiedBloodGroup(request.selfReportedBloodGroup || "O+")
        setMedicalNotes("")
        setRejectionReason("")
        setIsModalOpen(true)
    }

    const handleProcessDecision = async () => {
        if (!selectedRequest || !actionType) return

        if (actionType === "APPROVE" && !verifiedBloodGroup) {
            alert("Please confirm the verified blood group.")
            return
        }

        if (actionType === "REJECT" && !rejectionReason.trim()) {
            alert("A rejection reason is required for clinical audit compliance.")
            return
        }

        setSubmitting(true)
        try {
            const decision =
                actionType === "APPROVE"
                    ? "APPROVED"
                    : actionType === "REJECT"
                    ? "REJECTED"
                    : "FURTHER_EVALUATION_REQUIRED"

            await processMutation({
                requestId: selectedRequest._id,
                decision,
                verifiedBloodGroup: actionType === "APPROVE" ? verifiedBloodGroup : undefined,
                rejectionReason: actionType === "REJECT" ? rejectionReason : undefined,
                medicalNotes: medicalNotes || undefined,
            })

            setIsModalOpen(false)
            setSelectedRequest(null)
            alert(`Donor verification updated successfully (${decision}).`)
        } catch (err: any) {
            alert(err.message || "Failed to process verification.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Donor Medical Verification Queue</h1>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        Review incoming donor walk-in requests, confirm laboratory blood typing, and issue official verified badges.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] text-xs">
                            <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Requests</SelectItem>
                            <SelectItem value="PENDING">Pending Review</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="FURTHER_EVALUATION_REQUIRED">Evaluation Required</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by donor name or blood type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                />
            </div>

            {/* Requests Table */}
            <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                        <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-medium">No verification requests found</p>
                        <p className="text-xs mt-1">Pending requests submitted by donors for this hospital will appear here.</p>
                    </Card>
                ) : (
                    filteredRequests.map((request) => (
                        <Card key={request._id} className="overflow-hidden">
                            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-base text-foreground">{request.donorName}</h3>
                                        <Badge
                                            variant="outline"
                                            className={
                                                request.status === "APPROVED"
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs"
                                                    : request.status === "PENDING"
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs"
                                                    : request.status === "REJECTED"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/30 text-xs"
                                                    : "bg-purple-500/10 text-purple-500 border-purple-500/30 text-xs"
                                            }
                                        >
                                            {request.status.replace("_", " ")}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        {request.appointmentDate && (
                                            <span className="text-foreground font-semibold flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5 text-purple-400" /> Appointment: {request.appointmentDate} ({request.appointmentTimeSlot || "Morning"})
                                            </span>
                                        )}
                                        {request.selfReportedBloodGroup && (
                                            <span>Self-Reported: <strong className="text-foreground">{request.selfReportedBloodGroup}</strong></span>
                                        )}
                                        {request.verifiedBloodGroup && (
                                            <span>Hospital Confirmed: <strong className="text-emerald-500">{request.verifiedBloodGroup}</strong></span>
                                        )}
                                        {request.donorContact && (
                                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {request.donorContact}</span>
                                        )}
                                        {request.donorAddress && (
                                            <span>Location: {request.donorAddress}</span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {request.medicalNotes && (
                                        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded mt-1 border">
                                            Notes: {request.medicalNotes}
                                        </div>
                                    )}

                                    {request.rejectionReason && (
                                        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded mt-1 border border-red-500/20">
                                            Rejection Reason: {request.rejectionReason}
                                        </div>
                                    )}
                                </div>

                                {request.status === "PENDING" && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                            onClick={() => openReviewModal(request, "APPROVE")}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Verify
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs text-purple-500"
                                            onClick={() => openReviewModal(request, "FURTHER_EVALUATION")}
                                        >
                                            Further Evaluation
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs text-red-500"
                                            onClick={() => openReviewModal(request, "REJECT")}
                                        >
                                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* REVIEW / DECISION MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[540px] p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
                    <DialogHeader className="space-y-2 pb-2 border-b border-border/40">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-foreground">
                            {actionType === "APPROVE" && <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><ShieldCheck className="h-5 w-5" /></div>}
                            {actionType === "REJECT" && <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><ShieldAlert className="h-5 w-5" /></div>}
                            {actionType === "FURTHER_EVALUATION" && <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><AlertCircle className="h-5 w-5" /></div>}
                            {actionType === "APPROVE" ? "Confirm & Verify Donor" : actionType === "REJECT" ? "Reject Donor Verification" : "Request Additional Screening"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Donor: <strong className="text-foreground">{selectedRequest?.donorName}</strong> | Self-Reported Group: <strong className="text-foreground">{selectedRequest?.selfReportedBloodGroup || "N/A"}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3 text-xs">
                        {actionType === "APPROVE" && (
                            <div className="space-y-1.5">
                                <Label className="text-foreground font-semibold text-xs">Official Verified Blood Group (Hospital Certified)</Label>
                                <Select value={verifiedBloodGroup} onValueChange={setVerifiedBloodGroup}>
                                    <SelectTrigger className="h-10 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOOD_GROUPS.map((g) => (
                                            <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">
                                    🔒 This blood group will be permanently locked into the donor record and certified by your facility.
                                </p>
                            </div>
                        )}

                        {actionType === "REJECT" && (
                            <div className="space-y-1.5">
                                <Label className="text-red-500 font-semibold text-xs">Mandatory Clinical Rejection Reason</Label>
                                <Textarea
                                    placeholder="Explain medical ineligibility or document verification failure..."
                                    className="text-xs min-h-[90px]"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-foreground font-semibold text-xs">Medical Screening & Clinical Notes (Optional)</Label>
                            <Textarea
                                placeholder="Hemoglobin levels, blood pressure, physical screening remarks..."
                                className="text-xs min-h-[70px]"
                                value={medicalNotes}
                                onChange={(e) => setMedicalNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2 border-t border-border/40 sm:justify-end">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setIsModalOpen(false)}>
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
                            onClick={handleProcessDecision}
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : `Confirm ${actionType?.replace("_", " ")}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
