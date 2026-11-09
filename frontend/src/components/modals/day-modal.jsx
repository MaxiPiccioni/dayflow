"use client";

import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

// Agenda de un día (doble clic en el calendario): lista tareas y eventos y deja agregar nuevos.
export function DayModal({ date, tasks, events, openTask, openEvent, close }) {
  const dayTasks = tasks.filter((task) => task.date === date);
  const dayEvents = events.filter((event) => event.date === date);
  return (
    <Modal title={`Agenda del ${date}`} close={close}>
      <div className="mt-5 space-y-2">
        {dayTasks.map((task) => (
          <div key={`task-${task.id}`} onDoubleClick={() => { close(); openTask(task, date); }} className="cursor-pointer rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
            <span className="mr-3 text-xs text-zinc-400">{task.time}</span>
            {task.title}
          </div>
        ))}
        {dayEvents.map((event) => (
          <div key={`event-${event.id}`} onDoubleClick={() => { close(); openEvent(event, date); }} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 text-sm" style={{ backgroundColor: `${event.color}55` }}>
            <span className="h-6 w-1 rounded-full" style={{ backgroundColor: event.color }} />
            <span className="text-xs text-zinc-500">{event.time}</span>
            <span className="flex-1">{event.title}</span>
          </div>
        ))}
        {!dayTasks.length && !dayEvents.length && <p className="py-4 text-sm text-zinc-500">No hay tareas ni eventos para este día.</p>}
      </div>
      <div className="mt-6 flex gap-2">
        <button onClick={() => { close(); openTask(null, date); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">
          <Plus size={16} /> Agregar tarea
        </button>
        <button onClick={() => { close(); openEvent(null, date); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 py-3 text-sm font-semibold dark:border-zinc-700">
          <Plus size={16} /> Agregar evento
        </button>
      </div>
    </Modal>
  );
}
