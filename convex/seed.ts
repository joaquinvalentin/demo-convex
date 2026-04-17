import { mutation } from "./_generated/server";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingColumns = await ctx.db.query("columns").take(1);
    if (existingColumns.length > 0) return { message: "Already seeded" };

    await ctx.db.insert("columns", { title: "Backlog", order: 0 });
    await ctx.db.insert("columns", { title: "To Do", order: 1 });
    await ctx.db.insert("columns", { title: "In Progress", order: 2 });
    await ctx.db.insert("columns", { title: "Done", order: 3 });

    return { message: "Seeded columns" };
  },
});
