import { defineTable } from "convex/server";
import { v } from "convex/values";

export const columnsTable = defineTable({
  title: v.string(),
  order: v.number(),
}).index("by_order", ["order"]);
