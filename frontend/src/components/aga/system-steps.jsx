import { MatCard, Steps, hint } from "@/components/aga/step-cards";
import { MatrixTable } from "@/components/aga/matrix-table";
import { KIND, detOf, fmtNum, gaussSteps, isM, mk, paramText, sysInfo } from "@/lib/aga/engine";

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => String(n).split("").map((d) => SUB[+d]).join("");

// Las ecuaciones del sistema, una por línea, con incógnitas x₁, x₂, …
function equations(A, b) {
  return A.map((row, i) => {
    let s = "";
    row.forEach((c, j) => {
      if (Math.abs(c) < 1e-12) return;
      const mag = Math.abs(c), coef = Math.abs(mag - 1) < 1e-12 ? "" : fmtNum(mag);
      s += (s ? (c < 0 ? " − " : " + ") : c < 0 ? "−" : "") + coef + "x" + sub(j + 1);
    });
    return (s || "0") + " = " + fmtNum(b[i]);
  });
}

// A·X = B: la matriz ampliada, Rouché-Frobenius, Gauss-Jordan con columna de control y la solución (o Cramer / núcleo).
export function SystemExplain({ fn, A: Am, B: Bm, names }) {
  let A = Am.d, b;
  if (Bm) {
    if (Bm.d[0].length !== 1 || Bm.d.length !== A.length) return null;
    b = Bm.d.map((r) => r[0]);
  } else if (fn === "nucleo" || fn === "kernel" || fn === "balancear" || fn === "balance") b = A.map(() => 0);
  else { if (A[0].length < 2) return null; b = A.map((r) => r[r.length - 1]); A = A.map((r) => r.slice(0, -1)); }
  if (A.length * A[0].length > 60) return null;
  const info = sysInfo(A, b), n = info.n, homog = b.every((x) => Math.abs(x) < 1e-12);
  const kindText = KIND[info.kind];
  const g = gaussSteps(A.map((r, i) => r.concat([b[i]])), { split: n, cc: true });
  const cramer = fn === "cramer" && A.length === n;
  const D = cramer ? detOf(mk(A)) : 0;
  const lim = (i) => "x" + sub(i + 1);
  const badRow = info.kind === "incompatible" ? info.g.final.find((r) => r.slice(0, n).every((x) => Math.abs(x) < 1e-12) && Math.abs(r[n]) > 1e-12) : null;
  return (
    <>
      <MatCard title="Sistema A·X = B y matriz ampliada">
        <div className="mb-2 font-mono text-[12.5px] leading-relaxed">{equations(A, b).map((e, i) => <div key={i}>{e}</div>)}</div>
        <MatrixTable d={A.map((r, i) => r.concat([b[i]]))} split={n} />
        <p className="mt-1 text-[12.5px]">
          Teorema de Rouché-Frobenius: r(MP) = <b>{info.rA}</b>, r(MA) = <b>{info.rAb}</b>, n = <b>{n}</b> incógnitas.{" "}
          {info.kind === "incompatible" && <>r(MP) ≠ r(MA): <b className="text-red-500">sistema incompatible</b>, no tiene solución.</>}
          {info.kind === "determinado" && <>r(MP) = r(MA) = n: <b>{kindText.toLowerCase()}</b>, solución única{homog ? " (la trivial, porque es homogéneo)" : ""}.</>}
          {info.kind === "indeterminado" && <>r(MP) = r(MA) = {info.rA} &lt; n: <b>{kindText.toLowerCase()}</b>, infinitas soluciones con {n - info.rA} {n - info.rA === 1 ? "parámetro" : "parámetros"}{homog ? " (sistema homogéneo)" : ""}.</>}
        </p>
        {homog && <p className={hint}>Un sistema homogéneo siempre es compatible: r(MP) = r(MA), y la solución trivial X = 0 siempre lo resuelve.</p>}
      </MatCard>

      {cramer && (
        <MatCard title="Método de Cramer">
          {Math.abs(D) < 1e-12
            ? <p className="text-[12.5px]">|A| = 0: Cramer no se puede aplicar. Hay que usar Gauss o Gauss-Jordan.</p>
            : (
              <>
                <p className="mb-1 font-mono text-[12.5px]">|A| = {fmtNum(D)} ≠ 0</p>
                {A[0].map((_, j) => {
                  const Aj = A.map((r, i) => r.map((x, k) => (k === j ? b[i] : x))), Dj = detOf(mk(Aj));
                  return (
                    <div key={j} className="mb-1 flex flex-wrap items-center gap-3 font-mono text-[12.5px]">
                      <span>|A{sub(j + 1)}| (columna {j + 1} reemplazada por B) = {fmtNum(Dj)}</span>
                      <span>x{sub(j + 1)} = {fmtNum(Dj)}/{fmtNum(D)} = <b>{fmtNum(Dj / D)}</b></span>
                    </div>
                  );
                })}
              </>
            )}
        </MatCard>
      )}

      <MatCard title="Gauss-Jordan paso a paso (con columna de control)">
        <p className={`mb-2 ${hint}`}>Se reduce la matriz ampliada. e<sub>il</sub>(λ) suma a la fila i la fila l multiplicada por λ; e<sub>i</sub>(λ) multiplica la fila i por λ; e<sub>il</sub> intercambia filas. La última columna (CC) debe seguir siendo la suma de cada fila.</p>
        <Steps g={g} />
      </MatCard>

      <MatCard title="Solución">
        {info.kind === "incompatible" && (
          <p className="text-[12.5px]">{badRow ? <>La fila reducida (0 0 … 0 | {fmtNum(badRow[n])}) dice 0 = {fmtNum(badRow[n])}, que es imposible. </> : null}El sistema no tiene solución.</p>
        )}
        {info.kind === "determinado" && (
          <div className="font-mono text-[12.5px] leading-relaxed">
            {info.part.map((v, i) => <div key={i}>{lim(i)} = <b>{fmtNum(v)}</b></div>)}
          </div>
        )}
        {info.kind === "indeterminado" && (
          <>
            <p className="text-[12.5px]">Incógnitas principales: {g.piv.filter((c) => c < n).map(lim).join(", ")}. Incógnitas secundarias (parámetros): {info.free.map((f, i) => `${lim(f)} = ${info.free.length > 1 ? "t" + sub(i + 1) : "t"}`).join(", ")}.</p>
            <p className="mt-1.5 font-mono text-[12.5px]">X = {paramText(info)}</p>
            <p className={`mt-1 ${hint}`}>Cada valor de {info.free.length > 1 ? "los parámetros" : "t"} da una solución particular; la parte (…) fija es una solución particular del sistema y los vectores que multiplican a los parámetros resuelven el sistema homogéneo asociado.</p>
          </>
        )}
      </MatCard>
    </>
  );
}
