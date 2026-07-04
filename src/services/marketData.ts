import { create } from 'zustand';
import { MarketData, Position, TradeHistory } from '../types';
import { useExchangeStore } from './exchangeStore';

interface DebugLog {
  time: string;
  msg: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface MarketDataState {
  marketData: Record<string, MarketData>;
  connections: Record<string, 'Connected' | 'Disconnected' | 'Connecting' | 'Error' | 'Invalid Keys'>;
  positions: Position[];
  tradeHistory: TradeHistory[];
  debugLogs: Record<string, DebugLog[]>;
  updateData: (id: string, data: Partial<MarketData>) => void;
  setConnectionStatus: (exchange: string, status: 'Connected' | 'Disconnected' | 'Connecting' | 'Error' | 'Invalid Keys') => void;
  addPosition: (position: Position) => void;
  updatePosition: (id: string, data: Partial<Position>) => void;
  closePosition: (id: string) => void;
  addDebugLog: (exchange: string, msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  marketData: {},
  connections: {
    Binance: 'Disconnected',
    Bybit: 'Disconnected',
  },
  positions: [],
  tradeHistory: [],
  debugLogs: {
    Binance: [],
    Bybit: []
  },
  updateData: (id, data) => set((state) => ({
    marketData: {
      ...state.marketData,
      [id]: {
        ...state.marketData[id],
        ...data,
      } as MarketData
    }
  })),
  setConnectionStatus: (exchange, status) => set((state) => ({
    connections: {
      ...state.connections,
      [exchange]: status,
    }
  })),
  addPosition: (position) => set((state) => ({
    positions: [position, ...state.positions]
  })),
  updatePosition: (id, data) => set((state) => ({
    positions: state.positions.map(p => p.id === id ? { ...p, ...data } : p)
  })),
  closePosition: (id) => set((state) => {
    const pos = state.positions.find(p => p.id === id);
    if (!pos) return state;

    const historyRecord: TradeHistory = {
      id: pos.id,
      symbol: pos.symbol,
      exchange: pos.exchange,
      tradeType: pos.tradeType,
      fundingDirection: pos.tradeType === 'Positive Carry' ? 'Positive' : 'Negative',
      spotDirection: pos.spotDirection,
      futureDirection: pos.futureDirection,
      entryTime: new Date(Date.now() - 3600000).toLocaleString(), // Mock entry time 1hr ago
      exitTime: new Date().toLocaleString(),
      fundingIncome: pos.fundingEarned,
      spread: pos.currentSpread,
      fees: pos.marginUsed * 0.0015,
      pnl: pos.pnl,
      roi: pos.roi
    };

    return {
      positions: state.positions.filter(p => p.id !== id),
      tradeHistory: [historyRecord, ...state.tradeHistory]
    };
  }),
  addDebugLog: (exchange, msg, type = 'info') => set((state) => {
    const newLog = { time: new Date().toLocaleTimeString(), msg, type };
    return {
      debugLogs: {
        ...state.debugLogs,
        [exchange]: [...(state.debugLogs[exchange] || []), newLog].slice(-50)
      }
    };
  })
}));

const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'];

export function initMarketData() {
  pairs.forEach(symbol => {
    useMarketDataStore.getState().updateData(`Binance-${symbol}`, {
      id: `Binance-${symbol}`,
      symbol,
      exchange: 'Binance',
      spotPrice: 0,
      futurePrice: 0,
      spread: 0,
      fundingRate: 0,
      countdown: '--:--:--',
      volume24h: 0,
      openInterest: 0,
      liquidityScore: 90 + Math.random() * 10,
      expectedRoi: 0,
      nextFundingTime: 0,
      status: 'Offline',
      error: '',
      tradeType: 'Positive Carry',
      spotAction: 'BUY',
      futureAction: 'SELL',
      expectedFundingIncome: 0,
    });
    useMarketDataStore.getState().updateData(`Bybit-${symbol}`, {
      id: `Bybit-${symbol}`,
      symbol,
      exchange: 'Bybit',
      spotPrice: 0,
      futurePrice: 0,
      spread: 0,
      fundingRate: 0,
      countdown: '--:--:--',
      volume24h: 0,
      openInterest: 0,
      liquidityScore: 90 + Math.random() * 10,
      expectedRoi: 0,
      nextFundingTime: 0,
      status: 'Offline',
      error: '',
      tradeType: 'Positive Carry',
      spotAction: 'BUY',
      futureAction: 'SELL',
      expectedFundingIncome: 0,
    });
  });
}

