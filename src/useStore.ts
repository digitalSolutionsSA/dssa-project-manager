import { useState, useEffect, useRef } from 'react';
import {
  Client, Task, TaskStatus, CalendarEvent, CostItem, DevProject,
  BudgetIncomeItem, BudgetExpenseItem, UnforeseenExpense,
  BudgetIncomeCategory, BudgetExpenseCategory,
  OnceOffCost, MonthlySnapshot, MeetingNote,
  PriceListItem, PriceCategory,
  OddTask, OddTaskPriority,
} from './types';
import { getFirebaseDb } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

// ── Storage keys ──────────────────────────────────────────────────
const K = {
  clients:      'sb_clients',
  events:       'sb_events',
  costs:        'sb_costs',
  devProjects:  'sb_devProjects',
  budgetInc:    'sb_budgetIncome',
  budgetExp:    'sb_budgetExpenses',
  unforeseen:   'sb_unforeseen',
  onceOff:      'sb_onceOffCosts',
  snapshots:    'sb_snapshots',
  notes:        'sb_meetingNotes',
  balance:      'sb_currentBalance',
  priceList:    'sb_priceList',
  oddTasks:     'sb_oddTasks',
};

// ── Exports ───────────────────────────────────────────────────────
export const PRESET_COLORS = [
  '#3b82f6','#6366f1','#8b5cf6','#7c3aed','#a855f7','#c026d3',
  '#06b6d4','#0891b2','#14b8a6','#10b981','#22c55e','#16a34a',
  '#f59e0b','#f97316','#ef4444','#dc2626','#e11d48','#ec4899',
  '#64748b','#475569','#0ea5e9','#84cc16','#a3e635','#fb923c',
];

export const PRESET_ICONS = [
  // Business & Work
  '💼','📊','📈','📋','🏢','🤝','💡','🎯','📌','🗂️','📁','📂','🖇️','📎','🗃️','🗄️',
  // Tech & Digital
  '💻','📱','🌐','⚙️','🛠️','🔌','📡','🖥️','🖨️','⌨️','🖱️','💾','💿','📀','🔧','🔩',
  // Creative & Design
  '🎨','✏️','📸','🎬','🎵','🎭','🖌️','✨','🖼️','🎞️','🎙️','🎚️','🎛️','📽️','🎤','🎧',
  // Finance & Money
  '💰','💎','🏦','💳','📉','🪙','💵','🏆','💹','🤑','💸','🏧','💲','🪙','📈','💴',
  // People & Social
  '👥','🤵','👑','🦁','🚀','⭐','🌟','🔮','👤','👨‍💼','👩‍💼','🤝','🫱','🫲','👋','🙌',
  // Nature & Elements
  '🔥','⚡','🌊','🌿','🏔️','🌱','🌳','🌻','🌈','☀️','🌙','❄️','🌪️','🌊','🍃','🌾',
  // Food & Lifestyle
  '☕','🍕','🍔','🥗','🍷','🎂','🍎','🥑','🧃','🥤','🍜','🍣','🥩','🧁','🍺','🎉',
  // Transport & Places
  '🚗','✈️','🚀','🏠','🏪','🏨','🏋️','⛽','🚢','🚁','🛸','🚂','🏗️','🏰','🌆','🗺️',
  // Sports & Health
  '⚽','🏀','🎾','🏊','🧘','💪','🏃','🧗','🎯','🥊','🏄','🎿','🏇','🚴','🤸','🏌️',
  // Symbols & Misc
  '🛡️','⚔️','🔑','🗝️','🔐','💌','📣','📢','🚦','✅','❌','💯','🆕','🔔','🎁','🎖️',
  // Animals
  '🦁','🐯','🦊','🐺','🦋','🦅','🐉','🦄','🐸','🦁','🐧','🦜','🐬','🦈','🦒','🦓',
  // More fun
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

// ── Firebase push helper ──────────────────────────────────────────
async function fbPush(key: string, val: unknown) {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await setDoc(doc(db,'appData',key),{ value: val, updatedAt: new Date().toISOString() });
  } catch(e){ console.warn('Firebase push failed:',e); }
}

