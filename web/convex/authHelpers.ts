import { QueryCtx, MutationCtx } from "./_generated/server";

export async function getUserIdentity(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated: User must be signed in.");
  }

  // Find user by Clerk subject/ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .first();

  return {
    clerkId: identity.subject,
    email: identity.email || user?.email || "user@veinlink.org",
    role: user?.role || "donor",
    identity,
    user,
  };
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: ("donor" | "hospital" | "admin")[]
) {
  const result = await requireUser(ctx);
  if (!result.user || !allowedRoles.includes(result.user.role)) {
    throw new Error(
      `Unauthorized: Caller role (${result.user?.role || "unknown"}) is not permitted for this operation.`
    );
  }
  return result;
}
