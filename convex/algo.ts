"use node";

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const SYMBOLS = [
  "RELIANCE.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS", "TCS.NS", "AXISBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "LT.NS", "BHARTIARTL.NS", "HINDUNILVR.NS", "ITC.NS", "BAJFINANCE.NS", "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS", "HCLTECH.NS", "SUNPHARMA.NS", "BAJAJFINSV.NS", "TATASTEEL.NS", "ULTRACEMCO.NS", "INDUSINDBK.NS", "ADANIPORTS.NS", "JSWSTEEL.NS", "NESTLEIND.NS", "GRASIM.NS", "POWERGRID.NS", "NTPC.NS", "ONGC.NS", "COALINDIA.NS", "TECHM.NS", "WIPRO.NS", "HEROMOTOCO.NS", "TATAMOTORS.NS", "HINDALCO.NS", "BPCL.NS", "M&M.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS", "SBILIFE.NS", "HDFCLIFE.NS", "BRITANNIA.NS", "TATACONSUM.NS", "EICHERMOT.NS", "UPL.NS", "ADANIENT.NS", "ACC.NS", "ABCAPITAL.NS", "ABFRL.NS", "ALKEM.NS", "AMBUJACEM.NS", "APOLLOTYRE.NS", "ASHOKLEY.NS", "ASTRAL.NS", "ATUL.NS", "AUBANK.NS", "AUROPHARMA.NS", "BALKRISIND.NS", "BALRAMCHIN.NS", "BANDHANBNK.NS", "BANKBARODA.NS", "BATAINDIA.NS", "BEL.NS", "BERGEPAINT.NS", "BHARATFORG.NS", "BHEL.NS", "BIOCON.NS", "BSOFT.NS", "CANBK.NS", "CANFINHOME.NS", "CHAMBLFERT.NS", "CHOLAFIN.NS", "COFORGE.NS", "COLPAL.NS", "CONCOR.NS", "COROMANDEL.NS", "CROMPTON.NS", "CUB.NS", "CUMMINSIND.NS", "DABUR.NS", "DALBHARAT.NS", "DEEPAKNTR.NS", "DELHIVERY.NS", "DIXON.NS", "DLF.NS", "EXIDEIND.NS", "FEDERALBNK.NS", "GAIL.NS", "GLENMARK.NS", "GMRINFRA.NS", "GNFC.NS", "GODREJCP.NS", "GODREJPROP.NS", "GRANULES.NS", "GUJGASLTD.NS", "HAL.NS", "HAVELLS.NS", "HINDCOPPER.NS", "HINDPETRO.NS", "ICICIGI.NS", "ICICIPRULI.NS", "IDFC.NS", "IDFCFIRSTB.NS", "IEX.NS", "IGL.NS", "INDHOTEL.NS", "INDIACEM.NS", "INDIAMART.NS", "INDIGO.NS", "INDUSTOWER.NS", "IOC.NS", "IPCALAB.NS", "IRCTC.NS", "JINDALSTEL.NS", "JKCEMENT.NS", "JUBLFOOD.NS", "L&TFH.NS", "LALPATHLAB.NS", "LAURUSLABS.NS", "LICHSGFIN.NS", "LTIM.NS", "LTTS.NS", "LUPIN.NS", "M&MFIN.NS", "MANAPPURAM.NS", "MARICO.NS", "MCDOWELL-N.NS", "MCX.NS", "METROPOLIS.NS", "MFSL.NS", "MGL.NS", "MOTHERSON.NS", "MPHASIS.NS", "MRF.NS", "MUTHOOTFIN.NS", "NATIONALUM.NS", "NAVINFLUOR.NS", "NMDC.NS", "OBEROIRLTY.NS", "OFSS.NS", "PAGEIND.NS", "PEL.NS", "PERSISTENT.NS", "PETRONET.NS", "PFC.NS", "PIDILITIND.NS", "PIIND.NS", "PNB.NS", "POLYCAB.NS", "PVRINOX.NS", "RAMCOCEM.NS", "RBLBANK.NS", "RECLTD.NS", "SAIL.NS", "SBICARD.NS", "SHREECEM.NS", "SHRIRAMFIN.NS", "SIEMENS.NS", "SRF.NS", "SUNTV.NS", "SYNGENE.NS", "TATACHEMICAL.NS", "TATACOMM.NS", "TATAPOWER.NS", "TORNTPHARM.NS", "TRENT.NS", "TVSMOTOR.NS", "UBL.NS", "VEDL.NS", "VOLTAS.NS", "ZEEL.NS", "ZYDUSLIFE.NS", "IDEA.NS", "ZOMATO.NS", "NYKAA.NS", "PAYTM.NS", "POLICYBZR.NS", "MAXHEALTH.NS", "PHOENIXLTD.NS", "FORTIS.NS"
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

export const runScanner = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const updatedAt = Date.now();
    const batchSize = 10;
    
    await ctx.runMutation(internal.scanner.logScanner, { message: "Scanner Started", status: "RUNNING" });

    for (let i = 0; i < SYMBOLS.length; i += batchSize) {
      const batch = SYMBOLS.slice(i, i + batchSize);
      
      const promises = batch.map(async (symbol) => {
        try {
          const end = Math.floor(Date.now() / 1000);
          const start = end - (50 * 24 * 60 * 60); 
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d`;
          
          const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] },
            signal: AbortSignal.timeout(10000) // 10s timeout per stock
          });
          
          if (!res.ok) return;
          const data = await res.json() as any;
          const result = data?.chart?.result?.[0];
          if (!result?.timestamp) return;

          const timestamp = result.timestamp;
          const quote = result.indicators.quote[0];
          const adjclose = result.indicators.adjclose?.[0]?.adjclose;
          
          const quotes = timestamp.map((t: number, idx: number) => ({
            high: quote.high[idx],
            low: quote.low[idx],
            open: quote.open[idx],
            close: adjclose ? adjclose[idx] : quote.close[idx],
          })).filter((q: any) => q.close != null && q.open != null && q.high != null && q.low != null);

          if (quotes.length < 15) return;

          const today = quotes[quotes.length - 1];
          const yesterday = quotes[quotes.length - 2];
          const last10Days = quotes.slice(-11, -1);
          
          const highestHigh = Math.max(...last10Days.map((q: any) => q.high));
          const lowestLow = Math.min(...last10Days.map((q: any) => q.low));

          let breakoutSignal: "BULL" | "BEAR" | "NONE" = "NONE";
          if (today.close > highestHigh) breakoutSignal = "BULL";
          else if (today.close < lowestLow) breakoutSignal = "BEAR";

          let reversalSignal: "BULL" | "BEAR" | "NONE" = "NONE";
          if (yesterday.close < yesterday.open && today.close > today.open && today.close > yesterday.close) reversalSignal = "BULL";
          else if (yesterday.close > yesterday.open && today.close < today.open && today.close < yesterday.close) reversalSignal = "BEAR";

          const pctChange = ((today.close - yesterday.close) / yesterday.close) * 100;

          await ctx.runMutation(internal.scanner.updateResult, {
            symbol, price: today.close, pctChange, reversalSignal, breakoutSignal, updatedAt
          });

        } catch (e) {
          // Individual stock error shouldn't crash the scanner
        }
      });

      await Promise.all(promises);
      // Wait to prevent IP block
      await new Promise(r => setTimeout(r, 1500));
    }

    await ctx.runMutation(internal.scanner.logScanner, { message: "Scanner Completed", status: "IDLE" });
    return null;
  },
});
