import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  locale: string;
};

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
];

const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // USD

interface CurrencyState {
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  loadCurrency: () => Promise<void>;
  saveCurrency: (currency: Currency) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  selectedCurrency: DEFAULT_CURRENCY,

  setCurrency: async (currency: Currency) => {
    set({ selectedCurrency: currency });
    await get().saveCurrency(currency);
  },

  loadCurrency: async () => {
    try {
      const stored = await AsyncStorage.getItem('selectedCurrency');
      if (stored) {
        const parsed = JSON.parse(stored) as Currency;
        if (parsed && parsed.code) {
          set({ selectedCurrency: parsed });
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load currency', e);
    }
  },

  saveCurrency: async (currency: Currency) => {
    try {
      await AsyncStorage.setItem('selectedCurrency', JSON.stringify(currency));
    } catch (e) {
      console.error('Failed to save currency', e);
    }
  },
}));
