import { useId, useState } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import { DfaTool } from "@/components/ssl/tools/dfa-tool";
import { FormulaTool } from "@/components/ssl/tools/formula-tool";
import { GrammarTool } from "@/components/ssl/tools/grammar-tool";
import { LangOpsTool } from "@/components/ssl/tools/langops-tool";
import { RegexTool } from "@/components/ssl/tools/regex-tool";
import { StringsTool } from "@/components/ssl/tools/strings-tool";
import { TransformTool } from "@/components/ssl/tools/transform-tool";

const TOOLS = {
  strings: { title: "Calculadora de cadenas", Component: StringsTool },
  formula: { title: "Enumerador de lenguajes", Component: FormulaTool },
  langops: { title: "Operaciones entre lenguajes", Component: LangOpsTool },
  grammar: { title: "Laboratorio de gramáticas", Component: GrammarTool },
  transform: { title: "Transformaciones de gramáticas", Component: TransformTool },
  regex: { title: "Probador de expresiones regulares", Component: RegexTool },
  dfa: { title: "Minimización de AFD", Component: DfaTool },
};

// Panel desplegable que contiene la herramienta interactiva de un ejercicio.
export function ToolPanel({ tool, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const entry = TOOLS[tool?.type];
  if (!entry) return null;
  const { title, Component } = entry;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={panelId} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium">
        <span className="flex items-center gap-2"><Wrench size={15} className="text-lime-600 dark:text-lime-400" aria-hidden="true" /> {title}</span>
        <ChevronDown size={16} aria-hidden="true" className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id={panelId} className="border-t border-zinc-200 p-3 dark:border-zinc-800"><Component tool={tool} /></div>}
    </div>
  );
}
