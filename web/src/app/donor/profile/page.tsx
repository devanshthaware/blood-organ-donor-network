"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDonorProfile } from "@/hooks/useUserProfile"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { BLOOD_GROUPS } from "@/lib/constants"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Building2, Calendar, CheckCircle2, Lock, ShieldAlert, ShieldCheck, User } from "lucide-react"

export default function DonorProfilePage() {
    const { user } = useAuth()
    const { profile, loading } = useDonorProfile()
    const verificationInfo = useQuery(api.donorVerification.getVerificationStatus, {})
    const updateDonorProfileMutation = useMutation(api.donors.updateDonorProfile)
    const updateUserMutation = useMutation(api.users.updateProfile)

    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bloodGroup: "",
        dateOfBirth: "",
        contactNumber: "",
        address: "",
        isActive: true,
    })

    const isVerified = verificationInfo?.verificationStatus === "VERIFIED" || profile?.verificationStatus === "VERIFIED"
    const verifiedBloodGroup = verificationInfo?.verifiedBloodGroup || profile?.verifiedBloodGroup

    useEffect(() => {
        if (profile && !isEditing) {
            setFormData({
                name: profile.fullName || profile.name || "",
                email: profile.email || user?.email || "",
                bloodGroup: profile.selfReportedBloodGroup || profile.bloodType || "O+",
                dateOfBirth: profile.dateOfBirth || "",
                contactNumber: profile.contactNumber || "",
                address: profile.address || "",
                isActive: profile.isActive !== false,
            })
        }
    }, [profile, user, isEditing])

    const handleSave = async () => {
        if (!user) return

        setSaving(true)
        try {
            await updateDonorProfileMutation({
                fullName: formData.name,
                address: formData.address,
                contactNumber: formData.contactNumber,
                dateOfBirth: formData.dateOfBirth,
                isActive: formData.isActive,
                // Only send selfReportedBloodGroup if not verified
                ...(isVerified ? {} : { selfReportedBloodGroup: formData.bloodGroup }),
            })

            await updateUserMutation({ fullName: formData.name })

            setIsEditing(false)
            alert("Profile updated successfully!")
        } catch (error: any) {
            console.error("Error updating profile:", error)
            alert(error.message || "Failed to update profile. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-muted-foreground">Loading donor profile...</div>
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Donor Profile</h1>
                    <p className="text-muted-foreground">Manage your identity details, medical contact data, and hospital verification.</p>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-500" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Your contact details and demographic information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Email Address</Label>
                            <Input value={formData.email} disabled className="bg-muted text-muted-foreground" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Contact Phone</Label>
                                <Input
                                    placeholder="+91 98765 43210"
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Residential Address / City</Label>
                            <Input
                                placeholder="Pune, Maharashtra"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Medical & Verification Information */}
                <div className="space-y-6">
                    <Card className="border-red-500/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-red-500" />
                                Blood Group & Clinical Verification
                            </CardTitle>
                            <CardDescription>Hospital-stamped medical parameters</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isVerified ? (
                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <Lock className="h-3.5 w-3.5" /> Official Verified Blood Group
                                        </span>
                                        <Badge className="bg-emerald-600 text-white text-xs">VERIFIED</Badge>
                                    </div>
                                    <div className="text-4xl font-bold font-mono text-emerald-500">
                                        {verifiedBloodGroup}
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-1 border-t border-emerald-500/20 space-y-0.5">
                                        <div>Verified by: <strong>{verificationInfo?.verifiedByHospitalName || "Registered Hospital"}</strong></div>
                                        <div>Date: {verificationInfo?.verifiedAt ? new Date(verificationInfo.verifiedAt).toLocaleDateString() : "Active Record"}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                                            <ShieldAlert className="h-3.5 w-3.5" /> Self-Reported Blood Group
                                        </span>
                                        <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-xs">UNVERIFIED</Badge>
                                    </div>

                                    {isEditing ? (
                                        <Select
                                            value={formData.bloodGroup}
                                            onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BLOOD_GROUPS.map((group) => (
                                                    <SelectItem key={group} value={group}>
                                                        {group}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-3xl font-bold font-mono text-amber-500">
                                            {formData.bloodGroup || "O+"}
                                        </div>
                                    )}

                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        ⚠️ This blood group is self-reported and cannot be used for critical clinical matching until confirmed by an authorized hospital during verification.
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Donor Network Availability</Label>
                                    <p className="text-xs text-muted-foreground">Receive emergency donation requests</p>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
