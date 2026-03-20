import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scan_results: defineTable({
    symbol: v.string(),
    price: v.number(),
    pctChange: v.number(),
    reversalSignal: v.union(v.literal("BULL"), v.literal("BEAR"), v.literal("NONE")),
    breakoutSignal: v.union(v.literal("BULL"), v.literal("BEAR"), v.literal("NONE")),
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),
  
  scanner_logs: defineTable({
    message: v.string(),
    status: v.string(),
    timestamp: v.number(),
  }),
});
