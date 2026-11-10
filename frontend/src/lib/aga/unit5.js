import { COL, MM, S, TR, mx, unitBuilder } from "./items.js";

/* ===== Unidad 5 · Espacios vectoriales ===== */
const TAG = "Espacios vectoriales";
const { list: EX5, ejemplo, ejercicio } = unitBuilder(5, TAG);
export { EX5 };

// Los vectores (o sus coordenadas) van como columnas de la matriz.
const cm = (...vs) => mx(vs[0].map((_, i) => vs.map((v) => v[i])));
const ZERO3 = [0, 0, 0];

// Conjunto de vectores: rango y propiedad pedida (Genera, Indep, Base).
function V(l, vs, fn, t, r, ans, note) {
  const item = { l, cmds: ["A=" + cm(...vs), "r=Rango(A)", "t=" + fn + "(A)"], focus: "t", expect: { r, t }, ans };
  if (note) item.note = note;
  return item;
}
const GEN = (n) => "Genera ℝ" + "⁰¹²³⁴⁵⁶⁷⁸⁹"[n];
const NOGEN = "No genera*";
const LI = "Linealmente independientes";
const LD = "Linealmente dependientes*";
// ¿Pertenece w a gen{vs}? Se resuelve k₁v₁ + … = w.
function Mem(l, vs, w, ok, o = {}) {
  const A = vs[0].map((_, i) => vs.map((v) => v[i]));
  const names = vs.map((_, i) => "k" + "₁₂₃₄₅₆₇₈₉"[i]);
  const base = { vars: names, ans: ok ? "Sí pertenece: existen escalares que lo expresan como combinación lineal." : "No pertenece: el sistema es incompatible, no hay escalares.", ...o };
  return S(l, A, w, ok ? (o.kind || "det") : "inc", base);
}

/* ---------- Ejemplos (recuadros del apunte) ---------- */
ejemplo(1, "ℝ² con las operaciones estándar", "Demostrar que ℝ² con la suma y el producto por escalar usuales es un espacio vectorial. La demostración usa componentes genéricas; acá se verifican numéricamente los axiomas con u = (1; 2), v = (3; −1), w = (0; 5), k = 2 y l = −3.",
  [{ l: "", cmds: ["u=[1;2]", "v=[3;-1]", "w=[0;5]", "k=2", "l=-3", "a2=Igual(u+v,v+u)", "a3=Igual(u+(v+w),(u+v)+w)", "a7=Igual(k*(u+v),k*u+k*v)", "a8=Igual((k+l)*u,k*u+l*u)", "a9=Igual(k*(l*u),(k*l)*u)", "a10=Igual(1*u,u)"], focus: "a10",
    expect: { a2: "Son iguales", a3: "Son iguales", a7: "Son iguales", a8: "Son iguales", a9: "Son iguales", a10: "Son iguales" },
    ans: "Se cumplen los diez axiomas: es un espacio vectorial. Los axiomas 1 (cerradura de la suma), 4 (neutro (0; 0)), 5 (opuesto −u) y 6 (cerradura del producto) salen de la definición de las operaciones.",
    sol: "Verificar con números no reemplaza la demostración con componentes genéricas u₁, u₂, v₁, …, pero sirve para detectar cuándo un axioma falla." }]);
ejemplo(2, "ℝ³ con k(x; y; z) = (kx; y; z)", "¿Es espacio vectorial ℝ³ con la suma usual y el producto k(x₁; y₁; z₁) = (kx₁; y₁; z₁)? Se prueba el axioma 8º con u = (1; 2; 3), k = 2 y l = 3.",
  [{ l: "", cmds: ["a=[5;2;3]", "b=[5;4;6]", "t=Igual(a,b)"], focus: "t", expect: { t: "No son iguales" },
    ans: "No es un espacio vectorial: (k + l)u = (5; 2; 3) pero ku + lu = (2; 2; 3) + (3; 2; 3) = (5; 4; 6). No se cumple el axioma 8º.",
    sol: "Los otros axiomas se verifican (el 9º también), pero con que falle uno alcanza." }]);
ejemplo(3, "Subespacio: x₁ = x₂", "Dado W = {(x₁; x₂) / x₁ = x₂}, ¿es un subespacio de ℝ²? Con u = (2; 2), v = (−1; −1) y k = 3.",
  [{ l: "", cmds: ["u=[2;2]", "v=[-1;-1]", "s=u+v", "m=3*u"], focus: "s", expect: { s: COL([1, 1]), m: COL([6, 6]) },
    ans: "Sí es subespacio: la suma (x₁ + y₁; x₁ + y₁) y el producto (kx₁; kx₁) conservan la condición x₁ = x₂, y (0; 0) ∈ W." }]);
ejemplo(4, "No es subespacio: x₁ = x₃ + 1", "Dado W = {(x₁; x₂; x₃) / x₁ = x₃ + 1}, ¿es subespacio de ℝ³? Con u = (1; 0; 0) y v = (2; 5; 1), ambos en W.",
  [{ l: "", cmds: ["u=[1;0;0]", "v=[2;5;1]", "s=u+v", "z=0*u"], focus: "s", expect: { s: COL([3, 5, 1]), z: COL([0, 0, 0]) },
    ans: "No es subespacio: u + v = (3; 5; 1) tiene x₁ = 3 pero x₃ + 1 = 2, así que no cumple la condición. Además 0·u = (0; 0; 0) no está en W (0 ≠ 0 + 1): el vector nulo no pertenece a W." }]);
ejemplo(5, "Subespacio de p₃: a₀ + a₁ + a₂ + a₃ = 0", "Dado W = {a₀ + a₁x + a₂x² + a₃x³ / a₀ + a₁ + a₂ + a₃ = 0}, ¿es subespacio de p₃? Con p = 1 + 2x − 3x² y q = x + x² − 2x³.",
  [{ l: "", cmds: ["p=[1;2;-3;0]", "q=[0;1;1;-2]", "s=p+q", "m=5*p"], focus: "s", expect: { s: COL([1, 3, -2, -2]), m: COL([5, 10, -15, 0]) },
    ans: "Sí es subespacio: p + q = 1 + 3x − 2x² − 2x³ suma 1 + 3 − 2 − 2 = 0, y 5p = 5 + 10x − 15x² suma 0. El polinomio nulo también cumple la condición." }]);
ejemplo(6, "Vectores que no generan ℝ³", "Determinar si v₁ = (2; −1; 3), v₂ = (4; 1; 2) y v₃ = (8; −1; 8) generan ℝ³. Se plantea k₁v₁ + k₂v₂ + k₃v₃ = (x; y; z) y se busca la condición de compatibilidad.",
  [{ l: "", cmds: ["A=" + cm([2, -1, 3], [4, 1, 2], [8, -1, 8]), "r=Rango(A)", "g=Genera(A)", "c=Caracterizar(A)"], focus: "c", expect: { r: 2, g: NOGEN, c: "5y₁ − 8y₂ − 6y₃ = 0" },
    ans: "r(A) = 2 < 3: una fila se anula, y el sistema solo es compatible si 5x − 8y − 6z = 0. Los vectores no generan ℝ³, sino un subespacio (un plano) de ℝ³." }]);
ejemplo(7, "Matriz en el subespacio generado", "¿Pertenece A = [11 2; 0 −1] al subespacio generado por B = [1 2; 0 1], C = [2 −1; 0 −1] y D = [3 1; 0 0]? Se plantea A = k₁B + k₂C + k₃D con las matrices como vectores de ℝ⁴ (a₁₁; a₁₂; a₂₁; a₂₂).",
  [S("", [[1, 2, 3], [2, -1, 1], [0, 0, 0], [1, -1, 0]], [11, 2, 0, -1], "ind", { p: [3, 4, 0], N: [[-1, -1, 1]], vars: ["k₁", "k₂", "k₃"], noEq: true,
    ans: "Sí pertenece. El sistema es compatible indeterminado: k₁ = 3 − k₃ y k₂ = 4 − k₃. Con k₃ = 0: A = 3B + 4C." })]);
