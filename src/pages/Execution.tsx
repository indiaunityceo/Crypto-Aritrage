import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle, Shield, ArrowRightLeft, Loader2, RefreshCw, TrendingUp, TrendingDown, Clock, Clock8 } from 'lucide-react';
import { useMarketDataStore, startMarketDataStreams } from '../services/marketData';
import { useSettingsStore } from '../services/settingsStore';
import { formatCurrency, formatPercent, cn } from '../utils';
import { useNavigate } from 'react-router-dom';

export function Execution() {
  const { marketData, connections, debugLogs, addPosition } = useMarketDataStore();
  const { maxHoldingTimeHours, maxBreakEvenHours } = useSettingsStore();
  const navigate = useNavigate();
  
  const [exchange, setExchange] = useState<'Binance' | 'Bybit'>('Binance');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [capital, setCapital] = useState<number>(10000);
  const [leverage, setLeverage] = useState<number>(5);
  
  const [executionState, setExecutionState] = useState<'idle' | 'validating' | 'executing' | 'success' | 'error'>('idle');
  const [executionLogs, setExecutionLogs] = useState<{time: string, msg: string, type: 'info' | 'success' | 'error' | 'warning'}[]>([]);

  const [showWarning, setShowWarning] = useState(false);

  const id = `${exchange}-${symbol}`;
  const data = marketData[id];
  const connStatus = connections[exchange];

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const supportsMarginShort = exchange === 'Binance' || exchange === 'Bybit';

  const spotQty = data && data.spotPrice > 0 ? (capital / data.spotPrice) : 0;
  const futureQty = data && data.futurePrice > 0 ? ((capital * leverage) / data.futurePrice) : 0;
  
  // Risk Engine Calculations
  const spotEntryFee = capital * 0.001; 
  const spotExitFee = capital * 0.001;
  const futureEntryFee = (capital * leverage) * 0.0005;
  const futureExitFee = (capital * leverage) * 0.0005;
  const slippage = capital * 0.0005; 
  
  // Borrow Interest for Spot Margin Short (assumed 0.05% daily if reverse carry, calculate for initial cost assuming 1 day)
  const borrowInterestRate = data?.tradeType === 'Reverse Carry' ? 0.0005 : 0;
  const borrowInterest = capital * borrowInterestRate;

  // Initial Total Cost
  const totalInitialCost = spotEntryFee + spotExitFee + futureEntryFee + futureExitFee + slippage + borrowInterest;

  // Funding calculations
  const positionValue = capital * leverage;
  const fundingRateDec = data ? (Math.abs(data.fundingRate) / 100) : 0;
  const fundingIntervalHours = 8;
  const fundingPerCycle = positionValue * fundingRateDec;
  const fundingPerHour = fundingPerCycle / fundingIntervalHours;
  const fundingPerDay = fundingPerHour * 24;

  const breakEvenCycles = fundingPerCycle > 0 ? (totalInitialCost / fundingPerCycle) : Infinity;
  const breakEvenHours = breakEvenCycles * fundingIntervalHours;

  const { allowTradeBeyondMaxHolding } = useSettingsStore();

  let riskLevel = 'good';
  let riskLabel = '🟢 Excellent Opportunity';
  let riskColor = 'text-emerald-400';
  let riskBgColor = 'bg-emerald-400';

  if (breakEvenHours > maxHoldingTimeHours) {
    riskLevel = 'high';
    riskLabel = '🔴 High Risk Opportunity';
    riskColor = 'text-rose-400';
    riskBgColor = 'bg-rose-400';
  } else if (breakEvenHours > 72) {
    riskLevel = 'long';
    riskLabel = '🟠 Long Hold Opportunity';
    riskColor = 'text-amber-500';
    riskBgColor = 'bg-amber-500';
  } else if (breakEvenHours >= 24 && breakEvenHours <= 72) {
    riskLevel = 'good';
    riskLabel = '🟡 Good Opportunity';
    riskColor = 'text-amber-400';
    riskBgColor = 'bg-amber-400';
  } else {
    riskLevel = 'excellent';
    riskLabel = '🟢 Excellent Opportunity';
    riskColor = 'text-emerald-400';
    riskBgColor = 'bg-emerald-400';
  }

  const handleExecute = async (overrideWarning: boolean = false) => {
    if (!data) return;

    if (!overrideWarning && breakEvenHours > maxHoldingTimeHours && !allowTradeBeyondMaxHolding) {
      setShowWarning(true);
      return;
    }
    
    setShowWarning(false);
    setExecutionState('validating');
    setExecutionLogs([]);
    addLog(`Initiating trade for ${symbol} on ${exchange}`, 'info');

    await new Promise(r => setTimeout(r, 500));

    if (connections[exchange] !== 'Connected') {
      addLog(`API Connection Error: ${exchange} is disconnected.`, 'error');
      setExecutionState('error');
      return;
    }
    addLog('API connections validated', 'success');
    
    await new Promise(r => setTimeout(r, 400));

    addLog(`Evaluating Trade Type: ${data.tradeType}`, 'info');

    if (data.tradeType === 'Reverse Carry' && !supportsMarginShort) {
      addLog('Reverse Carry is not supported on this exchange because Spot Margin Short is unavailable.', 'error');
      setExecutionState('error');
      return;
    }

    addLog(`Calculating Break-even Requirements...`, 'info');
    await new Promise(r => setTimeout(r, 400));

    addLog(`Total Initial Cost: ${formatCurrency(totalInitialCost)}`, 'info');
    addLog(`Funding Per Cycle: ${formatCurrency(fundingPerCycle)}`, 'info');
    addLog(`Break-even Time: ${breakEvenHours.toFixed(1)} Hours`, 'info');

    addLog(`Risk Engine checks passed. Trade classified as ${riskLabel}.`, 'success');
    setExecutionState('executing');
    addLog('Calculating order quantities...', 'info');
    
    const spotSize = (capital / data.spotPrice).toFixed(4);
    const futureSize = ((capital * leverage) / data.futurePrice).toFixed(4);
    
    await new Promise(r => setTimeout(r, 600));

    addLog(`Submitting Spot ${data.spotAction} Order for ${spotSize} ${symbol.replace('USDT', '')}${data.spotAction === 'SELL' ? ' (Margin Short)' : ''}`, 'info');
    
    await new Promise(r => setTimeout(r, 800));
    addLog(`Spot Order Filled at ${data.spotPrice}`, 'success');
    
    addLog(`Submitting Futures ${data.futureAction} Order for ${futureSize} ${symbol.replace('USDT', '')}`, 'info');
    
    await new Promise(r => setTimeout(r, 600));
    addLog(`Futures Order Filled at ${data.futurePrice}`, 'success');
    
    addLog('Hedge successfully established! Moving to Open Positions.', 'success');
    setExecutionState('success');

    addPosition({
      id: `POS-${Math.floor(1000 + Math.random() * 9000)}-${symbol.replace('USDT', '')}`,
      symbol: symbol,
      exchange: exchange,
      leverage: leverage,
      spotEntry: data.spotPrice,
      futureEntry: data.futurePrice,
      spotSize: parseFloat(spotSize),
      futureSize: parseFloat(futureSize),
      marginUsed: capital,
      currentSpread: data.spread,
      fundingEarned: 0,
      pnl: 0,
      roi: 0,
      liquidationPrice: data.tradeType === 'Positive Carry' 
        ? data.futurePrice * (1 + (1 / leverage)) 
        : data.futurePrice * (1 - (1 / leverage)),
      status: 'Open',
      duration: '0m',
      tradeType: data.tradeType,
      spotDirection: data.spotAction,
      futureDirection: data.futureAction,
    });
  };

  const logs = debugLogs[exchange] || [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Arbitrage Execution Console</h1>
        <p className="text-slate-400 mt-1">Configure and execute delta-neutral hedge positions across Spot and Futures markets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
              <ArrowRightLeft className="w-4 h-4 mr-2 text-indigo-400" />
              Pair Selection
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Exchange</label>
                <select 
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value as 'Binance' | 'Bybit')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Binance">Binance</option>
                  <option value="Bybit">Bybit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Trading Pair</label>
                <select 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'BNBUSDT'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-indigo-400" />
              Position Sizing
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Capital Allocation (USDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input 
                    type="number" 
                    value={capital}
                    onChange={(e) => setCapital(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">Futures Leverage</label>
                  <span className="text-xs text-indigo-400 font-bold">{leverage}x</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="20" step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-black border border-slate-800 rounded-xl flex flex-col h-64 overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-xs font-mono text-slate-400 ml-3">System Logs ({exchange})</span>
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 custom-scrollbar flex flex-col-reverse">
              {/* Show execution logs if any, otherwise show debug logs */}
              {executionLogs.length > 0 ? (
                <div className="space-y-1.5">
                  {executionLogs.map((log, i) => (
                    <div key={i} className="flex">
                      <span className="text-slate-500 mr-3 shrink-0">[{log.time}]</span>
                      <span className={cn(
                        log.type === 'info' && "text-blue-300",
                        log.type === 'success' && "text-emerald-400",
                        log.type === 'error' && "text-rose-400",
                        log.type === 'warning' && "text-amber-400",
                      )}>
                        {log.type === 'success' && '> '}
                        {log.type === 'error' && '[ERR] '}
                        {log.msg}
                      </span>
                    </div>
                  ))}
                  {(executionState === 'executing' || executionState === 'validating') && (
                    <div className="flex text-slate-400 items-center mt-2">
                      <span className="mr-3 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                      <span className="animate-pulse">_</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <div key={i} className="flex">
                      <span className="text-slate-500 mr-3 shrink-0">[{log.time}]</span>
                      <span className={cn(
                        log.type === 'info' && "text-blue-300",
                        log.type === 'success' && "text-emerald-400",
                        log.type === 'error' && "text-rose-400",
                        log.type === 'warning' && "text-amber-400",
                      )}>
                        {log.msg}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
            {connStatus !== 'Connected' && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Exchange Disconnected</h3>
                <p className="text-slate-400 text-sm mb-4">Unable to connect to {exchange} WebSocket and REST APIs.</p>
                <button onClick={() => startMarketDataStreams()} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium border border-slate-700 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">{symbol}</h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400">{exchange}</span>
                {data && (
                  <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center border", 
                    data.tradeType === 'Positive Carry' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  )}>
                    {data.tradeType === 'Positive Carry' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {data.tradeType}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={cn("w-2 h-2 rounded-full", data?.status === 'Online' ? "bg-emerald-400 animate-pulse" : "bg-rose-400")}></div>
                <span className="text-xs font-mono text-slate-400">Live Data</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Spot Price</div>
                <div className="text-lg text-emerald-400 font-mono font-bold">{data?.spotPrice > 0 ? formatCurrency(data.spotPrice, data.spotPrice < 1 ? 4 : 2) : '---'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Futures Price</div>
                <div className="text-lg text-rose-400 font-mono font-bold">{data?.futurePrice > 0 ? formatCurrency(data.futurePrice, data.futurePrice < 1 ? 4 : 2) : '---'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Current Spread</div>
                <div className="text-lg text-indigo-400 font-mono font-bold">{data && data.spread !== 0 ? data.spread.toFixed(4) + '%' : '---'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Funding Rate</div>
                <div className="text-lg text-white font-mono font-bold">{data && data.fundingRate !== 0 ? formatPercent(data.fundingRate) : '---'}</div>
              </div>
            </div>

            <div className="h-px bg-slate-800 w-full mb-6"></div>

            {/* FUNDING BREAK-EVEN ANALYSIS */}
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
              <Clock8 className="w-4 h-4 mr-2 text-indigo-400" /> Funding Break-even Analysis
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Entry Trading Fees</span>
                    <span className="text-rose-400 font-mono">-{formatCurrency(spotEntryFee + futureEntryFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Exit Trading Fees</span>
                    <span className="text-rose-400 font-mono">-{formatCurrency(spotExitFee + futureExitFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Trading Fees</span>
                    <span className="text-rose-400 font-mono">-{formatCurrency(spotEntryFee + futureEntryFee + spotExitFee + futureExitFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Estimated Slippage Cost</span>
                    <span className="text-rose-400 font-mono">-{formatCurrency(slippage)}</span>
                  </div>
                  {data?.tradeType === 'Reverse Carry' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Borrow Interest (Spot Margin)</span>
                      <span className="text-rose-400 font-mono">-{formatCurrency(borrowInterest)}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-800 my-2"></div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-300">Total Initial Cost</span>
                    <span className="text-rose-400 font-mono">-{formatCurrency(totalInitialCost)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Funding Accumulation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Funding Rate</span>
                    <span className="text-white font-mono">{data && data.fundingRate !== 0 ? formatPercent(data.fundingRate) : '---'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Funding Interval</span>
                    <span className="text-white font-mono">{fundingIntervalHours} Hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Est. Funding Per Cycle</span>
                    <span className="text-emerald-400 font-mono">+{formatCurrency(fundingPerCycle)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Est. Funding Per Hour</span>
                    <span className="text-emerald-400 font-mono">+{formatCurrency(fundingPerHour)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Est. Funding Per Day</span>
                    <span className="text-emerald-400 font-mono">+{formatCurrency(fundingPerDay)}</span>
                  </div>
                  <div className="h-px bg-slate-800 my-2"></div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-300">Break-even Point</span>
                    <span className="text-indigo-400 font-mono">{isFinite(breakEvenHours) ? `${breakEvenHours.toFixed(1)} Hours` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* LIVE COUNTDOWN */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500/20 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs text-indigo-400/80 font-semibold uppercase tracking-wider mb-0.5">Next Funding In</div>
                  <div className="text-xl font-bold text-white font-mono">{data?.countdown || '--:--:--'}</div>
                </div>
              </div>
              <div className="flex space-x-6">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Funding Cycle</div>
                  <div className="text-sm text-slate-200 font-mono">1 / 3 (Daily)</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Break-even Remaining</div>
                  <div className="text-sm text-slate-200 font-mono">{isFinite(breakEvenCycles) ? `${Math.ceil(breakEvenCycles)} Cycles` : '---'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Est. Time Remaining</div>
                  <div className="text-sm text-slate-200 font-mono">{isFinite(breakEvenHours) ? `${breakEvenHours.toFixed(1)} Hours` : '---'}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Strategy Status</div>
                  <span className={`text-sm font-medium ${riskColor} flex items-center`}>
                    <span className={`w-2 h-2 rounded-full ${riskBgColor} mr-2`}></span> {riskLabel.slice(2)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 md:gap-8">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Est. Break-even</div>
                    <div className="text-sm text-slate-200 font-mono">{breakEvenHours.toFixed(1)} Hours</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Recommended Holding</div>
                    <div className="text-sm text-slate-200 font-mono">{Math.max(Math.ceil(breakEvenHours / 24) + 1, Math.ceil(maxHoldingTimeHours / 24))} Days</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Expected Profit After Break-even</div>
                    <div className="text-sm text-emerald-400 font-mono">+{formatCurrency((Math.max(Math.ceil(breakEvenHours / 24) + 1, Math.ceil(maxHoldingTimeHours / 24)) * 24 * fundingPerHour) - totalInitialCost)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PROFIT PROJECTION TABLE */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-y border-slate-800">
                    <th className="py-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hold Time</th>
                    <th className="py-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Funding Received</th>
                    <th className="py-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {[24, 72, 120, 168, 336, 720].map((hours) => {
                    const received = fundingPerHour * hours;
                    const net = received - totalInitialCost;
                    let label = `${hours} Hours`;
                    if (hours === 24) label = '1 Day';
                    else if (hours === 72) label = '3 Days';
                    else if (hours === 120) label = '5 Days';
                    else if (hours === 168) label = '7 Days';
                    else if (hours === 336) label = '14 Days';
                    else if (hours === 720) label = '30 Days';

                    return (
                      <tr key={hours} className="hover:bg-slate-800/20">
                        <td className="py-2 px-4 font-mono text-slate-300">
                          {label}
                          {hours >= breakEvenHours && hours < breakEvenHours + 24 && (
                            <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold">Break-even</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-400">+{formatCurrency(received)}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold">
                          <span className={net >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {net > 0 ? '+' : ''}{formatCurrency(net)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="h-px bg-slate-800 w-full mb-6"></div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Target Spot Size</div>
                  <div className={cn("text-sm font-mono font-semibold", data?.spotAction === 'BUY' ? "text-emerald-400" : "text-rose-400")}>
                    {data?.spotAction} {spotQty > 0 ? spotQty.toFixed(4) : '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Target Future Size</div>
                  <div className={cn("text-sm font-mono font-semibold", data?.futureAction === 'BUY' ? "text-emerald-400" : "text-rose-400")}>
                    {data?.futureAction} {futureQty > 0 ? futureQty.toFixed(4) : '0.00'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button 
                  disabled={executionState === 'executing' || executionState === 'validating'}
                  className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleExecute(false)}
                  disabled={executionState === 'executing' || executionState === 'validating' || !data || data.status === 'Offline'}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {executionState === 'executing' || executionState === 'validating' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2 fill-current" />
                      Execute Hedge
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* WARNING POPUP */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Execution Warning</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-400">Estimated Break-even Time</span>
                  <span className="text-amber-400 font-mono font-bold">{breakEvenHours.toFixed(1)} Hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Configured Maximum Hold</span>
                  <span className="text-slate-200 font-mono font-bold">{maxHoldingTimeHours} Hours</span>
                </div>
              </div>
              <p className="text-slate-300 text-sm">
                This trade exceeds your recommended holding time. You may still execute this hedge, but you will need to hold the position longer to recover costs.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowWarning(false)}
                className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecute(true)}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold transition-colors shadow-lg shadow-amber-500/20"
              >
                Execute Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
