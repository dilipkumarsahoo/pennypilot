export type CategoryType = "credit" | "debit" | "both";
export type TransactionDirection = "credit" | "debit";

/** DB row — mst_categories */
export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: number;
};

/** DB row — txn_transactions */
export type TransactionRecord = {
  id: number;
  categoryId: number;
  amount: number;
  transactionType: TransactionDirection;
  description: string;
  notes: string | null;
  transactionDate: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: number;
};

/** DB row — txn_budgets */
export type BudgetRecord = {
  id: number;
  categoryId: number;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: number;
};

/** DB row — txn_goals */
export type GoalRecord = {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: number;
};

/** UI-facing types (store layer) */
export type Transaction = {
  id: string;
  categoryId: number;
  category: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  notes?: string;
  date: Date;
  month: number;
  year: number;
};

export type Budget = {
  id: string;
  categoryId: number;
  category: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  status: string;
};

export type TransactionFilter = {
  month?: number;
  year?: number;
  categoryId?: number;
  type?: "income" | "expense";
};

export type TransactionSummary = {
  totalCredit: number;
  totalDebit: number;
  balance: number;
};

export type CategoryBreakdown = {
  categoryId: number;
  categoryName: string;
  total: number;
};
