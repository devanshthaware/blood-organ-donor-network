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
import { Plus, Trash2 } from "lucide-react"
import { usePatients } from "@/hooks/usePatients"
import { getAuthToken } from "@/lib/auth-helpers"
import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { BLOOD_GROUPS, PATIENT_STATUSES } from "@/lib/constants"

export default function HospitalPatientsPage() {
    const { patients, loading } = usePatients()
    const [isOpen, setIsOpen] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        bloodGroup: "",
        status: "Stable",
        notes: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const token = await getAuthToken(true)
            if (!token) {
                alert("Please log in")
                setSubmitting(false)
                return
            }

            const response = await fetch("/api/patients/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
                const errorMessage = errorData.error || `Failed to create patient (${response.status})`
                alert(errorMessage)
                setSubmitting(false)
                return
            }

            const result = await response.json()
            setIsOpen(false)
            setFormData({ name: "", age: "", bloodGroup: "", status: "Stable", notes: "" })
            alert(result.message || "Patient created successfully")
        } catch (error: any) {
            console.error("Error creating patient:", error)
            alert(error?.message || "An unexpected error occurred. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (patientId: string) => {
        if (!confirm("Are you sure you want to delete this patient?")) {
            return
        }

        setDeleting(patientId)
        try {
            const token = await getAuthToken(true)
            if (!token) {
                alert("Please log in")
                setDeleting(null)
                return
            }

            const response = await fetch(`/api/patients/${patientId}/delete`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
                const errorMessage = errorData.error || `Failed to delete patient (${response.status})`
                alert(errorMessage)
                setDeleting(null)
                return
            }

            const result = await response.json()
            alert(result.message || "Patient deleted successfully")
        } catch (error: any) {
            console.error("Error deleting patient:", error)
            alert(error?.message || "An unexpected error occurred. Please try again.")
        } finally {
            setDeleting(null)
        }
    }

    if (loading) {
        return <div className="p-4">Loading patients...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Patient Management</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Patient
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Patient</DialogTitle>
                            <DialogDescription>
                                Add a new patient record to your hospital system.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    className="col-span-3"
                                    placeholder="Patient name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="age" className="text-right">
                                    Age
                                </Label>
                                <Input
                                    id="age"
                                    type="number"
                                    className="col-span-3"
                                    placeholder="Age"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="bloodGroup" className="text-right">
                                    Blood Type
                                </Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select blood type" />
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
                                <Label htmlFor="status" className="text-right">
                                    Status
                                </Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PATIENT_STATUSES.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="notes" className="text-right">
                                    Notes
                                </Label>
                                <Textarea
                                    id="notes"
                                    className="col-span-3"
                                    placeholder="Additional notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Creating..." : "Create Patient"}
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
                            <TableHead>Name</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Blood Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Admission Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {patients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No patients yet. Patient records will appear here when created.
                                </TableCell>
                            </TableRow>
                        ) : (
                            patients.map((patient) => (
                                <TableRow key={patient.id}>
                                    <TableCell className="font-medium">{patient.name}</TableCell>
                                    <TableCell>{patient.age || "N/A"}</TableCell>
                                    <TableCell>{patient.bloodGroup}</TableCell>
                                    <TableCell>
                                        <Badge variant={patient.status === "Critical" ? "destructive" : "outline"}>
                                            {patient.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {patient.admissionDate instanceof Date
                                            ? patient.admissionDate.toLocaleDateString()
                                            : new Date(patient.admissionDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDelete(patient.id)}
                                            disabled={deleting === patient.id}
                                            className="h-8"
                                        >
                                            {deleting === patient.id ? (
                                                "Deleting..."
                                            ) : (
                                                <>
                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                    Remove
                                                </>
                                            )}
                                        </Button>
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
