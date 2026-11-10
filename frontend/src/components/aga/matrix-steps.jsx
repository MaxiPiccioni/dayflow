import { AdjointExplain, DeterminantExplain } from "@/components/aga/determinant-steps";
import { MatrixTable } from "@/components/aga/matrix-table";
import { clean, fmtNum, gaussSteps, isM } from "@/lib/aga/engine";

export function MatCard({ title, children }) {
  return (
    <section className="mb-3 min-w-0 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

const hint = "text-[11px] text-zinc-500";

// Los pasos de Gauss-Jordan, una tarjeta por operación elemental, con la columna de control (CC) si la hay.
function Steps({ g, kind, name }) {
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

// Cada elemento del producto, con la cuenta que lo origina.
function Product({ A, B }) {
  const m = A.d.length, q = B.d[0].length, p = B.d.length;
  if (m * q > 36) return <p className={hint}>El producto tiene {m * q} elementos: se omite el desarrollo elemento por elemento.</p>;
  const par = (x) => (x < 0 ? `(${fmtNum(x)})` : fmtNum(x));
  const cells = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < q; j++) {
      const terms = Array.from({ length: p }, (_, k) => `${fmtNum(A.d[i][k])}·${par(B.d[k][j])}`).join(" + ");
      const val = A.d[i].reduce((s, a, k) => s + a * B.d[k][j], 0);
      cells.push(
        <div key={`${i}.${j}`} className="flex flex-wrap items-baseline gap-1.5 py-0.5 font-mono text-[11.5px]">
          <span>c<sub>{i + 1}{j + 1}</sub></span><span>= {terms} = <b>{fmtNum(clean(val))}</b></span>
        </div>,
      );
    }
  }
  return (
    <>
      <div className="grid gap-x-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">{cells}</div>
      <p className={`mt-1 ${hint}`}>Cada elemento c<sub>ij</sub> es la fila i del primer factor por la columna j del segundo.</p>
    </>
  );
}

// Explicación paso a paso según la orden escrita (Rref, Inversa, MatP, producto de dos matrices). null si no corresponde.
export function MatrixExplain({ obj, objs }) {
  const cmd = obj.cmd.replace(/\s+/g, "");
  const mat = (name) => { const x = objs.find((q) => q.name === name && !q.err); return x && isM(x.v) ? x.v : null; };
  let m;
  if ((m = cmd.match(/^(?:Rref|Reducida|Escalonar)\((\w+)\)$/i)) && mat(m[1])) {
    return (
      <MatCard title="Reducida por filas, paso a paso">
        <p className={`mb-2 ${hint}`}>Notación del apunte: e<sub>il</sub>(λ) suma a la fila i la fila l multiplicada por λ; e<sub>i</sub>(λ) multiplica la fila i por λ; e<sub>il</sub> intercambia filas. La última columna (CC) es la columna de control.</p>
        <Steps g={gaussSteps(mat(m[1]).d, { cc: true })} kind="rref" name={m[1]} />
      </MatCard>
    );
  }
  if (((m = cmd.match(/^(?:Inversa|Inv|Inverse)\((\w+)\)$/i)) || (m = cmd.match(/^(\w+)\^-1$/))) && mat(m[1])) {
    const sq = mat(m[1]).d.length === mat(m[1]).d[0].length && mat(m[1]).d.length <= 5;
    return (
      <>
      <MatCard title="Inversa por operaciones elementales">
        <p className={`mb-2 ${hint}`}>Se parte de [A | I | CC] y se reduce A. Lo que queda a la derecha de la barra es A⁻¹. CC se mantiene igual a la suma de cada fila si no hay errores de cuenta.</p>
        <Steps g={gaussSteps(mat(m[1]).d, { aug: true, cc: true })} kind="inv" name={m[1]} />
      </MatCard>
      {sq && <AdjointExplain d={mat(m[1]).d} withInverse />}
      </>
    );
  }
  if ((m = cmd.match(/^Det\((\w+)\)$/i)) && mat(m[1]) && mat(m[1]).d.length === mat(m[1]).d[0].length) return <DeterminantExplain d={mat(m[1]).d} />;
  if ((m = cmd.match(/^(?:Adjunta|Adj|Cofactores|Cof)\((\w+)\)$/i)) && mat(m[1]) && mat(m[1]).d.length === mat(m[1]).d[0].length) return <AdjointExplain d={mat(m[1]).d} />;
  if ((m = cmd.match(/^MatP\((\w+)\)$/i)) && mat(m[1])) {
    return (
      <MatCard title="Matriz P, paso a paso">
        <p className={`mb-2 ${hint}`}>Se aplican a [A | I] las mismas operaciones que reducen A. El resultado a la derecha es P.</p>
        <Steps g={gaussSteps(mat(m[1]).d, { aug: true, cc: true })} kind="p" name={m[1]} />
      </MatCard>
    );
  }
  if ((m = cmd.match(/^(\w+)\*(\w+)$/)) && mat(m[1]) && mat(m[2]) && !obj.err) return <MatCard title="Producto elemento por elemento"><Product A={mat(m[1])} B={mat(m[2])} /></MatCard>;
  return null;
}
