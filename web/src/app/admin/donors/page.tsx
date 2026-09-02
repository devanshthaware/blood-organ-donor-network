"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, Timestamp, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
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
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Donor {
    userId: string;
    name: string;
    email: string;
    bloodGroup: string;
    isActive: boolean;
    location?: { latitude: number; longitude: number };
    createdAt: Timestamp;
}

interface ReliabilityData {
    score: number | null;
    label: string;
    status: "success" | "loading" | "error" | "insufficient_data";
}

export default function AdminDonorsPage() {
    const { user } = useAuth();
    const [donors, setDonors] = useState<Donor[]>([]);
    const [reliabilityScores, setReliabilityScores] = useState<Record<string, ReliabilityData>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Limit to 50 for performance, or implement pagination
        const q = query(collection(db, "donors"), orderBy("createdAt", "desc"), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                userId: doc.id,
                ...doc.data()
            } as Donor));
            setDonors(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch reliability scores for donors
    useEffect(() => {
        if (!user || donors.length === 0) return;

        const fetchReliability = async (donorId: string) => {
            // Skip if already loaded or loading
            if (reliabilityScores[donorId]) return;

            // Set loading state
            setReliabilityScores(prev => ({
                ...prev,
                [donorId]: { score: null, label: "Loading...", status: "loading" }
            }));

            try {
                const token = await user.getIdToken();
                const response = await fetch("/api/ml/predict-reliability", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ donorId })
                });

                if (response.ok) {
                    const data = await response.json();
                    setReliabilityScores(prev => ({
                        ...prev,
                        [donorId]: {
                            score: data.reliability_score,
                            label: data.label,
                            status: data.status as any
                        }
                    }));
                } else {
                    setReliabilityScores(prev => ({
                        ...prev,
                        [donorId]: { score: null, label: "Unavailable", status: "error" }
                    }));
                }
            } catch (error) {
                console.error("Error fetching reliability:", error);
                setReliabilityScores(prev => ({
                    ...prev,
                    [donorId]: { score: null, label: "Error", status: "error" }
                }));
            }
        };

        // Fetch for displayed donors (basic implementation)
        // In a real app, use a queue or pagination to avoid limits
        donors.forEach(donor => {
            fetchReliability(donor.userId);
        });
    }, [donors, user]); // Note: In a large list, reliabilityScores check prevents loops, but be careful

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const ref = doc(db, "donors", id);
        await updateDoc(ref, { isActive: !currentStatus });
    };

    const filteredDonors = donors.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getReliabilityColor = (label: string) => {
        switch (label) {
            case "High": return "text-green-500 font-bold";
            case "Medium": return "text-yellow-500 font-medium";
            case "Low": return "text-red-500";
            case "Neutral": return "text-blue-400 font-medium italic";
            case "Insufficient Data": return "text-muted-foreground italic";
            default: return "text-muted-foreground";
        }
    };

    if (loading) return <div className="p-4">Loading donors...</div>;

    return (
        <div className="space-y-6">
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
                            <TableHead>Reliability (AI)</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDonors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No donors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDonors.map((donor) => {
                                const reliability = reliabilityScores[donor.userId] || { score: null, label: "Loading...", status: "loading" };

                                return (
                                    <TableRow key={donor.userId}>
                                        <TableCell className="font-medium">
                                            <div>{donor.name}</div>
                                            <div className="text-xs text-muted-foreground">{donor.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{donor.bloodGroup}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {reliability.status === "success" && reliability.score !== null ? (
                                                    <>
                                                        <span className={getReliabilityColor(reliability.label)}>
                                                            {(reliability.score * 100).toFixed(0)}%
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                            {reliability.label}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className={getReliabilityColor(reliability.label)}>
                                                        {reliability.label}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground">
                                            {donor.location ?
                                                `${donor.location.latitude.toFixed(4)}, ${donor.location.longitude.toFixed(4)}`
                                                : 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={donor.isActive ? "default" : "secondary"}>
                                                {donor.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Switch
                                                    checked={donor.isActive}
                                                    onCheckedChange={() => toggleStatus(donor.userId, donor.isActive)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                Showing {filteredDonors.length} of {donors.length} donors
            </div>
        </div>
    )
}