ejemplo(8, "Caracterizar un subespacio", "Sea W el subespacio de ℝ³ generado por (1; 1; 1) y (2; 1; 3). Caracterizarlo y decir cuáles de u₁ = (0; 1; −1), u₂ = (3; 2; 0), u₃ = (0; 0; 0) y u₄ = (2; 1; 3) pertenecen a W.",
  [{ l: "Condición", cmds: ["A=" + cm([1, 1, 1], [2, 1, 3]), "c=Caracterizar(A)"], focus: "c", expect: { c: "2y₁ − y₂ − y₃ = 0" }, ans: "La condición de compatibilidad es −2y₁ + y₂ + y₃ = 0, o sea y₂ = 2y₁ − y₃ (la app la escribe con signo cambiado: 2y₁ − y₂ − y₃ = 0)." },
   ...[["u₁", [0, 1, -1], true], ["u₂", [3, 2, 0], false], ["u₃", [0, 0, 0], true], ["u₄", [2, 1, 3], true]].map(([n, w, ok]) => ({
     l: n, cmds: ["A=" + cm([1, 1, 1], [2, 1, 3]), "B=[" + w.join(";") + "]", "t=Clasificar(A,B)"], focus: "t", expect: { t: ok ? "Compatible determinado" : "Incompatible" },
     ans: ok ? "Cumple 2y₁ − y₂ − y₃ = 0: " + n + " pertenece a W." : "No cumple la condición (2·3 − 2 − 0 = 4 ≠ 0): " + n + " no pertenece a W." }))]);
ejemplo(9, "Base de ℝ³ con el determinante", "Demostrar que S = {(1; 2; 1), (2; 9; 0), (3; 3; 4)} es una base de ℝ³.",
  [{ l: "", cmds: ["A=" + cm([1, 2, 1], [2, 9, 0], [3, 3, 4]), "d=Det(A)", "i=Indep(A)", "g=Genera(A)", "b=Base(A)"], focus: "b", expect: { d: -1, i: LI, g: GEN(3), b: "Es base de ℝ³" },
    ans: "|A| = 36 + 6 − 27 − 16 = −1 ≠ 0: los vectores son linealmente independientes y, como son 3 en ℝ³, también generan. Son una base de ℝ³." }]);
ejemplo(10, "Base de un subespacio de ℝ³", "Dar una base de W = gen{(1; 0; 1), (2; 1; 3), (0; 1; 1), (1; 1; 2)}.",
  [{ l: "", cmds: ["A=" + cm([1, 0, 1], [2, 1, 3], [0, 1, 1], [1, 1, 2]), "r=Rango(A)", "c=Caracterizar(A)", "N=Nucleo([1,1,-1])"], focus: "N", expect: { r: 2, c: "y₁ + y₂ − y₃ = 0", N: TR([[-1, 1, 0], [1, 0, 1]]) },
    ans: "Los vectores de W cumplen x + y − z = 0. Resolviendo: z = x + y. Una base es {(1; 0; 1), (0; 1; 1)} y dim W = 2.",
    sol: "La app despeja x y obtiene la base {(−1; 1; 0), (1; 0; 1)}, equivalente a la del apunte (cualquier par de vectores independientes del plano sirve)." }]);
ejemplo(11, "Dimensión del espacio de soluciones", "Hallar la dimensión del espacio de soluciones de 3x₁ + x₂ + x₃ + x₄ = 0; 5x₁ − x₂ + x₃ − x₄ = 0 y una base.",
  [{ l: "", cmds: ["A=[3,1,1,1;5,-1,1,-1]", "d=Dimension(A)", "N=Nucleo(A)"], focus: "N", expect: { d: 2, N: TR([[-1 / 4, -1 / 4, 1, 0], [0, -1, 0, 1]]) }, ans: "dim = n − rango(A) = 4 − 2 = 2. Base: {(−1/4; −1/4; 1; 0), (0; −1; 0; 1)} (con x₃ = t y x₄ = s)." }]);
ejemplo(12, "Coordenadas respecto de una base de ℝ³", "Sea S = {v₁ = (1; 2; 1), v₂ = (2; 9; 0), v₃ = (3; 3; 4)}. a) Hallar (u)S para u = (5; −1; 9). b) Hallar w si (w)S = (−1; 3; 2).",
  [{ l: "a", cmds: ["S=" + cm([1, 2, 1], [2, 9, 0], [3, 3, 4]), "u=[5;-1;9]", "X=Resolver(S,u)"], focus: "X", expect: { X: COL([1, -1, 2]) }, ans: "(u)S = (1; −1; 2): u = 1·v₁ − 1·v₂ + 2·v₃." },
   { l: "b", cmds: ["S=" + cm([1, 2, 1], [2, 9, 0], [3, 3, 4]), "c=[-1;3;2]", "w=S*c"], focus: "w", expect: { w: COL([11, 31, 7]) }, ans: "w = −v₁ + 3v₂ + 2v₃ = (11; 31; 7)." }]);
ejemplo(13, "Coordenadas de un polinomio", "Hallar la matriz de coordenadas de p = 3 + 5x + 2x² respecto de la base canónica B = (1; x; x²).",
  [{ l: "", cmds: ["B=Identidad(3)", "p=[3;5;2]", "X=Resolver(B,p)"], focus: "X", expect: { X: COL([3, 5, 2]) }, ans: "(p)B = (3; 5; 2): en la base canónica las coordenadas son los coeficientes." }]);
ejemplo(14, "Matriz de transición en ℝ²", "Sean B = {u₁ = (1; 0), u₂ = (0; 1)} y B′ = {v₁ = (1; 1), v₂ = (2; 1)}. a) Hallar la matriz de transición de B a B′. b) Hallar (w)B′ si w = (7; 2).",
  [{ l: "a", cmds: ["Bm=[1,0;0,1]", "Bp=[1,2;1,1]", "P=Inversa(Bp)*Bm"], focus: "P", expect: { P: MM([[-1, 2], [1, -1]]) }, ans: "Las columnas de P son las coordenadas de u₁ y u₂ respecto de B′: P = B′⁻¹·B = [−1 2; 1 −1]." },
   { l: "b", cmds: ["Bm=[1,0;0,1]", "Bp=[1,2;1,1]", "P=Inversa(Bp)*Bm", "w=[7;2]", "wp=P*w"], focus: "wp", expect: { wp: COL([-3, 5]) }, ans: "[w]B′ = P·[w]B = (−3; 5)." }]);
ejemplo(15, "Pasar a la base canónica", "Con B = {(2; 1), (7; 3)} y B′ la base canónica de ℝ², hallar la matriz de cambio de B a B′ y [v]B′ si [v]B = (−3; 4).",
  [{ l: "", cmds: ["Bm=[2,7;1,3]", "Bp=Identidad(2)", "P=Inversa(Bp)*Bm", "v=[-3;4]", "vp=P*v"], focus: "vp", expect: { P: MM([[2, 7], [1, 3]]), vp: COL([22, 9]) }, ans: "P = [2 7; 1 3] (las columnas son los vectores de B) y [v]B′ = (22; 9)." }]);
ejemplo(16, "Cambio de base en ℝ³", "Con B = {(−3; 0; −3), (−3; 2; −1), (1; 6; −1)} y B′ = {(−6; −6; 0), (−2; −6; 4), (−2; −3; 7)}: a) matriz de transición de B a B′; b) [w]B′ si w = (−5; 8; −5) con la fórmula; c) verificar calculándolo directamente.",
  [{ l: "a", cmds: ["Bm=" + cm([-3, 0, -3], [-3, 2, -1], [1, 6, -1]), "Bp=" + cm([-6, -6, 0], [-2, -6, 4], [-2, -3, 7]), "P=Inversa(Bp)*Bm"], focus: "P",
    expect: { P: MM([[3 / 4, 3 / 4, 1 / 12], [-3 / 4, -17 / 12, -17 / 12], [0, 2 / 3, 2 / 3]]) }, ans: "Cada columna de P se obtiene resolviendo un sistema con la misma matriz B′ (se resuelven juntos con Gauss-Jordan): P = B′⁻¹·B." },
   { l: "b y c", cmds: ["Bm=" + cm([-3, 0, -3], [-3, 2, -1], [1, 6, -1]), "Bp=" + cm([-6, -6, 0], [-2, -6, 4], [-2, -3, 7]), "w=[-5;8;-5]", "wB=Resolver(Bm,w)", "P=Inversa(Bp)*Bm", "wp=P*wB", "dir=Resolver(Bp,w)"], focus: "wp",
    expect: { wB: COL([1, 1, 1]), wp: COL([19 / 12, -43 / 12, 4 / 3]), dir: COL([19 / 12, -43 / 12, 4 / 3]) }, ans: "[w]B = (1; 1; 1) y [w]B′ = P·[w]B = (19/12; −43/12; 4/3). Calculado directo resolviendo B′·λ = w da lo mismo." }]);

