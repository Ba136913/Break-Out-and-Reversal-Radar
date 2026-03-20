import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: results } = useSuspenseQuery(convexQuery(api.scanner.getLatestResults, {}));
  const { data: status } = useSuspenseQuery(convexQuery(api.scanner.getScannerStatus, {}));

  const lastUpdated = useMemo(() => {
    if (!results || results.length === 0) return null;
    return new Date(Math.max(...results.map(r => r.updatedAt)));
  }, [results]);

  const { reversals, breakouts, sentiment } = useMemo(() => {
    const r = (results || []).filter(x => x.reversalSignal !== "NONE");
    const b = (results || []).filter(x => x.breakoutSignal !== "NONE");
    
    // Sentiment Logic
    const bullCount = r.filter(x => x.reversalSignal === 'BULL').length + b.filter(x => x.breakoutSignal === 'BULL').length;
    const bearCount = r.filter(x => x.reversalSignal === 'BEAR').length + b.filter(x => x.breakoutSignal === 'BEAR').length;
    const totalSignals = bullCount + bearCount;
    
    let sentimentScore = 50; // Neutral
    let sentimentLabel = "NEUTRAL";
    let sentimentColor = "text-slate-400";
    
    if (totalSignals > 0) {
      sentimentScore = (bullCount / totalSignals) * 100;
      if (sentimentScore > 75) { sentimentLabel = "EXTREME BULL"; sentimentColor = "text-emerald-400"; }
      else if (sentimentScore > 60) { sentimentLabel = "BULLISH"; sentimentColor = "text-emerald-500"; }
      else if (sentimentScore < 25) { sentimentLabel = "EXTREME BEAR"; sentimentColor = "text-rose-400"; }
      else if (sentimentScore < 40) { sentimentLabel = "BEARISH"; sentimentColor = "text-rose-500"; }
    }

    return {
      reversals: [...r].sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange)),
      breakouts: [...b].sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange)),
      sentiment: { score: sentimentScore, label: sentimentLabel, color: sentimentColor, bullCount, bearCount }
    };
  }, [results]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    {role: 'ai', text: 'QUANT ENGINE v1.2 ONLINE. Aap kaise hain? How can I assist your trading today?'}
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setChatMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsTyping(true);

    // Advanced Intelligent Quant Engine (Heuristic Reasoning)
    setTimeout(() => {
      const query = userMsg.toLowerCase();
      const isHinglish = /batao|kaunsa|hai|kya|dikhao|kaisa|karo|bhai|bolo|kuch|sabse|koun|girega|badhega|paisa/.test(query);
      
      const bullBreakouts = breakouts.filter(x => x.breakoutSignal === 'BULL');
      const bearBreakouts = breakouts.filter(x => x.breakoutSignal === 'BEAR');
      const bullReversals = reversals.filter(x => x.reversalSignal === 'BULL');
      const bearReversals = reversals.filter(x => x.reversalSignal === 'BEAR');

      const formatSymbol = (s: any) => `${s.symbol.replace('.NS', '')} (${s.pctChange >= 0 ? '+' : ''}${s.pctChange.toFixed(2)}%)`;

      let response = "";

      // 1. TOP GAINERS / BEST PICKS
      if (query.includes('top') || query.includes('best') || query.includes('buy') || query.includes('kaunsa') || query.includes('gainer') || query.includes('paisa')) {
        const allBull = [...bullBreakouts, ...bullReversals].sort((a, b) => b.pctChange - a.pctChange);
        
        if (allBull.length > 0) {
          if (isHinglish) {
            response = `Bhai, market abhi ${sentiment.label} mood mein hai (${sentiment.score.toFixed(0)}% bullish intensity). \n\nAaj ke top performance waale picks ye rahe:\n\n`;
            if (bullBreakouts.length > 0) response += `🚀 *BREAKOUTS:* ${bullBreakouts.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            if (bullReversals.length > 0) response += `🕯️ *REVERSALS:* ${bullReversals.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            response += `\nIn stocks mein buying pressure dikh raha hai. ${allBull[0].symbol.replace('.NS', '')} sabse strong lag raha hai. Stoploss strictly maintain karna!`;
          } else {
            response = `The scanner has identified ${allBull.length} bullish opportunities. Market stance: ${sentiment.label}.\n\n🔥 **HIGH CONVICTION PICKS:**\n`;
            if (bullBreakouts.length > 0) response += `- **Breakouts:** ${bullBreakouts.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            if (bullReversals.length > 0) response += `- **Reversals:** ${bullReversals.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            response += `\nTechnical Insight: ${allBull[0].symbol.replace('.NS', '')} is leading the relative strength. Monitor closely.`;
          }
        } else {
          response = isHinglish 
            ? "Bhai, filhaal koi strong BUY signal nahi mil raha. Market thoda thanda hai, capital bacha ke rakho."
            : "No high-conviction BUY setups found in the current cycle. Capital preservation is advised.";
        }
      } 
      // 2. SELL / SHORT / LOSERS
      else if (query.includes('sell') || query.includes('short') || query.includes('girega') || query.includes('bear') || query.includes('loser')) {
        const allBear = [...bearBreakouts, ...bearReversals].sort((a, b) => a.pctChange - b.pctChange);
        
        if (allBear.length > 0) {
          if (isHinglish) {
            response = `Bhai, market abhi kafi weak hai (${sentiment.label}). Ye stocks aur gir sakte hain:\n\n`;
            if (bearBreakouts.length > 0) response += `📉 *BREAKDOWNS:* ${bearBreakouts.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            if (bearReversals.length > 0) response += `🥀 *BEARISH REVERSALS:* ${bearReversals.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            response += `\n${allBear[0].symbol.replace('.NS', '')} mein kafi selling pressure hai. Short side pe setups dhoondein.`;
          } else {
            response = `Sentiment is ${sentiment.label}. Top BEARISH setups detected:\n\n`;
            if (bearBreakouts.length > 0) response += `📉 **Breakdowns:** ${bearBreakouts.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            if (bearReversals.length > 0) response += `🥀 **Bearish Reversals:** ${bearReversals.slice(0, 5).map(formatSymbol).join(', ')}\n`;
            response += `\nStrategy: Bearish momentum is accelerating in ${allBear[0].symbol.replace('.NS', '')}.`;
          }
        } else {
          response = isHinglish ? "Bhai, short side ke liye koi setup nahi hai abhi. Market bottom dhoond raha hai." : "No significant bearish signals detected. Momentum may be shifting.";
        }
      }
      // 3. MARKET OVERVIEW / SENTIMENT
      else if (query.includes('market') || query.includes('sentiment') || query.includes('pulse') || query.includes('kaisa')) {
        if (isHinglish) {
          response = `Bhai, market ka mood kaisa hai? Dekhiye:\n\n📊 *Sentiment:* ${sentiment.label}\n📈 *Bulls:* ${sentiment.bullCount} stocks\n📉 *Bears:* ${sentiment.bearCount} stocks\n⚡ *Intensity:* ${sentiment.score.toFixed(1)}%\n\nSummary: Market abhi ${sentiment.score > 50 ? 'bullish side tilt ho raha hai' : 'bearish pressure mein hai'}. Level-by-level trade karein!`;
        } else {
          response = `### MARKET PULSE INTELLIGENCE\n\n- **Current Stance:** ${sentiment.label}\n- **Advance/Decline:** ${sentiment.bullCount} Bulls vs ${sentiment.bearCount} Bears\n- **Quant Intensity:** ${sentiment.score.toFixed(1)}%\n\nOverall market structure is ${sentiment.score > 50 ? 'improving' : 'deteriorating'}. Allocate risk based on breadth.`;
        }
      }
      // 4. GREETINGS
      else if (query.includes('hi') || query.includes('hello') || query.includes('namaste') || query.includes('kaise')) {
        response = isHinglish 
          ? "Namaste Bhai! Mein aapka Quant Analyst AI hoon. Market ka haal janne ke liye puchiye: \n\n1. 'Top gainer kaunse hain?'\n2. 'Market kaisa hai?'\n3. 'Bhai paisa kahan banega?'"
          : "Greetings. I am your Quant Analyst. All 250+ F&O assets have been analyzed. How shall we trade? Try 'Best picks' or 'Market summary'.";
      }
      // 5. DEFAULT
      else {
        response = isHinglish 
          ? "Bhai thoda clear puchiye, jaise 'Aaj ke top stocks batao' ya 'Kaunsa stock buy karein?'. Mein pura data analyze karke bataunga."
          : "Please be more specific. I can analyze: 'Top gainers', 'Shorting ideas', or 'Market sentiment'.";
      }

      setChatMessages(prev => [...prev, {role: 'ai', text: response}]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <header className="mb-10 flex flex-col gap-8 border-b border-slate-800/60 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-[calc(-0.05em)] text-white uppercase italic">
                  ALGO<span className="text-emerald-500">SCANNER</span>
                </h1>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded uppercase tracking-widest">PRO v1.2</span>
              </div>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">NSE F&O QUANTITATIVE TERMINAL • INSTANT DATA ENGINE</p>
            </div>
            
            <div className="flex gap-8 md:text-right">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Scanner Health</p>
                <div className="flex items-center md:justify-end gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${status?.status === 'RUNNING' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                  <span className="text-xs font-mono font-bold text-slate-300">{status?.status || 'IDLE'}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Global Refresh</p>
                <p className="text-emerald-400 font-mono font-bold text-sm">{lastUpdated ? lastUpdated.toLocaleTimeString() : "INITIALIZING..."}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Market Sentiment Pulse</p>
                <h3 className={`text-2xl font-black tracking-tighter ${sentiment.color}`}>{sentiment.label}</h3>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-[10px] text-emerald-500/50 uppercase font-bold">Bull Signals</p>
                  <p className="text-emerald-400 font-mono font-bold">{sentiment.bullCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-rose-500/50 uppercase font-bold">Bear Signals</p>
                  <p className="text-rose-400 font-mono font-bold">{sentiment.bearCount}</p>
                </div>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/50 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                style={{ width: `${sentiment.score}%` }}
              ></div>
              <div 
                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-1000 ease-out" 
                style={{ width: `${100 - sentiment.score}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 font-mono text-[9px] font-black uppercase tracking-tighter">
              <span className="text-emerald-500/60">Fearless Greed</span>
              <span className="text-slate-600">Balance</span>
              <span className="text-rose-500/60">Extreme Fear</span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <Panel 
            title="🕯️ REVERSAL RADAR" 
            subtitle="CANDLESTICK OVERTAKE PATTERNS"
            data={reversals}
            emptyMsg="Scanning for price reversals..."
          />

          <Panel 
            title="🚀 CHANNEL BO" 
            subtitle="10-DAY VOLATILITY BREAKOUTS"
            data={breakouts}
            emptyMsg="Searching for channel breakouts..."
          />
        </main>

        <footer className="mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-600 uppercase tracking-[0.2em]">
          <p>© 2026 QUANT ENGINE • BUILT-IN ANTI-BLOCK</p>
          <div className="flex gap-6">
            <span>{results?.length || 0} ASSETS MONITORED</span>
            <span className="text-slate-800">|</span>
            <span>DATA SOURCE: YFINANCE CLOUD</span>
          </div>
        </footer>
      </div>

      {/* FLOATING AI TERMINAL */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {chatOpen && (
          <div className="w-[350px] md:w-[450px] h-[500px] bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300 text-left">
            <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">QUANT ANALYST ENGINE</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs custom-scrollbar">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
                  }`}>
                    <div className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">
                      {msg.role === 'user' ? 'Operator' : 'Engine'}
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 animate-pulse text-slate-500">
                    ANALYZING DATA...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-slate-950/50 border-t border-slate-800/50 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in English or Hinglish..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
              />
              <button 
                type="submit" 
                disabled={isTyping}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 group ${
            chatOpen ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-emerald-500/20'
          }`}
        >
          {chatOpen ? (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          ) : (
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-emerald-600 rounded-full"></span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, data, emptyMsg }: { title: string; subtitle: string; data: any[]; emptyMsg: string }) {
  return (
    <section className="flex flex-col bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl group hover:border-slate-700/50 transition-colors duration-500">
      <div className="p-5 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/40">
        <div>
          <h2 className="text-lg font-black tracking-tighter text-white uppercase group-hover:text-emerald-400 transition-colors">{title}</h2>
          <p className="text-[9px] text-slate-500 font-bold tracking-widest">{subtitle}</p>
        </div>
        <div className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50 text-[9px] font-black text-slate-400 tabular-nums">
          {data.length} SIGNALS
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[9px] text-slate-500 uppercase tracking-[0.2em] bg-slate-950/40">
              <th className="px-6 py-4 font-black">Symbol</th>
              <th className="px-6 py-4 font-black text-right">Momentum</th>
              <th className="px-6 py-4 font-black text-center">Direction</th>
              <th className="px-6 py-4 font-black text-right">LTP (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {data.map((stock) => (
              <StockRow key={stock.symbol} stock={stock} isReversal={title.includes("REVERSAL")} />
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs italic tracking-widest uppercase">{emptyMsg}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StockRow({ stock, isReversal }: { stock: any; isReversal: boolean }) {
  const signal = isReversal ? stock.reversalSignal : stock.breakoutSignal;
  const isBull = signal === 'BULL';
  
  const tvSymbol = stock.symbol.replace('.NS', '').replace('&', '_');
  const tvUrl = `https://www.tradingview.com/chart/?symbol=NSE:${tvSymbol}`;

  return (
    <tr className="hover:bg-slate-800/20 transition-all group/row text-left">
      <td className="px-6 py-4">
        <a 
          href={tvUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="group/link block"
        >
          <span className="text-white group-hover/row:text-emerald-400 font-bold text-base transition-colors tracking-tight block">
            {stock.symbol.replace('.NS', '')}
          </span>
          <span className="text-[8px] text-slate-600 font-black tracking-widest uppercase group-hover/link:text-emerald-500/50 transition-colors">
            Analyze Chart ↗
          </span>
        </a>
      </td>
      <td className={`px-6 py-4 text-right font-mono font-bold text-base ${stock.pctChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {stock.pctChange >= 0 ? '+' : ''}{stock.pctChange.toFixed(2)}%
      </td>
      <td className="px-6 py-4 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black tracking-tighter border shadow-sm ${
          isBull 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5'
        }`}>
          {isBull ? '▲' : '▼'} {signal}
        </div>
      </td>
      <td className="px-6 py-4 text-right font-mono text-slate-400 text-sm font-medium">
        {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  );
}
