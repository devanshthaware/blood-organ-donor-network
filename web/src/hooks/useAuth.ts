"use client";

import { useUser } from "@clerk/nextjs";

export interface AuthUser {
  uid: string;
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export function useAuth() {
  const { user, isLoaded } = useUser();

  const authUser: AuthUser | null = user
    ? {
        uid: user.id,
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        displayName: user.fullName || user.username || "",
        photoURL: user.imageUrl,
      }
    : null;

  return {
    user: authUser,
    loading: !isLoaded,
    isAuthenticated: !!user,
  };
}
export default useAuth;
