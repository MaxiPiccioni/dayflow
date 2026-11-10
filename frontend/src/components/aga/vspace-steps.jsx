import { MatCard, Steps, hint } from "@/components/aga/step-cards";
import { MatrixTable } from "@/components/aga/matrix-table";
import { colRank, fmtNum, gaussSteps, leftNull, rn, sysInfo } from "@/lib/aga/engine";

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => String(n).split("").map((d) => SUB[+d]).join("");
const vecText = (c) => "(" + c.map((x) => fmtNum(x)).join("; ") + ")";

// Genera / Indep / Base / Dimension / Caracterizar: los vectores son las columnas de A.
export function VectorSpaceExplain({ fn, A: Am }) {
  const A = Am.d, n = A.length, k = A[0].length;
  if (n * k > 60) return null;
  const cols = A[0].map((_, j) => A.map((r) => r[j]));
  const r = colRank(A);
  const g = gaussSteps(A, {});
  const square = n === k;
  const homog = A.map(() => 0);
  const info = sysInfo(A, homog);
  const dimNull = k - r;

  if (fn === "imagen") {
    const AT = A[0].map((_, j) => A.map((row) => row[j])), gT = gaussSteps(AT, {});
    const base = gT.final.filter((row) => row.some((x) => Math.abs(x) > 1e-9));
    return (
      <>
        <MatCard title="Imagen = espacio de columnas de A">
          <MatrixTable d={A} />
          <p className="mt-1 text-[12.5px]">La imagen de T(x) = A·x está generada por las columnas de A. Para hallar una base se reduce la transpuesta Aᵀ: sus filas no nulas son una base del espacio de columnas de A.</p>
          <p className={`mt-1 ${hint}`}>El espacio de columnas de A es el espacio de filas de Aᵀ.</p>
        </MatCard>
        <MatCard title="Gauss-Jordan sobre Aᵀ"><Steps g={gT} /></MatCard>
        <MatCard title="Base de la imagen">
          {base.length ? base.map((v, i) => <div key={i} className="font-mono text-[12.5px]">w{sub(i + 1)} = {vecText(v)}</div>) : <div className="text-[12.5px]">A = 0: la imagen es {"{0}"}.</div>}
          <p className="mt-1 font-mono text-[12.5px]">rango(T) = {base.length}; nulidad(T) = {k} − {base.length} = {k - base.length}</p>
          <p className={`mt-1 ${hint}`}>Teorema de la dimensión: rango(T) + nulidad(T) = n, con n = {k} columnas de A.</p>
        </MatCard>
      </>
    );
  }

  if (fn === "dimension") {
    return (
      <>
        <MatCard title="Espacio de soluciones del sistema homogéneo A·X = 0">
          <MatrixTable d={A} />
          <p className="mt-1 text-[12.5px]">Cantidad de incógnitas n = <b>{k}</b>, rango r(A) = <b>{r}</b>.</p>
          <p className="mt-1 font-mono text-[12.5px]">dim = n − r(A) = {k} − {r} = <b>{dimNull}</b></p>
          <p className={`mt-1 ${hint}`}>{dimNull === 0 ? "Solo la solución trivial: el espacio es {0}, no tiene base y su dimensión es 0." : "Los " + dimNull + " parámetros libres dan una base: se despejan las incógnitas principales y cada parámetro genera un vector."}</p>
        </MatCard>
        <MatCard title="Gauss-Jordan paso a paso"><Steps g={g} /></MatCard>
        {dimNull > 0 && (
          <MatCard title="Base del espacio de soluciones">
            {info.basis.map((v, i) => <div key={i} className="font-mono text-[12.5px]">v{sub(i + 1)} = {vecText(v)}</div>)}
          </MatCard>
        )}
      </>
    );
  }

  const dep = r < k;
  return (
    <>
      <MatCard title="Los vectores, como columnas de A">
        <div className="mb-1 font-mono text-[12.5px]">{cols.map((c, i) => <div key={i}>v{sub(i + 1)} = {vecText(c)}</div>)}</div>
        <MatrixTable d={A} />
        <p className={`mt-1 ${hint}`}>Se reduce A por filas: el rango es la cantidad de pivotes, y no cambia si se trabaja con filas o columnas.</p>
      </MatCard>
      <MatCard title="Gauss-Jordan paso a paso"><Steps g={g} /></MatCard>
      <MatCard title="Conclusión">
        <p className="font-mono text-[12.5px]">r(A) = {r}; {k} vectores en {rn(n)}</p>
        {(fn === "genera" || fn === "base") && (
          <p className="mt-1 text-[12.5px]">
            <b>Generadores:</b> {r === n ? <>r(A) = {n} = dim {rn(n)}: generan {rn(n)}.</> : <>r(A) = {r} &lt; {n}: <span className="text-red-500">no generan {rn(n)}</span>; generan un subespacio de dimensión {r}.</>}
          </p>
        )}
        {(fn === "indep" || fn === "base") && (
          <p className="mt-1 text-[12.5px]">
            <b>Independencia:</b> {!dep ? <>r(A) = {k} = cantidad de vectores: la única combinación que da 0 es la trivial, son linealmente independientes.</> : <>r(A) = {r} &lt; {k}: <span className="text-red-500">linealmente dependientes</span> (el sistema homogéneo tiene {k - r} {k - r === 1 ? "parámetro libre" : "parámetros libres"}).</>}
          </p>
        )}
        {fn === "base" && (
          <p className="mt-1 text-[12.5px]">
            <b>Base:</b> {r === n && r === k ? <>Son {n} vectores independientes en un espacio de dimensión {n}: <b>es una base de {rn(n)}</b>.</> : <><b className="text-red-500">no es una base de {rn(n)}</b>: hacen falta exactamente {n} vectores independientes{square ? "" : " (hay " + k + ")"}.</>}
          </p>
        )}
        {square && fn !== "caracterizar" && <p className={`mt-1 ${hint}`}>Con una matriz cuadrada también se puede mirar |A|: |A| ≠ 0 equivale a r(A) = {n}.</p>}
        {fn === "caracterizar" && (
          <>
            <p className="text-[12.5px]">El sistema A·X = (y₁; …; y{sub(n)}) es compatible solo si el vector cumple {n - r === 0 ? "ninguna condición (todo vector es combinación lineal)" : "las condiciones:"}.</p>
            {leftNull(A).map((c, i) => (
              <p key={i} className="mt-1 font-mono text-[12.5px]">{c.map((x, j) => (x ? (x < 0 ? " − " : " + ") + (Math.abs(x) === 1 ? "" : fmtNum(Math.abs(x))) + "y" + sub(j + 1) : "")).join("").replace(/^ \+ /, "").replace(/^ − /, "−")} = 0</p>
            ))}
            <p className={`mt-1 ${hint}`}>Salen de las filas nulas al reducir [A | I]: cada fila nula da una combinación de las y que debe valer 0.</p>
          </>
        )}
      </MatCard>
    </>
  );
}
