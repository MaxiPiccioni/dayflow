/* Ayudas compartidas para cargar los ejemplos y ejercicios de las unidades del sandbox de Álgebra. */
export const MM = (rows) => ({ m: rows });
export const COL = (v) => MM(v.map((x) => [x]));
export const TR = (vs) => MM(vs[0].map((_, i) => vs.map((v) => v[i])));
export const mx = (rows) => "[" + rows.map((r) => r.join(",")).join(";") + "]";
export const cl = (v) => "[" + v.join(";") + "]";
export const KIND_TEXT = { det: "Compatible determinado", ind: "Compatible indeterminado", inc: "Incompatible" };
const SUBS = "₀₁₂₃₄₅₆₇₈₉";
export const sub = (n) => String(n).split("").map((d) => SUBS[+d]).join("");
export function fm(x) {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x)).replace("-", "−");
  for (let q = 2; q <= 240; q++) { const p = Math.round(x * q); if (Math.abs(x - p / q) < 1e-9) return (p < 0 ? "−" : "") + Math.abs(p) + "/" + q; }
  return String(+x.toFixed(4)).replace("-", "−");
}
export const vec = (v) => "(" + v.map(fm).join(", ") + ")";

// Ecuaciones del sistema escritas con las incógnitas (vars) o x₁, x₂, …
export function eqText(A, b, vars) {
  const n = A[0].length, names = vars || Array.from({ length: n }, (_, i) => "x" + sub(i + 1));
  const num = (c) => (typeof c === "number" ? c : String(c).split("/").reduce((p, q) => p / q));
  return A.map((row, i) => {
    let s = "";
    row.forEach((c, j) => {
      const v = num(c); if (Math.abs(v) < 1e-12) return;
      const mag = typeof c === "number" ? Math.abs(c) : String(c).replace(/^-/, "");
      const coef = typeof mag === "number" ? (mag === 1 ? "" : fm(mag)) : mag === "1" ? "" : "(" + mag + ")";
      s += s ? (v < 0 ? " − " : " + ") : v < 0 ? "−" : "";
      s += coef + names[j];
    });
    return (s || "0") + " = " + (typeof b[i] === "number" ? fm(b[i]) : String(b[i]));
  }).join("<br>");
}

export function autoAns(kind, o) {
  if (kind === "det") return "Compatible determinado. X = " + vec(o.x) + (o.x.every((v) => v === 0) ? " (solución trivial)." : ".");
  if (kind === "ind") {
    const par = o.N.length === 1 ? ["t"] : o.N.map((_, i) => "t" + (i + 1));
    return "Compatible indeterminado (" + o.N.length + (o.N.length === 1 ? " parámetro" : " parámetros") + "). X = " + vec(o.p) + " + " + o.N.map((v, i) => par[i] + "·" + vec(v)).join(" + ") + ".";
  }
  return "Sistema incompatible: rango de la matriz principal distinto del rango de la ampliada.";
}

// Un inciso: sistema A·X = B (arreglos o textos de orden) con su clasificación y su solución.
export function S(l, A, b, kind, o = {}) {
  const Atxt = typeof A === "string" ? A : mx(A), Btxt = typeof b === "string" ? b : cl(b);
  const cmds = [...(o.pre || []), "A=" + Atxt, "B=" + Btxt, "t=Clasificar(A,B)"];
  const expect = { t: KIND_TEXT[kind] };
  if (o.det !== undefined) { cmds.push("d=Det(A)"); expect.d = o.det; }
  if (kind === "det") { cmds.push(o.cramer ? "X=Cramer(A,B)" : "X=Resolver(A,B)"); expect.X = COL(o.x); }
  else if (kind === "ind") { cmds.push("p=Particular(A,B)", "N=Nucleo(A)", "X=Resolver(A,B)"); expect.p = COL(o.p); expect.N = TR(o.N); expect.X = "Indeterminado*"; }
  else { cmds.push("X=Resolver(A,B)"); expect.X = "Incompatible*"; }
  const item = { l: l, cmds, focus: "X", expect, ans: o.ans ?? autoAns(kind, o) };
  if (o.note) item.note = o.note;
  if (o.sol) item.sol = o.sol;
  if (Array.isArray(A) && !o.noEq) item.eq = eqText(A, b, o.vars);
  return item;
}
export const E = (...lines) => lines.join("<br>");


// Constructor de las listas de ejemplos y ejercicios de una unidad.
export function unitBuilder(unit, tag) {
  const list = [];
  const ejemplo = (n, title, text, items) => { list.push({ id: `u${unit}x${n}`, kind: "ej", unit, n, title, tag, text, items }); };
  const ejercicio = (n, title, text, items) => {
    const eqs = items.filter((i) => i.eq).map((i) => (items.length > 1 ? "<br><b>" + i.l + ")</b> " : "<br>") + i.eq.replace(/<br>/g, " ; "));
    list.push({ id: `u${unit}e${n}`, num: n, n, kind: "ex", unit, title, tag, text: text + eqs.join(""), items: items.map(({ eq, ...rest }) => rest) });
  };
  return { list, ejemplo, ejercicio };
}