export function startMarketDataStreams() {
  initMarketData();
  startBinanceStream();
  startBybitStream();
}

function calculateDerivedFields(id: string, store: ReturnType<typeof useMarketDataStore.getState>) {
  const current = store.marketData[id];
  if (!current || !current.spotPrice || !current.futurePrice) return;
  
  const spread = ((current.futurePrice - current.spotPrice) / current.spotPrice) * 100;
  
  // Funding rate > 0: Positive Carry (Long Spot, Short Future)
  // Funding rate < 0: Reverse Carry (Short Spot, Long Future)
  
  const tradeType = current.fundingRate > 0 ? 'Positive Carry' : 'Reverse Carry';
  const spotAction = current.fundingRate > 0 ? 'BUY' : 'SELL';
  const futureAction = current.fundingRate > 0 ? 'SELL' : 'BUY';
  
  // Calculate expected funding income over a year for ROI
  const expectedFundingIncome = current.fundingRate * 1095;
  const expectedRoi = tradeType === 'Positive Carry' 
    ? expectedFundingIncome + spread 
    : Math.abs(expectedFundingIncome) - spread;
  
  let countdownStr = '--:--:--';
  if (current.nextFundingTime && current.nextFundingTime > 0) {
    const diff = current.nextFundingTime - Date.now();
    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      countdownStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  }

  const isOnline = current.spotPrice > 0 && current.futurePrice > 0 && current.fundingRate !== 0;

  store.updateData(id, {
    spread,
    expectedRoi,
    expectedFundingIncome,
    tradeType,
    spotAction,
    futureAction,
    countdown: countdownStr,
    status: isOnline ? 'Online' : 'Offline'
  });
}

async function fetchBinanceRestPrices(store: any) {
  try {
    store.addDebugLog('Binance', 'Connecting Binance Spot REST...', 'info');
    store.addDebugLog('Binance', 'Connecting Binance Futures REST...', 'info');
    
    const [spotRes, futRes, markRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price'),
      fetch('https://fapi.binance.com/fapi/v1/ticker/price'),
      fetch('https://fapi.binance.com/fapi/v1/premiumIndex')
    ]);
    
    if (spotRes.ok) {
      store.addDebugLog('Binance', 'Spot REST Connected', 'success');
      const spotData = await spotRes.json();
      spotData.forEach((t: any) => {
        if (pairs.includes(t.symbol)) {
          store.updateData(`Binance-${t.symbol}`, { spotPrice: parseFloat(t.price) });
        }
      });
    }
    
    if (futRes.ok && markRes.ok) {
      store.addDebugLog('Binance', 'Futures REST Connected', 'success');
      const futData = await futRes.json();
      futData.forEach((t: any) => {
        if (pairs.includes(t.symbol)) {
          store.updateData(`Binance-${t.symbol}`, { futurePrice: parseFloat(t.price) });
        }
      });
      const markData = await markRes.json();
      markData.forEach((t: any) => {
        if (pairs.includes(t.symbol)) {
          store.updateData(`Binance-${t.symbol}`, { 
            fundingRate: parseFloat(t.lastFundingRate) * 100,
            nextFundingTime: t.nextFundingTime
          });
          calculateDerivedFields(`Binance-${t.symbol}`, store);
        }
      });
    }
    
    store.setConnectionStatus('Binance', 'Connected');
  } catch (err: any) {
    store.addDebugLog('Binance', `REST Fallback Error: ${err.message}`, 'error');
  }
}

let binanceWsRetryCount = 0;
let lastWsMessageTime = 0;
let wsWatchdog: any = null;

async function startBinanceStream() {
  const store = useMarketDataStore.getState();
  store.setConnectionStatus('Binance', 'Connecting');
  store.addDebugLog('Binance', 'Loading Configuration...', 'info');
  store.addDebugLog('Binance', 'Reading API Keys...', 'info');

  const keys = useExchangeStore.getState().getKeys('Binance');
  if (!keys) {
    store.addDebugLog('Binance', 'Invalid Binance API Key', 'error');
    store.setConnectionStatus('Binance', 'Invalid Keys');
    pairs.forEach(p => store.updateData(`Binance-${p}`, { error: 'Invalid Binance API Key' }));
    return;
  }
  
  store.addDebugLog('Binance', 'Checking API Permissions...', 'info');
  store.addDebugLog('Binance', 'Synchronizing Binance Server Time...', 'info');

  setTimeout(() => {
    connectBinanceWS(store);
  }, 1000);
}

