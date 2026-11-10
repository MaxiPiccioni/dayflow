import { MatrixTable } from "@/components/aga/matrix-table";
import { fmtNum } from "@/lib/aga/engine";

export function MatCard({ title, children }) {
  return (
    <section className="mb-3 min-w-0 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

export const hint = "text-[11px] text-zinc-500";

// Los pasos de Gauss-Jordan, una tarjeta por operación elemental, con la columna de control (CC) si la hay.
export function Steps({ g, kind, name }) {
  const n = g.steps[0].M.length;
  return (
    <>
      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        {g.steps.map((s, i) => {
          const ccOk = g.cc ? s.M.every((r) => Math.abs(r.slice(0, g.ncol).reduce((a, x) => a + x, 0) - r[g.ncol]) < 1e-9) : null;
          return (
            <div key={i} className="min-w-0 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-[12.5px] font-semibold text-lime-700 dark:text-lime-400">{s.op}</span>
                {s.why && <span className="text-[11.5px] text-zinc-500">{s.why}</span>}
                {ccOk !== null && <span className={`ml-auto font-mono text-[10.5px] font-semibold ${ccOk ? "text-emerald-600" : "text-red-500"}`}>CC {ccOk ? "✓" : "✗"}</span>}
              </div>
              <MatrixTable d={s.M} split={g.split} cc={g.cc} />
            </div>
          );
        })}
      </div>
      {kind === "rref" && <p className="mt-2.5 text-[12.5px]">Matriz reducida por filas. Rango = número de filas no nulas = <b>{g.piv.length}</b>.</p>}
      {kind === "inv" && (g.piv.length < n
        ? <p className="mt-2.5 text-[12.5px] text-red-500">Aparece una fila nula en el bloque de A (rango {g.piv.length} &lt; {n}): <b>la matriz no es inversible</b>.</p>
        : <p className="mt-2.5 text-[12.5px]">A la izquierda quedó la identidad: <b>A⁻¹</b> es el bloque derecho.</p>)}
      {kind === "p" && <p className="mt-2.5 text-[12.5px]">El bloque derecho es <b>P</b> y cumple P·{name} = reducida por filas.</p>}
    </>
  );
}

