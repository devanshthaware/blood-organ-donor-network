"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useReservations } from "@/hooks/useReservations"
import { getAuthToken } from "@/lib/auth-helpers"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

export default function HospitalReservationsPage() {
    const { reservations, loading } = useReservations("hospital")
    const [processing, setProcessing] = useState<string | null>(null)

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
                <h2 className="text-3xl font-bold tracking-tight">Incoming Reservations</h2>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Donor ID</TableHead>
                            <TableHead>Blood Type</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Reliability</TableHead>
                            <TableHead>AI Confidence Level</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground">
                                    No reservations yet. Reservations will appear here when donors are matched.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reservations.map((reservation) => (
                                <TableRow key={reservation.id}>
                                    <TableCell className="font-medium">
                                        {reservation.donorId.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>{reservation.bloodGroup || "N/A"}</TableCell>
                                    <TableCell>
                                        {reservation.distanceKm !== undefined ? (
                                            <span className="font-medium">
                                                {reservation.distanceKm < 1
                                                    ? `${Math.round(reservation.distanceKm * 1000)} m`
                                                    : `${reservation.distanceKm.toFixed(1)} km`}
                                            </span>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {reservation.mlScores?.reliability !== undefined ? (
                                            <span className={`font-medium ${reservation.mlScores.reliability >= 0.8
                                                    ? "text-green-600"
                                                    : reservation.mlScores.reliability >= 0.6
                                                        ? "text-blue-600"
                                                        : reservation.mlScores.reliability >= 0.4
                                                            ? "text-yellow-600"
                                                            : "text-red-600"
                                                }`}>
                                                {(reservation.mlScores.reliability * 100).toFixed(1)}%
                                            </span>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {reservation.mlScores?.combined !== undefined ? (
                                            (() => {
                                                const score = reservation.mlScores.combined;
                                                let level = "Low";
                                                let colorClass = "text-red-500 border-red-500";

                                                if (score >= 0.7) {
                                                    level = "High";
                                                    colorClass = "text-green-500 border-green-500";
                                                } else if (score >= 0.4) {
                                                    level = "Medium";
                                                    colorClass = "text-yellow-500 border-yellow-500";
                                                }

                                                return (
                                                    <Badge variant="outline" className={colorClass}>
                                                        {level}
                                                    </Badge>
                                                );
                                            })()
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                reservation.status === "CONFIRMED"
                                                    ? "text-green-500 border-green-500"
                                                    : reservation.status === "ACCEPTED"
                                                        ? "text-blue-500 border-blue-500"
                                                        : reservation.status === "COMPLETED"
                                                            ? "text-purple-500 border-purple-500"
                                                            : "text-gray-500 border-gray-500"
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
                                    <TableCell>
                                        {(reservation.status === "ACCEPTED" || reservation.status === "CONFIRMED") ? (
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
                                        ) : reservation.status === "COMPLETED" ? (
                                            <span className="text-sm text-muted-foreground">Completed</span>
                                        ) : null}
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