/* ---------- Ejercicios para resolver ---------- */
// Un inciso sin cuentas en la app: la respuesta y el motivo.
const T = (l, ans, note) => (note ? { l, cmds: [], ans, note } : { l, cmds: [], ans });
const NOTE_AXIOMAS = "El apunte enumera todos los axiomas que \"fallan\"; en rigor basta con que falle uno para que no sea espacio vectorial.";

ejercicio(1, "¿ℝ³ con k(x; y; z) = (0; 0; 0)?", "Comprobar si ℝ³ con la suma usual y el producto por escalar k(x₁; y₁; z₁) = (0; 0; 0) es un espacio vectorial.",
  [{ l: "", cmds: ["u=[1;2;3]", "r=[0;0;0]", "t=Igual(r,u)"], focus: "t", expect: { t: "No son iguales" }, ans: "No es espacio vectorial: no se cumple el axioma 10º, porque 1·u = (0; 0; 0) ≠ u para todo u ≠ 0." }]);
ejercicio(2, "¿ℝ² con k(x; y) = (2ky; 2ky)?", "Verificar si ℝ² con la suma usual y k(x₁; y₁) = (2ky₁; 2ky₁) es un espacio vectorial.",
  [{ l: "", cmds: ["u=[1;2]", "r=[4;4]", "t=Igual(r,u)"], focus: "t", expect: { t: "No son iguales" }, ans: "No es espacio vectorial: fallan los axiomas 8º, 9º y 10º. Por ejemplo 1·(1; 2) = (4; 4) ≠ (1; 2)." }]);
ejercicio(3, "ℝ con las operaciones usuales", "Verificar si ℝ con la suma y el producto usuales es un espacio vectorial.",
  [T("", "Sí es espacio vectorial: se verifican los diez axiomas (son las propiedades de los números reales). Es ℝ¹.")]);
ejercicio(4, "Primer cuadrante de ℝ²", "Comprobar si los pares (x; y) con x ≥ 0 e y ≥ 0 y las operaciones estándar forman un espacio vectorial.",
  [{ l: "", cmds: ["u=[1;1]", "v=(-1)*u"], focus: "v", expect: { v: COL([-1, -1]) }, ans: "No es espacio vectorial: no existe el opuesto dentro del conjunto (axioma 5º). Para u = (1; 1) el opuesto (−1; −1) no está en el primer cuadrante.",
    note: "Tampoco es cerrado para el producto por escalares negativos (axioma 6º)." }]);
ejercicio(5, "Pares (x; 0)", "Verificar si los pares de la forma (x; 0) con las operaciones estándar forman un espacio vectorial.",
  [{ l: "", cmds: ["u=[2;0]", "v=[-5;0]", "s=u+v", "m=(-3)*u"], focus: "s", expect: { s: COL([-3, 0]), m: COL([-6, 0]) }, ans: "Sí es espacio vectorial: la suma y el producto conservan la segunda componente 0, y valen los diez axiomas. Es la recta x del plano, un subespacio de ℝ²." }]);
ejercicio(6, "n-uplas de ℝⁿ", "Comprobar si ℝⁿ con las operaciones estándar es un espacio vectorial.",
  [T("", "Sí es espacio vectorial: se verifican los diez axiomas componente a componente, igual que en ℝ² (ejemplo 1).")]);
ejercicio(7, "ℝ² con (x + x′ + 1; y + y′ + 1) y k(x; y) = (ky; ky)", "Verificar si ℝ² con (x; y) + (x′; y′) = (x + x′ + 1; y + y′ + 1) y k(x; y) = (ky; ky) es un espacio vectorial.",
  [{ l: "", cmds: ["a=[14;14]", "b=[13;13]", "t=Igual(a,b)"], focus: "t", expect: { t: "No son iguales" },
    ans: "No es espacio vectorial. Con u = (1; 2), v = (3; 4) y k = 2: k(u + v) = 2(5; 7) = (14; 14) pero ku + kv = (4; 4) + (8; 8) = (13; 13). Además 1·(x; y) = (y; y) ≠ (x; y) (axioma 10º).",
    note: "El apunte dice que fallan los axiomas 5º y 10º. Con el neutro (−1; −1) y el opuesto (−x − 2; −y − 2) el axioma 5º sí se cumple; fallan el 10º y también el 7º y el 8º. La conclusión no cambia." }]);
ejercicio(8, "Matrices [a 1; 1 b]", "Verificar si las matrices de ℝ²ˣ² de la forma [a 1; 1 b] con la suma y el producto por escalar usuales forman un espacio vectorial.",
  [{ l: "", cmds: ["A=[1,1;1,1]", "B=[2,1;1,3]", "S=A+B"], focus: "S", expect: { S: MM([[3, 2], [2, 4]]) }, ans: "No es espacio vectorial: la suma no es cerrada (axioma 1º), porque los elementos fuera de la diagonal valen 2 y no 1. Tampoco lo es el producto (6º)." }]);
ejercicio(9, "Matrices [a a+b; a+b b]", "Comprobar si las matrices de la forma [a a+b; a+b b] con las operaciones usuales forman un espacio vectorial.",
  [{ l: "", cmds: ["A=[1,3;3,2]", "B=[2,5;5,3]", "S=A+B", "m=4*A"], focus: "S", expect: { S: MM([[3, 8], [8, 5]]), m: MM([[4, 12], [12, 8]]) }, ans: "Sí es espacio vectorial: A + B = [a₁+a₂, (a₁+a₂)+(b₁+b₂); …] y kA conservan la forma, y valen los diez axiomas. Con A (a = 1, b = 2) y B (a = 2, b = 3) la suma es [3 8; 8 5], que sigue siendo de la forma pedida (a = 3, b = 5)." }]);
ejercicio(10, "Conjuntos con condiciones", "Comprobar si son espacios vectoriales (operaciones estándar): a) {(x₁; x₂) / x₁ + x₂ = 0}; b) {(x₁; x₂; x₃; x₄) / x₁ − x₂ + x₃ = 0; x₄ = x₁ + x₂ + x₃}; c) {(x₁; x₂; x₃) / x₁ = 0; x₂ = x₃}; d) {(x₁; x₂) / x₁ = 0; x₂ = 1}.",
  [{ l: "a", cmds: ["u=[2;-2]", "v=[-5;5]", "s=u+v"], focus: "s", expect: { s: COL([-3, 3]) }, ans: "Sí: es una recta que pasa por el origen; la suma y los múltiplos conservan x₁ + x₂ = 0." },
   T("b", "Sí: son los puntos de ℝ⁴ que cumplen dos ecuaciones homogéneas, y esas condiciones se conservan con la suma y los escalares."),
   T("c", "Sí: es la recta x₁ = 0, x₂ = x₃, homogénea, que pasa por el origen."),
   { l: "d", cmds: ["u=[0;1]", "s=u+u", "z=0*u"], focus: "s", expect: { s: COL([0, 2]), z: COL([0, 0]) }, ans: "No: W = {(0; 1)} tiene un solo punto. (0; 1) + (0; 1) = (0; 2) ∉ W y el vector nulo (0; 0) no pertenece a W.",
     note: "El apunte nombra los axiomas 1º, 2º, 3º, 6º, 7º, 8º y 9º. Los que realmente fallan son los de cerradura (1º y 6º) y la existencia del neutro (4º); los demás son identidades que solo se pueden evaluar si el resultado queda dentro del conjunto." }]);
ejercicio(11, "Recta que no pasa por el origen", "¿Constituye un espacio vectorial el conjunto de los puntos de ℝ² sobre una recta que no pasa por el origen?",
  [{ l: "", cmds: ["u=[0;1]", "v=[1;2]", "s=u+v"], focus: "s", expect: { s: COL([1, 3]) }, ans: "No: no se cumplen los axiomas 1º y 4º. Con la recta y = x + 1: (0; 1) y (1; 2) están sobre ella, pero (0; 1) + (1; 2) = (1; 3) no (3 ≠ 1 + 1), y el origen no pertenece a la recta." }]);
ejercicio(12, "Plano por el origen", "¿Constituye un espacio vectorial el conjunto de los puntos de ℝ³ de un plano que pasa por el origen?",
  [{ l: "", cmds: ["u=[1;1;-2]", "v=[2;-3;1]", "s=u+v", "m=(-2)*u"], focus: "s", expect: { s: COL([3, -2, -1]), m: COL([-2, -2, 4]) }, ans: "Sí: se cumplen los diez axiomas. Con el plano x + y + z = 0: la suma (3; −2; −1) y el múltiplo (−2; −2; 4) siguen en el plano." }]);
