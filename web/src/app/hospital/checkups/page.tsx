"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function HospitalCheckupsPage() {
    const { user } = useAuth()
    const checkupRequests = useQuery(
        api.checkups.getCheckupRequests,
        user?.uid ? { hospitalId: user.uid } : "skip"
    )

    const approveMutation = useMutation(api.checkups.approveDonorCheckup)
    const rejectMutation = useMutation(api.checkups.rejectDonorCheckup)

    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedBloodType, setSelectedBloodType] = useState<string>("")

    const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

    const requests = (checkupRequests || []).filter((r: any) => r.status === "PENDING")

    const handleApprove = async (request: any) => {
        if (!selectedBloodType) {
            toast.error("Please select a blood type")
            return
        }

        setProcessing(request._id)
        try {
            await approveMutation({
                checkupId: request._id,
                donorId: request.donorId,
                bloodType: selectedBloodType,
            })

            toast.success(`Donor ${request.donorName || "Donor"} approved as ${selectedBloodType}`)
            setSelectedBloodType("")
        } catch (error) {
            console.error("Error approving donor:", error)
            toast.error("Failed to approve donor")
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (request: any) => {
        setProcessing(request._id)
        try {
            await rejectMutation({
                checkupId: request._id,
                donorId: request.donorId,
            })

            toast.error(`Donor ${request.donorName || "Donor"} rejected`)
        } catch (error) {
            console.error("Error rejecting donor:", error)
            toast.error("Failed to reject donor")
        } finally {
            setProcessing(null)
        }
    }

    const loading = checkupRequests === undefined

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Blood Checkup Verification</h1>
                <p className="text-muted-foreground">
                    Review and verify blood groups for newly registered donors visiting your facility.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : requests.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No Pending Checkups</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            There are currently no donors waiting for verification at your hospital.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {requests.map((request: any) => (
                        <Card key={request._id} className="border-border">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{request.donorName || "Anonymous Donor"}</CardTitle>
                                        <CardDescription>{request.date} ({request.timeSlot})</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                        Pending Checkup
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Verify Blood Group</label>
                                    <Select value={selectedBloodType} onValueChange={setSelectedBloodType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select confirmed blood type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BLOOD_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-4">
                                <Button
                                    variant="destructive"
                                    onClick={() => handleReject(request)}
                                    disabled={processing === request._id}
                                    className="w-1/2"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => handleApprove(request)}
                                    disabled={processing === request._id}
                                    className="w-1/2 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Verify & Activate
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
