// ── Retainer Clients ─────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  color: string;
  icon: string;
  tasks: Task[];
  monthlyIncome: number;
  adSpend: number;
  monthlyCost: number;
}

// ── Business Monthly Costs ────────────────────────────────────────
export interface CostItem {
  id: string;
  name: string;
  amount: number;
  category: string;
}

// ── Once-Off Costs ────────────────────────────────────────────────
export interface OnceOffCost {
  id: string;
  name: string;
  amount: number;
  dueDate: string;     // YYYY-MM-DD
  paid: boolean;
  notes: string;
  createdAt: string;
}

// ── Development Projects ──────────────────────────────────────────
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DevTask {
  id: string;
  title: string;
  completed: boolean;
  subTasks: SubTask[];
}

export interface DevProject {
  id: string;
  clientName: string;
  projectName: string;
  color: string;
  icon: string;
  status: 'active' | 'completed';
  depositAmount: number;
  depositPaid: boolean;
  finalAmount: number;
  finalPaid: boolean;
  tasks: DevTask[];
  createdAt: string;
  completedAt?: string;
}

// ── Calendar ──────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  color: string;
}

// ── Personal Budget ───────────────────────────────────────────────
export type BudgetIncomeCategory =
  | 'Salary' | 'Freelance' | 'Business' | 'Investment'
  | 'Rental' | 'Side Hustle' | 'Other';

export type BudgetExpenseCategory =
  | 'Housing' | 'Transport' | 'Food & Groceries' | 'Utilities'
  | 'Insurance' | 'Medical' | 'Education' | 'Entertainment'
  | 'Clothing' | 'Personal Care' | 'Savings' | 'Debt Repayment'
  | 'Subscriptions' | 'Family' | 'Pets' | 'Other';

export interface BudgetIncomeItem {
  id: string;
  name: string;
  amount: number;
  category: BudgetIncomeCategory;
  recurring: boolean;
}

export interface BudgetExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: BudgetExpenseCategory;
  recurring: boolean;
}

export interface UnforeseenExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  notes: string;
  paid: boolean;
}

// ── Monthly Financial Snapshots ───────────────────────────────────
// Saved once per month (manually or auto) to keep a permanent record
export interface MonthlySnapshot {
  id: string;
  monthKey: string;          // "YYYY-MM"
  label: string;             // e.g. "May 2025"
  savedAt: string;           // ISO timestamp

  // Business
  businessIncome: number;
  businessAdSpend: number;
  businessCosts: number;
  businessProfit: number;
  devIncome: number;         // dev payments received that month

  // Personal
  personalIncome: number;
  personalExpenses: number;
  personalUnforeseen: number;
  personalBalance: number;

  notes: string;             // optional memo for that month
}

// ── Meeting Notes ─────────────────────────────────────────────────
export interface MeetingNote {
  id: string;
  date: string;              // YYYY-MM-DD
  customerName: string;
  title: string;             // short title / subject
  notes: string;             // full notes
  followUp: string;          // action items / follow-up
  createdAt: string;
  updatedAt: string;
}
