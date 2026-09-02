"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useDonorProfile } from "@/hooks/useUserProfile"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BLOOD_GROUPS } from "@/lib/constants"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function DonorProfilePage() {
    const { user } = useAuth()
    const { profile, loading } = useDonorProfile()
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bloodGroup: "",
        address: "",
        isActive: true,
    })

    // Initialize form data when profile loads
    useEffect(() => {
        if (profile && !isEditing) {
            setFormData({
                name: profile.name || "",
                email: profile.email || user?.email || "",
                bloodGroup: profile.bloodType || "",
                address: profile.address || "",
                isActive: profile.isActive !== false,
            })
        }
    }, [profile, user, isEditing])

    const handleSave = async () => {
        if (!user || !profile) return

        setSaving(true)
        try {
            const donorRef = doc(db, "donors", user.uid)
            // CRITICAL: Do NOT update bloodType, donorStatus, etc.
            // These are restricted by Firestore Rules.
            await updateDoc(donorRef, {
                name: formData.name,
                address: formData.address,
                isActive: formData.isActive,
            })

            // Also update user collection
            const userRef = doc(db, "users", user.uid)
            await updateDoc(userRef, {
                name: formData.name,
            })

            setIsEditing(false)
            alert("Profile updated successfully!")
        } catch (error) {
            console.error("Error updating profile:", error)
            alert("Failed to update profile. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-4">Loading profile...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                    <p className="text-muted-foreground">Manage your donor profile information</p>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your basic profile details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bloodType">Blood Type</Label>
                            <Input
                                id="bloodType"
                                value={profile?.bloodType || "Verification Required"}
                                disabled
                                className="bg-muted font-medium"
                            />
                            <p className="text-xs text-muted-foreground">
                                Blood type is verified by hospital and cannot be changed.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Location & Status</CardTitle>
                        <CardDescription>Your address and availability</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                                disabled={!isEditing}
                                placeholder="Enter your address"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive">Active Status</Label>
                                <p className="text-sm text-muted-foreground">
                                    Set your availability for donations
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isActive: checked })
                                }
                                disabled={!isEditing}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Donation Statistics</CardTitle>
                        <CardDescription>Your donation history and metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Donations</p>
                                <p className="text-2xl font-bold">{profile?.totalDonations || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold">
                                    {profile?.completedDonations || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Last Donation</p>
                                <p className="text-2xl font-bold">
                                    {profile?.lastDonationDate
                                        ? new Date(profile.lastDonationDate).toLocaleDateString()
                                        : "Never"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
