import { COL, MM, S, TR, mx, unitBuilder } from "./items.js";

/* ===== Unidad 6 · Transformaciones lineales ===== */
const TAG = "Transformaciones lineales";
const { list: EX6, ejemplo, ejercicio } = unitBuilder(6, TAG);
export { EX6 };

// Los vectores, polinomios (por coeficientes) y matrices (por filas) se trabajan como vectores columna.
const cm = (...vs) => mx(vs[0].map((_, i) => vs.map((v) => v[i])));
const ZERO = (n) => Array(n).fill(0);
const T = (l, ans, note) => (note ? { l, cmds: [], ans, note } : { l, cmds: [], ans });
const ARR = (v) => "[" + v.join(";") + "]";
const IGUALES = "Son iguales", DIST = "No son iguales";

// Prueba numérica de linealidad con u, v y k: F(u + v) contra F(u) + F(v), y F(ku) contra kF(u).
// fail: "add" | "hom" | "both" indica qué propiedad se espera que falle (vacío: es lineal).
function Lin(l, F, u, v, k, fail, ans, note) {
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const Fu = F(u), Fv = F(v), Fs = F(add(u, v)), Fk = F(u.map((x) => k * x));
  const item = {
    l,
    cmds: ["u=" + ARR(u), "v=" + ARR(v), "k=" + k, "Fu=" + ARR(Fu), "Fv=" + ARR(Fv), "Fs=" + ARR(Fs), "Fk=" + ARR(Fk), "a=Igual(Fs,Fu+Fv)", "h=Igual(Fk,k*Fu)"],
    focus: fail ? (fail === "hom" ? "h" : "a") : "h",
    expect: { a: fail === "add" || fail === "both" ? DIST : IGUALES, h: fail === "hom" || fail === "both" ? DIST : IGUALES },
    ans,
  };
  if (note) item.note = note;
  return item;
}
const LIN = "Es lineal: se cumplen F(u + v) = F(u) + F(v) y F(ku) = kF(u). Con los valores de prueba coinciden, pero la demostración usa componentes genéricas.";
const rows = (Mx, v) => Mx.map((r) => r.reduce((s, c, j) => s + c * v[j], 0));

/* ---------- Ejemplos (recuadros del apunte) ---------- */
ejemplo(1, "F(x; y) = (x; x + y; x − y) ¿es lineal?", "F: ℝ² → ℝ³, F(v) = (x; x + y; x − y). Se verifican F(u + v) = F(u) + F(v) y F(ku) = kF(u) con u = (1; 2), v = (3; −1) y k = 4.",
  [Lin("", (p) => [p[0], p[0] + p[1], p[0] - p[1]], [1, 2], [3, -1], 4, "", "Es lineal: F(u + v) = [x₁ + x₂; (x₁ + y₁) + (x₂ + y₂); (x₁ − y₁) + (x₂ − y₂)] = F(u) + F(v) y F(ku) = kF(u).")]);
ejemplo(2, "F: p₂ → p₂ con a₀ + (a₁ + a₂)x + (2a₀ − 3a₁)x²", "F(a₀ + a₁x + a₂x²) = a₀ + (a₁ + a₂)x + (2a₀ − 3a₁)x². Con los polinomios como vectores de coeficientes (a₀; a₁; a₂), la transformación es la multiplicación por M.",
  [{ l: "", cmds: ["M=[1,0,0;0,1,1;2,-3,0]", "p=[1;2;3]", "q=[4;-1;0]", "a=Igual(M*(p+q),M*p+M*q)", "h=Igual(M*(5*p),5*(M*p))"], focus: "h", expect: { a: IGUALES, h: IGUALES },
    ans: "Es lineal: se cumplen los dos axiomas. Toda función dada por una matriz, F(v) = M·v, es lineal." }]);
ejemplo(3, "Ejercicio 4: determinar F con tres imágenes", "F: ℝ³ → ℝ⁴ con F(1; 0; 0) = (1; 0; 2; 1), F(0; 2; 1) = (0; 0; 0; 0) y F(0; 0; −1) = (2; −1; 0; 0). ¿Define una transformación lineal única? Hallar F(x; y; z).",
  [{ l: "Es base", cmds: ["B=" + cm([1, 0, 0], [0, 2, 1], [0, 0, -1]), "d=Det(B)", "b=Base(B)"], focus: "b", expect: { d: -2, b: "Es base de ℝ³" },
    ans: "|B| = −2 ≠ 0: los tres vectores son una base de ℝ³. Por el teorema de existencia y unicidad hay una única transformación lineal con esas imágenes." },
   { l: "Fórmula", cmds: ["B=" + cm([1, 0, 0], [0, 2, 1], [0, 0, -1]), "I=" + cm([1, 0, 2, 1], [0, 0, 0, 0], [2, -1, 0, 0]), "M=I*Inversa(B)", "w=M*[1;2;3]"], focus: "M",
    expect: { M: MM([[1, 1, -2], [0, -1 / 2, 1], [2, 0, 0], [1, 0, 0]]), w: COL([-3, 2, 2, 1]) },
    ans: "F(x; y; z) = (x + y − 2z; −y/2 + z; 2x; x). La matriz es M = I·B⁻¹, con las imágenes como columnas de I. Verificación con (1; 2; 3): F = (−3; 2; 2; 1)." }]);
ejemplo(4, "Base de la imagen con la base canónica", "T: ℝ² → ℝ³, T(x₁; x₂) = (x₂; x₁; x₁ + x₂). Las imágenes de e₁ y e₂ generan la imagen.",
  [{ l: "", cmds: ["A=[0,1;1,0;1,1]", "I=Imagen(A)", "r=Rango(A)"], focus: "I", expect: { r: 2, I: TR([[1, 0, 1], [0, 1, 1]]) },
    ans: "T(e₁) = (0; 1; 1) y T(e₂) = (1; 0; 1) son una base de la imagen: el rango de T es 2." }]);
ejemplo(5, "Ejercicio 1: espacio de soluciones de un homogéneo", "Sistema homogéneo de 4 ecuaciones y 5 incógnitas: 2x₁ + 2x₂ − x₃ + x₅ = 0; −x₁ − x₂ + 2x₃ − 3x₄ + x₅ = 0; x₁ + x₂ − 2x₃ − x₅ = 0; x₃ + x₄ + x₅ = 0. Hallar el núcleo, el rango y la nulidad.",
  [{ l: "", cmds: ["A=[2,2,-1,0,1;-1,-1,2,-3,1;1,1,-2,0,-1;0,0,1,1,1]", "r=Rango(A)", "n=Nulidad(A)", "N=Nucleo(A)"], focus: "N", expect: { r: 3, n: 2, N: TR([[-1, 1, 0, 0, 0], [-1, 0, -1, 0, 1]]) },
    ans: "Con x₂ = s y x₅ = t: x = s(−1; 1; 0; 0; 0) + t(−1; 0; −1; 0; 1). Nulidad 2, rango 3 y 3 + 2 = 5 = n (teorema de la dimensión)." }]);