ejercicio(13, "Plano que no pasa por el origen", "¿Constituye un espacio vectorial el conjunto de los puntos de ℝ³ de un plano que no pasa por el origen?",
  [{ l: "", cmds: ["u=[1;0;0]", "v=[0;1;0]", "s=u+v"], focus: "s", expect: { s: COL([1, 1, 0]) }, ans: "No: con el plano x + y + z = 1, los puntos (1; 0; 0) y (0; 1; 0) están en él pero su suma (1; 1; 0) no (1 + 1 + 0 = 2 ≠ 1). El origen tampoco pertenece." }]);
ejercicio(14, "Recta (t + 1; 2t; t − 1)", "Determinar si los puntos de ℝ³ sobre la recta x = t + 1, y = 2t, z = t − 1 forman un espacio vectorial.",
  [{ l: "", cmds: ["u=[1;0;-1]", "v=[2;2;0]", "s=u+v", "z=0*u"], focus: "s", expect: { s: COL([3, 2, -1]), z: COL([0, 0, 0]) }, ans: "No: u = (1; 0; −1) (t = 0) y v = (2; 2; 0) (t = 1) están en la recta, pero u + v = (3; 2; −1) no (con x = 3 haría falta t = 2 e y = 4). El origen no está en la recta (no hay t con x = y = z = 0).",
    note: "El apunte menciona los axiomas 1º, 3º, 4º y 6º; los realmente decisivos son 1º, 4º y 6º." }]);
ejercicio(15, "Polinomios de grado ≤ n", "Comprobar si el conjunto de polinomios de grado menor o igual que n con coeficientes reales es un espacio vectorial.",
  [T("", "Sí: la suma y el producto por un escalar de polinomios de grado ≤ n siguen siendo de grado ≤ n, existe el polinomio nulo y valen los diez axiomas. Tiene dimensión n + 1 (base 1, x, …, xⁿ).")]);
ejercicio(16, "Números complejos a + bi", "Verificar si los complejos z = a + bi forman un espacio vectorial.",
  [T("", "Sí (sobre ℝ): se verifican los diez axiomas con la suma de complejos y el producto por un real. Es equivalente a ℝ² con base {1, i}.")]);
ejercicio(17, "W = {(0; 0), (2; 3)}", "Dado W = {(0; 0); (2; 3)} ⊂ ℝ², comprobar si es un subespacio vectorial.",
  [{ l: "", cmds: ["u=[2;3]", "r=2*u"], focus: "r", expect: { r: COL([4, 6]) }, ans: "No es subespacio: 2·(2; 3) = (4; 6) ∉ W (no es cerrado para el producto por escalares) ni para la suma." }]);
ejercicio(18, "W = {(0; 0; 0)}", "Dado W = {(0; 0; 0)} ⊂ ℝ³, comprobar si es un subespacio.",
  [T("", "Sí es subespacio (el subespacio nulo): 0 + 0 = 0, k·0 = 0 y contiene al neutro. Su dimensión es 0.")]);
ejercicio(19, "x₁ = 0 y x₂ = 2x₃", "Dado W = {(x₁; x₂; x₃) / x₁ = 0, x₂ = 2x₃}, comprobar si es subespacio de ℝ³.",
  [{ l: "", cmds: ["u=[0;2;1]", "v=[0;-6;-3]", "s=u+v", "m=5*u"], focus: "s", expect: { s: COL([0, -4, -2]), m: COL([0, 10, 5]) }, ans: "Sí es subespacio: es la recta t(0; 2; 1). La suma (0; −4; −2) y el múltiplo (0; 10; 5) conservan las dos condiciones, y (0; 0; 0) ∈ W." }]);
ejercicio(20, "x₁ = 1", "Dado W = {(x₁; x₂) / x₁ = 1}, comprobar si es subespacio de ℝ².",
  [{ l: "", cmds: ["u=[1;0]", "v=[1;3]", "s=u+v"], focus: "s", expect: { s: COL([2, 3]) }, ans: "No es subespacio: (1; 0) + (1; 3) = (2; 3) tiene x₁ = 2 ≠ 1, y el origen no está en W." }]);
ejercicio(21, "x₃ = 3x₁ + x₂", "Dado W = {(x₁; x₂; x₃) / x₃ = 3x₁ + x₂}, comprobar si es subespacio de ℝ³.",
  [{ l: "", cmds: ["u=[1;1;4]", "v=[2;-3;3]", "s=u+v", "m=(-2)*u"], focus: "s", expect: { s: COL([3, -2, 7]), m: COL([-2, -2, -8]) }, ans: "Sí es subespacio: es un plano que pasa por el origen. 7 = 3·3 + (−2) y −8 = 3(−2) + (−2): la suma y los múltiplos cumplen la condición." }]);
ejercicio(22, "x₁x₂ = 1 y x₃ = x₄", "Dado W = {(x₁; x₂; x₃; x₄) / x₁x₂ = 1, x₃ = x₄}, comprobar si es subespacio de ℝ⁴.",
  [{ l: "", cmds: ["u=[1;1;2;2]", "z=0*u"], focus: "z", expect: { z: COL([0, 0, 0, 0]) }, ans: "No es subespacio: 0·u = (0; 0; 0; 0) no está en W porque 0·0 ≠ 1. (Además la condición x₁x₂ = 1 no es lineal.)" }]);
ejercicio(23, "Matrices de traza cero", "¿Son las matrices [a b; c d] con a + d = 0 un subespacio de ℝ²ˣ²?",
  [{ l: "", cmds: ["A=[2,1;3,-2]", "B=[-1,4;0,1]", "S=A+B", "m=3*A"], focus: "S", expect: { S: MM([[1, 5], [3, -1]]), m: MM([[6, 3], [9, -6]]) }, ans: "Sí es subespacio: (a₁ + a₂) + (d₁ + d₂) = 0 y ka + kd = 0, y la matriz nula tiene traza 0. En el ejemplo la suma tiene traza 1 − 1 = 0 y 3A tiene traza 6 − 6 = 0." }]);
ejercicio(24, "Matrices simétricas", "¿Forman un subespacio de ℝ²ˣ² las matrices A con A = Aᵀ?",
  [{ l: "", cmds: ["A=[1,2;2,3]", "B=[0,-4;-4,5]", "S=A+B", "t=Igual(S,S^T)"], focus: "t", expect: { S: MM([[1, -2], [-2, 8]]), t: "Son iguales" }, ans: "Sí es subespacio: (A + B)ᵀ = Aᵀ + Bᵀ = A + B y (kA)ᵀ = kAᵀ = kA, y la matriz nula es simétrica." }]);
ejercicio(25, "Polinomios con a₀ = 0", "¿Forman un subespacio de p₃ los polinomios a₀ + a₁x + a₂x² + a₃x³ con a₀ = 0?",
  [{ l: "", cmds: ["p=[0;1;-2;3]", "q=[0;4;0;-1]", "s=p+q", "m=(-3)*p"], focus: "s", expect: { s: COL([0, 5, -2, 2]), m: COL([0, -3, 6, -9]) }, ans: "Sí es subespacio: la suma y los múltiplos tienen término independiente 0, y el polinomio nulo está en W. Su dimensión es 3." }]);
ejercicio(26, "Polinomios con coeficientes enteros", "¿Es subespacio de p₃ el conjunto de polinomios con coeficientes a₀, a₁, a₂, a₃ enteros?",
  [{ l: "", cmds: ["p=[1;0;0;0]", "m=(1/2)*p"], focus: "m", expect: { m: COL([1 / 2, 0, 0, 0]) }, ans: "No es subespacio: (1/2)·1 = 1/2 tiene un coeficiente no entero, así que no es cerrado para el producto por escalares reales." }]);
ejercicio(27, "Matrices inversibles", "¿Forman un subespacio de ℝ²ˣ² las matrices inversibles de orden 2?",
  [{ l: "", cmds: ["A=Identidad(2)", "B=[-1,0;0,-1]", "S=A+B", "d=Det(S)"], focus: "d", expect: { S: MM([[0, 0], [0, 0]]), d: 0 }, ans: "No es subespacio: A = I y B = −I son inversibles pero A + B = 0 no lo es (|0| = 0). La suma no es cerrada, y además la matriz nula no es inversible." }]);
