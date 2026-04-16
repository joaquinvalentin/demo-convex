import { defineSchema } from "convex/server";
import { usersTable } from "./users/schema";
import { columnsTable } from "./columns/schema";
import { tasksTable } from "./tasks/schema";
import { notificationsTable } from "./notifications/schema";

export default defineSchema({
  users: usersTable,
  columns: columnsTable,
  tasks: tasksTable,
  notifications: notificationsTable,
});
