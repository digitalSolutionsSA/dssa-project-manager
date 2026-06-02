// ── Auth ──────────────────────────────────────────────────────────
export type UserRole   = 'admin' | 'assistant';
export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'delayed';

export interface AppUser {
  id: string;
  username: string;
  pinHash: string;
  role: UserRole;
  displayName: string;
  createdAt: string;
  calendarAccess?: boolean;
  tasksAccess?: boolean;
  pricesAccess?: boolean;
}

// ── Retainer Clients ─────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  completed?: boolean;    // legacy field
  assignedTo?: string;
  delayReason?: string;
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
  paidThisMonth?: boolean;
  adSpendPaid?: boolean;
}

// ── Business Monthly Costs ────────────────────────────────────────
export interface CostItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  paid?: boolean;
}

// ── Once-Off Costs ────────────────────────────────────────────────
export interface OnceOffCost {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
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
  category?: 'web' | 'app';   // undefined treated as 'web' for backward compat
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
  paid?: boolean;
}

export interface BudgetExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: BudgetExpenseCategory;
  recurring: boolean;
  paid?: boolean;
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
export interface MonthlySnapshot {
  id: string;
  monthKey: string;
  label: string;
  savedAt: string;
  businessIncome: number;
  businessAdSpend: number;
  businessCosts: number;
  businessProfit: number;
  devIncome: number;
  personalIncome: number;
  personalExpenses: number;
  personalUnforeseen: number;
  personalBalance: number;
  notes: string;
}

// ── Price List ────────────────────────────────────────────────────
export type PriceCategory =
  | 'Web Development' | 'App Development'
  | 'Social Media Marketing' | 'Misc';

export interface PriceListItem {
  id: string;
  productCode: string;
  name: string;
  category: PriceCategory;
  price: number;
  description: string;
  visibleTo: 'all' | string[];
  createdAt: string;
}

// ── Odd / Standalone Tasks ────────────────────────────────────────
export type OddTaskPriority = 'low' | 'medium' | 'high';

export interface OddTask {
  id: string;
  title: string;
  notes: string;
  dueDate: string;
  status: TaskStatus;
  assignedTo?: string;
  priority: OddTaskPriority;
  delayReason?: string;
  createdAt: string;
}

// ── Meeting Notes ─────────────────────────────────────────────────
export interface MeetingNote {
  id: string;
  date: string;
  customerName: string;
  title: string;
  notes: string;
  followUp: string;
  createdAt: string;
  updatedAt: string;
}

// ── Income Subscriptions ──────────────────────────────────────────
export interface IncomeSubscription {
  id: string;
  customerName: string;
  amount: number;
  invoiceDate: string;
  paid?: boolean;
  createdAt: string;
}

// ── Customers (CRM) ───────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

// ── Unexpected Income ─────────────────────────────────────────────
export interface UnexpectedIncome {
  id: string;
  name: string;
  amount: number;
  date: string;
  notes: string;
  paid: boolean;
  createdAt: string;
}

// ── Transaction Log ───────────────────────────────────────────────
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  createdAt: string;
}
