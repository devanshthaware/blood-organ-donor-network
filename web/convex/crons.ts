import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

export const expireStaleReservations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const stale = await ctx.db
      .query("reservations")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "PENDING"),
          q.lt(q.field("createdAt"), oneHourAgo)
        )
      )
      .collect();

    for (const res of stale) {
      await ctx.db.patch(res._id, { status: "EXPIRED" });
    }

    return stale.length;
  },
});

// Run every hour to expire pending reservations older than 60 minutes
crons.interval(
  "expire-stale-reservations",
  { hours: 1 },
  internal.crons.expireStaleReservations
);

export default crons;
