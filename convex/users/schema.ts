import { defineTable } from "convex/server";
import { v } from "convex/values";

export const usersTable = defineTable({
  username: v.string(),
  password: v.string(),
  displayName: v.string(),
  avatarColor: v.string(),
}).index("by_username", ["username"]);
