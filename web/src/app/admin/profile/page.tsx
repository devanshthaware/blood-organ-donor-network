"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"

export default function AdminProfilePage() {
    const { user } = useAuth()
    const currentUser = useQuery(api.users.getCurrentUser, {})
    const updateProfileMutation = useMutation(api.users.updateProfile)

    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    })

    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.fullName || "Admin User",
                email: currentUser.email || user?.email || "",
            })
        }
    }, [currentUser, user])

    const handleSave = async () => {
        if (!user) return

        setSaving(true)
        try {
            await updateProfileMutation({
                fullName: formData.name,
            })

            setIsEditing(false)
            alert("Profile updated successfully!")
        } catch (error) {
            console.error("Error updating profile:", error)
            alert("Failed to update profile.")
        } finally {
            setSaving(false)
        }
    }

    const loading = currentUser === undefined

    return (
        <div className="space-y-6 max-w-4xl p-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Admin Profile</h2>
                <p className="text-muted-foreground">Manage your administrator profile details.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>System access and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={!isEditing || loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            value={formData.email}
                            disabled={true}
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        {isEditing ? (
                            <>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