ejercicio(28, "Funciones con f(2) = 0 o f(2) = 1", "Sea V el conjunto de las funciones reales con las operaciones punto a punto. ¿Es subespacio 1º) {f / f(2) = 0}; 2º) {f / f(2) = 1}?",
  [T("1º", "Sí: (f + g)(2) = f(2) + g(2) = 0, (kf)(2) = k·0 = 0 y la función nula cumple f(2) = 0."),
   T("2º", "No: (f + g)(2) = 1 + 1 = 2 ≠ 1, y la función nula no cumple f(2) = 1.")]);

/* ---- Combinación lineal ---- */
ejercicio(29, "¿w = (1; 2) es combinación lineal de u = (4; 3) y v = (1; 5)?", "Comprobar si w = (1; 2) es combinación lineal de u = (4; 3) y v = (1; 5). Se plantea k₁u + k₂v = w.",
  [S("", [[4, 1], [3, 5]], [1, 2], "det", { x: [3 / 17, 5 / 17], vars: ["k₁", "k₂"], ans: "Sí: k₁ = 3/17 y k₂ = 5/17, es decir w = (3/17)u + (5/17)v." })]);
ejercicio(30, "Combinaciones de u = (2; 1; 4), v = (1; −1; 3), w = (3; 2; 5)", "Expresar los vectores como combinación lineal de u = (2; 1; 4), v = (1; −1; 3) y w = (3; 2; 5): a) (5; 9; 5); b) (2; 0; 6); c) (0; 0; 0); d) (2; 2; 3).",
  [Mem("a", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [5, 9, 5], true, { x: [3, -4, 1], ans: "k₁ = 3, k₂ = −4, k₃ = 1." }),
   Mem("b", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [2, 0, 6], true, { x: [4, 0, -2], ans: "k₁ = 4, k₂ = 0, k₃ = −2." }),
   Mem("c", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [0, 0, 0], true, { x: ZERO3, ans: "k₁ = k₂ = k₃ = 0 (el vector nulo siempre es combinación lineal)." }),
   Mem("d", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [2, 2, 3], true, { x: [1 / 2, -1 / 2, 1 / 2], ans: "k₁ = 1/2, k₂ = −1/2, k₃ = 1/2." })]);
ejercicio(31, "Combinación lineal de polinomios", "Verificar cuáles de a) 5 + 9x + 5x²; b) 2 + 6x²; c) 0; d) 2 + 2x + 3x² son combinación lineal de p₁ = 2 + x + 4x², p₂ = 1 − x + 3x², p₃ = 3 + 2x + 5x². Se trabaja con las coordenadas (a₀; a₁; a₂).",
  [Mem("a", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [5, 9, 5], true, { x: [3, -4, 1], ans: "k₁ = 3, k₂ = −4, k₃ = 1." }),
   Mem("b", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [2, 0, 6], true, { x: [4, 0, -2], ans: "k₁ = 4, k₂ = 0, k₃ = −2.", note: "El apunte plantea 2 + 6x² como el vector (2; 0; 6) igual que en el ejercicio 30." }),
   Mem("c", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [0, 0, 0], true, { x: ZERO3, ans: "k₁ = k₂ = k₃ = 0." }),
   Mem("d", [[2, 1, 4], [1, -1, 3], [3, 2, 5]], [2, 2, 3], true, { x: [1 / 2, -1 / 2, 1 / 2], ans: "k₁ = 1/2, k₂ = −1/2, k₃ = 1/2." })]);
const MA = [1, 2, -1, 3], MB = [0, 1, 2, 4], MC = [4, -2, 0, -2];
ejercicio(32, "Combinación lineal de matrices", "Determinar cuáles de las matrices a) [6 3; 0 8]; b) [−1 7; 5 1]; c) [0 0; 0 0]; d) [6 −1; −8 −8] son combinación lineal de A = [1 2; −1 3], B = [0 1; 2 4] y C = [4 −2; 0 −2]. Cada matriz se trata como el vector (a₁₁; a₁₂; a₂₁; a₂₂) de ℝ⁴.",
  [Mem("a", [MA, MB, MC], [6, 3, 0, 8], true, { x: [2, 1, 1], ans: "Sí: 2A + B + C = [6 3; 0 8]." }),
   Mem("b", [MA, MB, MC], [-1, 7, 5, 1], false, { ans: "No hay escalares: el sistema es incompatible." }),
   Mem("c", [MA, MB, MC], [0, 0, 0, 0], true, { x: ZERO3, ans: "Sí: con escalares todos nulos." }),
   Mem("d", [MA, MB, MC], [6, -1, -8, -8], true, { x: [2, -3, 1], ans: "Sí: 2A − 3B + C = [6 −1; −8 −8]." })]);

/* ---- Generadores ---- */
ejercicio(33, "¿Generan ℝ³?", "Determinar si los vectores generan ℝ³: a) (1; 1; 1), (2; 2; 0), (3; 0; 0); b) (2; −1; 3), (4; 1; 2), (8; −1; 8); c) (3; 1; 4), (2; −3; 5), (5; −2; 9), (1; 4; −1); d) (1; 3; 3), (1; 3; 4), (1; 4; 3), (6; 2; 1).",
  [V("a", [[1, 1, 1], [2, 2, 0], [3, 0, 0]], "Genera", GEN(3), 3, "Generan ℝ³: rango 3."),
   V("b", [[2, -1, 3], [4, 1, 2], [8, -1, 8]], "Genera", NOGEN, 2, "No generan ℝ³: rango 2; solo cumplen 5x − 8y − 6z = 0 (es el ejemplo 6)."),
   V("c", [[3, 1, 4], [2, -3, 5], [5, -2, 9], [1, 4, -1]], "Genera", NOGEN, 2, "No generan ℝ³: rango 2 (cuatro vectores pero todos en un mismo plano)."),
   V("d", [[1, 3, 3], [1, 3, 4], [1, 4, 3], [6, 2, 1]], "Genera", GEN(3), 3, "Generan ℝ³: rango 3.")]);
ejercicio(34, "¿Generan p₂?", "Determinar si p = 1 + 2x − x², q = 3 + x², r = 5 + 4x − x² y t = −2 + 2x − 2x² generan p₂ (coordenadas (a₀; a₁; a₂)).",
  [V("", [[1, 2, -1], [3, 0, 1], [5, 4, -1], [-2, 2, -2]], "Genera", NOGEN, 2, "No generan p₂: el rango es 2 < 3.")]);
ejercicio(35, "¿Generan ℝ³?", "Determinar si v = (1; 1; 1), u = (2; 2; 0) y w = (3; 0; 0) generan ℝ³.",
  [V("", [[1, 1, 1], [2, 2, 0], [3, 0, 0]], "Genera", GEN(3), 3, "Sí generan ℝ³ (rango 3, |A| = −6 ≠ 0).")]);

/* ---- Pertenencia a un subespacio generado ---- */
ejercicio(36, "¿u ∈ gen{v₁, v₂}?", "Determinar si u = (3; −5; −3) pertenece al subespacio generado por v₁ = (2; −1; 1) y v₂ = (1; 3; 5).",
  [Mem("", [[2, -1, 1], [1, 3, 5]], [3, -5, -3], true, { x: [2, -1], ans: "Sí pertenece: u = 2v₁ − v₂." })]);
ejercicio(37, "¿u ∈ gen{v₁, v₂, v₃} en ℝ⁴?", "Determinar si u = (1; 3; 8; 3) pertenece al subespacio generado por v₁ = (1; 0; 2; 1), v₂ = (0; 1; 2; 1) y v₃ = (0; 2; 4; 1).",
  [Mem("", [[1, 0, 2, 1], [0, 1, 2, 1], [0, 2, 4, 1]], [1, 3, 8, 3], true, { x: [1, 1, 1], ans: "Sí pertenece: u = v₁ + v₂ + v₃." })]);
ejercicio(38, "¿p ∈ gen{q, t}?", "Determinar si p = x² − 6x − 4 pertenece al subespacio generado por q = x² + x + 3 y t = 2x² − 5x − 1 (coordenadas (a₀; a₁; a₂)).",
  [Mem("", [[3, 1, 1], [-1, -5, 2]], [-4, -6, 1], true, { x: [-1, 1], ans: "Sí pertenece: p = −q + t." })]);
ejercicio(39, "¿p ∈ gen{q₁, q₂, q₃}?", "Determinar si p = x² + 1 pertenece al subespacio generado por q₁ = x² + x + 1, q₂ = 2x² + x + 2 y q₃ = 3x² + 2x + 3.",
  [Mem("", [[1, 1, 1], [2, 1, 2], [3, 2, 3]], [1, 0, 1], true, { kind: "ind", p: [-1, 1, 0], N: [[-1, -1, 1]], ans: "Sí pertenece: p = −q₁ + q₂. Como q₃ = q₁ + q₂, hay infinitas formas de escribirlo (sistema compatible indeterminado)." })]);
