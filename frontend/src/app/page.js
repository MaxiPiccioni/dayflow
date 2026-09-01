"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Flame, LayoutDashboard, LogOut, Moon, MoreVertical, Pencil, Plus, Settings2, ShoppingCart, Sun, Timer, Trash2, Wallet, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HoursPanel } from "@/components/hours-panel";
import { ShoppingPanel } from "@/components/shopping-panel";
import { AuthGate } from "@/components/auth-gate";
import { DatePicker } from "@/components/ui/date-picker";
import { api } from "@/lib/api";

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const THEME_EVENT = "dayflow-theme-change";
function subscribeTheme(callback) { window.addEventListener(THEME_EVENT, callback); return () => window.removeEventListener(THEME_EVENT, callback); }
function getThemeSnapshot() { return localStorage.getItem("dayflow_theme") === "dark"; }
function getThemeServerSnapshot() { return false; }
function setStoredDark(value) { localStorage.setItem("dayflow_theme", value ? "dark" : "light"); window.dispatchEvent(new Event(THEME_EVENT)); }

function shiftIsoDate(iso, deltaDays) {
  const shifted = new Date(`${iso}T12:00:00`);
  shifted.setDate(shifted.getDate() + deltaDays);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function formatFullDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

const tabs = [["resumen", "Resumen", LayoutDashboard], ["calendario", "Calendario", CalendarDays], ["pomodoro", "Pomodoro", Timer], ["hábitos", "Hábitos", Flame], ["horas", "Horas", Clock3], ["finanzas", "Finanzas", Wallet], ["compras", "Compras", ShoppingCart]];
const WIDGET_META = [
  { id: "hero", label: "Tu día" },
  { id: "calendar", label: "Calendario" },
  { id: "agenda", label: "Tareas y eventos" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "habits", label: "Hábitos" },
  { id: "horas", label: "Horas" },
  { id: "finanzas", label: "Finanzas" },
];
const DEFAULT_SUMMARY_LAYOUT = [["hero", "pomodoro"], ["calendar", "agenda", "habits"]];
const SUMMARY_LAYOUT_KEY = "dayflow_summary_layout";

function loadSummaryLayout() {
  if (typeof window === "undefined") return DEFAULT_SUMMARY_LAYOUT;
  try {
    const stored = JSON.parse(localStorage.getItem(SUMMARY_LAYOUT_KEY));
    if (!Array.isArray(stored) || stored.length !== 2 || !stored.every(Array.isArray)) return DEFAULT_SUMMARY_LAYOUT;
    const validIds = new Set(WIDGET_META.map((widget) => widget.id));
    return stored.map((column) => column.filter((id) => validIds.has(id)));
  } catch {
    return DEFAULT_SUMMARY_LAYOUT;
  }
}
const authors = ["Aristóteles", "Marie Curie", "Nikola Tesla", "Maya Angelou", "Peter Drucker", "Ada Lovelace", "Carl Sagan", "James Clear", "Eleanor Roosevelt", "Katherine Johnson"];
const seeds = ["La constancia convierte una intención pequeña en una vida distinta.", "Cada bloque de atención es una inversión en tu futuro.", "El progreso no necesita ruido para estar ocurriendo.", "Una decisión clara hoy libera energía para mañana.", "La práctica paciente hace visible lo que antes parecía imposible."];
const quotes = Array.from({ length: 500 }, (_, index) => ({ text: seeds[index % seeds.length], author: authors[index % authors.length] }));
const inputClass = "w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-lime-500 dark:border-zinc-700 dark:placeholder:text-zinc-500";

let audioCtx = null;
function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

function playAlarmSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];
  const chimeSpan = notes.length * 0.22 + 1.1;
  [0, 1].forEach((repeat) => {
    const repeatStart = now + repeat * chimeSpan;
    notes.forEach((freq, index) => {
      const start = repeatStart + index * 0.22;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      const partial = ctx.createOscillator();
      partial.type = "sine";
      partial.frequency.setValueAtTime(freq * 2, start);
      const partialGain = ctx.createGain();
      partialGain.gain.value = 0.05;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.14, start + 0.05);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      osc.connect(envelope);
      partial.connect(partialGain).connect(envelope);
      envelope.connect(ctx.destination);
      osc.start(start);
      partial.start(start);
      osc.stop(start + 0.95);
      partial.stop(start + 0.95);
    });
  });
}

const fromApiTask = (task) => ({ id: task.id, title: task.title, date: task.due_date, time: task.time, category: task.category, priority: task.priority, done: task.completed, notes: task.notes || "" });
const toApiTask = (task) => ({ title: task.title, due_date: task.date, time: task.time, category: task.category || null, priority: task.priority || null, notes: task.notes || null, ...(task.repeat_days ? { repeat_days: task.repeat_days } : {}) });
const fromApiHabit = (habit) => ({ id: habit.id, name: habit.name, target: habit.target, unit: habit.unit, count: habit.count, progress: habit.progress, streak: habit.streak, createdAt: habit.created_at });
const fromApiHabitOverview = (item) => ({ date: item.log_date, completed: item.completed, total: item.total });
const fromApiTransaction = (tx) => ({ id: tx.id, description: tx.description, amount: tx.amount, kind: tx.kind, category: tx.category, method: tx.method, createdAt: tx.created_at });
const fromApiSaving = (saving) => ({ id: saving.id, name: saving.name, start: saving.start_amount, current: saving.current_amount, gain: saving.gain });
const toApiSaving = (saving) => ({ name: saving.name, start_amount: saving.start });
const fromApiSavingMovement = (movement) => ({ id: movement.id, amount: movement.amount, date: movement.movement_date });
const fromApiEvent = (event) => ({ id: event.id, title: event.title, date: event.event_date, time: event.time, type: event.type, color: event.color, done: event.done });
const toApiEvent = (event) => ({ title: event.title, event_date: event.date, time: event.time, type: event.type || null, color: event.color, ...(event.repeat_days ? { repeat_days: event.repeat_days } : {}) });
const fromApiSettings = (settings) => ({ repetitions: settings.repetitions, work: settings.work, breakTime: settings.break_time });
const toApiSettings = (settings) => ({ repetitions: settings.repetitions, work: settings.work, break_time: settings.breakTime });
const fromApiEntry = (entry) => ({ id: entry.id, date: entry.entry_date, from: entry.from_time, to: entry.to_time, hours: entry.hours === null ? "" : entry.hours, extra: entry.extra, holiday: entry.holiday });
const toApiEntry = (form) => ({ entry_date: form.date, from_time: form.from, to_time: form.to, hours: form.hours === "" || form.hours === undefined ? null : Number(form.hours), extra: form.extra, holiday: form.holiday });
const fromApiPayment = (payment) => ({ id: payment.id, amount: payment.amount, method: payment.method, date: payment.payment_date });
const fromApiClosedPeriod = (period) => ({ id: period.id, start: period.start, end: period.end, totalHours: period.total_hours, expected: period.expected, paid: period.paid, balance: period.balance });

