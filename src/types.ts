// ── Auth ──────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'assistant';

export interface AppUser {
  id: string;
  username: string;
  pinHash: string;
  role: UserRole;
  displayName: string;
  createdAt: string;
  tasksAccess?: boolean;    // default true for assistants
  pricesAccess?: boolean;   // default false — explicit opt-in
  calendarAccess?: boolean; // default true for assistants
}

// ── Tasks ─────────────────────────────────────────────────────────
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
  subTasks: SubTask[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: ProjectTask[];
  archived?: boolean;
  createdAt: string;
}

// ── Price List ────────────────────────────────────────────────────
export type PriceCategory =
  | 'Web Development' | 'App Development'
  | 'Social Media Marketing' | 'Misc';

export interface PriceListItem {
  id: string;
  sku: string;
  name: string;
  category: PriceCategory;
  price: number;
  description: string;
  visibleTo: 'all' | string[];
  createdAt: string;
}

// ── Calendar ──────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  time?: string;         // HH:MM
  description?: string;
  createdBy?: string;    // user id who added it
  createdAt: string;
}

// ── Theme ─────────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';