ejercicio(40, "¿A ∈ gen{B₁, B₂}?", "Determinar si A pertenece al subespacio generado por B₁ y B₂: a) A = [3 0; 2 2], B₁ = [1 0; 0 1], B₂ = [2 0; 1 1]; b) A = [1 1 0; 1 0 1], B₁ = [0 2 0; 1 0 −1], B₂ = [1 −1 0; 0 0 2].",
  [Mem("a", [[1, 0, 0, 1], [2, 0, 1, 1]], [3, 0, 2, 2], false, { ans: "No pertenece: sale k₂ = 2 de la posición (2,1) y k₁ = 0 de (2,2), pero entonces (1,1) vale 4 ≠ 3." }),
   Mem("b", [[0, 2, 0, 1, 0, -1], [1, -1, 0, 0, 0, 2]], [1, 1, 0, 1, 0, 1], true, { x: [1, 1], ans: "Sí pertenece: A = B₁ + B₂." })]);
ejercicio(41, "¿v ∈ gen{q, w, s}?", "Determinar si v = (1; −6; −6) pertenece al subespacio generado por q = (1; 1; 3), w = (2; −5; −1) y s = (0; 1; 1).",
  [Mem("", [[1, 1, 3], [2, -5, -1], [0, 1, 1]], [1, -6, -6], false, { ans: "No pertenece: el sistema es incompatible." })]);
ejercicio(42, "Valor de α para v = (α; 4; −1)", "Determinar α para que v = (α; 4; −1) pertenezca al subespacio generado por u = (−1; 2; 1) y w = (3; 1; −1).",
  [Mem("α = 5", [[-1, 2, 1], [3, 1, -1]], [5, 4, -1], true, { x: [1, 2], ans: "Con α = 5: v = u + 2w." }),
   Mem("α = 0", [[-1, 2, 1], [3, 1, -1]], [0, 4, -1], false, { ans: "Con cualquier α ≠ 5 el sistema es incompatible (v no pertenece)." })]);
ejercicio(43, "Valor de α para u = (−4; α; 9)", "Determinar α para que u = (−4; α; 9) pertenezca al subespacio generado por v = (5; 7; 0) y w = (2; 6; 3).",
  [Mem("α = 4", [[5, 7, 0], [2, 6, 3]], [-4, 4, 9], true, { x: [-2, 3], ans: "Con α = 4: u = −2v + 3w." }),
   Mem("α = 0", [[5, 7, 0], [2, 6, 3]], [-4, 0, 9], false, { ans: "Con α ≠ 4 no pertenece." })]);
ejercicio(44, "Valor de α para A = [α 0; 2 α]", "Determinar α para que A = [α 0; 2 α] pertenezca al subespacio generado por B = [2 −1; 1 3] y C = [−1 1; 1 −2].",
  [Mem("α = 1", [[2, -1, 1, 3], [-1, 1, 1, -2]], [1, 0, 2, 1], true, { x: [1, 1], ans: "Con α = 1: A = B + C." }),
   Mem("α = 0", [[2, -1, 1, 3], [-1, 1, 1, -2]], [0, 0, 2, 0], false, { ans: "Con α ≠ 1 no pertenece." })]);
ejercicio(45, "¿p ∈ gen{q, t, s}?", "Determinar si p = 3 − x + x² pertenece al subespacio generado por q = −1 + x², t = 1 − 2x + 3x² y s = 3x − 6x².",
  [Mem("", [[-1, 0, 1], [1, -2, 3], [0, 3, -6]], [3, -1, 1], false, { ans: "No pertenece: el sistema es incompatible." })]);
ejercicio(46, "¿u es combinación lineal de s, v, w?", "Determinar si u = (−3; 3; 6) se puede expresar como combinación lineal de s = (0; 0; 4), v = (−4; 2; 4) y w = (7; 0; 0).",
  [Mem("", [[0, 0, 4], [-4, 2, 4], [7, 0, 0]], [-3, 3, 6], true, { x: [0, 3 / 2, 3 / 7], ans: "Sí: u = 0·s + (3/2)v + (3/7)w." })]);

/* ---- Independencia lineal ---- */
ejercicio(47, "Polinomios LI o LD en p₂", "¿Cuáles son linealmente dependientes y cuáles independientes? a) 2 − x + 4x²; 3 + 6x + 2x²; 2 + 10x − 4x². b) 3 + x + x²; 2 − x + 5x²; 4 − 3x². c) 6 − x²; 1 + x + 4x². d) 1 + 3x + 3x²; x + 4x²; 5 + 6x + 3x²; 7 + 2x − x².",
  [V("a", [[2, -1, 4], [3, 6, 2], [2, 10, -4]], "Indep", LI, 3, "Linealmente independientes."),
   V("b", [[3, 1, 1], [2, -1, 5], [4, 0, -3]], "Indep", LI, 3, "Linealmente independientes."),
   V("c", [[6, 0, -1], [1, 1, 4]], "Indep", LI, 2, "Linealmente independientes."),
   V("d", [[1, 3, 3], [0, 1, 4], [5, 6, 3], [7, 2, -1]], "Indep", LD, 3, "Linealmente dependientes: son 4 vectores en un espacio de dimensión 3 (teorema 1).")]);
ejercicio(48, "v = (1; 2; 0) y w = (1; 0; 0)", "Determinar si v = (1; 2; 0) y w = (1; 0; 0) son linealmente dependientes o independientes.",
  [V("", [[1, 2, 0], [1, 0, 0]], "Indep", LI, 2, "Linealmente independientes: ninguno es múltiplo del otro (rango 2).")]);
ejercicio(49, "v₁, v₂, v₃ en ℝ³", "Determinar si v₁ = (1; −2; 3), v₂ = (5; 6; −1) y v₃ = (3; 2; 1) son linealmente dependientes o independientes.",
  [V("", [[1, -2, 3], [5, 6, -1], [3, 2, 1]], "Indep", LD, 2, "Linealmente dependientes: v₃ = (1/2)v₁ + (1/2)v₂... en general rango 2 < 3; |A| = 0.")]);
const L50 = (l) => [[l, -1 / 2, 1 / 2], [-1 / 2, l, -1 / 2], [-1 / 2, -1 / 2, l]];
ejercicio(50, "Valores de λ para vectores dependientes", "¿Para qué valores de λ son linealmente dependientes v₁ = (λ; −1/2; 1/2), v₂ = (−1/2; λ; −1/2) y v₃ = (−1/2; −1/2; λ)? Se buscan los λ que anulan |A| (vectores como columnas).",
  [V("λ = 0", L50(0), "Indep", LD, 2, "|A| = λ³ − λ/4 = 0: linealmente dependientes."),
   V("λ = 1/2", L50(1 / 2), "Indep", LD, 2, "|A| = 0: linealmente dependientes."),
   V("λ = −1/2", L50(-1 / 2), "Indep", LD, 2, "|A| = 0: linealmente dependientes."),
   V("λ = 1 (control)", L50(1), "Indep", LI, 3, "Con λ = 1 el determinante vale 3/4 ≠ 0: independientes. Son dependientes solo para λ = 0, 1/2 y −1/2 (raíces de λ³ − λ/4).")]);
ejercicio(51, "¿Vectores en un mismo plano?", "Determinar en cada caso si v₁, v₂ y v₃ (con punto inicial en el origen) están sobre un mismo plano. Lo están si son linealmente dependientes (|A| = 0).",
  [V("a", [[1, 0, -2], [3, 1, 2], [1, -1, 0]], "Indep", LI, 3, "No están en un mismo plano: |A| = 10 ≠ 0."),
   V("b", [[2, -1, 4], [4, 2, 3], [2, 7, -6]], "Indep", LD, 2, "Sí están en un mismo plano: |A| = 0.")]);
