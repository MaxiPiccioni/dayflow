"use client";

import { useState } from "react";
import { AlgebraRow } from "@/components/aga/algebra-row";
import { HtmlText } from "@/components/aga/html-text";
import { useDarkMode } from "@/components/aga/use-dark-mode";
import { PALETTE, exerciseTitle, plotted } from "@/lib/aga/scene";

const SYNTAX = `u = (2, 3)        vector (minúscula)
A = (1, 2)        punto (mayúscula)
v = Vector(A, B)  vector de A a B
w = 2u - 3v       combinación
n = |v|           norma (módulo)
Unitario(v)       versor
cos(45°)  √2  3/4  v/|v|
Trasladar(v, A)   mismo vector con origen A
Extremo(v)        punto final
Suma(v)  Comp(v,i)  Rango(u,v,…)
CL(v, a1, a2…)    ¿v es comb. lineal?
Dependencia(u,v)  ¿LI o LD?`;

// Panel izquierdo: el enunciado con sus incisos, la vista algebraica (una fila por orden) y la entrada de órdenes.
export function ExercisePanel({ session }) {
  const { ex, item, itemIndex, objs, scene, sel, editing, mat } = session;
  const dark = useDarkMode();
  const [error, setError] = useState("");
  const colors = new Map(plotted(objs, scene, dark ? PALETTE.dark : PALETTE.light).map(({ o, color }) => [o.name, color]));

  const submit = (event) => {
    if (event.key !== "Enter") return;
    const text = event.target.value.trim();
    if (!text) return;
    const message = session.addCommand(text);
    setError(message ?? "");
    if (!message) event.target.value = "";
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
        <div className="text-[11.5px] text-zinc-500">{ex.kind === "ej" ? "Ejemplo del apunte" : "Ejercicio para resolver"} · <span className="rounded-full border border-zinc-200 px-2 font-mono text-[10.5px] dark:border-zinc-700">{ex.tag}</span></div>
        <h2 className="text-sm font-bold [text-wrap:balance]">{exerciseTitle(ex)} — {ex.title}</h2>
        <p className="text-[12.5px]"><HtmlText html={ex.text} /></p>
        {ex.items.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Incisos">
            {ex.items.map((it, i) => (
              <button key={i} type="button" aria-pressed={i === itemIndex} onClick={() => { setError(""); session.openItem(i); }} className={`rounded-md border px-2.5 py-0.5 font-mono text-xs ${i === itemIndex ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"}`}>{it.l || String(i + 1)}</button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-800">
        Vista algebraica
        <span className="flex-1" />
        <button type="button" onClick={() => { setError(""); session.reset(); }} title="Volver al estado inicial del ejercicio" className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium hover:border-lime-500 dark:border-zinc-700">Restablecer</button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto" aria-label="Objetos del ejercicio">
        {objs.length === 0 && <p className="px-3 py-2 text-[11px] text-zinc-500">Sin objetos. Escribí una orden abajo, por ejemplo: u = (2, 3)</p>}
        {objs.map((o) => (
          <AlgebraRow
            key={o.idx}
            obj={o}
            color={o.aux ? "#71717a" : colors.get(o.name) ?? "currentColor"}
            drawable={colors.has(o.name)}
            visible={session.opt(o.name).vis}
            selected={sel === o.name}
            editing={editing === o.idx}
            dec={!!item.dec}
            onSelect={() => o.name !== "?" && session.select(o.name, !mat)}
            onToggle={() => session.setOpt(o.name, { vis: !session.opt(o.name).vis })}
            onDelete={() => session.deleteRow(o.idx)}
            onEdit={() => session.setEditing(o.idx)}
            onCommit={(value) => session.commitEdit(o.idx, value)}
            onCancel={() => session.setEditing(null)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1 border-t border-zinc-200 p-2.5 dark:border-zinc-800">
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Entrada: w = u + 2v"
          aria-label="Entrada algebraica"
          onKeyDown={submit}
          className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 font-mono text-[12.5px] dark:border-zinc-700 dark:bg-zinc-950"
        />
        <div role="status" className="min-h-4 text-[11.5px] text-red-500">{error}</div>
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold">Sintaxis de entrada</summary>
          <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-zinc-500">{SYNTAX}</pre>
        </details>
      </div>
    </>
  );
}
