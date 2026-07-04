import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Clock, Shield, Target, Activity, FileText, Download } from 'lucide-react';
import { Position } from '../types';
import { useMarketDataStore } from '../services/marketData';
import { formatCurrency, formatPercent, cn } from '../utils';

interface PositionSummaryModalProps {
  position: Position;
  onClose: () => void;
}

export function PositionSummaryModal({ position, onClose }: PositionSummaryModalProps) {
  const store = useMarketDataStore();
  const marketData = store.marketData[`${position.exchange}-${position.symbol}`];
  
  const [activeTab, setActiveTab] = useState<'Summary' | 'Arbitrage' | 'Funding' | 'Investment' | 'Charts'>('Summary');

  // Live values
  const spotPrice = marketData?.spotPrice || position.spotEntry;
  const futurePrice = marketData?.futurePrice || position.futureEntry;
  const currentSpread = marketData ? ((futurePrice - spotPrice) / spotPrice) * 100 : position.currentSpread;
  const fundingRate = marketData?.fundingRate || 0;
  const countdown = marketData?.countdown || '--:--:--';
  
  const spotValue = position.spotSize * spotPrice;
  const spotEntryValue = position.spotSize * position.spotEntry;
  const spotPnl = position.spotDirection === 'BUY' ? spotValue - spotEntryValue : spotEntryValue - spotValue;
  
  const futureValue = position.futureSize * futurePrice;
  const futureEntryValue = position.futureSize * position.futureEntry;
  const futurePnl = position.futureDirection === 'SELL' ? futureEntryValue - futureValue : futureValue - futureEntryValue;
  
  const spotFee = position.marginUsed * 0.001 * 2;
  const futureFee = position.marginUsed * position.leverage * 0.0005 * 2;
  const slippage = position.marginUsed * 0.0005;
  const totalCost = spotFee + futureFee + slippage;
  
  const totalPnl = spotPnl + futurePnl + position.fundingEarned - totalCost;
  const roi = (totalPnl / position.marginUsed) * 100;

  const recoveredPercent = totalCost > 0 ? (position.fundingEarned / totalCost) * 100 : 100;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              {position.symbol} <span className="text-sm font-normal text-slate-400 ml-2">Summary</span>
            </h2>
            <div className="h-6 w-px bg-slate-700"></div>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
              {position.exchange}
            </span>
            <span className={cn("text-xs font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center border", 
              position.tradeType === 'Positive Carry' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              {position.tradeType === 'Positive Carry' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {position.tradeType || 'Positive Carry'}
            </span>
            <span className="flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></div>
              {position.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Copy Details
            </button>
            <button className="flex items-center text-xs text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 border-b border-slate-800 bg-slate-950/30">
          {(['Summary', 'Arbitrage', 'Funding', 'Investment', 'Charts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab 
                  ? "border-indigo-500 text-indigo-400" 
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              {tab === 'Arbitrage' ? 'Arbitrage Positions' : 
               tab === 'Funding' ? 'Funding History' : 
               tab === 'Investment' ? 'Investment History' : 
               tab === 'Charts' ? 'Charts' : 'Summary'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          {activeTab === 'Summary' && (
            <div className="space-y-6">
              
              {/* Row 1: High level info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created Time</div>
                  <div className="text-sm text-slate-200 font-mono">2026-07-04 06:12:05</div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Running Duration</div>
                  <div className="text-sm text-slate-200 font-mono flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                    {position.duration}
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Position ID</div>
                  <div className="text-sm text-slate-200 font-mono truncate" title={position.id}>{position.id}</div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Next Funding</div>
                  <div className="text-sm text-indigo-400 font-mono font-bold">{countdown}</div>
                </div>
              </div>

              {/* Row 2: Live Market & Profit Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-indigo-400" /> Live Market Data
                    </h3>
                  </div>
                  <div className="p-5 space-y-4 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Current Spot Price</span>
                      <span className="text-sm font-mono font-bold text-white">{formatCurrency(spotPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Current Futures Price</span>
                      <span className="text-sm font-mono font-bold text-white">{formatCurrency(futurePrice)}</span>
                    </div>
                    <div className="h-px bg-slate-800 my-1"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Current Spread</span>
                      <span className="text-sm font-mono font-bold text-indigo-400">
                        {currentSpread > 0 ? '+' : ''}{currentSpread.toFixed(3)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Current Basis</span>
                      <span className="text-sm font-mono font-bold text-slate-300">
                        {formatCurrency(futurePrice - spotPrice)}
                      </span>
                    </div>
                    <div className="h-px bg-slate-800 my-1"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Live Funding Rate</span>
                      <span className={cn("text-sm font-mono font-bold", fundingRate >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {fundingRate > 0 ? '+' : ''}{fundingRate.toFixed(5)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" /> Profit Summary
                    </h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Total Investment</span>
                        <span className="text-sm font-mono font-bold text-white">{formatCurrency(position.marginUsed)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Spot Investment</span>
                        <span className="text-sm font-mono text-slate-300">{formatCurrency(spotEntryValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Futures Margin</span>
                        <span className="text-sm font-mono text-slate-300">{formatCurrency(futureEntryValue / position.leverage)}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-1"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Spot PnL</span>
                        <span className={cn("text-sm font-mono", spotPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {spotPnl > 0 ? '+' : ''}{formatCurrency(spotPnl)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Futures PnL</span>
                        <span className={cn("text-sm font-mono", futurePnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {futurePnl > 0 ? '+' : ''}{formatCurrency(futurePnl)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Funding Income Received</span>
                        <span className="text-sm font-mono font-bold text-emerald-400">+{formatCurrency(position.fundingEarned)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Trading Fees Paid</span>
                        <span className="text-sm font-mono text-rose-400">-{formatCurrency(spotFee + futureFee)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Slippage Cost</span>
                        <span className="text-sm font-mono text-rose-400">-{formatCurrency(slippage)}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-1"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-300">Net Profit</span>
                        <div className="flex items-center space-x-2">
                           <span className={cn("text-lg font-mono font-bold", totalPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {totalPnl > 0 ? '+' : ''}{formatCurrency(totalPnl)}
                          </span>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded", roi >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                            {roi > 0 ? '+' : ''}{roi.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          )}

          {activeTab === 'Arbitrage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-300">Spot Leg</h3>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase", position.spotDirection === 'BUY' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>{position.spotDirection}</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Order ID</span>
                      <span className="font-mono text-slate-300">S-{position.id.split('-')[0]}-{Math.floor(Math.random()*1000000)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Position Size</span>
                      <span className="font-mono text-slate-200">{position.spotSize.toFixed(4)} {position.symbol.replace('USDT', '')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Entry Price</span>
                      <span className="font-mono text-slate-200">{formatCurrency(position.spotEntry)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Price</span>
                      <span className="font-mono text-slate-200">{formatCurrency(spotPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-slate-800 pt-2 mt-2">
                      <span className="text-slate-300 font-semibold">Current PnL</span>
                      <span className={cn("font-mono font-bold", spotPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {spotPnl > 0 ? '+' : ''}{formatCurrency(spotPnl)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                  <div className="px-5 py-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-300">Futures Leg</h3>
                    <div className="flex space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded uppercase bg-indigo-500/20 text-indigo-400">{position.leverage}x</span>
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase", position.futureDirection === 'BUY' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>{position.futureDirection}</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Order ID</span>
                      <span className="font-mono text-slate-300">F-{position.id.split('-')[0]}-{Math.floor(Math.random()*1000000)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Position Size</span>
                      <span className="font-mono text-slate-200">{position.futureSize.toFixed(4)} {position.symbol.replace('USDT', '')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Entry Price</span>
                      <span className="font-mono text-slate-200">{formatCurrency(position.futureEntry)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current Price</span>
                      <span className="font-mono text-slate-200">{formatCurrency(futurePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Liquidation Price</span>
                      <span className="font-mono text-amber-400">{formatCurrency(position.liquidationPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-slate-800 pt-2 mt-2">
                      <span className="text-slate-300 font-semibold">Current PnL</span>
                      <span className={cn("font-mono font-bold", futurePnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {futurePnl > 0 ? '+' : ''}{formatCurrency(futurePnl)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Funding' && (
            <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-400">Event Time</th>
                    <th className="px-6 py-3 font-semibold text-slate-400 text-right">Funding Rate</th>
                    <th className="px-6 py-3 font-semibold text-slate-400 text-right">Payment</th>
                    <th className="px-6 py-3 font-semibold text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {position.logs?.filter(l => l.msg.includes('Funding Credited') || l.msg.includes('Funding Debited')).map((log, i) => {
                    const isCredit = log.msg.includes('Credited');
                    const amtMatch = log.msg.match(/([+-]?[\d.]+) USDT/);
                    const rateMatch = log.msg.match(/Rate: ([\d.-]+)%/);
                    const amt = amtMatch ? amtMatch[1] : '0.0000';
                    const rate = rateMatch ? rateMatch[1] : '0.0000';
                    
                    return (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 text-slate-300">{new Date().toLocaleDateString()} {log.time}</td>
                        <td className="px-6 py-4 text-right text-slate-300">{rate}%</td>
                        <td className={cn("px-6 py-4 text-right", isCredit ? "text-emerald-400" : "text-rose-400")}>
                          {isCredit ? '+' : ''}{amt} USDT
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 uppercase tracking-wider font-sans">Settled</span>
                        </td>
                      </tr>
                    );
                  }) || (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-sans">
                        No funding settlements recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          
          {activeTab === 'Charts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 h-80 flex flex-col items-center justify-center">
                  <Activity className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">Real-time Spot & Futures Spread Chart</p>
                  <p className="text-slate-600 text-sm mt-1">Collecting data points...</p>
                </div>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 h-80 flex flex-col items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">PnL & Funding Income Curve</p>
                  <p className="text-slate-600 text-sm mt-1">Waiting for initial settlements...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Investment' && (
             <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-900 border-b border-slate-800">
                 <tr>
                   <th className="px-6 py-3 font-semibold text-slate-400">Date & Time</th>
                   <th className="px-6 py-3 font-semibold text-slate-400">Action</th>
                   <th className="px-6 py-3 font-semibold text-slate-400 text-right">Amount</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                 <tr className="hover:bg-slate-800/30">
                   <td className="px-6 py-4">2026-07-04 06:12:05</td>
                   <td className="px-6 py-4 font-sans">Initial Capital Allocation</td>
                   <td className="px-6 py-4 text-right text-emerald-400">+{formatCurrency(position.marginUsed)}</td>
                 </tr>
                 <tr className="hover:bg-slate-800/30">
                   <td className="px-6 py-4">2026-07-04 06:12:06</td>
                   <td className="px-6 py-4 font-sans">Trading Fees Deducted</td>
                   <td className="px-6 py-4 text-right text-rose-400">-{formatCurrency(spotFee + futureFee)}</td>
                 </tr>
                 <tr className="hover:bg-slate-800/30">
                   <td className="px-6 py-4">2026-07-04 06:12:06</td>
                   <td className="px-6 py-4 font-sans">Estimated Slippage Impact</td>
                   <td className="px-6 py-4 text-right text-rose-400">-{formatCurrency(slippage)}</td>
                 </tr>
                 {position.logs?.filter(l => l.msg.includes('Funding Credited') || l.msg.includes('Funding Debited')).map((log, i) => {
                    const isCredit = log.msg.includes('Credited');
                    const amtMatch = log.msg.match(/([+-]?[\d.]+) USDT/);
                    const amt = amtMatch ? amtMatch[1] : '0.0000';
                    return (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4">{new Date().toLocaleDateString()} {log.time}</td>
                        <td className="px-6 py-4 font-sans">{isCredit ? 'Funding Income Credit' : 'Funding Income Debit'}</td>
                        <td className={cn("px-6 py-4 text-right", isCredit ? "text-emerald-400" : "text-rose-400")}>
                          {isCredit ? '+' : ''}${parseFloat(amt.replace('+', '')).toFixed(2)}
                        </td>
                      </tr>
                    )
                 })}
               </tbody>
             </table>
           </div>
          )}
        </div>
      </div>
    </div>
  );
}
