"use client"

import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDonationHistory } from "@/hooks/useDonationHistory"
import { useDonorProfile } from "@/hooks/useUserProfile"
import { useCheckupRequests } from "@/hooks/useCheckupRequests"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, Clock } from "lucide-react"

export default function DonorHistoryPage() {
    const { history, loading } = useDonationHistory()
    const { profile, loading: profileLoading } = useDonorProfile()
    const { request: pendingCheckup, loading: checkupLoading } = useCheckupRequests()

    if (loading || profileLoading || checkupLoading) {
        return <div className="p-8">Loading history...</div>
    }

    if (profile?.donorStatus !== "APPROVED") {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Donation History</h2>

                {pendingCheckup ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-8 rounded-2xl flex flex-col items-center text-center gap-4">
                        <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Clock className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Waiting for Verification</h3>
                            <p className="max-w-md mx-auto mt-2 opacity-90">
                                Your history will include records of your checkups and donations once your profile is verified.
                                Scheduled checkup: <span className="font-bold">{pendingCheckup.hospitalName}</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50 dark:bg-zinc-900 border-dashed m-4">
                        <h3 className="text-xl font-semibold mb-2">Account Inactive</h3>
                        <p className="text-muted-foreground mb-4">Please complete a blood checkup at a registered hospital to view your history.</p>
                        <Button asChild>
                            <a href="/donor/map">Find Hospital</a>
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Donation History</h2>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Hospital/Center</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No donation history yet. Your completed donations will appear here.
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {(item.donationDate as any)?.toDate
                                            ? (item.donationDate as any).toDate().toLocaleDateString()
                                            : new Date(item.donationDate as any).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{item.hospitalName || "Unknown Hospital"}</TableCell>
                                    <TableCell>{item.amount}ml</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                item.status === "COMPLETED" || item.status === "CONFIRMED"
                                                    ? "text-green-500 border-green-500"
                                                    : item.status === "ACCEPTED"
                                                        ? "text-blue-500 border-blue-500"
                                                        : item.status === "DECLINED"
                                                            ? "text-red-500 border-red-500"
                                                            : "text-gray-500"
                                            }
                                        >
                                            {item.status}
                                        </Badge>
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
