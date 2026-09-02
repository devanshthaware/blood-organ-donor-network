"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck, UserX, User, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BLOOD_GROUPS } from "@/lib/constants"

export default function DonorActivationTile() {
    const { user } = useAuth()
    const allDonors = useQuery(api.donors.getAllDonors, {})
    const registerDonorMutation = useMutation(api.donors.registerDonor)
    const updateAvailabilityMutation = useMutation(api.donors.updateAvailability)

    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedBloodGroups, setSelectedBloodGroups] = useState<Record<string, string>>({})

    const donors = (allDonors || []).filter((d: any) => d.donorStatus === "PENDING" || !d.isActive)

    const handleAction = async (donor: any, action: "ACTIVATE" | "SUSPEND") => {
        if (!user) return

        if (action === "ACTIVATE") {
            const selectedBloodGroup = selectedBloodGroups[donor._id] || donor.bloodType
            if (!selectedBloodGroup) {
                toast.error("Please select a blood group before activating the donor")
                return
            }
        }

        setProcessingId(donor._id)

        try {
            if (action === "ACTIVATE") {
                const selectedBloodGroup = selectedBloodGroups[donor._id] || donor.bloodType || "O+"
                await registerDonorMutation({
                    userId: donor.userId,
                    fullName: donor.fullName,
                    bloodType: selectedBloodGroup,
                    lat: donor.lat || 19.076,
                    lng: donor.lng || 72.8777,
                    address: donor.address || "Verified Area",
                })
                toast.success(`Donor ${donor.fullName} activated successfully as ${selectedBloodGroup}`)
                setSelectedBloodGroups(prev => {
                    const updated = { ...prev }
                    delete updated[donor._id]
                    return updated
                })
            } else {
                await updateAvailabilityMutation({ isActive: false })
                toast.success("Donor account suspended")
            }
        } catch (error) {
            console.error("Error updating donor:", error)
            toast.error("Failed to update donor status")
        } finally {
            setProcessingId(null)
        }
    }

    const loading = allDonors === undefined

    return (
        <div className="flex flex-col h-full w-full p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-75" />

            <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg tracking-tight flex items-center gap-2">
                        <span>Unverified Donors</span>
                        {donors.length > 0 && (
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Review walk-ins and verify eligibility
                    </p>
                </div>
                <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/50 border border-white/5 text-muted-foreground">
                    {donors.length} Pending
                </div>
            </div>

            <div className="flex-1 pt-4 relative z-10 min-h-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : donors.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">All Donors Verified</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                            No pending registrations require approval at this time.
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[280px] -mr-4 pr-4">
                        <div className="space-y-3">
                            {donors.map((donor: any) => (
                                <div
                                    key={donor._id}
                                    className="p-3.5 rounded-xl bg-secondary/20 border border-white/5 hover:bg-secondary/40 transition-colors flex flex-col gap-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium leading-none">{donor.fullName}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                                    {donor.address || "Local Area"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-24">
                                            <Select
                                                value={selectedBloodGroups[donor._id] || donor.bloodType || ""}
                                                onValueChange={(val) =>
                                                    setSelectedBloodGroups((prev) => ({ ...prev, [donor._id]: val }))
                                                }
                                            >
                                                <SelectTrigger className="h-7 text-xs">
                                                    <SelectValue placeholder="Group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BLOOD_GROUPS.map((bg) => (
                                                        <SelectItem key={bg} value={bg} className="text-xs">
                                                            {bg}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                                            disabled={processingId === donor._id}
                                            onClick={() => handleAction(donor, "SUSPEND")}
                                        >
                                            <UserX className="h-3.5 w-3.5 mr-1" />
                                            Decline
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                                            disabled={processingId === donor._id}
                                            onClick={() => handleAction(donor, "ACTIVATE")}
                                        >
                                            {processingId === donor._id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                                    Activate
                                                </>
                                            )}
                                        </Button>
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
