"use client";

import { ToolPanel } from "@/components/ssl/tools/tool-panel";

// Calculadoras del panel derecho: una fila para elegir la herramienta y, abajo, la herramienta elegida.
export function ToolsView({ tools, active, onPick, config, resetKey }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Calculadoras y herramientas">
        {tools.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={active === id}
            onClick={() => onPick(active === id ? null : id)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${active === id ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 text-zinc-600 hover:border-lime-500 dark:border-zinc-700 dark:text-zinc-300"}`}
          >
            <Icon size={14} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {config
        ? <ToolPanel key={`${resetKey}.${config.type}`} tool={config} defaultOpen />
        : <p className="text-sm text-zinc-500">Elegí una calculadora para usarla mientras resolvés el ejercicio.</p>}
    </div>
  );
}
