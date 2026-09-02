"use client"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout role="admin">{children}</DashboardLayout>
        </ProtectedRoute>
    )
}
