import React, { useState } from 'react';
import { Save, ShieldAlert, Key, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useExchangeStore } from '../services/exchangeStore';
import { useMarketDataStore, startMarketDataStreams } from '../services/marketData';
import { cn } from '../utils';

export function Settings() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">API Settings</h1>
        <p className="text-slate-400 mt-1">Configure your exchange API connections.</p>
      </div>

      <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-rose-400">Security Notice</h3>
          <p className="text-sm text-rose-300/80 mt-1 leading-relaxed">
            API keys are stored securely and encrypted locally. Ensure your API keys have <strong>Withdrawals DISABLED</strong>. Validating keys requires connecting to the official exchange APIs.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <ExchangeForm name="Binance" endpoint="/api/validate/binance" />
        <ExchangeForm name="Bybit" endpoint="/api/validate/bybit" />
      </div>
    </div>
  );
}

function ExchangeForm({ name, endpoint }: { name: string, endpoint: string }) {
  const { keys, setKeys } = useExchangeStore();
  const { connections, setConnectionStatus } = useMarketDataStore();
  
  const currentKeys = keys[name] ? useExchangeStore.getState().getKeys(name) : { apiKey: '', apiSecret: '' };
  
  const [apiKey, setApiKey] = useState(currentKeys?.apiKey || '');
  const [apiSecret, setApiSecret] = useState(currentKeys?.apiSecret || '');
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<{time: string, msg: string, type: string}[]>([]);

  const handleSave = async () => {
    setIsValidating(true);
    setValidationResult(null);
    setDebugLogs([]);
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret })
      });
      
      const data = await res.json();
      setDebugLogs(data.logs || []);
      
      if (data.success) {
        setValidationResult({
          success: true,
          spot: data.spotEnabled,
          futures: data.futuresEnabled,
          account: data.account
        });
        
        // Save to local store if valid
        setKeys(name, { apiKey, apiSecret });
        setConnectionStatus(name, 'Connected');
        
        // Auto-reconnect streams
        setTimeout(() => {
          startMarketDataStreams();
        }, 1000);
      } else {
        setValidationResult({
          success: false,
          error: data.error,
          code: data.code
        });
        setConnectionStatus(name, 'Invalid Keys');
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        error: err.message || 'Validation request failed'
      });
      setConnectionStatus(name, 'Error');
    } finally {
      setIsValidating(false);
    }
  };

  const isConnected = connections[name] === 'Connected';
  const status = connections[name];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-2">
      <div className="p-6 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{name} Configuration</h2>
          {status === 'Connected' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Connected
            </span>
          )}
          {status === 'Connecting' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
              Connecting...
            </span>
          )}
          {(status === 'Disconnected' || status === 'Error' || status === 'Invalid Keys') && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
              {status}
            </span>
          )}
        </div>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${name} API Key`}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow font-mono placeholder:font-sans"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">API Secret</label>
            <div className="relative">
              <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={`Enter ${name} API Secret`}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow font-mono placeholder:font-sans"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isValidating || !apiKey || !apiSecret}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating & Testing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Validate
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-950 flex flex-col h-full min-h-[350px]">
        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <span className="text-xs font-mono text-slate-400 font-semibold uppercase">API Validation Console</span>
          {validationResult?.success && <span className="text-xs font-medium text-emerald-400 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Passed</span>}
          {validationResult && !validationResult.success && <span className="text-xs font-medium text-rose-400 flex items-center"><XCircle className="w-3 h-3 mr-1" /> Failed</span>}
        </div>
        
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 custom-scrollbar">
          {debugLogs.length === 0 && !isValidating && !validationResult && (
            <div className="text-slate-600 h-full flex items-center justify-center text-center px-4">
              Enter API keys and click Save & Validate to test the connection.
            </div>
          )}
          
          {debugLogs.map((log, i) => (
            <div key={i} className="flex">
              <span className="text-slate-500 mr-3 shrink-0">[{log.time}]</span>
              <span className={cn(
                log.type === 'info' && "text-slate-300",
                log.type === 'success' && "text-emerald-400",
                log.type === 'error' && "text-rose-400 font-medium",
                log.type === 'warning' && "text-amber-400",
              )}>
                {log.type === 'success' && '✓ '}
                {log.type === 'error' && '✗ '}
                {log.msg}
              </span>
            </div>
          ))}

          {isValidating && (
            <div className="flex text-slate-400 items-center mt-2">
              <span className="mr-3 shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className="animate-pulse flex items-center"><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> _</span>
            </div>
          )}
        </div>

        {validationResult && (
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            {validationResult.success ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2 rounded border border-emerald-500/20">
                  <span className="text-slate-500 block mb-0.5">Spot API</span>
                  <span className="text-emerald-400 font-medium">{validationResult.spot ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-emerald-500/20">
                  <span className="text-slate-500 block mb-0.5">Futures API</span>
                  <span className="text-emerald-400 font-medium">{validationResult.futures ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-emerald-500/20">
                  <span className="text-slate-500 block mb-0.5">Account</span>
                  <span className="text-emerald-400 font-medium">{validationResult.account}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-emerald-500/20">
                  <span className="text-slate-500 block mb-0.5">API Status</span>
                  <span className="text-emerald-400 font-medium">Ready</span>
                </div>
              </div>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start space-x-2 text-rose-400 text-xs">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Validation Failed</div>
                  <div>Error: {validationResult.error}</div>
                  {validationResult.code && <div>Code: {validationResult.code}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
