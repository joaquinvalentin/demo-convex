import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    columnId: v.id("columns"),
    assigneeId: v.optional(v.id("users")),
    createdBy: v.id("users"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      order: existingTasks.length,
      createdAt: Date.now(),
    });

    // Notify assignee if assigned to someone else
    if (args.assigneeId && args.assigneeId !== args.createdBy) {
      const creator = await ctx.db.get(args.createdBy);
      await ctx.db.insert("notifications", {
        userId: args.assigneeId,
        message: `${creator?.displayName ?? "Someone"} assigned you to "${args.title}"`,
        taskId,
        read: false,
        createdAt: Date.now(),
      });
    }

    return taskId;
  },
});

export const moveToColumn = mutation({
  args: {
    taskId: v.id("tasks"),
    columnId: v.id("columns"),
    movedBy: v.id("users"),
  },
  handler: async (ctx, { taskId, columnId, movedBy }) => {
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    const targetTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", columnId))
      .collect();

    await ctx.db.patch(taskId, {
      columnId,
      order: targetTasks.length,
    });

    // Notify assignee about the move
    if (task.assigneeId && task.assigneeId !== movedBy) {
      const mover = await ctx.db.get(movedBy);
      const column = await ctx.db.get(columnId);
      await ctx.db.insert("notifications", {
        userId: task.assigneeId,
        message: `${mover?.displayName ?? "Someone"} moved "${task.title}" to ${column?.title ?? "another column"}`,
        taskId,
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const assign = mutation({
  args: {
    taskId: v.id("tasks"),
    assigneeId: v.optional(v.id("users")),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, { taskId, assigneeId, assignedBy }) => {
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(taskId, { assigneeId });

    // Notify the new assignee
    if (assigneeId && assigneeId !== assignedBy) {
      const assigner = await ctx.db.get(assignedBy);
      await ctx.db.insert("notifications", {
        userId: assigneeId,
        message: `${assigner?.displayName ?? "Someone"} assigned you to "${task.title}"`,
        taskId,
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, { taskId, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(taskId, filtered);
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    // Delete related notifications
    const notifications = await ctx.db.query("notifications").collect();
    for (const n of notifications) {
      if (n.taskId === taskId) {
        await ctx.db.delete(n._id);
      }
    }
    await ctx.db.delete(taskId);
  },
});
