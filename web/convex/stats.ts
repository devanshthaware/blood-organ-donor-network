import { query } from "./_generated/server";

export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const requests = await ctx.db.query("donationRequests").collect();
    const aiEvents = await ctx.db.query("aiEvents").collect();
    const auditLogs = await ctx.db.query("auditLogs").collect();

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const securityIncidents = auditLogs.filter(
      (l) => l.result === "ERROR" && l.timestamp >= oneDayAgo
    ).length;

    const totalOps = auditLogs.length;
    const successfulOps = auditLogs.filter((l) => l.result === "SUCCESS").length;
    const systemUptime = totalOps > 0 ? Math.round((successfulOps / totalOps) * 1000) / 10 : 99.9;

    return {
      totalUsers: users.length,
      activeUsers: users.length,
      totalRequests: requests.length,
      totalMLInferences: aiEvents.length,
      securityIncidents,
      systemUptime,
    };
  },
});