ejemplo(6, "Ejercicio 2: ¿está en la imagen?", "T: ℝ² → ℝ² es la multiplicación por A = [2 −1; −8 4]. ¿Está (1; −4) en la imagen de T? Dar rango y nulidad.",
  [{ l: "", cmds: ["A=[2,-1;-8,4]", "b=[1;-4]", "t=Clasificar(A,b)", "r=Rango(A)", "n=Nulidad(A)"], focus: "t", expect: { t: "Compatible indeterminado", r: 1, n: 1 },
    ans: "Ax = b es compatible, así que (1; −4) está en la imagen. rango(T) = 1, nulidad(T) = 1 y 1 + 1 = 2." }]);
ejemplo(7, "Ejercicio 3: ¿está en el núcleo?", "Con la misma A, ¿está (5; 10) en el núcleo de T?",
  [{ l: "", cmds: ["A=[2,-1;-8,4]", "v=[5;10]", "z=A*v"], focus: "z", expect: { z: COL([0, 0]) }, ans: "A·(5; 10) = (0; 0): el vector está en el núcleo." }]);
ejemplo(8, "Ejercicio 4: F(x₁; x₂) = 2x₁ − 5x₂", "F: ℝ² → ℝ. Hallar imagen, núcleo, rango y nulidad.",
  [{ l: "", cmds: ["A=[2,-5]", "r=Rango(A)", "n=Nulidad(A)", "N=Nucleo(A)"], focus: "N", expect: { r: 1, n: 1, N: COL([5 / 2, 1]) },
    ans: "Imagen = ℝ (rango 1). Núcleo: 2x₁ − 5x₂ = 0, base {(5/2; 1)}, nulidad 1 y 1 + 1 = 2." }]);
ejemplo(9, "Ejercicio 5: fórmula a partir de una base", "S = {v₁ = (1; 2; 3), v₂ = (2; 5; 3), v₃ = (1; 0; 10)} es base de ℝ³. Hallar F: ℝ³ → ℝ² con F(v₁) = (1; 0), F(v₂) = (1; 0), F(v₃) = (0; 1) y calcular F(1; 1; 1).",
  [{ l: "", cmds: ["S=" + cm([1, 2, 3], [2, 5, 3], [1, 0, 10]), "I=" + cm([1, 0], [1, 0], [0, 1]), "M=I*Inversa(S)", "w=M*[1;1;1]"], focus: "M", expect: { M: MM([[30, -10, -3], [-9, 3, 1]]), w: COL([17, -5]) },
    ans: "F(x; y; z) = (30x − 10y − 3z; −9x + 3y + z) y F(1; 1; 1) = (17; −5). La matriz es M = I·S⁻¹." }]);
ejemplo(10, "Ejercicio 6: imagen y núcleo de una matriz 3×3", "F es la multiplicación por A = [1 −1 3; 5 6 −4; 7 4 2]. Hallar una base de la imagen, una base del núcleo, el rango y la nulidad.",
  [{ l: "Imagen", cmds: ["A=[1,-1,3;5,6,-4;7,4,2]", "I=Imagen(A)", "c=Caracterizar(A)"], focus: "I", expect: { I: TR([[1, 0, 2], [0, 1, 1]]), c: "2y₁ + y₂ − y₃ = 0" }, ans: "Base de la imagen: {(1; 0; 2), (0; 1; 1)}. La condición 2b₁ + b₂ − b₃ = 0 caracteriza la imagen (es un plano)." },
   { l: "Núcleo", cmds: ["A=[1,-1,3;5,6,-4;7,4,2]", "N=Nucleo(A)", "r=Rango(A)", "n=Nulidad(A)"], focus: "N", expect: { N: COL([-14 / 11, 19 / 11, 1]), r: 2, n: 1 }, ans: "Base del núcleo: {(−14/11; 19/11; 1)}. Rango 2, nulidad 1 y 2 + 1 = 3." }]);
ejemplo(11, "Ejercicio 7: F: ℝ⁴ → ℝ³ por las imágenes de e₁, …, e₄", "F(e₁) = (1; 2; 1), F(e₂) = (0; 1; 0), F(e₃) = (1; 3; 0), F(e₄) = (1; 1; 1). Hallar bases del núcleo y de la imagen, el rango y la nulidad.",
  [{ l: "", cmds: ["A=" + cm([1, 2, 1], [0, 1, 0], [1, 3, 0], [1, 1, 1]), "N=Nucleo(A)", "r=Rango(A)", "n=Nulidad(A)", "g=Genera(A)"], focus: "N", expect: { N: COL([-1, 1, 0, 1]), r: 3, n: 1, g: "Genera ℝ³" },
    ans: "Núcleo: base {(−1; 1; 0; 1)}, nulidad 1. Imagen: rango 3, o sea la imagen es todo ℝ³ (el apunte da la base {(1; 2; 1), (0; 1; 0), (0; 0; −1)}). 3 + 1 = 4." }]);
ejemplo(12, "Imagen por una base de ℝ³", "S = {v₁ = (1; 1; 1), v₂ = (1; 1; 0), v₃ = (1; 0; 0)}, T(v₁) = (1; 0), T(v₂) = (2; −1), T(v₃) = (4; 3). Hallar T(2; −3; 5).",
  [{ l: "", cmds: ["S=" + cm([1, 1, 1], [1, 1, 0], [1, 0, 0]), "k=Resolver(S,[2;-3;5])", "I=" + cm([1, 0], [2, -1], [4, 3]), "w=I*k"], focus: "w", expect: { k: COL([5, -8, 5]), w: COL([9, 23]) },
    ans: "(2; −3; 5) = 5v₁ − 8v₂ + 5v₃, entonces T(2; −3; 5) = 5(1; 0) − 8(2; −1) + 5(4; 3) = (9; 23)." }]);
ejemplo(13, "Matriz estándar de F(x₁; x₂) = (x₁ + 2x₂; x₁ − x₂)", "Las columnas de la matriz estándar son las imágenes de la base canónica.",
  [{ l: "", cmds: ["e1=[1;0]", "e2=[0;1]", "A=" + cm([1, 1], [2, -1]), "c=A*[3;4]"], focus: "A", expect: { A: MM([[1, 2], [1, -1]]), c: COL([11, -1]) },
    ans: "F(e₁) = (1; 1) y F(e₂) = (2; −1) son las columnas: A = [1 2; 1 −1]. Comprobación: F(3; 4) = (3 + 8; 3 − 4) = (11; −1)." }]);
