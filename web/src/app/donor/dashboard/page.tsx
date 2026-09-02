"use client"

import MagicBento from "@/components/MagicBento"
import { useDonorProfile } from "@/hooks/useUserProfile"
import { useReservations } from "@/hooks/useReservations"
import { useCheckupRequests } from "@/hooks/useCheckupRequests"
import { LIVES_SAVED_PER_DONATION } from "@/lib/constants"
import { Activity, Droplet, Calendar, Clock, Heart, History as HistoryIcon } from "lucide-react"

export default function DonorDashboard() {
    const { profile, loading: profileLoading } = useDonorProfile()
    const { reservations, loading: reservationsLoading } = useReservations("donor")
    const { request: pendingCheckup, loading: checkupLoading } = useCheckupRequests()

    if (profileLoading) {
        return <div className="p-8">Loading profile...</div>
    }

    const totalDonations = profile?.totalDonations || profile?.completedDonations || 0
    const lastDonation = profile?.lastDonationDate
    const isEligible = profile?.isActive !== false
    const reliabilityScore = profile?.reliabilityScore

    const pendingReservations = reservations.filter(r => r.status === "PENDING").length
    const confirmedReservations = reservations.filter(r => r.status === "CONFIRMED").length

    // Layout:
    // [Type][Status] [Impact (2x2)]
    // [History (2x2)] [Reliability][Reservations]

    const bentoItems = [
        {
            title: profile?.bloodType || "?",
            description: "Blood Type",
            label: "Type",
            color: "#3f1a1a",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-red-300/70">Type</span>
                        <Droplet className="text-red-500" size={18} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-white mb-1 tracking-tighter">
                            {profile?.donorStatus === "APPROVED" ? (profile?.bloodType || "?") : "N/A"}
                        </div>
                        <div className="text-[10px] text-red-200/60">
                            {profile?.donorStatus === "APPROVED" ? "Verified" : "Verification Required"}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Status",
            description: "Availability",
            label: "Status",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</span>
                        <Clock className={isEligible ? "text-emerald-500" : "text-orange-500"} size={18} />
                    </div>
                    <div>
                        <div className={`text-xl font-bold ${isEligible ? "text-emerald-400" : "text-orange-400"}`}>
                            {isEligible ? "Available" : "Wait Period"}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                            {isEligible ? "Ready to donate" : "Recovery active"}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Impact",
            description: "Lives Saved",
            label: "Impact",
            color: "#1e1e2e",
            colSpan: 2,
            rowSpan: 2,
            children: (
                <div className="flex relative h-full w-full p-6 flex-col justify-between pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-[-20px] right-[-20px] w-48 h-48 bg-pink-600/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex justify-between items-start z-10">
                        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Cumulative Impact</span>
                        <Heart className="text-pink-500 animate-pulse" size={24} />
                    </div>

                    <div className="z-10 space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-bold text-white tracking-tighter">{totalDonations * LIVES_SAVED_PER_DONATION}</span>
                            <span className="text-xl text-pink-400 font-medium">Lives</span>
                        </div>

                        <div className="bg-white/5 rounded-lg p-3 border border-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{totalDonations} Donations</div>
                                    <div className="text-xs text-gray-400">Total successful drives</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "History",
            description: "Donation Log",
            label: "History",
            color: "#1e1e2e",
            colSpan: 2,
            rowSpan: 2,
            children: (
                <div className="flex flex-col h-full p-6 relative">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <HistoryIcon size={16} /> Donation History
                        </span>
                        <div className="text-xs text-gray-500">Last: {lastDonation ? new Date(lastDonation).toLocaleDateString() : 'Never'}</div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 border-2 border-dashed border-white/5 rounded-lg m-2">
                        {totalDonations === 0 ? (
                            <>
                                <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mb-1">
                                    <Droplet className="text-gray-600" />
                                </div>
                                <div className="text-sm text-gray-500">No donation history found</div>
                            </>
                        ) : (
                            <div className="w-full h-full p-2">
                                {/* Placeholder for chart or list - strictly simple for now */}
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-sm text-white">Recent Donation</span>
                                    <span className="text-xs text-green-400">Completed</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-white">Previous</span>
                                    <span className="text-xs text-gray-500">3 months ago</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: "Reliability",
            description: "Score",
            label: "Score",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reliability</span>
                        <Activity className="text-blue-500" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {reliabilityScore !== undefined ? `${(reliabilityScore * 100).toFixed(0)}%` : "N/A"}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">Commitment</div>
                    </div>
                </div>
            )
        },
        {
            title: "Reservations",
            description: "Matches",
            label: "Matches",
            color: "#1e1e2e",
            colSpan: 1,
            children: (
                <div className="flex flex-col justify-between h-full p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Matches</span>
                        <Calendar className="text-purple-500" size={18} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{pendingReservations}</div>
                        <div className="text-[10px] text-purple-300 mt-1">Pending</div>
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Donor Dashboard</h1>
                <p className="text-muted-foreground">Your impact and donation journey.</p>
            </div>

            {profile?.donorStatus !== "APPROVED" && (
                <div className="space-y-4">
                    {pendingCheckup ? (
                        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-4 rounded-lg flex items-center gap-3">
                            <Calendar className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold">Checkup Requested</h3>
                                <p className="text-sm opacity-90">
                                    You have a pending checkup at <span className="font-bold">{pendingCheckup.hospitalName}</span> on {pendingCheckup.scheduledAt?.toLocaleString()}.
                                    Please visit the hospital to verify your profile.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-4 rounded-lg flex items-center gap-3">
                            <HistoryIcon className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold">Account Inactive</h3>
                                <p className="text-sm opacity-90">Your donor account is inactive. Register for a blood checkup at a nearby hospital to continue.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {profile?.donorStatus === "APPROVED" && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg flex items-center gap-3">
                    <HistoryIcon className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold">Account Verified</h3>
                        <p className="text-sm opacity-90">Your donor profile has been verified by the hospital. You can now donate blood.</p>
                    </div>
                </div>
            )}

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