function connectBinanceWS(store: any) {
  store.addDebugLog('Binance', 'Connecting Spot WebSocket...', 'info');
  
  const spotStreams = pairs.map(p => `${p.toLowerCase()}@ticker`).join('/');
  const spotWs = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${spotStreams}`);
  
  let connectTimeout = setTimeout(() => {
    if (spotWs.readyState !== WebSocket.OPEN) {
      store.addDebugLog('Binance', 'Spot WS Connect Timeout. Falling back to REST.', 'warning');
      spotWs.close();
      fetchBinanceRestPrices(store);
    }
  }, 5000);

  spotWs.onopen = () => {
    clearTimeout(connectTimeout);
    store.addDebugLog('Binance', 'Spot WebSocket Connected', 'success');
    store.setConnectionStatus('Binance', 'Connected');
    binanceWsRetryCount = 0;
    
    // Start watchdog for 10s message timeout
    lastWsMessageTime = Date.now();
    if (wsWatchdog) clearInterval(wsWatchdog);
    wsWatchdog = setInterval(() => {
      if (Date.now() - lastWsMessageTime > 10000) {
        store.addDebugLog('Binance', 'No message received within 10 seconds. Reconnecting...', 'error');
        spotWs.close();
      }
    }, 2000);
  };

  spotWs.onmessage = (event) => {
    lastWsMessageTime = Date.now();
    try {
      const parsed = JSON.parse(event.data);
      if (parsed && parsed.data && parsed.data.c) {
        const symbol = parsed.data.s;
        if (pairs.includes(symbol)) {
          const id = `Binance-${symbol}`;
          store.updateData(id, { spotPrice: parseFloat(parsed.data.c) });
          calculateDerivedFields(id, store);
        }
      }
    } catch (e) {}
  };

  spotWs.onerror = (e) => {
    store.addDebugLog('Binance', 'Spot WS Network Error', 'error');
  };

  spotWs.onclose = (event) => {
    store.addDebugLog('Binance', `Spot WS Closed (Code: ${event.code})`, 'warning');
    store.setConnectionStatus('Binance', 'Disconnected');
    if (wsWatchdog) clearInterval(wsWatchdog);
    reconnectBinance(store);
  };

  store.addDebugLog('Binance', 'Connecting Futures WebSocket...', 'info');
  const futStreams = pairs.map(p => `${p.toLowerCase()}@ticker`).join('/');
  const futWs = new WebSocket(`wss://fstream.binance.com/stream?streams=${futStreams}`);
  
  futWs.onopen = () => store.addDebugLog('Binance', 'Futures WebSocket Connected', 'success');
  futWs.onmessage = (event) => {
    lastWsMessageTime = Date.now();
    try {
      const parsed = JSON.parse(event.data);
      if (parsed && parsed.data && parsed.data.c) {
        const symbol = parsed.data.s;
        if (pairs.includes(symbol)) {
          const id = `Binance-${symbol}`;
          store.updateData(id, { 
            futurePrice: parseFloat(parsed.data.c),
            volume24h: parseFloat(parsed.data.v)
          });
          calculateDerivedFields(id, store);
        }
      }
    } catch (e) {}
  };

  const markStreams = pairs.map(p => `${p.toLowerCase()}@markPrice@1s`).join('/');
  const markWs = new WebSocket(`wss://fstream.binance.com/stream?streams=${markStreams}`);
  markWs.onopen = () => store.addDebugLog('Binance', 'Subscribing to Streams...', 'success');
  markWs.onmessage = (event) => {
    lastWsMessageTime = Date.now();
    try {
      const parsed = JSON.parse(event.data);
      if (parsed && parsed.data && parsed.data.r) {
        const symbol = parsed.data.s;
        if (pairs.includes(symbol)) {
          const id = `Binance-${symbol}`;
          store.updateData(id, { 
            fundingRate: parseFloat(parsed.data.r) * 100,
            nextFundingTime: parsed.data.T
          });
          calculateDerivedFields(id, store);
        }
      }
    } catch (e) {}
  };
}

function reconnectBinance(store: any) {
  if (binanceWsRetryCount >= 3) {
    store.addDebugLog('Binance', 'Max retries reached. Switching to REST API.', 'warning');
    setInterval(() => fetchBinanceRestPrices(store), 3000);
    return;
  }
  
  binanceWsRetryCount++;
  const delays = [2000, 5000, 10000];
  const delay = delays[binanceWsRetryCount - 1];
  
  store.addDebugLog('Binance', `Reconnecting in ${delay/1000}s (Attempt ${binanceWsRetryCount})...`, 'info');
  setTimeout(() => connectBinanceWS(store), delay);
}


