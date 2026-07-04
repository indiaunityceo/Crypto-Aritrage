import React from 'react';
import { Bell, User, Zap, AlertTriangle, Link } from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { useMarketDataStore } from '../services/marketData';

export function Header() {
  const { connections } = useMarketDataStore();
  
  const connectedCount = Object.values(connections).filter(s => s === 'Connected').length;
  const totalCount = Object.keys(connections).length;

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
          <div className={cn("w-2 h-2 rounded-full", connectedCount === totalCount ? "bg-emerald-400 animate-pulse" : (connectedCount > 0 ? "bg-amber-400 animate-pulse" : "bg-rose-400"))}></div>
          <span className="text-sm text-slate-300 font-mono flex items-center">
            <Link className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            API: {connectedCount}/{totalCount}
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-slate-300">Kill Switch Ready</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Balance</div>
          <div className="text-emerald-400 font-mono font-bold tracking-tight">
            {formatCurrency(142500.50)}
          </div>
        </div>
        
        <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
        
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            3
          </span>
        </button>
        
        <button className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-indigo-500 transition-colors">
            <User className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </div>
        </button>
      </div>
    </header>
  );
}

