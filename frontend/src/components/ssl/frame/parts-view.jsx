"use client";

import { Info, PencilRuler, Wrench } from "lucide-react";
import { AnswerBox } from "@/components/ssl/answer-box";
import { MathText } from "@/components/ssl/math-text";

const pick = (active) => `flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${active ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 text-zinc-600 hover:border-lime-500 dark:border-zinc-700 dark:text-zinc-300"}`;

// Todos los apartados (a, b, c…) de un ejercicio, uno debajo del otro, cada uno con su enunciado y su campo de respuesta.
// Los apartados con autómata o herramienta propia tienen un botón para trabajarlos en el área central.
export function PartsView({ exercise, parts, activeIndex, answers, onAnswer, onPart }) {
  const multiple = parts.length > 1;
  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        const checks = part.checks ?? [];
        const own = part.machine ? { Icon: PencilRuler, label: "Dibujar acá" } : part.tool && multiple ? { Icon: Wrench, label: "Usar la herramienta" } : null;
        return (
          <section key={part.id || i} aria-label={part.id ? `Apartado ${part.id}` : "Respuesta"} className={multiple ? "space-y-2.5 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800" : "space-y-2.5"}>
            {multiple && (
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-medium">
                  {part.id && <span className="mr-1.5 font-semibold text-lime-700 dark:text-lime-400">{part.id})</span>}
                  {part.prompt && <MathText text={part.prompt} className="font-mono" />}
                </p>
                {own && <button type="button" aria-pressed={i === activeIndex} onClick={() => onPart(i)} className={pick(i === activeIndex)}><own.Icon size={13} aria-hidden="true" /> {own.label}</button>}
              </div>
            )}
            {part.note && <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{part.note}</span></p>}
            {checks.map((check) => {
              const key = `${exercise.id}.${part.id}.${check.id}`;
              return <AnswerBox key={key} check={check} value={answers[key] ?? ""} onChange={(text) => onAnswer(key, text)} />;
            })}
            {checks.length === 0 && <p className="text-xs text-zinc-500">{part.machine ? "Este apartado se resuelve dibujando el autómata en el lienzo." : "Este apartado no tiene comprobación automática: resolvelo en papel y comparalo con la solución."}</p>}
          </section>
        );
      })}
    </div>
  );
}
