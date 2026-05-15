// ── Auth ──────────────────────────────────────────────────────────
export type UserRole   = 'admin' | 'assistant';
export type TaskStatus = 'not-started' | 'in-progress' | 'completed';

export interface AppUser {
  id: string;
  username: string;
  pinHash: string;        // SHA-256 hex of the PIN
  role: UserRole;
  displayName: string;
  createdAt: string;
  calendarAccess?: boolean;  // assistant can view calendar
}

// ── Retainer Clients ─────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  completed?: boolean;    // legacy field — read during migration only
  assignedTo?: string;    // AppUser.id
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
  paidThisMonth?: boolean;  // must be ticked before income counts toward balance
  adSpendPaid?: boolean;    // ad spend only deducted from balance when marked paid
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
  visibleTo: 'all' | string[];  // 'all' = every assistant; string[] = specific user IDs
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
