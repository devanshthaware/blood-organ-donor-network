"use client"

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs"
import { Heart, Building2, Shield, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export default function AuthPage() {
    const { isLoaded, isSignedIn } = useUser()

    const roles = [
        {
            id: "donor",
            title: "Donor",
            description: "Donate blood, register organ pledges, and track your clinical verification.",
            icon: Heart,
            color: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            hover: "hover:border-red-500/50",
            redirectUrl: "/donor/dashboard",
        },
        {
            id: "hospital",
            title: "Hospital",
            description: "Submit organ requests, verify donors, evaluate living candidates, and manage inventory.",
            icon: Building2,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            hover: "hover:border-blue-500/50",
            redirectUrl: "/hospital/dashboard",
        },
        {
            id: "admin",
            title: "Admin",
            description: "Audit network transparency, monitor tamper-evident logs, and govern clinical compliance.",
            icon: Shield,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            hover: "hover:border-purple-500/50",
            redirectUrl: "/admin/dashboard",
        },
    ]

    return (
        <div className="min-h-screen w-full bg-black relative flex flex-col items-center justify-center p-4 antialiased overflow-hidden">
            <div className="z-10 w-full max-w-5xl">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI-Powered Healthcare Trust Network
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-500 font-sans tracking-tight mb-4">
                        Welcome to VeinLink
                    </h1>
                    <p className="text-neutral-400 max-w-lg mx-auto text-sm sm:text-base">
                        Connecting donors with transplant centers to save lives.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`relative group rounded-3xl p-8 bg-zinc-950/80 backdrop-blur-xl border ${role.border} transition-all duration-300 ${role.hover} flex flex-col items-center text-center shadow-xl`}
                        >
                            <div className={`p-4 rounded-2xl ${role.bg} mb-6 transition-transform group-hover:scale-110 duration-300`}>
                                <role.icon className={`w-8 h-8 ${role.color}`} />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">{role.title}</h3>
                            <p className="text-zinc-400 text-xs sm:text-sm mb-8 flex-1 leading-relaxed">
                                {role.description}
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                {isLoaded && isSignedIn ? (
                                    <Link
                                        href={role.redirectUrl}
                                        className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                                    >
                                        Go to {role.title} Dashboard <ArrowRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <>
                                        <SignInButton mode="modal" forceRedirectUrl={role.redirectUrl}>
                                            <button className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                                                Login as {role.title}
                                            </button>
                                        </SignInButton>
                                        <SignUpButton mode="modal" forceRedirectUrl={role.redirectUrl}>
                                            <button className="w-full py-2.5 px-4 rounded-xl border border-zinc-800 text-white font-medium hover:bg-zinc-900 transition-colors text-sm">
                                                Sign Up as {role.title}
                                            </button>
                                        </SignUpButton>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
