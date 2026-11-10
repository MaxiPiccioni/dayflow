"use client";

import { CircleCheckBig, Flag, Repeat2, ShieldAlert, X } from "lucide-react";
import { isFa, setInitial, toggleAccepting } from "@/lib/ssl/machines/model";
import { makeErrorState } from "@/lib/ssl/machines/complete";

const option = (on) => `flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-40 ${on ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 hover:border-lime-500 dark:border-zinc-700"}`;

// Cuadro que aparece al tocar un estado: lo marca como inicial, de aceptación o de error, o le agrega un bucle.
// (Tocarlo dos veces seguidas abre directamente el bucle.)
export function StatePicker({ machine, id, onApply, onLoop, onClose }) {
  const initial = machine.initial === id;
  const accepting = machine.accepting.includes(id);
  const fa = isFa(machine);

  return (
    <div
      role="group"
      aria-label={`Estado ${id}`}
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}
      className="absolute inset-x-2 bottom-2 z-20 mx-auto max-w-sm space-y-2.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Estado <span className="font-mono">{id}</span></p>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={16} aria-hidden="true" /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={initial} disabled={initial} title={initial ? "Ya es el estado inicial" : undefined} onClick={() => onApply(setInitial(machine, id))} className={option(initial)}><Flag size={15} aria-hidden="true" /> Inicial</button>
        <button type="button" aria-pressed={accepting} onClick={() => onApply(toggleAccepting(machine, id))} className={option(accepting)}><CircleCheckBig size={15} aria-hidden="true" /> De aceptación</button>
        <button type="button" disabled={!fa} title={fa ? "Sin aceptación y con un bucle por cada símbolo del alfabeto" : "Solo en autómatas finitos"} onClick={() => onApply(makeErrorState(machine, id))} className={option(false)}><ShieldAlert size={15} aria-hidden="true" /> De error</button>
        <button type="button" onClick={onLoop} className={option(false)}><Repeat2 size={15} aria-hidden="true" /> Bucle</button>
      </div>
    </div>
  );
}
