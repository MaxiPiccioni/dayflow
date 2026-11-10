"use client";

import { AlertTriangle, Info } from "lucide-react";
import { PartsView } from "@/components/ssl/frame/parts-view";
import { MathText } from "@/components/ssl/math-text";
import { StepReveal } from "@/components/ssl/step-reveal";
import { TransitionTable } from "@/components/ssl/transition-table";

const noteClass = "flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-300";
const statementClass = "block text-lg font-bold leading-snug text-zinc-950 dark:text-zinc-50";

// Datos de la sección (alfabetos, cadenas dadas…). Si es corto se ve abierto; si es una explicación larga, plegado.
function SectionData({ text }) {
  if (!text) return null;
  return (
    <details open={text.length <= 320} className="rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Datos de la sección</summary>
      <MathText text={text} className="mt-2 block text-base font-medium leading-relaxed" />
    </details>
  );
}

// Centro del sandbox para los ejercicios sin autómata: el enunciado, los datos, las aclaraciones y todos los apartados (a, b,
// c…) con su campo de respuesta. Las calculadoras y las ayudas están en el panel de la derecha.
export function ExerciseDesk({ item, parts, partIndex, answers, onAnswer, onPart }) {
  const frame = "min-h-0 flex-1 overflow-y-auto p-3 pt-12 md:p-5 md:pt-12";

  if (item.kind === "example") {
    const { example, section } = item;
    return (
      <div className={frame}>
        <div className="mx-auto max-w-3xl space-y-4">
          <MathText text={example.statement} className={statementClass} />
          <SectionData text={example.context ?? section.context} />
          <StepReveal steps={example.steps} />
          {example.tables && <div className="flex flex-wrap gap-3">{example.tables.map((table) => <TransitionTable key={table.name} table={table} />)}</div>}
        </div>
      </div>
    );
  }

  const { exercise, section } = item;
  // Algunos ejercicios de un solo apartado guardan el enunciado en el apartado y no en el ejercicio.
  const statement = exercise.statement?.trim() || (parts.length === 1 ? parts[0].prompt : "");
  const promptShown = !exercise.statement?.trim() && parts.length === 1;
  const single = parts.length === 1 && !promptShown && parts[0].prompt;
  return (
    <div className={frame}>
      <div className="mx-auto max-w-3xl space-y-4">
        <MathText text={statement} className={statementClass} />
        <SectionData text={section.context} />
        {exercise.tables && <div className="flex flex-wrap gap-4">{exercise.tables.map((table) => <TransitionTable key={table.name} table={table} />)}</div>}
        {exercise.figure && <p className="text-sm text-zinc-500">El enunciado incluye una figura: {exercise.figure}.</p>}
        {exercise.dubious && <p className={noteClass}><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{exercise.dubious}</span></p>}
        {exercise.note && <p className={noteClass}><Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{exercise.note}</span></p>}
        {single && <p className="text-base font-semibold"><MathText text={parts[0].prompt} className="font-mono" /></p>}
        <PartsView exercise={exercise} parts={parts} activeIndex={partIndex} answers={answers} onAnswer={onAnswer} onPart={onPart} />
      </div>
    </div>
  );
}
