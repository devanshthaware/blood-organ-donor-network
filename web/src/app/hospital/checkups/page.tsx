"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, orderBy, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface CheckupRequest {
    id: string
    donorId: string
    hospitalId: string
    status: string
    requestedAt: any
    scheduledAt?: any
    donorName?: string
    donorEmail?: string
}

export default function HospitalCheckupsPage() {
    const [requests, setRequests] = useState<CheckupRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedBloodType, setSelectedBloodType] = useState<string>("")

    const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

    useEffect(() => {
        const user = auth.currentUser
        if (!user) return

        const q = query(
            collection(db, "checkup_requests"),
            where("hospitalId", "==", user.uid),
            where("status", "==", "REQUESTED")
        )

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const requestsData: CheckupRequest[] = []

            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data()

                // Fetch Donor Details
                // Note: For optimal real-time performance with many items, 
                // we might want to fetch donors separately or cache them,
                // but for now, fetching per-item is acceptable for low volume.
                let donorName = "Unknown"
                let donorEmail = "Unknown"

                try {
                    const donorDocRef = doc(db, "donors", data.donorId)
                    const donorSnap = await getDoc(donorDocRef)
                    if (donorSnap.exists()) {
                        const donorData = donorSnap.data()
                        donorName = donorData.name || "Unknown"
                        donorEmail = donorData.email || "Unknown"
                    }
                } catch (err) {
                    console.error("Error fetching donor details", err)
                }

                requestsData.push({
                    id: docSnapshot.id,
                    donorId: data.donorId,
                    hospitalId: data.hospitalId,
                    status: data.status,
                    requestedAt: data.requestedAt,
                    scheduledAt: data.scheduledAt,
                    donorName,
                    donorEmail
                })
            }

            setRequests(requestsData)
            setLoading(false)
        }, (error) => {
            console.error("Error creating request listener:", error)
            toast.error("Failed to sync requests")
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleApprove = async (request: CheckupRequest) => {
        if (!selectedBloodType) {
            toast.error("Please select a blood type")
            return
        }

        setProcessing(request.id)
        try {
            const user = auth.currentUser
            if (!user) return

            // 1. Update Donor Profile
            // CRITICAL: Set both bloodType and isActive so donor can be matched
            await updateDoc(doc(db, "donors", request.donorId), {
                donorStatus: "APPROVED",
                bloodType: selectedBloodType,
                bloodGroup: selectedBloodType, // Also set bloodGroup for compatibility
                isActive: true, // Activate donor so they appear in matching queries
                diseaseStatus: "CLEARED",
                approvedHospitalId: user.uid,
                approvedAt: serverTimestamp()
            })

            // 2. Update Request Status
            await updateDoc(doc(db, "checkup_requests", request.id), {
                status: "COMPLETED",
                completedAt: serverTimestamp(),
                result: "APPROVED",
                bloodType: selectedBloodType
            })

            toast.success(`Donor ${request.donorName} approved as ${selectedBloodType}`)
            setRequests(prev => prev.filter(r => r.id !== request.id))
            setSelectedBloodType("")
        } catch (error) {
            console.error("Error approving donor:", error)
            toast.error("Failed to approve donor")
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (request: CheckupRequest) => {
        setProcessing(request.id)
        try {
            const user = auth.currentUser
            if (!user) return

            // 1. Update Donor Profile
            await updateDoc(doc(db, "donors", request.donorId), {
                donorStatus: "REJECTED",
                diseaseStatus: "REJECTED", // Or specific reason if implemented
                approvedHospitalId: user.uid,
                approvedAt: serverTimestamp()
            })

            // 2. Update Request Status
            await updateDoc(doc(db, "checkup_requests", request.id), {
                status: "REJECTED",
                completedAt: serverTimestamp(),
                result: "REJECTED"
            })

            toast.error(`Donor ${request.donorName} rejected`)
            setRequests(prev => prev.filter(r => r.id !== request.id))
        } catch (error) {
            console.error("Error rejecting donor:", error)
            toast.error("Failed to reject donor")
        } finally {
            setProcessing(null)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Checkup Requests</h1>
                <p className="text-muted-foreground">Verify and approve donor blood types.</p>
            </div>

            {requests.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-dashed">
                    <p className="text-muted-foreground">No pending checkup requests.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req) => (
                        <Card key={req.id}>
                            <CardHeader>
                                <CardTitle>{req.donorName}</CardTitle>
                                <CardDescription>{req.donorEmail}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Requested: {req.requestedAt?.toDate ? format(req.requestedAt.toDate(), "PP p") : "Just now"}
                                </div>

                                {
                                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                        <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">
                                            Scheduled Slot
                                        </p>
                                        <p className="text-sm text-foreground font-semibold">
                                            {req.scheduledAt
                                                ? (req.scheduledAt.toDate
                                                    ? format(req.scheduledAt.toDate(), "PP p")
                                                    : format(new Date(req.scheduledAt), "PP p"))
                                                : <span className="text-muted-foreground italic font-normal">No specific time scheduled</span>
                                            }
                                        </p>
                                    </div>
                                }

                                <div className="space-y-2">
                                    <Label>Verify Blood Type</Label>
                                    <Select value={selectedBloodType} onValueChange={setSelectedBloodType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Blood Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BLOOD_TYPES.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-2">
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleReject(req)}
                                    disabled={!!processing}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprove(req)}
                                    disabled={!!processing}
                                >
                                    {processing === req.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
