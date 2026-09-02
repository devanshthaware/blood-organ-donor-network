"use client"

import Link from "next/link"
import { Heart, Building2, Shield, ArrowRight } from "lucide-react"

export default function AuthPage() {
    const roles = [
        {
            id: "donor",
            title: "Donor",
            description: "Donate blood, save lives, and track your impact.",
            icon: Heart,
            color: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            hover: "hover:border-red-500/50"
        },
        {
            id: "hospital",
            title: "Hospital",
            description: "Request blood, manage inventory, and save patients.",
            icon: Building2,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            hover: "hover:border-blue-500/50"
        },
        {
            id: "admin",
            title: "Admin",
            description: "Manage the platform, verify users, and monitor metrics.",
            icon: Shield,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            hover: "hover:border-purple-500/50"
        }
    ]

    return (
        <div className="min-h-screen w-full bg-black relative flex flex-col items-center justify-center p-4 antialiased overflow-hidden">
            <div className="z-10 w-full max-w-5xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-sans tracking-tight mb-4">
                        Welcome to VeinLink
                    </h1>
                    <p className="text-neutral-400 max-w-lg mx-auto text-lg">
                        Connecting donors with hospitals to create a lifecycle of hope. Select your role to get started.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`relative group rounded-2xl p-8 bg-zinc-900/50 backdrop-blur-sm border ${role.border} transition-all duration-300 ${role.hover} flex flex-col items-center text-center`}
                        >
                            <div className={`p-4 rounded-full ${role.bg} mb-6 transition-transform group-hover:scale-110 duration-300`}>
                                <role.icon className={`w-8 h-8 ${role.color}`} />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3">{role.title}</h3>
                            <p className="text-zinc-400 text-sm mb-8 flex-1">
                                {role.description}
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <Link
                                    href={`/login/${role.id}`}
                                    className="w-full py-2.5 px-4 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    Login
                                </Link>
                                <Link
                                    href={`/register/${role.id}`}
                                    className="w-full py-2.5 px-4 rounded-lg border border-zinc-700 text-white font-medium hover:bg-zinc-800 transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