function DayModal({ date, tasks, events, openTask, openEvent, close }) { const dayTasks = tasks.filter((task) => task.date === date); const dayEvents = events.filter((event) => event.date === date); return <Modal title={`Agenda del ${date}`} close={close}><div className="mt-5 space-y-2">{dayTasks.length ? dayTasks.map((task) => <div key={`task-${task.id}`} onDoubleClick={() => { close(); openTask(task, date); }} className="cursor-pointer rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800"><span className="mr-3 text-xs text-zinc-400">{task.time}</span>{task.title}</div>) : null}{dayEvents.length ? dayEvents.map((event) => <div key={`event-${event.id}`} onDoubleClick={() => { close(); openEvent(event, date); }} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 text-sm" style={{ backgroundColor: `${event.color}55` }}><span className="h-6 w-1 rounded-full" style={{ backgroundColor: event.color }} /><span className="text-xs text-zinc-500">{event.time}</span><span className="flex-1">{event.title}</span></div>) : null}{!dayTasks.length && !dayEvents.length && <p className="py-4 text-sm text-zinc-500">No hay tareas ni eventos para este día.</p>}</div><div className="mt-6 flex gap-2"><button onClick={() => { close(); openTask(null, date); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white"><Plus size={16} /> Agregar tarea</button><button onClick={() => { close(); openEvent(null, date); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 py-3 text-sm font-semibold dark:border-zinc-700"><Plus size={16} /> Agregar evento</button></div></Modal>; }

const WEEKDAY_REPEAT_OPTIONS = [["mon", "L"], ["tue", "M"], ["wed", "X"], ["thu", "J"], ["fri", "V"], ["sat", "S"], ["sun", "D"]];

function RepeatField({ enabled, setEnabled, days, setDays }) {
  const toggleDay = (code) => setDays(days.includes(code) ? days.filter((day) => day !== code) : [...days, code]);
  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Repetir</span>
        <Switch checked={enabled} onChange={setEnabled} label="Repetir" />
      </div>
      {enabled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {WEEKDAY_REPEAT_OPTIONS.map(([code, label]) => (
            <button key={code} type="button" onClick={() => toggleDay(code)} className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors ${days.includes(code) ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>{label}</button>
          ))}
        </div>
      )}
      {enabled && !days.length && <p className="mt-2 text-xs text-zinc-400">Elegí al menos un día de la semana.</p>}
    </div>
  );
}

function EventModal({ event, date, categories, save, remove, close }) {
  const [form, setForm] = useState(event || { title: "", date, time: "09:00", type: "", color: "#d9f99d", done: false });
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (submitEvent) => {
    submitEvent.preventDefault();
    if (!form.title.trim()) return;
    const repeat_days = !event && repeatEnabled && repeatDays.length ? repeatDays : undefined;
    save({ ...form, title: form.title.trim(), id: form.id || Date.now(), done: form.done || false, repeat_days });
  };
  const typeOptions = [{ value: "", label: "Sin categoría" }, ...categories.map((category) => ({ value: category.name, label: category.name }))];
  return (
    <Modal title={event ? "Editar evento" : "Nuevo evento"} close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <input autoFocus value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Nombre del evento" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">Fecha<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-zinc-500">Horario<input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <Select label="Categoría" value={form.type || ""} onChange={(value) => update("type", value)} options={typeOptions} />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Color del evento</p>
            <div className="mt-2 flex gap-3">{[["#d9f99d", "Lima"], ["#bfdbfe", "Azul"], ["#fbcfe8", "Rosa"], ["#fde68a", "Amarillo"], ["#ddd6fe", "Lavanda"]].map(([color, label]) => <button key={color} type="button" aria-label={label} onClick={() => update("color", color)} className={`h-8 w-8 rounded-full border-2 ${form.color === color ? "border-zinc-900 ring-2 ring-zinc-300" : "border-white"}`} style={{ backgroundColor: color }} />)}</div>
          </div>
          {!event && <RepeatField enabled={repeatEnabled} setEnabled={setRepeatEnabled} days={repeatDays} setDays={setRepeatDays} />}
        </div>
        <div className="mt-6 flex gap-2">
          {event && <button type="button" onClick={() => remove(event.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar evento</button>
        </div>
      </form>
    </Modal>
  );
}

function Select({ label, value, onChange, options, placeholder = "Seleccionar..." }) { const [open, setOpen] = useState(false); const normalized = options.map((option) => typeof option === "string" ? { value: option, label: option } : option); const selected = normalized.find((option) => option.value === value); return <div className="relative text-xs text-zinc-500"><span>{label}</span><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} className={`${inputClass} mt-1 flex items-center justify-between text-left ${selected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>{selected?.label || placeholder}<ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">{normalized.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${option.value === value ? "bg-zinc-100 font-medium dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>{option.label}</button>)}</div>}</div>; }

const PRIORITY_OPTIONS = [{ value: "", label: "Sin importancia" }, { value: "Alta", label: "Alta" }, { value: "Media", label: "Media" }, { value: "Baja", label: "Baja" }];

function TaskModal({ task, date, categories, save, remove, close }) {
  const [form, setForm] = useState(task || { title: "", date, time: "09:00", category: "", priority: "", notes: "" });
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    const repeat_days = !task && repeatEnabled && repeatDays.length ? repeatDays : undefined;
    save({ ...form, title: form.title.trim(), id: form.id || Date.now(), done: form.done || false, repeat_days });
  };
  const categoryOptions = [{ value: "", label: "Sin categoría" }, ...categories.map((category) => ({ value: category.name, label: category.name }))];
  return (
    <Modal title={task ? "Detalles de tarea" : "Nueva tarea"} close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <input autoFocus value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="¿Qué necesitas hacer?" className={inputClass} />
          <textarea value={form.notes || ""} onChange={(event) => update("notes", event.target.value)} placeholder="Notas" rows="3" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">Fecha<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-zinc-500">Horario<input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <Select label="Categoría" value={form.category || ""} onChange={(value) => update("category", value)} options={categoryOptions} />
            <Select label="Importancia" value={form.priority || ""} onChange={(value) => update("priority", value)} options={PRIORITY_OPTIONS} />
          </div>
          {!task && <RepeatField enabled={repeatEnabled} setEnabled={setRepeatEnabled} days={repeatDays} setDays={setRepeatDays} />}
        </div>
        <div className="mt-6 flex gap-2">
          {task && <button type="button" onClick={() => remove(task.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryManagerModal({ title = "Categorías", categories, addCategory, removeCategory, close }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await addCategory(name.trim());
      setName("");
    } catch (err) {
      setError(err.message || "No se pudo crear la categoría.");
    }
  };
  return (
    <Modal title={title} close={close}>
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nueva categoría" className={inputClass} />
        <button type="submit" className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Añadir</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {categories.length ? categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <span className="text-sm">{category.name}</span>
            <button type="button" onClick={() => removeCategory(category.id)} aria-label={`Eliminar categoría ${category.name}`} title="Eliminar categoría" className="text-zinc-400 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        )) : <p className="py-6 text-center text-sm text-zinc-400">Todavía no tenés categorías.</p>}
      </div>
    </Modal>
  );
}

function FinanceCategoryManagerModal({ incomeCategories, expenseCategories, addCategory, renameCategory, removeCategory, close }) {
  const [kind, setKind] = useState("income");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const categories = kind === "income" ? incomeCategories : expenseCategories;

  const submitAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await addCategory(kind, name.trim());
      setName("");
    } catch (err) {
      setError(err.message || "No se pudo crear la categoría.");
    }
  };

  const startEdit = (category) => { setEditingId(category.id); setEditingName(category.name); setError(""); };
  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingName.trim()) return;
    try {
      await renameCategory(kind, editingId, editingName.trim());
      setEditingId(null);
    } catch (err) {
      setError(err.message || "No se pudo renombrar la categoría.");
    }
  };

  return (
    <Modal title="Categorías de movimientos" close={close}>
      <div className="mt-5 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button type="button" onClick={() => setKind("income")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${kind === "income" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"}`}>Ingresos</button>
        <button type="button" onClick={() => setKind("expense")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${kind === "expense" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"}`}>Egresos</button>
      </div>
      <form onSubmit={submitAdd} className="mt-4 flex gap-2">
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nueva categoría" className={inputClass} />
        <button type="submit" className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Añadir</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {categories.length ? categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            {editingId === category.id ? (
              <form onSubmit={submitEdit} className="flex flex-1 items-center gap-2">
                <input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} className={`${inputClass} py-1`} />
                <button type="submit" aria-label="Guardar nombre" className="shrink-0 text-lime-700 hover:text-lime-800"><Check size={16} /></button>
                <button type="button" onClick={() => setEditingId(null)} aria-label="Cancelar edición" className="shrink-0 text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
              </form>
            ) : (
              <>
                <span className="text-sm">{category.name}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => startEdit(category)} aria-label={`Editar categoría ${category.name}`} title="Editar categoría" className="p-1 text-zinc-400 hover:text-zinc-600">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => removeCategory(kind, category.id)} aria-label={`Eliminar categoría ${category.name}`} title="Eliminar categoría" className="p-1 text-zinc-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        )) : <p className="py-6 text-center text-sm text-zinc-400">Todavía no tenés categorías de {kind === "income" ? "ingresos" : "egresos"}.</p>}
      </div>
    </Modal>
  );
}

function HabitModal({ habit, save, remove, close }) {
  const [form, setForm] = useState({ name: habit.name || "", target: habit.target || 1, unit: habit.unit || "veces" });
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (event) => { event.preventDefault(); if (form.name.trim()) save({ ...habit, name: form.name.trim(), target: Math.max(1, Math.round(Number(form.target)) || 1), unit: form.unit.trim() || "veces" }); };
  return (
    <Modal title={habit.id ? "Editar hábito" : "Nuevo hábito"} close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <label className="text-xs text-zinc-500">Nombre del hábito<input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} className={`${inputClass} mt-1`} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">Meta por día<input type="number" min="1" step="1" value={form.target} onChange={(event) => update("target", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-zinc-500">Unidad<input value={form.unit} onChange={(event) => update("unit", event.target.value)} placeholder="vasos, veces, páginas..." className={`${inputClass} mt-1`} /></label>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          {habit.id && <button type="button" onClick={() => remove(habit.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

const TASK_PRIORITY_RANK = { Alta: 0, Media: 1, Baja: 2 };
const AGENDA_SORT_OPTIONS = [
  { value: "time", label: "Hora" },
  { value: "category", label: "Categoría" },
  { value: "priority", label: "Importancia" },
];
const AGENDA_SORTERS = {
  time: (item) => item.time,
  category: (item) => ((item.itemType === "Evento" ? item.type : item.category) || "").toLowerCase(),
  priority: (item) => (item.itemType === "Evento" ? 99 : TASK_PRIORITY_RANK[item.priority] ?? 99),
};

function AgendaPanel({ tasks, events, date, setDate, toggle, toggleEvent, openTask, openEvent, deleteTask, deleteEvent, openCategoryManager }) {
  const [sortKey, setSortKey] = useState("time");
  const [sortDir, setSortDir] = useState("asc");
  const items = [
    ...tasks.filter((task) => task.date === date).map((task) => ({ ...task, itemType: "Tarea" })),
    ...events.filter((event) => event.date === date).map((event) => ({ ...event, itemType: "Evento" })),
  ].sort((a, b) => {
    const valueA = AGENDA_SORTERS[sortKey](a);
    const valueB = AGENDA_SORTERS[sortKey](b);
    const compare = valueA < valueB ? -1 : valueA > valueB ? 1 : a.time.localeCompare(b.time);
    return sortDir === "asc" ? compare : -compare;
  });
  return (
    <Card>
      <CardHeader title="Tareas y eventos" action={<div className="flex gap-3"><button onClick={() => openTask(null, date)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={15} /> Tarea</button><button onClick={() => openEvent(null, date)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={15} /> Evento</button></div>} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <button type="button" onClick={() => setDate(shiftIsoDate(date, -1))} aria-label="Día anterior" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            <ChevronLeft size={16} />
          </button>
          <DatePicker value={date} onChange={setDate} className="flex-1" />
          <button type="button" onClick={() => setDate(shiftIsoDate(date, 1))} aria-label="Día siguiente" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-zinc-400">Ordenar por</span>
          <ShadSelect value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AGENDA_SORT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </ShadSelect>
          <button
            type="button"
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            aria-label={sortDir === "asc" ? "Orden ascendente, cambiar a descendente" : "Orden descendente, cambiar a ascendente"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {sortDir === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          </button>
          <button
            type="button"
            onClick={openCategoryManager}
            aria-label="Gestionar categorías"
            title="Gestionar categorías"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {items.length ? items.map((item) => item.itemType === "Evento" ? (
          <div key={`event-${item.id}`} onDoubleClick={() => openEvent(item, date)} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: `${item.color}55` }}>
            <button type="button" onClick={() => toggleEvent(item.id)} aria-label={item.done ? "Marcar como pendiente" : "Marcar como hecho"} className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-transform duration-300 ${item.done ? "scale-95 border-zinc-700 bg-zinc-700 text-white" : "border-zinc-400"}`}>
              {item.done && <Check size={13} />}
            </button>
            <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <button type="button" onClick={() => toggleEvent(item.id)} className="flex flex-1 items-center gap-3 text-left">
              <span className="w-12 text-xs text-zinc-500">{item.time}</span>
              <span className={`flex-1 text-sm font-medium ${item.done ? "text-zinc-500" : ""}`}><span className={item.done ? "task-strike" : ""}>{item.title}</span></span>
              {item.type && <span className="rounded-full bg-white/60 px-2 py-1 text-[10px] text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">{item.type}</span>}
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); deleteEvent(item.id); }}
              aria-label={`Eliminar evento ${item.title}`}
              title="Eliminar evento"
              className="shrink-0 text-zinc-400 transition-colors hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <div key={`task-${item.id}`} onDoubleClick={() => openTask(item, date)} className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <button type="button" onClick={() => toggle(item.id)} aria-label={item.done ? "Marcar como pendiente" : "Marcar como hecha"} className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-transform duration-300 ${item.done ? "scale-95 border-lime-500 bg-lime-400 text-lime-950" : "border-zinc-300"}`}>
              {item.done && <Check size={13} />}
            </button>
            <button type="button" onClick={() => toggle(item.id)} className="flex flex-1 items-center gap-3 text-left">
              <span className="w-12 text-xs text-zinc-400">{item.time}</span>
              <span className={`flex-1 text-sm font-medium transition-[color] duration-500 ${item.done ? "text-zinc-400" : "dark:text-zinc-100"}`}><span className={item.done ? "task-strike" : ""}>{item.title}</span></span>
              {(item.category || item.priority) && <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500 dark:bg-zinc-800">{[item.category, item.priority].filter(Boolean).join(" · ")}</span>}
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); deleteTask(item.id); }}
              aria-label={`Eliminar tarea ${item.title}`}
              title="Eliminar tarea"
              className="shrink-0 text-zinc-400 transition-colors hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )) : <p className="py-8 text-center text-sm text-zinc-400">No hay tareas ni eventos para este día.</p>}
      </div>
    </Card>
  );
}

const HABIT_WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

function Habits({ habits, date, setDate, habitLogs, onSetCount, openHabit }) {
  const clickTimer = useRef(null);
  const isToday = date === todayIso();
  const countFor = (habit) => (isToday ? habit.count : habitLogs[habit.id]?.[date] ?? 0);
  const progressFor = (habit) => (habit.target ? Math.round((countFor(habit) / habit.target) * 100) : 0);
  const cycle = (habit) => { const current = countFor(habit); onSetCount(habit.id, date, current >= habit.target ? 0 : current + 1); };
  return (
    <Card>
      <CardHeader eyebrow="Rituales diarios" title="Hábitos saludables" action={<button onClick={() => openHabit({ name: "", target: 1, unit: "veces" })} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={16} /> Nuevo</button>} />
      <div className="mb-5 flex items-center gap-2">
        <button type="button" onClick={() => setDate(shiftIsoDate(date, -1))} aria-label="Día anterior" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          <ChevronLeft size={16} />
        </button>
        <DatePicker value={date} onChange={setDate} className="flex-1" />
        <button type="button" onClick={() => setDate(shiftIsoDate(date, 1))} disabled={isToday} aria-label="Día siguiente" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-transparent dark:border-zinc-700 dark:hover:bg-zinc-800">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="space-y-5">
        {habits.map((habit) => {
          const count = countFor(habit);
          const progress = progressFor(habit);
          const complete = progress >= 100;
          return (
            <button key={habit.id} onClick={(event) => { if (event.detail === 2) { clearTimeout(clickTimer.current); openHabit(habit); } else { clickTimer.current = window.setTimeout(() => cycle(habit), 250); } }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-transform duration-300 active:scale-75 ${complete ? "border-lime-500 bg-lime-400" : "border-zinc-300"}`}>{complete && <Check size={13} />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{habit.name}</span>
                  <span className="text-xs text-zinc-400">{count}/{habit.target} {habit.unit}</span>
                </div>
                <div className="mt-2"><Progress value={progress} segments={habit.target} /></div>
              </div>
              <span className="relative shrink-0">
                <Flame size={16} className={isToday && habit.streak > 0 ? "text-orange-400" : "text-zinc-200"} />
                {isToday && habit.streak > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-orange-500 text-[8px] font-bold leading-none text-white">{habit.streak}</span>}
              </span>
            </button>
          );
        })}
        {!habits.length && <p className="py-6 text-center text-sm text-zinc-400">Todavía no agregaste hábitos.</p>}
      </div>
    </Card>
  );
}

function HabitsOverviewChart({ data }) {
  const maxTotal = Math.max(1, ...data.map((item) => item.total));
  return (
    <div className="mt-3 flex h-32 items-end gap-1.5 sm:gap-2">
      {data.map((item) => {
        const totalHeight = item.total ? Math.max(6, (item.total / maxTotal) * 110) : 4;
        const completedHeight = item.total ? (item.completed / item.total) * totalHeight : 0;
        const d = new Date(`${item.date}T12:00:00`);
        return (
          <div key={item.date} className="group relative flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-col-reverse overflow-hidden rounded-t bg-zinc-100 dark:bg-zinc-800" style={{ height: `${totalHeight}px` }}>
              <div className="w-full bg-lime-400" style={{ height: `${completedHeight}px` }} />
            </div>
            <span className="text-[10px] text-zinc-400">{HABIT_WEEKDAY_LETTERS[d.getDay()]}</span>
            <span className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-zinc-900 px-2 py-1 text-[10px] whitespace-nowrap text-white group-hover:block">{item.total ? `${item.completed}/${item.total} hábitos` : "Sin hábitos activos"}</span>
          </div>
        );
      })}
    </div>
  );
}

function buildHabitSeries(habit, logsByDate) {
  const start = new Date(`${(habit.createdAt || todayIso()).slice(0, 10)}T12:00:00`);
  const end = new Date(`${todayIso()}T12:00:00`);
  const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const windowDays = Math.min(totalDays, 30);
  const windowStart = totalDays - windowDays;
  return Array.from({ length: windowDays }, (_, offset) => {
    const dayNumber = windowStart + offset + 1;
    const d = new Date(start);
    d.setDate(d.getDate() + windowStart + offset);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const count = logsByDate?.[iso] ?? 0;
    const progress = habit.target ? Math.min(100, Math.round((count / habit.target) * 100)) : 0;
    return { day: dayNumber, progress };
  });
}

function HabitsTracker({ habits, habitLogs, overview }) {
  const [selectedId, setSelectedId] = useState("general");
  const habit = habits.find((item) => String(item.id) === selectedId);
  const metric = habit?.unit || "veces";
  const values = habit ? buildHabitSeries(habit, habitLogs[habit.id]).map((item) => item.progress) : [];
  const dayNumbers = habit ? buildHabitSeries(habit, habitLogs[habit.id]).map((item) => item.day) : [];
  const originX = 40, plotWidth = 260, baseline = 110;
  const stepX = values.length > 1 ? plotWidth / (values.length - 1) : 0;
  const pointX = (index) => originX + index * stepX;
  const points = values.map((value, index) => `${pointX(index)},${baseline - value}`).join(" ");
  return (
    <Card>
      <CardHeader
        eyebrow="Seguimiento"
        title="Tracker de hábitos"
        action={
          <ShadSelect value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              {habits.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
            </SelectContent>
          </ShadSelect>
        }
      />
      {selectedId === "general" || !habit ? (
        overview.length ? <HabitsOverviewChart data={overview} /> : <p className="py-8 text-center text-sm text-zinc-400">Todavía no hay datos suficientes.</p>
      ) : (
        <svg viewBox="0 0 320 150" className="h-52 w-full" role="img" aria-label={`Tracker de ${habit.name}`}>
          <text x="12" y="60" textAnchor="middle" transform="rotate(-90 12 60)" className="fill-zinc-400 text-[8px] uppercase tracking-wide">{metric}</text>
          {[0, 50, 100].map((tick) => <g key={tick}><text x={originX - 8} y={baseline - tick + 3} textAnchor="end" className="fill-zinc-400 text-[7px]">{tick}</text>{tick > 0 && tick < 100 && <line x1={originX} x2={originX + plotWidth} y1={baseline - tick} y2={baseline - tick} stroke="currentColor" strokeOpacity=".12" strokeDasharray="3 4" />}</g>)}
          <line x1={originX} x2={originX} y1="10" y2={baseline} stroke="currentColor" strokeOpacity=".25" />
          <line x1={originX} x2={originX + plotWidth} y1={baseline} y2={baseline} stroke="currentColor" strokeOpacity=".25" />
          <polyline points={points} fill="none" stroke="#84cc16" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((value, index) => { const previous = values[index - 1]; const trend = index === 0 ? "Punto inicial" : value > previous ? "Mejoraste" : value < previous ? "Empeoraste" : "Sin cambios"; return <circle key={index} cx={pointX(index)} cy={baseline - value} r="4" fill="#84cc16"><title>Día {dayNumbers[index]}: {value}% · {trend}</title></circle>; })}
          {values.map((value, index) => (index % Math.ceil(values.length / 10 || 1) === 0 || index === values.length - 1) && <text key={`d-${index}`} x={pointX(index)} y={baseline + 14} textAnchor="middle" className="fill-zinc-400 text-[7px]">{dayNumbers[index]}</text>)}
          <text x={originX + plotWidth / 2} y="145" textAnchor="middle" className="fill-zinc-400 text-[8px] uppercase tracking-wide">Día</text>
        </svg>
      )}
    </Card>
  );
}

function Pomodoro({ settings, setSettings, seconds, setSeconds, running, setRunning, phase, setPhase, history, compact = false }) { const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; const totalSeconds = Math.max((phase === "work" ? settings.work : settings.breakTime) * 60, 1); const reset = () => { setRunning(false); setPhase("work"); setSeconds(settings.work * 60); }; const toggleRunning = () => { playClickSound(); setRunning(!running); }; const update = (key, value) => { const parsed = Math.round(Number(value)); const next = { ...settings, [key]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 }; setSettings(next); if (!running) { if (key === "work" && phase === "work") setSeconds(next.work * 60); if (key === "breakTime" && phase === "break") setSeconds(next.breakTime * 60); } }; return <div className="space-y-5"><Card className="text-center"><CardHeader eyebrow={phase === "work" ? "Sesión de foco" : "Descanso"} title="Pomodoro" action={<button onClick={reset} className="text-xs text-zinc-400">Reiniciar</button>} /><div className="mx-auto mt-4 grid h-56 w-56 place-items-center rounded-full" style={{ background: `conic-gradient(${phase === "work" ? "#a3e635" : "#7dd3fc"} ${seconds / totalSeconds * 100}%, #e4e4e7 0)` }}><div className="grid h-48 w-48 place-items-center rounded-full bg-white dark:bg-zinc-900"><p className="font-mono text-5xl font-semibold">{time}</p></div></div><button onClick={toggleRunning} className="mt-7 rounded-full bg-lime-300 px-7 py-3 text-sm font-semibold text-lime-950">{running ? "Pausar" : "Comenzar"}</button></Card>{!compact && <Card><CardHeader eyebrow="Personaliza tu foco" title="Configuración" action={<Settings2 size={17} className="text-zinc-400" />} /><div className="grid gap-3 sm:grid-cols-3">{[["repetitions", "Repeticiones"], ["work", "Temporizador (min)"], ["breakTime", "Descanso (min)"]].map(([key, label]) => <label key={key} className="text-xs text-zinc-500">{label}<input type="number" min="0" step="1" inputMode="numeric" value={settings[key]} onChange={(event) => update(key, event.target.value)} className={`${inputClass} mt-1`} /></label>)}</div><p className="mt-5 text-sm font-semibold">Uso por día</p><div className="mt-3 flex h-24 items-end gap-2">{history.map((item) => <div key={item.day} className="group relative flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t bg-lime-400" style={{ height: `${Math.max(4, item.minutes / 125 * 80)}px` }} /><span className="text-[10px] text-zinc-400">{item.day}</span><span className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-zinc-900 px-2 py-1 text-[10px] text-white group-hover:block">{item.minutes} min</span></div>)}</div></Card>}</div>; }

function FinanceModal({ incomeCategories, expenseCategories, save, close }) {
  const [form, setForm] = useState({ description: "", amount: "", kind: "expense", category: expenseCategories[0]?.name || "", method: "Efectivo" });
  const update = (key, value) => {
    if (key === "kind") {
      const list = value === "income" ? incomeCategories : expenseCategories;
      setForm({ ...form, kind: value, category: list[0]?.name || "" });
    } else {
      setForm({ ...form, [key]: value });
    }
  };
  const submit = (event) => { event.preventDefault(); if (Number(form.amount) > 0 && form.description.trim()) save({ ...form, amount: Number(form.amount), description: form.description.trim(), id: Date.now() }); };
  const categoryOptions = (form.kind === "income" ? incomeCategories : expenseCategories).map((category) => ({ value: category.name, label: category.name }));
  return <Modal title="Nuevo movimiento" close={close}><form onSubmit={submit}><div className="mt-5 space-y-3"><input autoFocus value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Descripción" className={inputClass} /><div className="grid grid-cols-2 gap-3"><label className="text-xs text-zinc-500">Monto<input type="number" min="0" value={form.amount} onChange={(event) => update("amount", event.target.value)} className={`${inputClass} mt-1`} /></label><Select label="Tipo" value={form.kind} onChange={(value) => update("kind", value)} options={[{ value: "expense", label: "Egreso" }, { value: "income", label: "Ingreso" }]} /><Select label="Categoría" value={form.category} onChange={(value) => update("category", value)} options={categoryOptions} /><Select label="Método" value={form.method} onChange={(value) => update("method", value)} options={METHOD_OPTIONS} /></div></div><button type="submit" className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar movimiento</button></form></Modal>;
}

const EXPENSE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

function CategoryBar({ data }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="pie-chart-in w-full min-w-0">
      <div className="flex h-9 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {data.map((item, index) => {
          const pct = total ? (item.amount / total) * 100 : 0;
          return <div key={item.category} className="bar-segment h-full" style={{ width: `${pct}%`, backgroundColor: item.color, animationDelay: `${index * 100}ms` }} title={`${item.category}: ${Math.round(pct)}%`} />;
        })}
      </div>
      <ul className="mt-4 w-full space-y-2 text-sm">
        {data.map((item, index) => (
          <li key={item.category} className="pie-legend-item flex items-center gap-2" style={{ animationDelay: `${150 + index * 100}ms` }}>
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="flex-1 truncate">{item.category}</span>
            <span className="text-xs text-zinc-400">{total ? Math.round((item.amount / total) * 100) : 0}%</span>
            <strong className="text-right">$ {item.amount.toLocaleString("es-AR")}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

const METHOD_OPTIONS = [{ value: "Efectivo", label: "Efectivo" }, { value: "Digital", label: "Digital" }, { value: "Otro", label: "Otro" }];
const HOLDING_COLORS = { Efectivo: "#2a78d6", Digital: "#1baf7a", Otro: "#a1a1aa" };

function SavingModal({ saving, save, remove, close }) {
  const [form, setForm] = useState(saving || { name: "", start: "" });
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (event) => { event.preventDefault(); if (!form.name.trim()) return; const start = Number(form.start) || 0; save({ ...form, name: form.name.trim(), start, current: saving ? saving.current : start, gain: saving ? saving.gain : 0, id: form.id || Date.now() }); };
  return <Modal title={saving ? "Editar ahorro" : "Nuevo ahorro"} close={close}><form onSubmit={submit}><div className="mt-5 space-y-3"><input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Nombre del ahorro" className={inputClass} /><label className="text-xs text-zinc-500">Monto inicio de mes<input type="number" min="0" value={form.start} onChange={(event) => update("start", event.target.value)} className={`${inputClass} mt-1`} /></label></div><div className="mt-6 flex gap-2">{saving && <button type="button" onClick={() => remove(saving.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}<button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar</button></div></form></Modal>;
}

function SavingMovementsModal({ saving, movements, addMovement, removeMovement, close }) {
  const [kind, setKind] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setError("");
    try { await addMovement(kind === "deposit" ? value : -value); setAmount(""); }
    catch (err) { setError(err.message || "No se pudo registrar el movimiento."); }
  };
  return (
    <Modal title={`Movimientos · ${saving.name}`} close={close}>
      <div className="mt-2 grid grid-cols-2 gap-3 text-center">
        <div><p className="text-xs text-zinc-500">Inicio de mes</p><p className="mt-1 text-xl font-semibold">$ {saving.start.toLocaleString("es-AR")}</p></div>
        <div><p className="text-xs text-zinc-500">Monto actual</p><p className="mt-1 text-xl font-semibold">$ {saving.current.toLocaleString("es-AR")}</p></div>
      </div>
      <form onSubmit={submit} className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2">
        <Select label="" value={kind} onChange={setKind} options={[{ value: "deposit", label: "Depósito" }, { value: "withdraw", label: "Retiro" }]} />
        <input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Monto" className={`${inputClass} self-end`} />
        <button type="submit" aria-label="Registrar movimiento" className="self-end rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /></button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {movements.length ? movements.map((movement) => (
          <div key={movement.id} className="flex items-center justify-between border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800">
            <span className="text-zinc-500">{formatRowDate(movement.date)}</span>
            <div className="flex items-center gap-3">
              <strong className={movement.amount >= 0 ? "text-lime-600" : "text-red-500"}>{movement.amount >= 0 ? "+" : "−"}$ {Math.abs(movement.amount).toLocaleString("es-AR")}</strong>
              <button type="button" onClick={() => removeMovement(movement.id)} aria-label="Eliminar movimiento" title="Eliminar movimiento" className="text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        )) : <p className="py-4 text-center text-sm text-zinc-400">Todavía no hay movimientos este mes.</p>}
      </div>
    </Modal>
  );
}

function SavingsCard({ savings, openSaving, openMovements }) {
  return (
    <Card>
      <CardHeader eyebrow="Patrimonio" title="Ahorros" action={<button onClick={() => openSaving(null)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={16} /> Ahorro</button>} />
      <Table>
        <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Inicio de mes</TableHead><TableHead>Monto actual</TableHead><TableHead>Ganancia</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {savings.length ? savings.map((saving) => (
            <TableRow key={saving.id} onDoubleClick={() => openSaving(saving)} className="cursor-pointer">
              <TableCell className="font-medium">{saving.name}</TableCell>
              <TableCell>$ {saving.start.toLocaleString("es-AR")}</TableCell>
              <TableCell>$ {saving.current.toLocaleString("es-AR")}</TableCell>
              <TableCell className={saving.gain >= 0 ? "text-lime-600" : "text-red-500"}>{saving.gain >= 0 ? "+" : "−"}$ {Math.abs(saving.gain).toLocaleString("es-AR")}</TableCell>
              <TableCell><button type="button" onClick={(event) => { event.stopPropagation(); openMovements(saving); }} className="flex items-center gap-1 text-xs font-semibold text-lime-700"><Plus size={14} /> Movimiento</button></TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-zinc-400">No agregaste ahorros todavía.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  );
}

function parseRowDate(value) { const [day, month, year] = value.split("/").map(Number); return new Date(year, month - 1, day).getTime(); }

const ROW_SORTERS = {
  date: (row) => parseRowDate(row.date),
  type: (row) => row.type,
  amount: (row) => row.amount,
  description: (row) => row.description.toLowerCase(),
  category: (row) => (row.category || "").toLowerCase(),
};

const PAGE_SIZE = 20;

function SortableHead({ label, columnKey, sortKey, sortDir, onSort }) {
  const active = sortKey === columnKey;
  return <TableHead><button type="button" onClick={() => onSort(columnKey)} className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200">{label}{active ? sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}</button></TableHead>;
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const monthLabel = (iso) => { const d = new Date(iso); return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; };
const monthSortValue = (iso) => { const d = new Date(iso); return d.getFullYear() * 12 + d.getMonth(); };
const formatRowDate = (iso) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; };

function FinanceArchive({ transactions, savings, openFinance, openSaving, openSavingMovements, onDelete, openFinanceCategoryManager, compact = false }) {
  const rows = transactions.map((tx) => ({ id: tx.id, date: formatRowDate(tx.createdAt), month: monthLabel(tx.createdAt), sortValue: monthSortValue(tx.createdAt), type: tx.kind === "income" ? "Ingreso" : "Egreso", amount: tx.amount, description: tx.description, category: tx.category }));
  const nowIso = new Date().toISOString();
  const monthOptions = new Map([[monthLabel(nowIso), monthSortValue(nowIso)]]);
  rows.forEach((row) => { if (!monthOptions.has(row.month)) monthOptions.set(row.month, row.sortValue); });
  const months = [...monthOptions.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label);
  const [month, setMonth] = useState(monthLabel(nowIso));
  const [search, setSearch] = useState(""); const [sortKey, setSortKey] = useState("date"); const [sortDir, setSortDir] = useState("desc"); const [page, setPage] = useState(1);
  const monthRows = rows.filter((row) => row.month === month);
  const balance = monthRows.reduce((sum, row) => sum + (row.type === "Ingreso" ? row.amount : -row.amount), 0); const expenseTotals = {}; monthRows.forEach((row) => { if (row.type === "Egreso") { const label = row.category || "Sin categoría"; expenseTotals[label] = (expenseTotals[label] || 0) + row.amount; } }); const sortedExpenses = Object.entries(expenseTotals).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount); const topExpenses = sortedExpenses.slice(0, 3).map((item, index) => ({ ...item, color: EXPENSE_COLORS[index] })); const otherExpenses = sortedExpenses.slice(3).reduce((sum, item) => sum + item.amount, 0); const expenseData = otherExpenses > 0 ? [...topExpenses, { category: "Otros", amount: otherExpenses, color: "#a1a1aa" }] : topExpenses;
  const holdingsData = METHOD_OPTIONS.map((option) => ({ category: option.label, amount: Math.max(0, transactions.filter((tx) => tx.method === option.value).reduce((sum, tx) => sum + (tx.kind === "income" ? tx.amount : -tx.amount), 0)), color: HOLDING_COLORS[option.value] })).filter((item) => item.amount > 0);
  const changeMonth = (value) => { setMonth(value); setPage(1); };
  const updateSearch = (value) => { setSearch(value); setPage(1); };
  const toggleSort = (key) => { if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } setPage(1); };
  const searchTerm = search.trim().toLowerCase();
  const filteredRows = monthRows.filter((row) => [row.date, row.type, row.amount.toLocaleString("es-AR"), row.description, row.category || ""].join(" ").toLowerCase().includes(searchTerm));
  const sortedRows = [...filteredRows].sort((a, b) => { const valueA = ROW_SORTERS[sortKey](a); const valueB = ROW_SORTERS[sortKey](b); const compare = valueA < valueB ? -1 : valueA > valueB ? 1 : 0; return sortDir === "asc" ? compare : -compare; });
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Balance mensual"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select label="" value={month} onChange={changeMonth} options={months} />
              <button onClick={openFinance} className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white"><Plus size={14} /> Movimiento</button>
              <button type="button" onClick={openFinanceCategoryManager} aria-label="Gestionar categorías de movimientos" title="Gestionar categorías de movimientos" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"><Settings2 size={15} /></button>
            </div>
          }
        />
        <p className="text-4xl font-semibold">$ {balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
      </Card>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader eyebrow="Distribución" title="Gastos por categoría" />
          {expenseData.length ? <CategoryBar key={month} data={expenseData} /> : <p className="py-8 text-center text-sm text-zinc-400">No hay egresos registrados este mes.</p>}
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader eyebrow="Patrimonio" title="Dinero en posesión" />
          {holdingsData.length ? <CategoryBar key={`holdings-${transactions.length}`} data={holdingsData} /> : <p className="py-8 text-center text-sm text-zinc-400">Todavía no hay datos de dinero en posesión.</p>}
        </Card>
      </div>
      {!compact && <SavingsCard savings={savings} openSaving={openSaving} openMovements={openSavingMovements} />}
      {!compact && <Card>
        <CardHeader eyebrow="Detalle" title="Movimientos del mes" action={<Input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Buscar movimiento..." className="w-48" />} />
        <Table>
          <TableHeader><TableRow><SortableHead label="Fecha" columnKey="date" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} /><SortableHead label="Tipo" columnKey="type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} /><SortableHead label="Monto" columnKey="amount" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} /><SortableHead label="Descripción" columnKey="description" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} /><SortableHead label="Categoría" columnKey="category" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} /><TableHead /></TableRow></TableHeader>
          <TableBody>
            {pageRows.length ? pageRows.map((row) => <TableRow key={row.id}><TableCell className="text-zinc-500">{row.date}</TableCell><TableCell className={row.type === "Ingreso" ? "text-lime-600" : "text-red-500"}>{row.type}</TableCell><TableCell className="font-medium">$ {row.amount.toLocaleString("es-AR")}</TableCell><TableCell>{row.description}</TableCell><TableCell className="text-zinc-500">{row.category || "Sin categoría"}</TableCell><TableCell><button type="button" onClick={() => onDelete(row.id)} aria-label="Eliminar movimiento" className="text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button></TableCell></TableRow>) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-zinc-400">No se encontraron movimientos.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-zinc-400">{sortedRows.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sortedRows.length)} de ${sortedRows.length}` : "0 resultados"}</span>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </Card>}
    </div>
  );
}

function DraggableCard({ id, onReorder, onDragStateChange, children }) {
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const onDragStart = (event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id); setDragging(true); onDragStateChange?.(id); };
  const onDragEnd = () => { setDragging(false); onDragStateChange?.(null); };
  const onDragOver = (event) => { event.preventDefault(); event.stopPropagation(); if (!dragOver) setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (event) => { event.preventDefault(); event.stopPropagation(); setDragOver(false); const draggedId = event.dataTransfer.getData("text/plain"); if (draggedId && draggedId !== id) onReorder(draggedId, id); };
  return <div className={`relative rounded-2xl transition-[opacity,box-shadow] duration-150 ${dragging ? "opacity-40" : ""} ${dragOver ? "ring-2 ring-lime-400 ring-offset-2 ring-offset-[#f4f5ef] dark:ring-offset-zinc-950" : ""}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>{children}<button type="button" draggable onDragStart={onDragStart} onDragEnd={onDragEnd} aria-label="Arrastrar para reordenar" title="Arrastrar para reordenar" className="absolute -right-2 -top-2 grid h-7 w-7 cursor-grab place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm hover:text-zinc-600 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-300"><MoreVertical size={14} /></button></div>;
}

function ColumnDropZone({ columnIndex, onDropToColumn }) {
  const [dragOver, setDragOver] = useState(false);
  const onDragOver = (event) => { event.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (event) => { event.preventDefault(); setDragOver(false); const draggedId = event.dataTransfer.getData("text/plain"); if (draggedId) onDropToColumn(draggedId, columnIndex); };
  return <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={`grid min-h-10 place-items-center rounded-2xl border-2 border-dashed transition-colors ${dragOver ? "border-lime-400 bg-lime-100/40 dark:bg-lime-500/10" : "border-transparent"}`}>{dragOver && <span className="text-xs font-medium text-lime-600">Soltar al final de esta columna</span>}</div>;
}

function SummaryColumn({ columnIndex, ids, widgets, onReorder, onDropToColumn, onDragStateChange }) {
  return <div className="flex flex-1 flex-col gap-5">{ids.map((id) => <DraggableCard key={id} id={id} onReorder={onReorder} onDragStateChange={onDragStateChange}>{widgets[id]}</DraggableCard>)}<ColumnDropZone columnIndex={columnIndex} onDropToColumn={onDropToColumn} /></div>;
}

function WidgetPickerModal({ available, addWidget, close }) {
  return (
    <Modal title="Añadir widgets a Resumen" close={close}>
      <div className="mt-5 space-y-1">
        {available.length ? available.map((widget) => (
          <div key={widget.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <span className="text-sm">{widget.label}</span>
            <button type="button" onClick={() => addWidget(widget.id)} aria-label={`Añadir widget ${widget.label}`} className="grid h-8 w-8 place-items-center rounded-full text-lime-700 hover:bg-lime-100 dark:hover:bg-lime-500/10">
              <Plus size={16} />
            </button>
          </div>
        )) : <p className="py-6 text-center text-sm text-zinc-400">Ya agregaste todos los widgets disponibles.</p>}
      </div>
    </Modal>
  );
}

function UnifiedAgenda({ tasks, events, date, toggle, toggleEvent, openTask, openEvent }) { const items = [...tasks.filter((task) => task.date === date).map((task) => ({ ...task, itemType: "Tarea" })), ...events.filter((event) => event.date === date).map((event) => ({ ...event, itemType: "Evento" }))].sort((a, b) => a.time.localeCompare(b.time)); return <Card><CardHeader title="Tareas y eventos" action={<div className="flex gap-3"><button onClick={() => openTask(null, date)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={15} /> Tarea</button><button onClick={() => openEvent(null, date)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={15} /> Evento</button></div>} />{items.length ? <div className="space-y-2">{items.map((item) => item.itemType === "Evento" ? <button key={`event-${item.id}`} onClick={() => toggleEvent(item.id)} onDoubleClick={() => openEvent(item, date)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:brightness-95" style={{ backgroundColor: `${item.color}55` }}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-transform duration-300 ${item.done ? "scale-95 border-zinc-700 bg-zinc-700 text-white" : "border-zinc-400"}`}>{item.done && <Check size={13} />}</span><span className="h-8 w-1 rounded-full" style={{ backgroundColor: item.color }} /><span className="w-12 text-xs text-zinc-500">{item.time}</span><span className={`flex-1 text-sm font-medium ${item.done ? "text-zinc-500" : ""}`}><span className={item.done ? "task-strike" : ""}>{item.title}</span></span><span className="text-xs text-zinc-500">{item.type}</span></button> : <button key={`task-${item.id}`} onClick={() => toggle(item.id)} onDoubleClick={() => openTask(item, date)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${item.done ? "border-lime-500 bg-lime-400" : "border-zinc-300"}`}>{item.done && <Check size={13} />}</span><span className="w-12 text-xs text-zinc-400">{item.time}</span><span className={`flex-1 text-sm ${item.done ? "text-zinc-400" : ""}`}><span className={item.done ? "task-strike" : ""}>{item.title}</span></span><span className="text-xs text-zinc-500">{item.category}</span></button>)}</div> : <p className="py-8 text-center text-sm text-zinc-400">No hay tareas ni eventos para este día.</p>}</Card>; }

export default function Page() {
  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const setDark = setStoredDark;
  const [wave, setWave] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return (
    <div className={dark ? "dark" : ""}>
      {wave && <div className={`theme-wave ${dark ? "theme-wave-dark" : "theme-wave-light"}`} />}
      <AuthGate>{(user, logout) => <Home user={user} logout={logout} dark={dark} setDark={setDark} wave={wave} setWave={setWave} />}</AuthGate>
    </div>
  );
}

function Home({ user, logout, dark, setDark, wave, setWave }) {
  const [active, setActive] = useState("resumen"); const [tasks, setTasks] = useState([]); const [habits, setHabits] = useState([]); const [transactions, setTransactions] = useState([]); const [events, setEvents] = useState([]); const [date, setDate] = useState(todayIso); const [taskModal, setTaskModal] = useState(null); const [habitModal, setHabitModal] = useState(null); const [dayModal, setDayModal] = useState(null); const [eventModal, setEventModal] = useState(null); const [financeOpen, setFinanceOpen] = useState(false); const [seconds, setSeconds] = useState(0); const [running, setRunning] = useState(false); const [phase, setPhase] = useState("work"); const [settings, setSettingsState] = useState({ repetitions: 0, work: 0, breakTime: 0 }); const [summaryColumns, setSummaryColumns] = useState(loadSummaryLayout); const [hoursPeriod, setHoursPeriod] = useState(null); const [hourEntries, setHourEntries] = useState([]); const [hourPayments, setHourPayments] = useState([]); const [closedPeriods, setClosedPeriods] = useState([]); const [pomodoroHistory, setPomodoroHistory] = useState([]); const [categories, setCategories] = useState([]); const [categoryModalOpen, setCategoryModalOpen] = useState(false); const [savings, setSavings] = useState([]); const [savingModal, setSavingModal] = useState(null); const [savingMovementsModal, setSavingMovementsModal] = useState(null); const [savingMovements, setSavingMovements] = useState([]); const [habitDate, setHabitDate] = useState(todayIso); const [habitLogs, setHabitLogs] = useState({}); const [habitsOverview, setHabitsOverview] = useState([]); const [financeIncomeCategories, setFinanceIncomeCategories] = useState([]); const [financeExpenseCategories, setFinanceExpenseCategories] = useState([]); const [financeCategoryModalOpen, setFinanceCategoryModalOpen] = useState(false); const [shoppingItems, setShoppingItems] = useState([]); const [shoppingCategories, setShoppingCategories] = useState([]); const [draggingWidgetId, setDraggingWidgetId] = useState(null); const [widgetPickerOpen, setWidgetPickerOpen] = useState(false); const [loading, setLoading] = useState(true); const weekdayLetters = ["D", "L", "M", "X", "J", "V", "S"]; const pomodoroChartData = pomodoroHistory.map((entry) => ({ day: weekdayLetters[new Date(`${entry.date}T12:00:00`).getDay()], minutes: Math.round(entry.seconds / 6) / 10 }));
  useEffect(() => { localStorage.setItem(SUMMARY_LAYOUT_KEY, JSON.stringify(summaryColumns)); }, [summaryColumns]);
  useEffect(() => {
    if (!draggingWidgetId) return undefined;
    const EDGE = 100; const MAX_SPEED = 22;
    const onDragOverWindow = (event) => {
      const y = event.clientY;
      if (y < EDGE) window.scrollBy(0, -MAX_SPEED * (1 - y / EDGE));
      else if (y > window.innerHeight - EDGE) window.scrollBy(0, MAX_SPEED * (1 - (window.innerHeight - y) / EDGE));
    };
    window.addEventListener("dragover", onDragOverWindow);
    return () => window.removeEventListener("dragover", onDragOverWindow);
  }, [draggingWidgetId]);
  const settingsRef = useRef(settings); useEffect(() => { settingsRef.current = settings; }, [settings]);
  const phaseRef = useRef(phase); useEffect(() => { phaseRef.current = phase; }, [phase]);
  const workSecondsRef = useRef(0);
  const flushPomodoroSeconds = () => {
    const pending = workSecondsRef.current;
    if (pending <= 0) return;
    workSecondsRef.current = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    setPomodoroHistory((current) => current.map((entry) => entry.date === todayStr ? { ...entry, seconds: entry.seconds + pending } : entry));
    api("/pomodoro/log", { method: "POST", body: JSON.stringify({ seconds: pending }) }).catch(() => {});
  };
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setSeconds((value) => { if (value > 0) return value - 1; playAlarmSound(); const nextPhase = phaseRef.current === "work" ? "break" : "work"; setPhase(nextPhase); return (nextPhase === "work" ? settingsRef.current.work : settingsRef.current.breakTime) * 60; });
      if (phaseRef.current === "work") { workSecondsRef.current += 1; if (workSecondsRef.current >= 60) flushPomodoroSeconds(); }
    }, 1000);
    return () => { clearInterval(timer); flushPomodoroSeconds(); };
  }, [running]);
  const applyHoursState = (data) => { setHoursPeriod(data.period); setHourEntries(data.entries.map(fromApiEntry)); setHourPayments(data.payments.map(fromApiPayment)); setClosedPeriods(data.closed_periods.map(fromApiClosedPeriod)); };
  useEffect(() => { Promise.all([api("/dashboard"), api("/events"), api("/pomodoro"), api("/hours"), api("/pomodoro/history"), api("/categories"), api("/categories?scope=finance&kind=income"), api("/categories?scope=finance&kind=expense"), api("/habits/overview"), api("/shopping-items"), api("/categories?scope=shopping")]).then(([dashboardData, eventsData, pomodoroData, hoursData, historyData, categoriesData, financeIncomeData, financeExpenseData, overviewData, shoppingItemsData, shoppingCategoriesData]) => { setTasks(dashboardData.tasks.map(fromApiTask)); setHabits(dashboardData.habits.map(fromApiHabit)); setTransactions(dashboardData.transactions.map(fromApiTransaction)); setSavings(dashboardData.savings.map(fromApiSaving)); setEvents(eventsData.map(fromApiEvent)); const loadedSettings = fromApiSettings(pomodoroData); setSettingsState(loadedSettings); setSeconds(loadedSettings.work * 60); applyHoursState(hoursData); setPomodoroHistory(historyData); setCategories(categoriesData); setFinanceIncomeCategories(financeIncomeData); setFinanceExpenseCategories(financeExpenseData); setHabitsOverview(overviewData.map(fromApiHabitOverview)); setShoppingItems(shoppingItemsData); setShoppingCategories(shoppingCategoriesData); setLoading(false); }).catch(() => logout()); }, [logout]);
  const habitIdsKey = habits.map((habit) => habit.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the set of habit ids changes, not on every count update
  useEffect(() => { if (!habitIdsKey) return; Promise.all(habits.map((habit) => api(`/habits/${habit.id}/logs`).then((logs) => [habit.id, logs]))).then((entries) => { const map = {}; entries.forEach(([id, logs]) => { map[id] = {}; logs.forEach((log) => { map[id][log.log_date] = log.count; }); }); setHabitLogs((current) => ({ ...current, ...map })); }); }, [habitIdsKey]);
  const quote = useMemo(() => quotes[new Date().getDate() % quotes.length], []);
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f4f5ef] dark:bg-zinc-950"><p className="text-sm text-zinc-400">Cargando tu día…</p></div>;
  const hour = new Date().getHours(); const greeting = hour < 12 ? "Buen día" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const setSettings = (next) => { setSettingsState(next); api("/pomodoro", { method: "PATCH", body: JSON.stringify(toApiSettings(next)) }).catch(() => {}); };
  const saveHourEntry = (form) => { const previous = hourEntries; const existing = hourEntries.find((entry) => entry.date === form.date); setHourEntries(existing ? hourEntries.map((entry) => entry.date === form.date ? { ...form, id: existing.id } : entry) : [...hourEntries, { ...form, id: `temp-${form.date}` }]); api("/hours/entries", { method: "PUT", body: JSON.stringify(toApiEntry(form)) }).then((saved) => setHourEntries((current) => current.map((entry) => entry.date === form.date ? fromApiEntry(saved) : entry))).catch(() => setHourEntries(previous)); };
  const removeHourEntry = (id) => { const previous = hourEntries; setHourEntries(hourEntries.filter((entry) => entry.id !== id)); api(`/hours/entries/${id}`, { method: "DELETE" }).catch(() => setHourEntries(previous)); };
  const toggleTask = (id) => { setTasks(tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task)); api(`/tasks/${id}/complete`, { method: "PATCH" }).catch(() => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task))); };
  const openTask = (task, selectedDate = date) => { setDate(selectedDate); setTaskModal(task || { date: selectedDate }); };
  const saveTask = (task) => { const existing = tasks.find((item) => item.id === task.id); const payload = toApiTask(task); setTasks(existing ? tasks.map((item) => item.id === task.id ? task : item) : [...tasks, task]); setTaskModal(null); if (existing) { api(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(payload) }).then((updated) => setTasks((current) => current.map((item) => item.id === task.id ? fromApiTask(updated) : item))).catch(() => setTasks((current) => current.map((item) => item.id === task.id ? existing : item))); } else { api("/tasks", { method: "POST", body: JSON.stringify(payload) }).then((created) => setTasks((current) => [...current.filter((item) => item.id !== task.id), ...created.map(fromApiTask)])).catch(() => setTasks((current) => current.filter((item) => item.id !== task.id))); } };
  const deleteTask = (id) => { const previous = tasks; setTasks(tasks.filter((task) => task.id !== id)); setTaskModal(null); api(`/tasks/${id}`, { method: "DELETE" }).catch(() => setTasks(previous)); };
  const addCategory = (name) => api("/categories", { method: "POST", body: JSON.stringify({ name }) }).then((created) => setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name))));
  const removeCategory = (id) => {
    const previous = categories;
    const removed = categories.find((category) => category.id === id);
    setCategories(categories.filter((category) => category.id !== id));
    if (removed) {
      setTasks((current) => current.map((task) => task.category === removed.name ? { ...task, category: null } : task));
      setEvents((current) => current.map((event) => event.type === removed.name ? { ...event, type: null } : event));
    }
    api(`/categories/${id}`, { method: "DELETE" }).catch(() => setCategories(previous));
  };
  const setHabitCount = (habitId, dateStr, nextCount) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) return;
    const previousHabits = habits;
    const previousLogs = habitLogs;
    setHabitLogs((current) => ({ ...current, [habitId]: { ...(current[habitId] || {}), [dateStr]: nextCount } }));
    if (dateStr === todayIso()) {
      const progress = habit.target ? Math.round((nextCount / habit.target) * 100) : 0;
      setHabits((current) => current.map((item) => item.id === habitId ? { ...item, count: nextCount, progress } : item));
    }
    api(`/habits/${habitId}/logs/${dateStr}`, { method: "PUT", body: JSON.stringify({ count: nextCount }) })
      .then((updated) => setHabits((current) => current.map((item) => item.id === habitId ? fromApiHabit(updated) : item)))
      .catch(() => { setHabits(previousHabits); setHabitLogs(previousLogs); });
  };
  const saveHabit = (habit) => { const existing = habits.find((item) => item.id === habit.id); setHabits(existing ? habits.map((item) => item.id === habit.id ? habit : item) : [...habits, habit]); setHabitModal(null); if (existing) { api(`/habits/${habit.id}`, { method: "PATCH", body: JSON.stringify({ name: habit.name, target: habit.target, unit: habit.unit }) }).then((updated) => setHabits((current) => current.map((item) => item.id === habit.id ? fromApiHabit(updated) : item))).catch(() => setHabits((current) => current.map((item) => item.id === habit.id ? existing : item))); } else { api("/habits", { method: "POST", body: JSON.stringify({ name: habit.name, target: habit.target, unit: habit.unit }) }).then((created) => setHabits((current) => current.map((item) => item.id === habit.id ? fromApiHabit(created) : item))).catch(() => setHabits((current) => current.filter((item) => item.id !== habit.id))); } };
  const deleteHabit = (id) => { const previous = habits; setHabits(habits.filter((habit) => habit.id !== id)); setHabitModal(null); api(`/habits/${id}`, { method: "DELETE" }).catch(() => setHabits(previous)); };
  const addTransaction = (item) => { const tempId = Date.now(); setTransactions([...transactions, { id: tempId, description: item.description, amount: item.amount, kind: item.kind, category: item.category, method: item.method, createdAt: new Date().toISOString() }]); setFinanceOpen(false); api("/transactions", { method: "POST", body: JSON.stringify({ description: item.description, amount: item.amount, kind: item.kind, category: item.category, method: item.method }) }).then((created) => setTransactions((current) => current.map((entry) => entry.id === tempId ? fromApiTransaction(created) : entry))).catch(() => setTransactions((current) => current.filter((entry) => entry.id !== tempId))); };
  const deleteTransaction = (id) => { const previous = transactions; setTransactions(transactions.filter((item) => item.id !== id)); api(`/transactions/${id}`, { method: "DELETE" }).catch(() => setTransactions(previous)); };
  const openSaving = (saving) => setSavingModal(saving || { name: "", start: "" });
  const saveSaving = (saving) => { const existing = savings.find((item) => item.id === saving.id); setSavings(existing ? savings.map((item) => item.id === saving.id ? saving : item) : [...savings, saving]); setSavingModal(null); if (existing) { api(`/savings/${saving.id}`, { method: "PATCH", body: JSON.stringify(toApiSaving(saving)) }).then((updated) => setSavings((current) => current.map((item) => item.id === saving.id ? fromApiSaving(updated) : item))).catch(() => setSavings((current) => current.map((item) => item.id === saving.id ? existing : item))); } else { api("/savings", { method: "POST", body: JSON.stringify(toApiSaving(saving)) }).then((created) => setSavings((current) => current.map((item) => item.id === saving.id ? fromApiSaving(created) : item))).catch(() => setSavings((current) => current.filter((item) => item.id !== saving.id))); } };
  const deleteSaving = (id) => { const previous = savings; setSavings(savings.filter((item) => item.id !== id)); setSavingModal(null); api(`/savings/${id}`, { method: "DELETE" }).catch(() => setSavings(previous)); };
  const openSavingMovements = (saving) => { setSavingMovementsModal(saving); setSavingMovements([]); api(`/savings/${saving.id}/movements`).then((data) => setSavingMovements(data.map(fromApiSavingMovement))).catch(() => {}); };
  const addSavingMovement = (amount) => api(`/savings/${savingMovementsModal.id}/movements`, { method: "POST", body: JSON.stringify({ amount }) }).then((updated) => {
    setSavings((current) => current.map((item) => item.id === savingMovementsModal.id ? fromApiSaving(updated) : item));
    setSavingMovementsModal((current) => ({ ...current, current: updated.current_amount, gain: updated.gain }));
    return api(`/savings/${savingMovementsModal.id}/movements`).then((data) => setSavingMovements(data.map(fromApiSavingMovement)));
  });
  const removeSavingMovement = (movementId) => api(`/savings/${savingMovementsModal.id}/movements/${movementId}`, { method: "DELETE" }).then((updated) => {
    setSavings((current) => current.map((item) => item.id === savingMovementsModal.id ? fromApiSaving(updated) : item));
    setSavingMovementsModal((current) => ({ ...current, current: updated.current_amount, gain: updated.gain }));
    setSavingMovements((current) => current.filter((item) => item.id !== movementId));
  });
  const financeCategorySetter = (kind) => kind === "income" ? setFinanceIncomeCategories : setFinanceExpenseCategories;
  const financeCategoryList = (kind) => kind === "income" ? financeIncomeCategories : financeExpenseCategories;
  const addFinanceCategory = (kind, name) => api("/categories", { method: "POST", body: JSON.stringify({ name, scope: "finance", kind }) }).then((created) => financeCategorySetter(kind)((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name))));
  const renameFinanceCategory = (kind, id, name) => api(`/categories/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }).then((updated) => {
    financeCategorySetter(kind)((current) => current.map((category) => category.id === id ? updated : category).sort((a, b) => a.name.localeCompare(b.name)));
    const previousName = financeCategoryList(kind).find((category) => category.id === id)?.name;
    if (previousName) setTransactions((current) => current.map((tx) => tx.category === previousName && tx.kind === kind ? { ...tx, category: name } : tx));
  });
  const removeFinanceCategory = (kind, id) => {
    const list = financeCategoryList(kind);
    const setter = financeCategorySetter(kind);
    const removed = list.find((category) => category.id === id);
    setter(list.filter((category) => category.id !== id));
    if (removed) setTransactions((current) => current.map((tx) => tx.category === removed.name && tx.kind === kind ? { ...tx, category: null } : tx));
    api(`/categories/${id}`, { method: "DELETE" }).catch(() => setter(list));
  };
  const openCategoryManager = () => setCategoryModalOpen(true); const toggleEvent = (id) => { const previous = events.find((item) => item.id === id); setEvents(events.map((event) => event.id === id ? { ...event, done: !event.done } : event)); api(`/events/${id}/toggle`, { method: "PATCH" }).catch(() => setEvents((current) => current.map((event) => event.id === id ? previous : event))); }; const openEvent = (event, selectedDate = date) => { setDate(selectedDate); setEventModal(event || { date: selectedDate }); }; const saveEvent = (event) => { const existing = events.find((item) => item.id === event.id); const payload = toApiEvent(event); setEvents(existing ? events.map((item) => item.id === event.id ? event : item) : [...events, { ...event, done: false }]); setEventModal(null); if (existing) { api(`/events/${event.id}`, { method: "PATCH", body: JSON.stringify(payload) }).then((updated) => setEvents((current) => current.map((item) => item.id === event.id ? fromApiEvent(updated) : item))).catch(() => setEvents((current) => current.map((item) => item.id === event.id ? existing : item))); } else { api("/events", { method: "POST", body: JSON.stringify(payload) }).then((created) => setEvents((current) => [...current.filter((item) => item.id !== event.id), ...created.map(fromApiEvent)])).catch(() => setEvents((current) => current.filter((item) => item.id !== event.id))); } }; const deleteEvent = (id) => { const previous = events; setEvents(events.filter((event) => event.id !== id)); setEventModal(null); api(`/events/${id}`, { method: "DELETE" }).catch(() => setEvents(previous)); }; const reorderSummary = (draggedId, targetId) => setSummaryColumns((current) => { const next = current.map((column) => column.filter((item) => item !== draggedId)); const targetColumnIndex = next.findIndex((column) => column.includes(targetId)); if (targetColumnIndex === -1) return current; const targetColumn = [...next[targetColumnIndex]]; targetColumn.splice(targetColumn.indexOf(targetId), 0, draggedId); next[targetColumnIndex] = targetColumn; return next; }); const moveSummaryToColumn = (draggedId, columnIndex) => setSummaryColumns((current) => { const next = current.map((column) => column.filter((item) => item !== draggedId)); next[columnIndex] = [...next[columnIndex], draggedId]; return next; });
  const addWidget = (id) => setSummaryColumns((current) => { const shorterIndex = current[0].length <= current[1].length ? 0 : 1; const next = current.map((column) => [...column]); next[shorterIndex].push(id); return next; });
  const removeWidget = (id) => setSummaryColumns((current) => current.map((column) => column.filter((item) => item !== id)));
  const presentWidgetIds = new Set(summaryColumns.flat());
  const availableWidgets = WIDGET_META.filter((widget) => !presentWidgetIds.has(widget.id));
  const progressTotal = tasks.length + events.length + habits.length; const progressDone = tasks.filter((task) => task.done).length + events.filter((event) => event.done).length + habits.filter((habit) => habit.progress >= 100).length;
  const hoursPanelNode = <HoursPanel period={hoursPeriod} setPeriod={setHoursPeriod} entries={hourEntries} setEntries={setHourEntries} payments={hourPayments} setPayments={setHourPayments} closedPeriods={closedPeriods} setClosedPeriods={setClosedPeriods} onSaveEntry={saveHourEntry} onRemoveEntry={removeHourEntry} />;
  const hoursPanelCompactNode = <HoursPanel period={hoursPeriod} setPeriod={setHoursPeriod} entries={hourEntries} setEntries={setHourEntries} payments={hourPayments} setPayments={setHourPayments} closedPeriods={closedPeriods} setClosedPeriods={setClosedPeriods} onSaveEntry={saveHourEntry} onRemoveEntry={removeHourEntry} compact />;
  const financeArchiveNode = <FinanceArchive transactions={transactions} savings={savings} openFinance={() => setFinanceOpen(true)} openSaving={openSaving} openSavingMovements={openSavingMovements} onDelete={deleteTransaction} openFinanceCategoryManager={() => setFinanceCategoryModalOpen(true)} />;
  const financeArchiveCompactNode = <FinanceArchive transactions={transactions} savings={savings} openFinance={() => setFinanceOpen(true)} openSaving={openSaving} openSavingMovements={openSavingMovements} onDelete={deleteTransaction} openFinanceCategoryManager={() => setFinanceCategoryModalOpen(true)} compact />;
  const summaryWidgets = { hero: <Card className="bg-zinc-200 dark:bg-zinc-800"><CardHeader eyebrow="Tu día" title="En camino" /><p className="text-4xl font-semibold leading-tight">Pequeños pasos,<br /><span className="text-lime-600">gran progreso.</span></p><p className="mt-6 border-l-2 border-lime-500 pl-3 text-sm italic text-zinc-700 dark:text-zinc-200">“{quote.text}”<span className="mt-2 block text-xs not-italic text-lime-700 dark:text-lime-300">— {quote.author}</span></p><Progress value={progressTotal ? progressDone / progressTotal * 100 : 0} color="bg-lime-500" /></Card>, pomodoro: <Pomodoro settings={settings} setSettings={setSettings} seconds={seconds} setSeconds={setSeconds} running={running} setRunning={setRunning} phase={phase} setPhase={setPhase} history={pomodoroChartData} compact />, calendar: <Card><CardHeader eyebrow="Calendario" title="Tu agenda" /><Calendar value={date} onChange={setDate} onDoubleClick={setDayModal} markers={events.map((event) => ({ date: event.date, color: event.color }))} /></Card>, agenda: <UnifiedAgenda tasks={tasks} events={events} date={date} toggle={toggleTask} toggleEvent={toggleEvent} openTask={openTask} openEvent={openEvent} />, habits: <div className="space-y-5"><Habits habits={habits} date={habitDate} setDate={setHabitDate} habitLogs={habitLogs} onSetCount={setHabitCount} openHabit={setHabitModal} /><HabitsTracker habits={habits} habitLogs={habitLogs} overview={habitsOverview} /></div>, horas: hoursPanelCompactNode, finanzas: financeArchiveCompactNode };
  const content = active === "pomodoro" ? <Pomodoro settings={settings} setSettings={setSettings} seconds={seconds} setSeconds={setSeconds} running={running} setRunning={setRunning} phase={phase} setPhase={setPhase} history={pomodoroChartData} /> : active === "hábitos" ? <div className="space-y-5"><Habits habits={habits} date={habitDate} setDate={setHabitDate} habitLogs={habitLogs} onSetCount={setHabitCount} openHabit={setHabitModal} /><HabitsTracker habits={habits} habitLogs={habitLogs} overview={habitsOverview} /></div> : active === "calendario" ? <div className="space-y-5"><Card><CardHeader eyebrow="Agenda" title="Calendario" /><Calendar value={date} onChange={setDate} onDoubleClick={setDayModal} markers={events.map((event) => ({ date: event.date, color: event.color }))} /></Card><AgendaPanel tasks={tasks} events={events} date={date} setDate={setDate} toggle={toggleTask} toggleEvent={toggleEvent} openTask={openTask} openEvent={openEvent} deleteTask={deleteTask} deleteEvent={deleteEvent} openCategoryManager={openCategoryManager} /></div> : active === "horas" ? hoursPanelNode : active === "finanzas" ? financeArchiveNode : active === "compras" ? <ShoppingPanel items={shoppingItems} setItems={setShoppingItems} categories={shoppingCategories} setCategories={setShoppingCategories} /> : <div className="flex flex-col gap-5 xl:flex-row xl:items-start">{summaryColumns.map((ids, columnIndex) => <SummaryColumn key={columnIndex} columnIndex={columnIndex} ids={ids} widgets={summaryWidgets} onReorder={reorderSummary} onDropToColumn={moveSummaryToColumn} onDragStateChange={setDraggingWidgetId} />)}</div>;
  return <main><div className="min-h-screen bg-[#f4f5ef] text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100"><div className="mx-auto flex min-h-screen max-w-[1500px]"><aside className="app-sidebar hidden w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-[#fbfcf7] p-7 dark:border-zinc-800 dark:bg-zinc-900 lg:flex"><div className="flex items-center gap-3"><Image src="/logo.png" alt="Dayflow" width={40} height={40} className="h-10 w-10 rounded-xl" /><span className="text-xl font-semibold">dayflow</span></div><nav className="mt-16 space-y-2 text-sm font-medium">{tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${active === id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}><Icon size={18} />{label}</button>)}</nav></aside><section className="w-full px-5 py-7 sm:px-8 lg:px-12"><header className="app-header flex items-start justify-between"><div><p className="text-sm font-medium text-zinc-400">{formatFullDate(todayIso())}</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{greeting}, {user.full_name.split(" ")[0]} <span className="text-lime-600">✦</span></h1></div><div className="flex items-center gap-2">{active === "resumen" && (draggingWidgetId ? <button onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); removeWidget(draggingWidgetId); setDraggingWidgetId(null); }} aria-label="Soltar aquí para quitar el widget" title="Soltar aquí para quitar" className="grid h-10 w-10 place-items-center rounded-full border border-red-200 bg-red-50 text-red-500 shadow-sm dark:border-red-900/50 dark:bg-red-500/10"><Trash2 size={17} /></button> : <button onClick={() => setWidgetPickerOpen(true)} aria-label="Añadir widgets a Resumen" title="Añadir widgets" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><Plus size={17} /></button>)}<button onClick={() => { setWave(true); setDark(!dark); window.setTimeout(() => setWave(false), 500); }} aria-label="Cambiar tema" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><LogOut size={17} /></button></div></header><div className="mt-8 flex gap-2 overflow-x-auto pb-1 lg:hidden">{tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${active === id ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 dark:bg-zinc-900"}`}><Icon size={14} />{label}</button>)}</div><div key={active} className="tab-panel mt-7">{content}</div></section></div></div>{taskModal && <TaskModal task={taskModal.id ? taskModal : null} date={taskModal.date || date} categories={categories} close={() => setTaskModal(null)} save={saveTask} remove={deleteTask} />}{categoryModalOpen && <CategoryManagerModal categories={categories} addCategory={addCategory} removeCategory={removeCategory} close={() => setCategoryModalOpen(false)} />}{habitModal && <HabitModal habit={habitModal} close={() => setHabitModal(null)} save={saveHabit} remove={deleteHabit} />}{financeOpen && <FinanceModal incomeCategories={financeIncomeCategories} expenseCategories={financeExpenseCategories} close={() => setFinanceOpen(false)} save={addTransaction} />}{savingModal && <SavingModal saving={savingModal.id ? savingModal : null} close={() => setSavingModal(null)} save={saveSaving} remove={deleteSaving} />}{savingMovementsModal && <SavingMovementsModal saving={savingMovementsModal} movements={savingMovements} addMovement={addSavingMovement} removeMovement={removeSavingMovement} close={() => setSavingMovementsModal(null)} />}{financeCategoryModalOpen && <FinanceCategoryManagerModal incomeCategories={financeIncomeCategories} expenseCategories={financeExpenseCategories} addCategory={addFinanceCategory} renameCategory={renameFinanceCategory} removeCategory={removeFinanceCategory} close={() => setFinanceCategoryModalOpen(false)} />}{widgetPickerOpen && <WidgetPickerModal available={availableWidgets} addWidget={addWidget} close={() => setWidgetPickerOpen(false)} />}{eventModal && <EventModal event={eventModal.id ? eventModal : null} date={eventModal.date || date} categories={categories} close={() => setEventModal(null)} save={saveEvent} remove={deleteEvent} />}{dayModal && <DayModal date={dayModal} tasks={tasks} events={events} openTask={openTask} openEvent={openEvent} close={() => setDayModal(null)} />}</main>;
}




















