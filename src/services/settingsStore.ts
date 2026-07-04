import { create } from 'zustand';

interface SettingsState {
  maxHoldingTimeHours: number;
  minDailyFundingIncome: number;
  maxBreakEvenHours: number;
  minExpectedProfitAfterHolding: number;
  allowTradeBeyondMaxHolding: boolean;
  updateSettings: (settings: Partial<Omit<SettingsState, 'updateSettings'>>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  maxHoldingTimeHours: 120, // 5 days
  minDailyFundingIncome: 0,
  maxBreakEvenHours: 72, // 3 days
  minExpectedProfitAfterHolding: 0,
  allowTradeBeyondMaxHolding: false,
  updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
}));
