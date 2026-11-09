import { useMemo, useState } from "react";
import { StaticMachine } from "@/components/ssl/editor/static-machine";
import { StepReveal } from "@/components/ssl/step-reveal";
import { TableView } from "@/components/ssl/editor/machine-editor";
import { determinize } from "@/lib/ssl/machines/convert";
import { formalDefinition } from "@/lib/ssl/machines/model";

// Conversión de un AFND a un AFD paso a paso (Teorema 2, caso 1 si no hay transiciones λ y caso 2 si las hay).
export function ConvertTool({ tool }) {
  const [includeEmpty, setIncludeEmpty] = useState(true);
  const nfa = tool.machine;
  const result = useMemo(() => {
    try { return { value: determinize(nfa, { includeEmpty }) }; } catch (err) { return { error: err.message }; }
  }, [nfa, includeEmpty]);

  if (result.error) return <p role="alert" className="text-sm text-red-600">{result.error}</p>;
  const { dfa, steps, mapping, caso } = result.value;
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-500">AFND de partida: {formalDefinition(nfa)}</p>
        <TableView machine={nfa} />
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-500">
        <input type="checkbox" checked={includeEmpty} onChange={(event) => setIncludeEmpty(event.target.checked)} className="h-4 w-4 accent-lime-600" />
        Mostrar el conjunto vacío como un estado sumidero (como en las tablas 4.29 y 4.32 de la guía)
      </label>
      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-500">Procedimiento (Teorema 2, caso {caso})</p>
        <StepReveal key={`${nfa.name}${includeEmpty}`} steps={steps} />
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-500">Estados del AFD = conjuntos de estados del AFND</p>
        <ul className="grid gap-x-4 gap-y-0.5 font-mono text-sm sm:grid-cols-2">{mapping.map((m) => <li key={m.name}>{m.name} = {`{${m.set.join(", ")}}`}</li>)}</ul>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-500">AFD equivalente: {formalDefinition(dfa)}</p>
        <TableView machine={dfa} />
      </div>
      <StaticMachine machine={dfa} />
    </div>
  );
}
