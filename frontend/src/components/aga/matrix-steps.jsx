import { AdjointExplain, DeterminantExplain } from "@/components/aga/determinant-steps";
import { MatCard, Steps, hint } from "@/components/aga/step-cards";
import { SystemExplain } from "@/components/aga/system-steps";
import { VectorSpaceExplain } from "@/components/aga/vspace-steps";
import { clean, fmtNum, gaussSteps, isM } from "@/lib/aga/engine";

export { MatCard };

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
  if ((m = cmd.match(/^(Clasificar|Sistema|Rouche|Resolver|Solve|Solucion|Particular|Cramer|Nucleo|Kernel|Balancear|Balance)\((\w+)(?:,(\w+))?\)$/i)) && mat(m[2]) && (!m[3] || mat(m[3]))) return <SystemExplain fn={m[1].toLowerCase()} A={mat(m[2])} B={m[3] ? mat(m[3]) : null} names={[m[2], m[3]]} />;
  if ((m = cmd.match(/^(Genera|Generan|Span|Indep|Independencia|Independientes|LI|Base|Basis|Dimension|Dim|Caracterizar|Caracteriza)\((\w+)\)$/i)) && mat(m[2]) && !obj.err) {
    const f = m[1].toLowerCase(), fn = { generan: "genera", span: "genera", independencia: "indep", independientes: "indep", li: "indep", basis: "base", dim: "dimension", caracteriza: "caracterizar" }[f] || f;
    return <VectorSpaceExplain fn={fn} A={mat(m[2])} />;
  }
  if ((m = cmd.match(/^(\w+)\*(\w+)$/)) && mat(m[1]) && mat(m[2]) && !obj.err) return <MatCard title="Producto elemento por elemento"><Product A={mat(m[1])} B={mat(m[2])} /></MatCard>;
  return null;
}
