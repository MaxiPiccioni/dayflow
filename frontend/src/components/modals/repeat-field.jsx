"use client";

import { Switch } from "@/components/ui/switch";

const WEEKDAY_REPEAT_OPTIONS = [["mon", "L"], ["tue", "M"], ["wed", "X"], ["thu", "J"], ["fri", "V"], ["sat", "S"], ["sun", "D"]];

// "Repetir" de las tareas y eventos nuevos: interruptor y días de la semana.
export function RepeatField({ enabled, setEnabled, days, setDays }) {
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
