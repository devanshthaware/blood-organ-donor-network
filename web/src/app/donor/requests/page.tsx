"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { useDonationRequests } from "@/hooks/useDonationRequests"
import { useDonorProfile } from "@/hooks/useUserProfile"
import { useReservations } from "@/hooks/useReservations"
import { useCheckupRequests } from "@/hooks/useCheckupRequests"
import { getAuthToken } from "@/lib/auth-helpers"
import { useState } from "react"

export default function DonorRequestsPage() {
    const { requests: openRequests, loading } = useDonationRequests("donor")
    const { profile, loading: profileLoading } = useDonorProfile()
    const { reservations: myResponses, loading: responsesLoading } = useReservations("donor")
    const { request: pendingCheckup, loading: checkupLoading } = useCheckupRequests()
    const [processing, setProcessing] = useState<string | null>(null)

    const handleAction = async (requestId: string, action: "accept" | "reject") => {
        setProcessing(requestId)
        try {
            const token = await getAuthToken(true)
            if (!token) {
                alert("Please log in")
                setProcessing(null)
                return
            }

            const response = await fetch(`/api/requests/${requestId}/respond`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
                const errorMessage = errorData.error || `Failed to ${action} request (${response.status})`
                console.error("API error:", errorMessage)
                // Error will be handled by the real-time listener or user can retry
                setProcessing(null)
                return
            }

            const result = await response.json()
            console.log("Request action successful:", result.message || `Request ${action === "accepted" ? "accepted" : "rejected"}`)

            // The requests list will update automatically via Firestore real-time listener
            // No need for manual state update - Firestore listener handles it
        } catch (error: any) {
            console.error("Error processing request:", error)
            // Error is logged - UI will reflect database state via real-time listener
        } finally {
            setProcessing(null)
        }
    }

    if (loading || profileLoading || responsesLoading || checkupLoading) {
        return <div className="p-8">Loading requests...</div>
    }

    if (profile?.donorStatus !== "APPROVED") {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Urgent Blood Requests</h2>

                {pendingCheckup ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-8 rounded-2xl flex flex-col items-center text-center gap-4">
                        <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Check className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Verification Pending</h3>
                            <p className="max-w-md mx-auto mt-2 opacity-90">
                                You have a pending checkup at <span className="font-bold">{pendingCheckup.hospitalName}</span>.
                                Once the hospital verifies your profile, you will see urgent blood requests here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50 dark:bg-zinc-900 border-dashed m-4">
                        <h3 className="text-xl font-semibold mb-2">Account Inactive</h3>
                        <p className="text-muted-foreground mb-4">Please complete a blood checkup at a registered hospital to access blood requests.</p>
                        <Button asChild>
                            <a href="/donor/map">Find Hospital</a>
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-8 p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Urgent Blood Requests</h2>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                        {openRequests.length} High Priority
                    </Badge>
                </div>

                <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-[300px]">Hospital</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Required By</TableHead>
                                <TableHead className="hidden md:table-cell">AI Analysis</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {openRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No pending requests at this time.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                openRequests.map((request) => (
                                    <TableRow key={request.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{request.hospitalName}</span>
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Blood Group: {request.bloodGroup}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">
                                                {request.distanceKm !== undefined
                                                    ? `${request.distanceKm.toFixed(1)} km`
                                                    : "Calculating..."}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {request.dueDate instanceof Date
                                                ? request.dueDate.toLocaleDateString()
                                                : "ASAP"}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] hidden md:table-cell">
                                            <p className="text-xs text-muted-foreground italic truncate" title={request.aiExplanation}>
                                                "{request.aiExplanation || "Matching blood group availability."}"
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleAction(request.id, "accept")}
                                                    disabled={processing === request.id}
                                                    className="bg-red-600 hover:bg-red-700 text-white h-8"
                                                >
                                                    {processing === request.id ? "..." : "Accept"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleAction(request.id, "reject")}
                                                    disabled={processing === request.id}
                                                    className="h-8 text-muted-foreground"
                                                >
                                                    Ignore
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {myResponses.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold tracking-tight">Recent Responses</h3>
                    <div className="rounded-xl border bg-card/30 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10">
                                    <TableHead>Request</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Responded At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myResponses.slice(0, 5).map((res) => (
                                    <TableRow key={res.id} className="opacity-70 hover:opacity-100 transition-opacity">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">Request to Hospital</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{res.bloodGroup} Donation</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    res.status === "ACCEPTED" || res.status === "CONFIRMED"
                                                        ? "text-blue-500 border-blue-500/20"
                                                        : res.status === "DECLINED"
                                                            ? "text-red-500 border-red-500/20"
                                                            : "text-muted-foreground"
                                                }
                                            >
                                                {res.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {res.createdAt instanceof Date ? res.createdAt.toLocaleDateString() : "Recently"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
