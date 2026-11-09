"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { AgendaPanel } from "@/components/agenda/agenda-panel";
import { useApp } from "@/components/app/app-provider";

// Ruta "/calendario".
export function CalendarPage() {
  const { agenda } = useApp();
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader eyebrow="Agenda" title="Calendario" />
        <Calendar value={agenda.date} onChange={agenda.setDate} onDoubleClick={agenda.setDayModal} markers={agenda.events.map((event) => ({ date: event.date, color: event.color }))} />
      </Card>
      <AgendaPanel
        tasks={agenda.tasks} events={agenda.events} date={agenda.date} setDate={agenda.setDate}
        toggle={agenda.toggleTask} toggleEvent={agenda.toggleEvent} openTask={agenda.openTask} openEvent={agenda.openEvent}
        deleteTask={agenda.deleteTask} deleteEvent={agenda.deleteEvent} openCategoryManager={agenda.openCategoryManager}
      />
    </div>
  );
}
