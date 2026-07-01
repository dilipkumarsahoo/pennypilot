import type {
  Category,
  CategoryBreakdown,
  CategoryType,
  TransactionFilter,
  TransactionRecord,
  TransactionSummary,
} from "@/types/finance";
import type { SQLiteDatabase } from "expo-sqlite";
import { getDatabase } from "./connection";

function now(): string {
  return new Date().toISOString();
}

function parseDateParts(date: Date | string): {
  iso: string;
  month: number;
  year: number;
} {
  const d = date instanceof Date ? date : new Date(date);
  return {
    iso: d.toISOString(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
  };
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return db.getAllAsync<Category>(
    "SELECT * FROM mst_categories WHERE isDeleted = 0 ORDER BY name",
  );
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Category>(
    "SELECT * FROM mst_categories WHERE id = ? AND isDeleted = 0",
    [id],
  );
}

export async function getCategoryByName(
  name: string,
): Promise<Category | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Category>(
    "SELECT * FROM mst_categories WHERE name = ? AND isDeleted = 0",
    [name.trim()],
  );
}

export async function addCategory(
  name: string,
  type: CategoryType = "both",
): Promise<number> {
  const db = await getDatabase();
  const timestamp = now();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Category name is required");
  }

  const existing = await db.getFirstAsync<Category>(
    "SELECT * FROM mst_categories WHERE name = ?",
    [trimmedName],
  );

  if (existing) {
    if (existing.isDeleted === 0) {
      throw new Error("Category already exists");
    }

    await db.runAsync(
      "UPDATE mst_categories SET type = ?, isDeleted = 0, updatedAt = ? WHERE id = ?",
      [type, timestamp, existing.id],
    );
    return existing.id;
  }

  const result = await db.runAsync(
    `INSERT INTO mst_categories (name, type, icon, color, createdAt, updatedAt, isDeleted)
     VALUES (?, ?, NULL, NULL, ?, ?, 0)`,
    [trimmedName, type, timestamp, timestamp],
  );
  return result.lastInsertRowId;
}

export async function updateCategoryName(
  id: number,
  name: string,
): Promise<void> {
  const db = await getDatabase();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Category name is required");
  }

  const existing = await db.getFirstAsync<Category>(
    "SELECT * FROM mst_categories WHERE name = ? AND id != ?",
    [trimmedName, id],
  );

  if (existing) {
    throw new Error("Category already exists");
  }

  await db.runAsync(
    "UPDATE mst_categories SET name = ?, updatedAt = ? WHERE id = ? AND isDeleted = 0",
    [trimmedName, now(), id],
  );
}

export async function softDeleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE mst_categories SET isDeleted = 1, updatedAt = ? WHERE id = ?",
    [now(), id],
  );
}

export async function isCategoryInUse(id: number): Promise<boolean> {
  const db = await getDatabase();
  const txn = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM txn_transactions WHERE categoryId = ? AND isDeleted = 0",
    [id],
  );
  const budget = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM txn_budgets WHERE categoryId = ? AND isDeleted = 0",
    [id],
  );
  return (txn?.count ?? 0) > 0 || (budget?.count ?? 0) > 0;
}

type TransactionRow = TransactionRecord & { categoryName: string };

function buildTransactionWhere(filter?: TransactionFilter): {
  clause: string;
  params: (string | number)[];
} {
  const conditions = ["t.isDeleted = 0"];
  const params: (string | number)[] = [];

  if (filter?.month !== undefined) {
    conditions.push("t.month = ?");
    params.push(filter.month);
  }
  if (filter?.year !== undefined) {
    conditions.push("t.year = ?");
    params.push(filter.year);
  }
  if (filter?.categoryId !== undefined) {
    conditions.push("t.categoryId = ?");
    params.push(filter.categoryId);
  }
  if (filter?.type === "income") {
    conditions.push("t.transactionType = 'credit'");
  } else if (filter?.type === "expense") {
    conditions.push("t.transactionType = 'debit'");
  }

  return { clause: conditions.join(" AND "), params };
}

const TRANSACTION_SELECT = `
  SELECT t.*, c.name as categoryName
  FROM txn_transactions t
  INNER JOIN mst_categories c ON c.id = t.categoryId AND c.isDeleted = 0
`;

