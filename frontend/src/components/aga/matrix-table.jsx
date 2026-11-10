import { fmtNum } from "@/lib/aga/engine";

// Matriz entre corchetes. `split` marca la columna donde empieza el bloque derecho de [A | I]; `cc` pinta la última
// columna (la de control) más tenue.
export function MatrixTable({ d, split = 0, cc = false, dec = false }) {
  return (
    <table className="my-1 border-x-2 border-zinc-900 font-mono text-[12.5px] [border-radius:6px] dark:border-zinc-100">
      <tbody>
        {d.map((row, i) => (
          <tr key={i}>
            {row.map((x, j) => {
              const border = split > 0 && j === split ? "border-l border-dashed border-zinc-400" : cc && j === row.length - 1 ? "border-l border-dotted border-zinc-400 text-zinc-500" : "";
              return <td key={j} className={`whitespace-nowrap px-2.5 py-0.5 text-right tabular-nums ${border}`}>{fmtNum(x, dec)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Versión compacta para la vista algebraica: las matrices grandes o nulas se resumen en una línea.
export function MatrixSmall({ v }) {
  const m = v.d.length, n = v.d[0].length;
  if (v.d.every((r) => r.every((x) => Math.abs(x) < 1e-12)) && m * n > 12) return <span className="text-[11px] text-zinc-500">matriz nula de {m}×{n}</span>;
  if (m > 8 || n > 8) return <span className="text-[11px] text-zinc-500">matriz de {m}×{n}</span>;
  return <MatrixTable d={v.d} />;
}
