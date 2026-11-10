"use client";

import { HtmlText } from "@/components/aga/html-text";
import { PropertiesPanel } from "@/components/aga/properties-panel";
import { checkItem } from "@/lib/aga/scene";

const heading = "mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500";
const box = "rounded-xl border bg-zinc-50 px-2.5 py-2 text-[12.5px] [overflow-wrap:anywhere] dark:bg-zinc-950";
const WORKING = "Resolvé a mano y probá tus resultados escribiendo las órdenes en la entrada algebraica. Los objetos ya cargados muestran el planteo del ejercicio.";

function Resolution({ session }) {
  const { ex, item, objs, revealed } = session;
  const example = ex.kind === "ej";
  const open = example || revealed;
  const results = open && item.expect ? checkItem(item, objs) : null;
  return (
    <>
      <div>
        <h3 className={heading}>{example ? "Resolución del apunte" : "Cómo trabajar este ejercicio"}</h3>
        <div className={`${box} border-zinc-200 dark:border-zinc-800`}>
          <HtmlText html={item.sol || (example ? "" : WORKING)} />
        </div>
      </div>
      {!example && !open && <button type="button" onClick={session.reveal} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-950">Mostrar respuesta del apunte</button>}
      {!example && open && (
        <>
          <div>
            <h3 className={heading}>Respuesta del apunte</h3>
            <div className={`${box} border-lime-500`}><HtmlText html={item.ans || ""} /></div>
          </div>
          {item.note && <div className="rounded-xl border border-amber-500 px-2.5 py-2 text-xs"><b>Observación.</b> <HtmlText html={item.note} /></div>}
        </>
      )}
      {results && (
        <div>
          <h3 className={heading}>Comprobación con la app</h3>
          <div className={`${box} border-zinc-200 dark:border-zinc-800`}>
            {results.map((r) => (
              <div key={r.name} className="flex items-baseline gap-1.5 py-0.5 font-mono text-[11.5px] [overflow-wrap:anywhere]">
                <span className={`font-bold ${r.ok ? "text-emerald-600" : "text-red-500"}`}>{r.ok ? "✓" : "✗"}</span>
                <span>{r.name} = {r.shown}{r.ok ? "" : ` (esperado ${r.expected})`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Panel derecho: la resolución del apunte con la comprobación (pestaña 1) y las propiedades del objeto elegido (pestaña 2).
export function ResolutionPanel({ session }) {
  const { tab, setTab } = session;
  return (
    <>
      <div role="tablist" aria-label="Panel de resolución" className="flex border-b border-zinc-200 dark:border-zinc-800">
        {[["sol", "Resolución"], ["prop", "Propiedades"]].map(([id, text]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 border-b-2 px-2 py-2.5 text-xs font-semibold ${tab === id ? "border-lime-600 text-zinc-950 dark:border-lime-400 dark:text-zinc-50" : "border-transparent text-zinc-500"}`}>{text}</button>
        ))}
      </div>
      <div role="tabpanel" className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
        {tab === "sol" ? <Resolution session={session} /> : <PropertiesPanel session={session} />}
      </div>
    </>
  );
}
