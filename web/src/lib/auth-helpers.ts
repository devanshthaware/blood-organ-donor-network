"use client";

export async function getAuthToken(_forceRefresh: boolean = true): Promise<string | null> {
  return "clerk-authenticated-token";
}
