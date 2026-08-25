import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_DOTS = 5;
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function Calendar({ value, onChange, onDoubleClick, markers = [], dateColors = {} }) {
  const initialMonth = value ? value.slice(0, 7) : "2026-08";
  const [month, setMonth] = useState(initialMonth);
  const monthDate = useMemo(() => new Date(`${month}-01T12:00:00`), [month]);
  const monthName = `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay() + 6) % 7;
  const toDate = (day) => `${month}-${String(day).padStart(2, "0")}`;
  const shiftMonth = (amount) => { const next = new Date(monthDate); next.setMonth(next.getMonth() + amount); setMonth(next.toISOString().slice(0, 7)); };
  return <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"><div className="mb-4 flex items-center justify-between"><button type="button" aria-label="Mes anterior" onClick={() => shiftMonth(-1)} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronLeft size={17} /></button><strong>{monthName}</strong><button type="button" aria-label="Mes siguiente" onClick={() => shiftMonth(1)} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronRight size={17} /></button></div><div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">{["L", "M", "X", "J", "V", "S", "D"].map((day) => <span key={day} className="p-2 font-semibold">{day}</span>)}{Array.from({ length: firstDay + daysInMonth }, (_, index) => { if (index < firstDay) return <span key={`empty-${index}`} />; const day = index - firstDay + 1; const date = toDate(day); const selected = value === date; const dateColor = dateColors[date]; const dots = dateColor ? [] : markers.filter((marker) => marker.date === date).slice(0, MAX_DOTS); return <button key={date} type="button" onClick={() => onChange(date)} onDoubleClick={() => onDoubleClick?.(date)} className={`relative rounded-xl p-3 text-sm transition-colors ${selected ? "bg-zinc-900 font-semibold text-white" : "text-zinc-700 hover:bg-lime-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`} style={!selected && dateColor ? { backgroundColor: dateColor } : undefined}>{day}{dots.length > 0 && <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5">{dots.map((dot, dotIndex) => <i key={dotIndex} className="h-1 w-1 rounded-full" style={{ backgroundColor: dot.color }} />)}</span>}</button>; })}</div></div>;
}
