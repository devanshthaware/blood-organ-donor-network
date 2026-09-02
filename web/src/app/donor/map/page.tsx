"use client"

import dynamic from "next/dynamic"
import { useAuth } from "@/hooks/useAuth"

// Dynamically import the map component to avoid SSR issues with Leaflet
const HospitalMap = dynamic(() => import("@/components/donor/HospitalMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900">Loading Map...</div>
})

export default function DonorMapPage() {
    const { user, loading } = useAuth()

    if (loading) return null

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Find a Hospital</h1>
                <p className="text-muted-foreground">Select a registered hospital to request a blood checkup.</p>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative z-0">
                <HospitalMap />
            </div>
        </div>
    )
}
