import { clean, cofactorOf, detOf, fmtNum, minorOf, mk } from "./engine.js";

// Métodos de cálculo del determinante (Unidad 3), con el desarrollo que el apunte muestra paso a paso.
const sub = (k) => String(k).split("").map((ch) => "₀₁₂₃₄₅₆₇₈₉"[+ch]).join("");
const det = (d) => (d.length === 1 ? d[0][0] : detOf(mk(d)));

// Regla de Sarrus (3×3): los tres productos de las diagonales y los tres de las diagonales secundarias.
export function sarrusTerms(d) {
  const plus = [[0, 1, 2], [1, 2, 0], [2, 0, 1]].map((c) => c.map((col, row) => d[row][col]));
  const minus = [[2, 1, 0], [0, 2, 1], [1, 0, 2]].map((c) => c.map((col, row) => d[row][col]));
  const prod = (f) => f.reduce((a, b) => a * b, 1);
  return { plus: plus.map((f) => ({ f, p: clean(prod(f)) })), minus: minus.map((f) => ({ f, p: clean(prod(f)) })) };
}

// Laplace: se elige la línea con más ceros (la primera si hay empate) y se desarrolla por sus elementos.
export function laplaceInfo(d) {
  const n = d.length, zeros = (line) => line.filter((x) => Math.abs(x) < 1e-12).length;
  let best = { kind: "fila", k: 0, z: zeros(d[0]) };
  d.forEach((r, i) => { if (zeros(r) > best.z) best = { kind: "fila", k: i, z: zeros(r) }; });
  for (let j = 0; j < n; j++) { const z = zeros(d.map((r) => r[j])); if (z > best.z) best = { kind: "columna", k: j, z }; }
  const terms = [];
  for (let t = 0; t < n; t++) {
    const i = best.kind === "fila" ? best.k : t, j = best.kind === "fila" ? t : best.k;
    const a = d[i][j], minor = minorOf(d, i, j), m = det(minor), c = cofactorOf(d, i, j);
    terms.push({ i, j, a, sign: (i + j) % 2 ? -1 : 1, minor, m, c, value: clean(a * c) });
  }
  return { ...best, terms, total: clean(terms.reduce((s, x) => s + x.value, 0)) };
}

// Triangulación: solo se intercambian filas (cambia el signo) o se suma un múltiplo de otra fila (no cambia nada).
export function triangulate(d) {
  const n = d.length;
  let M = d.map((r) => r.slice()), sign = 1;
  const snap = () => M.map((r) => r.map(clean));
  const steps = [{ op: "Matriz inicial", why: "", M: snap(), sign }];
  let singular = false;
  for (let c = 0; c < n && !singular; c++) {
    let p = -1;
    for (let i = c; i < n; i++) if (Math.abs(M[i][c]) > 1e-12) { p = i; break; }
    if (p < 0) { singular = true; break; }
    if (p !== c) {
      [M[p], M[c]] = [M[c], M[p]]; sign = -sign;
      steps.push({ op: `e${sub(c + 1)}${sub(p + 1)}`, why: `Intercambiar las filas ${c + 1} y ${p + 1}: el determinante cambia de signo`, M: snap(), sign });
    }
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c];
      if (Math.abs(f) < 1e-12) continue;
      const k = -f / M[c][c];
      M[i] = M[i].map((x, j) => x + k * M[c][j]);
      steps.push({ op: `e${sub(i + 1)}${sub(c + 1)}(${fmtNum(k)})`, why: `A la fila ${i + 1} sumarle la fila ${c + 1} por ${fmtNum(k)}: el determinante no varía`, M: snap(), sign });
    }
  }
  const diag = M.map((r, i) => clean(r[i]));
  return { steps, diag, sign, singular, det: clean(sign * diag.reduce((a, b) => a * b, 1)) };
}

// Método de la adjunta: matriz de cofactores, su transpuesta y la división por |A|.
export function adjointInfo(d) {
  const cof = d.map((r, i) => r.map((_, j) => cofactorOf(d, i, j)));
  const adj = cof[0].map((_, j) => cof.map((r) => r[j]));
  const dt = det(d);
  return { cof, adj, det: dt, inv: Math.abs(dt) < 1e-12 ? null : adj.map((r) => r.map((x) => clean(x / dt))) };
}
