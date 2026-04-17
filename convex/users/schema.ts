import { defineTable } from "convex/server";
import { v } from "convex/values";

export const usersTable = defineTable({
  email: v.string(),
  displayName: v.string(),
  avatarColor: v.string(),
  tokenIdentifier: v.string(),
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_email", ["email"]);
