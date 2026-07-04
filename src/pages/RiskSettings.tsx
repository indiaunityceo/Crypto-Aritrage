import React, { useState } from 'react';
import { Shield, Save, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '../services/settingsStore';

export function RiskSettings() {
  const { maxHoldingTimeHours, minDailyFundingIncome, maxBreakEvenHours, minExpectedProfitAfterHolding, allowTradeBeyondMaxHolding, updateSettings } = useSettingsStore();
  
  const [maxHold, setMaxHold] = useState(maxHoldingTimeHours);
  const [minIncome, setMinIncome] = useState(minDailyFundingIncome);
  const [maxBreakEven, setMaxBreakEven] = useState(maxBreakEvenHours);
  const [minProfit, setMinProfit] = useState(minExpectedProfitAfterHolding);
  const [allowBeyond, setAllowBeyond] = useState(allowTradeBeyondMaxHolding);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({
      maxHoldingTimeHours: maxHold,
      minDailyFundingIncome: minIncome,
      maxBreakEvenHours: maxBreakEven,
      minExpectedProfitAfterHolding: minProfit,
      allowTradeBeyondMaxHolding: allowBeyond
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Risk Settings</h1>
        <p className="text-slate-400 mt-1">Configure global risk management parameters for the arbitrage engine.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-5 h-5 text-indigo-400 mr-2" />
            <h2 className="text-lg font-semibold text-white">Execution Risk Parameters</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">Maximum Holding Time (Hours)</label>
                <input 
                  type="number" 
                  value={maxHold}
                  onChange={(e) => setMaxHold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-xs text-slate-500">Positions will be warned if expected hold time exceeds this limit.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">Maximum Break-even Hours</label>
                <input 
                  type="number" 
                  value={maxBreakEven}
                  onChange={(e) => setMaxBreakEven(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-xs text-slate-500">Trades exceeding this break-even time will be rejected.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">Min. Daily Funding Income (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={minIncome}
                  onChange={(e) => setMinIncome(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">Min. Expected Profit (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={minProfit}
                  onChange={(e) => setMinProfit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Allow Trade Beyond Maximum Holding Time</h3>
                  <p className="text-xs text-slate-500 mt-1">If enabled, the bot will allow execution of trades that exceed the configured maximum holding time, rather than strictly rejecting them. A warning will still be displayed.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowBeyond(!allowBeyond)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    allowBeyond ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      allowBeyond ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center shadow-lg shadow-indigo-500/20"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Parameters
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
