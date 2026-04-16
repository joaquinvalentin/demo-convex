import { defineTable } from "convex/server";
import { v } from "convex/values";

export const tasksTable = defineTable({
  title: v.string(),
  description: v.string(),
  columnId: v.id("columns"),
  assigneeId: v.optional(v.id("users")),
  createdBy: v.id("users"),
  order: v.number(),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  createdAt: v.number(),
})
  .index("by_column", ["columnId"])
  .index("by_assignee", ["assigneeId"]);