export async function getTransactions(
  filter?: TransactionFilter,
): Promise<TransactionRow[]> {
  const db = await getDatabase();
  const { clause, params } = buildTransactionWhere(filter);
  return db.getAllAsync<TransactionRow>(
    `${TRANSACTION_SELECT} WHERE ${clause} ORDER BY t.transactionDate DESC`,
    params,
  );
}

export async function addTransaction(input: {
  categoryId: number;
  amount: number;
  transactionType: "credit" | "debit";
  description: string;
  notes?: string;
  date: Date | string;
}): Promise<number> {
  const db = await getDatabase();
  const timestamp = now();
  const { iso, month, year } = parseDateParts(input.date);

  const result = await db.runAsync(
    `INSERT INTO txn_transactions
     (categoryId, amount, transactionType, description, notes, transactionDate, month, year, createdAt, updatedAt, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      input.categoryId,
      Math.abs(input.amount),
      input.transactionType,
      input.description,
      input.notes ?? null,
      iso,
      month,
      year,
      timestamp,
      timestamp,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(
  id: number,
  input: Partial<{
    categoryId: number;
    amount: number;
    transactionType: "credit" | "debit";
    description: string;
    notes: string;
    date: Date | string;
  }>,
): Promise<void> {
  const db = await getDatabase();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.categoryId !== undefined) {
    updates.push("categoryId = ?");
    values.push(input.categoryId);
  }
  if (input.amount !== undefined) {
    updates.push("amount = ?");
    values.push(Math.abs(input.amount));
  }
  if (input.transactionType !== undefined) {
    updates.push("transactionType = ?");
    values.push(input.transactionType);
  }
  if (input.description !== undefined) {
    updates.push("description = ?");
    values.push(input.description);
  }
  if (input.notes !== undefined) {
    updates.push("notes = ?");
    values.push(input.notes);
  }
  if (input.date !== undefined) {
    const { iso, month, year } = parseDateParts(input.date);
    updates.push("transactionDate = ?", "month = ?", "year = ?");
    values.push(iso, month, year);
  }

  if (updates.length === 0) return;

  updates.push("updatedAt = ?");
  values.push(now(), id);

  await db.runAsync(
    `UPDATE txn_transactions SET ${updates.join(", ")} WHERE id = ? AND isDeleted = 0`,
    values,
  );
}

export async function softDeleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE txn_transactions SET isDeleted = 1, updatedAt = ? WHERE id = ?",
    [now(), id],
  );
}

export async function getTransactionSummary(
  filter?: TransactionFilter,
): Promise<TransactionSummary> {
  const db = await getDatabase();
  const { clause, params } = buildTransactionWhere(filter);

  const row = await db.getFirstAsync<{
    totalCredit: number;
    totalDebit: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN t.transactionType = 'credit' THEN t.amount ELSE 0 END), 0) as totalCredit,
       COALESCE(SUM(CASE WHEN t.transactionType = 'debit' THEN t.amount ELSE 0 END), 0) as totalDebit
     FROM txn_transactions t
     WHERE ${clause}`,
    params,
  );

  const totalCredit = row?.totalCredit ?? 0;
  const totalDebit = row?.totalDebit ?? 0;
  return {
    totalCredit,
    totalDebit,
    balance: totalCredit - totalDebit,
  };
}

export async function getCategoryBreakdown(
  filter?: TransactionFilter,
): Promise<CategoryBreakdown[]> {
  const db = await getDatabase();
  const { clause, params } = buildTransactionWhere(filter);

  return db.getAllAsync<CategoryBreakdown>(
    `SELECT
       t.categoryId,
       c.name as categoryName,
       COALESCE(SUM(t.amount), 0) as total
     FROM txn_transactions t
     INNER JOIN mst_categories c ON c.id = t.categoryId AND c.isDeleted = 0
     WHERE ${clause} AND t.transactionType = 'debit'
     GROUP BY t.categoryId, c.name
     ORDER BY total DESC`,
    params,
  );
}

export type BudgetRow = {
  id: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
};

