import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '../utils';
import { useMarketDataStore } from '../services/marketData';
import { useNavigate } from 'react-router-dom';

const pnlData = [
  { name: 'Mon', pnl: 4000 },
  { name: 'Tue', pnl: 3000 },
  { name: 'Wed', pnl: 2000 },
  { name: 'Thu', pnl: 2780 },
  { name: 'Fri', pnl: 1890 },
  { name: 'Sat', pnl: 2390 },
  { name: 'Sun', pnl: 3490 },
];

export function Dashboard() {
  const { marketData, positions, connections } = useMarketDataStore();
  const navigate = useNavigate();

  const activePositions = positions.filter(p => p.status === 'Open');
  const totalMargin = activePositions.reduce((sum, p) => sum + p.marginUsed, 0);
  const totalFunding = activePositions.reduce((sum, p) => sum + p.fundingEarned, 0);

  const bestOpps = Object.values(marketData)
    .filter(d => d.status === 'Online')
    .sort((a, b) => b.expectedRoi - a.expectedRoi)
    .slice(0, 3);

  const needsKeys = connections['Binance'] === 'Invalid Keys' || connections['Bybit'] === 'Invalid Keys';

  return (
    <div className="space-y-6">
      {needsKeys && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-medium text-amber-500">API Configuration Required</h3>
              <p className="text-sm text-amber-400/80 mt-0.5">You need to configure your exchange API keys to stream live data.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/settings/api')}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Configure Keys
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1">Your portfolio and arbitrage metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Capital Deployed"
          value={formatCurrency(totalMargin)}
          icon={Wallet}
          trend="+2.4%"
          isPositive={true}
        />
        <StatCard
          title="Active Hedges"
          value={activePositions.length.toString()}
          icon={Activity}
          trend="Stable"
          isPositive={true}
        />
        <StatCard
          title="Total Funding Earned"
          value={formatCurrency(totalFunding)}
          icon={DollarSign}
          trend="+12.5%"
          isPositive={true}
        />
        <StatCard
          title="Avg. Portfolio ROI"
          value="18.4%"
          icon={TrendingUp}
          trend="+1.2%"
          isPositive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Cumulative Funding PnL</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPnl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Top Live Opportunities</h3>
          <div className="flex-1 space-y-4">
            {bestOpps.length > 0 ? bestOpps.map((opp) => (
              <div key={opp.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-slate-200">{opp.symbol}</div>
                    <div className="text-xs text-slate-400">{opp.exchange}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-emerald-400 font-semibold">{opp.spread.toFixed(4)}%</div>
                    <div className="text-[10px] text-slate-500 uppercase">Spread</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Funding Rate</div>
                    <div className="font-mono text-sm text-slate-300">{formatPercent(opp.fundingRate)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Est. ROI</div>
                    <div className="font-mono text-sm text-indigo-400 font-bold">{opp.expectedRoi.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p>No live data available</p>
                <button onClick={() => navigate('/settings/api')} className="mt-2 text-indigo-400 text-sm hover:underline">Configure API</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, isPositive }: { title: string, value: string, icon: any, trend: string, isPositive: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-white font-mono">{value}</div>
        <div className={`flex items-center text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  );
}