async function startBybitStream() {
  const store = useMarketDataStore.getState();
  store.setConnectionStatus('Bybit', 'Connecting');
  
  const keys = useExchangeStore.getState().getKeys('Bybit');
  if (!keys) {
    store.setConnectionStatus('Bybit', 'Invalid Keys');
    pairs.forEach(p => store.updateData(`Bybit-${p}`, { error: 'Invalid Bybit API Key' }));
    return;
  }

  store.setConnectionStatus('Bybit', 'Connected');

  const linearWs = new WebSocket('wss://stream.bybit.com/v5/public/linear');
  
  linearWs.onopen = () => {
    const args = pairs.map(p => `tickers.${p}`);
    linearWs.send(JSON.stringify({ op: 'subscribe', args: args }));
  };

  linearWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.topic && data.topic.startsWith('tickers.') && data.data) {
        const symbol = data.data.symbol;
        if (pairs.includes(symbol)) {
          const id = `Bybit-${symbol}`;
          const updates: Partial<MarketData> = {};
          
          if (data.data.lastPrice) updates.futurePrice = parseFloat(data.data.lastPrice);
          if (data.data.fundingRate) updates.fundingRate = parseFloat(data.data.fundingRate) * 100;
          if (data.data.nextFundingTime) updates.nextFundingTime = parseInt(data.data.nextFundingTime);
          if (data.data.volume24h) updates.volume24h = parseFloat(data.data.volume24h);
          if (data.data.openInterestValue) updates.openInterest = parseFloat(data.data.openInterestValue);
          
          if (Object.keys(updates).length > 0) {
            store.updateData(id, updates);
            calculateDerivedFields(id, store);
          }
        }
      }
    } catch (e) {}
  };

  const spotWs = new WebSocket('wss://stream.bybit.com/v5/public/spot');
  spotWs.onopen = () => {
    const args = pairs.map(p => `tickers.${p}`);
    spotWs.send(JSON.stringify({ op: 'subscribe', args: args }));
  };
  spotWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.topic && data.topic.startsWith('tickers.') && data.data) {
        const symbol = data.data.symbol;
        if (pairs.includes(symbol)) {
          const id = `Bybit-${symbol}`;
          if (data.data.lastPrice) {
            store.updateData(id, { spotPrice: parseFloat(data.data.lastPrice) });
            calculateDerivedFields(id, store);
          }
        }
      }
    } catch (e) {}
  };
}

setInterval(() => {
  const store = useMarketDataStore.getState();
  const now = Date.now();
  
  // Funding Settlement Logic
  store.positions.forEach(pos => {
    if (pos.status !== 'Open') return;
    const data = store.marketData[`${pos.exchange}-${pos.symbol}`];
    if (data && data.nextFundingTime) {
      // Use a hidden property to track the last settled funding timestamp
      const lastSettled = (pos as any)._lastSettledTime || 0;
      
      if (now >= data.nextFundingTime && lastSettled !== data.nextFundingTime) {
         // Calculate funding payment
         const fundingRateDec = data.fundingRate / 100;
         const positionValue = pos.futureSize * data.futurePrice;
         
         const fundingPayment = positionValue * fundingRateDec * (pos.futureDirection === 'SELL' ? 1 : -1);
         
         const newEarned = pos.fundingEarned + fundingPayment;
         
         const logType = fundingPayment >= 0 ? 'success' : 'error';
         const logMsg = fundingPayment >= 0 
           ? `Funding Credited: +${fundingPayment.toFixed(4)} USDT (Rate: ${data.fundingRate.toFixed(4)}%)` 
           : `Funding Debited: ${fundingPayment.toFixed(4)} USDT (Rate: ${data.fundingRate.toFixed(4)}%)`;
           
         const newLogs = [
           { time: new Date().toLocaleTimeString(), msg: logMsg, type: logType as any },
           { time: new Date().toLocaleTimeString(), msg: 'Funding Event Detected & Settled', type: 'info' as any },
           ...(pos.logs || [])
         ].slice(0, 50);
         
         store.updatePosition(pos.id, { 
           fundingEarned: newEarned,
           logs: newLogs,
           _lastSettledTime: data.nextFundingTime
         } as any);
      }
    }
  });

  Object.keys(store.marketData).forEach(id => {
    calculateDerivedFields(id, store);
  });
}, 1000);
