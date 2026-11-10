import { MatCard } from "@/components/aga/matrix-steps";
import { MatrixTable } from "@/components/aga/matrix-table";
import { adjointInfo, laplaceInfo, sarrusTerms, triangulate } from "@/lib/aga/determinants";
import { fmtNum } from "@/lib/aga/engine";

const hint = "text-[11px] text-zinc-500";
const par = (x) => (x < 0 ? `(${fmtNum(x)})` : fmtNum(x));
const signed = (x) => (x < 0 ? `− ${fmtNum(-x)}` : `+ ${fmtNum(x)}`);

function Order2({ d }) {
  const [[a, b], [c, e]] = d;
  return (
    <MatCard title="Determinante de orden 2">
      <p className="font-mono text-[12.5px]">|A| = {par(a)}·{par(e)} − {par(b)}·{par(c)} = {fmtNum(a * e)} − {par(b * c)} = <b>{fmtNum(a * e - b * c)}</b></p>
      <p className={`mt-1 ${hint}`}>Producto de la diagonal principal menos producto de la diagonal secundaria.</p>
    </MatCard>
  );
}

function Sarrus({ d }) {
  const { plus, minus } = sarrusTerms(d);
  const total = plus.reduce((s, x) => s + x.p, 0) - minus.reduce((s, x) => s + x.p, 0);
  const row = (t, sign) => <div className="font-mono text-[12px]">{sign} {t.f.map(par).join(" · ")} = {fmtNum(t.p)}</div>;
  return (
    <MatCard title="Regla de Sarrus">
      <div className="grid gap-x-6 gap-y-1 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        <div><p className={hint}>Diagonal principal y paralelas (+)</p>{plus.map((t, i) => <div key={i}>{row(t, "+")}</div>)}</div>
        <div><p className={hint}>Diagonal secundaria y paralelas (−)</p>{minus.map((t, i) => <div key={i}>{row(t, "−")}</div>)}</div>
      </div>
      <p className="mt-2 font-mono text-[12.5px]">|A| = {fmtNum(plus.reduce((s, x) => s + x.p, 0))} − {par(minus.reduce((s, x) => s + x.p, 0))} = <b>{fmtNum(total)}</b></p>
    </MatCard>
  );
}

function Laplace({ d }) {
  const info = laplaceInfo(d);
  const name = `${info.kind} ${info.k + 1}`;
  return (
    <MatCard title="Método de Laplace (cofactores)">
      <p className={`mb-2 ${hint}`}>Se desarrolla por la {name}{info.z ? ` (tiene ${info.z} ${info.z === 1 ? "cero" : "ceros"}: esos términos valen 0)` : ""}. Cada término es a<sub>ij</sub>·(−1)<sup>i+j</sup>·M<sub>ij</sub>, con M<sub>ij</sub> el determinante que queda al suprimir la fila i y la columna j.</p>
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
        {info.terms.map((t) => (
          <div key={`${t.i}${t.j}`} className="min-w-0 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="font-mono text-[12px]">a<sub>{t.i + 1}{t.j + 1}</sub> = {fmtNum(t.a)} · ({t.sign > 0 ? "+" : "−"}1)</p>
            {Math.abs(t.a) < 1e-12
              ? <p className={hint}>El elemento es 0: no hace falta calcular el menor.</p>
              : <><MatrixTable d={t.minor} /><p className="font-mono text-[12px]">M<sub>{t.i + 1}{t.j + 1}</sub> = {fmtNum(t.m)} → C<sub>{t.i + 1}{t.j + 1}</sub> = {fmtNum(t.c)}</p></>}
            <p className="font-mono text-[12px]">término = <b>{fmtNum(t.value)}</b></p>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[12.5px]">|A| = {info.terms.map((t, i) => (i === 0 ? fmtNum(t.value) : signed(t.value))).join(" ")} = <b>{fmtNum(info.total)}</b></p>
    </MatCard>
  );
}

function Triangulation({ d }) {
  const t = triangulate(d);
  return (
    <MatCard title="Triangulación">
      <p className={`mb-2 ${hint}`}>Intercambiar dos filas cambia el signo del determinante; sumar a una fila un múltiplo de otra no lo modifica. En la matriz triangular el determinante es el producto de la diagonal.</p>
      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
        {t.steps.map((s, i) => (
          <div key={i} className="min-w-0 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-1 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[12.5px] font-semibold text-lime-700 dark:text-lime-400">{s.op}</span>
              {s.why && <span className="text-[11.5px] text-zinc-500">{s.why}</span>}
            </div>
            <MatrixTable d={s.M} />
          </div>
        ))}
      </div>
      <p className="mt-2.5 font-mono text-[12.5px]">
        {t.singular ? "Aparece una columna sin elemento conductor: el determinante es " : `|A| = ${t.sign < 0 ? "(−1)·" : ""}${t.diag.map(par).join(" · ")} = `}<b>{fmtNum(t.det)}</b>
      </p>
    </MatCard>
  );
}

// Los métodos del apunte para la orden Det(X): diagonales (2×2), Sarrus (3×3), Laplace y triangulación.
export function DeterminantExplain({ d }) {
  const n = d.length;
  if (n === 1) return null;
  return (
    <>
      {n === 2 && <Order2 d={d} />}
      {n === 3 && <Sarrus d={d} />}
      {n >= 3 && n <= 5 && <Laplace d={d} />}
      <Triangulation d={d} />
    </>
  );
}

// Matriz de cofactores, adjunta y (si existe) la inversa A⁻¹ = Adj(A)/|A|.
export function AdjointExplain({ d, withInverse }) {
  if (d.length < 2) return null;
  const a = adjointInfo(d);
  return (
    <MatCard title="Cofactores y adjunta">
      <p className={`mb-2 ${hint}`}>Cada elemento se reemplaza por su cofactor C<sub>ij</sub> = (−1)<sup>i+j</sup>·M<sub>ij</sub>; la adjunta es la transpuesta de la matriz de cofactores.</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <div><p className={hint}>Matriz de cofactores</p><div className="overflow-x-auto"><MatrixTable d={a.cof} /></div></div>
        <div><p className={hint}>Adjunta = cofactoresᵗ</p><div className="overflow-x-auto"><MatrixTable d={a.adj} /></div></div>
        {withInverse && a.inv && <div><p className={hint}>A⁻¹ = Adj(A) / |A| con |A| = {fmtNum(a.det)}</p><div className="overflow-x-auto"><MatrixTable d={a.inv} /></div></div>}
      </div>
      {withInverse && !a.inv && <p className="mt-2 text-[12.5px] text-red-500">|A| = 0: no se puede dividir la adjunta por el determinante, la matriz <b>no es inversible</b>.</p>}
    </MatCard>
  );
}