export async function getBudgets(
  month?: number,
  year?: number,
): Promise<BudgetRow[]> {
  const db = await getDatabase();
  const conditions = ["b.isDeleted = 0"];
  const params: number[] = [];

  if (month !== undefined) {
    conditions.push("b.month = ?");
    params.push(month);
  }
  if (year !== undefined) {
    conditions.push("b.year = ?");
    params.push(year);
  }

  return db.getAllAsync<BudgetRow>(
    `SELECT
       b.id,
       b.categoryId,
       c.name as categoryName,
       b.amount,
       b.month,
       b.year,
       COALESCE((
         SELECT SUM(t.amount)
         FROM txn_transactions t
         WHERE t.categoryId = b.categoryId
           AND t.transactionType = 'debit'
           AND t.month = b.month
           AND t.year = b.year
           AND t.isDeleted = 0
       ), 0) as spent
     FROM txn_budgets b
     INNER JOIN mst_categories c ON c.id = b.categoryId AND c.isDeleted = 0
     WHERE ${conditions.join(" AND ")}
     ORDER BY c.name`,
    params,
  );
}

export async function addBudget(input: {
  categoryId: number;
  amount: number;
  month: number;
  year: number;
}): Promise<number> {
  const db = await getDatabase();
  const timestamp = now();
  const result = await db.runAsync(
    `INSERT INTO txn_budgets (categoryId, amount, month, year, createdAt, updatedAt, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [input.categoryId, Math.abs(input.amount), input.month, input.year, timestamp, timestamp],
  );
  return result.lastInsertRowId;
}

export async function updateBudget(
  id: number,
  input: Partial<{ categoryId: number; amount: number; month: number; year: number }>,
): Promise<void> {
  const db = await getDatabase();
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (input.categoryId !== undefined) {
    updates.push("categoryId = ?");
    values.push(input.categoryId);
  }
  if (input.amount !== undefined) {
    updates.push("amount = ?");
    values.push(Math.abs(input.amount));
  }
  if (input.month !== undefined) {
    updates.push("month = ?");
    values.push(input.month);
  }
  if (input.year !== undefined) {
    updates.push("year = ?");
    values.push(input.year);
  }

  if (updates.length === 0) return;

  updates.push("updatedAt = ?");
  values.push(now(), id);

  await db.runAsync(
    `UPDATE txn_budgets SET ${updates.join(", ")} WHERE id = ? AND isDeleted = 0`,
    values,
  );
}

export async function softDeleteBudget(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE txn_budgets SET isDeleted = 1, updatedAt = ? WHERE id = ?",
    [now(), id],
  );
}

export type GoalRow = {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: string;
};

export async function getGoals(): Promise<GoalRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<GoalRow>(
    "SELECT * FROM txn_goals WHERE isDeleted = 0 ORDER BY targetDate ASC",
  );
}

export async function addGoal(input: {
  name: string;
  targetAmount: number;
  targetDate: Date | string;
}): Promise<number> {
  const db = await getDatabase();
  const timestamp = now();
  const targetDate =
    input.targetDate instanceof Date
      ? input.targetDate.toISOString()
      : input.targetDate;

  const result = await db.runAsync(
    `INSERT INTO txn_goals (name, targetAmount, currentAmount, targetDate, status, createdAt, updatedAt, isDeleted)
     VALUES (?, ?, 0, ?, 'active', ?, ?, 0)`,
    [input.name, Math.abs(input.targetAmount), targetDate, timestamp, timestamp],
  );
  return result.lastInsertRowId;
}

export async function updateGoalProgress(
  id: number,
  amount: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE txn_goals SET currentAmount = currentAmount + ?, updatedAt = ? WHERE id = ? AND isDeleted = 0",
    [amount, now(), id],
  );
}

export async function softDeleteGoal(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE txn_goals SET isDeleted = 1, updatedAt = ? WHERE id = ?",
    [now(), id],
  );
}

export async function getAllDataAsJson(
  db: SQLiteDatabase,
): Promise<Record<string, unknown>> {
  const [categories, transactions, budgets, goals] = await Promise.all([
    db.getAllAsync("SELECT * FROM mst_categories WHERE isDeleted = 0 ORDER BY name"),
    db.getAllAsync(
      `SELECT t.*, c.name as categoryName
       FROM txn_transactions t
       LEFT JOIN mst_categories c ON c.id = t.categoryId
       WHERE t.isDeleted = 0 ORDER BY t.transactionDate DESC`,
    ),
    db.getAllAsync(
      `SELECT b.*, c.name as categoryName
       FROM txn_budgets b
       LEFT JOIN mst_categories c ON c.id = b.categoryId
       WHERE b.isDeleted = 0`,
    ),
    db.getAllAsync("SELECT * FROM txn_goals WHERE isDeleted = 0 ORDER BY targetDate"),
  ]);

  return { categories, transactions, budgets, goals };
}
