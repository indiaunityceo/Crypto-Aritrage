import React from 'react';
import { formatCurrency, cn } from '../utils';
import { Shield, TrendingUp, TrendingDown, Clock, History as HistoryIcon } from 'lucide-react';
import { useMarketDataStore } from '../services/marketData';

export function History() {
  const { tradeHistory } = useMarketDataStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trade History</h1>
          <p className="text-slate-400 mt-1">Review your closed arbitrage positions and funding income.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trading Pair</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Trade Type</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Directions</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Spread</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Funding Income</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Net Profit</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">ROI</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Exit Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tradeHistory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-white">{row.symbol.substring(0, 1)}</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{row.symbol}</div>
                        <div className="text-xs text-slate-500">{row.exchange}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center border", 
                        row.tradeType === 'Positive Carry' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {row.tradeType === 'Positive Carry' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {row.tradeType || 'Positive Carry'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">Funding: {row.fundingDirection}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="text-[10px] font-mono font-semibold">
                      <span className={row.spotDirection === 'BUY' ? "text-emerald-400" : "text-rose-400"}>{row.spotDirection}</span> Spot
                      <span className="text-slate-500 mx-1">/</span>
                      <span className={row.futureDirection === 'BUY' ? "text-emerald-400" : "text-rose-400"}>{row.futureDirection}</span> Fut
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-mono text-sm text-indigo-400 font-medium">
                      {row.spread.toFixed(3)}%
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-mono text-sm text-emerald-400 font-medium">
                      {formatCurrency(row.fundingIncome)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={cn("font-mono text-sm font-bold", row.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {row.pnl > 0 ? '+' : ''}{formatCurrency(row.pnl)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded", row.roi >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                      {row.roi > 0 ? '+' : ''}{row.roi.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end text-slate-400 text-xs font-mono">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {row.exitTime}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tradeHistory.length === 0 && (
            <div className="py-20 text-center">
              <HistoryIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No trade history</h3>
              <p className="text-slate-500 mt-2">Close an active position to see it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
