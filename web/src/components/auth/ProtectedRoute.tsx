"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("donor" | "hospital" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Check user role if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
      const checkRole = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role;

            if (!allowedRoles.includes(role)) {
              // Redirect based on role
              if (role === "hospital") {
                router.push("/hospital/dashboard");
              } else if (role === "admin") {
                router.push("/admin/dashboard");
              } else {
                router.push("/donor/dashboard");
              }
              return;
            }

            // If role is hospital, check approval status
            if (role === "hospital") {
              const hospitalDoc = await getDoc(doc(db, "hospitals", user.uid));
              if (hospitalDoc.exists()) {
                const status = hospitalDoc.data().approvalStatus;
                if (status !== "APPROVED") {
                  router.push("/login");
                  return;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error checking role:", error);
        }
      };
      checkRole();
    }
  }, [user, authLoading, router, allowedRoles]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
