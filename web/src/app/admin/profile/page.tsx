"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminProfilePage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    })

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid))
                if (userDoc.exists) {
                    const data = userDoc.data()
                    setProfile(data)
                    setFormData({
                        name: data.name || "",
                        email: data.email || user.email || "",
                    })
                }
            } catch (error) {
                console.error("Error loading profile:", error)
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [user])

    const handleSave = async () => {
        if (!user) return

        setSaving(true)
        try {
            const userRef = doc(db, "users", user.uid)
            await updateDoc(userRef, {
                name: formData.name,
            })

            setIsEditing(false)
            setProfile({ ...profile, name: formData.name })
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
                    <h2 className="text-3xl font-bold tracking-tight">Admin Profile</h2>
                    <p className="text-muted-foreground">Manage your administrator account</p>
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
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>Your administrator account details</CardDescription>
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
                            <Label htmlFor="role">Role</Label>
                            <Input
                                id="role"
                                value="Administrator"
                                disabled
                                className="bg-muted"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>Additional account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">User ID</p>
                            <p className="text-sm font-mono">{user?.uid}</p>
                        </div>
                        {profile?.createdAt && (
                            <div>
                                <p className="text-sm text-muted-foreground">Account Created</p>
                                <p className="text-sm">
                                    {profile.createdAt.toDate
                                        ? profile.createdAt.toDate().toLocaleDateString()
                                        : new Date(profile.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
