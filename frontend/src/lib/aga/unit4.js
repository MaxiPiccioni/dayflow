export const EX4 = [];
/* ===== Unidad 4 · Sistemas de ecuaciones lineales ===== */
const TAG = "Sistemas de ecuaciones";
const MM = (rows) => ({ m: rows });
const COL = (v) => MM(v.map((x) => [x]));
const TR = (vs) => MM(vs[0].map((_, i) => vs.map((v) => v[i])));
const mx = (rows) => "[" + rows.map((r) => r.join(",")).join(";") + "]";
const cl = (v) => "[" + v.join(";") + "]";
const KIND = { det: "Compatible determinado", ind: "Compatible indeterminado", inc: "Incompatible" };
const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => String(n).split("").map((d) => SUBS[+d]).join("");
function fm(x) {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x)).replace("-", "−");
  for (let q = 2; q <= 240; q++) { const p = Math.round(x * q); if (Math.abs(x - p / q) < 1e-9) return (p < 0 ? "−" : "") + Math.abs(p) + "/" + q; }
  return String(+x.toFixed(4)).replace("-", "−");
}
const vec = (v) => "(" + v.map(fm).join(", ") + ")";

// Ecuaciones del sistema escritas con las incógnitas (vars) o x₁, x₂, …
function eqText(A, b, vars) {
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

function autoAns(kind, o) {
  if (kind === "det") return "Compatible determinado. X = " + vec(o.x) + (o.x.every((v) => v === 0) ? " (solución trivial)." : ".");
  if (kind === "ind") {
    const par = o.N.length === 1 ? ["t"] : o.N.map((_, i) => "t" + (i + 1));
    return "Compatible indeterminado (" + o.N.length + (o.N.length === 1 ? " parámetro" : " parámetros") + "). X = " + vec(o.p) + " + " + o.N.map((v, i) => par[i] + "·" + vec(v)).join(" + ") + ".";
  }
  return "Sistema incompatible: rango de la matriz principal distinto del rango de la ampliada.";
}

// Un inciso: sistema A·X = B (arreglos o textos de orden) con su clasificación y su solución.
function S(l, A, b, kind, o = {}) {
  const Atxt = typeof A === "string" ? A : mx(A), Btxt = typeof b === "string" ? b : cl(b);
  const cmds = [...(o.pre || []), "A=" + Atxt, "B=" + Btxt, "t=Clasificar(A,B)"];
  const expect = { t: KIND[kind] };
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
function ejemplo4(n, title, text, items) { EX4.push({ id: "u4x" + n, kind: "ej", unit: 4, n, title, tag: TAG, text, items }); }
function ejercicio4(n, title, text, items) {
  const eqs = items.filter((i) => i.eq).map((i) => (items.length > 1 ? "<br><b>" + i.l + ")</b> " : "<br>") + i.eq.replace(/<br>/g, " ; "));
  EX4.push({ id: "u4e" + n, num: n, n, kind: "ex", unit: 4, title, tag: TAG, text: text + eqs.join(""), items: items.map(({ eq, ...rest }) => rest) });
}
const E = (...lines) => lines.join("<br>");

/* ---------- Ejemplos (recuadros del apunte) ---------- */
ejemplo4(1, "Forma matricial A·X = B", "Escribir el sistema 2x₁ − x₂ + 4x₃ = −1; x₁ + 3x₂ − 5x₃ = 2; −x₁ + x₂ + x₃ = −2 como A·X = B (A: matriz de los coeficientes, X: de las incógnitas, B: de los términos independientes) y resolverlo.",
  [S("", [[2, -1, 4], [1, 3, -5], [-1, 1, 1]], [-1, 2, -2], "det", { x: [4 / 7, -5 / 7, -5 / 7], noEq: true, sol: "La matriz A de orden 3×3 tiene rango 3, así que el sistema es compatible determinado. Seleccioná <b>X</b> para ver el desarrollo de Gauss-Jordan." })]);
ejemplo4(2, "Método de Cramer: determinado", "Resolver 2x₁ + x₂ = 3; x₁ + 5x₂ = 6 por el método de Cramer.",
  [S("", [[2, 1], [1, 5]], [3, 6], "det", { x: [1, 1], det: 9, cramer: true, noEq: true, sol: "|A| = 2·5 − 1·1 = 9 ≠ 0, así que r(A) = 2. x₁ = |A₁|/|A| = 9/9 = 1 y x₂ = |A₂|/|A| = 9/9 = 1." })]);
ejemplo4(3, "Método de Cramer: incompatible", "Resolver 2x₁ + x₂ = 3; 4x₁ + 2x₂ = 5. Aquí |A| = 0.",
  [S("", [[2, 1], [4, 2]], [3, 5], "inc", { det: 0, noEq: true, sol: "r(MP) = 1 ≠ r(MA) = 2: no se cumple Rouché-Frobenius. Con |A₁| = 1 y |A₂| = −2, los cocientes 1/0 y −2/0 no existen: sistema incompatible." })]);
ejemplo4(4, "Método de Cramer: indeterminado", "Resolver 2x₁ + x₂ = 3; 4x₁ + 2x₂ = 6. Aquí |A| = 0 pero también |A₁| = |A₂| = 0.",
  [S("", [[2, 1], [4, 2]], [3, 6], "ind", { det: 0, p: [3 / 2, 0], N: [[-1 / 2, 1]], noEq: true, sol: "r(MP) = r(MA) = 1 < 2: compatible indeterminado. Cramer no da la solución; hay que usar Gauss o Gauss-Jordan." })]);
ejemplo4(5, "Método matricial (X = A⁻¹·B)", "Resolver x₁ − 2x₂ = −1; −2x₁ + 4x₂ = 6 por el método matricial.",
  [S("", [[1, -2], [-2, 4]], [-1, 6], "inc", { det: 0, noEq: true,
    note: "El apunte dice |A| = 8 ≠ 0, da una inversa [1/2 1/4; 1/4 3/8] y concluye (1, 2). Pero |A| = 4 − 4 = 0: A no tiene inversa y el sistema es incompatible (la fila 2 es −2 veces la fila 1, pero 6 ≠ −2·(−1)). El método matricial solo vale si |A| ≠ 0.",
    sol: "|A| = 1·4 − (−2)(−2) = 0 ⇒ A no es inversible ⇒ el método matricial no se puede aplicar." })]);
ejemplo4(6, "Método matricial con la adjunta (3×3)", "Resolver x + y + z = 0; 2x − 5y − 3z = 10; 4x + 8y + 2z = 4 calculando A⁻¹ por cofactores y luego X = A⁻¹·B.",
  [{ l: "", cmds: ["A=[1,1,1;2,-5,-3;4,8,2]", "B=[0;10;4]", "d=Det(A)", "Ai=Inversa(A)", "X=Ai*B"], focus: "X",
    expect: { d: 34, X: COL([2, 0, -2]) }, ans: "|A| = 34 ≠ 0, r(MP) = r(MA) = 3: compatible determinado. X = (2, 0, −2).",
    note: "En el apunte la tercera componente figura como z = 2 en el producto A⁻¹·B, pero 36·0/34 + (−4)·10/34 + (−7)·4/34 = −68/34 = −2. La solución es (2, 0, −2), como dice el planteo de Gauss del ejemplo siguiente." }]);
ejemplo4(7, "Método de Gauss (determinado)", "Resolver x₁ − 2x₂ + 3x₃ = 11; 4x₁ + x₂ − x₃ = 4; 2x₁ − x₂ + 3x₃ = 10.",
  [S("", [[1, -2, 3], [4, 1, -1], [2, -1, 3]], [11, 4, 10], "det", { x: [2, -3, 1], noEq: true,
    note: "En el apunte la matriz ampliada de este ejemplo muestra un 11 en la primera fila de coeficientes (donde va un 1); el sistema correcto es el del enunciado.",
    sol: "r(MP) = r(MA) = n = 3: compatible determinado, solución única (2, −3, 1)." })]);
ejemplo4(8, "Método de Gauss (indeterminado)", "Resolver x₁ + 2x₂ − 2x₃ = 3; 2x₁ − 5x₂ + 4x₃ = 6; −x₁ + 16x₂ − 14x₃ = −3.",
  [S("", [[1, 2, -2], [2, -5, 4], [-1, 16, -14]], [3, 6, -3], "ind", { p: [3, 0, 0], N: [[2 / 9, 8 / 9, 1]], noEq: true,
    sol: "r(MP) = r(MA) = 2 < 3: infinitas soluciones. Con x₃ = t: x₁ = 3 + (2/9)t, x₂ = (8/9)t. En forma vectorial (x₁; x₂; x₃) = (3; 0; 0) + t(2/9; 8/9; 1). Si t = 1 se obtiene (29/9; 8/9; 1)." })]);
ejemplo4(9, "Gauss con columna de control (CC)", "Resolver x + y + z = 0; 2x − 5y − 3z = 10; 4x + 8y + 2z = 4 con Gauss, agregando la columna de control (suma de cada fila) para verificar las operaciones.",
  [S("", [[1, 1, 1], [2, -5, -3], [4, 8, 2]], [0, 10, 4], "det", { x: [2, 0, -2], noEq: true, sol: "En cada paso la columna CC debe seguir siendo la suma de la fila. Rangos: 3 = 3 = 3, compatible determinado. Seleccioná <b>X</b> para ver los pasos con CC." })]);
ejemplo4(10, "Método de Gauss-Jordan (determinado)", "Resolver x₁ + x₂ + x₃ = 6; x₁ − x₂ − x₃ = −4; x₁ + x₂ − x₃ = 0.",
  [S("", [[1, 1, 1], [1, -1, -1], [1, 1, -1]], [6, -4, 0], "det", { x: [1, 2, 3], noEq: true, sol: "La matriz reducida es [I | (1; 2; 3)]: solución única (1, 2, 3)." })]);
ejemplo4(11, "Gauss-Jordan: incompatible (4×4)", "Resolver x₁ + x₂ + x₃ + x₄ = 3; x₁ − x₂ − 2x₃ − x₄ = 0; 2x₁ + 3x₃ = 5; 2x₂ − x₃ + 2x₄ = 3.",
  [S("", [[1, 1, 1, 1], [1, -1, -2, -1], [2, 0, 3, 0], [0, 2, -1, 2]], [3, 0, 5, 3], "inc", { noEq: true,
    note: "El apunte indica r(MP) = 2 ≠ r(MA) = 3. Con los datos impresos los rangos son r(MP) = 3 y r(MA) = 4 (la fila 4 queda 0 = 2 como dice el apunte, pero hay una fila no nula más). La conclusión —sistema incompatible— no cambia.",
    sol: "Aparece una fila (0 0 0 0 | c) con c ≠ 0: 0 = c es imposible." })]);
ejemplo4(12, "No homogéneo e indeterminado", "Resolver 4x − 6y − 2z = 4; 3x + y − z = −2; −x + 7y + z = −6.",
  [S("", [[4, -6, -2], [3, 1, -1], [-1, 7, 1]], [4, -2, -6], "ind", { p: [-4 / 11, -10 / 11, 0], N: [[4 / 11, -1 / 11, 1]], vars: ["x", "y", "z"], noEq: true,
    sol: "r(MP) = r(MA) = 2 < 3 = n. Con z = t: (x; y; z) = (−4/11; −10/11; 0) + t(4/11; −1/11; 1)." })]);
ejemplo4(13, "Sistema homogéneo", "Resolver x₁ + x₂ + 5x₃ − 4x₄ = 0; 2x₁ + x₂ + 7x₃ − 3x₄ = 0.",
  [S("", [[1, 1, 5, -4], [2, 1, 7, -3]], [0, 0], "ind", { p: [0, 0, 0, 0], N: [[-2, -3, 1, 0], [-1, 5, 0, 1]], noEq: true,
    note: "El apunte escribe la reducida como [1 0 2 −2; 0 1 3 1] y la solución (−2t + 2s; −3t − s; t; s). La reducida correcta es [1 0 2 1; 0 1 3 −5], de donde x₁ = −2t − s y x₂ = −3t + 5s. Se comprueba reemplazando: 1·(−2) + 1·(−3) + 5·1 = 0 y 2·(−2) + (−3) + 7 = 0.",
    sol: "Todo homogéneo es compatible. Como r = 2 < 4, hay infinitas soluciones con 2 parámetros (x₃ = t, x₄ = s)." })]);
ejemplo4(14, "Aplicación: precios de conservas", "Una tienda tiene conservas A, B y C. El precio medio de las 3 es $0,90. Un cliente compra 30 de A, 20 de B y 10 de C y paga $56; otro compra 20 de A y 25 de C y paga $31. Hallar el precio de cada una.",
  [S("", [[1, 1, 1], [30, 20, 10], [20, 0, 25]], [2.7, 56, 31], "det", { x: [0.8, 1.3, 0.6], noEq: true, sol: "De (x₁ + x₂ + x₃)/3 = 0,90 sale x₁ + x₂ + x₃ = 2,7. A cuesta $0,80, B $1,30 y C $0,60." })]);
ejemplo4(15, "Aplicación: coches vendidos", "Tres modelos se venden a 1,5; 2 y 3 millones, con costos de fabricación 1; 1,5 y 2 millones. Se vendieron 140 coches por 250 millones y el costo total fue de 175 millones. ¿Cuántos de cada modelo?",
  [S("", [[1, 1, 1], [1.5, 2, 3], [1, 1.5, 2]], [140, 250, 175], "det", { x: [80, 50, 10], noEq: true, sol: "80 coches del modelo A, 50 del B y 10 del C." })]);
ejemplo4(16, "Aplicación: producción con stock", "Los productos A, B y C consumen por semana 1, 3, 2 / 1, 4, 1 / 2, 5, 5 unidades de tres elementos, y hay stock de 25.000, 20.000 y 55.000. ¿Cuánto se puede producir?",
  [S("", [[1, 3, 2], [1, 4, 1], [2, 5, 5]], [25000, 20000, 55000], "ind", { p: [40000, -5000, 0], N: [[-5, 1, 1]], noEq: true,
    sol: "Es compatible indeterminado: x₁ = 40.000 − 5x₃, x₂ = x₃ − 5.000. Como no puede haber producciones negativas, 5.000 ≤ x₃ ≤ 8.000. Por ejemplo, x₃ = 6.000 da x₁ = 10.000 y x₂ = 1.000." })]);
EX4.push({ id: "u4x17", kind: "ej", unit: 4, n: 17, title: "Aplicación: fotos con cámara digital", tag: TAG,
  text: "Cada foto de calidad normal ocupa 0,2 MB y cada foto óptima ocupa A MB. Se imprimieron 24 fotos que ocuparon 9,2 MB. Plantear el sistema en función de A: x₁ + x₂ = 24; 0,2x₁ + A·x₂ = 9,2.",
  items: [
    { l: "A = 0,2", cmds: ["k=0.2", "M=[1,1;0.2,k]", "R=[24;9.2]", "d=Det(M)", "t=Clasificar(M,R)"], focus: "t", expect: { d: 0, t: "Incompatible" }, ans: "|MP| = A − 0,2 = 0 y las filas de la ampliada no son proporcionales: sistema incompatible. Una foto óptima no puede ocupar 0,2 MB." },
    { l: "A = 0,5", cmds: ["k=0.5", "M=[1,1;0.2,k]", "R=[24;9.2]", "d=Det(M)", "t=Clasificar(M,R)"], focus: "t", expect: { d: 0.3, t: "Compatible determinado" }, ans: "Si A ≠ 0,2 el sistema es compatible determinado: el número de fotos de cada tipo es único, así que la semana anterior fue igual." },
  ] });
ejemplo4(18, "Aplicación: balance de una ecuación química", "Balancear x₁C₃H₈ + x₂O₂ → x₃CO₂ + x₄H₂O. Por átomos: C: 3x₁ = x₃; H: 8x₁ = 2x₄; O: 2x₂ = 2x₃ + x₄.",
  [{ l: "", cmds: ["A=[3,0,-1,0;8,0,0,-2;0,2,-2,-1]", "t=Nucleo(A)", "x=Balancear(A)"], focus: "x", expect: { t: TR([[1 / 4, 5 / 4, 3 / 4, 1]]), x: COL([1, 5, 3, 4]) }, ans: "Con x₄ = t: (x₁; x₂; x₃; x₄) = t(1/4; 5/4; 3/4; 1). Para coeficientes enteros t = 4: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O." }]);
ejemplo4(19, "Aplicación: edades", "Hace 5 años la edad de mi padre era el triple que la de mi hermano y dentro de 5 años será el doble. P − 5 = 3(H − 5); P + 5 = 2(H + 5).",
  [S("", [[1, -3], [1, -2]], [-10, 5], "det", { x: [35, 15], vars: ["P", "H"], noEq: true, sol: "Ordenando: P − 3H = −10 y P − 2H = 5. Mi padre tiene 35 años y mi hermano 15." })]);
ejemplo4(20, "Aplicación: tanque con tres conductos", "Un tanque se llena por A y B en 70 min, por A y C en 84 min y por B y C en 140 min. El apunte plantea A + B = 70, A + C = 84, B + C = 140.",
  [S("", [[1, 1, 0], [1, 0, 1], [0, 1, 1]], [70, 84, 140], "det", { x: [7, 63, 77], vars: ["A", "B", "C"], noEq: true,
    note: "Así planteado se suman tiempos, que no es lo que ocurre físicamente (se suman los caudales 1/t). El sistema da A = 7, B = 63, C = 77, que es la respuesta del apunte; el modelo con caudales está en el ejercicio 59." })]);
ejemplo4(21, "Aplicación: examen tipo test", "Cada respuesta correcta suma 1 punto y cada incorrecta resta 0,5. Hay 100 preguntas y la nota es 80,5. C + I = 100; C − 0,5I = 80,5.",
  [S("", [[1, 1], [1, -0.5]], [100, 80.5], "det", { x: [87, 13], vars: ["C", "I"], noEq: true, sol: "87 correctas y 13 incorrectas." })]);

/* ---------- Ejercicios para resolver ---------- */
const ZERO3 = [0, 0, 0], H = (n) => Array(n).fill(0);
const XYZ = ["x", "y", "z"];

ejercicio4(1, "Rouché-Frobenius y resolución", "Analizar el sistema por Rouché-Frobenius y resolverlo por el método que se desee:",
  [S("", [[2, 3, -2], [-3, 1, -3], [1, 7, -7]], [-1, 0, -2], "ind", { p: [-1 / 11, -3 / 11, 0], N: [[-7 / 11, 12 / 11, 1]], ans: "r(MP) = r(MA) = 2 < 3: compatible indeterminado. X = t(−7/11; 12/11; 1) + (−1/11; −3/11; 0), con x₃ = t." })]);
ejercicio4(2, "Cinco sistemas: ¿tienen solución?", "Determinar si tienen o no solución. Si la tienen, indicar si es determinada o indeterminada y dar la solución (excluyendo la trivial en los homogéneos que lo permitan).",
  [S("A", [[2, -5, 4], [1, -2, 1], [1, -4, 6]], [-3, 5, 10], "det", { x: [124, 75, 31], vars: XYZ }),
   S("B", [[2, -5, 4], [1, -2, 1], [1, -4, 5]], [-3, 5, 10], "inc", { vars: XYZ }),
   S("C", [[2, -7, -1], [-4, 5, -7], [1, -2, 1]], [4, -2, 1], "ind", { p: [-1 / 3, -2 / 3, 0], N: [[-3, -1, 1]], vars: XYZ }),
   S("D", [[1, 1, 1], [3, -3, -1], [1, 7, -3]], [0, 0, 0], "det", { x: ZERO3, vars: XYZ }),
   S("E", [[4, -1, 1], [1, 2, -1], [3, -3, 2]], [0, 0, 0], "ind", { p: ZERO3, N: [[-1 / 9, 5 / 9, 1]], vars: XYZ })]);
ejercicio4(3, "Resolver cuatro sistemas", "Resolver los siguientes sistemas de ecuaciones lineales:",
  [S("A", [[2, 3, -1], [2, -5, -3], [6, 1, -5]], [-2, 6, 4], "inc", { vars: XYZ }),
   S("B", [[3, 4, -2, 1], [2, 3, 6, -5], [-3, -1, 5, 4]], [5, 6, -2], "ind", { p: [1, 2 / 3, 1 / 3, 0], N: [[11 / 3, -23 / 9, 8 / 9, 1]], vars: ["x", "y", "z", "w"] }),
   S("C", [[3, -2, 1], [-1, -1, 5]], [0, -8], "ind", { p: [16 / 5, 24 / 5, 0], N: [[9 / 5, 16 / 5, 1]], vars: XYZ }),
   S("D", [[2, 5, 4], [1, -1, 1], [1, 6, 2], [4, 10, 8]], [0, 0, 0, 0], "det", { x: ZERO3 })]);
ejercicio4(4, "Valor de q: compatible o incompatible", E("Calcular el valor de q para que el sistema", "7x₂ − 10x₃ = 3", "2x₁ − 3x₂ + 4x₃ = 7", "x₁ + 2x₂ − 3x₃ = q", "sea A) compatible; B) incompatible."),
  [S("A) q = 5", "[0,7,-10;2,-3,4;1,2,-3]", "[3;7;q]", "ind", { pre: ["q=5"], p: [29 / 7, 3 / 7, 0], N: [[1 / 7, 10 / 7, 1]], ans: "Si q = 5 el sistema es compatible (indeterminado). Se obtiene al hacer 2·(fila 3) − (fila 2): 7x₂ − 10x₃ = 2q − 7, que coincide con la primera ecuación solo si 2q − 7 = 3." }),
   S("B) q = 0", "[0,7,-10;2,-3,4;1,2,-3]", "[3;7;q]", "inc", { pre: ["q=0"], ans: "Si q ≠ 5 el sistema es incompatible." })]);
ejercicio4(5, "Valor de K para solución no trivial", E("Determinar K para que el sistema homogéneo tenga solución no trivial:", "Kx₁ + 4x₂ − x₃ = 0", "2x₁ − 2x₂ + Kx₃ = 0", "x₁ + 2x₂ − 2x₃ = 0"),
  [S("K = 5", "[K,4,-1;2,-2,K;1,2,-2]", "[0;0;0]", "ind", { pre: ["K=5"], det: 0, p: ZERO3, N: [[-1, 3 / 2, 1]], ans: "|A| = −2(K − 5)(K + 1) = 0 si K = 5 o K = −1. Con K = 5: X = t(−1; 3/2; 1)." }),
   S("K = −1", "[K,4,-1;2,-2,K;1,2,-2]", "[0;0;0]", "ind", { pre: ["K=-1"], det: 0, p: ZERO3, N: [[1, 1 / 2, 1]], ans: "Con K = −1: X = t(1; 1/2; 1)." }),
   S("K = 0", "[K,4,-1;2,-2,K;1,2,-2]", "[0;0;0]", "det", { pre: ["K=0"], det: 10, x: ZERO3, ans: "Con cualquier otro K (por ejemplo K = 0, |A| = 10) solo existe la solución trivial." })]);
ejercicio4(6, "Productos vectoriales: u ∧ x = w", "Sean u = (−1; 3; 2) y w = (1; 1; −1). Hallar todos los x que cumplen u ∧ x = w (después de ver producto vectorial). Al desarrollar el producto vectorial componente a componente resulta un sistema lineal en x₁, x₂, x₃.",
  [S("", [[0, -2, 3], [2, 0, 1], [-3, -1, 0]], [1, 1, -1], "ind", { p: [1 / 2, -1 / 2, 0], N: [[-1 / 2, 3 / 2, 1]], noEq: true,
    sol: "u ∧ x = (3x₃ − 2x₂; 2x₁ + x₃; −3x₁ − x₂) = (1; 1; −1). Es compatible indeterminado: x = (1/2; −1/2; 0) + x₃(−1/2; 3/2; 1)." })]);
ejercicio4(7, "¿Es combinación lineal?", "Dados u = (2; 5; 1), v = (−2; 5; 1) y w = (−2; −10; 1), comprobar si r = (−6; 0; 3) es combinación lineal de ellos y hallar los escalares. Se plantea k₁u + k₂v + k₃w = r (los vectores van como columnas).",
  [S("", [[2, -2, -2], [5, 5, -10], [1, 1, 1]], [-6, 0, 3], "det", { x: [0, 2, 1], vars: ["k₁", "k₂", "k₃"], ans: "k₁ = 0, k₂ = 2, k₃ = 1: r = 0u + 2v + 1w." })]);
ejercicio4(8, "a + b y a − b", "Hallar a = (a₁; a₂) y b = (b₁; b₂) tales que a + b = (1; 0) y a − b = (0; 1). Luego expresar (2; −1) como combinación lineal de a y b.",
  [S("1) a y b", [[1, 0, 1, 0], [0, 1, 0, 1], [1, 0, -1, 0], [0, 1, 0, -1]], [1, 0, 0, 1], "det", { x: [1 / 2, 1 / 2, 1 / 2, -1 / 2], vars: ["a₁", "a₂", "b₁", "b₂"], ans: "a = (1/2; 1/2) y b = (1/2; −1/2)." }),
   S("2) (2; −1)", "[1/2,1/2;1/2,-1/2]", "[2;-1]", "det", { x: [1, 3], vars: ["λ₁", "λ₂"], noEq: true, ans: "(2; −1) = 1·a + 3·b (λ₁ = 1, λ₂ = 3)." })]);
const A9 = [[1, 1, 1], [1, -1, 1], [2, -1, -2]];
ejercicio4(9, "Tres vectores de ℝ³", "Sean a, b y c vectores de ℝ³ tales que a + b + c = (1; 0; 0), a − b + c = (0; 1; 0) y 2a − b − 2c = (0; 0; 1). Hallar sus componentes. Cada componente (x, y, z) da un sistema con la misma matriz y tres incógnitas (aᵢ, bᵢ, cᵢ).",
  [S("componente x", A9, [1, 0, 0], "det", { x: [3 / 8, 1 / 2, 1 / 8], vars: ["a₁", "b₁", "c₁"] }),
   S("componente y", A9, [0, 1, 0], "det", { x: [1 / 8, -1 / 2, 3 / 8], vars: ["a₂", "b₂", "c₂"] }),
   S("componente z", A9, [0, 0, 1], "det", { x: [1 / 4, 0, -1 / 4], vars: ["a₃", "b₃", "c₃"], ans: "Juntando: a = (3/8; 1/8; 2/8), b = (1/2; −1/2; 0), c = (1/8; 3/8; −2/8)." })]);
ejercicio4(10, "Productos vectoriales: u ∧ y = v", "Sean u = (−1; 3; 2) y v = (1; 1; −1). Encontrar todos los y = (y₁; y₂; y₃) tales que u ∧ y = v.",
  [S("", [[0, -2, 3], [2, 0, 1], [-3, -1, 0]], [1, 1, -1], "ind", { p: [1 / 2, -1 / 2, 0], N: [[-1 / 2, 3 / 2, 1]], noEq: true, sol: "Es el mismo sistema del ejercicio 6 (v = w): y = (1/2; −1/2; 0) + t(−1/2; 3/2; 1)." })]);
ejercicio4(11, "Combinación lineal de u, v, w", "Sean u = (2; 0; 1), v = (3; 2; 0) y w = (1; 0; 3). A) Hallar la combinación lineal con escalares 2, −1, 3. B) Verificar si (−3; −4; −1) es combinación lineal de u, v, w y hallar los escalares.",
  [{ l: "A", cmds: ["u=(2,0,1)", "v=(3,2,0)", "w=(1,0,3)", "x=2u-v+3w"], focus: "x", expect: { x: [4, -2, 11] }, ans: "x = 2u − v + 3w = (4; −2; 11)." },
   S("B", [[2, 3, 1], [0, 2, 0], [1, 0, 3]], [-3, -4, -1], "det", { x: [2, -2, -1], vars: ["λ₁", "λ₂", "λ₃"], ans: "Sí: λ₁ = 2, λ₂ = −2, λ₃ = −1." })]);
ejercicio4(12, "Escalares m y n según el gráfico", "En el gráfico los vectores son a = (1; 3), b = (3; 3) y c = (2; 1). Hallar los escalares m y n tales que a) m·a + n·b = c; b) m·a + n·b = 0.",
  [S("a", [[1, 3], [3, 3]], [2, 1], "det", { x: [-1 / 2, 5 / 6], vars: ["m", "n"], ans: "m = −1/2 y n = 5/6.", sol: "Las columnas de A son a y b. |A| = −6 ≠ 0, así que la solución es única." }),
   S("b", [[1, 3], [3, 3]], [0, 0], "det", { x: [0, 0], vars: ["m", "n"], ans: "m = 0 y n = 0 (a y b son linealmente independientes)." })]);
ejercicio4(13, "¿Ecuaciones lineales?", "¿Cuáles de las siguientes ecuaciones en x₁, x₂ y x₃ son ecuaciones lineales? (k es una constante)",
  [{ l: "a", cmds: [], ans: "No: contiene el producto x₁x₂." }, { l: "b", cmds: [], ans: "Sí: x₁ + x₂ + x₃ = sen k, porque sen k es una constante." },
   { l: "c", cmds: [], ans: "No: x₃ está elevada al cuadrado." }, { l: "d", cmds: [], ans: "Sí: x₁ = 2x₃ − x₂ + 7 se puede escribir x₁ + x₂ − 2x₃ = 7." },
   { l: "e", cmds: [], ans: "No: aparece (x₂)⁻¹." }, { l: "f", cmds: [], ans: "Sí: x₁ − x₃ = 0." }]);
ejercicio4(14, "Conjunto solución de una ecuación", "Hallar el conjunto solución de cada ecuación (una sola ecuación con varias incógnitas).",
  [S("a) 6x − 7y = 3", [[6, -7]], [3], "ind", { p: [1 / 2, 0], N: [[7 / 6, 1]], vars: ["x", "y"], ans: "y = (6/7)x − 3/7. Con x = t: y = (6/7)t − 3/7, t ∈ ℝ. (La app despeja x: (1/2; 0) + s(7/6; 1).)" }),
   S("b) 2x₁ + 4x₂ − 7x₃ = 8", [[2, 4, -7]], [8], "ind", { p: [4, 0, 0], N: [[-2, 1, 0], [7 / 2, 0, 1]], ans: "x₁ = −2x₂ + (7/2)x₃ + 4, con x₂ = t y x₃ = s." }),
   S("c) −3x₁ + 4x₂ − 7x₃ + 8x₄ = 5", [[-3, 4, -7, 8]], [5], "ind", { p: [-5 / 3, 0, 0, 0], N: [[4 / 3, 1, 0, 0], [-7 / 3, 0, 1, 0], [8 / 3, 0, 0, 1]], ans: "x₁ = (4/3)x₂ − (7/3)x₃ + (8/3)x₄ − 5/3." }),
   S("d) 2v − w + 3x + y − 4z = 0", [[2, -1, 3, 1, -4]], [0], "ind", { p: H(5), N: [[1 / 2, 1, 0, 0, 0], [-3 / 2, 0, 1, 0, 0], [-1 / 2, 0, 0, 1, 0], [2, 0, 0, 0, 1]], vars: ["v", "w", "x", "y", "z"], ans: "v = (1/2)w − (3/2)x − (1/2)y + 2z." })]);
ejercicio4(15, "Cramer", "Resolver por el método de Cramer: 3x − 4y = 20; −5x + 4y = −36.",
  [S("", [[3, -4], [-5, 4]], [20, -36], "det", { x: [8, 1], det: -8, cramer: true, vars: ["x", "y"], ans: "|A| = −8, |A₁| = −64, |A₂| = −8: x = 8, y = 1." })]);
ejercicio4(16, "Gauss", "Resolver por el método de Gauss: 10x − 15y = 0; 3x − 4y = 1.",
  [S("", [[10, -15], [3, -4]], [0, 1], "det", { x: [3, 2], vars: ["x", "y"], ans: "x = 3, y = 2." })]);
ejercicio4(17, "Cuatro incógnitas, tres ecuaciones", "Resolver el sistema (incógnitas w, x, y, z):",
  [S("", [[2, -4, 3, -1], [-1, 2, -5, 3], [3, -6, -1, -1]], [3, 0, 0], "ind", { p: [1, 0, 1, 2], N: [[2, 1, 0, 0]], vars: ["w", "x", "y", "z"], ans: "Con x = t: w = 1 + 2t, x = t, y = 1, z = 2: (w; x; y; z) = (1; 0; 1; 2) + t(2; 1; 0; 0)." })]);
ejercicio4(18, "Cinco ecuaciones, cinco incógnitas", "Resolver el sistema (incógnitas x, y, z, u, t):",
  [S("", [[1, 0, 5, -2, 1], [0, 4, -3, 7, 0], [-9, 8, 0, 10, 0], [2, 20, -13, 0, 1], [5, 4, 3, 2, 4]], [10, -14, 31, -2, 1], "det", { x: [-5, 3 / 4, 1, -2, 6], vars: ["x", "y", "z", "u", "t"], ans: "x = −5, y = 3/4, z = 1, u = −2, t = 6." })]);
ejercicio4(19, "Sistema incompatible", "Resolver el sistema:",
  [S("", [[2, -5, 4], [1, -2, 1], [1, -4, 5]], [-3, 5, 10], "inc", { vars: XYZ, ans: "Sistema incompatible: el rango de la matriz principal es distinto del de la ampliada." })]);
ejercicio4(20, "Homogéneo con infinitas soluciones", "Resolver el sistema:",
  [S("", [[1, 1, -1], [3, -3, -1], [1, 7, -3]], [0, 0, 0], "ind", { p: ZERO3, N: [[2 / 3, 1 / 3, 1]], ans: "X = t(2/3; 1/3; 1), con x₃ = t." })]);
ejercicio4(21, "Homogéneo: solo la trivial", "Resolver el sistema:",
  [S("", [[4, -1, 1], [1, 2, -1], [3, 1, 5]], [0, 0, 0], "det", { x: ZERO3, vars: XYZ, ans: "Sistema homogéneo que solo admite la solución trivial x = y = z = 0." })]);
ejercicio4(22, "Homogéneo 3×4", "Resolver el sistema (incógnitas w, x, y, z):",
  [S("", [[7, -3, 1, -7], [1, 2, -1, -1], [3, 3, 5, -3]], [0, 0, 0], "ind", { p: H(4), N: [[1, 0, 0, 1]], vars: ["w", "x", "y", "z"], ans: "(w; x; y; z) = z(1; 0; 0; 1)." })]);
ejercicio4(23, "Ecuación matricial A·K·B = C", "Dadas A = [1 4; −2 3; 1 −2], B = [2 0 0; 0 1 −1] y C = [8 6 −6; 6 −1 1; −4 0 0], hallar las componentes de K tal que A·K·B = C. Igualando las 9 componentes aparece un sistema en k₁₁, k₁₂, k₂₁, k₂₂.",
  [S("Sistema", [[2, 0, 8, 0], [0, 1, 0, 4], [0, -1, 0, -4], [-4, 0, 6, 0], [0, -2, 0, 3], [0, 2, 0, -3], [2, 0, -4, 0], [0, 1, 0, -2], [0, -1, 0, 2]], [8, 6, -6, 6, -1, 1, -4, 0, 0], "det", { x: [0, 2, 1, 1], vars: ["k₁₁", "k₁₂", "k₂₁", "k₂₂"], noEq: true, ans: "k₁₁ = 0, k₁₂ = 2, k₂₁ = 1, k₂₂ = 1." }),
   { l: "Verificar", cmds: ["A=[1,4;-2,3;1,-2]", "B=[2,0,0;0,1,-1]", "C=[8,6,-6;6,-1,1;-4,0,0]", "K=[0,2;1,1]", "P=A*K*B", "t=Igual(P,C)"], focus: "t", expect: { t: "Son iguales" }, ans: "K = [0 2; 1 1] y A·K·B = C." }]);
ejercicio4(24, "Gauss-Jordan 3×4", "Resolver por Gauss-Jordan (incógnitas x, y, z, t):",
  [S("", [[2, 3, 1, 3], [1, 5, 2, -3], [3, -2, -1, 6]], [-2, 6, -8], "ind", { p: [0, -10, 28, 0], N: [[0, -9, 24, 1]], vars: ["x", "y", "z", "t"], ans: "x = 0, y = −9t − 10, z = 24t + 28." })]);
ejercicio4(25, "Valor de k para que tenga solución", E("Elegir k de modo que el sistema tenga solución:", "2x₁ − x₂ + x₃ + x₄ = 1", "x₁ + 2x₂ − x₃ + 4x₄ = 2", "x₁ + 7x₂ − 4x₃ + 11x₄ = k"),
  [S("k = 5", "[2,-1,1,1;1,2,-1,4;1,7,-4,11]", "[1;2;k]", "ind", { pre: ["k=5"], p: [4 / 5, 3 / 5, 0, 0], N: [[-1 / 5, 3 / 5, 1, 0], [-6 / 5, -7 / 5, 0, 1]], ans: "Si k = 5 es compatible indeterminado: x₁ = −(1/5)x₃ − (6/5)x₄ + 4/5 y x₂ = (3/5)x₃ − (7/5)x₄ + 3/5." }),
   S("k = 0", "[2,-1,1,1;1,2,-1,4;1,7,-4,11]", "[1;2;k]", "inc", { pre: ["k=0"], ans: "Si k ≠ 5 el sistema es incompatible." })]);
ejercicio4(26, "Condición sobre k: solución no trivial", E("¿Qué condición debe cumplir k para que el sistema admita solución distinta de la trivial?", "2x + y + z = 0", "0x + ky − z = 0", "x − 2y + z = 0"),
  [S("k = 5", "[2,1,1;0,k,-1;1,-2,1]", "[0;0;0]", "ind", { pre: ["k=5"], det: 0, p: ZERO3, N: [[-3 / 5, 1 / 5, 1]], ans: "|A| = k − 5: hay solución no trivial si y solo si k = 5." }),
   S("k = 1", "[2,1,1;0,k,-1;1,-2,1]", "[0;0;0]", "det", { pre: ["k=1"], det: -4, x: ZERO3, ans: "Si k ≠ 5, solo la solución trivial." })]);
ejercicio4(27, "Valores de k: sin solución, única, infinitas", E("¿Para qué valores de k el sistema", "x − y = 3", "2x − 2y = k", "a) no tiene solución; b) tiene exactamente una; c) tiene infinitas?"),
  [S("k = 6", "[1,-1;2,-2]", "[3;k]", "ind", { pre: ["k=6"], p: [3, 0], N: [[1, 1]], ans: "Si k = 6: compatible indeterminado, infinitas soluciones." }),
   S("k = 0", "[1,-1;2,-2]", "[3;k]", "inc", { pre: ["k=0"], ans: "Si k ≠ 6: incompatible. No existe ningún k que dé solución única, porque |A| = 0." })]);
ejercicio4(28, "Tres rectas en el plano", "Considerar ax + by = k; cx + dy = l; ex + fy = m. Analizar la posición relativa de las tres rectas cuando el sistema (I) no tiene solución; (II) tiene exactamente una; (III) tiene infinitas. Los incisos muestran un ejemplo de cada caso.",
  [S("I", [[1, 1], [1, 1], [1, -1]], [1, 2, 0], "inc", { vars: ["x", "y"], ans: "Las rectas no tienen un punto común (aquí dos son paralelas y la tercera las corta).", note: "Ejemplo propio para ilustrar el caso; el apunte solo da la respuesta general." }),
   S("II", [[1, 0], [0, 1], [1, 1]], [1, 1, 2], "det", { x: [1, 1], vars: ["x", "y"], ans: "Las tres rectas se cortan exactamente en un punto (1; 1).", note: "Ejemplo propio para ilustrar el caso." }),
   S("III", [[1, 1], [2, 2], [3, 3]], [1, 2, 3], "ind", { p: [1, 0], N: [[-1, 1]], vars: ["x", "y"], ans: "Las tres rectas coinciden.", note: "Ejemplo propio para ilustrar el caso." })]);
ejercicio4(29, "Condición de compatibilidad", E("Demostrar qué valor debe tomar c en función de a y b para que el sistema sea compatible:", "x + y + 2z = a", "x + z = b", "2x + y + 3z = c"),
  [S("c = a + b", "[1,1,2;1,0,1;2,1,3]", "[a;b;c]", "ind", { pre: ["a=1", "b=2", "c=3"], p: [2, -1, 0], N: [[-1, -1, 1]], ans: "c = a + b: la fila 3 es la suma de las filas 1 y 2, así que los términos independientes deben cumplir lo mismo." }),
   S("c ≠ a + b", "[1,1,2;1,0,1;2,1,3]", "[a;b;c]", "inc", { pre: ["a=1", "b=2", "c=4"], ans: "Con c = 4 ≠ a + b = 3 el sistema es incompatible." })]);
ejercicio4(30, "Matrices ya reducidas", "En cada inciso la matriz ampliada se llevó a la forma reducida que se da. Expresar la solución.",
  [{ l: "a", cmds: ["M=[1,0,0,4;0,1,0,3;0,0,1,2]", "t=Clasificar(M)", "X=Resolver(M)"], focus: "X", expect: { t: "Compatible determinado", X: COL([4, 3, 2]) }, ans: "Compatible determinado: (x; y; z) = (4; 3; 2)." },
   { l: "b", cmds: ["M=[1,0,0,3,2;0,1,0,-1,4;0,0,1,1,2]", "t=Clasificar(M)", "p=Particular(M)", "N=Nucleo([1,0,0,3;0,1,0,-1;0,0,1,1])"], focus: "p", expect: { t: "Compatible indeterminado", p: COL([2, 4, 2, 0]), N: TR([[-3, 1, -1, 1]]) }, ans: "Compatible indeterminado: x = 2 − 3w, y = 4 + w, z = 2 − w. Con w = t: (2; 4; 2; 0) + t(−3; 1; −1; 1)." },
   { l: "c", cmds: ["M=[1,2,0,0;0,0,1,0;0,0,0,1]", "t=Clasificar(M)", "X=Resolver(M)"], focus: "X", expect: { t: "Incompatible", X: "Incompatible*" }, ans: "Incompatible: la última fila dice 0 = 1; el rango de la principal es menor que el de la ampliada." }]);
ejercicio4(31, "Resolver tres sistemas", "Resolver cada sistema:",
  [S("a", [[1, 1, 2], [-1, -2, 3], [3, -7, 4]], [8, 1, 10], "det", { x: [3, 1, 2] }),
   S("b", [[2, 2, 2], [-2, 5, 2], [-7, 7, 1]], [0, 0, 0], "ind", { p: ZERO3, N: [[-3 / 7, -4 / 7, 1]], ans: "Homogéneo, compatible indeterminado: X = t(−3/7; −4/7; 1)." }),
   S("c", [[1, -1, 2, -1], [2, 1, -2, -2], [-1, 2, -4, 1], [3, 0, 0, -3]], [-1, -2, 1, -3], "ind", { p: [-1, 0, 0, 0], N: [[0, 2, 1, 0], [1, 0, 0, 1]], vars: ["x", "y", "z", "w"], ans: "No homogéneo, compatible indeterminado: x = w − 1, y = 2z, con z = t y w = s: (−1; 0; 0; 0) + t(0; 2; 1; 0) + s(1; 0; 0; 1)." })]);
ejercicio4(32, "Sistemas con constantes a, b y c", "Resolver los sistemas, donde a, b y c son constantes. Los incisos evalúan la solución para valores concretos.",
  [S("I) a=1, b=2", "[2,1;3,6]", "[a;b]", "det", { pre: ["a=1", "b=2"], x: [4 / 9, 1 / 9], ans: "x = (2/3)a − (1/9)b; y = −(1/3)a + (2/9)b. Para a = 1, b = 2: (4/9; 1/9)." }),
   S("II) a=1, b=2, c=3", "[1,1,1;2,0,1;0,3,3]", "[a;b;c]", "det", { pre: ["a=1", "b=2", "c=3"], x: [0, -1, 2], ans: "x₁ = a − c/3; x₂ = 2a − b − c/3; x₃ = −2a + b + (2/3)c. Para (1, 2, 3): (0; −1; 2)." })]);
ejercicio4(33, "Clasificar según a", E("¿Para qué valores de a el sistema es compatible determinado, indeterminado o incompatible?", "x + 2y − 3z = 4", "3x − y + 5z = 2", "4x + y + (a² − 14)z = a + 2"),
  [S("a = 4", "[1,2,-3;3,-1,5;4,1,a^2-14]", "[4;2;a+2]", "ind", { pre: ["a=4"], p: [8 / 7, 10 / 7, 0], N: [[-1, 2, 1]], ans: "Si a = 4: compatible indeterminado." }),
   S("a = −4", "[1,2,-3;3,-1,5;4,1,a^2-14]", "[4;2;a+2]", "inc", { pre: ["a=-4"], ans: "Si a = −4: incompatible." }),
   S("a = 0", "[1,2,-3;3,-1,5;4,1,a^2-14]", "[4;2;a+2]", "det", { pre: ["a=0"], x: [25 / 28, 27 / 14, 1 / 4], ans: "Si a ≠ 4 y a ≠ −4 (por ejemplo a = 0): compatible determinado." })]);
ejercicio4(34, "Ecuación matricial para a, b, c y d", "Resolver la ecuación matricial [a − b, b + c; 3d + c, 2a − 4d] = [8, 1; 7, 6] para a, b, c y d. Igualando elemento a elemento: a − b = 8; b + c = 1; c + 3d = 7; 2a − 4d = 6.",
  [S("", [[1, -1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 3], [2, 0, 0, -4]], [8, 1, 7, 6], "det", { x: [5, -3, 4, 1], vars: ["a", "b", "c", "d"], ans: "a = 5, b = −3, c = 4, d = 1." })]);
ejercicio4(35, "Sistemas homogéneos", "Resolver los siguientes sistemas homogéneos:",
  [S("a", [[2, 1, 3], [1, 2, 0], [0, 1, 1]], [0, 0, 0], "det", { x: ZERO3 }),
   S("b", [[3, 1, 1, 1], [5, -1, 1, -1]], [0, 0], "ind", { p: H(4), N: [[-1 / 4, -1 / 4, 1, 0], [0, -1, 0, 1]], ans: "x₁ = −(1/4)x₃; x₂ = −(1/4)x₃ − x₄. Con x₃ = t y x₄ = s: t(−1/4; −1/4; 1; 0) + s(0; −1; 0; 1)." }),
   S("c", [[2, -4, 1, 1], [1, -5, 2, 0], [0, -3, 0, 1], [1, -2, -1, 1]], [0, 0, 0, 0], "det", { x: H(4) })]);
ejercicio4(36, "Valores de λ con solución no trivial", E("¿Para qué valores de λ el sistema homogéneo tiene soluciones no triviales?", "(λ − 3)x + y = 0", "x + (λ − 3)y = 0"),
  [S("λ = 4", "[λ-3,1;1,λ-3]", "[0;0]", "ind", { pre: ["λ=4"], det: 0, p: [0, 0], N: [[-1, 1]], ans: "|A| = (λ − 3)² − 1 = 0 ⇒ λ = 4 o λ = 2. Con λ = 4: X = t(−1; 1)." }),
   S("λ = 2", "[λ-3,1;1,λ-3]", "[0;0]", "ind", { pre: ["λ=2"], det: 0, p: [0, 0], N: [[1, 1]], ans: "Con λ = 2: X = t(1; 1)." }),
   S("λ = 0", "[λ-3,1;1,λ-3]", "[0;0]", "det", { pre: ["λ=0"], det: 8, x: [0, 0], ans: "Para otro λ solo existe la solución trivial." })]);
const A37a = [[1, 2, -3], [2, -3, 1], [5, -4, -1]], A37b = [[3, -1, 3], [2, 1, 2], [1, -3, 1]];
ejercicio4(37, "Relaciones entre los términos independientes", "Determinar las relaciones que deben cumplir y₁, y₂, y₃ para que los sistemas A·X = Y sean compatibles. a) Debe ser −y₁ − 2y₂ + y₃ = 0. b) Debe ser 7y₁ − 8y₂ − 5y₃ = 0. Los incisos prueban un Y que cumple la relación y otro que no.",
  [{ l: "a cumple", cmds: ["A=" + mx(A37a), "Y=[1;0;1]", "t=Clasificar(A,Y)", "r=Rango(A)"], focus: "t", expect: { t: "Compatible indeterminado", r: 2 }, ans: "Con Y = (1; 0; 1): −1 − 0 + 1 = 0, compatible. A tiene rango 2, por eso hay una relación entre las y." },
   { l: "a no cumple", cmds: ["A=" + mx(A37a), "Y=[1;0;0]", "t=Clasificar(A,Y)"], focus: "t", expect: { t: "Incompatible" }, ans: "Con Y = (1; 0; 0): −1 ≠ 0, incompatible." },
   { l: "b cumple", cmds: ["A=" + mx(A37b), "Y=[8;7;0]", "t=Clasificar(A,Y)", "r=Rango(A)"], focus: "t", expect: { t: "Compatible indeterminado", r: 2 }, ans: "Con Y = (8; 7; 0): 56 − 56 − 0 = 0, compatible." },
   { l: "b no cumple", cmds: ["A=" + mx(A37b), "Y=[1;0;0]", "t=Clasificar(A,Y)"], focus: "t", expect: { t: "Incompatible" }, ans: "Con Y = (1; 0; 0): 7 ≠ 0, incompatible." }]);
ejercicio4(38, "Condición sobre a: sin solución", E("Determinar las condiciones sobre a para que el sistema no tenga solución:", "7x₂ − 10x₃ = 4", "2x₁ − 3x₂ + 4x₃ = 4", "x₁ + 2x₂ − 3x₃ = a"),
  [S("a = 4", "[0,7,-10;2,-3,4;1,2,-3]", "[4;4;a]", "ind", { pre: ["a=4"], p: [20 / 7, 4 / 7, 0], N: [[1 / 7, 10 / 7, 1]], ans: "Con a = 4 hay solución (infinitas)." }),
   S("a = 0", "[0,7,-10;2,-3,4;1,2,-3]", "[4;4;a]", "inc", { pre: ["a=0"], ans: "Si a ≠ 4 el sistema no tiene solución." })]);
ejercicio4(39, "Condición sobre a: solución no trivial", "Determinar la condición sobre a para que el sistema homogéneo [1 −2 1; 2 1 1; 0 a −1]·[x; y; z] = [0; 0; 0] admita solución no trivial.",
  [S("a = 5", "[1,-2,1;2,1,1;0,a,-1]", "[0;0;0]", "ind", { pre: ["a=5"], det: 0, p: ZERO3, N: [[-3 / 5, 1 / 5, 1]], ans: "|A| = a − 5: solución no trivial si y solo si a = 5." }),
   S("a = 0", "[1,-2,1;2,1,1;0,a,-1]", "[0;0;0]", "det", { pre: ["a=0"], det: -5, x: ZERO3 })]);
ejercicio4(40, "Clasificar según a y b", E("¿Para qué valores de a y b el sistema es compatible determinado, indeterminado o incompatible?", "ax + 0y + 2z = 0", "5x + 2y + 0z = 1", "x − 2y + bz = 3"),
  [S("a=1, b=1 (ab ≠ 12)", "[a,0,2;5,2,0;1,-2,b]", "[0;1;3]", "det", { pre: ["a=1", "b=1"], det: -22, x: [8 / 11, -29 / 22, -4 / 11], ans: "Si ab ≠ 12 (|A| = 2ab − 24 ≠ 0): compatible determinado." }),
   S("a=3, b=4 (ab = 12)", "[a,0,2;5,2,0;1,-2,b]", "[0;1;3]", "inc", { pre: ["a=3", "b=4"], det: 0,
     note: "El apunte dice que con ab = 12 y a = 3 el sistema es compatible indeterminado, y con a ≠ 3 incompatible. Con los datos impresos, si ab = 12 el sistema es incompatible para todo a: de las dos primeras ecuaciones z = −(a/2)x e y = (1 − 5x)/2, y la tercera da 6x − 1 − 6x = −1 ≠ 3. Parece un error de impresión (con término independiente −1 en la tercera sería indeterminado)." }),
   S("a=2, b=6 (ab = 12)", "[a,0,2;5,2,0;1,-2,b]", "[0;1;3]", "inc", { pre: ["a=2", "b=6"], det: 0, ans: "También incompatible: ab = 12 siempre da incompatible con estos datos." })]);
ejercicio4(41, "Clasificar según m", E("¿Qué valor debe tomar m para que el sistema sea compatible determinado, indeterminado o incompatible?", "x₁ + x₂ + x₃ = m + 1", "m·x₁ + x₂ + (m − 1)x₃ = m", "0x₁ − (m − 1)x₂ + 0x₃ = −m"),
  [S("m = 1", "[1,1,1;m,1,m-1;0,-(m-1),0]", "[m+1;m;-m]", "inc", { pre: ["m=1"], ans: "Si m = 1: incompatible (la tercera ecuación dice 0 = −1)." }),
   S("m = 2", "[1,1,1;m,1,m-1;0,-(m-1),0]", "[m+1;m;-m]", "det", { pre: ["m=2"], x: [-1, 2, 2], ans: "Si m ≠ 1: compatible determinado. Con m = 2: (−1; 2; 2)." })]);
ejercicio4(42, "Clasificar según a, b y c", E("Averiguar qué valores deben tomar a, b y c para que el sistema sea compatible determinado, indeterminado o incompatible:", "2x₁ + a·x₂ + b·x₃ = c", "−2x₁ + 0x₂ + 0x₃ = −2", "−2x₁ − x₂ − x₃ = −1"),
  [S("a = b, c = 2 − a", "[2,a,b;-2,0,0;-2,-1,-1]", "[c;-2;-1]", "ind", { pre: ["a=1", "b=1", "c=1"], p: [1, -1, 0], N: [[0, -1, 1]], ans: "Si a = b y c = 2 − a: compatible indeterminado.",
     note: "El apunte escribe la condición como a = b = −2 + c. Despejando: con x₁ = 1 y x₂ + x₃ = −1, la primera ecuación da a·(x₂ + x₃) = c − 2, o sea −a = c − 2, de modo que a = 2 − c (el apunte cambió el signo)." }),
   S("a = b, c ≠ 2 − a", "[2,a,b;-2,0,0;-2,-1,-1]", "[c;-2;-1]", "inc", { pre: ["a=1", "b=1", "c=5"], ans: "Si a = b y c ≠ 2 − a: incompatible." }),
   S("a ≠ b", "[2,a,b;-2,0,0;-2,-1,-1]", "[c;-2;-1]", "det", { pre: ["a=1", "b=2", "c=0"], x: [1, 0, -1], ans: "Si a ≠ b: compatible determinado." })]);
ejercicio4(43, "Incógnitas en el denominador", "Hallar los valores de a y b que resuelven 2/a − 1/b = 7; 3/a + 5/b = −9. Con u = 1/a y v = 1/b queda un sistema lineal en u y v.",
  [S("", [[2, -1], [3, 5]], [7, -9], "det", { x: [2, -3], vars: ["u", "v"], ans: "u = 2, v = −3, o sea a = 1/2 y b = −1/3." })]);
ejercicio4(44, "Método de Gauss", "Resolver por el método de Gauss:",
  [S("I", [[3, 2, -2], [-1, 1, 4], [2, -3, 4]], [1, 13, 8], "det", { x: [1, 2, 3], vars: XYZ }),
   S("II", [[1, 2, -1], [-1, 1, 2], [2, 0, -1]], [8, -3, 7], "det", { x: [3, 2, -1] }),
   S("III", [[1, -1, 1, -1], [-1, -2, 1, 1], [2, -1, 2, 1]], [2, 4, 1], "ind", { p: [1 / 2, -3, -3 / 2, 0], N: [[5 / 2, -3, -9 / 2, 1]], ans: "Compatible indeterminado: con x₄ = t, X = (1/2; −3; −3/2; 0) + t(5/2; −3; −9/2; 1)." }),
   S("IV", [[2, 1, 1], [1, -2, 1], [0, 5, -1]], [-2, 1, 1], "inc", { vars: XYZ })]);
ejercicio4(45, "Método de Gauss-Jordan", "Resolver por el método de Gauss-Jordan:",
  [S("I", [[2, 1, -1, 1], [1, 2, 2, -3], [3, -1, -1, 2], [2, 3, 1, 4]], [-4, 6, 0, -5], "det", { x: [1, -2, 3, -1], vars: ["x", "y", "z", "w"] }),
   S("II", [[2, -3, 1], [1, 2, -1], [3, -1, 2]], [1, 1, 6], "det", { x: [1, 1, 2] }),
   S("III", [[1, 2, -3], [0, 1, 4], [0, 0, -2]], [4, 7, -2], "det", { x: [1, 3, 1], vars: XYZ })]);
ejercicio4(46, "Clasificar según a", E("Determinar a para que el sistema sea compatible determinado, indeterminado o incompatible:", "x + y − z = 1", "2x + 3y + a·z = 3", "x + a·y + 3z = 2"),
  [S("a = 2", "[1,1,-1;2,3,a;1,a,3]", "[1;3;2]", "ind", { pre: ["a=2"], det: 0, p: [0, 1, 0], N: [[5, -4, 1]], ans: "|A| = −(a − 2)(a + 3). Si a = 2: compatible indeterminado." }),
   S("a = −3", "[1,1,-1;2,3,a;1,a,3]", "[1;3;2]", "inc", { pre: ["a=-3"], det: 0, ans: "Si a = −3: incompatible." }),
   S("a = 0", "[1,1,-1;2,3,a;1,a,3]", "[1;3;2]", "det", { pre: ["a=0"], det: 6, x: [1, 1 / 3, 1 / 3], ans: "Si a ≠ 2 y a ≠ −3: compatible determinado." })]);
ejercicio4(47, "Método de Cramer", "Resolver aplicando el método de Cramer:",
  [S("I", [[3, -3, -2], [0, 2, -1], [3, -5, 0]], [-2, 1, -2], "det", { x: [1, 1, 1], cramer: true, vars: XYZ }),
   S("II", [[1, 3, 4], [0, 1, -2], [2, 5, -6]], [4, 1, 7], "det", { x: [1, 1, 0], cramer: true, vars: XYZ })]);
ejercicio4(48, "Método matricial", "Resolver aplicando el método matricial (X = A⁻¹·B):",
  [{ l: "a", cmds: ["A=[4,0,-5;0,1,-6;3,0,4]", "B=[6;-2;3]", "d=Det(A)", "X=Inversa(A)*B"], focus: "X", expect: { d: 31, X: COL([39 / 31, -98 / 31, -6 / 31]) }, ans: "|A| = 31 ≠ 0. X = (39/31; −98/31; −6/31)." },
   { l: "b", cmds: ["A=[3,-1,2;0,2,-1;3,-5,0]", "B=[2;-1;3]", "d=Det(A)", "X=Inversa(A)*B"], focus: "X", expect: { d: -24, X: COL([3 / 8, -3 / 8, 1 / 4]) }, ans: "|A| = −24 ≠ 0. X = (9/24; −9/24; 6/24) = (3/8; −3/8; 1/4).", note: "El apunte simplifica 6/24 como 3/8; es 1/4." }]);
ejercicio4(49, "Analizar según k", E("Analizar el sistema para los distintos valores de k:", "kx + y = 1", "3x + 2y = 0", "x + ky = 1"),
  [S("k = 1", "[k,1;3,2;1,k]", "[1;0;1]", "det", { pre: ["k=1"], x: [-2, 3], ans: "Si k = 1: x = −2, y = 3." }),
   S("k = 2", "[k,1;3,2;1,k]", "[1;0;1]", "inc", { pre: ["k=2"], ans: "Si k ≠ 1 el sistema es incompatible." })]);

/* ---------- Situaciones problemáticas ---------- */
ejercicio4(50, "Gallinas y conejos", "En una granja hay gallinas y conejos. Se cuentan 50 cabezas y 134 patas. ¿Cuántos animales hay de cada clase?",
  [S("", [[1, 1], [2, 4]], [50, 134], "det", { x: [33, 17], vars: ["g", "c"], ans: "33 gallinas y 17 conejos." })]);
ejercicio4(51, "Tartas", "La tarta A necesita 2,4 kg de masa y 3 h de elaboración; la B, 4 kg y 2 h. Si se dedicaron 67 h de trabajo y 80 kg de masa, ¿cuántas tartas de cada tipo se hicieron?",
  [S("", [[2.4, 4], [3, 2]], [80, 67], "det", { x: [15, 11], vars: ["A", "B"], ans: "Tarta A: 15 unidades; tarta B: 11 unidades." })]);
ejercicio4(52, "Dos números", "Hallar dos números tales que, si se divide el primero por 3 y el segundo por 4, la suma es 15; y si se multiplica el primero por 2 y el segundo por 5, la suma es 174.",
  [S("", "[1/3,1/4;2,5]", "[15;174]", "det", { x: [27, 24], noEq: true, ans: "A = 27; B = 24.", sol: "Sistema: x/3 + y/4 = 15; 2x + 5y = 174." })]);
ejercicio4(53, "Edades de tío e hijo", "Mi tío tiene 27 años más que su hijo y dentro de 12 años le doblará la edad. ¿Cuántos años tiene cada uno?",
  [S("", [[1, -1], [1, -2]], [27, 12], "det", { x: [42, 15], vars: ["T", "H"], ans: "Tío: 42 años; hijo: 15 años.", sol: "T − H = 27; T + 12 = 2(H + 12) ⇒ T − 2H = 12." })]);
ejercicio4(54, "Dos coches que se encuentran", "A y B distan 255 km. Un coche sale de A hacia B a 90 km/h y otro de B hacia A a 80 km/h, a la vez. Calcular el tiempo que tardan en encontrarse y la distancia recorrida por cada uno.",
  [S("", [[90, -1, 0], [80, 0, -1], [0, 1, 1]], [0, 0, 255], "det", { x: [1.5, 135, 120], vars: ["t", "x", "y"], ans: "t = 1,5 h; x = 135 km; y = 120 km.", sol: "x = 90t, y = 80t y x + y = 255." })]);
ejercicio4(55, "Monedas", "Una caja con monedas de 1, 5 y 10 centavos tiene 13 monedas por un total de 83 centavos. ¿Cuántas hay de cada tipo?",
  [{ l: "", cmds: ["A=[1,1,1;1,5,10]", "B=[13;83]", "t=Clasificar(A,B)", "p=Particular(A,B)", "N=Nucleo(A)", "chk=A*[3;4;6]"], focus: "t",
    expect: { t: "Compatible indeterminado", p: COL([-9 / 2, 35 / 2, 0]), N: TR([[5 / 4, -9 / 4, 1]]), chk: COL([13, 83]) },
    ans: "3 monedas de 1 cvo, 4 de 5 cvos y 6 de 10 cvos.", sol: "El sistema tiene 2 ecuaciones y 3 incógnitas: hay infinitas soluciones reales, pero solo una con números enteros no negativos, (3; 4; 6). La verificación chk = A·(3; 4; 6) da (13; 83)." }]);
ejercicio4(56, "Graciela y Juan", "Graciela es tres veces mayor que Juan, pero en 5 años tendrá el doble de la edad que Juan tiene ahora. ¿Qué edades tienen?",
  [S("", [[1, -3], [1, -2]], [0, 5], "det", { x: [15, 5], vars: ["G", "J"], ans: "Graciela tiene 15 y Juan 5.", sol: "G = 3J; G + 5 = 2(J + 5) ⇒ G − 2J = 5.", note: "Leído al pie de la letra (\"el doble de la edad que Juan tiene ahora\"), G + 5 = 2J daría J = −5. La respuesta del apunte (15 y 5) corresponde a G + 5 = 2(J + 5): el doble de la edad que Juan tendrá en 5 años." })]);
ejercicio4(57, "Arreglos florales", "Arreglo pequeño: 1 rosa, 3 margaritas, 3 crisantemos; mediano: 2, 4, 6; grande: 4, 8, 6. Se usaron 24 rosas, 50 margaritas y 48 crisantemos. ¿Cuántos arreglos de cada tipo?",
  [S("", [[1, 2, 4], [3, 4, 8], [3, 6, 6]], [24, 50, 48], "det", { x: [2, 3, 4], vars: ["p", "m", "g"], ans: "2 pequeños, 3 medianos y 4 grandes." })]);
ejercicio4(58, "Ana, Bibiana y Carlos", "La suma de las edades es 60. Ana es mayor que Bibiana por el mismo número de años que Bibiana es mayor que Carlos. Cuando Bibiana sea tan vieja como ahora es Ana, Ana será tres veces más vieja de lo que Carlos es ahora.",
  [S("", [[1, 1, 1], [1, -2, 1], [2, -1, -3]], [60, 0, 0], "det", { x: [28, 20, 12], vars: ["A", "B", "C"], ans: "Ana 28, Bibiana 20, Carlos 12.", sol: "A + B + C = 60; A − B = B − C; A + (A − B) = 3C." })]);
ejercicio4(59, "Fuente con tres conductos", "Una fuente se llena por A y B en 70 minutos, por A y C en 84 y por B y C en 140. ¿En cuánto tiempo se llena por cada conducto por separado?",
  [S("Planteo del apunte", [[1, 1, 0], [1, 0, 1], [0, 1, 1]], [70, 84, 140], "det", { x: [7, 63, 77], vars: ["A", "B", "C"], ans: "Por A: 7 min; por B: 63 min; por C: 77 min.",
     note: "El apunte suma los tiempos (A + B = 70), que es la respuesta publicada. Físicamente se suman los caudales: 1/A + 1/B = 1/70, etc. Ese modelo está en el otro inciso y da 105, 210 y 420 minutos." }),
   S("Con caudales", "[1,1,0;1,0,1;0,1,1]", "[1/70;1/84;1/140]", "det", { x: [1 / 105, 1 / 210, 1 / 420], noEq: true, ans: "Caudales 1/105, 1/210, 1/420 (llenado por A en 105 min, por B en 210 min y por C en 420 min).", note: "Planteo con caudales (1/tiempo); no es el que da el apunte." })]);
ejercicio4(60, "La corona de Hierón", "La corona pesa 7.465 g y sumergida pierde 467 g. El oro pierde en el agua 52/1000 de su peso y la plata 95/1000. ¿Cuánto oro y cuánta plata contiene?",
  [S("", "[1,1;0.052,0.095]", "[7465;467]", "det", { x: [242175 / 43, 78820 / 43], noEq: true, vars: ["o", "p"], ans: "Oro: 5.631,977 g; plata: 1.833,023 g.", sol: "o + p = 7465; 0,052·o + 0,095·p = 467." })]);
ejercicio4(61, "El ciclista", "A y B distan 112 km. Un ciclista tarda 6 h 15' de A a B y 6 h 55' de B a A. Va a 18 km/h en horizontal, 12 km/h en subida y 24 km/h en bajada. ¿Cuántos km hay en horizontal, subida y bajada yendo de A a B?",
  [S("", "[1/18,1/12,1/24;1/18,1/24,1/12;1,1,1]", "[25/4;83/12;112]", "det", { x: [60, 18, 34], noEq: true, vars: ["h", "s", "b"], ans: "60 km en horizontal, 18 km en subida y 34 km en bajada.", sol: "Tiempos = distancia/velocidad. De A a B: h/18 + s/12 + b/24 = 25/4; de B a A (subida y bajada se invierten): h/18 + s/24 + b/12 = 83/12; h + s + b = 112." })]);
ejercicio4(62, "Red de tránsito (Baltimore)", "La red representa el flujo de tránsito (vehículos por hora) en calles de un solo sentido. Determinar el patrón de flujo general. En cada intersección lo que entra es igual a lo que sale: A: x₁ + x₂ = 800; B: x₂ − x₃ + x₄ = 300; C: x₄ + x₅ = 500; D: x₁ + x₅ = 600.",
  [S("", [[1, 1, 0, 0, 0], [0, 1, -1, 1, 0], [0, 0, 0, 1, 1], [1, 0, 0, 0, 1]], [800, 300, 500, 600], "ind", { p: [600, 200, 400, 500, 0], N: [[-1, 1, 0, -1, 1]], ans: "x₁ = 600 − x₅; x₂ = 200 + x₅; x₃ = 400; x₄ = 500 − x₅; x₅ libre." })]);
ejercicio4(63, "Red eléctrica", "Determinar las corrientes I₁, I₂, I₃ de la red de la figura. Con las leyes de Kirchhoff resulta: I₁ − I₂ + I₃ = 0; 4I₁ + I₂ = 8; I₂ + 4I₃ = 16.",
  [S("", [[1, -1, 1], [4, 1, 0], [0, 1, 4]], [0, 8, 16], "det", { x: [1, 4, 3], vars: ["I₁", "I₂", "I₃"], ans: "I₁ = 1 A; I₂ = 4 A; I₃ = 3 A." })]);
ejercicio4(64, "Red de tuberías", "Red con flujos en L/min: entran 20 en A y 10 en B, salen 30 en C. Nodo A: f₁ + f₂ = 20; nodo B: f₃ − f₂ = 10; nodo C: f₁ + f₃ = 30. a) Plantear y resolver. b) Si el flujo por AB (f₂) se restringe a 5 L/min, ¿cuáles son los otros? c) ¿Flujos mínimo y máximo por cada rama? d) ¿Qué significaría un flujo negativo?",
  [S("a", [[1, 1, 0], [0, -1, 1], [1, 0, 1]], [20, 10, 30], "ind", { p: [30, -10, 0], N: [[-1, 1, 1]], ans: "f₁ = 30 − t; f₂ = −10 + t; f₃ = t." }),
   S("b (f₂ = 5)", [[1, 1, 0], [0, -1, 1], [1, 0, 1], [0, 1, 0]], [20, 10, 30, 5], "det", { x: [15, 5, 15], ans: "f₁ = 15 y f₃ = 15." }),
   { l: "c", cmds: [], ans: "Con f₁ = 30 − t ≥ 0, f₂ = t − 10 ≥ 0 y f₃ = t ≥ 0 resulta 10 ≤ t ≤ 30: 0 ≤ f₁ ≤ 20; 0 ≤ f₂ ≤ 20; 10 ≤ f₃ ≤ 30." },
   { l: "d", cmds: [], ans: "Un flujo negativo significa que el agua circula en sentido contrario al de la flecha dibujada (por ejemplo, en AB de abajo hacia arriba)." }]);
ejercicio4(65, "Balancear ecuaciones químicas", "Balancear: a) FeS₂ + O₂ → Fe₂O₃ + SO₂; b) C₄H₁₀ + O₂ → CO₂ + H₂O; c) C₅H₁₁OH + O₂ → H₂O + CO₂; d) Na₂CO₃ + C + N₂ → NaCN + CO. Para cada elemento: átomos a la izquierda = átomos a la derecha. La orden Balancear(A) devuelve los coeficientes enteros más chicos.",
  [{ l: "a", cmds: ["A=[1,0,-2,0;2,0,0,-1;0,2,-3,-2]", "x=Balancear(A)"], focus: "x", expect: { x: COL([4, 11, 2, 8]) }, ans: "4FeS₂ + 11O₂ → 2Fe₂O₃ + 8SO₂." },
   { l: "b", cmds: ["A=[4,0,-1,0;10,0,0,-2;0,2,-2,-1]", "x=Balancear(A)"], focus: "x", expect: { x: COL([2, 13, 8, 10]) }, ans: "2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O." },
   { l: "c", cmds: ["A=[5,0,0,-1;12,0,-2,0;1,2,-1,-2]", "x=Balancear(A)"], focus: "x", expect: { x: COL([2, 15, 12, 10]) }, ans: "2C₅H₁₁OH + 15O₂ → 12H₂O + 10CO₂." },
   { l: "d", cmds: ["A=[2,0,0,-1,0;1,1,0,-1,-1;0,0,2,-1,0;3,0,0,0,-1]", "x=Balancear(A)"], focus: "x", expect: { x: COL([1, 4, 1, 2, 3]) }, ans: "Na₂CO₃ + 4C + N₂ → 2NaCN + 3CO." }]);
ejercicio4(66, "Red de diques de irrigación", "Flujos en miles de litros por día. Nodos: A: f₁ + f₂ = 100; B: f₂ + f₃ − f₄ = 150; C: f₄ + f₅ = 150; D: f₁ − f₃ − f₅ = −200 (ver la figura del apunte). a) Plantear y resolver. b) Si DC está cerrado (f₅ = 0), ¿qué rango de flujo se necesita por DB (f₃)? c) ¿Por qué DB no puede cerrarse? d) Flujos mínimo y máximo por DB.",
  [S("a", [[1, 1, 0, 0, 0], [0, 1, 1, -1, 0], [0, 0, 0, 1, 1], [1, 0, -1, 0, -1]], [100, 150, 150, -200], "ind", { p: [-200, 300, 0, 150, 0], N: [[1, -1, 1, 0, 0], [1, -1, 0, -1, 1]], ans: "Con f₃ = t y f₅ = s: f₁ = −200 + t + s; f₂ = 300 − t − s; f₄ = 150 − s.",
     note: "El apunte escribe f₄ = 150 − t y f₅ = t, igualando los dos parámetros. Resolviendo el sistema hay dos parámetros independientes (f₃ y f₅): f₄ = 150 − f₅." }),
   S("b (f₅ = 0)", [[1, 1, 0, 0, 0], [0, 1, 1, -1, 0], [0, 0, 0, 1, 1], [1, 0, -1, 0, -1], [0, 0, 0, 0, 1]], [100, 150, 150, -200, 0], "ind", { p: [-200, 300, 0, 150, 0], N: [[1, -1, 1, 0, 0]], ans: "Con f₅ = 0: f₁ = −200 + t ≥ 0 y f₂ = 300 − t ≥ 0 ⇒ 200 ≤ f₃ ≤ 300." }),
   { l: "c", cmds: [], ans: "DB no puede cerrarse porque entonces f₃ = 0 y f₁ = −200 + f₅ ≥ 0 exigiría f₅ ≥ 200, pero f₄ = 150 − f₅ ≥ 0 obliga a f₅ ≤ 150: contradicción. En la solución general, f₃ = 0 deja a f₁ y f₄ sin valores válidos simultáneamente." },
   { l: "d", cmds: [], ans: "Mínimo y máximo de f₃: 200 ≤ f₃ ≤ 300 (cuando DC está cerrado)." }]);
ejercicio4(67, "Resistencia efectiva", "Mostrar que la resistencia efectiva de dos resistores en serie es R = R₁ + R₂ y en paralelo 1/R = 1/R₁ + 1/R₂ (E = R·I).",
  [{ l: "serie y paralelo", cmds: ["R1=2", "R2=3", "Rs=R1+R2", "Rp=1/(1/R1+1/R2)"], focus: "Rp", expect: { Rs: 5, Rp: 6 / 5 }, ans: "Serie: la misma corriente pasa por ambos, E = E₁ + E₂ = (R₁ + R₂)I ⇒ R = R₁ + R₂. Paralelo: la misma tensión E, I = I₁ + I₂ = E/R₁ + E/R₂ = E(1/R₁ + 1/R₂) ⇒ 1/R = 1/R₁ + 1/R₂." }]);
ejercicio4(68, "Red de flujos 2×3", "Nodos A a F, flujos f₁ a f₇ (ver la figura). A: f₁ − f₃ = 100; B: f₁ − f₂ − f₄ = −150; C: f₂ + f₅ = 300; D: f₆ − f₃ = 100; E: f₄ + f₇ − f₆ = 100; F: f₅ + f₇ = 250. a) Plantear y resolver. b) ¿Es posible que f₁ = 100 y f₆ = 150? c) Si f₄ = 0, ¿qué rango de flujo hay en cada rama?",
  [S("a", [[1, 0, -1, 0, 0, 0, 0], [1, -1, 0, -1, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0], [0, 0, -1, 0, 0, 1, 0], [0, 0, 0, 1, 0, -1, 1], [0, 0, 0, 0, 1, 0, 1]], [100, -150, 300, 100, 100, 250], "ind", { p: [0, 50, -100, 100, 250, 0, 0], N: [[1, 0, 1, 1, 0, 1, 0], [0, 1, 0, -1, -1, 0, 1]], ans: "f₁ = f₆; f₂ = 50 + f₇; f₃ = −100 + f₆; f₄ = 100 + f₆ − f₇; f₅ = 250 − f₇; f₆ y f₇ libres." }),
   S("b (f₁ = 100, f₆ = 150)", [[1, 0, -1, 0, 0, 0, 0], [1, -1, 0, -1, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0], [0, 0, -1, 0, 0, 1, 0], [0, 0, 0, 1, 0, -1, 1], [0, 0, 0, 0, 1, 0, 1], [1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0]], [100, -150, 300, 100, 100, 250, 100, 150], "inc", { ans: "No es posible: f₁ = f₆ en la solución general, y no pueden valer 100 y 150 a la vez. Desde la figura: lo que entra en A y D por el oeste debe salir por la misma fila." }),
   S("c (f₄ = 0)", [[1, 0, -1, 0, 0, 0, 0], [1, -1, 0, -1, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0], [0, 0, -1, 0, 0, 1, 0], [0, 0, 0, 1, 0, -1, 1], [0, 0, 0, 0, 1, 0, 1], [0, 0, 0, 1, 0, 0, 0]], [100, -150, 300, 100, 100, 250, 0], "ind", { p: [-100, 50, -200, 0, 250, -100, 0], N: [[1, 1, 1, 0, -1, 1, 1]],
     ans: "Con f₄ = 0: f₇ = f₆ + 100. Pedir flujos no negativos da f₆ ≥ 100 (y f₃ ≥ 0 ⇒ f₆ ≥ 100) y f₅ = 250 − f₇ ≥ 0 ⇒ f₇ ≤ 250 (100 ≤ f₆ ≤ 150).",
     note: "El apunte da 100 ≤ f₆ y 100 ≤ f₇ ≤ 250. Con f₄ = 0 se agrega f₇ = f₆ + 100, de modo que f₇ ∈ [200, 250] y f₆ ∈ [100, 150]." })]);
ejercicio4(69, "Embotelladoras", "Dos embotelladoras procesan por trimestre: E1, 1800 L de licor y 900 L de vino; E2, 2700 L de licor y 1800 L de vino. ¿Cuántos días deben funcionar para entregar 400 L de licor y 250 L de vino? (trimestre = 90 días).",
  [S("", [[20, 30], [10, 20]], [400, 250], "det", { x: [5, 10], vars: ["d₁", "d₂"], ans: "5 días la embotelladora 1 y 10 días la 2.", sol: "Por día: E1 procesa 20 L de licor y 10 L de vino; E2, 30 y 20. 20d₁ + 30d₂ = 400; 10d₁ + 20d₂ = 250." })]);
