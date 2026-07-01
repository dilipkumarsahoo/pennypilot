import type {
  Budget,
  Category,
  CategoryBreakdown,
  Goal,
  Transaction,
  TransactionFilter,
  TransactionSummary,
} from "@/types/finance";
import { Platform } from "react-native";
import { initDatabase } from "./database";
import * as repo from "./database/repositories";
import { webFinanceService } from "./webFinanceService";

function directionToUiType(
  direction: "credit" | "debit",
): "income" | "expense" {
  return direction === "credit" ? "income" : "expense";
}

function uiTypeToDirection(type: "income" | "expense"): "credit" | "debit" {
  return type === "income" ? "credit" : "debit";
}

function mapTransaction(row: {
  id: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  transactionType: "credit" | "debit";
  description: string;
  notes: string | null;
  transactionDate: string;
  month: number;
  year: number;
}): Transaction {
  return {
    id: String(row.id),
    categoryId: row.categoryId,
    category: row.categoryName,
    amount: Math.abs(row.amount),
    type: directionToUiType(row.transactionType),
    description: row.description,
    notes: row.notes ?? "",
    date: new Date(row.transactionDate),
    month: row.month,
    year: row.year,
  };
}

function mapBudget(row: repo.BudgetRow): Budget {
  return {
    id: String(row.id),
    categoryId: row.categoryId,
    category: row.categoryName,
    amount: row.amount,
    spent: row.spent,
    month: row.month,
    year: row.year,
  };
}

function mapGoal(row: repo.GoalRow): Goal {
  return {
    id: String(row.id),
    name: row.name,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    deadline: new Date(row.targetDate),
    status: row.status,
  };
}

async function ensureReady(): Promise<void> {
  await initDatabase();
}

const nativeService = {
  async getCategories(): Promise<Category[]> {
    await ensureReady();
    return repo.getAllCategories();
  },

  async getCategoryNames(): Promise<string[]> {
    const categories = await this.getCategories();
    return categories.map((c) => c.name);
  },

  async addCategory(name: string): Promise<void> {
    await ensureReady();
    await repo.addCategory(name);
  },

  async updateCategory(oldName: string, newName: string): Promise<void> {
    await ensureReady();
    const category = await repo.getCategoryByName(oldName);
    if (!category) {
      throw new Error("Category not found");
    }
    await repo.updateCategoryName(category.id, newName);
  },

  async deleteCategory(name: string): Promise<void> {
    await ensureReady();
    const category = await repo.getCategoryByName(name);
    if (!category) {
      throw new Error("Category not found");
    }
    const inUse = await repo.isCategoryInUse(category.id);
    if (inUse) {
      throw new Error("Cannot delete category that is in use");
    }
    await repo.softDeleteCategory(category.id);
  },

  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    await ensureReady();
    const rows = await repo.getTransactions(filter);
    return rows.map(mapTransaction);
  },

  async addTransaction(
    input: Omit<Transaction, "id" | "categoryId" | "month" | "year"> & {
      category: string;
    },
  ): Promise<void> {
    await ensureReady();
    const category = await repo.getCategoryByName(input.category);
    if (!category) {
      throw new Error(`Invalid category: ${input.category}`);
    }
    await repo.addTransaction({
      categoryId: category.id,
      amount: Math.abs(input.amount),
      transactionType: uiTypeToDirection(input.type),
      description: input.description,
      notes: input.notes,
      date: input.date,
    });
  },

  async updateTransaction(
    id: string,
    input: Partial<Omit<Transaction, "id">> & { category?: string },
  ): Promise<void> {
    await ensureReady();
    const updates: Parameters<typeof repo.updateTransaction>[1] = {};

    if (input.category !== undefined) {
      const category = await repo.getCategoryByName(input.category);
      if (!category) {
        throw new Error(`Invalid category: ${input.category}`);
      }
      updates.categoryId = category.id;
    }
    if (input.amount !== undefined) {
      updates.amount = Math.abs(input.amount);
    }
    if (input.type !== undefined) {
      updates.transactionType = uiTypeToDirection(input.type);
    }
    if (input.description !== undefined) {
      updates.description = input.description;
    }
    if (input.notes !== undefined) {
      updates.notes = input.notes;
    }
    if (input.date !== undefined) {
      updates.date = input.date;
    }

    await repo.updateTransaction(Number(id), updates);
  },

  async deleteTransaction(id: string): Promise<void> {
    await ensureReady();
    await repo.softDeleteTransaction(Number(id));
  },

  async getTransactionSummary(
    filter?: TransactionFilter,
  ): Promise<TransactionSummary> {
    await ensureReady();
    return repo.getTransactionSummary(filter);
  },

  async getCategoryBreakdown(
    filter?: TransactionFilter,
  ): Promise<CategoryBreakdown[]> {
    await ensureReady();
    return repo.getCategoryBreakdown(filter);
  },

  async getBudgets(month?: number, year?: number): Promise<Budget[]> {
    await ensureReady();
    const now = new Date();
    const rows = await repo.getBudgets(
      month ?? now.getMonth() + 1,
      year ?? now.getFullYear(),
    );
    return rows.map(mapBudget);
  },

  async addBudget(input: {
    category: string;
    amount: number;
    month?: number;
    year?: number;
  }): Promise<void> {
    await ensureReady();
    const category = await repo.getCategoryByName(input.category);
    if (!category) {
      throw new Error(`Invalid category: ${input.category}`);
    }
    const now = new Date();
    await repo.addBudget({
      categoryId: category.id,
      amount: input.amount,
      month: input.month ?? now.getMonth() + 1,
      year: input.year ?? now.getFullYear(),
    });
  },

  async updateBudget(
    id: string,
    input: Partial<{
      category: string;
      amount: number;
      month: number;
      year: number;
    }>,
  ): Promise<void> {
    await ensureReady();
    const updates: Parameters<typeof repo.updateBudget>[1] = {};
    if (input.category !== undefined) {
      const category = await repo.getCategoryByName(input.category);
      if (!category) {
        throw new Error(`Invalid category: ${input.category}`);
      }
      updates.categoryId = category.id;
    }
    if (input.amount !== undefined) updates.amount = input.amount;
    if (input.month !== undefined) updates.month = input.month;
    if (input.year !== undefined) updates.year = input.year;
    await repo.updateBudget(Number(id), updates);
  },

  async deleteBudget(id: string): Promise<void> {
    await ensureReady();
    await repo.softDeleteBudget(Number(id));
  },

  async getGoals(): Promise<Goal[]> {
    await ensureReady();
    const rows = await repo.getGoals();
    return rows.map(mapGoal);
  },

  async addGoal(input: {
    name: string;
    targetAmount: number;
    deadline: Date;
  }): Promise<void> {
    await ensureReady();
    await repo.addGoal({
      name: input.name,
      targetAmount: input.targetAmount,
      targetDate: input.deadline,
    });
  },

  async updateGoalProgress(goalId: string, amount: number): Promise<void> {
    await ensureReady();
    await repo.updateGoalProgress(Number(goalId), amount);
  },

  async deleteGoal(goalId: string): Promise<void> {
    await ensureReady();
    await repo.softDeleteGoal(Number(goalId));
  },

  async exportAllData(): Promise<Record<string, unknown>> {
    await ensureReady();
    const { exportAllData } = await import("./database");
    return exportAllData();
  },
};

export const financeService =
  Platform.OS === "web" ? webFinanceService : nativeService;

export type FinanceService = typeof nativeService;

export type {
  Budget,
  Category,
  CategoryBreakdown,
  Goal,
  Transaction,
  TransactionFilter,
  TransactionSummary
} from "@/types/finance";

