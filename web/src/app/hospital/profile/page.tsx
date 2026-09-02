"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useHospitalProfile } from "@/hooks/useUserProfile"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { REGION_MIN, REGION_MAX } from "@/lib/constants"

export default function HospitalProfilePage() {
    const { user } = useAuth()
    const { profile, loading } = useHospitalProfile()
    const updateHospitalMutation = useMutation(api.hospitals.updateHospitalProfile)
    const updateUserMutation = useMutation(api.users.updateProfile)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        address: "",
        phoneNumber: "",
        region: 0,
    })

    // Initialize form data when profile loads
    useEffect(() => {
        if (profile && !isEditing) {
            setFormData({
                name: profile.name || "",
                email: profile.email || user?.email || "",
                address: profile.address || "",
                phoneNumber: profile.contactPhone || "",
                region: profile.region || 0,
            })
        }
    }, [profile, user, isEditing])

    const handleSave = async () => {
        if (!user || !profile) return

        setSaving(true)
        try {
            await updateHospitalMutation({
                name: formData.name,
                address: formData.address,
                contactPhone: formData.phoneNumber,
            })
            await updateUserMutation({
                fullName: formData.name,
                phoneNumber: formData.phoneNumber,
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
                    <h2 className="text-3xl font-bold tracking-tight">Hospital Profile</h2>
                    <p className="text-muted-foreground">Manage your hospital information</p>
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
                        <CardTitle>Hospital Information</CardTitle>
                        <CardDescription>Basic hospital details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Hospital Name</Label>
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
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                }
                                disabled={!isEditing}
                                placeholder="+1-XXX-XXX-XXXX"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Location & Region</CardTitle>
                        <CardDescription>Hospital location details</CardDescription>
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
                                placeholder="Enter hospital address"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="region">Region</Label>
                            <Input
                                id="region"
                                type="number"
                                value={formData.region}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        region: parseInt(e.target.value) || 0,
                                    })
                                }
                                disabled={!isEditing}
                                min={REGION_MIN.toString()}
                                max={REGION_MAX.toString()}
                            />
                            <p className="text-xs text-muted-foreground">
                                Region identifier ({REGION_MIN}-{REGION_MAX}) for ML matching
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
