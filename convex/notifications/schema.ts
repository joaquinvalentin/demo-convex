import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notificationsTable = defineTable({
  userId: v.id("users"),
  message: v.string(),
  taskId: v.id("tasks"),
  read: v.boolean(),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_unread", ["userId", "read"]);
