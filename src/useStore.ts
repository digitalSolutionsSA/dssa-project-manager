import { useState, useEffect, useRef } from 'react';
import {
  Client, Task, TaskStatus, CalendarEvent, CostItem, DevProject,
  BudgetIncomeItem, BudgetExpenseItem, UnforeseenExpense,
  BudgetIncomeCategory, BudgetExpenseCategory,
  OnceOffCost, MonthlySnapshot, MeetingNote,
  PriceListItem, PriceCategory,
  OddTask, OddTaskPriority,
  IncomeSubscription,
  Customer, UnexpectedIncome, Transaction,
} from './types';
import { getSupabaseClient } from './supabase';

// ── Storage keys ──────────────────────────────────────────────────
const K = {
  clients:         'sb_clients',
  events:          'sb_events',
  costs:           'sb_costs',
  devProjects:     'sb_devProjects',
  budgetInc:       'sb_budgetIncome',
  budgetExp:       'sb_budgetExpenses',
  unforeseen:      'sb_unforeseen',
  onceOff:         'sb_onceOffCosts',
  snapshots:       'sb_snapshots',
  notes:           'sb_meetingNotes',
  balance:         'sb_currentBalance',
  priceList:       'sb_priceList',
  oddTasks:        'sb_oddTasks',
  incSubs:         'sb_incomeSubscriptions',
  customers:       'sb_customers',
  unexpectedInc:   'sb_unexpectedIncome',
  transactions:    'sb_transactions',
};

// ── Exports ───────────────────────────────────────────────────────
export const PRESET_COLORS = [
  '#3b82f6','#6366f1','#8b5cf6','#7c3aed','#a855f7','#c026d3',
  '#06b6d4','#0891b2','#14b8a6','#10b981','#22c55e','#16a34a',
  '#f59e0b','#f97316','#ef4444','#dc2626','#e11d48','#ec4899',
  '#64748b','#475569','#0ea5e9','#84cc16','#a3e635','#fb923c',
];

export const PRESET_ICONS = [
  '💼','📊','📈','📋','🏢','🤝','💡','🎯','📌','🗂️','📁','📂','🖇️','📎','🗃️','🗄️',
  '💻','📱','🌐','⚙️','🛠️','🔌','📡','🖥️','🖨️','⌨️','🖱️','💾','💿','📀','🔧','🔩',
  '🎨','✏️','📸','🎬','🎵','🎭','🖌️','✨','🖼️','🎞️','🎙️','🎚️','🎛️','📽️','🎤','🎧',
  '💰','💎','🏦','💳','📉','🪙','💵','🏆','💹','🤑','💸','🏧','💲','🪙','📈','💴',
  '👥','🤵','👑','🦁','🚀','⭐','🌟','🔮','👤','👨‍💼','👩‍💼','🤝','🫱','🫲','👋','🙌',
  '🔥','⚡','🌊','🌿','🏔️','🌱','🌳','🌻','🌈','☀️','🌙','❄️','🌪️','🌊','🍃','🌾',
  '☕','🍕','🍔','🥗','🍷','🎂','🍎','🥑','🧃','🥤','🍜','🍣','🥩','🧁','🍺','🎉',
  '🚗','✈️','🚀','🏠','🏪','🏨','🏋️','⛽','🚢','🚁','🛸','🚂','🏗️','🏰','🌆','🗺️',
  '⚽','🏀','🎾','🏊','🧘','💪','🏃','🧗','🎯','🥊','🏄','🎿','🏇','🚴','🤸','🏌️',
  '🛡️','⚔️','🔑','🗝️','🔐','💌','📣','📢','🚦','✅','❌','💯','🆕','🔔','🎁','🎖️',
  '🦁','🐯','🦊','🐺','🦋','🦅','🐉','🦄','🐸','🦁','🐧','🦜','🐬','🦈','🦒','🦓',
  '👾','🤖','👻','💀','🎃','🌈','🔭','🧬','⚗️','🧲','💊','🔬','🏅','🎗️','🧩','🎲',
];

export const EVENT_COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#10b981',
  '#f59e0b','#ef4444','#ec4899','#a855f7',
  '#f97316','#14b8a6','#6366f1','#22c55e',
];

export const COST_CATEGORIES = [
  'Subscription','Service Fee','Software','Hosting',
  'Marketing','Equipment','Office','Other',
];

export const BUDGET_INCOME_CATEGORIES: BudgetIncomeCategory[] = [
  'Salary','Freelance','Business','Investment','Rental','Side Hustle','Other',
];

export const BUDGET_EXPENSE_CATEGORIES: BudgetExpenseCategory[] = [
  'Housing','Transport','Food & Groceries','Utilities',
  'Insurance','Medical','Education','Entertainment',
  'Clothing','Personal Care','Savings','Debt Repayment',
  'Subscriptions','Family','Pets','Other',
];

