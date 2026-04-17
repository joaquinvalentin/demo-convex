import { mutation } from "../_generated/server";
import { v } from "convex/values";

const AVATAR_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export const storeUser = mutation({
  args: { displayName: v.optional(v.string()) },
  handler: async (ctx, { displayName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) return existing._id;

    const autoColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const autoName = displayName ?? identity.name ?? identity.email?.split("@")[0] ?? "User";

    return await ctx.db.insert("users", {
      email: identity.email ?? "",
      displayName: autoName,
      avatarColor: autoColor,
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});
