import { useMemo, useState } from "react";
import { StepReveal } from "@/components/ssl/step-reveal";
import { TransitionTable } from "@/components/ssl/transition-table";
import { equivalent, minimize } from "@/lib/ssl/automata";

// Minimización de AFD dados por tabla: elimina los estados no conexos, arma los conjuntos cocientes
// y compara los autómatas mínimos. No dibuja autómatas (eso es del editor de la próxima etapa).
export function DfaTool({ tool }) {
  const [picked, setPicked] = useState(0);
  const tables = tool.tables;
  const table = tables[picked];
  const result = useMemo(() => minimize(table), [table]);
  const pairs = useMemo(() => {
    const out = [];
    for (let i = 0; i < tables.length; i++) for (let j = i + 1; j < tables.length; j++) out.push({ a: tables[i], b: tables[j], ...equivalent(tables[i], tables[j]) });
    return out;
  }, [tables]);

  return (
    <div className="space-y-4">
      {tables.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir autómata">
          {tables.map((t, index) => (
            <button key={t.name} type="button" onClick={() => setPicked(index)} aria-pressed={picked === index} className={`rounded-full px-3 py-1.5 text-xs font-medium ${picked === index ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>{t.name}</button>
          ))}
        </div>
      )}
      <TransitionTable table={table} />
      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-500">Minimización de {table.name}</p>
        <StepReveal key={table.name} steps={result.steps.map((text, index) => ({ title: index === 0 ? "Estados no conexos" : index === result.steps.length - 1 ? "Resultado" : "Conjuntos cocientes", text }))} />
      </div>
      <TransitionTable table={result.minimal} caption={`AFD mínimo de ${table.name}`} />
      {pairs.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-zinc-500">Equivalencia entre autómatas (comparando los mínimos)</p>
          <ul className="space-y-0.5 text-sm">
            {pairs.map(({ a, b, equal, reason }) => (
              <li key={`${a.name}${b.name}`}><span className="font-mono">{a.name} y {b.name}</span>: <span className={equal ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-red-600"}>{equal ? "equivalentes" : "no equivalentes"}</span> <span className="text-zinc-400">({reason})</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
