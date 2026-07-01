import type { Budget, Category, Goal, Transaction } from "@/types/finance";
import { Platform } from "react-native";

const WEB_STORAGE_KEY = "finance_db_v2";

type StoredTransaction = Omit<Transaction, "date"> & { date: string };
type StoredGoal = Omit<Goal, "deadline"> & { deadline: string };

export const webStorage = {
  async getTransactions(): Promise<StoredTransaction[]> {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_transactions`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveTransactions(transactions: StoredTransaction[]): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(
        `${WEB_STORAGE_KEY}_transactions`,
        JSON.stringify(transactions),
      );
    }
  },

  async getCategories(): Promise<Category[]> {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_categories`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveCategories(categories: Category[]): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(
        `${WEB_STORAGE_KEY}_categories`,
        JSON.stringify(categories),
      );
    }
  },

  async getGoals(): Promise<StoredGoal[]> {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_goals`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveGoals(goals: StoredGoal[]): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(`${WEB_STORAGE_KEY}_goals`, JSON.stringify(goals));
    }
  },

  async getBudgets(): Promise<Budget[]> {
    if (Platform.OS === "web") {
      const data = localStorage.getItem(`${WEB_STORAGE_KEY}_budgets`);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },

  async saveBudgets(budgets: Budget[]): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(
        `${WEB_STORAGE_KEY}_budgets`,
        JSON.stringify(budgets),
      );
    }
  },
};
