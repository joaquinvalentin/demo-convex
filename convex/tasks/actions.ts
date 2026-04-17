import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchSubtasks } from "./groq";

export const decomposeTask = action({
  args: {
    title: v.string(),
    description: v.string(),
    columnId: v.id("columns"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const subtasks = await fetchSubtasks(args.title, args.description);

    await ctx.runMutation(internal.tasks.mutations.createSubtasks, {
      subtasks,
      columnId: args.columnId,
      priority: args.priority,
    });

    return subtasks.length;
  },
});
