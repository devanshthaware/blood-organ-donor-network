"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Bell,
    Check,
    CheckCheck,
    Clock,
    Droplet,
    Heart,
    Info,
    ShieldAlert,
    ShieldCheck,
    Stethoscope,
} from "lucide-react"

export default function DonorNotificationsPage() {
    const notificationsData = useQuery(api.notifications.getUserNotifications, { limit: 50 })
    const markAsReadMutation = useMutation(api.notifications.markNotificationAsRead)
    const markAllAsReadMutation = useMutation(api.notifications.markAllNotificationsAsRead)

    const notifications = notificationsData?.notifications || []
    const unreadCount = notificationsData?.unreadCount || 0

    const getIcon = (type: string) => {
        switch (type) {
            case "VERIFICATION_APPROVED":
                return <ShieldCheck className="h-5 w-5 text-emerald-500" />
            case "VERIFICATION_REJECTED":
            case "ORGAN_EVALUATION_REJECTED":
                return <ShieldAlert className="h-5 w-5 text-red-500" />
            case "ORGAN_EVALUATION_APPROVED":
                return <Heart className="h-5 w-5 text-purple-500" />
            case "ORGAN_EVALUATION_SUBMITTED":
                return <Stethoscope className="h-5 w-5 text-blue-500" />
            case "VERIFICATION_SUBMITTED":
            case "VERIFICATION_REQUIRED":
                return <Clock className="h-5 w-5 text-amber-500" />
            default:
                return <Bell className="h-5 w-5 text-muted-foreground" />
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                        <Bell className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
                        <p className="text-muted-foreground text-xs mt-0.5">
                            Real-time alerts regarding medical verification, blood requests, and organ evaluations.
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex items-center gap-1.5"
                        onClick={() => markAllAsReadMutation({})}
                    >
                        <CheckCheck className="h-3.5 w-3.5 text-purple-500" />
                        Mark All as Read ({unreadCount})
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-medium">No notifications yet</p>
                        <p className="text-xs mt-1">Updates regarding your verification and requests will appear here.</p>
                    </Card>
                ) : (
                    notifications.map((notif) => (
                        <Card
                            key={notif._id}
                            className={`transition-all ${
                                notif.isRead
                                    ? "bg-background/60 border-border/50"
                                    : "bg-purple-500/5 border-purple-500/30 shadow-sm"
                            }`}
                        >
                            <CardContent className="p-4 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-background border mt-0.5 shrink-0">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-sm text-foreground">{notif.title}</h3>
                                            {!notif.isRead && (
                                                <Badge className="bg-purple-600 text-white text-[9px] px-1.5 py-0">NEW</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
                                            <Clock className="h-3 w-3" />
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {!notif.isRead && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 shrink-0"
                                        onClick={() => markAsReadMutation({ notificationId: notif._id })}
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
