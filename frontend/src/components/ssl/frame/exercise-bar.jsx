"use client";

import { Check, ChevronLeft, ChevronRight, CircleCheckBig } from "lucide-react";
import { MathText } from "@/components/ssl/math-text";
import { TransitionTable } from "@/components/ssl/transition-table";
import { useSession } from "@/components/ssl/frame/session-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { itemLabel } from "@/lib/ssl/items";

const nav = "flex shrink-0 items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";
const primary = "flex shrink-0 items-center gap-1 rounded-xl border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:border-lime-500 disabled:opacity-40 dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950";

// Rectángulo del ejercicio: enunciado, partes (a, b, c…), aclaraciones y, a la derecha, Comprobar, Anterior, Siguiente,
// el índice y la marca de hecho.
export function ExerciseBar({ items, index, item, progress, onGo, onSetDone, partIndex, onPart, canCheck, onCheck }) {
  const session = useSession();
  const { kind } = item;
  const exercise = item.exercise;
  const parts = kind === "exercise" ? exercise.parts : [];
  const part = parts[partIndex];
  const notes = kind === "exercise" ? [exercise.dubious, exercise.note, part?.note, exercise.figure ? `El enunciado incluye una figura: ${exercise.figure}.` : ""].filter(Boolean) : [];
  const done = kind === "exercise" && !!progress.done[exercise.id];
  const statement = kind === "exercise" ? exercise.statement : item.example.statement;
  const heading = kind === "exercise" ? `Ejercicio n° ${exercise.number}:` : `Ejemplo resuelto: ${item.example.title.replace(/^Ejemplo resuelto:\s*/i, "")}`;

  const check = () => { session?.verify(); onCheck(); };

  return (
    <section aria-label="Ejercicio" className="shrink-0 border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="max-h-[20vh] min-w-0 flex-1 basis-80 md:max-h-[26vh] overflow-y-auto pr-1 text-sm leading-relaxed">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime-700 dark:text-lime-400">{heading}{kind === "exercise" && exercise.page ? <span className="ml-2 font-normal normal-case tracking-normal text-zinc-400">guía pág. {exercise.page}</span> : null}</p>
          <MathText text={statement} className="mt-0.5 block" />
          {kind === "exercise" && exercise.tables && <div className="mt-2 flex flex-wrap gap-3">{exercise.tables.map((table) => <TransitionTable key={table.name} table={table} />)}</div>}
          {parts.length > 1 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Incisos del ejercicio">
              {parts.map((p, i) => (
                <button key={p.id || i} type="button" aria-pressed={i === partIndex} onClick={() => onPart(i)} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === partIndex ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>{p.id || i + 1})</button>
              ))}
            </div>
          )}
          {part?.prompt && <p className="mt-2 font-medium">{part.id && <span className="mr-1 font-semibold text-lime-700 dark:text-lime-400">{part.id})</span>}<MathText text={part.prompt} className="font-mono" /></p>}
          {notes.length > 0 && (
            <details className="mt-1 text-xs text-amber-800 dark:text-amber-300">
              <summary className="cursor-pointer font-medium">Aclaraciones ({notes.length})</summary>
              <ul className="mt-1 list-disc space-y-1 pl-5">{notes.map((note) => <li key={note}>{note}</li>)}</ul>
            </details>
          )}
        </div>
        <div className="scrollbar-thin flex items-center gap-2 max-sm:w-full max-sm:overflow-x-auto max-sm:pb-1 sm:flex-wrap">
          <button type="button" onClick={check} disabled={!canCheck} title={canCheck ? "Comprobar" : "Este ejercicio no tiene comprobación automática"} className={primary}><Check size={15} aria-hidden="true" /> Comprobar</button>
          <button type="button" onClick={() => onGo(index - 1)} disabled={index === 0} className={nav} aria-label="Ejercicio anterior"><ChevronLeft size={15} aria-hidden="true" /><span className="max-sm:sr-only">Anterior</span></button>
          <button type="button" onClick={() => onGo(index + 1)} disabled={index === items.length - 1} className={nav} aria-label="Siguiente ejercicio"><span className="max-sm:sr-only">Siguiente</span><ChevronRight size={15} aria-hidden="true" /></button>
          <Select value={String(index)} onValueChange={(v) => onGo(Number(v))}>
            <SelectTrigger className="w-44 max-sm:w-28 max-sm:shrink-0" aria-label="Elegir ejercicio"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {items.map((entry, i) => <SelectItem key={entry.key} value={String(i)}>{progress.done[entry.exercise?.id] ? "✓ " : ""}{itemLabel(entry)}</SelectItem>)}
            </SelectContent>
          </Select>
          {kind === "exercise" && (
            <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium">
              <input type="checkbox" checked={done} onChange={(event) => onSetDone(exercise.id, event.target.checked)} className="h-4 w-4 accent-lime-600" />
              <CircleCheckBig size={14} className="text-lime-600" aria-hidden="true" /> Hecho
            </label>
          )}
        </div>
      </div>
    </section>
  );
}
