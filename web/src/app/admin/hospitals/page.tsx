"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
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
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function AdminHospitalsPage() {
    const hospitalsData = useQuery(api.hospitals.getAllHospitals, {})
    const updateStatusMutation = useMutation(api.hospitals.updateHospitalStatus)
    const [searchQuery, setSearchQuery] = useState("")

    const hospitals = (hospitalsData || []).map((h: any) => ({
        _id: h._id,
        name: h.name,
        email: h.contactEmail,
        region: h.region || 1,
        isActive: h.isActive,
        address: h.address,
        phoneNumber: h.contactPhone,
        createdAt: new Date(h.createdAt),
    }))

    const updateStatus = async (id: string, active: boolean) => {
        try {
            await updateStatusMutation({
                hospitalId: id as any,
                isActive: active,
            })
            toast.success(`Hospital status updated successfully`)
        } catch (error) {
            console.error("Error updating hospital status:", error)
            toast.error("Failed to update status")
        }
    }

    const filteredHospitals = hospitals.filter((h: any) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const loading = hospitalsData === undefined

    if (loading) return <div className="p-8">Loading hospitals...</div>

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hospital Approvals</h2>
                    <p className="text-muted-foreground">Manage hospital registrations and active status.</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search hospitals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hospital Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHospitals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No hospitals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredHospitals.map((hospital: any) => (
                                <TableRow key={hospital._id}>
                                    <TableCell className="font-medium">
                                        <div>{hospital.name}</div>
                                        <div className="text-xs text-muted-foreground">{hospital.email}</div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{hospital.address}</TableCell>
                                    <TableCell>Region {hospital.region}</TableCell>
                                    <TableCell>
                                        <Badge variant={hospital.isActive ? "default" : "secondary"}>
                                            {hospital.isActive ? "Approved" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {!hospital.isActive ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-green-500 text-green-500 hover:bg-green-500/10"
                                                onClick={() => updateStatus(hospital._id, true)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-500 text-red-500 hover:bg-red-500/10"
                                                onClick={() => updateStatus(hospital._id, false)}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" /> Deactivate
                                            </Button>
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
