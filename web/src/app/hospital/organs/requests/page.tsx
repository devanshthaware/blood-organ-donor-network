"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    Filter,
    HeartHandshake,
    Plus,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Users,
} from "lucide-react"
import Link from "next/link"

const SUPPORTED_ORGANS = [
    { organType: "KIDNEY", label: "Kidney", allowsLiving: true, department: "Nephrology / Transplant Surgery" },
    { organType: "LIVER_LOBE", label: "Liver Lobe", allowsLiving: true, department: "Hepatobiliary Surgery" },
    { organType: "HEART", label: "Heart", allowsLiving: false, department: "Cardiothoracic Surgery" },
    { organType: "LUNGS", label: "Lungs", allowsLiving: false, department: "Pulmonary / Thoracic Surgery" },
    { organType: "PANCREAS", label: "Pancreas", allowsLiving: false, department: "Transplant Endocrinology" },
    { organType: "CORNEA", label: "Cornea", allowsLiving: false, department: "Ophthalmology" },
    { organType: "TISSUES", label: "Tissues & Valves", allowsLiving: false, department: "Regenerative Medicine" },
]

export default function HospitalOrganRequestsPage() {
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Form fields
    const [organType, setOrganType] = useState("KIDNEY")
    const [donationType, setDonationType] = useState<"LIVING" | "DECEASED">("LIVING")
    const [urgency, setUrgency] = useState<"STANDARD" | "URGENT" | "CRITICAL">("URGENT")
    const [patientReference, setPatientReference] = useState("")
    const [patientAge, setPatientAge] = useState("")
    const [requiredBloodGroup, setRequiredBloodGroup] = useState("O+")
    const [department, setDepartment] = useState("Nephrology / Transplant Surgery")
    const [compatibilityCriteria, setCompatibilityCriteria] = useState("")
    const [description, setDescription] = useState("")
    const [legalConfirmation, setLegalConfirmation] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const organRequests = useQuery(api.organRequests.getHospitalOrganRequests, {
        status: statusFilter,
        search: searchQuery,
    })

    const createOrganRequestMutation = useMutation(api.organRequests.createOrganRequest)

    const handleOrganTypeChange = (selected: string) => {
        setOrganType(selected)
        const organCfg = SUPPORTED_ORGANS.find((o) => o.organType === selected)
        if (organCfg) {
            setDepartment(organCfg.department)
            if (!organCfg.allowsLiving) {
                setDonationType("DECEASED")
            }
        }
    }

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!patientReference.trim()) {
            alert("Please enter a patient reference ID.")
            return
        }
        if (!description.trim()) {
            alert("Please enter a clinical request description.")
            return
        }
        if (!legalConfirmation) {
            alert("You must certify the legal authorization confirmation to submit.")
            return
        }

        setSubmitting(true)
        try {
            await createOrganRequestMutation({
                organType,
                donationType,
                urgency,
                patientReference,
                patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
                requiredBloodGroup,
                department,
                compatibilityCriteria: compatibilityCriteria || undefined,
                description,
                legalConfirmation: true,
            })
            setIsCreateModalOpen(false)
            // Reset form
            setPatientReference("")
            setPatientAge("")
            setDescription("")
            setCompatibilityCriteria("")
            setLegalConfirmation(false)
            alert("Organ request created and activated! The matching engine has searched for eligible verified donors.")
        } catch (err: any) {
            alert(err.message || "Failed to create organ request.")
        } finally {
            setSubmitting(false)
        }
    }

    const totalRequests = organRequests?.length || 0
    const activeRequests = (organRequests || []).filter((r) => r.status === "ACTIVE" || r.status === "MATCHING" || r.status === "CANDIDATES_FOUND").length
    const criticalRequests = (organRequests || []).filter((r) => r.urgency === "CRITICAL").length
    const totalCandidatesFound = (organRequests || []).reduce((acc, r) => acc + (r.eligibleCandidatesCount || 0), 0)

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Hospital Organ Requests</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Create clinical organ requirements, authorize allocations, and coordinate with verified donors.
                    </p>
                </div>

                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-purple-950/20 shrink-0 flex items-center gap-1.5">
                            <Plus className="w-4 h-4" /> Create Organ Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
                        <form onSubmit={handleCreateSubmit}>
                            <DialogHeader className="space-y-2 pb-3 border-b border-border/40">
                                <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-foreground">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <HeartHandshake className="h-5 w-5" />
                                    </div>
                                    Create Clinical Organ Request
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Initiate a validated medical organ requisition. All requests are subject to statutory clinical oversight.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Required Organ</Label>
                                        <Select value={organType} onValueChange={handleOrganTypeChange}>
                                            <SelectTrigger className="h-10 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SUPPORTED_ORGANS.map((o) => (
                                                    <SelectItem key={o.organType} value={o.organType} className="text-xs">
                                                        {o.label} {!o.allowsLiving && "(Deceased Only)"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Donation Pathway</Label>
                                        <Select
                                            value={donationType}
                                            onValueChange={(v: any) => setDonationType(v)}
                                            disabled={!SUPPORTED_ORGANS.find((o) => o.organType === organType)?.allowsLiving}
                                        >
                                            <SelectTrigger className="h-10 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LIVING" className="text-xs">Living Donor (Paired / Direct)</SelectItem>
                                                <SelectItem value="DECEASED" className="text-xs">Deceased Donor (Post-Mortem)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Urgency Tier</Label>
                                        <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                                            <SelectTrigger className="h-10 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STANDARD" className="text-xs">Standard</SelectItem>
                                                <SelectItem value="URGENT" className="text-xs">Urgent</SelectItem>
                                                <SelectItem value="CRITICAL" className="text-xs">Critical (Immediate)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Required Blood Group</Label>
                                        <Select value={requiredBloodGroup} onValueChange={setRequiredBloodGroup}>
                                            <SelectTrigger className="h-10 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "ANY"].map((g) => (
                                                    <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Patient Reference ID</Label>
                                        <Input
                                            placeholder="e.g. #P-204"
                                            className="h-10 text-xs font-mono"
                                            value={patientReference}
                                            onChange={(e) => setPatientReference(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Patient Age (Optional)</Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 45"
                                            className="h-10 text-xs"
                                            value={patientAge}
                                            onChange={(e) => setPatientAge(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground font-semibold text-xs">Hospital Department</Label>
                                        <Input
                                            className="h-10 text-xs"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Compatibility & Clinical Criteria</Label>
                                    <Input
                                        placeholder="e.g. HLA cross-match negative, PRA < 10%, weight ratio > 0.8"
                                        className="h-10 text-xs"
                                        value={compatibilityCriteria}
                                        onChange={(e) => setCompatibilityCriteria(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground font-semibold text-xs">Request Description & Medical Context</Label>
                                    <Textarea
                                        placeholder="Clinical diagnosis, end-stage organ condition, urgency justification..."
                                        className="text-xs min-h-[70px]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Statutory Legal Authorization */}
                                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                                    <div className="flex items-start gap-2.5">
                                        <input
                                            type="checkbox"
                                            id="legalConfirm"
                                            className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0"
                                            checked={legalConfirmation}
                                            onChange={(e) => setLegalConfirmation(e.target.checked)}
                                            required
                                        />
                                        <label htmlFor="legalConfirm" className="text-[11px] text-foreground font-medium leading-relaxed cursor-pointer">
                                            «I confirm that this request is being created for a legitimate medical purpose and will be handled according to applicable medical, legal, consent, allocation, and transplantation procedures.»
                                        </label>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span>Zero-Marketplace Invariant: Organ procurement operates strictly under non-financial clinical protocols.</span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 pt-2 border-t border-border/40 sm:justify-end">
                                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold px-4"
                                    disabled={submitting || !legalConfirmation}
                                >
                                    {submitting ? "Submitting & Matching..." : "Authorize & Activate Request"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metric Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Total Requisitions</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground mt-1">{totalRequests}</div>
                    <span className="text-[10px] text-muted-foreground">All time hospital records</span>
                </Card>

                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Active Requisitions</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-500 mt-1">{activeRequests}</div>
                    <span className="text-[10px] text-muted-foreground">Under active matching</span>
                </Card>

                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Critical Priority</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-500 mt-1">{criticalRequests}</div>
                    <span className="text-[10px] text-muted-foreground">Immediate clinical urgency</span>
                </Card>

                <Card className="p-4 rounded-2xl border-border/60 bg-card/60">
                    <span className="text-xs text-muted-foreground font-medium">Potential Candidates</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-500 mt-1">{totalCandidatesFound}</div>
                    <span className="text-[10px] text-muted-foreground">Verified eligible matches</span>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 rounded-2xl">
                <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-muted-foreground ml-1" />
                    <Input
                        placeholder="Search by Request ID, Organ, Patient Ref (#P-...), or Department..."
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
                            <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                            <SelectItem value="MATCHING" className="text-xs">Matching</SelectItem>
                            <SelectItem value="CANDIDATES_FOUND" className="text-xs">Candidates Found</SelectItem>
                            <SelectItem value="EVALUATION_IN_PROGRESS" className="text-xs">In Evaluation</SelectItem>
                            <SelectItem value="FULFILLED" className="text-xs">Fulfilled</SelectItem>
                            <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-3">
                {(!organRequests || organRequests.length === 0) ? (
                    <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl bg-card/30">
                        <HeartHandshake className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="font-semibold text-sm text-foreground">No Organ Requests Found</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            No clinical organ requisitions match your criteria. Click "Create Organ Request" to initiate a new requisition.
                        </p>
                    </div>
                ) : (
                    organRequests.map((req) => (
                        <Card key={req._id} className="rounded-2xl border-border/60 bg-card/80 hover:bg-card transition-all overflow-hidden shadow-xs">
                            <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground">
                                            OR-{req._id.slice(-6).toUpperCase()}
                                        </span>
                                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                            {req.organType.replace(/_/g, " ")}
                                        </h3>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-bold ${
                                                req.urgency === "CRITICAL"
                                                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                                                    : req.urgency === "URGENT"
                                                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                                    : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                            }`}
                                        >
                                            {req.urgency}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                            {req.donationType} DONATION
                                        </Badge>
                                        <Badge className="text-[10px] bg-emerald-600 text-white">
                                            {req.status.replace(/_/g, " ")}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {req.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                                        <span>Patient: <strong className="text-foreground font-mono">{req.patientReference}</strong></span>
                                        <span>Blood Group: <strong className="text-red-500 font-mono">{req.requiredBloodGroup}</strong></span>
                                        <span>Department: <strong className="text-foreground">{req.department}</strong></span>
                                        <span>Requested: <strong className="text-foreground">{new Date(req.requestDate || req.createdAt).toLocaleDateString()}</strong></span>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground font-medium">Eligible Candidates</div>
                                        <div className="text-xl font-mono font-extrabold text-emerald-500">
                                            {req.eligibleCandidatesCount || 0} Matched
                                        </div>
                                    </div>

                                    <Link href={`/hospital/organs/requests/${req._id}`}>
                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 h-9 rounded-xl flex items-center gap-1.5">
                                            View Candidates <ArrowRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
