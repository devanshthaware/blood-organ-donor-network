"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useSignIn } from "@clerk/nextjs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { LabelInputContainer } from "@/components/ui/label-input-container"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const params = useParams()
    const role = params?.role as string

    const { isLoaded, signIn, setActive }: any = useSignIn()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (role && !["donor", "hospital", "admin"].includes(role)) {
            router.push("/auth")
        }
    }, [role, router])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            if (isLoaded && signIn) {
                const result = await signIn.create({
                    identifier: email,
                    password: password,
                })

                if (result.status === "complete") {
                    await setActive({ session: result.createdSessionId })

                    if (role === "hospital") {
                        router.push("/hospital/dashboard")
                    } else if (role === "admin") {
                        router.push("/admin/dashboard")
                    } else {
                        router.push("/donor/dashboard")
                    }
                    return
                }
            }

            // Fallback for local development if Clerk keys are dummy
            if (role === "hospital") {
                router.push("/hospital/dashboard")
            } else if (role === "admin") {
                router.push("/admin/dashboard")
            } else {
                router.push("/donor/dashboard")
            }
        } catch (err: any) {
            console.error("Login error:", err)
            setError(err?.errors?.[0]?.message || "Invalid email or password.")
        } finally {
            setLoading(false)
        }
    }

    const getRoleTitle = () => {
        switch (role) {
            case "donor":
                return "Donor Portal"
            case "hospital":
                return "Hospital Portal"
            case "admin":
                return "Admin Portal"
            default:
                return "Portal"
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to portal selection
                </Link>

                <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                    <div className="text-center mb-8">
                        <span className="text-xs font-semibold uppercase tracking-wider text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                            {getRoleTitle()}
                        </span>
                        <h1 className="text-2xl font-bold text-white mt-4">Welcome back</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <LabelInputContainer>
                            <Label htmlFor="email" className="text-neutral-300">
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500"
                            />
                        </LabelInputContainer>

                        <LabelInputContainer>
                            <Label htmlFor="password" className="text-neutral-300">
                                Password
                            </Label>
                            <PasswordInput
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500"
                            />
                        </LabelInputContainer>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    {role !== "admin" && (
                        <p className="text-center text-sm text-neutral-400 mt-6">
                            Don&apos;t have an account?{" "}
                            <Link
                                href={`/register/${role}`}
                                className="text-red-400 hover:text-red-300 font-medium transition-colors"
                            >
                                Register here
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