// ── Task migration (completed:boolean → status:TaskStatus) ────────
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

// ══════════════════════════════════════════════════════════════════
// MAIN STORE
// ══════════════════════════════════════════════════════════════════
export function useStore() {
  const [clients,setClients]                     = useState<Client[]>(()=>migrateClients(load(K.clients,DEFAULT_CLIENTS)));
  const [events,setEvents]                       = useState<CalendarEvent[]>(()=>load(K.events,[]));
  const [costs,setCosts]                         = useState<CostItem[]>(()=>load(K.costs,DEFAULT_COSTS));
  const [devProjects,setDevProjects]             = useState<DevProject[]>(()=>load(K.devProjects,[]));
  const [budgetIncome,setBudgetIncome]           = useState<BudgetIncomeItem[]>(()=>load(K.budgetInc,[]));
  const [budgetExpenses,setBudgetExpenses]       = useState<BudgetExpenseItem[]>(()=>load(K.budgetExp,[]));
  const [unforeseenExpenses,setUnforeseen]       = useState<UnforeseenExpense[]>(()=>load(K.unforeseen,[]));
  const [onceOffCosts,setOnceOffCosts]           = useState<OnceOffCost[]>(()=>load(K.onceOff,[]));
  const [monthlySnapshots,setSnapshots]          = useState<MonthlySnapshot[]>(()=>load(K.snapshots,[]));
  const [meetingNotes,setMeetingNotes]           = useState<MeetingNote[]>(()=>load(K.notes,[]));
  const [priceList,setPriceList]                 = useState<PriceListItem[]>(()=>load(K.priceList,[]));
  const [oddTasks,setOddTasks]                   = useState<OddTask[]>(()=>load(K.oddTasks,[]));
  // Balance stored as a single-element array to reuse the same Firebase sync infrastructure
  const [currentBalance,setCurrentBalance]        = useState<number>(()=>{ const v=load(K.balance,[0]); return Array.isArray(v)?v[0]:typeof v==='number'?v:0; });
  const [fbReady,setFbReady]                     = useState(false);
  const [fbError,setFbError]                     = useState<string|null>(null);
  const isFirebaseConfigured = !!getFirebaseDb();
  // Track which collection keys are being updated from Firebase so we don't
  // push stale localStorage data back after receiving a remote snapshot.
  const remoteUpdateKeys = useRef(new Set<string>());

  const persistAndSync = (localKey: string, firebaseKey: string, value: unknown) => {
    save(localKey, value);

    if (!fbReady) return;

    if (remoteUpdateKeys.current.has(firebaseKey)) {
      remoteUpdateKeys.current.delete(firebaseKey);
      return;
    }

    fbPush(firebaseKey, value);
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
  // Balance wrapped in array so it flows through the same persistAndSync infrastructure
  useEffect(()=>{persistAndSync(K.balance,'currentBalance',[currentBalance]);},[currentBalance,fbReady]);

  // ── Firebase realtime listener ────────────────────────────────
  useEffect(()=>{
    const db=getFirebaseDb();
    if(!db)return;
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
      // Balance stored as [number] — unwrap on receive
      currentBalance:(v)=>{ const arr=v as number[]; if(Array.isArray(arr)&&arr.length>0) setCurrentBalance(arr[0]); },
    };
    // Only mark fbReady after ALL listeners have fired their first snapshot.
    // If any single listener fires early (e.g. a new/missing doc), it would
    // otherwise set fbReady=true and trigger writes of stale local data back
    // to Firebase before the other collections have been received.
    const totalListeners = Object.keys(setters).length;
    let readyCount = 0;
    const markOneReady = () => {
      readyCount++;
      if (readyCount >= totalListeners) {
        setFbReady(true);
        setFbError(null);
      }
    };

    // Map from Firestore doc key → localStorage key, used by the empty-overwrite guard
    const lsKeys: Record<string, string> = {
      clients: K.clients, events: K.events, costs: K.costs,
      devProjects: K.devProjects, budgetIncome: K.budgetInc,
      budgetExpenses: K.budgetExp, unforeseenExpenses: K.unforeseen,
      onceOffCosts: K.onceOff, monthlySnapshots: K.snapshots,
      meetingNotes: K.notes, priceList: K.priceList,
      oddTasks: K.oddTasks, currentBalance: K.balance,
    };

    const unsubs = Object.entries(setters).map(([key,setter])=>{
      let firstSnap = true;
      return onSnapshot(doc(db,'appData',key),(snap)=>{
        if(snap.exists()){
          const d=snap.data();
          if(d&&Array.isArray(d.value)){
            // Guard: if Firebase returned an empty array but localStorage has real data,
            // skip the overwrite — the persistence effect will push local data back to Firebase.
            if(d.value.length === 0){
              const lsKey = lsKeys[key];
              if(lsKey){
                try {
                  const local = localStorage.getItem(lsKey);
                  if(local){
                    const parsed = JSON.parse(local);
                    if(Array.isArray(parsed) && parsed.length > 0){
                      if (firstSnap) { firstSnap = false; markOneReady(); }
                      return;
                    }
                  }
                } catch { /* ignore parse errors */ }
              }
            }
            remoteUpdateKeys.current.add(key);
            setter(d.value);
          }
        }
        if (firstSnap) { firstSnap = false; markOneReady(); }
      },(err)=>{
        console.warn('FB listen error:',err.message);
        setFbError(err.message);
        if (firstSnap) { firstSnap = false; markOneReady(); }
      });
    });
    return ()=>unsubs.forEach(u=>u());
  },[]);

  // ── CLIENTS ──────────────────────────────────────────────────────
  const addClient=(name:string)=>{
    const idx=clients.length%PRESET_COLORS.length;
    setClients(p=>[...p,{id:genId(),name,color:PRESET_COLORS[idx],icon:PRESET_ICONS[idx],tasks:[],monthlyIncome:0,adSpend:0,monthlyCost:0}]);
  };
  const deleteClient=(id:string)=>setClients(p=>p.filter(c=>c.id!==id));
  const toggleClientPaid=(id:string)=>setClients(p=>p.map(c=>c.id===id?{...c,paidThisMonth:!c.paidThisMonth}:c));
  const resetMonthlyPayments=()=>{
    setClients(p=>p.map(c=>({...c,paidThisMonth:false,adSpendPaid:false})));
    setCosts(p=>p.map(c=>({...c,paid:false})));
    setBudgetIncome(p=>p.map(i=>({...i,paid:false})));
    setBudgetExpenses(p=>p.map(e=>({...e,paid:false})));
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
  const updateTaskStatus=(cid:string,tid:string,status:TaskStatus)=>
    setClients(p=>p.map(c=>c.id===cid?{...c,tasks:c.tasks.map(t=>t.id===tid?{...t,status}:t)}:c));

  // ── BUSINESS COSTS ────────────────────────────────────────────────
  const addCost=(name:string,amount:number,category:string)=>setCosts(p=>[...p,{id:genId(),name,amount,category,paid:false}]);
  const deleteCost=(id:string)=>setCosts(p=>p.filter(c=>c.id!==id));
  const updateCost=(id:string,name:string,amount:number,category:string)=>setCosts(p=>p.map(c=>c.id===id?{...c,name,amount,category}:c));
  const toggleCostPaid=(id:string)=>setCosts(p=>p.map(c=>c.id===id?{...c,paid:!c.paid}:c));
  const toggleClientAdSpendPaid=(id:string)=>setClients(p=>p.map(c=>c.id===id?{...c,adSpendPaid:!c.adSpendPaid}:c));

  // ── ONCE-OFF COSTS ────────────────────────────────────────────────
  const addOnceOffCost=(name:string,amount:number,dueDate:string,notes:string)=>
    setOnceOffCosts(p=>[...p,{id:genId(),name,amount,dueDate,paid:false,notes,createdAt:new Date().toISOString()}]);
  const deleteOnceOffCost=(id:string)=>setOnceOffCosts(p=>p.filter(c=>c.id!==id));
  const updateOnceOffCost=(id:string,name:string,amount:number,dueDate:string,notes:string)=>
    setOnceOffCosts(p=>p.map(c=>c.id===id?{...c,name,amount,dueDate,notes}:c));
  const toggleOnceOffPaid=(id:string)=>setOnceOffCosts(p=>p.map(c=>c.id===id?{...c,paid:!c.paid}:c));

  // ── DEV PROJECTS ──────────────────────────────────────────────────
  const addDevProject=(clientName:string,projectName:string)=>{
    const idx=devProjects.length%PRESET_COLORS.length;
    setDevProjects(p=>[...p,{id:genId(),clientName,projectName,color:PRESET_COLORS[(idx+6)%PRESET_COLORS.length],icon:PRESET_ICONS[(idx+8)%PRESET_ICONS.length],status:'active',depositAmount:0,depositPaid:false,finalAmount:0,finalPaid:false,tasks:[],createdAt:new Date().toISOString()}]);
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
    // Replace if same month already exists
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
  const updateOddTaskStatus=(id:string,status:TaskStatus)=>
    setOddTasks(p=>p.map(t=>t.id===id?{...t,status}:t));
  const assignOddTask=(id:string,userId:string|undefined)=>
    setOddTasks(p=>p.map(t=>t.id===id?{...t,assignedTo:userId}:t));

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
  // Available balance only deducts costs/ad-spend that have actually been paid out
  const businessBalance     = currentBalance + totalReceivedIncome - totalPaidAdSpend - totalPaidMonthlyCosts - totalClientCosts - totalOnceOffPaid;

  const totalBudgetIncome      = budgetIncome.reduce((s,i)=>s+i.amount,0);
  const totalPaidBudgetIncome  = budgetIncome.filter(i=>i.paid).reduce((s,i)=>s+i.amount,0);
  const totalBudgetExpenses    = budgetExpenses.reduce((s,e)=>s+e.amount,0);
  const totalPaidBudgetExpenses= budgetExpenses.filter(e=>e.paid).reduce((s,e)=>s+e.amount,0);
  const totalUnforeseen        = unforeseenExpenses.filter(e=>!e.paid).reduce((s,e)=>s+e.amount,0);
  // Budget balance uses paid/received amounts so it stays accurate to what has actually moved
  const budgetBalance          = totalPaidBudgetIncome - totalPaidBudgetExpenses - totalUnforeseen;

  // Cumulative totals across all snapshots
  // businessIncome = retainer only, devIncome stored separately — sum both for true income total
  const allTimeBusinessIncome  = monthlySnapshots.reduce((s,sn)=>s+(sn.businessIncome||0)+(sn.devIncome||0),0);
  // businessProfit snapshot only covers retainer profit; add devIncome for true net profit
  const allTimeBusinessProfit  = monthlySnapshots.reduce((s,sn)=>s+(sn.businessProfit||0)+(sn.devIncome||0),0);
  // Personal balance: sum of each month's surplus/deficit
  const allTimePersonalBalance = monthlySnapshots.reduce((s,sn)=>s+(sn.personalBalance||0),0);

  const t0=todayStr();
  const overdueCount = clients.reduce((n,c)=>
    n+c.tasks.filter(tk=>tk.status!=='completed'&&tk.dueDate<t0).length,0)
    + oddTasks.filter(tk=>tk.status!=='completed'&&tk.dueDate<t0).length;

  // Explicitly push all local state to Firebase — use when data is stuck locally
  // and hasn't made it to the cloud (e.g. after a race condition wiped Firestore).
  async function forceSyncToFirebase() {
    if (!fbReady) return;
    await Promise.all([
      fbPush('clients',              clients),
      fbPush('events',               events),
      fbPush('costs',                costs),
      fbPush('devProjects',          devProjects),
      fbPush('budgetIncome',         budgetIncome),
      fbPush('budgetExpenses',       budgetExpenses),
      fbPush('unforeseenExpenses',   unforeseenExpenses),
      fbPush('onceOffCosts',         onceOffCosts),
      fbPush('monthlySnapshots',     monthlySnapshots),
      fbPush('meetingNotes',         meetingNotes),
      fbPush('priceList',            priceList),
      fbPush('oddTasks',             oddTasks),
      fbPush('currentBalance',       [currentBalance]),
    ]);
  }

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
    overdueCount, forceSyncToFirebase,
  };
}
