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
import { useState } from "react"

export default function DonorAvailabilityPage() {
    const {
        reservations,
        loading,
        acceptReservation,
        declineReservation,
        completeReservation,
    } = useReservations("donor")
    const [processing, setProcessing] = useState<string | null>(null)

    const handleAccept = async (reservationId: string) => {
        setProcessing(reservationId)
        try {
            await acceptReservation(reservationId)
            alert("Reservation accepted successfully!")
        } catch (error: any) {
            alert(error?.message || "Failed to accept reservation. Please try again.")
        } finally {
            setProcessing(null)
        }
    }

    const handleDecline = async (reservationId: string) => {
        setProcessing(reservationId)
        try {
            await declineReservation(reservationId)
            alert("Reservation declined.")
        } catch (error: any) {
            alert(error?.message || "Failed to decline reservation. Please try again.")
        } finally {
            setProcessing(null)
        }
    }

    const handleComplete = async (reservationId: string) => {
        setProcessing(reservationId)
        try {
            await completeReservation(reservationId)
            alert("Donation marked as complete!")
        } catch (error: any) {
            alert(error?.message || "Failed to complete reservation. Please try again.")
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
