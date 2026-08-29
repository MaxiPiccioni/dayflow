import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_DOTS = 5;
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const STATUS_STYLES = {
  paid: "bg-lime-200 text-lime-950 dark:bg-lime-500/30 dark:text-lime-100",
  pending: "bg-yellow-200 text-yellow-950 dark:bg-yellow-500/30 dark:text-yellow-100",
  outside: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/40 dark:text-zinc-100",
};

export function Calendar({ value, onChange, onDoubleClick, onMonthChange, markers = [], dateColors = {} }) {
  const initialMonth = value ? value.slice(0, 7) : new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  const monthDate = useMemo(() => new Date(`${month}-01T12:00:00`), [month]);
  const monthName = `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay() + 6) % 7;
  const toDate = (day) => `${month}-${String(day).padStart(2, "0")}`;
  const shiftMonth = (amount) => { const next = new Date(monthDate); next.setMonth(next.getMonth() + amount); const nextMonth = next.toISOString().slice(0, 7); setMonth(nextMonth); onMonthChange?.(nextMonth); };
  return <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"><div className="mb-4 flex items-center justify-between"><button type="button" aria-label="Mes anterior" onClick={() => shiftMonth(-1)} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronLeft size={17} /></button><strong>{monthName}</strong><button type="button" aria-label="Mes siguiente" onClick={() => shiftMonth(1)} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronRight size={17} /></button></div><div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">{["L", "M", "X", "J", "V", "S", "D"].map((day) => <span key={day} className="p-2 font-semibold">{day}</span>)}{Array.from({ length: firstDay + daysInMonth }, (_, index) => { if (index < firstDay) return <span key={`empty-${index}`} />; const day = index - firstDay + 1; const date = toDate(day); const selected = value === date; const status = dateColors[date]; const dots = status ? [] : markers.filter((marker) => marker.date === date).slice(0, MAX_DOTS); return <button key={date} type="button" onClick={() => onChange(date)} onDoubleClick={() => onDoubleClick?.(date)} className={`relative rounded-xl p-3 text-sm transition-colors ${selected ? "bg-zinc-900 font-semibold text-white dark:bg-lime-400 dark:text-zinc-950" : status ? STATUS_STYLES[status] : "text-zinc-700 hover:bg-lime-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}>{day}{dots.length > 0 && <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5">{dots.map((dot, dotIndex) => <i key={dotIndex} className="h-1 w-1 rounded-full" style={{ backgroundColor: dot.color }} />)}</span>}</button>; })}</div></div>;
}
