import {
  financeService,
  type Budget,
  type Goal,
  type Transaction,
} from "@/services/financeService";
import { create } from "zustand";

export type { Budget, Goal, Transaction } from "@/services/financeService";

type FinanceStore = {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  categories: string[];
  isLoading: boolean;
  isInitialized: boolean;
  debugJson: Record<string, unknown> | null;

  initialize: () => Promise<void>;
  loadTransactions: (month?: number, year?: number) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadBudgets: (month?: number, year?: number) => Promise<void>;
  loadGoals: () => Promise<void>;
  loadAll: () => Promise<void>;

  addTransaction: (
    transaction: Omit<Transaction, "id" | "categoryId" | "month" | "year"> & {
      category: string;
    },
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    transaction: Partial<Omit<Transaction, "id">> & { category?: string },
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addCategory: (name: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;

  addBudget: (budget: { category: string; amount: number }) => Promise<void>;
  updateBudget: (
    id: string,
    budget: Partial<{ category: string; amount: number }>,
  ) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addGoal: (goal: {
    name: string;
    targetAmount: number;
    deadline: Date;
  }) => Promise<void>;
  updateGoalProgress: (goalId: string, amount: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;

  loadAllDataAsJson: () => Promise<void>;
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  budgets: [],
  goals: [],
  categories: [],
  isLoading: false,
  isInitialized: false,
  debugJson: null,

  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });
    try {
      await get().loadAll();
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTransactions: async (month?, year?) => {
    const filter =
      month !== undefined || year !== undefined
        ? { month, year }
        : undefined;
    const transactions = await financeService.getTransactions(filter);
    set({ transactions });
  },

  loadCategories: async () => {
    const categories = await financeService.getCategoryNames();
    set({ categories });
  },

  loadBudgets: async (month?, year?) => {
    const budgets = await financeService.getBudgets(month, year);
    set({ budgets });
  },

  loadGoals: async () => {
    const goals = await financeService.getGoals();
    set({ goals });
  },

  loadAll: async () => {
    const now = new Date();
    await Promise.all([
      get().loadCategories(),
      get().loadTransactions(),
      get().loadBudgets(now.getMonth() + 1, now.getFullYear()),
      get().loadGoals(),
    ]);
  },

  addTransaction: async (transaction) => {
    await financeService.addTransaction({
      ...transaction,
      amount: Math.abs(transaction.amount),
    });
    await get().loadTransactions();
    await get().loadBudgets();
  },

  updateTransaction: async (id, transaction) => {
    await financeService.updateTransaction(id, {
      ...transaction,
      amount:
        transaction.amount !== undefined
          ? Math.abs(transaction.amount)
          : undefined,
    });
    await get().loadTransactions();
    await get().loadBudgets();
  },

  deleteTransaction: async (id) => {
    await financeService.deleteTransaction(id);
    await get().loadTransactions();
    await get().loadBudgets();
  },

  addCategory: async (name) => {
    const state = get();
    if (state.categories.includes(name.trim())) {
      throw new Error("Category already exists");
    }
    await financeService.addCategory(name);
    await get().loadCategories();
  },

  updateCategory: async (oldName, newName) => {
    await financeService.updateCategory(oldName, newName);
    await get().loadAll();
  },

  deleteCategory: async (name) => {
    await financeService.deleteCategory(name);
    await get().loadCategories();
  },

  addBudget: async (budget) => {
    await financeService.addBudget(budget);
    await get().loadBudgets();
  },

  updateBudget: async (id, budget) => {
    await financeService.updateBudget(id, budget);
    await get().loadBudgets();
  },

  deleteBudget: async (id) => {
    await financeService.deleteBudget(id);
    await get().loadBudgets();
  },

  addGoal: async (goal) => {
    await financeService.addGoal(goal);
    await get().loadGoals();
  },

  updateGoalProgress: async (goalId, amount) => {
    await financeService.updateGoalProgress(goalId, amount);
    await get().loadGoals();
  },

  deleteGoal: async (goalId) => {
    await financeService.deleteGoal(goalId);
    await get().loadGoals();
  },

  loadAllDataAsJson: async () => {
    const debugJson = await financeService.exportAllData();
    set({ debugJson });
  },
}));
