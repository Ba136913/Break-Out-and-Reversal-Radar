"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

type Quote = {
  high: number;
  low: number;
  open: number;
  close: number;
};

const SYMBOLS = [
  "RELIANCE.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "INFY.NS",
  "TCS.NS",
];

export const runScanner = action({
  args: {},
  returns: v.null(),

  handler: async (ctx) => {
    const updatedAt = Date.now();

    await ctx.runMutation(internal.scanner.logScanner, {
      message: "Scanner Started",
      status: "RUNNING",
    });

    for (const symbol of SYMBOLS) {
      try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - 50 * 24 * 60 * 60;

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d`;

        const res = await fetch(url);
        if (!res.ok) continue;

        const data: any = await res.json();
        const result = data?.chart?.result?.[0];

        if (!result || !result.timestamp) continue;

        const timestamp: number[] = result.timestamp;
        const quote = result.indicators?.quote?.[0];
        const adjclose = result.indicators?.adjclose?.[0]?.adjclose;

        if (!quote) continue;

        const quotes: Quote[] = timestamp
          .map((_, idx): Quote => ({
            high: quote.high?.[idx],
            low: quote.low?.[idx],
            open: quote.open?.[idx],
            close: adjclose ? adjclose[idx] : quote.close?.[idx],
          }))
          .filter(
            (q): q is Quote =>
              q.high != null &&
              q.low != null &&
              q.open != null &&
              q.close != null
          );

        if (quotes.length < 15) continue;

        const today = quotes[quotes.length - 1];
        const yesterday = quotes[quotes.length - 2];
        const last10Days = quotes.slice(-11, -1);

        const highestHigh = Math.max(...last10Days.map(q => q.high));
        const lowestLow = Math.min(...last10Days.map(q => q.low));

        let breakoutSignal: "BULL" | "BEAR" | "NONE" = "NONE";
        if (today.close > highestHigh) breakoutSignal = "BULL";
        else if (today.close < lowestLow) breakoutSignal = "BEAR";

        let reversalSignal: "BULL" | "BEAR" | "NONE" = "NONE";
        if (
          yesterday.close < yesterday.open &&
          today.close > today.open &&
          today.close > yesterday.close
        ) {
          reversalSignal = "BULL";
        } else if (
          yesterday.close > yesterday.open &&
          today.close < today.open &&
          today.close < yesterday.close
        ) {
          reversalSignal = "BEAR";
        }

        const pctChange =
          ((today.close - yesterday.close) / yesterday.close) * 100;

        await ctx.runMutation(internal.scanner.updateResult, {
          symbol,
          price: today.close,
          pctChange,
          reversalSignal,
          breakoutSignal,
          updatedAt,
        });

      } catch {
        // ignore per-stock errors safely
      }
    }

    await ctx.runMutation(internal.scanner.logScanner, {
      message: "Scanner Completed",
      status: "IDLE",
    });

    return null;
  },
});