ejemplo(14, "Matriz estándar de T: ℝ³ → ℝ⁴", "T(x₁; x₂; x₃) = (x₁ + x₂; x₁ − x₂; x₃; x₁).",
  [{ l: "", cmds: ["A=[1,1,0;1,-1,0;0,0,1;1,0,0]", "c=A*[2;3;4]"], focus: "A", expect: { A: MM([[1, 1, 0], [1, -1, 0], [0, 0, 1], [1, 0, 0]]), c: COL([5, -1, 4, 2]) }, ans: "A = [1 1 0; 1 −1 0; 0 0 1; 1 0 0] (cada columna es T(eⱼ)). Verificación con (2; 3; 4): (5; −1; 4; 2)." }]);
ejemplo(15, "Rotación de 90° en el plano", "Hallar la imagen de (1; 1) por la rotación de 90° en sentido antihorario.",
  [{ l: "", cmds: ["R=Rot(90)", "w=R*[1;1]"], focus: "w", expect: { R: MM([[0, -1], [1, 0]]), w: COL([-1, 1]) }, ans: "R = [0 −1; 1 0] y T(1; 1) = (−1; 1)." }]);
ejemplo(16, "Composición: deslizamiento y reflexión", "Hallar la matriz que primero hace un deslizamiento cortante de factor 2 en x y luego una reflexión respecto de y = x; y también el orden inverso. Aplicarlas a (2; 1).",
  [{ l: "Corte y reflexión", cmds: ["A1=[1,2;0,1]", "A2=[0,1;1,0]", "A=A2*A1", "w=A*[2;1]"], focus: "A", expect: { A: MM([[0, 1], [1, 2]]), w: COL([1, 4]) },
    ans: "A = A₂·A₁ = [0 1; 1 2] (se multiplica en orden inverso al de aplicación). (2; 1) → (4; 1) → (1; 4)." },
   { l: "Reflexión y corte", cmds: ["A1=[1,2;0,1]", "A2=[0,1;1,0]", "B=A1*A2", "w=B*[2;1]"], focus: "B", expect: { B: MM([[2, 1], [1, 0]]), w: COL([5, 2]) },
    ans: "B = A₁·A₂ = [2 1; 1 0] ≠ A₂·A₁: el orden importa. (2; 1) → (1; 2) → (5; 2)." }]);
ejemplo(17, "Transformación inversa", "Una compresión de factor 1/2 en la dirección de y tiene matriz A = [1 0; 0 1/2]. Su inversa devuelve cada punto a su lugar.",
  [{ l: "", cmds: ["A=[1,0;0,1/2]", "B=Inversa(A)", "P=A*[3;4]", "Q=B*P"], focus: "B", expect: { B: MM([[1, 0], [0, 2]]), P: COL([3, 2]), Q: COL([3, 4]) }, ans: "A⁻¹ = [1 0; 0 2]: una expansión de factor 2 en y. (3; 4) → (3; 2) → (3; 4)." }]);
ejemplo(18, "Matriz de T: p₁ → p₂, T(p) = x·p(x)", "Respecto de las bases B = {1; x} y B′ = {1; x; x²}. Usarla para calcular T(1 − 2x) por el procedimiento indirecto.",
  [{ l: "", cmds: ["A=[0,0;1,0;0,1]", "x=[1;-2]", "y=A*x"], focus: "y", expect: { y: COL([0, 1, -2]) }, ans: "[T(u₁)]B′ = (0; 1; 0) y [T(u₂)]B′ = (0; 0; 1) son las columnas de A. [T(x)]B′ = A·(1; −2) = (0; 1; −2), o sea T(1 − 2x) = x − 2x²." }]);
ejemplo(19, "Matriz de F: ℝ² → ℝ³ respecto de B = {(1; 3), (0; −2)}", "F(x₁; x₂) = (x₁ + x₂; x₂; x₁) y B′ la base canónica de ℝ³. Hallar M(F) respecto de B y B′.",
  [{ l: "", cmds: ["Std=[1,1;0,1;1,0]", "Bm=" + cm([1, 3], [0, -2]), "Bp=Identidad(3)", "A=Inversa(Bp)*Std*Bm"], focus: "A", expect: { A: MM([[4, -2], [3, -2], [1, 0]]) },
    ans: "F(1; 3) = (4; 3; 1) y F(0; −2) = (−2; −2; 0): como B′ es canónica, esas imágenes son directamente las columnas. A = [4 −2; 3 −2; 1 0]. En general A = B′⁻¹·(matriz estándar)·B." }]);
ejemplo(20, "Método indirecto con bases B y B′", "F: ℝ² → ℝ² tiene matriz A = [1 3; −2 1] respecto de B = {(2; 1), (0; 1)} y B′ = {(0; 2), (1; 1)}. Hallar [F(4; 5)]B′ y F(4; 5).",
  [{ l: "", cmds: ["A=[1,3;-2,1]", "Bm=" + cm([2, 1], [0, 1]), "Bp=" + cm([0, 2], [1, 1]), "x=Resolver(Bm,[4;5])", "y=A*x", "f=Bp*y"], focus: "f", expect: { x: COL([2, 3]), y: COL([11, -1]), f: COL([-1, 21]) },
    ans: "[(4; 5)]B = (2; 3), [F(4; 5)]B′ = A·(2; 3) = (11; −1) y F(4; 5) = 11(0; 2) − 1(1; 1) = (−1; 21)." }]);
ejemplo(21, "Matriz de F: p₂ → p₁ en bases canónicas", "F(a₀ + a₁x + a₂x²) = (a₀ + a₁) − (2a₁ + 3a₂)x.",
  [{ l: "", cmds: ["A=[1,1,0;0,-2,-3]", "c=A*[1;2;3]"], focus: "A", expect: { A: MM([[1, 1, 0], [0, -2, -3]]), c: COL([3, -13]) }, ans: "Las columnas son las coordenadas de F(1) = 1, F(x) = 1 − 2x y F(x²) = −3x. Con 1 + 2x + 3x²: F = 3 − 13x." }]);
ejemplo(22, "Ingeniería: insumo-producto", "Programa de producción x = (50; 500; 1000) (Estándar 4x2, Estándar 6x2, Base 4x2). Matriz de insumos A: cable (m) y terminales por unidad. ¿Cuánto hay que comprar?",
  [{ l: "", cmds: ["A=[58,92,48;200,250,150]", "x=[50;500;1000]", "T=A*x"], focus: "T", expect: { T: COL([96900, 285000]) },
    ans: "T(x) = A·x = (96.900 m de cable; 285.000 terminales).", note: "El apunte escribe 28 en lugar de 58 para el cable del modelo Estándar 4x2 en la matriz; con 58 el resultado es el que se publica (96.900)." }]);

