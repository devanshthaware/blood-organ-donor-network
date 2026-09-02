"use client";

import { auth } from "@/lib/firebase";

export async function getAuthToken(forceRefresh: boolean = true): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  // Force refresh to ensure we get a valid, non-expired token
  return await user.getIdToken(forceRefresh);
}
