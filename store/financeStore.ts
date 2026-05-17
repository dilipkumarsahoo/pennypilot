import {
  addBudgetToDB,
  addGoalToDB,
  addTransactionCategoryToDB,
  addTransactionToDB,
  deleteBudgetFromDB,
  deleteGoalFromDB,
  deleteTransactionCategoryFromDB,
  deleteTransactionFromDB,
  getBudgetsFromDB,
  getGoalsFromDB,
  getTransactionCategoriesFromDB,
  getTransactionsFromDB,
  initDatabase,
  updateBudgetInDB,
  updateGoalProgressInDB,
  updateTransactionInDB,
} from "@/services/database";
import { create } from "zustand";

export type Transaction = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date | string;
  type: "income" | "expense";
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
};

type FinanceStore = {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  transactionCategories: string[];
  // budgetCategories: string[];
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (
    id: string,
    transaction: Partial<Omit<Transaction, "id">>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, "id" | "spent">) => Promise<void>;
  updateBudget: (
    id: string,
    budget: Partial<Omit<Budget, "id">>
  ) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, "id" | "currentAmount">) => Promise<void>;
  updateGoalProgress: (goalId: string, amount: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addTransactionCategory: (category: string) => Promise<void>;
  deleteTransactionCategory: (category: string) => Promise<void>;
  loadTransactionCategories: () => Promise<void>;

  // loadBudgetCategories: () => Promise<void>;
  calculateBudgetSpent: (category: string) => number;
  setTransactions: (transactions: Transaction[]) => void;
  setTransactionCategories: (categories: string[]) => void;

  setGoals: (goals: Goal[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  loadTransactions: () => Promise<void>;
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  budgets: [],
  goals: [],
  transactionCategories: [],
  budgetCategories: [],

  setTransactions: (transactions) => set({ transactions }),
  setTransactionCategories: (categories) =>
    set({ transactionCategories: categories }),
  // setBudgetCategories: (categories) => set({ budgetCategories: categories }),
  setGoals: (goals) => set({ goals }),
  setBudgets: (budgets) => set({ budgets }),

  loadTransactionCategories: async () => {
    try {
      const categories = await getTransactionCategoriesFromDB();
      set({ transactionCategories: categories });
    } catch (error) {
      console.error("Error loading transaction categories:", error);
      throw error;
    }
  },

  // loadBudgetCategories: async () => {
  //   try {
  //     const categories = await getBudgetCategoriesFromDB();
  //     // set({ budgetCategories: categories });
  //   } catch (error) {
  //     console.error('Error loading budget categories:', error);
  //     throw error;
  //   }
  // },

  addTransactionCategory: async (category) => {
    try {
      // Check if category already exists in transaction categories
      const state = get();
      if (state.transactionCategories.includes(category)) {
        throw new Error("Category already exists");
      }

      // Add to transaction categories only
      await addTransactionCategoryToDB(category);
      const categories = await getTransactionCategoriesFromDB();
      set({ transactionCategories: categories });
    } catch (error) {
      console.error("Error adding transaction category:", error);
      throw error;
    }
  },

  deleteTransactionCategory: async (category) => {
    try {
      // Check if category is used in transactions
      const state = get();
      const isUsedInTransactions = state.transactions.some(
        (t) => t.category === category
      );

      if (isUsedInTransactions) {
        throw new Error("Cannot delete category that is in use");
      }

      await deleteTransactionCategoryFromDB(category);
      const categories = await getTransactionCategoriesFromDB();
      set({ transactionCategories: categories });
    } catch (error) {
      console.error("Error deleting transaction category:", error);
      throw error;
    }
  },

  loadTransactions: async () => {
    try {
      const dbTransactions = (await getTransactionsFromDB()) as Transaction[];

      // Convert string dates to Date objects
      const processedTransactions = dbTransactions.map((transaction) => ({
        ...transaction,
        date:
          typeof transaction.date === "string"
            ? new Date(transaction.date)
            : transaction.date,
      }));

      // Remove duplicates based on id and sort by date
      const uniqueTransactions = processedTransactions
        // .filter((transaction, index, self) =>
        //   index === self.findIndex((t) => t.id === transaction.id)
        // )
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      set({ transactions: uniqueTransactions });

      // Update budget spent amounts based on all transactions
      const budgets = get().budgets;
      const updatedBudgets = budgets.map((budget) => {
        const spent = uniqueTransactions
          .filter((t) => t.type === "expense" && t.category === budget.category)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          ...budget,
          spent,
        };
      });
      set({ budgets: updatedBudgets });
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  },

  addTransaction: async (transaction: Omit<Transaction, "id">) => {
    try {
      const newTransaction = { ...transaction, id: Date.now().toString() };
      const currentTransactions = get().transactions;
      const newTransactions = [...currentTransactions, newTransaction];
      set({ transactions: newTransactions });
      await addTransactionToDB({
        ...newTransaction,
        date:
          newTransaction.date instanceof Date
            ? newTransaction.date.toISOString()
            : newTransaction.date,
      });

      // Update budget spent amount if it's an expense
      if (newTransaction.type === "expense") {
        const budgets = get().budgets;
        const updatedBudgets = budgets.map((budget) => {
          if (budget.category === newTransaction.category) {
            return {
              ...budget,
              spent: budget.spent + Math.abs(newTransaction.amount),
            };
          }
          return budget;
        });
        set({ budgets: updatedBudgets });
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  },

  updateTransaction: async (
    id: string,
    transaction: Partial<Omit<Transaction, "id">>
  ) => {
    try {
      const currentTransactions = get().transactions;
      const currentTransaction = currentTransactions.find((t) => t.id === id);
      if (!currentTransaction) throw new Error("Transaction not found");

      // Create updated transaction by merging current with updates
      const updatedTransaction = {
        ...currentTransaction,
        ...transaction,
        id, // Keep the original ID
      };

      // Update the transaction
      const updatedTransactions = currentTransactions.map((t) =>
        t.id === id ? updatedTransaction : t
      );
      set({ transactions: updatedTransactions });
      await updateTransactionInDB(id, {
        ...updatedTransaction,
        date:
          updatedTransaction.date instanceof Date
            ? updatedTransaction.date.toISOString()
            : updatedTransaction.date,
      });

      // Update budget spent amount
      const budgets = get().budgets;
      const updatedBudgets = budgets.map((budget) => {
        // If the category changed, update both old and new budget
        if (currentTransaction.category !== updatedTransaction.category) {
          if (budget.category === currentTransaction.category) {
            return {
              ...budget,
              spent: budget.spent - Math.abs(currentTransaction.amount),
            };
          }
          if (
            budget.category === updatedTransaction.category &&
            updatedTransaction.type === "expense"
          ) {
            return {
              ...budget,
              spent: budget.spent + Math.abs(updatedTransaction.amount),
            };
          }
        } else if (budget.category === currentTransaction.category) {
          // If only amount changed, update the difference
          const amountDiff =
            Math.abs(updatedTransaction.amount) -
            Math.abs(currentTransaction.amount);
          return {
            ...budget,
            spent: budget.spent + amountDiff,
          };
        }
        return budget;
      });
      set({ budgets: updatedBudgets });
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      const currentTransactions = get().transactions;
      const transactionToDelete = currentTransactions.find((t) => t.id === id);
      if (!transactionToDelete) throw new Error("Transaction not found");

      await deleteTransactionFromDB(id);
      // Update budget spent amount if it's an expense
      if (transactionToDelete.type === "expense") {
        const budgets = get().budgets;
        const updatedBudgets = budgets.map((budget) => {
          if (budget.category === transactionToDelete.category) {
            return {
              ...budget,
              spent: budget.spent - Math.abs(transactionToDelete.amount),
            };
          }
          return budget;
        });
        set({ budgets: updatedBudgets });
      }

      // Delete the transaction
      const updatedTransactions = currentTransactions.filter(
        (t) => t.id !== id
      );
      set({ transactions: updatedTransactions });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  },
  addBudget: async (budget) => {
    try {
      // Validate that the category exists
      const state = get();
      if (!state.transactionCategories.includes(budget.category)) {
        throw new Error(`Invalid category: ${budget.category}`);
      }

      // Calculate initial spent amount from existing transactions
      const spent = get()
        .transactions.filter(
          (t) => t.type === "expense" && t.category === budget.category
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      await addBudgetToDB({ ...budget, spent });
      const budgets = await getBudgetsFromDB();
      set({ budgets });
    } catch (error) {
      console.error("Error adding budget:", error);
      throw error;
    }
  },

  deleteBudget: async (id) => {
    try {
      await deleteBudgetFromDB(id);
      const budgets = await getBudgetsFromDB();
      set({ budgets });
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw error;
    }
  },

  addGoal: async (goal: Omit<Goal, "id" | "currentAmount">) => {
    try {
      await addGoalToDB(goal);
      const goals = await getGoalsFromDB();
      set({ goals });
    } catch (error) {
      console.error("Error adding goal:", error);
      throw error;
    }
  },
  updateBudget: async (id, budget) => {
    try {
      await updateBudgetInDB(id, budget);
      const budgets = await getBudgetsFromDB();
      set({ budgets });
    } catch (error) {
      console.error("Error updating budget:", error);
      throw error;
    }
  },

  updateGoalProgress: async (goalId: string, amount: number) => {
    try {
      await updateGoalProgressInDB(goalId, amount);
      const goals = await getGoalsFromDB();
      set({ goals });
    } catch (error) {
      console.error("Error updating goal progress:", error);
      throw error;
    }
  },

  deleteGoal: async (goalId: string) => {
    try {
      await deleteGoalFromDB(goalId);
      const goals = await getGoalsFromDB();
      set({ goals });
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  },

  calculateBudgetSpent: (category) => {
    const state = get();
    return state.transactions
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  },
}));

initDatabase();
