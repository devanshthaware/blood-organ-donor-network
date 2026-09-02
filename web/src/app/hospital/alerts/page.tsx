"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, FileText, Plus } from "lucide-react"
import { useAlerts } from "@/hooks/useAlerts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { BLOOD_GROUPS } from "@/lib/constants"

export default function HospitalAlertsPage() {
    const { alerts, loading } = useAlerts()
    const createAlertMutation = useMutation(api.alerts.createAlert)
    const [isOpen, setIsOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        area: "",
        bloodGroup: "",
        shortageRisk: "HIGH",
        region: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await createAlertMutation({
                type: "SHORTAGE",
                severity: (formData.shortageRisk as any) || "HIGH",
                title: `Emergency Shortage: ${formData.bloodGroup}`,
                message: `Shortage detected in ${formData.area || "regional center"}. Immediate donor replenishment requested.`,
                bloodType: formData.bloodGroup,
            })

            setIsOpen(false)
            setFormData({ area: "", bloodGroup: "", shortageRisk: "HIGH", region: "" })
            alert("Emergency shortage alert created successfully")
        } catch (error: any) {
            console.error("Error creating shortage alert:", error)
            alert(error?.message || "An unexpected error occurred. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="p-4">Loading alerts...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">System Alerts & AI Insights</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Report Shortage
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Report Emergency Shortage</DialogTitle>
                            <DialogDescription>
                                Report a blood shortage in your area. This will trigger AI predictions and alerts.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="area" className="text-right">
                                    Area
                                </Label>
                                <Input
                                    id="area"
                                    className="col-span-3"
                                    placeholder="e.g., Pune East, Mumbai Central"
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="bloodGroup" className="text-right">
                                    Blood Type
                                </Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, bloodGroup: val })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select blood type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOOD_GROUPS.map((bg) => (
                                            <SelectItem key={bg} value={bg}>
                                                {bg}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="shortageRisk" className="text-right">
                                    Risk Level
                                </Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, shortageRisk: val })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select risk level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HIGH">HIGH</SelectItem>
                                        <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="region" className="text-right">
                                    Region (Optional)
                                </Label>
                                <Input
                                    id="region"
                                    type="number"
                                    className="col-span-3"
                                    placeholder="Region ID (0-100)"
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Creating..." : "Create Alert"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid gap-4">
                {alerts.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">No alerts at this time.</p>
                        </CardContent>
                    </Card>
                ) : (
                    alerts.map((alert) => (
                        <Card
                            key={alert.id}
                            className={
                                alert.severity === "CRITICAL" || alert.severity === "HIGH"
                                    ? "border-red-500/50"
                                    : ""
                            }
                        >
                            <CardHeader className="flex flex-row items-center gap-4">
                                {alert.severity === "CRITICAL" || alert.severity === "HIGH" ? (
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                ) : (
                                    <FileText className="h-8 w-8 text-blue-500" />
                                )}
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle>{alert.title}</CardTitle>
                                        <Badge variant={alert.severity === "CRITICAL" ? "destructive" : "secondary"}>
                                            {alert.severity}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {alert.area && <span className="font-semibold">Area: {alert.area}</span>}
                                            {alert.region !== undefined && (
                                                <span className="text-muted-foreground">Region {alert.region}</span>
                                            )}
                                            {alert.confidence !== undefined && (
                                                <Badge variant="outline" className="text-xs">
                                                    AI Confidence: {(alert.confidence * 100).toFixed(0)}%
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-2">{alert.message}</p>
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                                <CardContent>
                                    <p className="text-sm font-semibold mb-2">Actions Triggered Automatically:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {alert.recommendedActions.map((action, idx) => (
                                            <li key={idx}>✓ {action}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
