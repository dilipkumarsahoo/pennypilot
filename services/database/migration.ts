import type { SQLiteDatabase } from "expo-sqlite";
import {
  CREATE_INDEXES,
  CREATE_MST_CATEGORIES,
  CREATE_SCHEMA_VERSION,
  CREATE_TXN_BUDGETS,
  CREATE_TXN_GOALS,
  CREATE_TXN_TRANSACTIONS,
  DEFAULT_CATEGORIES,
  OLD_TABLES,
  SCHEMA_VERSION,
} from "./schema";

function now(): string {
  return new Date().toISOString();
}

function parseDateParts(dateStr: string): { month: number; year: number } {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

async function tableExists(
  db: SQLiteDatabase,
  tableName: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName],
  );
  return (row?.count ?? 0) > 0;
}

async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  const exists = await tableExists(db, "schema_version");
  if (!exists) {
    return 0;
  }
  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1",
  );
  return row?.version ?? 0;
}

async function setSchemaVersion(
  db: SQLiteDatabase,
  version: number,
): Promise<void> {
  await db.runAsync("DELETE FROM schema_version");
  await db.runAsync("INSERT INTO schema_version (version) VALUES (?)", [
    version,
  ]);
}

export async function createNewSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_SCHEMA_VERSION);
  await db.execAsync(CREATE_MST_CATEGORIES);
  await db.execAsync(CREATE_TXN_TRANSACTIONS);
  await db.execAsync(CREATE_TXN_BUDGETS);
  await db.execAsync(CREATE_TXN_GOALS);
  await db.execAsync(CREATE_INDEXES);
}

export async function seedDefaultCategories(db: SQLiteDatabase): Promise<void> {
  const timestamp = now();
  for (const cat of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO mst_categories (name, type, icon, color, createdAt, updatedAt, isDeleted)
       VALUES (?, ?, NULL, NULL, ?, ?, 0)`,
      [cat.name, cat.type, timestamp, timestamp],
    );
  }
}

async function ensureCategoryId(
  db: SQLiteDatabase,
  nameMap: Map<string, number>,
  categoryName: string,
): Promise<number> {
  const trimmed = categoryName?.trim();
  if (!trimmed) {
    throw new Error("Transaction has empty category name");
  }

  const existing = nameMap.get(trimmed);
  if (existing) {
    return existing;
  }

  const timestamp = now();
  await db.runAsync(
    `INSERT OR IGNORE INTO mst_categories (name, type, icon, color, createdAt, updatedAt, isDeleted)
     VALUES (?, 'both', NULL, NULL, ?, ?, 0)`,
    [trimmed, timestamp, timestamp],
  );

  const row = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM mst_categories WHERE name = ? AND isDeleted = 0",
    [trimmed],
  );

  if (!row) {
    throw new Error(`Failed to resolve category: ${trimmed}`);
  }

  nameMap.set(trimmed, row.id);
  return row.id;
}

async function buildCategoryNameMap(
  db: SQLiteDatabase,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const rows = await db.getAllAsync<{ id: number; name: string }>(
    "SELECT id, name FROM mst_categories WHERE isDeleted = 0",
  );
  for (const row of rows) {
    map.set(row.name, row.id);
  }
  return map;
}

async function migrateCategories(db: SQLiteDatabase): Promise<void> {
  const timestamp = now();
  const names = new Set<string>();

  if (await tableExists(db, "transaction_categories")) {
    const rows = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM transaction_categories",
    );
    rows.forEach((r) => names.add(r.name));
  }

  if (await tableExists(db, "categories")) {
    const rows = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM categories",
    );
    rows.forEach((r) => names.add(r.name));
  }

  if (await tableExists(db, "budget_categories")) {
    const rows = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM budget_categories",
    );
    rows.forEach((r) => names.add(r.name));
  }

  if (await tableExists(db, "transactions")) {
    const rows = await db.getAllAsync<{ category: string }>(
      "SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL",
    );
    rows.forEach((r) => names.add(r.category));
  }

  if (await tableExists(db, "budgets")) {
    const rows = await db.getAllAsync<{ category: string }>(
      "SELECT DISTINCT category FROM budgets WHERE category IS NOT NULL",
    );
    rows.forEach((r) => names.add(r.category));
  }

  for (const name of names) {
    if (!name?.trim()) continue;
    await db.runAsync(
      `INSERT OR IGNORE INTO mst_categories (name, type, icon, color, createdAt, updatedAt, isDeleted)
       VALUES (?, 'both', NULL, NULL, ?, ?, 0)`,
      [name.trim(), timestamp, timestamp],
    );
  }
}

async function migrateTransactions(db: SQLiteDatabase): Promise<number> {
  if (!(await tableExists(db, "transactions"))) {
    return 0;
  }

  const nameMap = await buildCategoryNameMap(db);
  const rows = await db.getAllAsync<{
    id: number;
    amount: number;
    description: string;
    category: string;
    date: string;
    type: string;
  }>("SELECT id, amount, description, category, date, type FROM transactions");

  const timestamp = now();
  let migrated = 0;

  for (const row of rows) {
    const categoryId = await ensureCategoryId(db, nameMap, row.category);
    const amount = Math.abs(Number(row.amount) || 0);
    let transactionType: "credit" | "debit";
    if (row.type === "income") {
      transactionType = "credit";
    } else if (row.type === "expense") {
      transactionType = "debit";
    } else {
      transactionType = Number(row.amount) < 0 ? "debit" : "credit";
    }
    const dateStr = row.date ?? timestamp;
    const { month, year } = parseDateParts(dateStr);

    await db.runAsync(
      `INSERT INTO txn_transactions
       (categoryId, amount, transactionType, description, notes, transactionDate, month, year, createdAt, updatedAt, isDeleted)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 0)`,
      [
        categoryId,
        amount,
        transactionType,
        row.description ?? "",
        dateStr,
        month,
        year,
        timestamp,
        timestamp,
      ],
    );
    migrated++;
  }

  return migrated;
}

async function migrateBudgets(db: SQLiteDatabase): Promise<number> {
  if (!(await tableExists(db, "budgets"))) {
    return 0;
  }

  const nameMap = await buildCategoryNameMap(db);
  const rows = await db.getAllAsync<{
    category: string;
    amount: number;
  }>("SELECT category, amount FROM budgets");

  const timestamp = now();
  const { month, year } = parseDateParts(timestamp);
  let migrated = 0;

  for (const row of rows) {
    const categoryId = await ensureCategoryId(db, nameMap, row.category);

    await db.runAsync(
      `INSERT INTO txn_budgets (categoryId, amount, month, year, createdAt, updatedAt, isDeleted)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        categoryId,
        Math.abs(Number(row.amount) || 0),
        month,
        year,
        timestamp,
        timestamp,
      ],
    );
    migrated++;
  }

  return migrated;
}

