import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ExampleCard } from "@/components/ssl/example-card";
import { ExerciseCard } from "@/components/ssl/exercise-card";
import { MathText } from "@/components/ssl/math-text";
import { ToolPanel } from "@/components/ssl/tools/tool-panel";
import { countDone } from "@/lib/ssl/progress";

const navButton = "flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";
const chip = (active, done) => `relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : done ? "bg-lime-100 text-lime-900 hover:bg-lime-200 dark:bg-lime-400/15 dark:text-lime-300" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`;

// Una sección de ejercicios: contexto, ejemplo resuelto y los ejercicios de a uno con Anterior/Siguiente.
export function SectionView({ section, store }) {
  const { progress, setAnswer, setDone, setUi } = store;
  const exercises = section.exercises;
  const stored = Number(progress.ui[`${section.id}.ex`]);
  const index = Number.isInteger(stored) && stored >= 0 && stored < exercises.length ? stored : 0;
  const exercise = exercises[index];
  const go = (next) => setUi(`${section.id}.ex`, Math.min(Math.max(next, 0), exercises.length - 1));
  const doneCount = countDone(progress, exercises.map((e) => e.id));

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <p className="text-xs text-zinc-500">Ejercicios {section.exerciseRange} · {doneCount} de {exercises.length} hechos</p>
        </div>
        <MathText text={section.context} className="block text-sm leading-relaxed text-zinc-600 dark:text-zinc-300" />
        {section.tool && <ToolPanel key={section.id} tool={section.tool} />}
      </Card>

      <ExampleCard key={section.id} example={section.example} />

      <Card className="space-y-4">
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex w-max gap-2" role="group" aria-label="Ejercicios de la sección">
            {exercises.map((item, i) => (
              <button key={item.id} type="button" onClick={() => go(i)} aria-pressed={i === index} aria-label={`Ejercicio ${item.number}${progress.done[item.id] ? ", hecho" : ""}`} className={chip(i === index, !!progress.done[item.id])}>
                {progress.done[item.id] && <Check size={11} className="mr-0.5 inline" aria-hidden="true" />}{item.number}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={navButton}><ChevronLeft size={15} aria-hidden="true" /> Anterior</button>
          <p className="text-xs text-zinc-500" aria-live="polite">{index + 1} de {exercises.length}</p>
          <button type="button" onClick={() => go(index + 1)} disabled={index === exercises.length - 1} className={navButton}>Siguiente <ChevronRight size={15} aria-hidden="true" /></button>
        </div>
      </Card>

      <ExerciseCard key={exercise.id} exercise={exercise} progress={progress} onAnswer={setAnswer} onToggleDone={setDone} />

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={navButton}><ChevronLeft size={15} aria-hidden="true" /> Anterior</button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === exercises.length - 1} className={navButton}>Siguiente <ChevronRight size={15} aria-hidden="true" /></button>
      </div>
    </div>
  );
}
