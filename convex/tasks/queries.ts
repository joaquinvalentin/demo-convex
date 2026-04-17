import { query } from "../_generated/server";
import { v } from "convex/values";

export const listByColumn = query({
  args: { columnId: v.id("columns"), limit: v.optional(v.number()) },
  handler: async (ctx, { columnId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", columnId))
      .collect();
  },
});