ejercicio(52, "¿Bases de ℝ²?", "Determinar cuáles de los conjuntos son bases de ℝ²: a) (2; 1), (3; 0); b) (4; 1), (−7; −8); c) (0; 0), (1; 3); d) (3; 9), (4; 12).",
  [V("a", [[2, 1], [3, 0]], "Base", "Es base*", 2, "Es base de ℝ²: |A| = −3 ≠ 0."),
   V("b", [[4, 1], [-7, -8]], "Base", "Es base*", 2, "Es base de ℝ²: |A| = −25 ≠ 0."),
   V("c", [[0, 0], [1, 3]], "Base", "No es base*", 1, "No es base: contiene al vector nulo (dependientes)."),
   V("d", [[3, 9], [4, 12]], "Base", "No es base*", 1, "No es base: (4; 12) = (4/3)(3; 9), son dependientes.")]);
ejercicio(53, "¿Bases de ℝ³?", "Determinar cuáles son bases de ℝ³: a) (1; 0; 0), (2; 2; 0), (3; 3; 3); b) (3; 1; −4), (2; 5; 6), (1; 4; 8); c) (2; −3; 1), (4; 1; 1), (0; −7; 1); d) (1; 6; 4), (2; 4; −1), (−1; 2; 5).",
  [V("a", [[1, 0, 0], [2, 2, 0], [3, 3, 3]], "Base", "Es base*", 3, "Es base de ℝ³: |A| = 6 ≠ 0."),
   V("b", [[3, 1, -4], [2, 5, 6], [1, 4, 8]], "Base", "Es base*", 3, "Es base de ℝ³: |A| ≠ 0."),
   V("c", [[2, -3, 1], [4, 1, 1], [0, -7, 1]], "Base", "No es base*", 2, "No es base: |A| = 0, son dependientes."),
   V("d", [[1, 6, 4], [2, 4, -1], [-1, 2, 5]], "Base", "No es base*", 2, "No es base: |A| = 0, son dependientes.")]);
ejercicio(54, "¿Bases de p₂?", "Determinar cuáles son bases de los polinomios de grado ≤ 2 (coordenadas (a₀; a₁; a₂)): a) 1 − 3x + 2x², 1 + x + 4x², 1 − 7x; b) 4 + 6x + x², −1 + 4x + 2x², 5 + 2x − x²; c) 1 + x + x², x + x², x²; d) −4 + x + 3x², 6 + 5x + 2x², 8 + 4x + x².",
  [V("a", [[1, -3, 2], [1, 1, 4], [1, -7, 0]], "Base", "No es base*", 2, "No es base: |A| = 0."),
   V("b", [[4, 6, 1], [-1, 4, 2], [5, 2, -1]], "Base", "No es base*", 2, "No es base: |A| = 0."),
   V("c", [[1, 1, 1], [0, 1, 1], [0, 0, 1]], "Base", "Es base*", 3, "Es base de p₂: |A| = 1."),
   V("d", [[-4, 1, 3], [6, 5, 2], [8, 4, 1]], "Base", "Es base*", 3, "Es base de p₂: |A| ≠ 0.")]);
ejercicio(55, "Base de ℝ²ˣ²", "Demostrar que A = [3 6; 3 −6], B = [0 −1; −1 0], C = [0 −8; −12 −4] y D = [1 0; −1 2] son una base de ℝ²ˣ². Cada matriz es el vector (a₁₁; a₁₂; a₂₁; a₂₂) de ℝ⁴.",
  [V("", [[3, 6, 3, -6], [0, -1, -1, 0], [0, -8, -12, -4], [1, 0, -1, 2]], "Base", "Es base*", 4, "Son 4 matrices linealmente independientes en un espacio de dimensión 4: |A| ≠ 0, forman una base.")]);
ejercicio(56, "¿S = {(1 + x)², x² + 2x, 3} es base de p₂?", "Demostrar si S = {(1 + x)²; x² + 2x; 3} es base de p₂. Se desarrolla (1 + x)² = 1 + 2x + x².",
  [V("", [[1, 2, 1], [0, 2, 1], [3, 0, 0]], "Base", "No es base*", 2, "No es base: |A| = 0 (los vectores son linealmente dependientes: (1 + x)² − (x² + 2x) − (1/3)·3 = 0).")]);
const SOL = (l, A, d, N, ans) => ({ l, cmds: ["A=" + mx(A), "d=Dimension(A)", "N=Nucleo(A)"], focus: "N", expect: { d, N }, ans });
ejercicio(57, "Espacio de soluciones (1)", "Determinar la dimensión del espacio de soluciones de x + y − z = 0; −2x − y + 2z = 0; −x + z = 0 y hallar una base.",
  [SOL("", [[1, 1, -1], [-2, -1, 2], [-1, 0, 1]], 1, TR([[1, 0, 1]]), "dim = 3 − rango(A) = 3 − 2 = 1. Solución: (x; y; z) = t(1; 0; 1). Base: {(1; 0; 1)}.")]);
ejercicio(58, "Espacio de soluciones (2)", "Determinar la dimensión del espacio de soluciones de x + y + z = 0; 3x + 2y − 2z = 0; 4x + 3y − z = 0; 6x + 5y + z = 0 y hallar una base.",
  [SOL("", [[1, 1, 1], [3, 2, -2], [4, 3, -1], [6, 5, 1]], 1, TR([[4, -5, 1]]), "dim = 1. Solución: (x; y; z) = t(4; −5; 1). Base: {(4; −5; 1)}.")]);
ejercicio(59, "Espacio de soluciones (3)", "Determinar la dimensión del espacio de soluciones de 2x + y + 3z = 0; x + 5z = 0; y + z = 0 y hallar una base.",
  [{ l: "", cmds: ["A=[2,1,3;1,0,5;0,1,1]", "d=Det(A)", "c=Clasificar(A,[0;0;0])", "X=Resolver(A,[0;0;0])"], focus: "X", expect: { d: -8, c: "Compatible determinado", X: COL([0, 0, 0]) },
    ans: "|A| = −8 ≠ 0: solo la solución trivial (0; 0; 0). El espacio de soluciones es {0}: no tiene base y su dimensión es 0." }]);
ejercicio(60, "Espacio de soluciones (4)", "Determinar la dimensión del espacio de soluciones de x − 4y + 3z − w = 0; 2x − 8y + 6z − 2w = 0 y hallar una base.",
  [SOL("", [[1, -4, 3, -1], [2, -8, 6, -2]], 3, TR([[4, 1, 0, 0], [-3, 0, 1, 0], [1, 0, 0, 1]]), "La segunda ecuación es el doble de la primera: rango 1 y dim = 4 − 1 = 3. Base: {(4; 1; 0; 0), (−3; 0; 1; 0), (1; 0; 0; 1)}.")]);
ejercicio(61, "Dimensión de subespacios de ℝ⁴", "Determinar la dimensión de: a) los vectores (a; b; c; 0); b) los (a; b; c; d) con d = a + b y c = a − b; c) los (a; b; c; d) con a = b = c = d.",
  [{ l: "a", cmds: ["A=[0,0,0,1]", "d=Dimension(A)"], focus: "d", expect: { d: 3 }, ans: "dim = 3 (base: e₁, e₂, e₃)." },
   { l: "b", cmds: ["A=[1,1,0,-1;1,-1,-1,0]", "d=Dimension(A)", "N=Nucleo(A)"], focus: "N", expect: { d: 2 }, ans: "Dos parámetros libres (a y b): dim = 2. Base: {(1; 0; 1; 1), (0; 1; −1; 1)}." },
   { l: "c", cmds: ["A=[1,-1,0,0;0,1,-1,0;0,0,1,-1]", "d=Dimension(A)", "N=Nucleo(A)"], focus: "N", expect: { d: 1, N: TR([[1, 1, 1, 1]]) }, ans: "dim = 1 (base: (1; 1; 1; 1))." }]);
ejercicio(62, "Coordenadas respecto de una base B", "Sea B = (v₁; v₂; v₃) una base de ℝ³. Dar las matrices de coordenadas de: a) u = 2v₁ + 3v₂ − v₃; b) w = v₁ + 0v₂ − 6v₃; c) u + w; d) 3u + 2w; e) 0; f) v₁; g) v₂; h) v₃.",
  [{ l: "a, b", cmds: ["u=[2;3;-1]", "w=[1;0;-6]"], focus: "w", expect: { u: COL([2, 3, -1]), w: COL([1, 0, -6]) }, ans: "[u]B = (2; 3; −1) y [w]B = (1; 0; −6): las coordenadas son los coeficientes." },
   { l: "c", cmds: ["u=[2;3;-1]", "w=[1;0;-6]", "s=u+w"], focus: "s", expect: { s: COL([3, 3, -7]) }, ans: "[u + w]B = [u]B + [w]B = (3; 3; −7)." },
   { l: "d", cmds: ["u=[2;3;-1]", "w=[1;0;-6]", "s=3*u+2*w"], focus: "s", expect: { s: COL([8, 9, -15]) }, ans: "[3u + 2w]B = 3[u]B + 2[w]B = (8; 9; −15)." },
   { l: "e", cmds: ["z=0*[1;1;1]"], focus: "z", expect: { z: COL([0, 0, 0]) }, ans: "[0]B = (0; 0; 0)." },
   { l: "f, g, h", cmds: ["I=Identidad(3)"], focus: "I", expect: { I: MM([[1, 0, 0], [0, 1, 0], [0, 0, 1]]) }, ans: "[v₁]B = (1; 0; 0), [v₂]B = (0; 1; 0), [v₃]B = (0; 0; 1): son las columnas de la identidad." }]);
