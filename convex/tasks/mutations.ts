import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";

async function requireUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new Error("User profile not found — call storeUser first");
  return user;
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    columnId: v.id("columns"),
    assigneeId: v.optional(v.id("users")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const creator = await requireUser(ctx);
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      createdBy: creator._id,
      order: existingTasks.length,
      createdAt: Date.now(),
    });

    if (args.assigneeId && args.assigneeId !== creator._id) {
      await ctx.db.insert("notifications", {
        userId: args.assigneeId,
        message: `${creator.displayName} assigned you to "${args.title}"`,
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
    order: v.number(),
  },
  handler: async (ctx, { taskId, columnId, order }) => {
    const mover = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    if (task.columnId === columnId) {
      // Same-column reorder: single pass
      const colTasks = await ctx.db
        .query("tasks")
        .withIndex("by_column", (q) => q.eq("columnId", columnId))
        .take(500);
      const others = colTasks
        .filter((t) => t._id !== taskId)
        .sort((a, b) => a.order - b.order);
      others.splice(order, 0, task);
      for (let i = 0; i < others.length; i++) {
        if (others[i].order !== i) {
          await ctx.db.patch(others[i]._id, { order: i });
        }
      }
      await ctx.db.patch(taskId, { order });
      return;
    }

    // Cross-column move
    const sourceTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", task.columnId))
      .take(500);
    const sourceRemaining = sourceTasks
      .filter((t) => t._id !== taskId)
      .sort((a, b) => a.order - b.order);
    for (let i = 0; i < sourceRemaining.length; i++) {
      if (sourceRemaining[i].order !== i) {
        await ctx.db.patch(sourceRemaining[i]._id, { order: i });
      }
    }

    const destTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", columnId))
      .take(500);
    const destRemaining = destTasks
      .filter((t) => t._id !== taskId)
      .sort((a, b) => a.order - b.order);
    for (let i = 0; i < destRemaining.length; i++) {
      const newOrder = i >= order ? i + 1 : i;
      if (destRemaining[i].order !== newOrder) {
        await ctx.db.patch(destRemaining[i]._id, { order: newOrder });
      }
    }

    await ctx.db.patch(taskId, { columnId, order });

    if (task.assigneeId && task.assigneeId !== mover._id) {
      const column = await ctx.db.get(columnId);
      await ctx.db.insert("notifications", {
        userId: task.assigneeId,
        message: `${mover.displayName} moved "${task.title}" to ${column?.title ?? "another column"}`,
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
  },
  handler: async (ctx, { taskId, assigneeId }) => {
    const assigner = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(taskId, { assigneeId });

    if (assigneeId && assigneeId !== assigner._id) {
      await ctx.db.insert("notifications", {
        userId: assigneeId,
        message: `${assigner.displayName} assigned you to "${task.title}"`,
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
    const notifications = await ctx.db
      .query("notifications")
      .collect();
    for (const n of notifications) {
      if (n.taskId === taskId) await ctx.db.delete(n._id);
    }
    await ctx.db.delete(taskId);
  },
});
