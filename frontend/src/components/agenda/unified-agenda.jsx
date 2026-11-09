"use client";

import { Check, Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

// Tareas y eventos del día seleccionado, en versión compacta para el Resumen.
export function UnifiedAgenda({ tasks, events, date, toggle, toggleEvent, openTask, openEvent }) {
  const items = [
    ...tasks.filter((task) => task.date === date).map((task) => ({ ...task, itemType: "Tarea" })),
    ...events.filter((event) => event.date === date).map((event) => ({ ...event, itemType: "Evento" })),
  ].sort((a, b) => a.time.localeCompare(b.time));
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
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => item.itemType === "Evento" ? (
            <button key={`event-${item.id}`} onClick={() => toggleEvent(item.id)} onDoubleClick={() => openEvent(item, date)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:brightness-95" style={{ backgroundColor: `${item.color}55` }}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-transform duration-300 ${item.done ? "scale-95 border-zinc-700 bg-zinc-700 text-white" : "border-zinc-400"}`}>{item.done && <Check size={13} />}</span>
              <span className="h-8 w-1 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="w-12 text-xs text-zinc-500">{item.time}</span>
              <span className={`flex-1 text-sm font-medium ${item.done ? "text-zinc-500" : ""}`}><span className={item.done ? "task-strike" : ""}>{item.title}</span></span>
              <span className="text-xs text-zinc-500">{item.type}</span>
            </button>
          ) : (
            <button key={`task-${item.id}`} onClick={() => toggle(item.id)} onDoubleClick={() => openTask(item, date)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${item.done ? "border-lime-500 bg-lime-400" : "border-zinc-300"}`}>{item.done && <Check size={13} />}</span>
              <span className="w-12 text-xs text-zinc-400">{item.time}</span>
              <span className={`flex-1 text-sm ${item.done ? "text-zinc-400" : ""}`}><span className={item.done ? "task-strike" : ""}>{item.title}</span></span>
              <span className="text-xs text-zinc-500">{item.category}</span>
            </button>
          ))}
        </div>
      ) : <p className="py-8 text-center text-sm text-zinc-400">No hay tareas ni eventos para este día.</p>}
    </Card>
  );
}
