import { LayoutDashboard, List, History, Calendar, Users, Bell, Shield, Activity, User, Building2, Stethoscope, HeartHandshake } from "lucide-react"

export const routes = {
    donor: [
        { name: "Dashboard", href: "/donor/dashboard", icon: LayoutDashboard },
        { name: "Requests", href: "/donor/requests", icon: List },
        { name: "History", href: "/donor/history", icon: History },
        { name: "Availability", href: "/donor/availability", icon: Calendar },
        { name: "Profile", href: "/donor/profile", icon: User },
    ],
    hospital: [
        { name: "Dashboard", href: "/hospital/dashboard", icon: LayoutDashboard },
        { name: "Organ Network", href: "/hospital/organs", icon: HeartHandshake },
        { name: "Checkups", href: "/hospital/checkups", icon: Stethoscope },
        { name: "Patients", href: "/hospital/patients", icon: Users },
        { name: "Requests", href: "/hospital/requests", icon: List },
        { name: "Reservations", href: "/hospital/reservations", icon: Calendar },
        { name: "Alerts", href: "/hospital/alerts", icon: Bell },
        { name: "Profile", href: "/hospital/profile", icon: User },
    ],
    admin: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Hospitals", href: "/admin/hospitals", icon: Building2 },
        { name: "Donors", href: "/admin/donors", icon: Users },
        { name: "AI Monitor", href: "/admin/ai-monitor", icon: Activity },
        { name: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
        { name: "Profile", href: "/admin/profile", icon: User },
    ],
}
