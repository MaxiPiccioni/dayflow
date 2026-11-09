"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayIso } from "@/lib/dates";

const HABIT_WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

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

// Tracker: resumen general de los últimos días o la evolución de un hábito.
export function HabitsTracker({ habits, habitLogs, overview }) {
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
        action={(
          <ShadSelect value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              {habits.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
            </SelectContent>
          </ShadSelect>
        )}
      />
      {selectedId === "general" || !habit ? (
        overview.length ? <HabitsOverviewChart data={overview} /> : <p className="py-8 text-center text-sm text-zinc-400">Todavía no hay datos suficientes.</p>
      ) : (
        <svg viewBox="0 0 320 150" className="h-52 w-full" role="img" aria-label={`Tracker de ${habit.name}`}>
          <text x="12" y="60" textAnchor="middle" transform="rotate(-90 12 60)" className="fill-zinc-400 text-[8px] uppercase tracking-wide">{metric}</text>
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <text x={originX - 8} y={baseline - tick + 3} textAnchor="end" className="fill-zinc-400 text-[7px]">{tick}</text>
              {tick > 0 && tick < 100 && <line x1={originX} x2={originX + plotWidth} y1={baseline - tick} y2={baseline - tick} stroke="currentColor" strokeOpacity=".12" strokeDasharray="3 4" />}
            </g>
          ))}
          <line x1={originX} x2={originX} y1="10" y2={baseline} stroke="currentColor" strokeOpacity=".25" />
          <line x1={originX} x2={originX + plotWidth} y1={baseline} y2={baseline} stroke="currentColor" strokeOpacity=".25" />
          <polyline points={points} fill="none" stroke="#84cc16" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((value, index) => {
            const previous = values[index - 1];
            const trend = index === 0 ? "Punto inicial" : value > previous ? "Mejoraste" : value < previous ? "Empeoraste" : "Sin cambios";
            return <circle key={index} cx={pointX(index)} cy={baseline - value} r="4" fill="#84cc16"><title>Día {dayNumbers[index]}: {value}% · {trend}</title></circle>;
          })}
          {values.map((value, index) => (index % Math.ceil(values.length / 10 || 1) === 0 || index === values.length - 1) && (
            <text key={`d-${index}`} x={pointX(index)} y={baseline + 14} textAnchor="middle" className="fill-zinc-400 text-[7px]">{dayNumbers[index]}</text>
          ))}
          <text x={originX + plotWidth / 2} y="145" textAnchor="middle" className="fill-zinc-400 text-[8px] uppercase tracking-wide">Día</text>
        </svg>
      )}
    </Card>
  );
}
