"use client"

import MagicBento from "@/components/MagicBento"
import { useDonationRequests } from "@/hooks/useDonationRequests"
import { useReservations } from "@/hooks/useReservations"
import { useAlerts } from "@/hooks/useAlerts"
import { Activity, Users, AlertCircle, CheckCircle, Plus, ClipboardList } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DonorActivationTile from "@/components/hospital/DonorActivationTile"

export default function HospitalDashboard() {
    const { requests, loading: requestsLoading } = useDonationRequests("hospital")
    const { reservations, loading: reservationsLoading } = useReservations("hospital")
    const { alerts, loading: alertsLoading } = useAlerts()

    if (requestsLoading || reservationsLoading) {
        return <div className="p-8">Loading dashboard metrics...</div>
    }

    const activeRequests = requests.filter(r => r.status === "PENDING")
    const criticalRequests = requests.filter(r => r.urgency === "CRITICAL" && r.status === "PENDING")
    const criticalAlerts = alerts.filter(a => a.severity === "CRITICAL" || a.severity === "HIGH")
    const confirmedReservations = reservations.filter(r => r.status === "CONFIRMED")

    // Calculate fulfilment rate
    const totalRequests = requests.length
    const fulfilledRequests = requests.filter(r => r.status === "FULFILLED").length
    const fulfillmentRate = totalRequests > 0
        ? Math.round((fulfilledRequests / totalRequests) * 100)
        : 0

    // Layout:
    // [Active][Create] [Alerts (2x2)]
    // [Recent (2x2)]   [Rate][Incoming]

    const bentoItems = [
        {
            title: activeRequests.length.toString(),
            description: "Active Requests",
            label: "Requests",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</span>
                        <Activity className="text-blue-400" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{activeRequests.length}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{criticalRequests.length} Critical</div>
                    </div>
                </div>
            )
        },
        {
            title: "Creates",
            description: "New Request",
            label: "Action",
            color: "#2a2a40",
            colSpan: 1,
            children: (
                <Link href="/hospital/requests" className="flex flex-col justify-center items-center h-full w-full p-4 hover:bg-white/5 transition-colors cursor-pointer text-center gap-2 group">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="text-xs font-medium text-white">Create Request</span>
                </Link>
            )
        },
        {
            title: "Critical Alerts",
            description: "System Notifications",
            label: "Alerts",
            color: "#3f1a1a",
            colSpan: 2,
            rowSpan: 2,
            children: (
                <div className="flex flex-col justify-between h-full p-6 pointer-events-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex justify-between items-start">
                        <span className="text-sm font-medium uppercase tracking-wider text-red-300/80">System Alerts</span>
                        <AlertCircle className="text-red-500 animate-pulse" size={24} />
                    </div>

                    <div className="space-y-4 z-10">
                        <div>
                            <div className="text-6xl font-bold text-white tracking-tighter">{criticalAlerts.length}</div>
                            <div className="text-sm text-red-200 mt-1 font-medium">Attention Needed</div>
                        </div>

                        {criticalAlerts.length > 0 ? (
                            <div className="bg-black/20 rounded p-3 border border-white/5 backdrop-blur-sm">
                                <div className="text-xs text-red-300 font-bold mb-1">Latest Warning</div>
                                <div className="text-xs text-white/80 line-clamp-2">
                                    {criticalAlerts[0].message || "Stock shortages detected in region."}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black/20 rounded p-3 border border-white/5 backdrop-blur-sm">
                                <div className="text-xs text-green-400 font-bold mb-1">All Clear</div>
                                <div className="text-xs text-white/80">
                                    No critical system alerts at this time.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: "Recent Activity",
            description: "Log",
            label: "Activity",
            color: "#1e1e2e",
            colSpan: 2,
            rowSpan: 2,
            children: (
                <div className="flex flex-col h-full p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ClipboardList size={16} /> Activity Log
                        </span>
                        <Link href="/hospital/reservations" className="text-[10px] bg-white/10 px-2 py-1 rounded text-white hover:bg-white/20 transition-colors z-10">All Logs</Link>
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                        {reservations.slice(0, 3).map((r, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">Donor Match</span>
                                    <span className="text-[10px] text-gray-400">{r.bloodGroup || 'Blood'} • {r.status}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-mono text-purple-300">{r.estArrival ? `${r.estArrival}m` : 'N/A'}</div>
                                    <div className="text-[9px] text-gray-500">ETA</div>
                                </div>
                            </div>
                        ))}
                        {reservations.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic">No recent activity</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: `${fulfillmentRate}%`,
            description: "Success",
            label: "Rate",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Success</span>
                        <CheckCircle className="text-green-400" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{fulfillmentRate}%</div>
                        <div className="text-[10px] text-gray-400 mt-1">Fulfillment</div>
                    </div>
                </div>
            )
        },
        {
            title: confirmedReservations.length.toString(),
            description: "En Route",
            label: "Incoming",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Incoming</span>
                        <Users className="text-purple-400" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{confirmedReservations.length}</div>
                        <div className="text-[10px] text-gray-400 mt-1">Donors</div>
                    </div>
                </div>
            )
        },
        // Donor Activation Tile
        {
            title: "Verification",
            description: "Manage Access",
            label: "Donors",
            color: "#1e1e2e",
            colSpan: 2,
            rowSpan: 2,
            children: <DonorActivationTile />
        }
    ];

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hospital Dashboard</h1>
                    <p className="text-muted-foreground">Manage requests and track incoming donations.</p>
                </div>
                <Button asChild>
                    <Link href="/hospital/requests">Manage Requests</Link>
                </Button>
            </div>

            <MagicBento
                items={bentoItems}
                enableStars={true}
                enableSpotlight={true}
                spotlightRadius={300}
                particleCount={15}
            />
        </div>
    )
}
