import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const getLatestResults = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("scan_results"),
    _creationTime: v.number(),
    symbol: v.string(),
    price: v.number(),
    pctChange: v.number(),
    reversalSignal: v.union(v.literal("BULL"), v.literal("BEAR"), v.literal("NONE")),
    breakoutSignal: v.union(v.literal("BULL"), v.literal("BEAR"), v.literal("NONE")),
    updatedAt: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("scan_results").collect();
  },
});

export const updateResult = internalMutation({
  args: {
    symbol: v.string(),
    price: v.number(),
    pctChange: v.number(),
    reversalSignal: v.union(v.literal("BULL"), v.literal("BEAR"), v.literal("NONE")),
    breakoutSignal: v.union(v.literal("BULL"), v.literal("BEAR"), v.literal("NONE")),
    updatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const existing = await ctx.db
        .query("scan_results")
        .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
        .unique();
      
      if (existing) {
        await ctx.db.patch(existing._id, args);
      } else {
        await ctx.db.insert("scan_results", args);
      }
    } catch (e) {
      console.error("Mutation failed for", args.symbol, e);
    }
    return null;
  },
});

export const getScannerStatus = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("scanner_logs").order("desc").first();
  }
});

export const logScanner = internalMutation({
  args: { message: v.string(), status: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("scanner_logs", { ...args, timestamp: Date.now() });
    return null;
  }
});
