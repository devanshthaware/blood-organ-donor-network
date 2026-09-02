"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"

export interface CheckupRequest {
    id: string
    hospitalId: string
    hospitalName?: string
    status: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED"
    scheduledAt: Date
    requestedAt: Date
}

export function useCheckupRequests() {
    const { user } = useAuth()
    const [request, setRequest] = useState<CheckupRequest | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const q = query(
            collection(db, "checkup_requests"),
            where("donorId", "==", user.uid),
            where("status", "==", "REQUESTED"),
            orderBy("requestedAt", "desc")
        )

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                setRequest(null)
                setLoading(false)
                return
            }

            // Get the most recent request
            const docData = snapshot.docs[0].data()
            const hospitalId = docData.hospitalId

            // Fetch hospital name
            let hospitalName = "Unknown Hospital"
            try {
                const hospDoc = await getDoc(doc(db, "hospitals", hospitalId))
                if (hospDoc.exists()) {
                    hospitalName = hospDoc.data().name || "Unknown Hospital"
                }
            } catch (error) {
                console.error("Error fetching hospital name:", error)
            }

            setRequest({
                id: snapshot.docs[0].id,
                hospitalId: docData.hospitalId,
                hospitalName,
                status: docData.status,
                scheduledAt: docData.scheduledAt?.toDate(),
                requestedAt: docData.requestedAt?.toDate()
            } as CheckupRequest)

            setLoading(false)
        }, (error) => {
            console.error("Error fetching checkup requests:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    return { request, loading }
}
