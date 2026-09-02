"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, Timestamp, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
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

interface Hospital {
    userId: string;
    name: string;
    email: string;
    region: number;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED"; // Updated field
    address?: string | {
        street?: string;
        area?: string;
        city?: string;
        state?: string;
        pincode?: string;
        full?: string;
    };
    phoneNumber?: string;
    createdAt: Timestamp;
}

export default function AdminHospitalsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const q = query(collection(db, "hospitals"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                userId: doc.id,
                ...doc.data()
            } as Hospital));
            setHospitals(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
        try {
            const ref = doc(db, "hospitals", id);
            await updateDoc(ref, { approvalStatus: status });
            toast.success(`Hospital ${status.toLowerCase()} successfully`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>;
        }
    };

    const formatAddress = (address: Hospital["address"]): string => {
        if (!address) return "No address";
        if (typeof address === "string") return address;
        
        // Handle object format
        if (address.full) return address.full;
        if (address.street && address.city && address.state) {
            const parts = [
                address.street,
                address.area,
                address.city,
                address.state,
                address.pincode
            ].filter(Boolean);
            return parts.join(", ");
        }
        return "No address";
    };

    if (loading) return <div className="p-4">Loading hospitals...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hospital Approvals</h2>
                    <p className="text-muted-foreground">Manage hospital registration requests.</p>
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
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHospitals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hospitals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredHospitals.map((hospital) => (
                                <TableRow key={hospital.userId}>
                                    <TableCell className="font-medium">
                                        <div>{hospital.name}</div>
                                        <div className="text-xs text-muted-foreground">{formatAddress(hospital.address)}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{hospital.email}</span>
                                            <span className="text-muted-foreground">{hospital.phoneNumber || "No phone"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>Region {hospital.region}</TableCell>
                                    <TableCell>
                                        {getStatusBadge(hospital.approvalStatus || "PENDING")}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {hospital.createdAt?.toDate ? hospital.createdAt.toDate().toLocaleDateString() : "Just now"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {hospital.approvalStatus !== "APPROVED" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateStatus(hospital.userId, "APPROVED")}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                            )}
                                            {hospital.approvalStatus !== "REJECTED" && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => updateStatus(hospital.userId, "REJECTED")}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                Total Hospitals: {filteredHospitals.length}
            </div>
        </div>
    )
}
