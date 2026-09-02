"use client";

import React, { ReactNode, useEffect } from "react";
import { ConvexReactClient, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { api } from "../../../convex/_generated/api";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexReactClient(convexUrl);

function ConvexUserSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const syncUserMutation = useMutation(api.users.syncUser);
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      let role: "donor" | "hospital" | "admin" = "donor";
      if (pathname.startsWith("/hospital")) {
        role = "hospital";
      } else if (pathname.startsWith("/admin")) {
        role = "admin";
      }

      syncUserMutation({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || `${user.id}@veinlink.internal`,
        fullName: user.fullName || user.username || "VeinLink User",
        role,
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || undefined,
      }).catch((e) => console.debug("Convex user sync status:", e));
    }
  }, [isLoaded, isSignedIn, user?.id, pathname]);

  return null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_Z29yZ2VvdXMtcmF0dGxlci05NTQ0LmNsZXJrLmFjY291bnRzLmRldiQ";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ConvexUserSync />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
export default ConvexClientProvider;
