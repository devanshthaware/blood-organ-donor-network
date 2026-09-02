"use client"

import { useReservations } from "@/hooks/useReservations"
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
import { Check, X, CheckCircle2 } from "lucide-react"
import { getAuthToken } from "@/lib/auth-helpers"
import { useState } from "react"

export default function DonorAvailabilityPage() {
    const { reservations, loading } = useReservations("donor")
    const [processing, setProcessing] = useState<string | null>(null)

    const handleAccept = async (reservationId: string) => {
        setProcessing(reservationId)
        try {
            const token = await getAuthToken()
            if (!token) {
                alert("Please log in")
                return
            }

            const response = await fetch(`/api/reservations/${reservationId}/accept`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const error = await response.json()
                alert(error.error || "Failed to accept reservation")
                return
            }

            // UI will update automatically via Firestore listener
        } catch (error) {
            alert("Failed to accept reservation. Please try again.")
        } finally {
            setProcessing(null)
        }
    }

    const handleDecline = async (reservationId: string) => {
        setProcessing(reservationId)
        try {
            const token = await getAuthToken()
            if (!token) {
                alert("Please log in")
                return
            }

            const response = await fetch(`/api/reservations/${reservationId}/decline`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const error = await response.json()
                alert(error.error || "Failed to decline reservation")
                return
            }
        } catch (error) {
            alert("Failed to decline reservation. Please try again.")
        } finally {
            setProcessing(null)
        }
    }

    const handleComplete = async (reservationId: string) => {
        setProcessing(reservationId)
        try {
            const token = await getAuthToken(true)
            if (!token) {
                alert("Please log in")
                setProcessing(null)
                return
            }

            const response = await fetch(`/api/reservations/${reservationId}/complete`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
                const errorMessage = errorData.error || `Failed to complete reservation (${response.status})`
                alert(errorMessage)
                setProcessing(null)
                return
            }

            const result = await response.json()
            alert(result.message || "Reservation marked as completed successfully")
            
            // The reservations list will update automatically via Firestore real-time listener
        } catch (error: any) {
            console.error("Error completing reservation:", error)
            alert(error?.message || "An unexpected error occurred. Please try again.")
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return <div className="p-4">Loading reservations...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">My Reservations</h2>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Blood Type</TableHead>
                            <TableHead>Match Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No reservations yet. You will receive notifications when you match a request.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reservations.map((reservation) => (
                                <TableRow key={reservation.id}>
                                    <TableCell className="font-medium">{reservation.bloodGroup || "N/A"}</TableCell>
                                    <TableCell>
                                        {reservation.mlScores?.combined !== undefined
                                            ? `${(reservation.mlScores.combined * 100).toFixed(1)}%`
                                            : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                reservation.status === "CONFIRMED" || reservation.status === "ACCEPTED"
                                                    ? "default"
                                                    : reservation.status === "DECLINED"
                                                    ? "outline"
                                                    : reservation.status === "COMPLETED"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className={
                                                reservation.status === "CONFIRMED"
                                                    ? "bg-green-500 hover:bg-green-600"
                                                    : reservation.status === "ACCEPTED"
                                                    ? "bg-blue-500 hover:bg-blue-600"
                                                    : reservation.status === "COMPLETED"
                                                    ? "bg-purple-500 hover:bg-purple-600"
                                                    : ""
                                            }
                                        >
                                            {reservation.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {reservation.createdAt instanceof Date
                                            ? reservation.createdAt.toLocaleString()
                                            : "Recently"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {reservation.status === "PENDING" && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDecline(reservation.id)}
                                                    disabled={processing === reservation.id}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAccept(reservation.id)}
                                                    disabled={processing === reservation.id}
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> Accept
                                                </Button>
                                            </div>
                                        )}
                                        {(reservation.status === "ACCEPTED" || reservation.status === "CONFIRMED") && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleComplete(reservation.id)}
                                                disabled={processing === reservation.id}
                                                className="h-8"
                                            >
                                                {processing === reservation.id ? (
                                                    "Processing..."
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                                        Done
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {reservation.status === "COMPLETED" && (
                                            <span className="text-sm text-muted-foreground italic">
                                                Donation completed.
                                            </span>
                                        )}
                                        {reservation.status === "DECLINED" && (
                                            <span className="text-sm text-muted-foreground italic">
                                                Request declined.
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
