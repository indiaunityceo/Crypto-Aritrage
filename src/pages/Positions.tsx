import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Shield } from 'lucide-react';
import { useMarketDataStore } from '../services/marketData';
import { PositionCard } from '../components/PositionCard';

export function Positions() {
  const { positions } = useMarketDataStore();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Positions</h1>
          <p className="text-slate-400 mt-1">Live Institutional Funding Arbitrage Position Monitor.</p>
        </div>
        <button className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-lg shadow-rose-500/10">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Emergency Close All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {positions.length > 0 ? (
          positions.map(position => (
            <PositionCard key={position.id} position={position} />
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Active Positions</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              You don't have any open arbitrage positions right now. Go to the dashboard to find new funding opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
