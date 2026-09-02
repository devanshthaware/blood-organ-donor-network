"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { LabelInputContainer } from "@/components/ui/label-input-container"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { ArrowLeft } from "lucide-react"

// Dynamically import LeafletLocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import("@/components/LeafletLocationPicker"), {
    ssr: false,
    loading: () => <div className="p-4 text-center text-muted-foreground">Loading map...</div>
})

export default function RegisterPage() {
    const router = useRouter()
    const params = useParams()
    const role = params?.role as "donor" | "hospital" | "admin"

    const { isLoaded, signUp, setActive }: any = useSignUp()
    const syncUserMutation = useMutation(api.users.syncUser)
    const registerDonorMutation = useMutation(api.donors.registerDonor)
    const registerHospitalMutation = useMutation(api.hospitals.registerHospital)

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    // Hospital-specific fields
    const [hospitalStreet, setHospitalStreet] = useState("")
    const [hospitalArea, setHospitalArea] = useState("")
    const [hospitalCity, setHospitalCity] = useState("")
    const [hospitalState, setHospitalState] = useState("")
    const [hospitalPincode, setHospitalPincode] = useState("")
    const [hospitalLocation, setHospitalLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationError, setLocationError] = useState("")

    useEffect(() => {
        if (role && !["donor", "hospital", "admin"].includes(role)) {
            router.push("/auth")
        }
    }, [role, router])

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLocationError("")
        setLoading(true)

        if (role === "hospital") {
            if (!hospitalStreet || !hospitalCity || !hospitalState || !hospitalPincode) {
                setError("Please fill in all address fields (street, city, state, pincode)")
                setLoading(false)
                return
            }
        }

        if (role === "hospital" || role === "donor") {
            if (!hospitalLocation || !hospitalLocation.lat || !hospitalLocation.lng) {
                setLocationError("Please select a location on the map by dragging the marker")
                setError("Please select your location on the map")
                setLoading(false)
                return
            }
        }

        try {
            let userId = `user_${Date.now()}`

            if (isLoaded && signUp) {
                try {
                    const result = await signUp.create({
                        emailAddress: email,
                        password: password,
                    })

                    if (result.status === "complete") {
                        await setActive({ session: result.createdSessionId })
                        if (result.createdUserId) {
                            userId = result.createdUserId
                        }
                    }
                } catch (signUpErr: any) {
                    console.warn("Clerk sign-up notice:", signUpErr?.errors?.[0]?.message || signUpErr)
                }
            }

            // Sync user to Convex
            await syncUserMutation({
                clerkId: userId,
                email,
                fullName: name,
                role,
            })

            // Sync role-specific profile to Convex
            if (role === "donor") {
                await registerDonorMutation({
                    userId,
                    fullName: name,
                    bloodType: "O+",
                    lat: hospitalLocation?.lat || 19.076,
                    lng: hospitalLocation?.lng || 72.8777,
                    address: "Standard Area",
                })
                setSuccessMessage("Account created successfully! You can now access your Donor Portal.")
            } else if (role === "hospital") {
                const fullAddress = `${hospitalStreet}, ${hospitalArea ? hospitalArea + ", " : ""}${hospitalCity}, ${hospitalState} ${hospitalPincode}`
                await registerHospitalMutation({
                    userId,
                    name,
                    address: fullAddress,
                    region: 1,
                    lat: hospitalLocation!.lat,
                    lng: hospitalLocation!.lng,
                    contactEmail: email,
                    contactPhone: "",
                })
                setSuccessMessage("Hospital account registered! You can now access your Hospital Portal.")
            } else if (role === "admin") {
                router.push("/admin/dashboard")
            }
        } catch (err: any) {
            console.error("Registration error:", err)
            setError(err?.message || "Failed to create account. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (!role) return null

    const getRoleTitle = () => {
        switch (role) {
            case "donor": return "Donor Registration"
            case "hospital": return "Hospital Registration"
            case "admin": return "Admin Registration"
            default: return "Register"
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8 relative">
            <Link href="/auth" className="absolute top-8 left-8 text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Role Selection</span>
            </Link>

            <div className={cn(
                "w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black border border-zinc-800",
                role === "hospital" ? "max-w-3xl" : "max-w-md"
            )}>
                <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200 capitalize">
                    {getRoleTitle()}
                </h2>
                <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
                    Join the AI-powered blood donation network as a {role}.
                </p>

                {error && (
                    <div className="mt-4 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900">
                        {successMessage}
                        <div className="mt-2">
                            <Link href={`/login/${role}`} className="font-medium underline">
                                Go to Login
                            </Link>
                        </div>
                    </div>
                )}

                {!successMessage && (
                    <form className="my-8" onSubmit={handleRegister}>
                        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                            <LabelInputContainer>
                                <Label htmlFor="firstname">Full Name</Label>
                                <Input
                                    id="firstname"
                                    placeholder={role === "hospital" ? "General Hospital" : "Tyler Durden"}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </LabelInputContainer>
                        </div>

                        <LabelInputContainer className="mb-4">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                placeholder={role === "hospital" ? "contact@hospital.com" : "projectmayhem@fc.com"}
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
                                minLength={6}
                            />
                        </LabelInputContainer>

                        {(role === "hospital" || role === "donor") && (
                            <div className="space-y-4 mb-4 pt-4 border-t border-zinc-300 dark:border-zinc-700">
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">
                                        {role === "hospital" ? "Hospital Address & Location" : "Your Location"}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {role === "hospital"
                                            ? "Provide complete address and select exact location on the map for donor navigation."
                                             : "Please select your location on the map so we can match you with nearby requests."}
                                    </p>
                                </div>

                                {role === "hospital" && (
                                    <>
                                        <LabelInputContainer>
                                            <Label htmlFor="street">Street Address *</Label>
                                            <Input
                                                id="street"
                                                placeholder="123 Medical Center Drive"
                                                type="text"
                                                value={hospitalStreet}
                                                onChange={(e) => setHospitalStreet(e.target.value)}
                                                required={role === "hospital"}
                                            />
                                        </LabelInputContainer>
                                        <div className="grid grid-cols-2 gap-2">
                                            <LabelInputContainer>
                                                <Label htmlFor="city">City *</Label>
                                                <Input
                                                    id="city"
                                                    placeholder="Nagpur"
                                                    type="text"
                                                    value={hospitalCity}
                                                    onChange={(e) => setHospitalCity(e.target.value)}
                                                    required={role === "hospital"}
                                                />
                                            </LabelInputContainer>
                                            <LabelInputContainer>
                                                <Label htmlFor="state">State *</Label>
                                                <Input
                                                    id="state"
                                                    placeholder="NY"
                                                    type="text"
                                                    value={hospitalState}
                                                    onChange={(e) => setHospitalState(e.target.value)}
                                                    required={role === "hospital"}
                                                />
                                            </LabelInputContainer>
                                        </div>
                                        <LabelInputContainer>
                                            <Label htmlFor="pincode">Pincode / ZIP Code *</Label>
                                            <Input
                                                id="pincode"
                                                placeholder="10001"
                                                type="text"
                                                value={hospitalPincode}
                                                onChange={(e) => setHospitalPincode(e.target.value)}
                                                required={role === "hospital"}
                                            />
                                        </LabelInputContainer>
                                    </>
                                )}

                                <div className="pt-2">
                                    <LocationPicker
                                        onLocationChange={(location) => {
                                            setHospitalLocation(location)
                                            setLocationError("")
                                        }}
                                        error={locationError}
                                        address={role === "hospital" && (hospitalStreet || hospitalCity) ? `${hospitalStreet}, ${hospitalCity}, ${hospitalState} ${hospitalPincode}`.trim() : undefined}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            className="bg-gradient-to-br from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] relative group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Sign up"}
                            <BottomGradient />
                        </button>

                        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

                        <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                            Already have an account?{" "}
                            <Link href={`/login/${role}`} className="text-neutral-800 dark:text-neutral-200 hover:underline">
                                Login as {role}
                            </Link>
                        </div>
                    </form>
                )}
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
