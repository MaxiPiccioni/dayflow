import { runTape } from "./run-tape.js";

// Complejidad de una MT: T(n) = cantidad de pasos (movimientos) y E(n) = celdas de cinta recorridas por el cabezal,
// medidas con el simulador para cadenas cada vez más largas (método experimental de la guía, ejercicio 22).

const FAMILIES = {
  // Ejemplo 6.1: c^k d^k e^k, de largo n = 3k.
  ckdkek: { label: "c^k d^k e^k (n = 3k)", sizes: [1, 2, 3, 4, 5, 6, 7, 8], make: (k) => ({ input: "c".repeat(k) + "d".repeat(k) + "e".repeat(k), n: 3 * k }) },
  // Ejercicio 10 (imagen refleja): w* con w de n símbolos A y B.
  mirror: { label: "w* con w de n símbolos", sizes: [1, 2, 3, 4, 5, 6, 7, 8], make: (n) => ({ input: `${Array.from({ length: n }, (_, i) => "AB"[i % 2]).join("")}*`, n }) },
  // Ejercicio 13 (intercambio de nibbles): x*y con x e y de n bits.
  swap: { label: "x*y con x e y de n bits", sizes: [1, 2, 3, 4, 5, 6, 7, 8], make: (n) => ({ input: `${"01".repeat(n).slice(0, n)}*${"10".repeat(n).slice(0, n)}`, n }) },
  // Ejercicio 6.32: α#α⁻¹ con α de m símbolos, de largo n = 2m + 1.
  palindrome: { label: "α#α⁻¹ (n = 2|α| + 1)", sizes: [1, 2, 3, 4, 5, 6, 7, 8], make: (m) => { const a = Array.from({ length: m }, (_, i) => "01"[i % 2]).join(""); return { input: `${a}#${Array.from(a).reverse().join("")}`, n: 2 * m + 1 }; } },
};
export const complexityFamilies = FAMILIES;

export function measure(machine, familyId, { maxSteps = 200000 } = {}) {
  const family = FAMILIES[familyId];
  if (!family) throw new Error(`Familia de cadenas desconocida: ${familyId}`);
  return family.sizes.map((size) => {
    const { input, n } = family.make(size);
    const r = runTape(machine, input, { maxSteps });
    return { n, input, steps: r.steps.length - 1, cells: r.usedCells, outcome: r.outcome, ok: r.outcome === "reconocida" || r.outcome === "se detuvo" };
  });
}

// ───────── Ajuste de un polinomio con fracciones exactas (eliminación de Gauss) ─────────
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const frac = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
const div = (a, b) => frac(a.n * b.d, a.d * b.n);
const isZero = (a) => a.n === 0n;
const toNumber = (a) => Number(a.n) / Number(a.d);

// Coeficientes [c0, c1, …, c_degree] (fracciones) del polinomio que pasa por los puntos { n, y }. Hacen falta degree + 1 puntos.
export function fitPolynomial(points, degree) {
  const pts = points.slice(0, degree + 1);
  if (pts.length < degree + 1) return null;
  const rows = pts.map((p) => [...Array.from({ length: degree + 1 }, (_, j) => frac(BigInt(p.n) ** BigInt(j))), frac(BigInt(p.y))]);
  for (let col = 0; col <= degree; col++) {
    let pivot = col;
    while (pivot <= degree && isZero(rows[pivot][col])) pivot++;
    if (pivot > degree) return null;
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    const inv = rows[col][col];
    rows[col] = rows[col].map((x) => div(x, inv));
    for (let r = 0; r <= degree; r++) {
      if (r === col || isZero(rows[r][col])) continue;
      const factor = rows[r][col];
      rows[r] = rows[r].map((x, c) => sub(x, mul(factor, rows[col][c])));
    }
  }
  return rows.map((row) => row[degree + 1]);
}

export const evaluatePolynomial = (coeffs, n) => coeffs.reduce((sum, c, j) => add(sum, mul(c, frac(BigInt(n) ** BigInt(j)))), frac(0n));

const fmt = (c) => (c.d === 1n ? `${c.n}` : `${c.n}/${c.d}`);
// "4/9 n² + n + 1": omite los términos nulos y los coeficientes 1.
export function polynomialText(coeffs, variable = "n") {
  const sup = ["", "", "²", "³", "⁴", "⁵"];
  const terms = [];
  for (let j = coeffs.length - 1; j >= 0; j--) {
    const c = coeffs[j];
    if (isZero(c)) continue;
    const abs = c.n < 0n ? frac(-c.n, c.d) : c;
    const body = j === 0 ? fmt(abs) : `${abs.n === 1n && abs.d === 1n ? "" : `${fmt(abs)} `}${variable}${sup[j] ?? `^${j}`}`;
    terms.push({ negative: c.n < 0n, body });
  }
  if (!terms.length) return "0";
  return terms.map((t, i) => (i === 0 ? (t.negative ? `-${t.body}` : t.body) : `${t.negative ? "-" : "+"} ${t.body}`)).join(" ");
}

// Resumen para la pantalla: tabla, polinomio de T(n) y de E(n), y predicción con un tamaño más grande que los usados.
export function analyzeComplexity(machine, familyId) {
  const rows = measure(machine, familyId);
  const valid = rows.filter((r) => r.ok);
  if (valid.length < rows.length) return { rows, error: `Con la cadena ${rows[valid.length].input} la máquina no terminó bien (${rows[valid.length].outcome}). Primero tiene que resolver el ejercicio.` };
  // Se ajusta con los primeros cuatro puntos (polinomio de grado 3, como propone la guía) y se verifica con los demás.
  const fit = (key) => {
    const pts = rows.map((r) => ({ n: r.n, y: r[key] }));
    const coeffs = fitPolynomial(pts, 3);
    if (!coeffs) return null;
    const verified = pts.slice(4).every((p) => toNumber(evaluatePolynomial(coeffs, p.n)) === p.y);
    return { coeffs, text: polynomialText(coeffs), verified, extra: pts.length - 4 };
  };
  return { rows, time: fit("steps"), space: fit("cells") };
}