/* ---------- Ejercicios para resolver ---------- */
ejercicio(1, "¿Es lineal F: ℝ² → ℝ²?", "Determinar si F es lineal: a) F(x; y) = (2x; y); b) F(x; y) = (x²; y); c) F(x; y) = (0; y); d) F(x; y) = (x; y + 1); e) F(x; y) = (y; y); f) F(x; y) = (∛x; ∛y).",
  [Lin("a", (p) => [2 * p[0], p[1]], [1, 2], [3, -1], 4, "", LIN),
   Lin("b", (p) => [p[0] * p[0], p[1]], [1, 2], [3, -1], 4, "both", "No es lineal: F(u + v) = (16; 1) pero F(u) + F(v) = (10; 1), y F(4u) = (16; 8) pero 4F(u) = (4; 8)."),
   Lin("c", (p) => [0, p[1]], [1, 2], [3, -1], 4, "", LIN),
   Lin("d", (p) => [p[0], p[1] + 1], [1, 2], [3, -1], 4, "both", "No es lineal: F(0; 0) = (0; 1) ≠ (0; 0) (toda transformación lineal cumple T(0) = 0)."),
   Lin("e", (p) => [p[1], p[1]], [1, 2], [3, -1], 4, "", LIN),
   Lin("f", (p) => [Math.cbrt(p[0]), Math.cbrt(p[1])], [1, 0], [7, 0], 8, "both", "No es lineal: F(1; 0) + F(7; 0) = (1 + ∛7; 0) ≈ (2,91; 0) pero F(8; 0) = (2; 0).")]);
ejercicio(2, "¿Es lineal F: ℝ³ → ℝ²?", "Determinar si F es lineal: a) F(x; y; z) = (x; x + y + z); b) F(x; y; z) = (0; 0); c) F(x; y; z) = (1; 1); d) F(x; y; z) = (2x + y; 3y − 4z).",
  [Lin("a", (p) => [p[0], p[0] + p[1] + p[2]], [1, 2, 3], [0, -1, 4], 3, "", LIN),
   Lin("b", () => [0, 0], [1, 2, 3], [0, -1, 4], 3, "", "Es lineal: es la transformación cero."),
   Lin("c", () => [1, 1], [1, 2, 3], [0, -1, 4], 3, "both", "No es lineal: F(u + v) = (1; 1) pero F(u) + F(v) = (2; 2); además F(0) ≠ 0."),
   Lin("d", (p) => [2 * p[0] + p[1], 3 * p[1] - 4 * p[2]], [1, 2, 3], [0, -1, 4], 3, "", LIN)]);
ejercicio(3, "¿Es lineal F: ℝ²ˣ² → ℝ?", "Con la matriz (a b; c d) como (a; b; c; d): a) F = a + d; b) F = 2a + 3b + c − d; c) F = a² + b².",
  [Lin("a", (p) => [p[0] + p[3]], [1, 2, 3, 4], [0, 5, -1, 2], 3, "", LIN),
   Lin("b", (p) => [2 * p[0] + 3 * p[1] + p[2] - p[3]], [1, 2, 3, 4], [0, 5, -1, 2], 3, "", LIN),
   Lin("c", (p) => [p[0] ** 2 + p[1] ** 2], [1, 2, 3, 4], [0, 5, -1, 2], 3, "both", "No es lineal: F(u + v) = 1 + 49 = 50 pero F(u) + F(v) = 5 + 25 = 30.")]);
ejercicio(4, "¿Es lineal F: p₂ → p₂?", "Con p = a₀ + a₁x + a₂x² como (a₀; a₁; a₂): a) F(p) = a₀ + a₁(x + 1) + a₂(x + 1)²; b) F(p) = 0; c) F(p) = (a₀ + 1) + a₁x + a₂x².",
  [Lin("a", (p) => [p[0] + p[1] + p[2], p[1] + 2 * p[2], p[2]], [1, 2, 3], [0, -1, 4], 3, "", LIN + " Desarrollando (x + 1)² = 1 + 2x + x²: F(p) = (a₀ + a₁ + a₂) + (a₁ + 2a₂)x + a₂x²."),
   Lin("b", () => [0, 0, 0], [1, 2, 3], [0, -1, 4], 3, "", "Es lineal (transformación cero)."),
   Lin("c", (p) => [p[0] + 1, p[1], p[2]], [1, 2, 3], [0, -1, 4], 3, "both", "No es lineal: F(0) = 1 ≠ 0.")]);
ejercicio(5, "T(a₀ + a₁x + a₂x²) = a₀ + a₁x", "Verificar si T: p₂ → p₂ es lineal.",
  [Lin("", (p) => [p[0], p[1], 0], [1, 2, 3], [0, -1, 4], 3, "", "Es lineal: es la proyección que descarta el término cuadrático.")]);
ejercicio(6, "T(M) = det(M)", "¿Es lineal T: Mₙₓₘ → ℝ con T(M) = det(M)? Se prueba con matrices 2×2.",
  [{ l: "", cmds: ["A=Identidad(2)", "B=Identidad(2)", "s=Det(A+B)", "t=Det(A)+Det(B)", "h=Det(3*A)", "g=3*Det(A)"], focus: "s", expect: { s: 4, t: 2, h: 9, g: 3 },
    ans: "No es lineal: det(A + B) = 4 ≠ det(A) + det(B) = 2, y det(3A) = 9 ≠ 3·det(A) = 3. No cumple ninguno de los dos axiomas." }]);
ejercicio(7, "Imágenes con dos datos", "F: ℝ³ → ℝ² lineal con F(1; 3; 0) = (−4; 5) y F(−1; 2; 0) = (1; 3). Hallar las imágenes de: a) (1; 3; 0); b) 3(−1; 2; 0); c) 2(1; 3; 0) + 4(−1; 2; 0); d) (0; 0; 0); e) (0; 1; 0); f) (1; 0; 0).",
  [{ l: "a", cmds: ["f1=[-4;5]"], focus: "f1", expect: { f1: COL([-4, 5]) }, ans: "F(1; 3; 0) = (−4; 5) (es un dato)." },
   { l: "b", cmds: ["f2=[1;3]", "r=3*f2"], focus: "r", expect: { r: COL([3, 9]) }, ans: "F(3(−1; 2; 0)) = 3·F(−1; 2; 0) = (3; 9)." },
   { l: "c", cmds: ["f1=[-4;5]", "f2=[1;3]", "r=2*f1+4*f2"], focus: "r", expect: { r: COL([-4, 22]) }, ans: "2(−4; 5) + 4(1; 3) = (−4; 22)." },
   { l: "d", cmds: ["z=0*[1;3]"], focus: "z", expect: { z: COL([0, 0]) }, ans: "F(0) = 0." },
   { l: "e", cmds: ["B=" + cm([1, 3, 0], [-1, 2, 0]), "I=" + cm([-4, 5], [1, 3]), "k=Resolver(B,[0;1;0])", "r=I*k"], focus: "r", expect: { k: COL([1 / 5, 1 / 5]), r: COL([-3 / 5, 8 / 5]) }, ans: "(0; 1; 0) = (1/5)(1; 3; 0) + (1/5)(−1; 2; 0), entonces F(0; 1; 0) = (−3/5; 8/5)." },
   { l: "f", cmds: ["B=" + cm([1, 3, 0], [-1, 2, 0]), "I=" + cm([-4, 5], [1, 3]), "k=Resolver(B,[1;0;0])", "r=I*k"], focus: "r", expect: { k: COL([2 / 5, -3 / 5]), r: COL([-11 / 5, 1 / 5]) }, ans: "(1; 0; 0) = (2/5)(1; 3; 0) − (3/5)(−1; 2; 0), entonces F(1; 0; 0) = (−11/5; 1/5)." }]);
