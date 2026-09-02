"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    CheckCircle2,
    Clock,
    EyeOff,
    FileLock2,
    Fingerprint,
    Key,
    Lock,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Slash,
    UserCheck,
    UserX,
    Users,
    Zap,
} from "lucide-react"

export default function SecurityMonitorPage() {
    const [activeTab, setActiveTab] = useState("events")
    const [isSimulating, setIsSimulating] = useState(false)

    // Convex queries
    const events = useQuery((api as any).governance?.securityService?.getAllSecurityEvents, { limit: 50 }) || []
    const metrics = useQuery((api as any).governance?.securityService?.getSecurityMetrics, {}) || {
        totalSecurityEvents: 0,
        accessDenials: 0,
        authFailures: 0,
        rateLimitViolations: 0,
        activeSuspensions: 0,
        criticalIncidents: 0,
    }

    const users = useQuery((api as any).users?.getUsers, {}) || []

    // Mutations
    const suspendMutation = useMutation((api as any).governance?.securityService?.suspendAccount)
    const restoreMutation = useMutation((api as any).governance?.securityService?.restoreAccount)

    const handleSuspend = async (userId: any) => {
        const reason = prompt("Enter justification for administrative account suspension:")
        if (!reason) return
        try {
            await suspendMutation({ userId, reason })
            alert("Account has been suspended.")
        } catch (err: any) {
            alert(err?.message || "Failed to suspend account.")
        }
    }

    const handleRestore = async (userId: any) => {
        if (!confirm("Are you sure you want to restore this account to ACTIVE?")) return
        try {
            await restoreMutation({ userId })
            alert("Account restored to ACTIVE status.")
        } catch (err: any) {
            alert(err?.message || "Failed to restore account.")
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-7 w-7 text-red-500" />
                    <h2 className="text-3xl font-bold tracking-tight">Security & Governance Operations</h2>
                </div>
                <p className="text-muted-foreground mt-1">
                    Real-time zero-trust access control, privilege escalation alarms, rate limit monitoring, and account governance.
                </p>
            </div>

            {/* Security KPI Metrics */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Access Denials</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{metrics.accessDenials}</div>
                        <p className="text-xs text-muted-foreground">Blocked unauthorized actions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Auth Failures</CardTitle>
                        <Key className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{metrics.authFailures}</div>
                        <p className="text-xs text-muted-foreground">Unauthenticated request attempts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Rate Limit Violations</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{metrics.rateLimitViolations}</div>
                        <p className="text-xs text-muted-foreground">Sliding-window abuse blocked</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Suspended Accounts</CardTitle>
                        <UserX className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">{metrics.activeSuspensions}</div>
                        <p className="text-xs text-muted-foreground">Active security lockouts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Critical Incidents</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">{metrics.criticalIncidents}</div>
                        <p className="text-xs text-muted-foreground">Requiring senior review</p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full max-w-2xl">
                    <TabsTrigger value="events" className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4" />
                        <span>Security Event Stream</span>
                    </TabsTrigger>
                    <TabsTrigger value="accounts" className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>Account Governance</span>
                    </TabsTrigger>
                    <TabsTrigger value="policies" className="flex items-center gap-1.5">
                        <FileLock2 className="h-4 w-4 text-emerald-500" />
                        <span>Zero-Trust Policies</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Live Security Events Stream */}
                <TabsContent value="events" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Real-Time Security Event Stream</CardTitle>
                            <CardDescription>
                                Immutable log of authentication infractions, facility isolation breaches, privilege escalation attempts, and consent revocations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Actor</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead className="text-right">Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Zero active security violations recorded. Zero-trust boundary is secure.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        events.map((ev: any) => (
                                            <TableRow key={ev._id}>
                                                <TableCell className="font-mono text-xs font-semibold">{ev.eventId}</TableCell>
                                                <TableCell className="text-xs font-semibold">{ev.eventType}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            ev.severity === "CRITICAL"
                                                                ? "destructive"
                                                                : ev.severity === "HIGH"
                                                                ? "destructive"
                                                                : ev.severity === "MEDIUM"
                                                                ? "secondary"
                                                                : "outline"
                                                        }
                                                    >
                                                        {ev.severity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">
                                                    {ev.actorId ? `${ev.actorId.substring(0, 10)}... (${ev.actorRole || "user"})` : "anonymous"}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-md truncate text-muted-foreground">
                                                    {ev.reason}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {new Date(ev.timestamp).toLocaleTimeString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Account Governance & Suspension Controls */}
                <TabsContent value="accounts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Access Governance</CardTitle>
                            <CardDescription>
                                Administrative controls to inspect account standing, enforce emergency lockouts, and manage facility assignments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User / Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Facility</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No users registered.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((u: any) => (
                                            <TableRow key={u._id}>
                                                <TableCell>
                                                    <div className="font-semibold text-xs">{u.name || "Unnamed"}</div>
                                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {u.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">
                                                    {u.facilityId || "Global / Unassigned"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            u.status === "SUSPENDED"
                                                                ? "bg-red-600 text-white"
                                                                : "bg-emerald-600 text-white"
                                                        }
                                                    >
                                                        {u.status || "ACTIVE"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {u.status === "SUSPENDED" ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                                                            onClick={() => handleRestore(u._id)}
                                                        >
                                                            <UserCheck className="h-3.5 w-3.5 mr-1" /> Restore
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-7 text-xs"
                                                            onClick={() => handleSuspend(u._id)}
                                                        >
                                                            <UserX className="h-3.5 w-3.5 mr-1" /> Suspend
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Zero-Trust Policies Reference */}
                <TabsContent value="policies" className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Facility Scoping
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground space-y-2">
                                <p>
                                    Hospital coordinators can only view and manage patient requests belonging strictly to their assigned `facilityId`.
                                </p>
                                <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                                    STRICTLY ENFORCED
                                </Badge>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-blue-500" /> Donor Self-Access
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground space-y-2">
                                <p>
                                    Donors are mathematically barred from accessing peer donor profiles or other patients' clinical histories.
                                </p>
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    RESOURCE OWNERSHIP
                                </Badge>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <EyeOff className="h-4 w-4 text-purple-500" /> ML PII Allowlist
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground space-y-2">
                                <p>
                                    All feature vectors strip names, phone numbers, and emails. Coordinates are tokenized into derived distance kilometers.
                                </p>
                                <Badge variant="outline" className="text-purple-600 border-purple-600">
                                    ZERO RAW PHI TO ML
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
