"use client"

import React from "react"
import { useParams } from "next/navigation"
import { SignUp, useUser, SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, LogOut } from "lucide-react"

export default function RegisterPage() {
    const params = useParams()
    const { isLoaded, isSignedIn, user } = useUser()
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
                    <h1 className="text-2xl font-bold text-white capitalize">{role} Registration</h1>
                    <p className="text-xs text-zinc-400 mt-1">Create your secure account with Clerk</p>
                </div>

                {isLoaded && isSignedIn && user ? (
                    <div className="w-full p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl text-center space-y-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-5 h-5 mx-auto mb-1.5 text-emerald-400" />
                            Already signed in as <strong className="text-white block mt-0.5">{user.fullName || user.primaryEmailAddress?.emailAddress}</strong>
                        </div>

                        <Link
                            href={redirectUrl}
                            className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            Proceed to {role} Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>

                        <SignOutButton>
                            <button className="w-full py-2 px-4 rounded-xl border border-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5">
                                <LogOut className="w-3.5 h-3.5" /> Sign Out / Create New Account
                            </button>
                        </SignOutButton>
                    </div>
                ) : (
                    <SignUp
                        routing="hash"
                        forceRedirectUrl={redirectUrl}
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl",
                            },
                        }}
                    />
                )}
            </div>
        </div>
    )
}
