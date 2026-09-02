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
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function AdminDonorsPage() {
    const donorsData = useQuery(api.donors.getAllDonors, {})
    const updateAvailabilityMutation = useMutation(api.donors.updateAvailability)
    const [searchQuery, setSearchQuery] = useState("")

    const donors = (donorsData || []).map((d: any) => ({
        userId: d.userId,
        _id: d._id,
        name: d.fullName,
        email: d.userId.includes("@") ? d.userId : "donor@veinlink.org",
        bloodGroup: d.bloodType,
        isActive: d.isActive,
        reliabilityScore: d.reliabilityScore ?? 0.8,
        createdAt: new Date(d.createdAt),
    }))

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateAvailabilityMutation({ isActive: !currentStatus })
        } catch (err) {
            console.error("Failed to toggle status:", err)
        }
    }

    const filteredDonors = donors.filter((d: any) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const loading = donorsData === undefined

    if (loading) return <div className="p-8">Loading donors...</div>

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Donors</h2>
                    <p className="text-muted-foreground">Manage donor accounts and monitor reliability.</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search donors (name, email, blood group)..."
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
                            <TableHead>Name</TableHead>
                            <TableHead>Blood Group</TableHead>
                            <TableHead>Reliability Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Active Toggle</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDonors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No donors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDonors.map((donor: any) => (
                                <TableRow key={donor._id}>
                                    <TableCell className="font-medium">{donor.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-semibold text-red-500">
                                            {donor.bloodGroup}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm font-semibold text-green-500">
                                            {(donor.reliabilityScore * 100).toFixed(0)}%
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={donor.isActive ? "default" : "secondary"}>
                                            {donor.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={donor.isActive}
                                            onCheckedChange={() => toggleStatus(donor._id, donor.isActive)}
                                        />
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
