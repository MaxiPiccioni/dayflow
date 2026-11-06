import { Card } from "@/components/ui/card";

// Segundos -> "2 h 05 min" / "35 min" / "0 min".
export function formatStudyTime(totalSeconds) {
  const minutes = Math.floor((totalSeconds || 0) / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${String(minutes % 60).padStart(2, "0")} min` : `${minutes} min`;
}

// Tiempo de estudio (Pomodoro) y tareas pendientes de una materia. `study` puede ser undefined si todavía no hay datos.
export function StudySummary({ study }) {
  const items = [
    ["Esta semana", formatStudyTime(study?.week_seconds)],
    ["Total", formatStudyTime(study?.total_seconds)],
    ["Tareas pendientes", String(study?.pending_tasks ?? 0)],
  ];
  return (
    <Card>
      <p className="text-sm font-semibold">Estudio</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <p className="text-lg font-semibold leading-tight">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-400">Elegí esta materia en el Pomodoro o en una tarea para que sume acá.</p>
    </Card>
  );
}
