"use client";

import { HtmlText } from "@/components/aga/html-text";
import { exerciseTitle } from "@/lib/aga/scene";

// Enunciado del ejercicio con sus incisos.
export function ExerciseHeader({ session }) {
  const { ex, itemIndex } = session;

  return (
    <div className="flex shrink-0 flex-col gap-1.5 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
      <div className="text-[11.5px] text-zinc-500">{ex.kind === "ej" ? "Ejemplo del apunte" : "Ejercicio para resolver"} · <span className="rounded-full border border-zinc-200 px-2 font-mono text-[10.5px] dark:border-zinc-700">{ex.tag}</span></div>
      <h2 className="text-sm font-bold [text-wrap:balance]">{exerciseTitle(ex)} — {ex.title}</h2>
      <p className="text-[12.5px]"><HtmlText html={ex.text} /></p>
      {ex.items.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Incisos">
          {ex.items.map((it, i) => (
            <button key={i} type="button" aria-pressed={i === itemIndex} onClick={() => session.openItem(i)} className={`rounded-md border px-2.5 py-0.5 font-mono text-xs ${i === itemIndex ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"}`}>{it.l || String(i + 1)}</button>
          ))}
        </div>
      )}
    </div>
  );
}
