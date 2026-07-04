export type Exchange = 'Binance' | 'Bybit' | 'OKX' | 'Bitget' | 'Gate.io' | 'MEXC';

export type TradeType = 'Positive Carry' | 'Reverse Carry';
export type Direction = 'BUY' | 'SELL';

export interface MarketData {
  id: string;
  symbol: string;
  exchange: Exchange;
  spotPrice: number;
  futurePrice: number;
  spread: number; // percentage
  fundingRate: number; // percentage
  countdown: string; // next funding time
  nextFundingTime?: number;
  volume24h: number;
  openInterest: number;
  liquidityScore: number; // 0-100
  expectedRoi: number; // percentage
  expectedFundingIncome: number;
  status: 'Online' | 'Offline';
  error: string;
  tradeType: TradeType;
  spotAction: Direction;
  futureAction: Direction;
}

export interface Position {
  id: string;
  symbol: string;
  exchange: Exchange;
  leverage: number;
  spotEntry: number;
  futureEntry: number;
  spotSize: number;
  futureSize: number;
  marginUsed: number;
  currentSpread: number;
  fundingEarned: number;
  pnl: number;
  roi: number;
  liquidationPrice: number;
  status: 'Open' | 'Closing' | 'Closed' | 'Error';
  duration: string;
  tradeType: TradeType;
  spotDirection: Direction;
  futureDirection: Direction;
}

export interface TradeHistory {
  id: string;
  symbol: string;
  exchange: Exchange;
  tradeType: TradeType;
  fundingDirection: 'Positive' | 'Negative';
  spotDirection: Direction;
  futureDirection: Direction;
  entryTime: string;
  exitTime: string;
  fundingIncome: number;
  spread: number;
  fees: number;
  pnl: number;
  roi: number;
}
