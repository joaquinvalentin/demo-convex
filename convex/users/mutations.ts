import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (!user || user.password !== password) {
      return { success: false, error: "Invalid credentials" };
    }

    return { success: true, userId: user._id, displayName: user.displayName };
  },
});
