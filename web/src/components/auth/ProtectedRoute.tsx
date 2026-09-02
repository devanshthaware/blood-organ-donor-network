"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("donor" | "hospital" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && currentUser) {
      const role = currentUser.role;

      if (!allowedRoles.includes(role)) {
        if (role === "hospital") {
          router.push("/hospital/dashboard");
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/donor/dashboard");
        }
      }
    }
  }, [user, authLoading, currentUser, router, allowedRoles]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
export default ProtectedRoute;
