import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnswerBox } from "@/components/ssl/answer-box";
import { MathText } from "@/components/ssl/math-text";
import { TransitionTable } from "@/components/ssl/transition-table";
import { MachineWorkbench } from "@/components/ssl/editor/machine-workbench";
import { ToolPanel } from "@/components/ssl/tools/tool-panel";

const noteClass = "flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-300";

// Un ejercicio: enunciado, herramienta, respuestas por inciso, "Ver solución" y la marca de hecho.
export function ExerciseCard({ exercise, progress, onAnswer, onToggleDone }) {
  const [showSolution, setShowSolution] = useState(false);
  const done = !!progress.done[exercise.id];
  const partTools = exercise.parts.filter((part) => part.tool).length;
  const sharedTool = exercise.tool && partTools === 0 ? exercise.tool : null;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Ejercicio {exercise.number}{exercise.id.startsWith("u2-a") ? " (Unidad 3 del libro)" : ""} · guía pág. {exercise.page}</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={done} onChange={(event) => onToggleDone(exercise.id, event.target.checked)} className="h-4 w-4 accent-lime-600" />
          Hecho
        </label>
      </div>

      <div className="rounded-xl bg-zinc-50 p-3 text-sm leading-relaxed dark:bg-zinc-800/50"><MathText text={exercise.statement} className="block" /></div>
      {exercise.tables && <div className="flex flex-wrap gap-4">{exercise.tables.map((table) => <TransitionTable key={table.name} table={table} />)}</div>}
      {exercise.figure && <p className="text-sm text-zinc-500">El enunciado incluye una figura: {exercise.figure}.</p>}
      {exercise.dubious && <p className={noteClass}><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{exercise.dubious}</span></p>}
      {exercise.note && <p className={noteClass}><Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{exercise.note}</span></p>}
      {sharedTool && <ToolPanel tool={sharedTool} defaultOpen />}
      {exercise.pending && <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700">Este ejercicio pide dibujar un autómata: se resolverá con el editor de autómatas (próxima etapa).</p>}

      <div className="space-y-5">
        {exercise.parts.map((part) => (
          <div key={part.id || "unica"} className="space-y-3">
            {part.prompt && (
              <p className="text-sm font-medium">
                {part.id && <span className="mr-1.5 font-semibold text-lime-700 dark:text-lime-400">{part.id})</span>}
                <MathText text={part.prompt} className="font-mono" />
              </p>
            )}
            {part.note && <p className={noteClass}><Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{part.note}</span></p>}
            {part.tool && <ToolPanel tool={part.tool} defaultOpen={exercise.parts.length === 1} />}
            {part.machine && (
              <MachineWorkbench
                key={`${exercise.id}.${part.id}`}
                config={part.machine}
                exerciseKey={`${exercise.id}.${part.id}`}
                savedJson={progress.answers[`${exercise.id}.${part.id}.machine`]}
                onSaveWorking={(json) => onAnswer(`${exercise.id}.${part.id}.machine`, json)}
              />
            )}
            {(part.checks ?? []).map((check) => {
              const key = `${exercise.id}.${part.id}.${check.id}`;
              return <AnswerBox key={key} check={check} value={progress.answers[key] ?? ""} onChange={(text) => onAnswer(key, text)} />;
            })}
          </div>
        ))}
      </div>

      <div>
        <button type="button" onClick={() => setShowSolution((value) => !value)} aria-expanded={showSolution} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium hover:border-lime-500 dark:border-zinc-700">
          {showSolution ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />} {showSolution ? "Ocultar solución" : "Ver solución"}
        </button>
        {showSolution && (
          <div className="mt-3 space-y-3 rounded-xl border border-lime-500/50 bg-lime-50/50 p-3 dark:bg-lime-400/5">
            <p className="text-xs font-semibold text-zinc-500">Solución de la guía{exercise.solutionPage ? ` · pág. ${exercise.solutionPage}` : ""}</p>
            {exercise.parts.map((part) => (
              <div key={part.id || "unica"} className="text-sm">
                {part.id && <p className="text-xs font-semibold text-lime-700 dark:text-lime-400">{part.id})</p>}
                <MathText text={part.solution ?? `Solución en la guía, pág. ${exercise.solutionPage ?? exercise.page}.`} className="block font-mono leading-relaxed" />
              </div>
            ))}
            {exercise.drawing && exercise.solutionPage && <p className="text-xs text-zinc-500">Los dibujos (árboles, grafos) están en la guía, pág. {exercise.solutionPage}.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}
