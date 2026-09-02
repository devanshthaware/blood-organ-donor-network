/**
 * Hospital Data Access Layer
 * 
 * Abstract data access to allow switching between demo data and Firestore
 * 
 * Usage:
 * - In demo/development: Uses static demo data
 * - In production: Can switch to Firestore queries
 * 
 * This abstraction makes it easy to replace with Firestore later
 */

import { collection, query, where, getDocs } from "firebase/firestore"
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

/**
 * Get all hospitals
 * 
 * In demo mode: Returns static demo data
 * In production: Fetches from Firestore (when USE_DEMO_DATA = false)
 */
export async function getHospitals(): Promise<Hospital[]> {
  // Always try to fetch from Firestore first (Production-first approach)
  // This ensures that if data exists in the DB, it is shown.

  try {
    // We only show APPROVED and ACTIVE hospitals on the map
    // Note: If you want to show ALL approved hospitals regardless of active status (e.g. for discovery),
    // you can remove the isActive check. But generally, only active hospitals should be discoverable.
    const q = query(
      collection(db, "hospitals"),
      where("approvalStatus", "==", "APPROVED"),
      where("isActive", "==", true)
    )

    // Set a timeout to avoid hanging if Firestore is unreachable/slow
    // This allows the demo data fallback to kick in quickly for a better UX
    const timeoutPromise: Promise<never> = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore timeout")), 5000)
    )

    const snapshotPromise = getDocs(q)
    const querySnapshot = await Promise.race([snapshotPromise, timeoutPromise])

    // If no hospitals found in DB, return empty array (no demo data fallback)
    if (querySnapshot.empty) {
      console.log("No hospitals found in Firestore")
      return []
    }

    const hospitals: Hospital[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()

      // Extract location coordinates with safe fallbacks
      let latitude: number = 0
      let longitude: number = 0

      if (data.location?.latitude && data.location?.longitude) {
        latitude = data.location.latitude
        longitude = data.location.longitude
      } else if (data.lat && data.lng) {
        // Legacy field support
        latitude = data.lat
        longitude = data.lng
      } else {
        // Skip hospitals without valid location
        return
      }

      // Extract address
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

      // Extract blood groups (default to all if not specified)
      const bloodGroups = data.blood_groups_supported ||
        ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]

      hospitals.push({
        hospital_id: doc.id,
        hospital_name: data.name || "Unknown Hospital",
        address,
        latitude,
        longitude,
        blood_groups_supported: Array.isArray(bloodGroups) ? bloodGroups : ["O+", "A+", "B+", "AB+"],
        email: data.email,
        phone_number: data.phoneNumber,
        region: data.region || 0,
        // Calculate distance from center if needed, or other metadata
      })
    })

    return hospitals
  } catch (error) {
    console.error("Error fetching hospitals from Firestore:", error)
    // Return empty array on error - no demo data fallback
    return []
  }
}

