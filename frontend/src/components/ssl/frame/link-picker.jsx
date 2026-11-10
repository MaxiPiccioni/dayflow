"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SymbolField } from "@/components/ssl/symbol-field";
import { LABEL_HELP, LABEL_PLACEHOLDER, parseLabel } from "@/lib/ssl/machines/labels";
import { addTransition, addTransitions, isFa } from "@/lib/ssl/machines/model";
import { LAMBDA } from "@/lib/ssl/notation";

const chip = (on) => `min-w-9 rounded-lg border px-2.5 py-1.5 font-mono text-sm font-semibold ${on ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 hover:border-lime-500 dark:border-zinc-700"} disabled:opacity-40`;
const button = "flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-medium";

// Cuadro que aparece al unir dos estados: en los autómatas finitos se eligen los símbolos del alfabeto (con un toque) y en
// las demás máquinas se escribe la etiqueta (entrada, tope / apila — lee / escribe, movimiento).
export function LinkPicker({ machine, from, to, onApply, onCancel }) {
  const fa = isFa(machine);
  const [picked, setPicked] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const symbols = [...machine.alphabet, ...(machine.type === "afnd" ? [LAMBDA] : [])];
  const existing = new Set(machine.transitions.filter((t) => t.from === from && t.to === to).map((t) => t.symbol || LAMBDA));
  const toggle = (symbol) => setPicked((current) => (current.includes(symbol) ? current.filter((s) => s !== symbol) : [...current, symbol]));

  const submit = (event) => {
    event?.preventDefault();
    let result;
    if (fa) {
      const typed = text.trim() ? parseLabel(machine, text) : { symbols: [] };
      if (typed.error) return setError(typed.error);
      const all = [...new Set([...picked.map((s) => (s === LAMBDA ? "" : s)), ...typed.symbols])];
      if (!all.length) return setError("Elegí al menos un símbolo.");
      result = addTransitions(machine, from, to, all);
    } else {
      const parsed = parseLabel(machine, text);
      if (parsed.error) return setError(parsed.error);
      result = addTransition(machine, { from, to, ...parsed.fields });
    }
    const message = onApply(result);
    if (message) setError(message);
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onCancel(); } }}
      role="group"
      aria-label={`Nueva transición de ${from} a ${to}`}
      className="absolute inset-x-2 bottom-2 z-20 mx-auto max-w-sm space-y-2.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold"><span className="font-mono">{from}</span> → <span className="font-mono">{to}</span></p>
        <button type="button" onClick={onCancel} aria-label="Cancelar" className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={16} aria-hidden="true" /></button>
      </div>

      {fa && symbols.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-zinc-500">Elegí con qué símbolos se pasa de {from} a {to}:</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Símbolos de la transición">
            {symbols.map((symbol) => (
              <button key={symbol} type="button" disabled={existing.has(symbol)} aria-pressed={picked.includes(symbol)} title={existing.has(symbol) ? "Ya existe esta transición" : undefined} onClick={() => toggle(symbol)} className={chip(picked.includes(symbol))}>{symbol}</button>
            ))}
          </div>
        </div>
      )}

      <SymbolField
        label={fa ? (symbols.length ? "Otros símbolos (opcional)" : "Símbolos (separados por coma)") : "Etiqueta"}
        value={text}
        onChange={(value) => { setText(value); setError(""); }}
        onEnter={submit}
        placeholder={LABEL_PLACEHOLDER[machine.type]}
        hint={fa ? undefined : LABEL_HELP[machine.type]}
      />

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={`${button} border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950`}><Plus size={14} aria-hidden="true" /> Agregar</button>
        <button type="button" onClick={onCancel} className={`${button} border-zinc-200 dark:border-zinc-700`}>Cancelar</button>
      </div>
    </form>
  );
}
