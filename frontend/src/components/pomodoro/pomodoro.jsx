"use client";

import { Settings2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { SubjectSearchSelect } from "@/components/subject-search-select";
import { inputClass } from "@/lib/faculty";
import { playClickSound } from "@/lib/sounds";

const SETTING_FIELDS = [["repetitions", "Repeticiones"], ["work", "Temporizador (min)"], ["breakTime", "Descanso (min)"]];

// Temporizador Pomodoro. El estado vive en el Provider de la app (hooks/use-pomodoro): acá solo se dibuja y se opera.
export function Pomodoro({ settings, setSettings, seconds, setSeconds, running, setRunning, phase, setPhase, history, compact = false, subjects = [], subjectId = "", onSubjectChange }) {
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const totalSeconds = Math.max((phase === "work" ? settings.work : settings.breakTime) * 60, 1);
  const reset = () => {
    setRunning(false);
    setPhase("work");
    setSeconds(settings.work * 60);
  };
  const toggleRunning = () => {
    playClickSound();
    if (!running && typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    setRunning(!running);
  };
  const update = (key, value) => {
    const parsed = Math.round(Number(value));
    const next = { ...settings, [key]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 };
    setSettings(next);
    if (!running) {
      if (key === "work" && phase === "work") setSeconds(next.work * 60);
      if (key === "breakTime" && phase === "break") setSeconds(next.breakTime * 60);
    }
  };
  return (
    <div className="space-y-5">
      <Card className="text-center">
        <CardHeader eyebrow={phase === "work" ? "Sesión de foco" : "Descanso"} title="Pomodoro" action={<button onClick={reset} className="text-xs text-zinc-400">Reiniciar</button>} />
        <div className="mx-auto mt-4 grid h-56 w-56 place-items-center rounded-full" style={{ background: `conic-gradient(${phase === "work" ? "#a3e635" : "#7dd3fc"} ${seconds / totalSeconds * 100}%, #e4e4e7 0)` }}>
          <div className="grid h-48 w-48 place-items-center rounded-full bg-white dark:bg-zinc-900"><p className="font-mono text-5xl font-semibold">{time}</p></div>
        </div>
        {subjects.length > 0 && onSubjectChange && (
          <div className="mx-auto mt-5 max-w-xs text-left">
            <SubjectSearchSelect label="Estudiando" value={subjectId} onChange={onSubjectChange} subjects={subjects} />
          </div>
        )}
        <button onClick={toggleRunning} className="mt-7 rounded-full bg-lime-300 px-7 py-3 text-sm font-semibold text-lime-950">{running ? "Pausar" : "Comenzar"}</button>
      </Card>
      {!compact && (
        <Card>
          <CardHeader eyebrow="Personaliza tu foco" title="Configuración" action={<Settings2 size={17} className="text-zinc-400" />} />
          <div className="grid gap-3 sm:grid-cols-3">
            {SETTING_FIELDS.map(([key, label]) => (
              <label key={key} className="text-xs text-zinc-500">
                {label}
                <input type="number" min="0" step="1" inputMode="numeric" value={settings[key]} onChange={(event) => update(key, event.target.value)} className={`${inputClass} mt-1`} />
              </label>
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold">Uso por día</p>
          <div className="mt-3 flex h-24 items-end gap-2">
            {history.map((item) => (
              <div key={item.day} className="group relative flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-lime-400" style={{ height: `${Math.max(4, item.minutes / 125 * 80)}px` }} />
                <span className="text-[10px] text-zinc-400">{item.day}</span>
                <span className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-zinc-900 px-2 py-1 text-[10px] text-white group-hover:block">{item.minutes} min</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
