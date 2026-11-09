"use client";

import { useRef } from "react";
import { Check, ChevronLeft, ChevronRight, Flame, Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Progress } from "@/components/ui/progress";
import { shiftIsoDate, todayIso } from "@/lib/dates";

// Lista de hábitos del día: un clic suma uno (al llegar a la meta vuelve a cero) y el doble clic abre el editor.
export function Habits({ habits, date, setDate, habitLogs, onSetCount, openHabit }) {
  const clickTimers = useRef({});
  const isToday = date === todayIso();
  const countFor = (habit) => (isToday ? habit.count : habitLogs[habit.id]?.[date] ?? 0);
  const progressFor = (habit) => (habit.target ? Math.round((countFor(habit) / habit.target) * 100) : 0);
  const cycle = (habit) => {
    const current = countFor(habit);
    onSetCount(habit.id, date, current >= habit.target ? 0 : current + 1);
  };
  const onHabitClick = (event, habit) => {
    if (event.detail === 2) {
      clearTimeout(clickTimers.current[habit.id]);
      openHabit(habit);
    } else {
      clickTimers.current[habit.id] = window.setTimeout(() => cycle(habit), 250);
    }
  };
  return (
    <Card>
      <CardHeader
        eyebrow="Rituales diarios"
        title="Hábitos saludables"
        action={<button onClick={() => openHabit({ name: "", target: 1, unit: "veces" })} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={16} /> Nuevo</button>}
      />
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
            <button key={habit.id} onClick={(event) => onHabitClick(event, habit)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800">
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
