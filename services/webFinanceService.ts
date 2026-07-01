import type {
  Budget,
  Category,
  CategoryBreakdown,
  Goal,
  Transaction,
  TransactionFilter,
  TransactionSummary,
} from "@/types/finance";
import { webStorage } from "./webStorage";

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Salary",
  "Other",
];

async function ensureWebCategories(): Promise<void> {
  const categories = await webStorage.getCategories();
  if (categories.length === 0) {
    const now = new Date().toISOString();
    await webStorage.saveCategories(
      DEFAULT_CATEGORIES.map((name, index) => ({
        id: index + 1,
        name,
        type: "both" as const,
        icon: null,
        color: null,
        createdAt: now,
        updatedAt: now,
        isDeleted: 0,
      })),
    );
  }
}

function mapTransaction(
  t: Awaited<ReturnType<typeof webStorage.getTransactions>>[0],
): Transaction {
  return {
    ...t,
    date: typeof t.date === "string" ? new Date(t.date) : t.date,
  };
}

export const webFinanceService = {
  async getCategories(): Promise<Category[]> {
    await ensureWebCategories();
    return webStorage.getCategories();
  },

  async getCategoryNames(): Promise<string[]> {
    const categories = await this.getCategories();
    return categories.map((c) => c.name);
  },

  async addCategory(name: string): Promise<void> {
    await ensureWebCategories();
    const categories = await webStorage.getCategories();
    if (categories.some((c) => c.name === name.trim())) {
      throw new Error("Category already exists");
    }
    const now = new Date().toISOString();
    categories.push({
      id: Date.now(),
      name: name.trim(),
      type: "both",
      icon: null,
      color: null,
      createdAt: now,
      updatedAt: now,
      isDeleted: 0,
    });
    await webStorage.saveCategories(categories);
  },

  async updateCategory(oldName: string, newName: string): Promise<void> {
    const categories = await webStorage.getCategories();
    const index = categories.findIndex((c) => c.name === oldName);
    if (index === -1) throw new Error("Category not found");
    categories[index] = {
      ...categories[index],
      name: newName.trim(),
      updatedAt: new Date().toISOString(),
    };
    await webStorage.saveCategories(categories);

    const transactions = await webStorage.getTransactions();
    await webStorage.saveTransactions(
      transactions.map((t) =>
        t.category === oldName ? { ...t, category: newName.trim() } : t,
      ),
    );

    const budgets = await webStorage.getBudgets();
    await webStorage.saveBudgets(
      budgets.map((b) =>
        b.category === oldName ? { ...b, category: newName.trim() } : b,
      ),
    );
  },

  async deleteCategory(name: string): Promise<void> {
    const categories = await webStorage.getCategories();
    const category = categories.find((c) => c.name === name);
    if (!category) throw new Error("Category not found");

    const transactions = await webStorage.getTransactions();
    const budgets = await webStorage.getBudgets();
    if (
      transactions.some((t) => t.categoryId === category.id) ||
      budgets.some((b) => b.categoryId === category.id)
    ) {
      throw new Error("Cannot delete category that is in use");
    }

    await webStorage.saveCategories(
      categories.filter((c) => c.id !== category.id),
    );
  },

  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    await ensureWebCategories();
    let transactions = (await webStorage.getTransactions()).map(mapTransaction);

    if (filter?.month !== undefined) {
      transactions = transactions.filter((t) => t.month === filter.month);
    }
    if (filter?.year !== undefined) {
      transactions = transactions.filter((t) => t.year === filter.year);
    }
    if (filter?.categoryId !== undefined) {
      transactions = transactions.filter(
        (t) => t.categoryId === filter.categoryId,
      );
    }
    if (filter?.type === "income") {
      transactions = transactions.filter((t) => t.type === "income");
    } else if (filter?.type === "expense") {
      transactions = transactions.filter((t) => t.type === "expense");
    }

    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },

  async addTransaction(
    input: Omit<Transaction, "id" | "categoryId" | "month" | "year"> & {
      category: string;
    },
  ): Promise<void> {
    const categories = await this.getCategories();
    const category = categories.find((c) => c.name === input.category);
    if (!category) throw new Error(`Invalid category: ${input.category}`);

    const date = input.date instanceof Date ? input.date : new Date(input.date);
    const transactions = await webStorage.getTransactions();
    transactions.push({
      id: String(Date.now()),
      categoryId: category.id,
      category: category.name,
      amount: Math.abs(input.amount),
      type: input.type,
      description: input.description,
      notes: input.notes ?? "",
      date: date.toISOString(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });
    await webStorage.saveTransactions(transactions);
  },

  async updateTransaction(
    id: string,
    input: Partial<Omit<Transaction, "id">> & { category?: string },
  ): Promise<void> {
    const transactions = await webStorage.getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Transaction not found");

    const current = transactions[index];
    let categoryId = current.categoryId;
    let category = current.category;

    if (input.category !== undefined) {
      const categories = await this.getCategories();
      const cat = categories.find((c) => c.name === input.category);
      if (!cat) throw new Error(`Invalid category: ${input.category}`);
      categoryId = cat.id;
      category = cat.name;
    }

    const date =
      input.date !== undefined
        ? input.date instanceof Date
          ? input.date
          : new Date(input.date)
        : new Date(current.date);

    transactions[index] = {
      ...current,
      ...input,
      categoryId,
      category,
      amount:
        input.amount !== undefined ? Math.abs(input.amount) : current.amount,
      date: date.toISOString(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
    await webStorage.saveTransactions(transactions);
  },

  async deleteTransaction(id: string): Promise<void> {
    const transactions = await webStorage.getTransactions();
    await webStorage.saveTransactions(transactions.filter((t) => t.id !== id));
  },

  async getTransactionSummary(
    filter?: TransactionFilter,
  ): Promise<TransactionSummary> {
    const transactions = await this.getTransactions(filter);
    const totalCredit = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit,
    };
  },

  async getCategoryBreakdown(
    filter?: TransactionFilter,
  ): Promise<CategoryBreakdown[]> {
    const transactions = await this.getTransactions({
      ...filter,
      type: "expense",
    });
    const map = new Map<number, CategoryBreakdown>();
    for (const t of transactions) {
      const existing = map.get(t.categoryId);
      if (existing) {
        existing.total += t.amount;
      } else {
        map.set(t.categoryId, {
          categoryId: t.categoryId,
          categoryName: t.category,
          total: t.amount,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  },

  async getBudgets(month?: number, year?: number): Promise<Budget[]> {
    await ensureWebCategories();
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const budgets = await webStorage.getBudgets();
    const transactions = await this.getTransactions({ month: m, year: y });

    return budgets
      .filter((b) => b.month === m && b.year === y)
      .map((b) => ({
        ...b,
        spent: transactions
          .filter(
            (t) => t.type === "expense" && t.categoryId === b.categoryId,
          )
          .reduce((sum, t) => sum + t.amount, 0),
      }));
  },

  async addBudget(input: {
    category: string;
    amount: number;
    month?: number;
    year?: number;
  }): Promise<void> {
    const categories = await this.getCategories();
    const category = categories.find((c) => c.name === input.category);
    if (!category) throw new Error(`Invalid category: ${input.category}`);

    const now = new Date();
    const budgets = await webStorage.getBudgets();
    budgets.push({
      id: String(Date.now()),
      categoryId: category.id,
      category: category.name,
      amount: Math.abs(input.amount),
      spent: 0,
      month: input.month ?? now.getMonth() + 1,
      year: input.year ?? now.getFullYear(),
    });
    await webStorage.saveBudgets(budgets);
  },

  async updateBudget(
    id: string,
    input: Partial<{ category: string; amount: number; month: number; year: number }>,
  ): Promise<void> {
    const budgets = await webStorage.getBudgets();
    const index = budgets.findIndex((b) => b.id === id);
    if (index === -1) throw new Error("Budget not found");

    let categoryId = budgets[index].categoryId;
    let category = budgets[index].category;
    if (input.category !== undefined) {
      const categories = await this.getCategories();
      const cat = categories.find((c) => c.name === input.category);
      if (!cat) throw new Error(`Invalid category: ${input.category}`);
      categoryId = cat.id;
      category = cat.name;
    }

    budgets[index] = {
      ...budgets[index],
      ...input,
      categoryId,
      category,
      amount:
        input.amount !== undefined
          ? Math.abs(input.amount)
          : budgets[index].amount,
    };
    await webStorage.saveBudgets(budgets);
  },

  async deleteBudget(id: string): Promise<void> {
    const budgets = await webStorage.getBudgets();
    await webStorage.saveBudgets(budgets.filter((b) => b.id !== id));
  },

  async getGoals(): Promise<Goal[]> {
    const goals = await webStorage.getGoals();
    return goals.map((g) => ({
      ...g,
      deadline: new Date(g.deadline),
    }));
  },

  async addGoal(input: {
    name: string;
    targetAmount: number;
    deadline: Date;
  }): Promise<void> {
    const goals = await webStorage.getGoals();
    goals.push({
      id: String(Date.now()),
      name: input.name,
      targetAmount: Math.abs(input.targetAmount),
      currentAmount: 0,
      deadline: input.deadline.toISOString(),
      status: "active",
    });
    await webStorage.saveGoals(goals);
  },

  async updateGoalProgress(goalId: string, amount: number): Promise<void> {
    const goals = await webStorage.getGoals();
    await webStorage.saveGoals(
      goals.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: g.currentAmount + amount }
          : g,
      ),
    );
  },

  async deleteGoal(goalId: string): Promise<void> {
    const goals = await webStorage.getGoals();
    await webStorage.saveGoals(goals.filter((g) => g.id !== goalId));
  },

  async exportAllData(): Promise<Record<string, unknown>> {
    return {
      categories: await webStorage.getCategories(),
      transactions: await webStorage.getTransactions(),
      budgets: await webStorage.getBudgets(),
      goals: await webStorage.getGoals(),
    };
  },
};
