import { Budget, Goal, Transaction } from "@/store/financeStore";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { webStorage } from "./webStorage";

// import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

// type SQLTransaction = SQLite.SQLTransaction;
type SQLStatementArg = string | number | null;
// type SQLiteDatabase = ReturnType<typeof SQLite.openDatabase>;
// type SQLError = SQLite.SQLError;

interface CategoryItem {
  name: string;
}

interface DBTransaction extends Omit<Transaction, "date"> {
  date: string;
}

interface DBGoal extends Omit<Goal, "targetDate"> {
  targetDate: string;
}

interface DBBudget extends Omit<Budget, "spent"> {
  spent: string;
}

// Web storage implementation
// const WEB_STORAGE_KEY = 'finance_db';
// const db = SQLite.openDatabaseSync('finance_db');

const getDBConnection = async (): Promise<any> => {
  // if (Platform.OS === 'web') {
  //   throw new Error('Database not available on web platform');
  // }

  try {
    const db = await SQLite.openDatabaseAsync("finance_db");
    console.log("Database opened successfully");
    return db;
  } catch (error) {
    console.error("Failed to open database:", error);
    throw error;
  }
};

export const initDatabase = async () => {
  if (Platform.OS === "web") {
    return true;
  }

  try {
    const db = await getDBConnection();
    console.log(`called initDb`);
    if (!db) throw new Error("Database not initialized");

    if (1 != 1) {
      // code for drop tables
      try {
        // Drop all tables in a single query
        await db.execAsync(` DROP TABLE IF EXISTS goals; 
         DROP TABLE IF EXISTS transactions; 
         DROP TABLE IF EXISTS transaction_categories;
         DROP TABLE IF EXISTS categories; 
         DROP TABLE IF EXISTS budgets; 
         DROP TABLE IF EXISTS budget_categories; 
         `);
        console.log("All tables dropped successfully");
      } catch (error) {
        // Rollback if anything goes wrong
        console.error("Error dropping tables:", error);
        throw error;
      }
    }

    try {
      // Transactions Table
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            description TEXT,
            category TEXT,
            date TEXT,
            type TEXT
          );
        `);
        console.log("Transactions table created successfully");
      } catch (error) {
        console.error("Error creating transactions table:", error);
      }

      // Categories Table
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
          );
        `);
        console.log("Categories table created successfully");

        const defaultCategories = [
          "Groceries",
          "Transportation",
          "Entertainment",
          "Utilities",
          "Salary",
          "Freelance",
        ];
        for (const category of defaultCategories) {
          await db.runAsync(
            "INSERT OR IGNORE INTO categories (name) VALUES (?);",
            [category]
          );
        }
        console.log("Default categories inserted");
      } catch (error) {
        console.error("Error creating/inserting into categories table:", error);
      }

      // Goals Table
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            targetAmount REAL,
            currentAmount REAL,
            deadline TEXT
          );
        `);
        console.log("Goals table created successfully");
      } catch (error) {
        console.error("Error creating goals table:", error);
      }

      // Budgets Table
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            amount REAL,
            spent REAL
          );
        `);
        console.log("Budgets table created successfully");
      } catch (error) {
        console.error("Error creating budgets table:", error);
      }

      // Transaction Categories Table
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS transaction_categories (
            name TEXT PRIMARY KEY
          );
        `);
        console.log("Transaction categories table created successfully");

        const defaultTransactionCategories = [
          "Food",
          "Transport",
          "Entertainment",
          "Shopping",
          "Bills",
          "Other",
        ];
        for (const category of defaultTransactionCategories) {
          await db.runAsync(
            "INSERT OR IGNORE INTO transaction_categories (name) VALUES (?);",
            [category]
          );
        }
        console.log("Default transaction categories inserted");
      } catch (error) {
        console.error(
          "Error creating/inserting into transaction_categories table:",
          error
        );
      }

      console.log("Database setup completed");
      return true;
    } catch (error) {
      console.error("Unexpected error during database setup:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export const addTransactionToDB = async (
  transaction: Omit<Transaction, "id">
): Promise<void> => {
  if (Platform.OS === "web") {
    const transactions = await webStorage.getTransactions();
    transactions.push({ ...transaction, id: Date.now().toString() });
    await webStorage.saveTransactions(transactions);
    return;
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    const values: SQLStatementArg[] = [
      transaction.type,
      transaction.amount,
      transaction.category,
      transaction.date instanceof Date
        ? transaction.date.toISOString()
        : transaction.date,
      transaction.description,
    ];

    await db.runAsync(
      "INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)",
      values
    );
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};

export const getTransactionsFromDB = async (): Promise<Transaction[]> => {
  if (Platform.OS === "web") {
    return webStorage.getTransactions();
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    const result: Transaction[] = await db.getAllAsync(
      "SELECT * FROM transactions ORDER BY date DESC"
    );
    console.log("Transactions db:", result);
    const parsed = result.map((t: Transaction) => ({
      ...t,
      date: new Date(t.date),
    }));

    console.log("Transactions retrieved:", parsed);

    return parsed;
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw error;
  }
};

export const updateTransactionInDB = async (
  id: string,
  transaction: Partial<Omit<Transaction, "id">>
): Promise<void> => {
  if (Platform.OS === "web") {
    const transactions = await webStorage.getTransactions();
    const index = transactions.findIndex((t: Transaction) => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...transaction };
      await webStorage.saveTransactions(transactions);
    }
    return;
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    const values: SQLStatementArg[] = [
      transaction.type ?? null,
      transaction.amount ?? null,
      transaction.category ?? null,
      transaction.date instanceof Date
        ? transaction.date.toISOString()
        : transaction.date ?? null,
      transaction.description ?? null,
      id,
    ];

    try {
      await db.runAsync(
        "UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, description = ? WHERE id = ?",
        values
      );
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransactionFromDB = async (id: string): Promise<void> => {
  if (Platform.OS === "web") {
    const transactions = await webStorage.getTransactions();
    const filteredTransactions = transactions.filter(
      (t: Transaction) => t.id !== id
    );
    await webStorage.saveTransactions(filteredTransactions);
    return;
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

export const getCategoriesFromDB = async (): Promise<string[]> => {
  if (Platform.OS === "web") {
    return await webStorage.getCategories();
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      db.transaction(async () => {
        db.executeSql(
          "SELECT name FROM categories ORDER BY name;",
          [],
          (_: any, { rows: { _array } }: any) => {
            resolve(_array.map((item: CategoryItem) => item.name));
          },
          (_: Transaction, error: Error) => {
            console.error("Error getting categories:", error);
            reject(error);
            return false;
          }
        );
      });
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

export const addCategoryToDB = async (category: string): Promise<void> => {
  if (Platform.OS === "web") {
    const categories = await webStorage.getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      await webStorage.saveCategories(categories);
    }
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await new Promise<void>((resolve, reject) => {
      db.transaction(async () => {
        db.executeSql(
          "INSERT OR IGNORE INTO categories (name) VALUES (?);",
          [category],
          () => {
            console.log("Category added successfully:", category);
            resolve();
          },
          (_: Transaction, error: Error) => {
            console.error("Error adding category:", error);
            reject(error);
            return false;
          }
        );
      });
    });
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const deleteCategoryFromDB = async (category: string): Promise<void> => {
  if (Platform.OS === "web") {
    const categories = await webStorage.getCategories();
    const updatedCategories = categories.filter((c: string) => c !== category);
    await webStorage.saveCategories(updatedCategories);
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await new Promise<void>((resolve, reject) => {
      db.transaction(async () => {
        // First delete any transactions with this category
        db.executeSql(
          "DELETE FROM transactions WHERE category = ?;",
          [category],
          () => {
            // Then delete the category
            db.executeSql(
              "DELETE FROM categories WHERE name = ?;",
              [category],
              () => {
                console.log("Category deleted successfully:", category);
                resolve();
              },
              (_: Transaction, error: Error) => {
                console.error("Error deleting category:", error);
                reject(error);
                return false;
              }
            );
          },
          (_: Transaction, error: Error) => {
            console.error("Error deleting transactions with category:", error);
            reject(error);
            return false;
          }
        );
      });
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

export const addGoalToDB = async (
  goal: Omit<Goal, "id" | "currentAmount">
): Promise<void> => {
  if (Platform.OS === "web") {
    const goals = await webStorage.getGoals();
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      currentAmount: 0,
    };
    goals.push(newGoal);
    await webStorage.saveGoals(goals);
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    console.log("goal db ts", goal);

    const deadlineStr =
      typeof goal.deadline === "string"
        ? goal.deadline
        : goal.deadline.toISOString();

    const id = Date.now().toString();

    await db.runAsync(
      "INSERT INTO goals (id, name, targetAmount, currentAmount, deadline) VALUES (?, ?, ?, ?, ?);",
      [id, goal.name, goal.targetAmount, 0, deadlineStr]
    );

    console.log("Goal added successfully:", goal.name);
  } catch (error) {
    console.error("Error adding goal:", error);
    throw error;
  }
};

export const getGoalsFromDB = async (): Promise<Goal[]> => {
  if (Platform.OS === "web") {
    return webStorage.getGoals();
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    const rows: DBGoal[] = await db.getAllAsync(
      "SELECT * FROM goals ORDER BY datetime(deadline) DESC"
    );

    const parsedGoals = rows.map((g: DBGoal) => ({
      ...g,
      targetDate: new Date(g.deadline), // Ensure targetDate is a Date object
    }));

    console.log("Goals retrieved:", parsedGoals);

    return parsedGoals;
  } catch (error) {
    console.error("Error getting goals:", error);
    throw error;
  }
};

export const updateGoalProgressInDB = async (
  goalId: string,
  amount: number
): Promise<void> => {
  if (Platform.OS === "web") {
    const goals = await webStorage.getGoals();
    const updatedGoals = goals.map((goal: Goal) =>
      goal.id === goalId
        ? { ...goal, currentAmount: goal.currentAmount + amount }
        : goal
    );
    await webStorage.saveGoals(updatedGoals);
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await db.runAsync(
      "UPDATE goals SET currentAmount = currentAmount + ? WHERE id = ?;",
      [amount, goalId]
    );

    console.log("Goal progress updated successfully:", goalId);
  } catch (error) {
    console.error("Error updating goal progress:", error);
    throw error;
  }
};

export const deleteGoalFromDB = async (goalId: string): Promise<void> => {
  if (Platform.OS === "web") {
    const goals = await webStorage.getGoals();
    const filtered = goals.filter((g: Goal) => g.id !== goalId);
    await webStorage.saveGoals(filtered);
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await db.runAsync("DELETE FROM goals WHERE id = ?;", [goalId]);

    console.log("Goal deleted successfully:", goalId);
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
};

export const addBudgetToDB = async (
  budget: Omit<Budget, "id">
): Promise<void> => {
  if (Platform.OS === "web") {
    const budgets = await webStorage.getBudgets();
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
    };
    budgets.push(newBudget);
    await webStorage.saveBudgets(budgets);
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    console.log("Budget db ts", [budget.category, budget.amount, budget.spent]);

    const id = Date.now().toString(); // Generate a unique ID

    // Use runAsync to insert the budget data
    await db.runAsync(
      "INSERT INTO budgets ( category, amount, spent) VALUES (?, ?, ?);",
      [budget.category, budget.amount, budget.spent]
    );

    console.log("Budget added successfully:", budget.category);
  } catch (error) {
    console.error("Error adding budget:", error);
    throw error;
  }
};

export const getBudgetsFromDB = async (): Promise<Budget[]> => {
  console.log(".. budgets in dbts ");
  if (Platform.OS === "web") {
    return webStorage.getBudgets();
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    console.log(".. budget before ");
    const result = await db.getAllAsync(
      "SELECT * FROM budgets ORDER BY category"
    );
    console.log(".. budget after queyr", result);

    const budgets = result.map((b: DBBudget) => ({
      ...b,
      spent: Number(b.spent),
    }));

    return budgets;
  } catch (error) {
    console.error("Error getting budgets:", error);
    throw error;
  }
};

export const updateBudgetInDB = async (
  id: string,
  budget: Partial<Omit<Budget, "id">>
): Promise<void> => {
  if (Platform.OS === "web") {
    const budgets = await webStorage.getBudgets();
    const updatedBudgets = budgets.map((b: Budget) =>
      b.id === id ? { ...b, ...budget } : b
    );
    await webStorage.saveBudgets(updatedBudgets);
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    const updates: string[] = [];
    const values: any[] = [];

    if (budget.category !== undefined) {
      updates.push("category = ?");
      values.push(budget.category);
    }
    if (budget.amount !== undefined) {
      updates.push("amount = ?");
      values.push(budget.amount);
    }
    if (budget.spent !== undefined) {
      updates.push("spent = ?");
      values.push(budget.spent);
    }

    if (updates.length === 0) {
      return;
    }

    values.push(id);

    await new Promise<void>((resolve, reject) => {
      db.transaction(async () => {
        db.executeSql(
          `UPDATE budgets SET ${updates.join(", ")} WHERE id = ?;`,
          values,
          () => {
            console.log("Budget updated successfully:", id);
            resolve();
          },
          (_: Transaction, error: Error) => {
            console.error("Error updating budget:", error);
            reject(error);
            return false;
          }
        );
      });
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    throw error;
  }
};

export const deleteBudgetFromDB = async (id: string): Promise<void> => {
  if (Platform.OS === "web") {
    const budgets = await webStorage.getBudgets();
    const filtered = budgets.filter((b: Budget) => b.id !== id);
    await webStorage.saveBudgets(filtered);
    return;
  }

  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    try {
      await db.runAsync("DELETE FROM budgets WHERE id = ?;", [id]);
      console.log("Budget deleted successfully:", id);
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw error;
  }
};

// Transaction category functions
export const getTransactionCategoriesFromDB = async (): Promise<string[]> => {
  if (Platform.OS === "web") {
    return webStorage.getTransactionCategories();
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    const rows: { name: string }[] = await db.getAllAsync(
      "SELECT name FROM transaction_categories ORDER BY name"
    );

    const names = rows.map((item) => item.name);

    console.log("Transaction categories retrieved:", names);

    return names;
  } catch (error) {
    console.error("Error getting transaction categories:", error);
    throw error;
  }
};

export const addTransactionCategoryToDB = async (
  category: string
): Promise<void> => {
  if (Platform.OS === "web") {
    const categories = await webStorage.getTransactionCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      await webStorage.saveTransactionCategories(categories);
    }
    return;
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await db.runAsync(
      "INSERT OR IGNORE INTO transaction_categories (name) VALUES (?)",
      [category]
    );
  } catch (error) {
    console.error("Error adding transaction category:", error);
    throw error;
  }
};

export const deleteTransactionCategoryFromDB = async (
  category: string
): Promise<void> => {
  if (Platform.OS === "web") {
    const categories = await webStorage.getTransactionCategories();
    const updatedCategories = categories.filter((c: string) => c !== category);
    await webStorage.saveTransactionCategories(updatedCategories);
    return;
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await db.runAsync("DELETE FROM transaction_categories WHERE name = ?", [
      category,
    ]);
  } catch (error) {
    console.error("Error deleting transaction category:", error);
    throw error;
  }
};

// Budget category functions
export const getBudgetCategoriesFromDB = async (): Promise<string[]> => {
  if (Platform.OS === "web") {
    return webStorage.getBudgetCategories();
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    const result = await db.getAllAsync(
      "SELECT name FROM budget_categories ORDER BY name"
    );
    console.log("...", result);

    return result.map((item: { name: string }) => item.name);
  } catch (error) {
    console.error("Error getting budget categories:", error);
    throw error;
  }
};

export const addBudgetCategoryToDB = async (
  category: string
): Promise<void> => {
  if (Platform.OS === "web") {
    const categories = await webStorage.getBudgetCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      await webStorage.saveBudgetCategories(categories);
    }
    return;
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await db.runAsync(
      "INSERT OR IGNORE INTO budget_categories (name) VALUES (?)",
      [category]
    );
  } catch (error) {
    console.error("Error adding budget category:", error);
    throw error;
  }
};

export const deleteBudgetCategoryFromDB = async (
  category: string
): Promise<void> => {
  if (Platform.OS === "web") {
    const categories = await webStorage.getBudgetCategories();
    const updatedCategories = categories.filter((c: string) => c !== category);
    await webStorage.saveBudgetCategories(updatedCategories);
    return;
  }
  try {
    const db = await getDBConnection();
    if (!db) throw new Error("Database not initialized");

    await db.runAsync("DELETE FROM budget_categories WHERE name = ?", [
      category,
    ]);
  } catch (error) {
    console.error("Error deleting budget category:", error);
    throw error;
  }
};

export const getAllDataAsJson = async (): Promise<Record<string, any>> => {
  const db = await getDBConnection();
  if (!db) throw new Error("Database not initialized");

  try {
    const [transactions, categories, goals, budgets, transactionCategories] =
      await Promise.all([
        db.getAllAsync("SELECT * FROM transactions ORDER BY date DESC"),
        db.getAllAsync("SELECT * FROM categories ORDER BY name"),
        db.getAllAsync("SELECT * FROM goals ORDER BY deadline"),
        db.getAllAsync("SELECT * FROM budgets ORDER BY category"),
        db.getAllAsync("SELECT * FROM transaction_categories ORDER BY name"),
      ]);

    return {
      transactions: transactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date ? new Date(t.date).toISOString() : null,
      })),
      categories: categories.map((c: { name: string }) => c.name),
      goals: goals.map((g: any) => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        deadline: g.deadline ? new Date(g.deadline).toISOString() : null,
      })),
      budgets: budgets.map((b: any) => ({
        ...b,
        amount: Number(b.amount),
        spent: Number(b.spent),
      })),
      transactionCategories: transactionCategories.map(
        (c: { name: string }) => c.name
      ),
    };
  } catch (error) {
    console.error("Error fetching all data as JSON:", error);
    throw error;
  }
};
