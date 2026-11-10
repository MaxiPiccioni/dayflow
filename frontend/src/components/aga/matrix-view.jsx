import { MatCard, MatrixExplain } from "@/components/aga/matrix-steps";
import { MatrixTable } from "@/components/aga/matrix-table";
import { detOf, fmtNum, fmtVal, isM, rankM, tipoInfo } from "@/lib/aga/engine";

function MatrixFacts({ v }) {
  const m = v.d.length, n = v.d[0].length;
  const det = m === n ? detOf(v) : null;
  const rows = [["Orden", `${m}×${n}`], ["Tipo", tipoInfo(v)], ["Rango", String(rankM(v.d))]];
  if (det !== null) rows.push(["Traza", fmtNum(v.d.reduce((s, r, i) => s + r[i], 0))], ["Determinante", fmtNum(det)], ["Inversible", Math.abs(det) > 1e-9 ? "sí" : `no (rango menor que ${n})`]);
  return (
    <dl className="grid gap-x-2.5 gap-y-1 text-xs [grid-template-columns:auto_1fr]">
      {rows.map(([k, val]) => <div key={k} className="contents"><dt className="text-zinc-500">{k}</dt><dd className="break-words font-mono">{val}</dd></div>)}
    </dl>
  );
}

// Centro de la Unidad 2: el objeto elegido (matriz, número o error) con sus propiedades y la resolución paso a paso.
export function MatrixView({ obj, objs, dec }) {
  if (!obj) return <div className="min-h-0 flex-1 overflow-auto p-3.5"><p className="text-[11px] text-zinc-500">Seleccioná un objeto de la vista algebraica para ver su resolución.</p></div>;
  const f = !obj.err && !isM(obj.v) ? fmtVal(obj.v, dec) : null;
  return (
    <div className="min-h-0 flex-1 overflow-auto p-3.5" aria-live="polite">
      <header className="mb-2.5 flex flex-wrap items-baseline gap-2.5">
        <span className="font-serif text-xl italic">{obj.name}</span>
        <code className="break-words font-mono text-xs text-zinc-500">{obj.cmd}</code>
      </header>
      {obj.err && <p className="text-[12.5px] text-red-500">{obj.err}</p>}
      {!obj.err && isM(obj.v) && (
        <>
          <MatCard title="Resultado"><div className="max-w-full overflow-x-auto py-0.5"><MatrixTable d={obj.v.d} dec={dec} /></div></MatCard>
          <MatCard title="Propiedades de la matriz"><MatrixFacts v={obj.v} /></MatCard>
        </>
      )}
      {f && <MatCard title="Valor"><p className="font-mono text-lg font-medium">{f.main}{f.approx && <span className="ml-2 text-[11px] text-zinc-500">{f.approx}</span>}</p></MatCard>}
      <MatrixExplain obj={obj} objs={objs} />
    </div>
  );
}
