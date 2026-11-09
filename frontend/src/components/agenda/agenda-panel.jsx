"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Plus, Settings2, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shiftIsoDate } from "@/lib/dates";

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

const iconButton = "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

// Pestaña Calendario: tareas y eventos de un día, con orden y gestión de categorías.
export function AgendaPanel({ tasks, events, date, setDate, toggle, toggleEvent, openTask, openEvent, deleteTask, deleteEvent, openCategoryManager }) {
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
      <CardHeader
        title="Tareas y eventos"
        action={(
          <div className="flex gap-3">
            <button onClick={() => openTask(null, date)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={15} /> Tarea</button>
            <button onClick={() => openEvent(null, date)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={15} /> Evento</button>
          </div>
        )}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <button type="button" onClick={() => setDate(shiftIsoDate(date, -1))} aria-label="Día anterior" className={iconButton}>
            <ChevronLeft size={16} />
          </button>
          <DatePicker value={date} onChange={setDate} className="flex-1" />
          <button type="button" onClick={() => setDate(shiftIsoDate(date, 1))} aria-label="Día siguiente" className={iconButton}>
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
