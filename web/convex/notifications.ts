import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserIdentity } from "./authHelpers";

export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return { notifications: [], unreadCount: 0 };
    }

    const limit = args.limit || 50;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", identity.subject).eq("isRead", false))
      .collect();

    return {
      notifications,
      unreadCount: unread.length,
    };
  },
});

export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const notif = await ctx.db.get(args.notificationId);
    if (!notif) return false;

    if (notif.userId !== identity.subject) {
      throw new Error("Unauthorized to access this notification.");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
    return true;
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", identity.subject).eq("isRead", false))
      .collect();

    for (const notif of unread) {
      await ctx.db.patch(notif._id, { isRead: true });
    }

    return unread.length;
  },
});

export const sendNotification = mutation({
  args: {
    userId: v.string(),
    userRole: v.optional(v.union(v.literal("donor"), v.literal("hospital"), v.literal("admin"))),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
