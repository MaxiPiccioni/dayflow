import { useMemo, useState } from "react";
import { StaticMachine } from "@/components/ssl/editor/static-machine";
import { StepReveal } from "@/components/ssl/step-reveal";
import { SymbolField } from "@/components/ssl/symbol-field";
import { TableView } from "@/components/ssl/editor/machine-editor";
import { determinize } from "@/lib/ssl/machines/convert";
import { minimizeMachine, thompson } from "@/lib/ssl/machines/constructions";
import { formalDefinition } from "@/lib/ssl/machines/model";

// Expresión regular → AFND (Thompson) → AFD (Teorema 2, caso 2) → AFD mínimo.
export function ThompsonTool({ tool }) {
  const [regex, setRegex] = useState(tool.regex);
  const built = useMemo(() => {
    const t = thompson(regex);
    if (t.error) return { error: t.error };
    try {
      const conv = determinize(t.machine);
      return { t, conv, min: minimizeMachine(conv.dfa) };
    } catch (err) {
      return { error: err.message };
    }
  }, [regex]);

  return (
    <div className="space-y-4">
      <SymbolField label="Expresión regular (+ es la unión)" value={regex} onChange={setRegex} placeholder="(11+0)*" />
      {built.error ? <p role="alert" className="text-sm text-red-600">{built.error}</p> : (
        <>
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-500">a) Construcción de Thompson</p>
            <StepReveal key={regex} steps={built.t.steps.map((text, i) => ({ title: `Parte ${i + 1}`, text }))} />
            <p className="mt-2 break-words font-mono text-xs">{formalDefinition(built.t.machine)}</p>
            <StaticMachine machine={built.t.machine} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-zinc-500">b) AFD equivalente (con T* y las transiciones λ explícitas)</p>
            <StepReveal key={`${regex}-conv`} steps={built.conv.steps} />
            <TableView machine={built.conv.dfa} />
            <StaticMachine machine={built.conv.dfa} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-zinc-500">c) AFD mínimo ({built.min.machine.states.length} estados)</p>
            <StepReveal key={`${regex}-min`} steps={built.min.steps.map((text, i) => ({ title: i === 0 ? "Estados no conexos" : "Conjuntos cocientes", text }))} />
            <TableView machine={built.min.machine} />
            <StaticMachine machine={built.min.machine} />
          </div>
        </>
      )}
    </div>
  );
}
