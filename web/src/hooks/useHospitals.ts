import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Hospital {
    hospital_id: string
    hospital_name: string
    address: string
    latitude: number
    longitude: number
    blood_groups_supported: string[]
    email?: string
    phone_number?: string
    region?: number
}

export function useHospitals() {
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Real-time listener for APPROVED hospitals
        // We removed 'isActive' check to ensure newly approved hospitals show up immediately
        const q = query(
            collection(db, "hospitals"),
            where("approvalStatus", "==", "APPROVED")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                console.log("No hospitals found in Firestore")
                // Return empty array - no demo data fallback
                setHospitals([])
                setLoading(false)
                return
            }

            const hospitalList: Hospital[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()

                // Location extraction with fallback
                let latitude: number = 0
                let longitude: number = 0

                if (data.location?.latitude && data.location?.longitude) {
                    latitude = data.location.latitude
                    longitude = data.location.longitude
                } else if (data.lat && data.lng) {
                    latitude = data.lat
                    longitude = data.lng
                } else {
                    return // Skip invalid location
                }

                // Address extraction
                let address = "Address not available"
                if (typeof data.address === "string") {
                    address = data.address
                } else if (typeof data.address === "object" && data.address) {
                    const addr = data.address
                    if (addr.full) {
                        address = addr.full
                    } else if (addr.street && addr.city) {
                        address = `${addr.street}, ${addr.city}, ${addr.state || ""} ${addr.pincode || ""}`.trim()
                    }
                }

                hospitalList.push({
                    hospital_id: doc.id,
                    hospital_name: data.name || "Unknown Hospital",
                    address,
                    latitude,
                    longitude,
                    blood_groups_supported: data.blood_groups_supported || ["O+", "A+", "B+", "AB+"],
                    email: data.email,
                    phone_number: data.phoneNumber,
                    region: data.region || 0,
                })
            })

            setHospitals(hospitalList)
            setLoading(false)
        }, (error) => {
            console.error("Error fetching hospitals:", error)
            // Return empty array on error - no demo data fallback
            setHospitals([])
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return { hospitals, loading }
}