ejercicio(63, "Vectores de coordenadas respecto de B", "Con B = (v₁; v₂; v₃) base de ℝ³: a) dar las coordenadas de u₁ = 2v₁ + 5v₂ − 3v₃, u₂ = v₁ + 4v₃, u₃ = v₂ y u₄ = 0. b) Dados [w₁]B = (1; 5; 2) y [w₂]B = (−2; 1; 8): i) w₁; ii) w₂; iii) [w₁ + w₂]B; iv) 2[w₂]B; v) [2w₁ + 3w₂]B.",
  [{ l: "a", cmds: ["u1=[2;5;-3]", "u2=[1;0;4]", "u3=[0;1;0]", "u4=[0;0;0]"], focus: "u1", expect: { u1: COL([2, 5, -3]), u2: COL([1, 0, 4]), u3: COL([0, 1, 0]), u4: COL([0, 0, 0]) }, ans: "[u₁]B = (2; 5; −3), [u₂]B = (1; 0; 4), [u₃]B = (0; 1; 0), [u₄]B = (0; 0; 0)." },
   { l: "b i, ii", cmds: ["w1=[1;5;2]", "w2=[-2;1;8]"], focus: "w2", expect: { w1: COL([1, 5, 2]), w2: COL([-2, 1, 8]) }, ans: "w₁ = 1v₁ + 5v₂ + 2v₃ y w₂ = −2v₁ + 1v₂ + 8v₃." },
   { l: "b iii, iv", cmds: ["w1=[1;5;2]", "w2=[-2;1;8]", "s=w1+w2", "d=2*w2"], focus: "s", expect: { s: COL([-1, 6, 10]), d: COL([-4, 2, 16]) }, ans: "[w₁ + w₂]B = (−1; 6; 10) y 2[w₂]B = (−4; 2; 16)." },
   { l: "b v", cmds: ["w1=[1;5;2]", "w2=[-2;1;8]", "s=2*w1+3*w2"], focus: "s", expect: { s: COL([-4, 13, 28]) }, ans: "[2w₁ + 3w₂]B = (−4; 13; 28)." }]);
ejercicio(64, "Coordenadas en p₂ con B = (1; 1 + x; 1 + x²)", "a) Dar las coordenadas de p = 2 − 3x + 5x², q = 3 + x + x² y t = 1 + x respecto de B = (1; 1 + x; 1 + x²). b) Con la misma base y [p]B = (1; 2; −3) hallar p; y con B′ = (1; x; x²) y [q]B′ = (1; 2; −3) hallar q.",
  [{ l: "a", cmds: ["B=" + cm([1, 0, 0], [1, 1, 0], [1, 0, 1]), "p=[2;-3;5]", "q=[3;1;1]", "t=[1;1;0]", "xp=Resolver(B,p)", "xq=Resolver(B,q)", "xt=Resolver(B,t)"], focus: "xp",
    expect: { xp: COL([0, -3, 5]), xq: COL([1, 1, 1]), xt: COL([0, 1, 0]) }, ans: "(p)B = (0; −3; 5), (q)B = (1; 1; 1), (t)B = (0; 1; 0)." },
   { l: "b", cmds: ["B=" + cm([1, 0, 0], [1, 1, 0], [1, 0, 1]), "c=[1;2;-3]", "p=B*c"], focus: "p", expect: { p: COL([0, 2, -3]) }, ans: "p = 1·1 + 2(1 + x) − 3(1 + x²) = 0 + 2x − 3x². Con la base canónica B′, q = 1 + 2x − 3x² (las coordenadas son los coeficientes)." }]);
ejercicio(65, "Coordenadas de una matriz", "En ℝ²ˣ² con la base B = (C; D; E; F), C = [−1 1; 0 0], D = [1 1; 0 0], E = [0 0; 1 0], F = [0 0; 0 1], dar el vector y la matriz de coordenadas de A = [2 0; −1 3].",
  [{ l: "", cmds: ["B=" + cm([-1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]), "a=[2;0;-1;3]", "X=Resolver(B,a)"], focus: "X", expect: { X: COL([-1, 1, -1, 3]) }, ans: "(A)B = (−1; 1; −1; 3): A = −C + D − E + 3F." }]);
ejercicio(66, "Cambio de base en p₁", "Con B = {6 + 3x; 10 + 2x} y B′ = {2; 3 + 2x} bases de p₁: a) matriz de cambio de base de B a B′; b) [p]B′ para p = −4 + x; c) matriz de cambio de base de B′ a B.",
  [{ l: "a", cmds: ["Bm=[6,10;3,2]", "Bp=[2,3;0,2]", "P=Inversa(Bp)*Bm"], focus: "P", expect: { P: MM([[3 / 4, 7 / 2], [3 / 2, 1]]) }, ans: "P = B′⁻¹·B = [3/4 7/2; 3/2 1]." },
   { l: "b", cmds: ["Bp=[2,3;0,2]", "p=[-4;1]", "X=Resolver(Bp,p)"], focus: "X", expect: { X: COL([-11 / 4, 1 / 2]) }, ans: "[p]B′ = (−11/4; 1/2)." },
   { l: "c", cmds: ["Bm=[6,10;3,2]", "Bp=[2,3;0,2]", "P=Inversa(Bp)*Bm", "Q=Inversa(P)"], focus: "Q", expect: { Q: MM([[-2 / 9, 7 / 9], [1 / 3, -1 / 6]]) }, ans: "Q = P⁻¹ = [−2/9 7/9; 1/3 −1/6]." }]);
ejercicio(67, "Cambio de base con P dada", "En un espacio de dimensión 2 con P = M(B→B′) = [1 2; 2 5] ([v]B′ = P[v]B): a) hallar [v]B si [v]B′ = (2; 1); b) hallar [v]B′ si [v]B = (2; −3).",
  [{ l: "a", cmds: ["P=[1,2;2,5]", "vp=[2;1]", "v=Inversa(P)*vp"], focus: "v", expect: { v: COL([8, -3]) }, ans: "[v]B = P⁻¹[v]B′ = (8; −3)." },
   { l: "b", cmds: ["P=[1,2;2,5]", "v=[2;-3]", "vp=P*v"], focus: "vp", expect: { vp: COL([-4, -11]) }, ans: "[v]B′ = P[v]B = (−4; −11)." }]);
ejercicio(68, "Cambio de base en p₂", "Con B = (1; x; x²) y B′ = (1 + x + x²; −2 − x + x²; −1 + x + x²), hallar la matriz de cambio de base de B′ a B.",
  [{ l: "", cmds: ["Bm=Identidad(3)", "Bp=" + cm([1, 1, 1], [-2, -1, 1], [-1, 1, 1]), "Q=Inversa(Bm)*Bp"], focus: "Q", expect: { Q: MM([[1, -2, -1], [1, -1, 1], [1, 1, 1]]) }, ans: "Q = B⁻¹·B′: como B es la canónica, las columnas de Q son los coeficientes de los polinomios de B′. Q = [1 −2 −1; 1 −1 1; 1 1 1]." }]);
ejercicio(69, "Hallar B′ conociendo P", "En ℝ² con B = {(1; 1), (0; 1)}, hallar la base B′ tal que P = [1 3; 2 −5] sea la matriz de pasaje de B a B′.",
  [{ l: "", cmds: ["Bm=[1,0;1,1]", "P=[1,3;2,-5]", "Bp=Bm*Inversa(P)"], focus: "Bp", expect: { Bp: MM([[5 / 11, 3 / 11], [7 / 11, 2 / 11]]) }, ans: "De P = B′⁻¹·B resulta B′ = B·P⁻¹ = [5/11 3/11; 7/11 2/11]. Entonces B′ = {(5/11; 7/11), (3/11; 2/11)}." }]);
