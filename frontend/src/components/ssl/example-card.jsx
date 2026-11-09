import { useState } from "react";
import { BookOpenCheck, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MathText } from "@/components/ssl/math-text";
import { MachineWorkbench } from "@/components/ssl/editor/machine-workbench";
import { StepReveal } from "@/components/ssl/step-reveal";
import { TransitionTable } from "@/components/ssl/transition-table";

// Ejemplo resuelto de la guía, paso a paso. Cada sección arranca con el suyo.
export function ExampleCard({ example }) {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 text-left">
        <span>
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-lime-700 dark:text-lime-400"><BookOpenCheck size={14} aria-hidden="true" /> Ejemplo resuelto · guía pág. {example.page}</span>
          <span className="mt-1 block text-base font-semibold text-zinc-950 dark:text-zinc-100">{example.title}</span>
        </span>
        <ChevronDown size={18} aria-hidden="true" className={`mt-1 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50"><MathText text={example.statement} className="block leading-relaxed" /></div>
          {example.tables && <div className="flex flex-wrap gap-4">{example.tables.map((table) => <TransitionTable key={table.name} table={table} />)}</div>}
          <StepReveal steps={example.steps} />
          {example.machine && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500">Probalo: el autómata del ejemplo en el editor (para ejecutarlo con tus cadenas)</p>
              <MachineWorkbench config={{ ...example.machine, readOnly: true, spec: null, reference: null }} exerciseKey={`ejemplo.${example.title}`} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
