"use client"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function HospitalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute allowedRoles={["hospital"]}>
            <DashboardLayout role="hospital">{children}</DashboardLayout>
        </ProtectedRoute>
    )
}
