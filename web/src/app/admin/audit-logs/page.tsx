"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useAuditLogs } from "@/hooks/useAuditLogs"
import { Badge } from "@/components/ui/badge"

export default function AdminAuditLogsPage() {
    const { auditLogs, loading, error } = useAuditLogs(100);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Security Audit Logs</h2>
                </div>
                <div className="rounded-md border p-4">
                    <p className="text-muted-foreground">Loading audit logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Security Audit Logs</h2>
                </div>
                <div className="rounded-md border p-4">
                    <p className="text-red-500">Error loading audit logs: {error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight">Security Audit Logs</h2>
                    <Badge variant="outline" className="border-green-500 text-green-500 animate-pulse bg-green-500/10">
                        ● Live Sync
                    </Badge>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {auditLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            auditLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.userEmail || log.userId}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {log.resourceType}/{log.resourceId.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                log.result === "SUCCESS"
                                                    ? "default"
                                                    : log.result === "FAILURE"
                                                        ? "outline"
                                                        : "destructive"
                                            }
                                            className={
                                                log.result === "SUCCESS"
                                                    ? "bg-green-500 hover:bg-green-600"
                                                    : log.result === "ERROR"
                                                        ? "bg-red-500 hover:bg-red-600"
                                                        : ""
                                            }
                                        >
                                            {log.result}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {log.timestamp instanceof Date
                                            ? log.timestamp.toLocaleString()
                                            : new Date(log.timestamp as any).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
