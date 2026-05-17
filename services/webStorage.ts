import { Transaction, Goal, Budget } from '@/store/financeStore';
import { Platform } from 'react-native';

const WEB_STORAGE_KEY = 'finance_db';

export const webStorage = {
  async getTransactions(): Promise<Transaction[]> {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_transactions`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(`${WEB_STORAGE_KEY}_transactions`, JSON.stringify(transactions));
    }
  },

  async getCategories(): Promise<string[]> {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_categories`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveCategories(categories: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(`${WEB_STORAGE_KEY}_categories`, JSON.stringify(categories));
    }
  },

  async getGoals(): Promise<Goal[]> {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_goals`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveGoals(goals: Goal[]): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(`${WEB_STORAGE_KEY}_goals`, JSON.stringify(goals));
    }
  },

  async getBudgets(): Promise<Budget[]> {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_budgets`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveBudgets(budgets: Budget[]): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(`${WEB_STORAGE_KEY}_budgets`, JSON.stringify(budgets));
    }
  },

  async getTransactionCategories(): Promise<string[]> {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_transaction_categories`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveTransactionCategories(categories: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(`${WEB_STORAGE_KEY}_transaction_categories`, JSON.stringify(categories));
    }
  },

  async getBudgetCategories(): Promise<string[]> {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_budget_categories`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveBudgetCategories(categories: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(`${WEB_STORAGE_KEY}_budget_categories`, JSON.stringify(categories));
    }
  },
}; 