ejercicio(8, "F: ℝ²ˣ¹ → ℝ³ˣ¹ con F(1; 0) y F(0; 1)", "F(1; 0) = (2; 1; 3) y F(0; 1) = (3; −1; 2). Hallar: a) F(1; 1); b) F(3; 2); c) F(x₁; x₂).",
  [{ l: "a", cmds: ["A=" + cm([2, 1, 3], [3, -1, 2]), "r=A*[1;1]"], focus: "r", expect: { r: COL([5, 0, 5]) }, ans: "F(1; 1) = (5; 0; 5)." },
   { l: "b", cmds: ["A=" + cm([2, 1, 3], [3, -1, 2]), "r=A*[3;2]"], focus: "r", expect: { r: COL([12, 1, 13]) }, ans: "F(3; 2) = (12; 1; 13)." },
   { l: "c", cmds: ["A=" + cm([2, 1, 3], [3, -1, 2])], focus: "A", expect: { A: MM([[2, 3], [1, -1], [3, 2]]) }, ans: "F(x₁; x₂) = (2x₁ + 3x₂; x₁ − x₂; 3x₁ + 2x₂)." }]);
ejercicio(9, "F: p₂ → p₂ con F(1), F(x), F(x²)", "F(1) = 1 + x, F(x) = x + x², F(x²) = 1. Hallar a) F(2 + 3x − 5x²); b) F(a + bx + cx²).",
  [{ l: "a", cmds: ["M=" + cm([1, 1, 0], [0, 1, 1], [1, 0, 0]), "r=M*[2;3;-5]"], focus: "r", expect: { M: MM([[1, 0, 1], [1, 1, 0], [0, 1, 0]]), r: COL([-3, 5, 3]) }, ans: "F(2 + 3x − 5x²) = −3 + 5x + 3x²." },
   { l: "b", cmds: ["M=" + cm([1, 1, 0], [0, 1, 1], [1, 0, 0]), "r=M*[1;2;3]"], focus: "r", expect: { r: COL([4, 3, 2]) }, ans: "F(a + bx + cx²) = (a + c) + (a + b)x + bx². Con (a; b; c) = (1; 2; 3): (4; 3; 2), que coincide." }]);
ejercicio(10, "F(1; 3) = (2; 3), F(2; 1) = (−1; 5)", "F: ℝ² → ℝ² lineal. Hallar F(3; −5).",
  [{ l: "", cmds: ["B=" + cm([1, 3], [2, 1]), "I=" + cm([2, 3], [-1, 5]), "M=I*Inversa(B)", "r=M*[3;-5]"], focus: "r", expect: { r: COL([-8, 31 / 5]) }, ans: "(3; −5) = −(13/5)(1; 3) + (14/5)(2; 1), entonces F(3; −5) = (−8; 31/5)." }]);
ejercicio(11, "Imagen y núcleo de A = [2 −1; −8 4]", "T: ℝ² → ℝ² es la multiplicación por A. ¿Cuáles están en la imagen? a) (5; 0); b) (−3; 12). ¿Cuáles están en el núcleo? c) (3; 2); d) (1; 1). Dar rango y nulidad.",
  [{ l: "a", cmds: ["A=[2,-1;-8,4]", "t=Clasificar(A,[5;0])"], focus: "t", expect: { t: "Incompatible" }, ans: "No pertenece a la imagen: el sistema es incompatible." },
   { l: "b", cmds: ["A=[2,-1;-8,4]", "t=Clasificar(A,[-3;12])"], focus: "t", expect: { t: "Compatible indeterminado" }, ans: "Sí pertenece a la imagen." },
   { l: "c", cmds: ["A=[2,-1;-8,4]", "z=A*[3;2]"], focus: "z", expect: { z: COL([4, -16]) }, ans: "A·(3; 2) = (4; −16) ≠ 0: no está en el núcleo." },
   { l: "d", cmds: ["A=[2,-1;-8,4]", "z=A*[1;1]"], focus: "z", expect: { z: COL([1, -4]) }, ans: "A·(1; 1) = (1; −4) ≠ 0: no está en el núcleo." },
   { l: "Rango y nulidad", cmds: ["A=[2,-1;-8,4]", "r=Rango(A)", "n=Nulidad(A)"], focus: "r", expect: { r: 1, n: 1 }, ans: "rango(T) = 1 y nulidad(T) = 1." }]);
const A12 = "[4,1,-2,-3;2,1,1,-4;6,0,-9,9]";
ejercicio(12, "Imagen y núcleo de una matriz 3×4", "T: ℝ⁴ → ℝ³ es la multiplicación por A = [4 1 −2 −3; 2 1 1 −4; 6 0 −9 9]. ¿Cuáles están en la imagen? a) (0; 0; 6); b) (1; 3; 0); c) (2; 4; 1). ¿Cuáles en el núcleo? d) (3; −8; 2; 0); e) (0; 0; 0; 1); f) (0; −4; 1; 0). Dar rango y nulidad.",
  [...[["a", [0, 0, 6]], ["b", [1, 3, 0]], ["c", [2, 4, 1]]].map(([l, b]) => ({ l, cmds: ["A=" + A12, "t=Clasificar(A," + ARR(b) + ")"], focus: "t", expect: { t: "Compatible indeterminado" }, ans: "Sí pertenece a la imagen: el sistema es compatible (rango 3, la imagen es todo ℝ³)." })),
   { l: "d", cmds: ["A=" + A12, "z=A*[3;-8;2;0]"], focus: "z", expect: { z: COL([0, 0, 0]) }, ans: "A·(3; −8; 2; 0) = 0: está en el núcleo." },
   { l: "e", cmds: ["A=" + A12, "z=A*[0;0;0;1]"], focus: "z", expect: { z: COL([-3, -4, 9]) }, ans: "A·(0; 0; 0; 1) = (−3; −4; 9) ≠ 0: no está en el núcleo." },
   { l: "f", cmds: ["A=" + A12, "z=A*[0;-4;1;0]"], focus: "z", expect: { z: COL([-6, -3, -9]) }, ans: "A·(0; −4; 1; 0) = (−6; −3; −9) ≠ 0: no está en el núcleo." },
   { l: "Rango y nulidad", cmds: ["A=" + A12, "r=Rango(A)", "n=Nulidad(A)"], focus: "r", expect: { r: 3, n: 1 }, ans: "rango(T) = 3 y nulidad(T) = 1; 3 + 1 = 4." }]);
