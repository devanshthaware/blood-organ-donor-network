"use client"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { useDonationRequests } from "@/hooks/useDonationRequests"
import { getAuthToken } from "@/lib/auth-helpers"
import { useAuth } from "@/hooks/useAuth"
import { BLOOD_GROUPS, URGENCY_LEVELS } from "@/lib/constants"

export default function HospitalRequestsPage() {
    const { requests, loading } = useDonationRequests("hospital")
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState({
        type: "",
        quantity: "",
        urgency: ""
    })
    const [submitting, setSubmitting] = useState(false)
    const [cancelling, setCancelling] = useState<string | null>(null)

    const handleCancel = async (requestId: string) => {
        if (!confirm("Are you sure you want to cancel this request?")) {
            return
        }

        setCancelling(requestId)
        try {
            const token = await getAuthToken(true)
            if (!token) {
                alert("Please log in")
                setCancelling(null)
                return
            }

            const response = await fetch(`/api/requests/${requestId}/cancel`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
                const errorMessage = errorData.error || `Failed to cancel request (${response.status})`
                alert(errorMessage)
                setCancelling(null)
                return
            }

            const result = await response.json()
            alert(result.message || "Request cancelled successfully")

            // The requests list will update automatically via Firestore real-time listener
        } catch (error: any) {
            console.error("Error cancelling request:", error)
            alert(error?.message || "An unexpected error occurred. Please try again.")
        } finally {
            setCancelling(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            alert("Please log in")
            return
        }

        setSubmitting(true)
        try {
            // Force refresh token to ensure it's valid
            const token = await getAuthToken(true)
            if (!token) {
                alert("Please log in")
                setSubmitting(false)
                return
            }

            const response = await fetch("/api/requests/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bloodGroup: formData.type,
                    quantity: parseInt(formData.quantity, 10),
                    urgency: formData.urgency,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
                const errorMessage = errorData.error || `Failed to create request (${response.status})`
                alert(errorMessage)
                setSubmitting(false)
                return
            }

            const result = await response.json()
            setIsOpen(false)
            setFormData({ type: "", quantity: "", urgency: "" })
            // Optionally refresh the requests list or show success message
        } catch (error: any) {
            console.error("Error creating request:", error)
            alert(error?.message || "An unexpected error occurred. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="p-4">Loading requests...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Blood Requests</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Blood Request</DialogTitle>
                            <DialogDescription>
                                Create a new blood supply request. This will be broadcast to eligible donors.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                    Blood Type
                                </Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOOD_GROUPS.map((bg) => (
                                            <SelectItem key={bg} value={bg}>
                                                {bg}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="quantity" className="text-right">
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    className="col-span-3"
                                    placeholder="Units"
                                    value={formData.quantity}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || parseInt(val, 10) >= 0) {
                                            setFormData({ ...formData, quantity: val });
                                        }
                                    }}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="urgency" className="text-right">
                                    Urgency
                                </Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, urgency: val })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select urgency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {URGENCY_LEVELS.map((level) => (
                                            <SelectItem key={level} value={level}>
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Creating..." : "Create Request"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Blood Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Urgency</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No requests yet. Create your first request above.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-medium">{request.bloodGroup}</TableCell>
                                    <TableCell>{request.quantity} Units</TableCell>
                                    <TableCell>
                                        <Badge variant={request.urgency === "CRITICAL" ? "destructive" : "secondary"}>
                                            {request.urgency}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{request.status}</TableCell>
                                    <TableCell>
                                        {request.createdAt instanceof Date
                                            ? request.createdAt.toLocaleString()
                                            : new Date().toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {request.status === "PENDING" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCancel(request.id)}
                                                disabled={cancelling === request.id}
                                                className="h-8"
                                            >
                                                {cancelling === request.id ? (
                                                    "Cancelling..."
                                                ) : (
                                                    <>
                                                        <X className="mr-1 h-3 w-3" />
                                                        Cancel
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {request.status !== "PENDING" && (
                                            <span className="text-sm text-muted-foreground">
                                                {request.status}
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
