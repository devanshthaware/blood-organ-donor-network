"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
// import { addDoc, collection, query, serverTimestamp, where, getDocs } from "firebase/firestore"
// import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { MapPin, CheckCircle2 } from "lucide-react"
import { useHospitals } from "@/hooks/useHospitals"

// import { getHospitals, type Hospital } from "@/lib/hospital-data" // Deprecated in favor of hook
import { type Hospital } from "@/lib/hospital-data" // Keep type for now or refactor
import { createHospitalIcon, getDefaultIcon } from "@/components/ui/hospital-icon"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/data/demo-hospitals"

// Use custom hospital icon with fallback
let hospitalIcon
try {
    hospitalIcon = createHospitalIcon()
} catch (error) {
    console.warn("Failed to create custom hospital icon, using default:", error)
    hospitalIcon = getDefaultIcon()
}

export default function HospitalMap() {
    const { hospitals, loading } = useHospitals()
    const router = useRouter()



    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading hospitals map...</p>
                </div>
            </div>
        )
    }

    return (
        <MapContainer
            center={DEFAULT_MAP_CENTER}
            zoom={DEFAULT_MAP_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hospitals.map((hospital) => {
                // OpenStreetMap navigation URL (no API key required)
                const osmUrl = `https://www.openstreetmap.org/directions?to=${hospital.latitude},${hospital.longitude}`

                return (
                    <Marker
                        key={hospital.hospital_id}
                        position={[hospital.latitude, hospital.longitude]}
                        icon={hospitalIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-3 min-w-[280px] max-w-[320px]">
                                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
                                    {hospital.hospital_name}
                                </h3>

                                <div className="mb-3 flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {hospital.address}
                                    </p>
                                </div>

                                {hospital.email && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        {hospital.email}
                                    </p>
                                )}

                                <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Supported Blood Groups:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {hospital.blood_groups_supported.map((group) => (
                                            <Badge
                                                key={group}
                                                variant="destructive"
                                                className="text-xs px-2 py-0.5"
                                            >
                                                {group}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => router.push(`/donor/schedule/${hospital.hospital_id}`)}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Select Hospital
                                    </Button>

                                    <a
                                        href={osmUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full"
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full flex items-center justify-center gap-2"
                                        >
                                            <MapPin className="h-4 w-4" />
                                            Get Directions
                                        </Button>
                                    </a>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic border-t pt-2">
                                    Visit this location for blood checkup and donation.
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    )
}
