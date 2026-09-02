"use client"

import React, { useState } from "react"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { routes } from "@/config/routes"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { LogOut, Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "motion/react"

interface DashboardLayoutProps {
    children: React.ReactNode
    role: "donor" | "hospital" | "admin"
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const currentRoutes = routes[role]

    const handleLogout = async () => {
        try {
            await signOut(auth)
            router.push("/login")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    return (
        <div className={cn(
            "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-900 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
            "h-screen" // Full screen height
        )}>
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <Logo />
                        <div className="mt-8 flex flex-col gap-2">
                            {currentRoutes.map((route, idx) => (
                                <SidebarLink
                                    key={idx}
                                    link={{
                                        label: route.name,
                                        href: route.href,
                                        icon: <route.icon className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* Theme Toggle integrated as a sidebar item (custom representation) */}
                        <div className="flex items-center gap-2 py-2">
                            <ModeToggle className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
                            {open && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-neutral-700 dark:text-neutral-200 text-sm whitespace-pre"
                                >
                                    Theme
                                </motion.span>
                            )}
                        </div>

                        <div
                            className="cursor-pointer"
                            onClick={handleLogout}
                        >
                            <SidebarLink
                                link={{
                                    label: "Logout",
                                    href: "#",
                                    icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                                }}
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                                {role[0].toUpperCase()}
                            </div>
                            {open && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-neutral-500 overflow-hidden whitespace-nowrap"
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)} Account
                                </motion.div>
                            )}
                        </div>
                    </div>
                </SidebarBody>
            </Sidebar>
            <div className="flex flex-1">
                <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}

export const Logo = () => {
    return (
        <Link
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <Image
                src="/logo-new.png"
                alt="VeinLink Logo"
                width={44}
                height={44}
                className="flex-shrink-0 object-cover scale-125"
            />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-black dark:text-white whitespace-pre"
            >
                VeinLink
            </motion.span>
        </Link>
    );
};
