"use client"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function DonorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute allowedRoles={["donor"]}>
            <DashboardLayout role="donor">{children}</DashboardLayout>
        </ProtectedRoute>
    )
}