// ── Helpers ───────────────────────────────────────────────────────
export function genId(): string { return Math.random().toString(36).substring(2, 10); }
export function todayStr(): string { return new Date().toISOString().split('T')[0]; }
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
export function monthLabel(key: string): string {
  const [y,m] = key.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${y}`;
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
  } catch(e) { console.warn('Supabase push failed:', e); }
}

// ── Task migration ────────────────────────────────────────────────
function migrateTasks(tasks: Task[]): Task[] {
  return tasks.map(t => ({
    ...t,
    status: t.status ?? ((t.completed) ? 'completed' : 'not-started'),
    completed: undefined,
  }));
}
function migrateClients(clients: Client[]): Client[] {
  return clients.map(c => ({ ...c, tasks: migrateTasks(c.tasks) }));
}

// ── Defaults ──────────────────────────────────────────────────────
const DEFAULT_CLIENTS: Client[] = [{
  id: genId(), name:'Loka Three Rivers', color:'#3b82f6', icon:'🔥',
  tasks:[{id:genId(),title:'Create Best of Vaal ad',dueDate:todayStr(),status:'not-started',createdAt:new Date().toISOString()}],
  monthlyIncome:15000,adSpend:3000,monthlyCost:2000,
}];
const DEFAULT_COSTS: CostItem[] = [
  {id:genId(),name:'Adobe Creative Cloud',amount:599,category:'Subscription'},
  {id:genId(),name:'Web Hosting',amount:250,category:'Hosting'},
];

// ── Transaction helper ────────────────────────────────────────────
function mkTransaction(description: string, amount: number, type: 'income'|'expense', category: string): Transaction {
  return { id: genId(), date: todayStr(), description, amount, type, category, createdAt: new Date().toISOString() };
}

// ══════════════════════════════════════════════════════════════════
// MAIN STORE
// ══════════════════════════════════════════════════════════════════
export function useStore() {
  const [clients,setClients]                       = useState<Client[]>(()=>migrateClients(load(K.clients,DEFAULT_CLIENTS)));
  const [events,setEvents]                         = useState<CalendarEvent[]>(()=>load(K.events,[]));
  const [costs,setCosts]                           = useState<CostItem[]>(()=>load(K.costs,DEFAULT_COSTS));
  const [devProjects,setDevProjects]               = useState<DevProject[]>(()=>load(K.devProjects,[]));
  const [budgetIncome,setBudgetIncome]             = useState<BudgetIncomeItem[]>(()=>load(K.budgetInc,[]));
  const [budgetExpenses,setBudgetExpenses]         = useState<BudgetExpenseItem[]>(()=>load(K.budgetExp,[]));
  const [unforeseenExpenses,setUnforeseen]         = useState<UnforeseenExpense[]>(()=>load(K.unforeseen,[]));
  const [onceOffCosts,setOnceOffCosts]             = useState<OnceOffCost[]>(()=>load(K.onceOff,[]));
  const [monthlySnapshots,setSnapshots]            = useState<MonthlySnapshot[]>(()=>load(K.snapshots,[]));
  const [meetingNotes,setMeetingNotes]             = useState<MeetingNote[]>(()=>load(K.notes,[]));
  const [priceList,setPriceList]                   = useState<PriceListItem[]>(()=>load(K.priceList,[]));
  const [oddTasks,setOddTasks]                     = useState<OddTask[]>(()=>load(K.oddTasks,[]));
  const [incomeSubscriptions,setIncomeSubscriptions] = useState<IncomeSubscription[]>(()=>load(K.incSubs,[]));
  const [customers,setCustomers]                   = useState<Customer[]>(()=>load(K.customers,[]));
  const [unexpectedIncome,setUnexpectedIncome]     = useState<UnexpectedIncome[]>(()=>load(K.unexpectedInc,[]));
  const [transactions,setTransactions]             = useState<Transaction[]>(()=>load(K.transactions,[]));
  const [currentBalance,setCurrentBalance]         = useState<number>(()=>{ const v=load(K.balance,[0]); return Array.isArray(v)?v[0]:typeof v==='number'?v:0; });
  const [fbReady,setFbReady]                       = useState(false);
  const [fbError,setFbError]                       = useState<string|null>(null);
  const isFirebaseConfigured = true;
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

  // ── LocalStorage persist ──────────────────────────────────────
  useEffect(()=>{persistAndSync(K.clients,'clients',clients);},[clients,fbReady]);
  useEffect(()=>{persistAndSync(K.events,'events',events);},[events,fbReady]);
  useEffect(()=>{persistAndSync(K.costs,'costs',costs);},[costs,fbReady]);
  useEffect(()=>{persistAndSync(K.devProjects,'devProjects',devProjects);},[devProjects,fbReady]);
  useEffect(()=>{persistAndSync(K.budgetInc,'budgetIncome',budgetIncome);},[budgetIncome,fbReady]);
  useEffect(()=>{persistAndSync(K.budgetExp,'budgetExpenses',budgetExpenses);},[budgetExpenses,fbReady]);
  useEffect(()=>{persistAndSync(K.unforeseen,'unforeseenExpenses',unforeseenExpenses);},[unforeseenExpenses,fbReady]);
  useEffect(()=>{persistAndSync(K.onceOff,'onceOffCosts',onceOffCosts);},[onceOffCosts,fbReady]);
  useEffect(()=>{persistAndSync(K.snapshots,'monthlySnapshots',monthlySnapshots);},[monthlySnapshots,fbReady]);
  useEffect(()=>{persistAndSync(K.notes,'meetingNotes',meetingNotes);},[meetingNotes,fbReady]);
  useEffect(()=>{persistAndSync(K.priceList,'priceList',priceList);},[priceList,fbReady]);
  useEffect(()=>{persistAndSync(K.oddTasks,'oddTasks',oddTasks);},[oddTasks,fbReady]);
  useEffect(()=>{persistAndSync(K.incSubs,'incomeSubscriptions',incomeSubscriptions);},[incomeSubscriptions,fbReady]);
  useEffect(()=>{persistAndSync(K.customers,'customers',customers);},[customers,fbReady]);
  useEffect(()=>{persistAndSync(K.unexpectedInc,'unexpectedIncome',unexpectedIncome);},[unexpectedIncome,fbReady]);
  useEffect(()=>{persistAndSync(K.transactions,'transactions',transactions);},[transactions,fbReady]);
  useEffect(()=>{persistAndSync(K.balance,'currentBalance',[currentBalance]);},[currentBalance,fbReady]);

  // ── Supabase realtime listener ────────────────────────────────
  useEffect(()=>{
    const sb = getSupabaseClient();
    const setters:{[k:string]:(v:unknown)=>void}={
      clients:(v)=>setClients(migrateClients(v as Client[])),
      events:(v)=>setEvents(v as CalendarEvent[]),
      costs:(v)=>setCosts(v as CostItem[]),
      devProjects:(v)=>setDevProjects(v as DevProject[]),
      budgetIncome:(v)=>setBudgetIncome(v as BudgetIncomeItem[]),
      budgetExpenses:(v)=>setBudgetExpenses(v as BudgetExpenseItem[]),
      unforeseenExpenses:(v)=>setUnforeseen(v as UnforeseenExpense[]),
      onceOffCosts:(v)=>setOnceOffCosts(v as OnceOffCost[]),
      monthlySnapshots:(v)=>setSnapshots(v as MonthlySnapshot[]),
      meetingNotes:(v)=>setMeetingNotes(v as MeetingNote[]),
      priceList:(v)=>setPriceList(v as PriceListItem[]),
      oddTasks:(v)=>setOddTasks(v as OddTask[]),
      incomeSubscriptions:(v)=>setIncomeSubscriptions(v as IncomeSubscription[]),
      customers:(v)=>setCustomers(v as Customer[]),
      unexpectedIncome:(v)=>setUnexpectedIncome(v as UnexpectedIncome[]),
      transactions:(v)=>setTransactions(v as Transaction[]),
      currentBalance:(v)=>{ const arr=v as number[]; if(Array.isArray(arr)&&arr.length>0) setCurrentBalance(arr[0]); },
    };

    function applyRow(key: string, value: unknown) {
      const setter = setters[key];
      if (setter && Array.isArray(value) && value.length > 0) {
        remoteUpdateKeys.current.add(key);
        setter(value);
      }
    }

    const channel = sb
      .channel('app-data')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_data' },
        (p) => applyRow((p.new as {key:string}).key, (p.new as {value:unknown}).value))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_data' },
        (p) => applyRow((p.new as {key:string}).key, (p.new as {value:unknown}).value))
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
  },[]);

  // ── Transaction log helpers ──────────────────────────────────────
  const addTransaction = (t: Transaction) => setTransactions(p=>[...p,t].sort((a,b)=>b.date.localeCompare(a.date)));
  const removeTransaction = (sourceDesc: string, type: 'income'|'expense') =>
    setTransactions(p=>p.filter(t=>!(t.description===sourceDesc&&t.type===type)));

  // ── CLIENTS ──────────────────────────────────────────────────────
  const addClient=(name:string)=>{
    const idx=clients.length%PRESET_COLORS.length;
    setClients(p=>[...p,{id:genId(),name,color:PRESET_COLORS[idx],icon:PRESET_ICONS[idx],tasks:[],monthlyIncome:0,adSpend:0,monthlyCost:0}]);
  };
  const deleteClient=(id:string)=>setClients(p=>p.filter(c=>c.id!==id));
  const toggleClientPaid=(id:string)=>{
    const client = clients.find(c=>c.id===id);
    if (!client) return;
    const nowPaid = !client.paidThisMonth;
    setClients(p=>p.map(c=>c.id===id?{...c,paidThisMonth:nowPaid}:c));
    if (nowPaid) addTransaction(mkTransaction(`Retainer — ${client.name}`, client.monthlyIncome, 'income', 'Retainer'));
    else removeTransaction(`Retainer — ${client.name}`, 'income');
  };
  const resetMonthlyPayments=()=>{
    setClients(p=>p.map(c=>({...c,paidThisMonth:false,adSpendPaid:false})));
    setCosts(p=>p.map(c=>({...c,paid:false})));
    setBudgetIncome(p=>p.map(i=>({...i,paid:false})));
    setBudgetExpenses(p=>p.map(e=>({...e,paid:false})));
    setIncomeSubscriptions(p=>p.map(s=>({...s,paid:false})));
  };
  const updateClientName=(id:string,name:string)=>setClients(p=>p.map(c=>c.id===id?{...c,name}:c));
  const updateClientColor=(id:string,color:string)=>setClients(p=>p.map(c=>c.id===id?{...c,color}:c));
  const updateClientIcon=(id:string,icon:string)=>setClients(p=>p.map(c=>c.id===id?{...c,icon}:c));
  const updateClientFinancials=(id:string,field:'monthlyIncome'|'adSpend'|'monthlyCost',value:number)=>
    setClients(p=>p.map(c=>c.id===id?{...c,[field]:value}:c));

  // ── TASKS ─────────────────────────────────────────────────────────
  const addTask=(cid:string,title:string,dueDate:string,assignedTo?:string)=>
    setClients(p=>p.map(c=>c.id===cid?{...c,tasks:[...c.tasks,{id:genId(),title,dueDate,status:'not-started' as TaskStatus,assignedTo,createdAt:new Date().toISOString()}]}:c));
  const toggleTask=(cid:string,tid:string)=>
    setClients(p=>p.map(c=>c.id===cid?{...c,tasks:c.tasks.map(t=>t.id===tid?{...t,status:(t.status==='completed'?'not-started':'completed') as TaskStatus}:t)}:c));
  const deleteTask=(cid:string,tid:string)=>
    setClients(p=>p.map(c=>c.id===cid?{...c,tasks:c.tasks.filter(t=>t.id!==tid)}:c));
  const editTask=(cid:string,tid:string,title:string,dueDate:string)=>
    setClients(p=>p.map(c=>c.id===cid?{...c,tasks:c.tasks.map(t=>t.id===tid?{...t,title,dueDate}:t)}:c));
  const assignTask=(cid:string,tid:string,userId:string|undefined)=>
    setClients(p=>p.map(c=>c.id===cid?{...c,tasks:c.tasks.map(t=>t.id===tid?{...t,assignedTo:userId}:t)}:c));
  const updateTaskStatus=(cid:string,tid:string,status:TaskStatus,delayReason?:string)=>
    setClients(p=>p.map(c=>c.id===cid?{...c,tasks:c.tasks.map(t=>t.id===tid?{...t,status,delayReason:status==='delayed'?delayReason:undefined}:t)}:c));

  // ── BUSINESS COSTS ────────────────────────────────────────────────
  const addCost=(name:string,amount:number,category:string)=>setCosts(p=>[...p,{id:genId(),name,amount,category,paid:false}]);
  const deleteCost=(id:string)=>setCosts(p=>p.filter(c=>c.id!==id));
  const updateCost=(id:string,name:string,amount:number,category:string)=>setCosts(p=>p.map(c=>c.id===id?{...c,name,amount,category}:c));
  const toggleCostPaid=(id:string)=>{
    const item = costs.find(c=>c.id===id);
    if (!item) return;
    const nowPaid = !item.paid;
    setCosts(p=>p.map(c=>c.id===id?{...c,paid:nowPaid}:c));
    if (nowPaid) addTransaction(mkTransaction(item.name, item.amount, 'expense', item.category));
    else removeTransaction(item.name, 'expense');
  };
  const toggleClientAdSpendPaid=(id:string)=>setClients(p=>p.map(c=>c.id===id?{...c,adSpendPaid:!c.adSpendPaid}:c));

  // ── ONCE-OFF COSTS ────────────────────────────────────────────────
  const addOnceOffCost=(name:string,amount:number,dueDate:string,notes:string)=>
    setOnceOffCosts(p=>[...p,{id:genId(),name,amount,dueDate,paid:false,notes,createdAt:new Date().toISOString()}]);
  const deleteOnceOffCost=(id:string)=>setOnceOffCosts(p=>p.filter(c=>c.id!==id));
  const updateOnceOffCost=(id:string,name:string,amount:number,dueDate:string,notes:string)=>
    setOnceOffCosts(p=>p.map(c=>c.id===id?{...c,name,amount,dueDate,notes}:c));
  const toggleOnceOffPaid=(id:string)=>{
    const item = onceOffCosts.find(c=>c.id===id);
    if (!item) return;
    const nowPaid = !item.paid;
    setOnceOffCosts(p=>p.map(c=>c.id===id?{...c,paid:nowPaid}:c));
    if (nowPaid) addTransaction(mkTransaction(`Once-off: ${item.name}`, item.amount, 'expense', 'Once-off'));
    else removeTransaction(`Once-off: ${item.name}`, 'expense');
  };

  // ── DEV PROJECTS ──────────────────────────────────────────────────
  const addDevProject=(clientName:string,projectName:string,category:'web'|'app'='web')=>{
    const idx=devProjects.length%PRESET_COLORS.length;
    setDevProjects(p=>[...p,{id:genId(),clientName,projectName,category,color:PRESET_COLORS[(idx+6)%PRESET_COLORS.length],icon:PRESET_ICONS[(idx+8)%PRESET_ICONS.length],status:'active',depositAmount:0,depositPaid:false,finalAmount:0,finalPaid:false,tasks:[],createdAt:new Date().toISOString()}]);
  };
  const deleteDevProject=(id:string)=>setDevProjects(p=>p.filter(x=>x.id!==id));
  const updateDevProject=(id:string,changes:Partial<DevProject>)=>setDevProjects(p=>p.map(x=>x.id===id?{...x,...changes}:x));
  const completeDevProject=(id:string)=>setDevProjects(p=>p.map(x=>x.id===id?{...x,status:'completed',completedAt:new Date().toISOString()}:x));
  const reopenDevProject=(id:string)=>setDevProjects(p=>p.map(x=>x.id===id?{...x,status:'active',completedAt:undefined}:x));
  const updateDevProjectColor=(id:string,color:string)=>setDevProjects(p=>p.map(x=>x.id===id?{...x,color}:x));
  const updateDevProjectIcon=(id:string,icon:string)=>setDevProjects(p=>p.map(x=>x.id===id?{...x,icon}:x));
  const addDevTask=(pid:string,title:string)=>setDevProjects(p=>p.map(x=>x.id===pid?{...x,tasks:[...x.tasks,{id:genId(),title,completed:false,subTasks:[]}]}:x));
  const toggleDevTask=(pid:string,tid:string)=>setDevProjects(p=>p.map(x=>x.id===pid?{...x,tasks:x.tasks.map(t=>t.id===tid?{...t,completed:!t.completed}:t)}:x));
  const deleteDevTask=(pid:string,tid:string)=>setDevProjects(p=>p.map(x=>x.id===pid?{...x,tasks:x.tasks.filter(t=>t.id!==tid)}:x));
  const editDevTask=(pid:string,tid:string,title:string)=>setDevProjects(p=>p.map(x=>x.id===pid?{...x,tasks:x.tasks.map(t=>t.id===tid?{...t,title}:t)}:x));
  const addSubTask=(pid:string,tid:string,title:string)=>setDevProjects(p=>p.map(x=>x.id===pid?{...x,tasks:x.tasks.map(t=>t.id===tid?{...t,subTasks:[...t.subTasks,{id:genId(),title,completed:false}]}:t)}:x));
  const toggleSubTask=(pid:string,tid:string,sid:string)=>setDevProjects(p=>p.map(x=>x.id===pid?{...x,tasks:x.tasks.map(t=>t.id===tid?{...t,subTasks:t.subTasks.map(s=>s.id===sid?{...s,completed:!s.completed}:s)}:t)}:x));
  const deleteSubTask=(pid:string,tid:string,sid:string)=>setDevProjects(p=>p.map(x=>x.id===pid?{...x,tasks:x.tasks.map(t=>t.id===tid?{...t,subTasks:t.subTasks.filter(s=>s.id!==sid)}:t)}:x));

  // ── CALENDAR ──────────────────────────────────────────────────────
  const addEvent=(date:string,time:string,title:string,description:string,color:string)=>
    setEvents(p=>[...p,{id:genId(),date,time,title,description,color}]);
  const deleteEvent=(id:string)=>setEvents(p=>p.filter(e=>e.id!==id));
  const editEvent=(id:string,time:string,title:string,description:string,color:string)=>
    setEvents(p=>p.map(e=>e.id===id?{...e,time,title,description,color}:e));
  const eventsForDate=(date:string)=>events.filter(e=>e.date===date).sort((a,b)=>a.time.localeCompare(b.time));

  // ── PERSONAL BUDGET ───────────────────────────────────────────────
  const addBudgetIncome=(name:string,amount:number,category:BudgetIncomeCategory,recurring:boolean)=>
    setBudgetIncome(p=>[...p,{id:genId(),name,amount,category,recurring,paid:false}]);
  const deleteBudgetIncome=(id:string)=>setBudgetIncome(p=>p.filter(i=>i.id!==id));
  const updateBudgetIncome=(id:string,name:string,amount:number,category:BudgetIncomeCategory,recurring:boolean)=>
    setBudgetIncome(p=>p.map(i=>i.id===id?{...i,name,amount,category,recurring}:i));
  const toggleBudgetIncomePaid=(id:string)=>setBudgetIncome(p=>p.map(i=>i.id===id?{...i,paid:!i.paid}:i));
  const addBudgetExpense=(name:string,amount:number,category:BudgetExpenseCategory,recurring:boolean)=>
    setBudgetExpenses(p=>[...p,{id:genId(),name,amount,category,recurring,paid:false}]);
  const deleteBudgetExpense=(id:string)=>setBudgetExpenses(p=>p.filter(e=>e.id!==id));
  const updateBudgetExpense=(id:string,name:string,amount:number,category:BudgetExpenseCategory,recurring:boolean)=>
    setBudgetExpenses(p=>p.map(e=>e.id===id?{...e,name,amount,category,recurring}:e));
  const toggleBudgetExpensePaid=(id:string)=>setBudgetExpenses(p=>p.map(e=>e.id===id?{...e,paid:!e.paid}:e));
  const addUnforeseen=(name:string,amount:number,date:string,notes:string)=>
    setUnforeseen(p=>[...p,{id:genId(),name,amount,date,notes,paid:false}]);
  const deleteUnforeseen=(id:string)=>setUnforeseen(p=>p.filter(e=>e.id!==id));
  const updateUnforeseen=(id:string,name:string,amount:number,date:string,notes:string)=>
    setUnforeseen(p=>p.map(e=>e.id===id?{...e,name,amount,date,notes}:e));
  const toggleUnforeseenPaid=(id:string)=>setUnforeseen(p=>p.map(e=>e.id===id?{...e,paid:!e.paid}:e));

  // ── MONTHLY SNAPSHOTS ─────────────────────────────────────────────
  const saveMonthSnapshot=(notes:string='')=>{
    const key=currentMonthKey();
    const devReceived=devProjects.reduce((s,p)=>{
      let r=0;
      if(p.depositPaid)r+=p.depositAmount;
      if(p.finalPaid)  r+=p.finalAmount;
      return s+r;
    },0);
    const snap:MonthlySnapshot={
      id:genId(), monthKey:key, label:monthLabel(key),
      savedAt:new Date().toISOString(),
      businessIncome:totalMonthlyIncome,
      businessAdSpend:totalAdSpend,
      businessCosts:totalCosts,
      businessProfit:totalProfit,
      devIncome:devReceived,
      personalIncome:totalBudgetIncome,
      personalExpenses:totalBudgetExpenses,
      personalUnforeseen:unforeseenExpenses.filter(e=>!e.paid).reduce((s,e)=>s+e.amount,0),
      personalBalance:budgetBalance,
      notes,
    };
    setSnapshots(p=>{
      const existing=p.findIndex(s=>s.monthKey===key);
      if(existing>=0){const n=[...p];n[existing]=snap;return n;}
      return [...p,snap].sort((a,b)=>b.monthKey.localeCompare(a.monthKey));
    });
  };
  const deleteSnapshot=(id:string)=>setSnapshots(p=>p.filter(s=>s.id!==id));
  const updateSnapshotNotes=(id:string,notes:string)=>setSnapshots(p=>p.map(s=>s.id===id?{...s,notes}:s));

  // ── MEETING NOTES ─────────────────────────────────────────────────
  const addMeetingNote=(date:string,customerName:string,title:string,notes:string,followUp:string)=>
    setMeetingNotes(p=>[...p,{id:genId(),date,customerName,title,notes,followUp,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]
      .sort((a,b)=>b.date.localeCompare(a.date)));
  const deleteMeetingNote=(id:string)=>setMeetingNotes(p=>p.filter(n=>n.id!==id));
  const updateMeetingNote=(id:string,date:string,customerName:string,title:string,notes:string,followUp:string)=>
    setMeetingNotes(p=>p.map(n=>n.id===id?{...n,date,customerName,title,notes,followUp,updatedAt:new Date().toISOString()}:n)
      .sort((a,b)=>b.date.localeCompare(a.date)));

  // ── PRICE LIST ────────────────────────────────────────────────────
  const addPriceItem=(productCode:string,name:string,category:PriceCategory,price:number,description:string,visibleTo:'all'|string[])=>
    setPriceList(p=>[...p,{id:genId(),productCode,name,category,price,description,visibleTo,createdAt:new Date().toISOString()}]);
  const deletePriceItem=(id:string)=>setPriceList(p=>p.filter(i=>i.id!==id));
  const updatePriceItem=(id:string,productCode:string,name:string,category:PriceCategory,price:number,description:string,visibleTo:'all'|string[])=>
    setPriceList(p=>p.map(i=>i.id===id?{...i,productCode,name,category,price,description,visibleTo}:i));

  // ── ODD TASKS ─────────────────────────────────────────────────────
  const addOddTask=(title:string,dueDate:string,notes:string,assignedTo?:string,priority:OddTaskPriority='medium')=>
    setOddTasks(p=>[...p,{id:genId(),title,dueDate,notes,status:'not-started' as TaskStatus,assignedTo,priority,createdAt:new Date().toISOString()}]);
  const deleteOddTask=(id:string)=>setOddTasks(p=>p.filter(t=>t.id!==id));
  const updateOddTask=(id:string,title:string,dueDate:string,notes:string,priority:OddTaskPriority)=>
    setOddTasks(p=>p.map(t=>t.id===id?{...t,title,dueDate,notes,priority}:t));
  const updateOddTaskStatus=(id:string,status:TaskStatus,delayReason?:string)=>
    setOddTasks(p=>p.map(t=>t.id===id?{...t,status,delayReason:status==='delayed'?delayReason:undefined}:t));
  const assignOddTask=(id:string,userId:string|undefined)=>
    setOddTasks(p=>p.map(t=>t.id===id?{...t,assignedTo:userId}:t));

  // ── INCOME SUBSCRIPTIONS ──────────────────────────────────────────
  const addIncomeSubscription=(customerName:string,amount:number,invoiceDate:string)=>
    setIncomeSubscriptions(p=>[...p,{id:genId(),customerName,amount,invoiceDate,paid:false,createdAt:new Date().toISOString()}]);
  const deleteIncomeSubscription=(id:string)=>setIncomeSubscriptions(p=>p.filter(s=>s.id!==id));
  const updateIncomeSubscription=(id:string,customerName:string,amount:number,invoiceDate:string)=>
    setIncomeSubscriptions(p=>p.map(s=>s.id===id?{...s,customerName,amount,invoiceDate}:s));
  const toggleIncomeSubPaid=(id:string)=>{
    const item = incomeSubscriptions.find(s=>s.id===id);
    if (!item) return;
    const nowPaid = !item.paid;
    setIncomeSubscriptions(p=>p.map(s=>s.id===id?{...s,paid:nowPaid}:s));
    if (nowPaid) addTransaction(mkTransaction(`Income: ${item.customerName}`, item.amount, 'income', 'Subscription'));
    else removeTransaction(`Income: ${item.customerName}`, 'income');
  };

  // ── CUSTOMERS ─────────────────────────────────────────────────────
  const addCustomer=(name:string,company?:string,email?:string,phone?:string,address?:string,notes?:string)=>
    setCustomers(p=>[...p,{id:genId(),name,company,email,phone,address,notes,createdAt:new Date().toISOString()}]);
  const deleteCustomer=(id:string)=>setCustomers(p=>p.filter(c=>c.id!==id));
  const updateCustomer=(id:string,name:string,company?:string,email?:string,phone?:string,address?:string,notes?:string)=>
    setCustomers(p=>p.map(c=>c.id===id?{...c,name,company,email,phone,address,notes}:c));

  // ── UNEXPECTED INCOME ─────────────────────────────────────────────
  const addUnexpectedIncome=(name:string,amount:number,date:string,notes:string)=>
    setUnexpectedIncome(p=>[...p,{id:genId(),name,amount,date,notes,paid:false,createdAt:new Date().toISOString()}]);
  const deleteUnexpectedIncome=(id:string)=>setUnexpectedIncome(p=>p.filter(i=>i.id!==id));
  const updateUnexpectedIncome=(id:string,name:string,amount:number,date:string,notes:string)=>
    setUnexpectedIncome(p=>p.map(i=>i.id===id?{...i,name,amount,date,notes}:i));
  const toggleUnexpectedIncomePaid=(id:string)=>{
    const item = unexpectedIncome.find(i=>i.id===id);
    if (!item) return;
    const nowPaid = !item.paid;
    setUnexpectedIncome(p=>p.map(i=>i.id===id?{...i,paid:nowPaid}:i));
    if (nowPaid) addTransaction(mkTransaction(`Unexpected: ${item.name}`, item.amount, 'income', 'Unexpected'));
    else removeTransaction(`Unexpected: ${item.name}`, 'income');
  };

  // ── TRANSACTIONS ──────────────────────────────────────────────────
  const clearTransactions=()=>setTransactions([]);

  // ── COMPUTED ──────────────────────────────────────────────────────
  const totalMonthlyIncome  = clients.reduce((s,c)=>s+c.monthlyIncome,0);
  const totalReceivedIncome = clients.filter(c=>c.paidThisMonth).reduce((s,c)=>s+c.monthlyIncome,0);
  const totalAdSpend        = clients.reduce((s,c)=>s+c.adSpend,0);
  const totalPaidAdSpend    = clients.filter(c=>c.adSpendPaid).reduce((s,c)=>s+c.adSpend,0);
  const totalMonthlyCosts   = costs.reduce((s,c)=>s+c.amount,0);
  const totalPaidMonthlyCosts = costs.filter(c=>c.paid).reduce((s,c)=>s+c.amount,0);
  const totalClientCosts    = clients.reduce((s,c)=>s+c.monthlyCost,0);
  const totalOnceOffUnpaid  = onceOffCosts.filter(c=>!c.paid).reduce((s,c)=>s+c.amount,0);
  const totalOnceOffPaid    = onceOffCosts.filter(c=>c.paid).reduce((s,c)=>s+c.amount,0);
  const totalCosts          = totalMonthlyCosts + totalClientCosts + totalAdSpend + totalOnceOffUnpaid;
  const totalPendingIncome  = devProjects.reduce((s,p)=>{
    let pending=0;
    if(!p.depositPaid)pending+=p.depositAmount;
    if(!p.finalPaid)  pending+=p.finalAmount;
    return s+pending;
  },0);
  const totalProfit         = totalMonthlyIncome - totalAdSpend - totalMonthlyCosts - totalClientCosts;
  const businessBalance     = currentBalance + totalReceivedIncome - totalPaidAdSpend - totalPaidMonthlyCosts - totalClientCosts - totalOnceOffPaid;

  const totalBudgetIncome      = budgetIncome.reduce((s,i)=>s+i.amount,0);
  const totalPaidBudgetIncome  = budgetIncome.filter(i=>i.paid).reduce((s,i)=>s+i.amount,0);
  const totalBudgetExpenses    = budgetExpenses.reduce((s,e)=>s+e.amount,0);
  const totalPaidBudgetExpenses= budgetExpenses.filter(e=>e.paid).reduce((s,e)=>s+e.amount,0);
  const totalUnforeseen        = unforeseenExpenses.filter(e=>!e.paid).reduce((s,e)=>s+e.amount,0);
  const budgetBalance          = totalPaidBudgetIncome - totalPaidBudgetExpenses - totalUnforeseen;

  const allTimeBusinessIncome  = monthlySnapshots.reduce((s,sn)=>s+(sn.businessIncome||0)+(sn.devIncome||0),0);
  const allTimeBusinessProfit  = monthlySnapshots.reduce((s,sn)=>s+(sn.businessProfit||0)+(sn.devIncome||0),0);
  const allTimePersonalBalance = monthlySnapshots.reduce((s,sn)=>s+(sn.personalBalance||0),0);

  // Money in/out for the Home dashboard bars (only paid items)
  const totalPaidIncome = totalReceivedIncome
    + incomeSubscriptions.filter(s=>s.paid).reduce((s,i)=>s+i.amount,0)
    + unexpectedIncome.filter(i=>i.paid).reduce((s,i)=>s+i.amount,0);
  const totalPaidExpenses = totalPaidMonthlyCosts
    + totalPaidAdSpend
    + totalClientCosts
    + totalOnceOffPaid;

  const t0=todayStr();
  const overdueCount = clients.reduce((n,c)=>
    n+c.tasks.filter(tk=>tk.status!=='completed'&&tk.status!=='delayed'&&tk.dueDate<t0).length,0)
    + oddTasks.filter(tk=>tk.status!=='completed'&&tk.status!=='delayed'&&tk.dueDate<t0).length;

  return {
    clients,events,costs,devProjects,
    budgetIncome,budgetExpenses,unforeseenExpenses,
    onceOffCosts,monthlySnapshots,meetingNotes,
    currentBalance, setCurrentBalance,
    isFirebaseConfigured, fbReady, fbError,
    addClient,deleteClient,updateClientName,updateClientColor,updateClientIcon,updateClientFinancials,
    toggleClientPaid, toggleClientAdSpendPaid, resetMonthlyPayments,
    addTask,toggleTask,deleteTask,editTask,assignTask,updateTaskStatus,
    addCost,deleteCost,updateCost,toggleCostPaid,
    addOnceOffCost,deleteOnceOffCost,updateOnceOffCost,toggleOnceOffPaid,
    addDevProject,deleteDevProject,updateDevProject,completeDevProject,reopenDevProject,
    updateDevProjectColor,updateDevProjectIcon,
    addDevTask,toggleDevTask,deleteDevTask,editDevTask,
    addSubTask,toggleSubTask,deleteSubTask,
    addEvent,deleteEvent,editEvent,eventsForDate,
    addBudgetIncome,deleteBudgetIncome,updateBudgetIncome,toggleBudgetIncomePaid,
    addBudgetExpense,deleteBudgetExpense,updateBudgetExpense,toggleBudgetExpensePaid,
    addUnforeseen,deleteUnforeseen,updateUnforeseen,toggleUnforeseenPaid,
    saveMonthSnapshot,deleteSnapshot,updateSnapshotNotes,
    addMeetingNote,deleteMeetingNote,updateMeetingNote,
    priceList,addPriceItem,deletePriceItem,updatePriceItem,
    oddTasks,addOddTask,deleteOddTask,updateOddTask,updateOddTaskStatus,assignOddTask,
    incomeSubscriptions,addIncomeSubscription,deleteIncomeSubscription,updateIncomeSubscription,toggleIncomeSubPaid,
    customers,addCustomer,deleteCustomer,updateCustomer,
    unexpectedIncome,addUnexpectedIncome,deleteUnexpectedIncome,updateUnexpectedIncome,toggleUnexpectedIncomePaid,
    transactions,clearTransactions,
    totalMonthlyIncome,totalReceivedIncome,
    totalAdSpend,totalPaidAdSpend,
    totalMonthlyCosts,totalPaidMonthlyCosts,
    totalClientCosts,
    totalOnceOffUnpaid,totalOnceOffPaid,
    totalCosts,totalPendingIncome,totalProfit,businessBalance,
    totalBudgetIncome,totalPaidBudgetIncome,
    totalBudgetExpenses,totalPaidBudgetExpenses,
    totalUnforeseen,budgetBalance,
    allTimeBusinessIncome,allTimeBusinessProfit,allTimePersonalBalance,
    totalPaidIncome,totalPaidExpenses,
    overdueCount,
  };
}