ejercicio(13, "F(x₁; x₂) = (x₂; x₁; x₁ + x₂)", "F: ℝ² → ℝ³. Hallar imagen, núcleo, rango y nulidad.",
  [{ l: "Imagen", cmds: ["A=[0,1;1,0;1,1]", "I=Imagen(A)", "c=Caracterizar(A)"], focus: "c", expect: { I: TR([[1, 0, 1], [0, 1, 1]]), c: "y₁ + y₂ − y₃ = 0" }, ans: "I(F) = {(y₁; y₂; y₃) : y₃ = y₁ + y₂}, un plano de ℝ³ con base {(1; 0; 1), (0; 1; 1)}." },
   { l: "Núcleo, rango, nulidad", cmds: ["A=[0,1;1,0;1,1]", "N=Nucleo(A)", "r=Rango(A)", "n=Nulidad(A)"], focus: "N", expect: { N: COL([0, 0]), r: 2, n: 0 }, ans: "N(F) = {(0; 0)}, rango 2 y nulidad 0 (F es inyectiva)." }]);
ejercicio(14, "Base de la imagen y del núcleo de C", "F es la multiplicación por C = [4 1 5 2; 1 2 3 0]. Hallar bases de I(F) y N(F), el rango y la nulidad.",
  [{ l: "Imagen", cmds: ["C=[4,1,5,2;1,2,3,0]", "I=Imagen(C)", "r=Rango(C)"], focus: "I", expect: { I: MM([[1, 0], [0, 1]]), r: 2 }, ans: "El rango es 2 y la imagen es todo ℝ²: base canónica {(1; 0), (0; 1)} (el apunte da una base equivalente)." },
   { l: "Núcleo", cmds: ["C=[4,1,5,2;1,2,3,0]", "N=Nucleo(C)", "z=C*N", "n=Nulidad(C)"], focus: "N", expect: { N: MM([[-1, -4 / 7], [-1, 2 / 7], [1, 0], [0, 1]]), z: MM([[0, 0], [0, 0]]), n: 2 }, ans: "Base del núcleo: {(−1; −1; 1; 0), (−4/7; 2/7; 0; 1)}; nulidad 2. 2 + 2 = 4." }]);
ejercicio(15, "Teorema de la dimensión (nulidad)", "Hallar la nulidad de F: a) F: ℝ⁵ → ℝ⁷ de rango 3; b) F: ℝ⁶ → ℝ³ con imagen ℝ³; c) F: ℝ²ˣ² → ℝ²ˣ² de rango 3.",
  [{ l: "a", cmds: ["n=5", "r=3", "nu=n-r"], focus: "nu", expect: { nu: 2 }, ans: "nulidad = n − rango = 5 − 3 = 2." },
   { l: "b", cmds: ["n=6", "r=3", "nu=n-r"], focus: "nu", expect: { nu: 3 }, ans: "La imagen es ℝ³, el rango es 3: nulidad = 6 − 3 = 3." },
   { l: "c", cmds: ["n=4", "r=3", "nu=n-r"], focus: "nu", expect: { nu: 1 }, ans: "dim ℝ²ˣ² = 4: nulidad = 4 − 3 = 1." }]);
ejercicio(16, "Matriz 7×6 con solo la solución trivial", "A es 7×6, Ax = 0 tiene solo la solución trivial y F: ℝ⁶ → ℝ⁷ es la multiplicación por A. Hallar el rango y la nulidad.",
  [{ l: "", cmds: ["n=6", "nu=0", "r=n-nu"], focus: "r", expect: { r: 6, nu: 0 }, ans: "Nulidad = 0 (el núcleo es {0}) y rango = 6 − 0 = 6." }]);
ejercicio(17, "Núcleo recta e imagen plano", "F: ℝ³ → ℝ³ es la multiplicación por A = [1 3 4; 3 4 7; −2 2 0]. a) Probar que el núcleo es una recta por el origen y dar sus ecuaciones paramétricas. b) Probar que la imagen es un plano por el origen y dar su ecuación.",
  [{ l: "a", cmds: ["A=[1,3,4;3,4,7;-2,2,0]", "N=Nucleo(A)", "n=Nulidad(A)"], focus: "N", expect: { N: COL([-1, -1, 1]), n: 1 }, ans: "Nulidad 1: el núcleo es la recta x = −t, y = −t, z = t." },
   { l: "b", cmds: ["A=[1,3,4;3,4,7;-2,2,0]", "r=Rango(A)", "c=Caracterizar(A)"], focus: "c", expect: { r: 2, c: "14y₁ − 8y₂ − 5y₃ = 0" }, ans: "Rango 2: la imagen es el plano 14x − 8y − 5z = 0." }]);
ejercicio(18, "Matriz estándar de operadores", "Hallar la matriz estándar: a) F(x₁; x₂) = (2x₁ − x₂; x₁ + x₂); b) F(x₁; x₂; x₃) = (x₁ + 2x₂ + x₃; x₁ + 5x₂; x₃).",
  [{ l: "a", cmds: ["A=" + cm([2, 1], [-1, 1]), "c=A*[2;1]"], focus: "A", expect: { A: MM([[2, -1], [1, 1]]), c: COL([3, 3]) }, ans: "A = [2 −1; 1 1] y F(2; 1) = (3; 3)." },
   { l: "b", cmds: ["A=" + cm([1, 1, 0], [2, 5, 0], [1, 0, 1])], focus: "A", expect: { A: MM([[1, 2, 1], [1, 5, 0], [0, 0, 1]]) }, ans: "A = [1 2 1; 1 5 0; 0 0 1]." }]);
