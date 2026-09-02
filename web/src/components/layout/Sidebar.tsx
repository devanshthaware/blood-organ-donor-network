"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    Menu,
    LayoutDashboard,
    List,
    History,
    Calendar,
    Users,
    Bell,
    Shield,
    Activity,
    FileText,
    LogOut,
    User,
    Building2,
    MapPinned,
    Stethoscope,
    HeartHandshake,
    Network,
    Droplet,
    Heart,
    Siren,
    Truck,
    Cpu,
    ShieldCheck,
    Sparkles,
} from "lucide-react"

const unifiedNetworkRoutes = [
    { name: "Network Command", href: "/network", icon: Network },
    { name: "Blood Network", href: "/blood", icon: Droplet },
    { name: "Organ Network", href: "/organ", icon: Heart },
    { name: "Emergency Dispatch", href: "/emergency", icon: Siren },
    { name: "Logistics Center", href: "/logistics", icon: Truck },
    { name: "AI Intelligence", href: "/intelligence", icon: Cpu },
    { name: "Audit & Provenance", href: "/audit", icon: ShieldCheck },
    { name: "Demo Studio", href: "/demo", icon: Sparkles },
]

const roleRoutes = {
    donor: [
        { name: "Donor Dashboard", href: "/donor/dashboard", icon: LayoutDashboard },
        { name: "Find Hospital", href: "/donor/map", icon: MapPinned },
        { name: "Donation Requests", href: "/donor/requests", icon: List },
        { name: "Donation History", href: "/donor/history", icon: History },
        { name: "My Availability", href: "/donor/availability", icon: Calendar },
        { name: "Profile", href: "/donor/profile", icon: User },
    ],
    hospital: [
        { name: "Hospital Console", href: "/hospital/dashboard", icon: LayoutDashboard },
        { name: "Organ Allocation", href: "/organ/review", icon: HeartHandshake },
        { name: "Checkups", href: "/hospital/checkups", icon: Stethoscope },
        { name: "Patients", href: "/hospital/patients", icon: Users },
        { name: "Blood Requests", href: "/hospital/requests", icon: List },
        { name: "Reservations", href: "/hospital/reservations", icon: Calendar },
        { name: "Alerts", href: "/hospital/alerts", icon: Bell },
        { name: "Profile", href: "/hospital/profile", icon: User },
    ],
    admin: [
        { name: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "System Operations", href: "/admin/system", icon: Cpu },
        { name: "Hospitals", href: "/admin/hospitals", icon: Building2 },
        { name: "Donors", href: "/admin/donors", icon: Users },
        { name: "AI Monitor", href: "/admin/ai-monitor", icon: Activity },
        { name: "Security & Governance", href: "/admin/security", icon: Shield },
        { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
    ],
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: "donor" | "hospital" | "admin"
}

export function Sidebar({ role = "hospital", className }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useClerk()
    const currentRoleRoutes = roleRoutes[role] || roleRoutes.hospital

    const handleLogout = async () => {
        try {
            await signOut()
            router.push("/auth")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    return (
        <div className={cn("pb-12 flex flex-col h-full overflow-y-auto", className)}>
            <div className="space-y-4 py-4 flex-1">
                {/* Logo & Platform Name */}
                <div className="px-4 py-2">
                    <Link href="/network" className="flex items-center gap-2 mb-3">
                        <Image
                            src="/logo.png"
                            alt="VeinLink Logo"
                            width={36}
                            height={36}
                            className="object-cover rounded-lg"
                        />
                        <div>
                            <span className="font-extrabold text-base tracking-tight text-foreground">VeinLink</span>
                            <span className="block text-[10px] text-muted-foreground font-mono leading-none">Blood & Organ Platform</span>
                        </div>
                    </Link>

                    {/* Section 1: Unified Healthcare Network */}
                    <div className="pt-2">
                        <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Unified Network
                        </span>
                        <div className="space-y-0.5">
                            {unifiedNetworkRoutes.map((route) => (
                                <Button
                                    key={route.href}
                                    variant={pathname === route.href ? "secondary" : "ghost"}
                                    size="sm"
                                    className="w-full justify-start text-xs h-8"
                                    asChild
                                >
                                    <Link href={route.href}>
                                        <route.icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        {route.name}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Role Operations */}
                    <div className="pt-4 mt-2 border-t">
                        <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            {role.toUpperCase()} Operations
                        </span>
                        <div className="space-y-0.5">
                            {currentRoleRoutes.map((route) => (
                                <Button
                                    key={route.href}
                                    variant={pathname === route.href ? "secondary" : "ghost"}
                                    size="sm"
                                    className="w-full justify-start text-xs h-8"
                                    asChild
                                >
                                    <Link href={route.href}>
                                        <route.icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        {route.name}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-3 py-2 border-t">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}

export function MobileSidebar({ role = "hospital" }: { role?: "donor" | "hospital" | "admin" }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <Sidebar role={role} className="h-full" />
            </SheetContent>
        </Sheet>
    )
}
