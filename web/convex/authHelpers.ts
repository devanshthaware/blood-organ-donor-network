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
    role: (user?.role || "donor") as "donor" | "hospital" | "admin",
    facilityId: user?.facilityId,
    status: user?.status || "ACTIVE",
    identity,
    user,
  };
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: ("donor" | "hospital" | "admin")[]
) {
  const result = await requireUser(ctx);
  if (!result.user || !allowedRoles.includes(result.role)) {
    // Log security violation if mutation context
    await logSecurityViolation(ctx, {
      eventType: "ACCESS_DENIED",
      reason: `Unauthorized: Role '${result.role}' attempted privileged action requiring [${allowedRoles.join(", ")}]`,
      severity: "MEDIUM",
      actorId: result.clerkId,
      actorRole: result.role,
      resourceType: "role_guard",
    });

    throw new Error(
      `Unauthorized: Caller role (${result.role}) is not permitted for this operation.`
    );
  }

  return {
    ...result,
    user: result.user!,
  };
}

/**
 * Enforces Resource-Level Ownership: Donors may only access their own records.
 */
export async function requireResourceOwnership(
  ctx: QueryCtx | MutationCtx,
  targetOwnerId: string
) {
  const result = await requireUser(ctx);
  if (result.role === "admin") return result;

  if (result.clerkId !== targetOwnerId && result.user?._id !== targetOwnerId) {
    await logSecurityViolation(ctx, {
      eventType: "PRIVILEGE_ESCALATION_ATTEMPT",
      reason: `Ownership Violation: User '${result.clerkId}' attempted unauthorized access to resource owned by '${targetOwnerId}'`,
      severity: "HIGH",
      actorId: result.clerkId,
      actorRole: result.role,
      resourceType: "user_resource",
      resourceId: targetOwnerId,
    });

    throw new Error("Forbidden: You do not own this resource.");
  }

  return result;
}

/**
 * Enforces Facility Scope: Hospital staff may only access requisitions/inventory for their assigned facility.
 */
export async function requireFacilityScope(
  ctx: QueryCtx | MutationCtx,
  targetFacilityId: string
) {
  const result = await requireUser(ctx);
  if (result.role === "admin") return result;

  if (result.role !== "hospital") {
    throw new Error("Unauthorized: Only hospital coordinators have facility access.");
  }

  if (result.facilityId !== targetFacilityId) {
    await logSecurityViolation(ctx, {
      eventType: "ACCESS_DENIED",
      reason: `Facility Scope Violation: Coordinator from facility '${result.facilityId}' attempted access to facility '${targetFacilityId}'`,
      severity: "HIGH",
      actorId: result.clerkId,
      actorRole: result.role,
      facilityId: targetFacilityId,
      resourceType: "facility_scope",
    });

    throw new Error("Forbidden: Cross-facility resource access is strictly prohibited.");
  }

  return result;
}

/**
 * Purpose-Based Access Validation: Verifies that active consent exists for sensitive operations.
 */
export async function requirePurposeConsent(
  ctx: QueryCtx | MutationCtx,
  donorId: string,
  purpose: "DONATION" | "EMERGENCY_CONTACT" | "LOCATION_PROCESSING" | "AI_PROCESSING" | "COMMUNICATION" | "RESEARCH"
) {
  const consent = await ctx.db
    .query("consentRecords")
    .withIndex("by_donorId", (q) => q.eq("donorId", donorId))
    .filter((q) => q.eq(q.field("purpose"), purpose))
    .order("desc")
    .first();

  if (!consent || consent.status !== "GRANTED") {
    await logSecurityViolation(ctx, {
      eventType: "ACCESS_DENIED",
      reason: `Consent Block: Purpose '${purpose}' has status '${consent?.status || "NO_CONSENT"}' for donor '${donorId}'`,
      severity: "MEDIUM",
      resourceType: "donor_consent",
      resourceId: donorId,
    });

    throw new Error(`Forbidden: Active consent for purpose '${purpose}' is required.`);
  }

  return consent;
}

/**
 * Internal Security Logger helper
 */
async function logSecurityViolation(
  ctx: QueryCtx | MutationCtx,
  details: {
    eventType: any;
    reason: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    actorId?: string;
    actorRole?: string;
    resourceType: string;
    resourceId?: string;
    facilityId?: string;
  }
) {
  // Only mutation contexts can write to the database
  if ("insert" in ctx.db) {
    const db = ctx.db as any;
    const now = Date.now();
    const eventId = `SEC-${now}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      await db.insert("securityEvents", {
        eventId,
        ...details,
        timestamp: now,
      });

      await db.insert("auditLogs", {
        userId: details.actorId || "system:anonymous",
        userEmail: "security-monitor@veinlink.org",
        action: details.eventType,
        resourceType: details.resourceType,
        resourceId: details.resourceId || "global",
        ipAddress: "gateway",
        result: "FAILURE",
        details: { reason: details.reason, severity: details.severity },
        timestamp: now,
      });
    } catch {
      // Best-effort logging
    }
  }
}
