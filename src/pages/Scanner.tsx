import React, { useState } from 'react';
import { Search, ArrowRight, Activity, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketDataStore } from '../services/marketData';
import { formatCurrency, formatPercent, cn } from '../utils';
import { useNavigate } from 'react-router-dom';

export function Scanner() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tradeTypeFilter, setTradeTypeFilter] = useState<'All' | 'Positive Carry' | 'Reverse Carry'>('All');
  const { marketData, connections } = useMarketDataStore();
  const navigate = useNavigate();

  // Convert map to array and filter
  const dataList = Object.values(marketData);
  const filteredData = dataList.filter(d => 
    (tradeTypeFilter === 'All' || d.tradeType === tradeTypeFilter) &&
    (d.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.exchange.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.expectedRoi - a.expectedRoi);

  const binanceStatus = connections['Binance'];
  const bybitStatus = connections['Bybit'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Market Scanner</h1>
          <p className="text-slate-400 mt-1">Real-time delta-neutral arbitrage opportunities.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setTradeTypeFilter('All')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", tradeTypeFilter === 'All' ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              All
            </button>
            <button
              onClick={() => setTradeTypeFilter('Positive Carry')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center", tradeTypeFilter === 'Positive Carry' ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-emerald-400/70")}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Positive Carry
            </button>
            <button
              onClick={() => setTradeTypeFilter('Reverse Carry')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center", tradeTypeFilter === 'Reverse Carry' ? "bg-rose-500/20 text-rose-400" : "text-slate-400 hover:text-rose-400/70")}
            >
              <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
              Reverse Carry
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-lg p-2">
          <div className="flex items-center space-x-1.5 px-2">
            <div className={cn("w-2 h-2 rounded-full", binanceStatus === 'Connected' ? "bg-emerald-400 animate-pulse" : (binanceStatus === 'Connecting' ? "bg-amber-400 animate-pulse" : "bg-rose-400"))}></div>
            <span className="text-xs font-mono text-slate-400">Binance</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center space-x-1.5 px-2">
            <div className={cn("w-2 h-2 rounded-full", bybitStatus === 'Connected' ? "bg-emerald-400 animate-pulse" : (bybitStatus === 'Connecting' ? "bg-amber-400 animate-pulse" : "bg-rose-400"))}></div>
            <span className="text-xs font-mono text-slate-400">Bybit</span>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search symbol..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 transition-shadow"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm relative">
        {(binanceStatus === 'Connecting' && bybitStatus === 'Connecting' && dataList.length === 0) && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-slate-300 font-medium">Connecting to Exchanges...</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trading Pair</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Prices</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Spread</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Funding Rate</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Est. ROI (APR)</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Trade Direction</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredData.map((row) => (
                <tr key={`${row.exchange}-${row.symbol}`} className={cn("hover:bg-slate-800/40 transition-colors group", row.status === 'Offline' ? 'opacity-50' : '')}>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-white">{row.symbol.substring(0, 1)}</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 flex items-center">
                          {row.symbol}
                          {row.status === 'Offline' && <span className="ml-2 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Syncing</span>}
                        </div>
                        <div className="text-xs text-slate-500">{row.exchange}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-mono text-sm text-emerald-400 font-medium">S: {row.spotPrice > 0 ? formatCurrency(row.spotPrice, row.spotPrice < 1 ? 4 : 2) : '---'}</div>
                    <div className="font-mono text-xs text-rose-400/80 font-medium mt-0.5">F: {row.futurePrice > 0 ? formatCurrency(row.futurePrice, row.futurePrice < 1 ? 4 : 2) : '---'}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={cn(
                      "font-mono text-sm px-2.5 py-1 rounded-md",
                      Math.abs(row.spread) > 0.3 ? "bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20" : "bg-slate-800 text-slate-300"
                    )}>
                      {row.spread !== 0 ? row.spread.toFixed(4) + '%' : '---'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono">
                    <div className={row.fundingRate > 0.01 ? "text-emerald-400 text-sm font-semibold" : (row.fundingRate < -0.01 ? "text-rose-400 text-sm font-semibold" : "text-slate-300 text-sm")}>
                      {row.fundingRate !== 0 ? formatPercent(row.fundingRate) : '---'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{row.countdown}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-mono text-sm font-semibold text-indigo-400">
                        {row.expectedRoi !== 0 ? row.expectedRoi.toFixed(2) + '%' : '---'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">FI: {row.expectedFundingIncome ? row.expectedFundingIncome.toFixed(2) + '%' : '---'}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1", row.tradeType === 'Positive Carry' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20")}>
                        {row.tradeType}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400">
                        <span className={row.spotAction === 'BUY' ? "text-emerald-400" : "text-rose-400"}>{row.spotAction}</span> Spot / <span className={row.futureAction === 'BUY' ? "text-emerald-400" : "text-rose-400"}>{row.futureAction}</span> Fut
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => navigate('/execution')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100 flex items-center mx-auto shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      <span>Trade</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No live arbitrage opportunities found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
