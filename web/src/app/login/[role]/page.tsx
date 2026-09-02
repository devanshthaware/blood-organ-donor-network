"use client"

import React from "react"
import { useParams } from "next/navigation"
import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
    const params = useParams()
    const role = (params?.role as string) || "donor"
    const redirectUrl = `/${role}/dashboard`

    return (
        <div className="min-h-screen w-full bg-black relative flex flex-col items-center justify-center p-4 antialiased">
            <div className="absolute top-6 left-6 z-20">
                <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Role Selection
                </Link>
            </div>

            <div className="w-full max-w-md flex flex-col items-center justify-center">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white capitalize">{role} Login</h1>
                    <p className="text-xs text-zinc-400 mt-1">Sign in with your verified Clerk credentials</p>
                </div>

                <SignIn
                    routing="hash"
                    forceRedirectUrl={redirectUrl}
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl",
                        },
                    }}
                />
            </div>
        </div>
    )
}
