import { mutation } from "./_generated/server";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { message: "Already seeded" };
    }

    // Create hardcoded users
    const user1Id = await ctx.db.insert("users", {
      username: "user1",
      password: "user1",
      displayName: "Alice Johnson",
      avatarColor: "#6366f1",
    });

    const user2Id = await ctx.db.insert("users", {
      username: "user2",
      password: "user2",
      displayName: "Bob Smith",
      avatarColor: "#f59e0b",
    });

    // Create default columns
    const backlogId = await ctx.db.insert("columns", {
      title: "Backlog",
      order: 0,
    });
    const todoId = await ctx.db.insert("columns", {
      title: "To Do",
      order: 1,
    });
    const inProgressId = await ctx.db.insert("columns", {
      title: "In Progress",
      order: 2,
    });
    const doneId = await ctx.db.insert("columns", {
      title: "Done",
      order: 3,
    });

    // Create sample tasks
    await ctx.db.insert("tasks", {
      title: "Design landing page",
      description: "Create wireframes and mockups for the new landing page",
      columnId: todoId,
      assigneeId: user1Id,
      createdBy: user2Id,
      order: 0,
      priority: "high",
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment",
      columnId: inProgressId,
      assigneeId: user2Id,
      createdBy: user1Id,
      order: 0,
      priority: "medium",
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      title: "Write API documentation",
      description: "Document all REST endpoints with examples",
      columnId: backlogId,
      assigneeId: undefined,
      createdBy: user1Id,
      order: 0,
      priority: "low",
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      title: "Fix login bug",
      description: "Users report intermittent login failures on mobile",
      columnId: doneId,
      assigneeId: user1Id,
      createdBy: user1Id,
      order: 0,
      priority: "high",
      createdAt: Date.now(),
    });

    return { message: "Seeded successfully", user1Id, user2Id };
  },
});
