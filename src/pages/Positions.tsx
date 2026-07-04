import React from 'react';
import { formatCurrency, formatPercent, cn } from '../utils';
import { Shield, TrendingUp, TrendingDown, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useMarketDataStore } from '../services/marketData';
import { Position } from '../types';

export function Positions() {
  const { positions } = useMarketDataStore();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Positions</h1>
          <p className="text-slate-400 mt-1">Manage your currently open delta-neutral trades.</p>
        </div>
        <button className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-lg shadow-rose-500/10">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Emergency Close All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {positions.map((pos) => (
          <PositionCard key={pos.id} position={pos} />
        ))}

        {positions.length === 0 && (
          <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No active positions</h3>
            <p className="text-slate-500 mt-2">Execute a trade from the Arbitrage Console to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PositionCard({ position }: { position: Position; key?: string }) {
  // Approximate total costs (spot entry + exit, future entry + exit)
  const spotFee = position.marginUsed * 0.001 * 2;
  const futureFee = position.marginUsed * position.leverage * 0.0005 * 2;
  const slippage = position.marginUsed * 0.0005;
  const totalCost = spotFee + futureFee + slippage;
  
  const recoveredPercent = totalCost > 0 ? (position.fundingEarned / totalCost) * 100 : 100;
  const remaining = Math.max(0, totalCost - position.fundingEarned);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-white">{position.symbol}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {position.exchange}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center border", 
              position.tradeType === 'Positive Carry' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              {position.tradeType === 'Positive Carry' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {position.tradeType || 'Positive Carry'}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-slate-300 font-mono">{position.duration}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></div>
            {position.status === 'Open' ? 'HEDGED' : position.status}
          </span>
          <button 
            onClick={() => useMarketDataStore.getState().closePosition(position.id)}
            disabled={position.status !== 'Open'}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
          >
            {position.status === 'Open' ? 'Close Position' : 'Closing...'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Legs */}
        <div className="space-y-4 lg:border-r border-slate-800 pr-6">
          <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Spot Leg</div>
              <div className={cn("font-bold text-sm", position.spotDirection === 'SELL' ? "text-rose-400" : "text-emerald-400")}>
                {position.spotDirection || 'BUY'} {position.spotSize}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Entry Price</div>
              <div className="text-slate-200 font-mono text-sm">{formatCurrency(position.spotEntry)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Futures Leg</div>
              <div className={cn("font-bold text-sm", position.futureDirection === 'BUY' ? "text-emerald-400" : "text-rose-400")}>
                {position.futureDirection || 'SELL'} {position.futureSize}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Entry Price</div>
              <div className="text-slate-200 font-mono text-sm">{formatCurrency(position.futureEntry)}</div>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="space-y-4 lg:border-r border-slate-800 pr-6">
          <div className="flex justify-between">
            <span className="text-sm text-slate-400">Margin Used</span>
            <span className="text-sm text-white font-mono">{formatCurrency(position.marginUsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-400">Leverage</span>
            <span className="text-sm text-white font-mono">{position.leverage}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-400">Liq. Price (Futures)</span>
            <span className="text-sm text-amber-400 font-mono">{formatCurrency(position.liquidationPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-400">Current Spread</span>
            <span className="text-sm text-indigo-400 font-mono">{position.currentSpread.toFixed(3)}%</span>
          </div>
        </div>

        {/* Returns & Recovery */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-indigo-500/5 rounded-xl border border-indigo-500/10 p-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Net Funding Income
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {formatCurrency(position.fundingEarned)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1" /> Total Net PnL
              </div>
              <div className="flex items-end space-x-2">
                <span className={cn("text-2xl font-bold font-mono tracking-tight", position.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {position.pnl > 0 ? '+' : ''}{formatCurrency(position.pnl)}
                </span>
                <span className={cn("text-sm font-medium mb-1 px-1.5 py-0.5 rounded", position.roi >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                  {position.roi > 0 ? '+' : ''}{position.roi.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-500/10">
            <div className="flex justify-between items-end mb-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Recovery Progress</div>
              <div className="text-xs text-slate-300 font-mono">
                {recoveredPercent >= 100 ? 'Fully Recovered' : `Fees Recovered: ${recoveredPercent.toFixed(1)}%`}
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className={cn("h-full transition-all duration-500", recoveredPercent >= 100 ? "bg-emerald-500" : "bg-amber-500")}
                style={{ width: `${Math.min(100, recoveredPercent)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-400 text-[10px]">Collected: {formatCurrency(position.fundingEarned)}</span>
              {remaining > 0 && (
                <span className="text-amber-400/80 text-[10px]">Remaining: {formatCurrency(remaining)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
