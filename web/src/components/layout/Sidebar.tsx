"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LayoutDashboard, List, History, Calendar, Users, Bell, Shield, Activity, FileText, LogOut, User, Building2, MapPinned, Stethoscope, HeartHandshake } from "lucide-react"

const routes = {
    donor: [
        { name: "Dashboard", href: "/donor/dashboard", icon: LayoutDashboard },
        { name: "Find Hospital", href: "/donor/map", icon: MapPinned },
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

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role: "donor" | "hospital" | "admin"
}

export function Sidebar({ role, className }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useClerk()
    const currentRoutes = routes[role]

    const handleLogout = async () => {
        try {
            await signOut()
            router.push("/auth")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    return (
        <div className={cn("pb-12 flex flex-col h-full", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="VeinLink Logo"
                            width={44}
                            height={44}
                            className="object-cover scale-125"
                        />
                        VeinLink
                    </h2>
                    <div className="space-y-1">
                        {currentRoutes.map((route) => (
                            <Button
                                key={route.href}
                                variant={pathname === route.href ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.name}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="px-3 py-2 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}

export function MobileSidebar({ role }: { role: "donor" | "hospital" | "admin" }) {
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
