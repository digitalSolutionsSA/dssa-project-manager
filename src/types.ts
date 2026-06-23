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
  retainerAccess?: boolean; // default false — explicit opt-in
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

// ── Retainer Clients ──────────────────────────────────────────────
export interface RetainerClient {
  id: string;
  name: string;
  description?: string;
  lastCheckIn?: string;  // ISO timestamp of last weekly check-in
  assignedTo?: 'all' | string;  // user id or 'all'; defaults to 'all'
  createdAt: string;
}

// ── Post Schedules ────────────────────────────────────────────────
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface PostSchedule {
  id: string;
  clientId: string;
  clientName: string;
  days: DayOfWeek[];
  assignedTo: 'all' | string;
  createdAt: string;
}

// ── Check-in Reminders ────────────────────────────────────────────
export interface CheckInReminder {
  id: string;
  title: string;
  message?: string;
  active: boolean;
  schedule: 'daily' | DayOfWeek;
  assignedTo: 'all' | string;
  createdAt: string;
}

// ── Theme ─────────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';
