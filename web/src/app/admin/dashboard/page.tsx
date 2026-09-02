"use client"

import MagicBento from "@/components/MagicBento"
import { useSystemStats } from "@/hooks/useSystemStats"
import { Activity, Shield, Users, Server, Database, Building2 } from "lucide-react"

export default function AdminDashboard() {
    const { stats, loading, error } = useSystemStats();

    if (loading) {
        return <div className="p-8">Loading system intelligence...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }

    // Refined Layout: 
    // [Health][Network] [Intelligence (2x2)]
    // [Security (2x2)]  [Donors] [Hospitals]

    const bentoItems = [
        {
            title: `${stats.systemUptime}%`,
            description: "System Uptime",
            label: "Health",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</span>
                        <Server className="text-green-400" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{stats.systemUptime}%</div>
                        <div className="text-[10px] text-green-400/80 mt-1">● Operational</div>
                    </div>
                </div>
            )
        },
        {
            title: stats.activeUsers.toLocaleString(),
            description: "Active Users",
            label: "Network",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</span>
                        <Users className="text-blue-400" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{stats.activeUsers.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400 mt-1">Online now</div>
                    </div>
                </div>
            )
        },
        {
            title: "Intelligence",
            description: "AI Metrics",
            label: "AI Core",
            color: "#2a2a40",
            colSpan: 2,
            rowSpan: 2,
            children: (
                <div className="flex flex-col justify-between h-full p-6 pointer-events-none relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex justify-between items-start">
                        <div className="flex gap-2 items-center">
                            <span className="text-sm font-medium uppercase tracking-wider text-purple-300">Intelligence</span>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                        </div>
                        <Activity className="text-purple-400" size={24} />
                    </div>

                    <div className="space-y-6 z-10">
                        <div>
                            <div className="text-xs text-purple-300/70 mb-1 uppercase tracking-wider">Total Inferences</div>
                            <div className="text-5xl font-bold text-white tracking-tighter">{stats.totalMLInferences.toLocaleString()}</div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Processing Load</span>
                                <span>45%</span>
                            </div>
                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 w-[45%]"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-black/20 rounded p-2 border border-white/5">
                                <div className="text-lg font-bold text-white">98.2%</div>
                                <div className="text-[10px] text-gray-500">Accuracy</div>
                            </div>
                            <div className="bg-black/20 rounded p-2 border border-white/5">
                                <div className="text-lg font-bold text-white">45ms</div>
                                <div className="text-[10px] text-gray-500">Latency</div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Security",
            description: "Threat Monitoring",
            label: "Security",
            color: "#1e1e2e",
            colSpan: 2,
            rowSpan: 2,
            children: (
                <div className="flex flex-col justify-between h-full p-6 pointer-events-none relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Security Shield</span>
                        <Shield className={stats.securityIncidents > 0 ? "text-red-500" : "text-emerald-500"} size={24} />
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                        {stats.securityIncidents === 0 ? (
                            <>
                                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                    <Shield className="text-emerald-500 h-8 w-8" />
                                </div>
                                <div className="text-2xl font-bold text-white">System Secure</div>
                                <div className="text-sm text-gray-400">No active threats detected</div>
                            </>
                        ) : (
                            <>
                                <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                                    <Shield className="text-red-500 h-8 w-8 animate-pulse" />
                                </div>
                                <div className="text-2xl font-bold text-white">{stats.securityIncidents} Incidents</div>
                                <div className="text-sm text-red-300">Requires immediate attention</div>
                            </>
                        )}
                    </div>

                    <div className="w-full bg-black/20 rounded-lg p-3 border border-white/5 flex gap-3 text-xs text-gray-400">
                        <div className="flex-1 border-r border-white/5 text-center">
                            <div className="text-white font-bold">24h</div>
                            <div>Monitoring</div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="text-white font-bold">100%</div>
                            <div>Uptime</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Donors",
            description: "Registered Donors",
            label: "DB",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Donors</span>
                        <Database className="text-pink-400" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">320</div>
                        <div className="text-[10px] text-gray-400 mt-1">Verified Profiles</div>
                    </div>
                </div>
            )
        },
        {
            title: "Hospitals",
            description: "Partner Hospitals",
            label: "Partners",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hospitals</span>
                        <Building2 className="text-orange-400" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">45</div>
                        <div className="text-[10px] text-gray-400 mt-1">Active Partners</div>
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">System overview and intelligence metrics.</p>
            </div>

            <MagicBento
                items={bentoItems}
                enableStars={true}
                enableSpotlight={true}
                spotlightRadius={300}
                particleCount={20}
            />
        </div>
    )
}
