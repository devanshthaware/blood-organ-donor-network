"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { LabelInputContainer } from "@/components/ui/label-input-container"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const params = useParams()
    const role = params?.role as string

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        // Validate role param
        if (role && !["donor", "hospital", "admin"].includes(role)) {
            router.push("/auth")
        }
    }, [role, router])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid))

            if (userDoc.exists()) {
                const userData = userDoc.data()
                const userRole = userData.role || "donor"

                // Check if user is logging into the correct portal
                if (userRole !== role) {
                    await signOut(auth)
                    setError(`This account is registered as a ${userRole}. Please login via the ${userRole} portal.`)
                    setLoading(false)
                    return
                }

                // Redirect based on role
                if (role === "hospital") {
                    // Check approval status
                    const hospitalDoc = await getDoc(doc(db, "hospitals", user.uid))
                    if (hospitalDoc.exists()) {
                        const status = hospitalDoc.data().approvalStatus

                        if (status === "PENDING") {
                            await signOut(auth)
                            setError("Your hospital account is awaiting admin approval.")
                            return
                        } else if (status === "REJECTED") {
                            await signOut(auth)
                            setError("Your hospital registration was rejected.")
                            return
                        } else if (status === "APPROVED") {
                            router.push("/hospital/dashboard")
                        } else {
                            await signOut(auth)
                            setError("Account status unknown. Please contact support.")
                            return
                        }
                    } else {
                        await signOut(auth)
                        setError("Hospital profile not found.")
                        return
                    }
                } else if (role === "admin") {
                    router.push("/admin/dashboard")
                } else {
                    router.push("/donor/dashboard")
                }
            } else {
                // User doesn't have a profile yet (edge case)
                await signOut(auth)
                setError("User profile not found.")
            }
        } catch (err: any) {
            console.error("Login error:", err)
            setError("Invalid email or password.")
        } finally {
            setLoading(false)
        }
    }

    const getRoleTitle = () => {
        switch (role) {
            case "donor": return "Donor Login"
            case "hospital": return "Hospital Login"
            case "admin": return "Admin Login"
            default: return "Login"
        }
    }

    if (!role) return null

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8 relative">
            <Link href="/auth" className="absolute top-8 left-8 text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Role Selection</span>
            </Link>

            <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black border border-zinc-800">
                <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200 capitalize">
                    {getRoleTitle()}
                </h2>
                <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
                    Enter your email below to login to your {role} account.
                </p>

                {error && (
                    <div className="mt-4 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {error}
                    </div>
                )}

                <form className="my-8" onSubmit={handleLogin}>
                    <LabelInputContainer className="mb-4">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            placeholder="m@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </LabelInputContainer>

                    <LabelInputContainer className="mb-4">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </LabelInputContainer>

                    <button
                        className="bg-gradient-to-br from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] relative group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                        <BottomGradient />
                    </button>

                    <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

                    <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                        Don&apos;t have an account?{" "}
                        <Link href={`/register/${role}`} className="text-neutral-800 dark:text-neutral-200 hover:underline">
                            Sign up as {role}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}

const BottomGradient = () => {
    return (
        <>
            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        </>
    );
};
