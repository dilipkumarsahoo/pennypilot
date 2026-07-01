export const SCHEMA_VERSION = 2;

export const CREATE_SCHEMA_VERSION = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL
  );
`;

export const CREATE_MST_CATEGORIES = `
  CREATE TABLE IF NOT EXISTS mst_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'both' CHECK(type IN ('credit', 'debit', 'both')),
    icon TEXT,
    color TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    isDeleted INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_TXN_TRANSACTIONS = `
  CREATE TABLE IF NOT EXISTS txn_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoryId INTEGER NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    transactionType TEXT NOT NULL CHECK(transactionType IN ('credit', 'debit')),
    description TEXT NOT NULL DEFAULT '',
    notes TEXT,
    transactionDate TEXT NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    isDeleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (categoryId) REFERENCES mst_categories(id)
  );
`;

export const CREATE_TXN_BUDGETS = `
  CREATE TABLE IF NOT EXISTS txn_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoryId INTEGER NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    isDeleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (categoryId) REFERENCES mst_categories(id)
  );
`;

export const CREATE_TXN_GOALS = `
  CREATE TABLE IF NOT EXISTS txn_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    targetAmount REAL NOT NULL CHECK(targetAmount >= 0),
    currentAmount REAL NOT NULL DEFAULT 0 CHECK(currentAmount >= 0),
    targetDate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    isDeleted INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_txn_transactions_date ON txn_transactions(transactionDate);
  CREATE INDEX IF NOT EXISTS idx_txn_transactions_month ON txn_transactions(month);
  CREATE INDEX IF NOT EXISTS idx_txn_transactions_year ON txn_transactions(year);
  CREATE INDEX IF NOT EXISTS idx_txn_transactions_category ON txn_transactions(categoryId);
  CREATE INDEX IF NOT EXISTS idx_txn_transactions_type ON txn_transactions(transactionType);
  CREATE INDEX IF NOT EXISTS idx_txn_budgets_month_year ON txn_budgets(month, year);
  CREATE INDEX IF NOT EXISTS idx_txn_budgets_category ON txn_budgets(categoryId);
`;

export const DEFAULT_CATEGORIES: { name: string; type: "both" }[] = [
  { name: "Food", type: "both" },
  { name: "Transport", type: "both" },
  { name: "Entertainment", type: "both" },
  { name: "Shopping", type: "both" },
  { name: "Bills", type: "both" },
  { name: "Salary", type: "both" },
  { name: "Other", type: "both" },
];

export const OLD_TABLES = [
  "transactions",
  "categories",
  "goals",
  "budgets",
  "transaction_categories",
  "budget_categories",
];
