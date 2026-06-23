import { useState, useEffect, useRef } from 'react';
import { Project, ProjectTask, SubTask, PriceListItem, PriceCategory, CalendarEvent, RetainerClient, PostSchedule, CheckInReminder, DayOfWeek, ThemeMode } from './types';
import { getSupabaseClient } from './supabase';

// ── Storage keys ──────────────────────────────────────────────────
const K = {
  projects:    'pm_projects',
  standalone:  'pm_standaloneTasks',
  priceList:   'pm_priceList',
  calendar:    'pm_calendarEvents',
  retainers:   'pm_retainerClients',
  schedules:   'pm_postSchedules',
  reminders:   'pm_checkInReminders',
  theme:       'pm_theme',
};

// ── Exports ───────────────────────────────────────────────────────
export const PRICE_CATEGORIES: PriceCategory[] = [
  'Web Development', 'App Development', 'Social Media Marketing', 'Misc',
];

// ── Helpers ───────────────────────────────────────────────────────
export function genId(): string { return Math.random().toString(36).substring(2, 10); }
export function todayStr(): string { return new Date().toISOString().split('T')[0]; }

// ── Retainer week helpers ─────────────────────────────────────────
// ISO 8601 week key, e.g. "2026-W24"
export function getWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon = 0 ... Sun = 6
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNum = 1 + Math.round(
    ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
export function needsCheckIn(client: RetainerClient): boolean {
  if (!client.lastCheckIn) return true;
  return getWeekKey(new Date(client.lastCheckIn)) !== getWeekKey(new Date());
}

// ── localStorage helpers ──────────────────────────────────────────
function load<T>(key: string, def: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Supabase push helper ──────────────────────────────────────────
async function sbPush(key: string, val: unknown) {
  const sb = getSupabaseClient();
  try {
    const { error } = await sb.from('app_data').upsert({ key, value: val, updated_at: new Date().toISOString() });
    if (error) console.warn('Supabase push failed:', error.message);
  } catch (e) { console.warn('Supabase push failed:', e); }
}

// ── Theme ─────────────────────────────────────────────────────────
export function useTheme(): [ThemeMode, () => void] {
  const [theme, setTheme] = useState<ThemeMode>(() => load<ThemeMode>(K.theme, 'dark'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save(K.theme, theme);
  }, [theme]);
  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggle];
}

// ── Defaults ──────────────────────────────────────────────────────
const DEFAULT_PROJECTS: Project[] = [];
const DEFAULT_STANDALONE: ProjectTask[] = [];
const DEFAULT_PRICELIST: PriceListItem[] = [];
const DEFAULT_CALENDAR: CalendarEvent[] = [];
const DEFAULT_RETAINERS: RetainerClient[] = [];
const DEFAULT_SCHEDULES: PostSchedule[] = [];
const DEFAULT_REMINDERS: CheckInReminder[] = [];

// ══════════════════════════════════════════════════════════════════
// MAIN STORE
// ══════════════════════════════════════════════════════════════════
export function useStore() {
  const [projects, setProjects]           = useState<Project[]>(() => load(K.projects, DEFAULT_PROJECTS));
  const [standaloneTasks, setStandalone]  = useState<ProjectTask[]>(() => load(K.standalone, DEFAULT_STANDALONE));
  const [priceList, setPriceList]         = useState<PriceListItem[]>(() => load(K.priceList, DEFAULT_PRICELIST));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => load(K.calendar, DEFAULT_CALENDAR));
  const [retainerClients, setRetainerClients] = useState<RetainerClient[]>(() => load(K.retainers, DEFAULT_RETAINERS));
  const [postSchedules, setPostSchedules] = useState<PostSchedule[]>(() => load(K.schedules, DEFAULT_SCHEDULES));
  const [checkInReminders, setCheckInReminders] = useState<CheckInReminder[]>(() => load(K.reminders, DEFAULT_REMINDERS));
  const [fbReady, setFbReady]             = useState(false);
  const [fbError, setFbError]             = useState<string | null>(null);
  const remoteUpdateKeys = useRef(new Set<string>());

  const persistAndSync = (localKey: string, sbKey: string, value: unknown) => {
    save(localKey, value);
    if (!fbReady) return;
    if (remoteUpdateKeys.current.has(sbKey)) {
      remoteUpdateKeys.current.delete(sbKey);
      return;
    }
    sbPush(sbKey, value);
  };

  useEffect(() => { persistAndSync(K.projects, 'projects', projects); }, [projects, fbReady]);
  useEffect(() => { persistAndSync(K.standalone, 'standaloneTasks', standaloneTasks); }, [standaloneTasks, fbReady]);
  useEffect(() => { persistAndSync(K.priceList, 'priceList', priceList); }, [priceList, fbReady]);
  useEffect(() => { persistAndSync(K.calendar, 'calendarEvents', calendarEvents); }, [calendarEvents, fbReady]);
  useEffect(() => { persistAndSync(K.retainers, 'retainerClients', retainerClients); }, [retainerClients, fbReady]);
  useEffect(() => { persistAndSync(K.schedules, 'postSchedules', postSchedules); }, [postSchedules, fbReady]);
  useEffect(() => { persistAndSync(K.reminders, 'checkInReminders', checkInReminders); }, [checkInReminders, fbReady]);

  // ── Supabase realtime listener ────────────────────────────────
  useEffect(() => {
    const sb = getSupabaseClient();
    const setters: { [k: string]: (v: unknown) => void } = {
      projects: (v) => setProjects(v as Project[]),
      standaloneTasks: (v) => setStandalone(v as ProjectTask[]),
      priceList: (v) => setPriceList(v as PriceListItem[]),
      calendarEvents: (v) => setCalendarEvents(v as CalendarEvent[]),
      retainerClients: (v) => setRetainerClients(v as RetainerClient[]),
      postSchedules: (v) => setPostSchedules(v as PostSchedule[]),
      checkInReminders: (v) => setCheckInReminders(v as CheckInReminder[]),
    };

    function applyRow(key: string, value: unknown) {
      const setter = setters[key];
      if (setter && Array.isArray(value)) {
        remoteUpdateKeys.current.add(key);
        setter(value);
      }
    }

    const channel = sb
      .channel('app-data')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_data' },
        (p) => applyRow((p.new as { key: string }).key, (p.new as { value: unknown }).value))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_data' },
        (p) => applyRow((p.new as { key: string }).key, (p.new as { value: unknown }).value))
      .subscribe();

    sb.from('app_data').select('key, value').then(({ data, error }) => {
      if (error) {
        console.warn('Supabase load error:', error.message);
        setFbError(error.message);
      } else if (data) {
        for (const row of data) applyRow(row.key, row.value);
      }
      setFbReady(true);
      setFbError(null);
    });

    return () => { sb.removeChannel(channel); };
  }, []);

  // ── PROJECTS ──────────────────────────────────────────────────────
  const addProject = (name: string, description: string = '') =>
    setProjects(p => [...p, { id: genId(), name, description, tasks: [], createdAt: new Date().toISOString() }]);
  const deleteProject = (id: string) => setProjects(p => p.filter(x => x.id !== id));
  const updateProject = (id: string, changes: Partial<Project>) =>
    setProjects(p => p.map(x => x.id === id ? { ...x, ...changes } : x));
  const archiveProject = (id: string) => setProjects(p => p.map(x => x.id === id ? { ...x, archived: true } : x));
  const unarchiveProject = (id: string) => setProjects(p => p.map(x => x.id === id ? { ...x, archived: false } : x));

  // ── PROJECT TASKS ─────────────────────────────────────────────────
  const addProjectTask = (pid: string, title: string, assignedTo?: string, dueDate?: string) =>
    setProjects(p => p.map(x => x.id === pid
      ? { ...x, tasks: [...x.tasks, mkTask(title, assignedTo, dueDate)] }
      : x));
  const toggleProjectTask = (pid: string, tid: string) =>
    setProjects(p => p.map(x => x.id === pid
      ? { ...x, tasks: x.tasks.map(t => t.id === tid ? { ...t, completed: !t.completed } : t) }
      : x));
  const deleteProjectTask = (pid: string, tid: string) =>
    setProjects(p => p.map(x => x.id === pid ? { ...x, tasks: x.tasks.filter(t => t.id !== tid) } : x));
  const editProjectTask = (pid: string, tid: string, changes: Partial<ProjectTask>) =>
    setProjects(p => p.map(x => x.id === pid
      ? { ...x, tasks: x.tasks.map(t => t.id === tid ? { ...t, ...changes } : t) }
      : x));
  const addProjectSubTask = (pid: string, tid: string, title: string) =>
    setProjects(p => p.map(x => x.id === pid
      ? { ...x, tasks: x.tasks.map(t => t.id === tid ? { ...t, subTasks: [...t.subTasks, mkSubTask(title)] } : t) }
      : x));
  const toggleProjectSubTask = (pid: string, tid: string, sid: string) =>
    setProjects(p => p.map(x => x.id === pid
      ? { ...x, tasks: x.tasks.map(t => t.id === tid ? { ...t, subTasks: t.subTasks.map(s => s.id === sid ? { ...s, completed: !s.completed } : s) } : t) }
      : x));
  const deleteProjectSubTask = (pid: string, tid: string, sid: string) =>
    setProjects(p => p.map(x => x.id === pid
      ? { ...x, tasks: x.tasks.map(t => t.id === tid ? { ...t, subTasks: t.subTasks.filter(s => s.id !== sid) } : t) }
      : x));

  // ── STANDALONE TASKS ──────────────────────────────────────────────
  const addStandaloneTask = (title: string, assignedTo?: string, dueDate?: string) =>
    setStandalone(p => [...p, mkTask(title, assignedTo, dueDate)]);
  const toggleStandaloneTask = (tid: string) =>
    setStandalone(p => p.map(t => t.id === tid ? { ...t, completed: !t.completed } : t));
  const deleteStandaloneTask = (tid: string) => setStandalone(p => p.filter(t => t.id !== tid));
  const editStandaloneTask = (tid: string, changes: Partial<ProjectTask>) =>
    setStandalone(p => p.map(t => t.id === tid ? { ...t, ...changes } : t));
  const addStandaloneSubTask = (tid: string, title: string) =>
    setStandalone(p => p.map(t => t.id === tid ? { ...t, subTasks: [...t.subTasks, mkSubTask(title)] } : t));
  const toggleStandaloneSubTask = (tid: string, sid: string) =>
    setStandalone(p => p.map(t => t.id === tid ? { ...t, subTasks: t.subTasks.map(s => s.id === sid ? { ...s, completed: !s.completed } : s) } : t));
  const deleteStandaloneSubTask = (tid: string, sid: string) =>
    setStandalone(p => p.map(t => t.id === tid ? { ...t, subTasks: t.subTasks.filter(s => s.id !== sid) } : t));

  // ── PRICE LIST ────────────────────────────────────────────────────
  const addPriceItem = (sku: string, name: string, category: PriceCategory, price: number, description: string, visibleTo: 'all' | string[]) =>
    setPriceList(p => [...p, { id: genId(), sku, name, category, price, description, visibleTo, createdAt: new Date().toISOString() }]);
  const deletePriceItem = (id: string) => setPriceList(p => p.filter(i => i.id !== id));
  const updatePriceItem = (id: string, sku: string, name: string, category: PriceCategory, price: number, description: string, visibleTo: 'all' | string[]) =>
    setPriceList(p => p.map(i => i.id === id ? { ...i, sku, name, category, price, description, visibleTo } : i));

  // ── CALENDAR ──────────────────────────────────────────────────────
  const addCalendarEvent = (title: string, date: string, time?: string, description?: string, createdBy?: string) =>
    setCalendarEvents(p => [...p, { id: genId(), title, date, time, description, createdBy, createdAt: new Date().toISOString() }]);
  const updateCalendarEvent = (id: string, changes: Partial<CalendarEvent>) =>
    setCalendarEvents(p => p.map(e => e.id === id ? { ...e, ...changes } : e));
  const deleteCalendarEvent = (id: string) => setCalendarEvents(p => p.filter(e => e.id !== id));

  // ── RETAINER CLIENTS ──────────────────────────────────────────────
  const addRetainerClient = (name: string, description: string = '', assignedTo: string = 'all') =>
    setRetainerClients(p => [...p, { id: genId(), name, description, assignedTo, createdAt: new Date().toISOString() }]);
  const updateRetainerClient = (id: string, changes: Partial<RetainerClient>) =>
    setRetainerClients(p => p.map(c => c.id === id ? { ...c, ...changes } : c));
  const deleteRetainerClient = (id: string) => setRetainerClients(p => p.filter(c => c.id !== id));
  const checkInRetainerClient = (id: string) =>
    setRetainerClients(p => p.map(c => c.id === id ? { ...c, lastCheckIn: new Date().toISOString() } : c));

  // ── POST SCHEDULES ────────────────────────────────────────────────
  const addPostSchedule = (clientId: string, clientName: string, days: DayOfWeek[], assignedTo: string = 'all') =>
    setPostSchedules(p => [...p, { id: genId(), clientId, clientName, days, assignedTo, createdAt: new Date().toISOString() }]);
  const updatePostSchedule = (id: string, days: DayOfWeek[], clientName?: string, assignedTo?: string) =>
    setPostSchedules(p => p.map(s => s.id === id ? { ...s, days, ...(clientName ? { clientName } : {}), ...(assignedTo !== undefined ? { assignedTo } : {}) } : s));
  const deletePostSchedule = (id: string) => setPostSchedules(p => p.filter(s => s.id !== id));

  // ── CHECK-IN REMINDERS ────────────────────────────────────────────
  const addCheckInReminder = (title: string, message?: string, schedule: import('./types').CheckInReminder['schedule'] = 'daily', assignedTo: string = 'all') =>
    setCheckInReminders(p => [...p, { id: genId(), title, message, active: false, schedule, assignedTo, createdAt: new Date().toISOString() }]);
  const toggleCheckInReminder = (id: string) =>
    setCheckInReminders(p => p.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const updateCheckInReminder = (id: string, changes: Partial<CheckInReminder>) =>
    setCheckInReminders(p => p.map(r => r.id === id ? { ...r, ...changes } : r));
  const deleteCheckInReminder = (id: string) => setCheckInReminders(p => p.filter(r => r.id !== id));

  return {
    fbReady, fbError,
    projects, addProject, deleteProject, updateProject, archiveProject, unarchiveProject,
    addProjectTask, toggleProjectTask, deleteProjectTask, editProjectTask,
    addProjectSubTask, toggleProjectSubTask, deleteProjectSubTask,
    standaloneTasks, addStandaloneTask, toggleStandaloneTask, deleteStandaloneTask, editStandaloneTask,
    addStandaloneSubTask, toggleStandaloneSubTask, deleteStandaloneSubTask,
    priceList, addPriceItem, deletePriceItem, updatePriceItem,
    calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
    retainerClients, addRetainerClient, updateRetainerClient, deleteRetainerClient, checkInRetainerClient,
    postSchedules, addPostSchedule, updatePostSchedule, deletePostSchedule,
    checkInReminders, addCheckInReminder, toggleCheckInReminder, updateCheckInReminder, deleteCheckInReminder,
  };
}

function mkTask(title: string, assignedTo?: string, dueDate?: string): ProjectTask {
  return { id: genId(), title, completed: false, assignedTo, dueDate, subTasks: [], createdAt: new Date().toISOString() };
}
function mkSubTask(title: string): SubTask {
  return { id: genId(), title, completed: false };
}