ejercicio(19, "Matriz estándar de transformaciones", "Hallar la matriz estándar: a) F(x₁; x₂) = (x₂; −x₁; x₁ + x₂); b) F(x₁; x₂; x₃; x₄) = (7x₁ + 2x₂ − x₃ + x₄; x₂ + x₃; −x₁); c) F(x₁; x₂; x₃; x₄) = (x₄; x₁; x₃; x₂; x₁ − x₃).",
  [{ l: "a", cmds: ["A=" + cm([0, -1, 1], [1, 0, 1]), "c=A*[2;1]"], focus: "A", expect: { A: MM([[0, 1], [-1, 0], [1, 1]]), c: COL([1, -2, 3]) }, ans: "A = [0 1; −1 0; 1 1]. Con el ejercicio 20: F(2; 1) = (1; −2; 3)." },
   { l: "b", cmds: ["A=" + cm([7, 0, -1], [2, 1, 0], [-1, 1, 0], [1, 0, 0])], focus: "A", expect: { A: MM([[7, 2, -1, 1], [0, 1, 1, 0], [-1, 0, 0, 0]]) }, ans: "A = [7 2 −1 1; 0 1 1 0; −1 0 0 0]." },
   { l: "c", cmds: ["A=" + cm([0, 1, 0, 0, 1], [0, 0, 0, 1, 0], [0, 0, 1, 0, -1], [1, 0, 0, 0, 0])], focus: "A", expect: { A: MM([[0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [1, 0, -1, 0]]) }, ans: "A = [0 0 0 1; 1 0 0 0; 0 0 1 0; 0 1 0 0; 1 0 −1 0]." }]);
ejercicio(20, "Calcular F(2; 1) y verificarlo", "Usar las matrices del ejercicio 18 (operador de ℝ²) para calcular F(2; 1) y ubicar los puntos (2; 1) y F(2; 1).",
  [{ l: "18 a", cmds: ["A=[2,-1;1,1]", "r=A*[2;1]"], focus: "r", expect: { r: COL([3, 3]) }, ans: "F(2; 1) = (3; 3).", note: "El enunciado dice «inciso anterior»; solo el 18 a) y el 19 a) actúan sobre vectores de ℝ² con dos coordenadas. La verificación gráfica queda para el plano de la Unidad 1." },
   { l: "19 a", cmds: ["A=[0,1;-1,0;1,1]", "r=A*[2;1]"], focus: "r", expect: { r: COL([1, -2, 3]) }, ans: "F(2; 1) = (1; −2; 3)." }]);
ejercicio(21, "Reflexiones en el espacio", "Hallar la matriz estándar del operador de ℝ³ que aplica (x; y; z) en su reflexión respecto del plano coordenado: a) xy; b) xz; c) yz.",
  [{ l: "a", cmds: ["A=[1,0,0;0,1,0;0,0,-1]", "r=A*[1;2;3]"], focus: "A", expect: { A: MM([[1, 0, 0], [0, 1, 0], [0, 0, -1]]), r: COL([1, 2, -3]) }, ans: "Plano xy: cambia el signo de z. A = diag(1, 1, −1)." },
   { l: "b", cmds: ["A=[1,0,0;0,-1,0;0,0,1]", "r=A*[1;2;3]"], focus: "A", expect: { A: MM([[1, 0, 0], [0, -1, 0], [0, 0, 1]]), r: COL([1, -2, 3]) }, ans: "Plano xz: cambia el signo de y. A = diag(1, −1, 1)." },
   { l: "c", cmds: ["A=[-1,0,0;0,1,0;0,0,1]", "r=A*[1;2;3]"], focus: "A", expect: { A: MM([[-1, 0, 0], [0, 1, 0], [0, 0, 1]]), r: COL([-1, 2, 3]) }, ans: "Plano yz: cambia el signo de x. A = diag(−1, 1, 1)." }].map((it) => ({ ...it, note: "El enunciado escribe F: ℝ² → ℝ³; por el contexto es un operador de ℝ³ (el punto es (x; y; z))." })));
ejercicio(22, "Compresión o dilatación", "Hallar la matriz que comprime o dilata: a) en un factor de 1/3 en la dirección de y; b) en un factor de 6 en la dirección de x.",
  [{ l: "a", cmds: ["A=[1,0;0,1/3]"], focus: "A", expect: { A: MM([[1, 0], [0, 1 / 3]]) }, ans: "A = [1 0; 0 1/3]." },
   { l: "b", cmds: ["A=[6,0;0,1]"], focus: "A", expect: { A: MM([[6, 0], [0, 1]]) }, ans: "A = [6 0; 0 1]." }]);
const SQ = "[0,1,1,0;0,0,1,1]";
ejercicio(23, "Transformar el cuadrado unidad", "Aplicar a P₁(0; 0), P₂(1; 0), P₃(1; 1), P₄(0; 1) las transformaciones del ejercicio 22, por separado. Las columnas de la matriz resultante son las imágenes de P₁, …, P₄.",
  [{ l: "a", cmds: ["P=" + SQ, "A=[1,0;0,1/3]", "Q=A*P"], focus: "Q", expect: { Q: MM([[0, 1, 1, 0], [0, 0, 1 / 3, 1 / 3]]) }, ans: "(0; 0), (1; 0), (1; 1/3), (0; 1/3): el cuadrado se comprime en y." },
   { l: "b", cmds: ["P=" + SQ, "A=[6,0;0,1]", "Q=A*P"], focus: "Q", expect: { Q: MM([[0, 6, 6, 0], [0, 0, 1, 1]]) }, ans: "(0; 0), (6; 0), (6; 1), (0; 1): el cuadrado se estira en x." }]);
const RECT = "[0,5,5,0;0,0,2,2]";
ejercicio(24, "Transformar un rectángulo", "Aplicar a P₁(0; 0), P₂(5; 0), P₃(5; 2), P₄(0; 2): a) una expansión en y con k = 2; b) una compresión en x con k = 1/4.",
  [{ l: "a", cmds: ["P=" + RECT, "A=[1,0;0,2]", "Q=A*P"], focus: "Q", expect: { Q: MM([[0, 5, 5, 0], [0, 0, 4, 4]]) }, ans: "(0; 0), (5; 0), (5; 4), (0; 4)." },
   { l: "b", cmds: ["P=" + RECT, "A=[1/4,0;0,1]", "Q=A*P"], focus: "Q", expect: { Q: MM([[0, 5 / 4, 5 / 4, 0], [0, 0, 2, 2]]) }, ans: "(0; 0), (5/4; 0), (5/4; 2), (0; 2)." }]);
ejercicio(25, "Deslizamiento cortante", "Hallar la matriz de un deslizamiento cortante: a) de factor k = 4 en la dirección de y; b) de factor k = −2 en la dirección de x. Aplicarla al cuadrado unidad.",
  [{ l: "a", cmds: ["P=" + SQ, "A=[1,0;4,1]", "Q=A*P"], focus: "Q", expect: { A: MM([[1, 0], [4, 1]]), Q: MM([[0, 1, 1, 0], [0, 4, 5, 1]]) }, ans: "A = [1 0; 4 1]: (x; y) → (x; y + 4x). El cuadrado pasa a (0; 0), (1; 4), (1; 5), (0; 1)." },
   { l: "b", cmds: ["P=" + SQ, "A=[1,-2;0,1]", "Q=A*P"], focus: "Q", expect: { A: MM([[1, -2], [0, 1]]), Q: MM([[0, 1, -1, -2], [0, 0, 1, 1]]) }, ans: "A = [1 −2; 0 1]: (x; y) → (x − 2y; y). El cuadrado pasa a (0; 0), (1; 0), (−1; 1), (−2; 1)." }]);
ejercicio(26, "Efecto geométrico de una matriz", "Describir el efecto de multiplicar por: a) [3 0; 0 1]; b) [1 0; 0 −5]; c) [1 4; 0 1].",
  [{ l: "a", cmds: ["A=[3,0;0,1]", "w=A*[1;1]"], focus: "w", expect: { w: COL([3, 1]) }, ans: "Dilatación de factor 3 en la dirección de x." },
   { l: "b", cmds: ["A=[1,0;0,-5]", "w=A*[1;1]"], focus: "w", expect: { w: COL([1, -5]) }, ans: "Multiplica y por −5: expansión de factor 5 en y combinada con una reflexión respecto del eje x." },
   { l: "c", cmds: ["A=[1,4;0,1]", "w=A*[1;1]"], focus: "w", expect: { w: COL([5, 1]) }, ans: "Deslizamiento cortante de factor 4 en la dirección de x." }]);
ejercicio(27, "Matriz de F: ℝ² → ℝ³ respecto de dos bases", "F(x₁; x₂) = (x₁ + 2x₂; −x₁; 0), B = {(1; 3), (−2; 4)} y B′ = {(1; 1; 1), (0; 2; 0), (3; 0; 0)}. a) Hallar la matriz de F respecto de B y B′. b) Usarla para calcular F(8; 3).",
  [{ l: "a", cmds: ["Std=[1,2;-1,0;0,0]", "Bm=" + cm([1, 3], [-2, 4]), "Bp=" + cm([1, 1, 1], [0, 2, 0], [3, 0, 0]), "A=Inversa(Bp)*Std*Bm"], focus: "A", expect: { A: MM([[0, 0], [-1 / 2, 1], [7 / 3, 2]]) },
    ans: "A = B′⁻¹·(matriz estándar)·B = [0 0; −1/2 1; 7/3 2]. Cada columna es [F(uⱼ)]B′." },
   { l: "b", cmds: ["Std=[1,2;-1,0;0,0]", "Bm=" + cm([1, 3], [-2, 4]), "Bp=" + cm([1, 1, 1], [0, 2, 0], [3, 0, 0]), "A=Inversa(Bp)*Std*Bm", "x=Resolver(Bm,[8;3])", "y=A*x", "f=Bp*y"], focus: "f", expect: { x: COL([19 / 5, -21 / 10]), f: COL([14, -8, 0]) },
    ans: "[(8; 3)]B = (19/5; −21/10); [F(8; 3)]B′ = A·(19/5; −21/10) y F(8; 3) = (14; −8; 0), que coincide con la fórmula (8 + 6; −8; 0)." }]);
ejercicio(28, "Matriz de F: ℝ³ → ℝ² respecto de B y la canónica", "F(x₁; x₂; x₃) = (2x₁ + x₃; x₂ + x₃), B = {(−1; 1; 0), (0; −1; 1), (1; 0; 1)} y B′ la base canónica de ℝ².",
  [{ l: "", cmds: ["Std=[2,0,1;0,1,1]", "Bm=" + cm([-1, 1, 0], [0, -1, 1], [1, 0, 1]), "A=Std*Bm"], focus: "A", expect: { A: MM([[-2, 1, 3], [1, 0, 1]]) }, ans: "F(−1; 1; 0) = (−2; 1), F(0; −1; 1) = (1; 0) y F(1; 0; 1) = (3; 1): A = [−2 1 3; 1 0 1]." }]);
ejercicio(29, "Matriz de F(p) = x²p(x)", "F: p₂ → p₄, con B = {1 + x², 1 + 2x + 3x², 4 + 5x + x²} y B′ la base canónica de p₄. a) Hallar la matriz. b) Calcular F(−3 + 5x − 2x²).",
  [{ l: "a", cmds: ["Std=" + cm([0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0, 0, 0, 0, 1]), "Bm=" + cm([1, 0, 1], [1, 2, 3], [4, 5, 1]), "A=Std*Bm"], focus: "A", expect: { A: TR([[0, 0, 1, 0, 1], [0, 0, 1, 2, 3], [0, 0, 4, 5, 1]]) }, ans: "F(1 + x²) = x² + x⁴, F(1 + 2x + 3x²) = x² + 2x³ + 3x⁴ y F(4 + 5x + x²) = 4x² + 5x³ + x⁴: son las columnas de A." },
   { l: "b", cmds: ["Std=" + cm([0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0, 0, 0, 0, 1]), "Bm=" + cm([1, 0, 1], [1, 2, 3], [4, 5, 1]), "A=Std*Bm", "x=Resolver(Bm,[-3;5;-2])", "y=A*x"], focus: "y", expect: { y: COL([0, 0, -3, 5, -2]) }, ans: "F(−3 + 5x − 2x²) = −3x² + 5x³ − 2x⁴. Se calcula las coordenadas en B, se multiplica por A y se reconstruye." }]);
ejercicio(30, "F con matriz A = [1 3; −2 5] respecto de B = B′", "B = B′ = {v₁ = (1; 3), v₂ = (−1; 4)}. a) Hallar [F(v₁)]B′ y [F(v₂)]B′. b) Hallar F(v₁) y F(v₂). c) Hallar F(1; 1).",
  [{ l: "a", cmds: ["A=[1,3;-2,5]", "c1=A*[1;0]", "c2=A*[0;1]"], focus: "c2", expect: { c1: COL([1, -2]), c2: COL([3, 5]) }, ans: "[F(v₁)]B′ = (1; −2) y [F(v₂)]B′ = (3; 5): son las columnas de A." },
   { l: "b", cmds: ["A=[1,3;-2,5]", "Bm=" + cm([1, 3], [-1, 4]), "f=Bm*A"], focus: "f", expect: { f: TR([[3, -5], [-2, 29]]) }, ans: "F(v₁) = 1·v₁ − 2·v₂ = (3; −5) y F(v₂) = 3·v₁ + 5·v₂ = (−2; 29)." },
   { l: "c", cmds: ["A=[1,3;-2,5]", "Bm=" + cm([1, 3], [-1, 4]), "x=Resolver(Bm,[1;1])", "y=A*x", "f=Bm*y"], focus: "f", expect: { x: COL([5 / 7, -2 / 7]), f: COL([19 / 7, -83 / 7]) }, ans: "[(1; 1)]B = (5/7; −2/7), [F(1; 1)]B = A·(5/7; −2/7) y F(1; 1) = (19/7; −83/7)." }]);
ejercicio(31, "Matriz del operador identidad", "F(x₁; x₂) = (x₁; x₂). Hallar la matriz respecto de: a) B = B′ = canónica; b) B = {(1; 1), (0; 1)} y B′ canónica; c) B = B′ = {(2; 3), (3; 4)}.",
  [{ l: "a", cmds: ["B=Identidad(2)", "A=Inversa(B)*B"], focus: "A", expect: { A: MM([[1, 0], [0, 1]]) }, ans: "A = I." },
   { l: "b", cmds: ["Bm=" + cm([1, 1], [0, 1]), "A=Inversa(Identidad(2))*Bm"], focus: "A", expect: { A: MM([[1, 0], [1, 1]]) }, ans: "A = [1 0; 1 1]: las columnas son los vectores de B escritos en la base canónica." },
   { l: "c", cmds: ["B=" + cm([2, 3], [3, 4]), "A=Inversa(B)*B"], focus: "A", expect: { A: MM([[1, 0], [0, 1]]) }, ans: "Con la misma base de entrada y de salida, A = I.", note: "El apunte numera esta última serie como 32 en las respuestas; el enunciado tiene 31 ejercicios." }]);