async function migrateGoals(db: SQLiteDatabase): Promise<number> {
  if (!(await tableExists(db, "goals"))) {
    return 0;
  }

  const rows = await db.getAllAsync<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
  }>("SELECT name, targetAmount, currentAmount, deadline FROM goals");

  const timestamp = now();
  let migrated = 0;

  for (const row of rows) {
    await db.runAsync(
      `INSERT INTO txn_goals (name, targetAmount, currentAmount, targetDate, status, createdAt, updatedAt, isDeleted)
       VALUES (?, ?, ?, ?, 'active', ?, ?, 0)`,
      [
        row.name,
        Number(row.targetAmount) || 0,
        Number(row.currentAmount) || 0,
        row.deadline ?? timestamp,
        timestamp,
        timestamp,
      ],
    );
    migrated++;
  }

  return migrated;
}

async function dropOldTables(db: SQLiteDatabase): Promise<void> {
  for (const table of OLD_TABLES) {
    await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
  }
}

async function validateMigration(db: SQLiteDatabase): Promise<void> {
  const tables = [
    "mst_categories",
    "txn_transactions",
    "txn_budgets",
    "txn_goals",
  ];
  for (const table of tables) {
    const exists = await tableExists(db, table);
    if (!exists) {
      throw new Error(`Migration validation failed: missing ${table}`);
    }
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getSchemaVersion(db);

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  const hasOldSchema =
    (await tableExists(db, "transactions")) ||
    (await tableExists(db, "transaction_categories"));

  const hasNewSchema = await tableExists(db, "mst_categories");

  if (!hasNewSchema) {
    await createNewSchema(db);
    if (!hasOldSchema) {
      await seedDefaultCategories(db);
    }
  }

  if (hasOldSchema) {
    await migrateCategories(db);
    const txnCount = await migrateTransactions(db);
    const budgetCount = await migrateBudgets(db);
    const goalCount = await migrateGoals(db);

    await validateMigration(db);
    await dropOldTables(db);

    console.log(
      `Migration complete: ${txnCount} transactions, ${budgetCount} budgets, ${goalCount} goals`,
    );
  } else if (!hasOldSchema && hasNewSchema) {
    const catCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM mst_categories WHERE isDeleted = 0",
    );
    if ((catCount?.count ?? 0) === 0) {
      await seedDefaultCategories(db);
    }
  }

  await setSchemaVersion(db, SCHEMA_VERSION);
}
