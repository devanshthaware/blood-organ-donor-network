"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CalendarIcon, Clock, MapPin, Building2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCheckupRequests } from "@/hooks/useCheckupRequests"

interface PageProps {
    params: Promise<{
        hospitalId: string
    }>
}

interface HospitalData {
    name: string
    address: string | { full?: string, street?: string, city?: string, state?: string, pincode?: string }
    blood_groups_supported: string[]
    email?: string
    phoneNumber?: string
}

export default function SchedulePage({ params }: PageProps) {
    const router = useRouter()
    const { hospitalId } = use(params)
    const { request: pendingCheckup, loading: checkupLoading } = useCheckupRequests()

    const [hospital, setHospital] = useState<HospitalData | null>(null)
    const [loading, setLoading] = useState(true)
    const [bookingDate, setBookingDate] = useState("")
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        const fetchHospital = async () => {
            try {
                const docRef = doc(db, "hospitals", hospitalId)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists) {
                    setHospital(docSnap.data() as HospitalData)
                } else {
                    toast.error("Hospital not found")
                    router.push("/donor/map")
                }
            } catch (error) {
                console.error("Error fetching hospital:", error)
                toast.error("Failed to load hospital details")
            } finally {
                setLoading(false)
            }
        }

        if (hospitalId) {
            fetchHospital()
        }
    }, [hospitalId, router])

    const handleConfirmBooking = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bookingDate) {
            toast.error("Please select a date and time")
            return
        }

        setProcessing(true)
        try {
            const user = auth.currentUser
            if (!user) {
                toast.error("You must be logged in")
                router.push("/login")
                return
            }

            // Check if user already has a pending request
            const existingQ = query(
                collection(db, "checkup_requests"),
                where("donorId", "==", user.uid),
                where("status", "==", "REQUESTED")
            )
            const existingDocs = await getDocs(existingQ)

            if (!existingDocs.empty) {
                toast.error("You already have a pending checkup request")
                return
            }

            const scheduledAt = new Date(bookingDate)

            await addDoc(collection(db, "checkup_requests"), {
                donorId: user.uid,
                hospitalId: hospitalId,
                status: "REQUESTED",
                requestedAt: serverTimestamp(),
                scheduledAt: scheduledAt
            })

            toast.success("Checkup scheduled successfully!")
            router.push("/donor/dashboard") // Or redirect to a success/confirmation page
        } catch (error) {
            console.error("Error requesting checkup:", error)
            toast.error("Failed to submit request")
        } finally {
            setProcessing(false)
        }
    }

    if (loading || checkupLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        )
    }

    if (!hospital) return null

    // If there is already a pending checkup request, show that instead of the form
    if (pendingCheckup) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        className="mb-6 pl-0 hover:pl-2 transition-all"
                        onClick={() => router.push("/donor/map")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Map
                    </Button>

                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden text-center p-12">
                        <div className="h-20 w-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Checkup Requested!</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            You already have a pending checkup request at <span className="font-semibold text-foreground">{pendingCheckup.hospitalName}</span>.
                            Please wait for the hospital to verify your profile.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => router.push("/donor/dashboard")}
                            >
                                Go to Dashboard
                            </Button>
                            <Button
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                                onClick={() => router.push("/donor/map")}
                            >
                                Back to Map
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Helper to format address
    const getAddressString = (addr: any) => {
        if (typeof addr === "string") return addr
        if (typeof addr === "object") {
            if (addr.full) return addr.full
            return `${addr.street || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.pincode || ""}`.replace(/^, /, "").replace(/, $/, "")
        }
        return "Address not available"
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:pl-2 transition-all"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Map
                </Button>

                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Schedule Checkup
                                </h1>
                                <div className="flex items-center text-muted-foreground">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    <span className="font-medium">{hospital.name}</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                <CalendarIcon className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 grid gap-8 md:grid-cols-2">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-red-500" />
                                    Location
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {getAddressString(hospital.address)}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                    Supported Blood Groups
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {hospital.blood_groups_supported?.map((group) => (
                                        <Badge key={group} variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300">
                                            {group}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-xl p-6">
                            <form onSubmit={handleConfirmBooking} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="datetime" className="text-base font-semibold">Select Date & Time</Label>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Choose a convenient slot for your visit.
                                    </p>
                                    <div className="relative">
                                        <Input
                                            id="datetime"
                                            type="datetime-local"
                                            required
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="pl-10 h-12"
                                        />
                                        <Clock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-red-600 mt-2">
                                        * Please arrive 15 minutes before your scheduled time.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-700 h-12 text-lg font-medium"
                                    disabled={processing}
                                >
                                    {processing ? "Confirming..." : "Confirm Booking"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
