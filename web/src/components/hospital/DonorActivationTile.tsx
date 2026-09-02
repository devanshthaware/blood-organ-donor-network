"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck, UserX, User, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BLOOD_GROUPS } from "@/lib/constants"

interface Donor {
    id: string
    name: string
    email: string
    bloodType: string
    donorStatus: string
    createdAt: any
}

export default function DonorActivationTile() {
    const [donors, setDonors] = useState<Donor[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedBloodGroups, setSelectedBloodGroups] = useState<Record<string, string>>({})

    useEffect(() => {
        // Query for Unverified donors
        // In a real app, you might constrain this by region, but for now we fetch all unverified
        const q = query(
            collection(db, "donors"),
            where("donorStatus", "==", "UNVERIFIED")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const donorData: Donor[] = []
            snapshot.forEach((doc) => {
                donorData.push({ id: doc.id, ...doc.data() } as Donor)
            })
            setDonors(donorData)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching donors:", error)
            setLoading(false)
            if (error.code === 'permission-denied') {
                toast.error("Your hospital account is pending approval. You cannot view donors yet.")
            } else {
                toast.error("Failed to load donor data")
            }
        })

        return () => unsubscribe()
    }, [])

    const handleAction = async (donorId: string, action: "ACTIVATE" | "SUSPEND") => {
        if (!auth.currentUser) return

        // Validate blood group selection for activation
        if (action === "ACTIVATE") {
            const selectedBloodGroup = selectedBloodGroups[donorId]
            if (!selectedBloodGroup) {
                toast.error("Please select a blood group before activating the donor")
                return
            }
        }

        setProcessingId(donorId)

        try {
            const donorRef = doc(db, "donors", donorId)

            if (action === "ACTIVATE") {
                const selectedBloodGroup = selectedBloodGroups[donorId]
                await updateDoc(donorRef, {
                    isActive: true, // Only active donors appear in searches
                    donorStatus: "APPROVED",
                    bloodType: selectedBloodGroup,
                    bloodGroup: selectedBloodGroup,
                    approvedHospitalId: auth.currentUser.uid,
                    approvedAt: serverTimestamp(),
                    reliabilityScore: 0.5, // Initialize reliability on activation
                    totalRequests: 0,
                    acceptedRequests: 0,
                    completedDonations: 0,
                    noShows: 0,
                    verificationNotes: "Account activated by hospital dashboard"
                })
                toast.success(`Donor account activated successfully as ${selectedBloodGroup}`)
                // Clear the selected blood group for this donor
                setSelectedBloodGroups(prev => {
                    const updated = { ...prev }
                    delete updated[donorId]
                    return updated
                })
            } else {
                await updateDoc(donorRef, {
                    isActive: false,
                    donorStatus: "SUSPENDED",
                    approvedHospitalId: auth.currentUser.uid, // Claim the suspension
                    suspendedAt: serverTimestamp(),
                    verificationNotes: "Account suspended by hospital dashboard"
                })
                toast.success("Donor account suspended")
            }
        } catch (error) {
            console.error("Error updating donor:", error)
            toast.error("Failed to update donor status")
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="flex flex-col h-full w-full p-6 relative overflow-hidden group">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-75" />

            {/* Header */}
            <div className="flex justify-between items-center mb-4 z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500/10 p-1.5 rounded-md">
                        <UserCheck className="text-blue-400" size={18} />
                    </div>
                    <span className="text-sm font-medium uppercase tracking-wider text-blue-200/80">
                        Activate Donor Accounts
                    </span>
                </div>
                {donors.length > 0 && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                        {donors.length} Pending
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 relative z-10 min-h-0">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                    </div>
                ) : donors.length === 0 ? (
                    <div className="flex flex-col h-full items-center justify-center text-muted-foreground text-center p-4">
                        <div className="bg-white/5 p-3 rounded-full mb-3">
                            <UserCheck className="h-6 w-6 opacity-50" />
                        </div>
                        <p className="text-sm">No pending activations</p>
                        <p className="text-xs opacity-50 mt-1">New registrations will appear here</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full pr-4 -mr-4">
                        <div className="space-y-3 pb-2">
                            {donors.map((donor) => (
                                <div
                                    key={donor.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-all hover:bg-black/30"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                            <User size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {donor.name || "Unknown Name"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {donor.email}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {donor.bloodType && (
                                                    <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                                                        {donor.bloodType}
                                                    </span>
                                                )}
                                                <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                    Pending Verification
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                                        <div className="w-full sm:w-40">
                                            <Select
                                                value={selectedBloodGroups[donor.id] || ""}
                                                onValueChange={(value) => {
                                                    setSelectedBloodGroups(prev => ({
                                                        ...prev,
                                                        [donor.id]: value
                                                    }))
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select Blood Group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BLOOD_GROUPS.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => handleAction(donor.id, "SUSPEND")}
                                                disabled={!!processingId}
                                                title="Suspend Account"
                                            >
                                                {processingId === donor.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <UserX className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => handleAction(donor.id, "ACTIVATE")}
                                                disabled={!!processingId || !selectedBloodGroups[donor.id]}
                                            >
                                                {processingId === donor.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                                        Activate
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    )
}
