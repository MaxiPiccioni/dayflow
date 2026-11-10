export const EX3 = [];
/* ===== Unidad 3 · Determinantes ===== */
const mx = (rows) => "[" + rows.map((r) => r.join(",")).join(";") + "]";
const MM = (rows) => ({ m: rows });
const TAG = "Determinantes";
function ejemplo3(n, title, text, items) { EX3.push({ id: "u3x" + n, kind: "ej", unit: 3, n, title, tag: TAG, text, items }); }
function ejercicio3(n, title, text, items) { EX3.push({ id: "u3e" + n, num: n, n, kind: "ex", unit: 3, title, tag: TAG, text, items }); }
const I2 = MM([[1, 0], [0, 1]]);
const I3 = MM([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
const LI = "Vectores linealmente independientes.";
const LD = "Vectores linealmente dependientes.";

/* ---------- Ejemplos (recuadros del apunte) ---------- */
ejemplo3(1, "Determinante de orden 2", "Calcular el determinante de la matriz A = [2 5; 0 1]: producto de la diagonal principal menos producto de la diagonal secundaria.",
  [{ cmds: ["A=" + mx([[2, 5], [0, 1]]), "d=Det(A)"], expect: { d: 2 }, sol: "|A| = 2·1 − 0·5 = 2 − 0 = <b>2</b>." }]);
ejemplo3(2, "Regla de Sarrus", "Calcular el determinante de B = [−1 −2 −2; −1 3 1; 2 5 −1] con la regla de Sarrus (solo para matrices de 3×3).",
  [{ cmds: ["B=" + mx([[-1, -2, -2], [-1, 3, 1], [2, 5, -1]]), "d=Det(B)"], expect: { d: 28 },
    sol: "Se suman los productos de la diagonal principal y de sus dos paralelas, y se restan los de la diagonal secundaria y sus paralelas: 3 + 10 − 4 + 2 + 5 + 12 = <b>28</b>. Seleccioná <b>d</b> para ver los seis productos." }]);
ejemplo3(3, "Método de Laplace (cofactores)", "Encontrar el determinante de C = [−1 2 4; 0 3 1; −2 1 0] por el método de Laplace o de los cofactores.",
  [{ cmds: ["C=" + mx([[-1, 2, 4], [0, 3, 1], [-2, 1, 0]]), "d=Det(C)"], expect: { d: 21 },
    sol: "Se desarrolla por la fila 2, que tiene un cero: |C| = 0 + 3·(−1)<sup>2+2</sup>·8 + 1·(−1)<sup>2+3</sup>·3 = 24 − 3 = <b>21</b>." }]);
ejemplo3(4, "Propiedades de los determinantes", "Dadas A = [1 1 0; 0 1 2; 0 1 4] y B = [1 3 2; 0 4 1; 3 7 2], calcular Det[B²·(B − A)ᵗ·(∛5·A)⁻¹] aplicando |A·B| = |A|·|B|, |Aᵗ| = |A|, |A⁻¹| = 1/|A| y |λA| = λⁿ|A|.",
  [{ cmds: ["A=" + mx([[1, 1, 0], [0, 1, 2], [0, 1, 4]]), "B=" + mx([[1, 3, 2], [0, 4, 1], [3, 7, 2]]), "dA=Det(A)", "dB=Det(B)", "dBA=Det(B-A)", "r=Det(B^2*(B-A)^T*Inversa(5^(1/3)*A))"], focus: "r",
    expect: { dA: 2, dB: -14, dBA: -24, r: -4704 / 10 },
    sol: "|B²|·|(B − A)ᵗ|·|(∛5·A)⁻¹| = |B|²·|B − A|·1/(5·|A|) = 196·(−24)·1/10 = <b>−4704/10</b> (−470,4).",
    note: "En el apunte aparece |B − A| = −2 en una línea y −24 en el reemplazo. El valor correcto es −24 (con −2 el resultado no daría −4704/10)." }]);
ejemplo3(5, "Triangulación", "Triangular la matriz [2 3 7; 0 0 −3; 1 −2 7] con operaciones elementales de fila y obtener su determinante.",
  [{ cmds: ["A=" + mx([[2, 3, 7], [0, 0, -3], [1, -2, 7]]), "d=Det(A)"], expect: { d: -21 },
    sol: "Intercambiar dos filas cambia el signo; sumar a una fila un múltiplo de otra no cambia el determinante. Se llega a una matriz triangular y |A| = −(2·7·(−3))/(−2)·… = <b>−21</b>. Seleccioná <b>d</b> para ver las operaciones.",
    note: "El apunte multiplica una fila por −2 y lleva la cuenta con |B| = −2|A|, |C| = 2|A|. La app evita ese paso: solo intercambia filas o suma múltiplos, así que el determinante cambia únicamente de signo." }]);
ejemplo3(6, "Matriz inversa por la adjunta", "Encontrar la inversa de B = [−1 −2 −2; −1 3 1; 2 5 −1] por el método de la matriz adjunta: B⁻¹ = Adj(B)/|B|.",
  [{ cmds: ["B=" + mx([[-1, -2, -2], [-1, 3, 1], [2, 5, -1]]), "C=Cofactores(B)", "Adj=Adjunta(B)", "d=Det(B)", "Bi=Adj/d", "chk=B*Bi"], focus: "Bi",
    expect: { C: MM([[-8, 1, -11], [-12, 5, 1], [4, 3, -5]]), Adj: MM([[-8, -12, 4], [1, 5, 3], [-11, 1, -5]]), d: 28, Bi: MM([[-8, -12, 4], [1, 5, 3], [-11, 1, -5]].map((r) => r.map((x) => x / 28))), chk: I3 },
    sol: "La matriz de cofactores es C<sub>B</sub> = [−8 1 −11; −12 5 1; 4 3 −5]. Su transpuesta es la adjunta y se divide por |B| = 28." }]);

/* ---------- Ejercicios para resolver ---------- */
const E1 = [
  ["A", [[5, 1, 8], [15, 3, 6], [10, 4, 2]], 180, "|A| = 180. " + LI],
  ["B", [[4, 96, 85], [0, 1, -7], [0, 0, 6]], 24, "|B| = 24. " + LI + " (Matriz triangular: producto de la diagonal.)"],
  ["C", [[16, 22, 4], [4, -3, 2], [12, 25, 2]], 0, "|C| = 0. " + LD],
  ["E", [[28, 18, 24], [12, 27, 12], [70, 15, 40]], -9360, "|E| = −9360. " + LI],
  ["G", [[28, 33, 8], [12, 17, 4], [40, 54, 13]], 16, "El apunte indica |G| = 19. " + LI,
    "El apunte da |G| = 19, pero con los elementos impresos el determinante es 16 (28·(221 − 216) − 33·(156 − 160) + 8·(648 − 680) = 140 + 132 − 256). Conviene confirmar con la cátedra si hay un elemento mal impreso."],
  ["H", [[5, 1, 2], [15, 3, 6], [25, 5, 10]], 0, "|H| = 0. " + LD + " (Las tres filas son proporcionales.)"],
  ["I", [[1, 2, 3], [4, -2, 3], [2, 5, -1]], 79, "|I| = 79. " + LI],
  ["J", [[2, 0, -4], [3, 2, -3], [-4, -3, 5]], 6, "|J| = 6. " + LI],
  ["K", [[1, 2, -3], [4, -2, 5], [-7, 1, 0]], -45, "|K| = −45. " + LI],
  ["L", [[4, -2, 7], [5, -3, 1], [11, 6, -5]], 405, "|L| = 405. " + LI],
  ["M", [[12, 7, -1], [4, -8, 0], [3, -2, 1]], -140, "|M| = −140. " + LI],
  ["N", [[1, 2], [-1, 3]], 5, "|N| = 5. " + LI],
  ["O", [[6, 4], [3, 2]], 0, "|O| = 0. " + LD],
  ["Q", [[1, -2, 7], [3, 5, 1], [4, 3, 8]], 0, "|Q| = 0. " + LD + " (La fila 3 es la suma de las filas 1 y 2.)"],
  ["R", [[8, 2, -1], [-3, 4, -6], [11, 7, 2]], 345, "|R| = 345. " + LI],
  ["T", [[4, 7, -2], [3, -5, 1], [-8, 6, 9]], -405, "|T| = −405. " + LI],
].map(([name, rows, val, ans, note]) => ({ l: name, cmds: [name + "=" + mx(rows), "d=Det(" + name + ")", "r=Rango(" + name + ")"], focus: "d", expect: { d: val }, ans, note }));
E1.splice(2, 0, ...[
  { l: "D (a=1, b=2, c=4)", cmds: ["a=1", "b=2", "c=4", "D=[1,a,a^2;1,b,b^2;1,c,c^2]", "d=Det(D)", "f=a*(b^2-c^2)+b*(c^2-a^2)+c*(a^2-b^2)"], focus: "d", expect: { d: 6, f: 6 },
    ans: "|D| = a(b² − c²) + b(c² − a²) + c(a² − b²) = (b − a)(c − a)(c − b). Linealmente independientes si a ≠ b ≠ c.", sol: "Es una matriz de Vandermonde. La app la evalúa con a = 1, b = 2, c = 4 (editá los valores en la vista algebraica para probar otros) y compara con la fórmula f." },
]);
E1.push(
  { l: "F (x=2, y=3, z=1, k=5)", cmds: ["x=2", "y=3", "z=1", "k=5", "F=[x,y,z;-x,y,k;-x,-y,z]", "d=Det(F)", "f=4*x*y*z"], focus: "d", expect: { d: 24, f: 24 },
    ans: "|F| = 4xyz. Vectores linealmente independientes para valores de x, y, z distintos de cero.", sol: "El elemento k se cancela: el determinante no depende de k. Probá otros valores de k." },
  { l: "P (k = 2)", cmds: ["k=2", "P=[k-1,2;4,k-3]", "d=Det(P)", "f=k^2-4*k-5"], focus: "d", expect: { d: -9, f: -9 }, ans: "|P| = k² − 4k − 5. Linealmente independientes si k es distinto de 5 y de −1." },
  { l: "P (k = 5)", cmds: ["k=5", "P=[k-1,2;4,k-3]", "d=Det(P)"], focus: "d", expect: { d: 0 }, ans: "Con k = 5 el determinante se anula: filas linealmente dependientes." },
  { l: "P (k = −1)", cmds: ["k=-1", "P=[k-1,2;4,k-3]", "d=Det(P)"], focus: "d", expect: { d: 0 }, ans: "Con k = −1 el determinante se anula: filas linealmente dependientes." },
  { l: "S (k = 0)", cmds: ["k=0", "S=[k,-3,9;2,4,k+1;1,k^2,3]", "d=Det(S)"], focus: "d", expect: { d: -21 }, ans: "El apunte da |S| = k⁴ + k³ − 18k² − 9k + 21; los vectores son linealmente independientes si k no es raíz del polinomio.",
    note: "El polinomio impreso tiene el signo cambiado: el determinante de S es −k⁴ − k³ + 18k² + 9k − 21 (con k = 0 da −21, no +21). Las raíces son las mismas, así que la conclusión sobre independencia no cambia." },
  { l: "S (k = 2)", cmds: ["k=2", "S=[k,-3,9;2,4,k+1;1,k^2,3]", "d=Det(S)"], focus: "d", expect: { d: 45 }, ans: "Con k = 2: |S| = 45 (el polinomio −k⁴ − k³ + 18k² + 9k − 21 da 45)." },
);
ejercicio3(1, "Sarrus y diagonales", "Calcular el determinante de cada matriz con el método de Sarrus (3×3) o de las diagonales (2×2) y decir cómo son los vectores fila o columna. En D, F, P y S hay parámetros: la app usa valores concretos que podés cambiar.", E1);

const E2 = [
  ["A", [[1, 3, 4], [0, 0, 2], [4, 7, 5]], 10],
  ["B", [[1, 1, 3, 4], [2, 0, 0, 2], [3, 0, 0, 2], [4, 4, 7, 5]], 10],
  ["C", [[2, 3, -2, 4], [3, -2, 1, 2], [3, 2, 3, 4], [-2, 4, 0, 5]], -286],
  ["D", [[3, 2, -1, 0], [0, 4, 0, -2], [-1, 3, 8, 4], [3, 5, -1, 0]], 138],
  ["E", [[0, 4, 0, 0, 0], [2, 1, -3, 15, 61], [-1, 4, 5, -20, -2], [-6, -3, 9, 8, -13], [0, 0, 0, -1, 0]], -4760],
  ["F", [[0, 1, 3, 2], [3, 0, 1, -2], [1, -1, 4, 3], [2, 2, -1, 1]], -97],
  ["G", [[1, 2, -1, 2], [3, 0, 1, 5], [1, -2, 0, 3], [-2, -4, 1, 0]], 30],
  ["H", [[2, 5, -3, -2], [-2, -3, 2, -5], [1, 3, -2, 2], [-1, -6, 4, 3]], -4],
  ["I", [[3, -2, -5, 4], [-5, 2, 8, -5], [-2, 4, 7, -3], [2, -3, -5, 8]], -54],
].map(([name, rows, val]) => ({ l: name, cmds: [name + "=" + mx(rows), "d=Det(" + name + ")"], focus: "d", expect: { d: val }, ans: "|" + name + "| = " + String(val).replace("-", "−") + ".",
  note: name === "G" ? "El apunte da |G| = 90, pero con los elementos impresos el determinante es 30. Conviene confirmar con la cátedra si hay un elemento mal impreso." : undefined }));
ejercicio3(2, "Método de Laplace", "Hallar el determinante de cada matriz desarrollando por los elementos de una línea (fila o columna). La app elige la línea con más ceros.", E2);

const E3 = [
  ["A", [[2, 3, 7], [0, 0, -3], [1, -2, 7]], -21],
  ["B", [[2, 1, 1], [4, 2, 3], [1, 3, 0]], -5],
  ["C", [[2, 1, 3, 1], [1, 0, 1, 1], [0, 2, 1, 0], [0, 1, 2, 3]], 6],
  ["D", [[3, 6, 9, 3], [-1, 0, 1, 0], [1, 3, 2, -1], [-1, -2, -2, 1]], -21],
  ["G", [[1, -2, 7], [3, 5, 1], [4, 3, 8]], 0],
  ["H", [[8, 2, -1], [-3, 4, -6], [11, 7, 2]], 345],
].map(([name, rows, val]) => ({ l: name, cmds: [name + "=" + mx(rows), "d=Det(" + name + ")"], focus: "d", expect: { d: val }, ans: "|" + name + "| = " + String(val).replace("-", "−") + "." }));
E3.splice(4, 0,
  { l: "E", cmds: ["E=[1/2,1/2,1,1/2;-1/2,1/2,0,1/2;2/3,1/3,1/3,0;1/3,1,1/3,0]", "d=Det(E)"], focus: "d", expect: { d: 1 / 6 }, ans: "|E| = 1/6." },
  { l: "F (a=1, b=2, c=4)", cmds: ["a=1", "b=2", "c=4", "F=[1,1,1;a,b,c;a^2,b^2,c^2]", "d=Det(F)", "f=a*b*(b-a)+a*c*(a-c)+c*b*(c-b)"], focus: "d", expect: { d: 6, f: 6 }, ans: "|F| = ab(b − a) + ac(a − c) + cb(c − b)." },
);
ejercicio3(3, "Triangulación", "Evaluar el determinante reduciendo cada matriz a la forma escalonada (triangulación). Seleccioná d para ver las operaciones elementales.", E3);

const R4 = [
  ["A", [[16, 22, 4], [4, -3, 2], [12, 25, 2]], 2, "Rango 2. Vectores linealmente dependientes."],
  ["B", [[2, 1, 3, 1], [1, 0, 1, 1], [0, 2, 1, 0], [0, 1, 2, 3]], 4, "Rango 4. Vectores linealmente independientes."],
  ["C", [[3, 2, 2, 1], [6, 5, 4, -2], [9, -3, 6, -5], [12, 2, 8, 7]], 3, "Rango 3. Vectores linealmente dependientes."],
  ["D", [[2, 5, -3, 2], [-3, -3, 2, -5], [1, 3, -2, 2], [-1, -6, 4, 3]], 4, "Rango 4. Vectores linealmente independientes."],
  ["E", [[1, 2, 3], [2, 3, 4], [3, 5, 7]], 2, "Rango 2. Vectores linealmente dependientes."],
  ["F", [[1, 2, 0, -1], [2, 6, -3, -3], [3, 10, -6, -5]], 2, "Rango 2. Vectores linealmente dependientes."],
  ["G", [[1, 2, -2, 3], [2, 5, -4, 6], [-1, -3, 2, -2], [2, 4, -1, 6]], 4, "Rango 4. Vectores linealmente independientes."],
  ["I", [[1, 7, -1], [3, 0, 4]], 2, "Rango 2. Vectores fila linealmente independientes y vectores columna linealmente dependientes (hay 3 columnas en ℝ²)."],
  ["J", [[2, 0, 1], [3, 2, -3], [-1, -3, 5]], 3, "Rango 3. Vectores linealmente independientes."],
].map(([name, rows, r, ans]) => {
  const square = rows.length === rows[0].length;
  return { l: name, cmds: [name + "=" + mx(rows), "r=Rango(" + name + ")", "R=Rref(" + name + ")"].concat(square ? ["d=Det(" + name + ")"] : []), focus: "r", expect: { r }, ans,
    note: name === "I" ? "En el apunte, las respuestas de H e I están corridas: el enunciado no trae ninguna matriz H (pasa de G a I), y la respuesta de «H» (rango 2, filas LD y columnas LI) no corresponde a ninguna matriz impresa." : undefined };
});
ejercicio3(4, "Rango", "Calcular el rango de cada matriz, con determinantes cuando sea posible (matrices cuadradas), y decir cómo son sus vectores fila o columna.", R4);

ejercicio3(5, "Valor de k para rango 3", "Encontrar el valor de k para que el rango de M = [1 1 0 1; 3 2 −1 3; k 3 −2 0; −1 0 −4 3] sea 3.",
  [{ l: "k = −20", cmds: ["k=-20", "M=[1,1,0,1;3,2,-1,3;k,3,-2,0;-1,0,-4,3]", "r=Rango(M)", "d=Det(M)"], focus: "d", expect: { r: 3, d: 0 }, ans: "k = −20.", sol: "El rango es 3 solo si |M| = 0 (y queda al menos un menor de 3×3 no nulo). |M| es una función lineal de k que se anula en k = −20." },
   { l: "k = 1", cmds: ["k=1", "M=[1,1,0,1;3,2,-1,3;k,3,-2,0;-1,0,-4,3]", "r=Rango(M)", "d=Det(M)"], focus: "d", expect: { r: 4, d: 21 }, ans: "Para cualquier otro k el determinante no es nulo y el rango es 4." }]);

ejercicio3(6, "Determinante sin calcular", "Sin realizar ninguna operación de cálculo, encontrar el valor del determinante de A y de B (una sola entrada no nula por fila y por columna).",
  [{ l: "A", cmds: ["A=" + mx([[0, 0, 0, 0, 1], [0, 0, 0, 2, 0], [0, 0, 3, 0, 0], [0, 4, 0, 0, 0], [5, 0, 0, 0, 0]]), "d=Det(A)"], focus: "d", expect: { d: 120 }, ans: "|A| = 120.", sol: "Con una sola permutación posible (5, 4, 3, 2, 1) el determinante es ± el producto 1·2·3·4·5. La permutación tiene 10 inversiones (par): signo +." },
   { l: "B", cmds: ["B=" + mx([[0, 4, 0, 0, 0], [0, 0, 0, 2, 0], [0, 0, 3, 0, 0], [0, 0, 0, 0, 1], [5, 0, 0, 0, 0]]), "d=Det(B)"], focus: "d", expect: { d: -120 }, ans: "|B| = −120.", sol: "La permutación (2, 4, 3, 5, 1) tiene 5 inversiones (impar): signo −. Producto 4·2·3·1·5 = 120." }]);

const M0 = [[2, 1, 0], [0, 1, 3], [1, 0, 1]]; // a b c / d e f / g h i con |M| = 5
const [r1, r2, r3] = M0;
const ex7 = (l, rows, val, ans, sol) => ({ l, cmds: ["M=" + mx(M0), "dM=Det(M)", "X=" + mx(rows), "d=Det(X)"], focus: "d", expect: { dM: 5, d: val }, ans, sol });
ejercicio3(7, "Propiedades con un determinante dado", "Suponiendo que |a b c; d e f; g h i| = 5, encontrar el valor de cada determinante. La app usa una matriz concreta M con |M| = 5 (a, b, c = 2, 1, 0; d, e, f = 0, 1, 3; g, h, i = 1, 0, 1).",
  [ex7("|A|", [r2, r3, r1], 5, "|A| = 5.", "Las filas se permutaron de forma cíclica: dos intercambios, el signo no cambia."),
   ex7("|B|", [r1.map((x) => -x), r2.map((x) => 2 * x), r3.map((x) => -x)], 10, "|B| = 10.", "Se multiplicaron las filas por −1, 2 y −1: el determinante queda multiplicado por (−1)·2·(−1) = 2."),
   ex7("|C|", [r1.map((x, j) => x + r2[j]), r2, r3], 5, "|C| = 5.", "A la fila 1 se le sumó la fila 2: el determinante no varía."),
   ex7("|D|", [r1, r2.map((x, j) => x - 3 * r1[j]), r3.map((x) => 2 * x)], 10, "|D| = 10.", "A la fila 2 se le restó 3 veces la fila 1 (no varía) y la fila 3 se multiplicó por 2.")]);

const A8 = "A=" + mx(M0);
ejercicio3(8, "Determinante de múltiplos e inversas", "Sea A de 3×3 con det(A) = 5. Hallar a) det(3A), b) det(2A⁻¹), c) det[(2A)⁻¹], d) det(A⁻¹). La app usa una matriz A concreta con |A| = 5.",
  [{ l: "a)", cmds: [A8, "d=Det(A)", "r=Det(3*A)"], focus: "r", expect: { d: 5, r: 135 }, ans: "det(3A) = 135.", sol: "|λA| = λⁿ|A| con n = 3: 27·5 = 135." },
   { l: "b)", cmds: [A8, "d=Det(A)", "r=Det(2*Inversa(A))"], focus: "r", expect: { d: 5, r: 8 / 5 }, ans: "det(2A⁻¹) = 8/5.", sol: "2³·|A⁻¹| = 8·(1/5) = 8/5." },
   { l: "c)", cmds: [A8, "d=Det(A)", "r=Det(Inversa(2*A))"], focus: "r", expect: { d: 5, r: 1 / 40 }, ans: "det[(2A)⁻¹] = 1/40.", sol: "1/|2A| = 1/(8·5) = 1/40." },
   { l: "d)", cmds: [A8, "d=Det(A)", "r=Det(Inversa(A))"], focus: "r", expect: { d: 5, r: 1 / 5 }, ans: "det(A⁻¹) = 1/5.", sol: "|A⁻¹| = 1/|A|." }]);

ejercicio3(9, "Raíces de un determinante", "Sin evaluar directamente, demostrar que si x = 0 o x = 2 se satisface |x² x 2; 2 1 1; 0 0 −5| = 0.",
  [{ l: "x = 0", cmds: ["x=0", "A=[x^2,x,2;2,1,1;0,0,-5]", "d=Det(A)"], focus: "d", expect: { d: 0 }, ans: "Con x = 0 las dos primeras columnas quedan [0, 2, 0] y [0, 1, 0]: proporcionales, determinante nulo.", sol: "Desarrollando por la fila 3: |A| = −5·(x² − 2x) = −5x(x − 2)." },
   { l: "x = 2", cmds: ["x=2", "A=[x^2,x,2;2,1,1;0,0,-5]", "d=Det(A)"], focus: "d", expect: { d: 0 }, ans: "Con x = 2 las dos primeras columnas quedan [4, 2, 0] y [2, 1, 0]: proporcionales, determinante nulo." },
   { l: "x = 3 (contraste)", cmds: ["x=3", "A=[x^2,x,2;2,1,1;0,0,-5]", "d=Det(A)"], focus: "d", expect: { d: -15 }, ans: "Con cualquier otro x el determinante no es nulo (x = 3 da −15)." }]);

ejercicio3(10, "Determinante de un producto", "Dadas A = [2 1 0; 3 4 0; 0 0 2] y B = [1 −1 3; 7 1 2; 5 0 1], comprobar si det(A·B) = det(A)·det(B).",
  [{ cmds: ["A=" + mx([[2, 1, 0], [3, 4, 0], [0, 0, 2]]), "B=" + mx([[1, -1, 3], [7, 1, 2], [5, 0, 1]]), "dAB=Det(A*B)", "dAdB=Det(A)*Det(B)", "ok=Igual(dAB,dAdB)"], focus: "ok", expect: { dAB: -170, dAdB: -170, ok: "Son iguales" },
    ans: "Se verifica: det(A·B) = 10·(−17) = −170 = det(A)·det(B).", sol: "Octava propiedad: el determinante de un producto es el producto de los determinantes." }]);

ejercicio3(11, "Valores de λ para determinante nulo", "Encontrar todos los valores de λ para los cuales el determinante de cada matriz es igual a cero. La app comprueba cada raíz real; los pares complejos se razonan con el polinomio característico.",
  [{ l: "A, λ = 3", cmds: ["λ=3", "A=[λ-1,-2;1,λ-4]", "d=Det(A)"], focus: "d", expect: { d: 0 }, ans: "Para A: λ₁ = 3 y λ₂ = 2.", sol: "|A| = (λ − 1)(λ − 4) + 2 = λ² − 5λ + 6 = (λ − 2)(λ − 3)." },
   { l: "A, λ = 2", cmds: ["λ=2", "A=[λ-1,-2;1,λ-4]", "d=Det(A)"], focus: "d", expect: { d: 0 }, ans: "Para A: λ₁ = 3 y λ₂ = 2." },
   { l: "B, λ = 6", cmds: ["λ=6", "B=[λ-6,0,0;0,λ,-1;0,4,λ-1]", "d=Det(B)"], focus: "d", expect: { d: 0 }, ans: "Para B: λ₁ = 6; λ₂ = ½ + (½)√15·i; λ₃ = ½ − (½)√15·i.",
    sol: "|B| = (λ − 6)(λ² − λ + 4). El segundo factor tiene discriminante 1 − 16 = −15 < 0: sus raíces son complejas, λ = (1 ± √15·i)/2." }]);

ejercicio3(12, "Valores de k para matrices no invertibles", "Determinar el o los valores de k para que las matrices sean no invertibles (determinante nulo).",
  [{ l: "A, k = −1", cmds: ["k=-1", "A=[1,2,4;3,1,6;k,3,2]", "d=Det(A)", "Ai=Inversa(A)"], focus: "d", expect: { d: 0, Ai: "ERR" }, ans: "Para A: k = −1.", sol: "|A| = 8k + 8." },
   { l: "B, k = 2", cmds: ["k=2", "B=[k,-2;-2,k]", "d=Det(B)", "Bi=Inversa(B)"], focus: "d", expect: { d: 0, Bi: "ERR" }, ans: "Para B: k₁ = 2 y k₂ = −2.", sol: "|B| = k² − 4." },
   { l: "B, k = −2", cmds: ["k=-2", "B=[k,-2;-2,k]", "d=Det(B)", "Bi=Inversa(B)"], focus: "d", expect: { d: 0, Bi: "ERR" }, ans: "Para B: k₁ = 2 y k₂ = −2." },
   { l: "C, k = 6", cmds: ["k=6", "C=[2,0,-1;k,1,0;0,1,3]", "d=Det(C)", "Ci=Inversa(C)"], focus: "d", expect: { d: 0, Ci: "ERR" }, ans: "Para C: k = 6.", sol: "|C| = 6 − k." }]);

ejercicio3(13, "¿Es invertible?", "Comprobar con determinantes si P, Q, R y S son o no invertibles.",
  [{ l: "P", cmds: ["P=" + mx([[1, 0, 0], [3, 6, 7], [0, 8, -1]]), "d=Det(P)", "Pi=Inversa(P)"], focus: "d", expect: { d: -62 }, ans: "P es invertible (|P| = −62 ≠ 0)." },
   { l: "Q", cmds: ["Q=" + mx([[-2, 1, -4], [1, 1, 2], [3, 1, 6]]), "d=Det(Q)", "Qi=Inversa(Q)"], focus: "d", expect: { d: 0, Qi: "ERR" }, ans: "Q no es invertible (|Q| = 0)." },
   { l: "R", cmds: ["R=" + mx([[7, 2, 1], [7, 2, 1], [3, 6, 6]]), "d=Det(R)", "Ri=Inversa(R)"], focus: "d", expect: { d: 0, Ri: "ERR" }, ans: "R no es invertible: dos filas iguales." },
   { l: "S", cmds: ["S=" + mx([[0, 7, 5], [0, 1, -1], [0, 3, 2]]), "d=Det(S)", "Si=Inversa(S)"], focus: "d", expect: { d: 0, Si: "ERR" }, ans: "S no es invertible: una columna nula." }]);

ejercicio3(14, "Adjunta por cofactores", "Dada A = [1 2 −2; −1 3 0; 0 −2 1], calcular su adjunta con el método de los complementarios o cofactores.",
  [{ cmds: ["A=" + mx([[1, 2, -2], [-1, 3, 0], [0, -2, 1]]), "C=Cofactores(A)", "Adj=Adjunta(A)"], focus: "Adj", expect: { C: MM([[3, 1, 2], [2, 1, 2], [6, 2, 5]]), Adj: MM([[3, 2, 6], [1, 1, 2], [2, 2, 5]]) },
    ans: "A<sub>ADJ</sub> = [3 2 6; 1 1 2; 2 2 5].", sol: "La adjunta es la transpuesta de la matriz de cofactores." }]);

ejercicio3(15, "A² + Adj(A)", "Dada A = [1 1 −1; 1 4 −2; 2 1 3], calcular A² + A<sub>ADJ</sub>.",
  [{ cmds: ["A=" + mx([[1, 1, -1], [1, 4, -2], [2, 1, 3]]), "A2=A^2", "Adj=Adjunta(A)", "r=A2+Adj"], focus: "r", expect: { r: MM([[14, 0, -4], [-6, 20, -14], [2, 10, 8]]) }, ans: "A² + A<sub>ADJ</sub> = [14 0 −4; −6 20 −14; 2 10 8]." }]);

const e16 = (name, rows, inv, ans, note) => ({ l: name, cmds: [name + "=" + mx(rows), "d=Det(" + name + ")", name + "i=Inversa(" + name + ")", "chk=" + name + "*" + name + "i"], focus: name + "i",
  expect: inv ? { [name + "i"]: MM(inv), chk: { m: rows.map((r, i) => r.map((_, j) => (i === j ? 1 : 0))) } } : { [name + "i"]: "ERR" }, ans, note });
const e16s = (name, rows, ans) => ({ l: name, cmds: [name + "=" + mx(rows), "d=Det(" + name + ")", name + "i=Inversa(" + name + ")"], focus: "d", expect: { d: 0, [name + "i"]: "ERR" }, ans });
ejercicio3(16, "Inversa por cofactores", "Calcular la inversa de cada matriz con el método de los menores complementarios, adjuntos o cofactores: A⁻¹ = (1/|A|)·(A<sub>COF</sub>)ᵗ. Seleccioná la inversa para ver la matriz de cofactores, la adjunta y la división por el determinante.",
  [e16("A", [[2, 5], [0, 1]], [[1 / 2, -5 / 2], [0, 1]], "A⁻¹ = [1/2 −5/2; 0 1]."),
   e16("B", [[-1, -2, -2], [-1, 3, 1], [2, 5, -1]], [[-8 / 28, -12 / 28, 4 / 28], [1 / 28, 5 / 28, 3 / 28], [-11 / 28, 1 / 28, -5 / 28]], "B⁻¹ = (1/28)·[−8 −12 4; 1 5 3; −11 1 −5]."),
   e16("C", [[1, 3, 1], [0, 2, 4], [0, 0, 3]], [[1, -3 / 2, 5 / 3], [0, 1 / 2, -2 / 3], [0, 0, 1 / 3]], "C⁻¹ = [1 −3/2 5/3; 0 1/2 −2/3; 0 0 1/3].", "El apunte no trae la respuesta de C: el resultado es el calculado por la app (C es triangular, |C| = 6)."),
   e16("D", [[1, 3, 3], [1, 4, 3], [1, 3, 4]], [[7, -3, -3], [-1, 1, 0], [-1, 0, 1]], "D⁻¹ = [7 −3 −3; −1 1 0; −1 0 1]."),
   e16("E", [[3, -2, 0, -1], [0, 2, 2, 1], [1, -2, -3, -2], [0, 1, 2, 1]], [[1, 1, -2, -4], [0, 1, 0, -1], [-1, -1, 3, 6], [2, 1, -6, -10]], "E⁻¹ = [1 1 −2 −4; 0 1 0 −1; −1 −1 3 6; 2 1 −6 −10].",
     "El apunte imprime el último elemento de la fila 4 como 10; el correcto es −10 (con 10, E·E⁻¹ no da la identidad)."),
   e16("F", [[2, -4, 5], [3, -1, 2], [4, 1, 6]], [[-8 / 59, 29 / 59, -3 / 59], [-10 / 59, -8 / 59, 11 / 59], [7 / 59, -18 / 59, 10 / 59]], "F⁻¹ = (1/59)·[−8 29 −3; −10 −8 11; 7 −18 10]."),
   e16("G", [[2, -1, 0], [0, -2, 1], [1, 0, 1]], [[2 / 5, -1 / 5, 1 / 5], [-1 / 5, -2 / 5, 2 / 5], [-2 / 5, 1 / 5, 4 / 5]], "G⁻¹ = (1/5)·[2 −1 1; −1 −2 2; −2 1 4]."),
   e16("H", [[1, 1, -1], [1, 4, -2], [2, 1, 3]], [[1, -2 / 7, 1 / 7], [-1 / 2, 5 / 14, 1 / 14], [-1 / 2, 1 / 14, 3 / 14]], "H⁻¹ = [1 −2/7 1/7; −1/2 5/14 1/14; −1/2 1/14 3/14].",
     "El apunte imprime el elemento (2,2) como 3/14; el correcto es 5/14 (|H| = 14, cofactor 5)."),
   e16("J", [[-2, -3, -2], [1, 3, -2], [-1, -6, 4]], [[0, 2, 1], [-1 / 6, -5 / 6, -1 / 2], [-1 / 4, -3 / 4, -1 / 4]], "J⁻¹ = [0 2 1; −1/6 −5/6 −3/6; −1/4 −3/4 −1/4]."),
   e16("K", [[1, 0, 2], [2, -1, 3], [4, 1, 8]], [[-11, 2, 2], [-4, 0, 1], [6, -1, -1]], "K⁻¹ = [−11 2 2; −4 0 1; 6 −1 −1]."),
   e16s("L", [[0, 1, 3], [2, 1, -4], [2, 3, 2]], "L no tiene inversa (|L| = 0)."),
   e16s("M", [[1, 2], [3, 6]], "M no tiene inversa (|M| = 0)."),
   e16("N", [[3, 0, 1], [0, 5, 0], [-1, 1, -1]], [[1 / 2, -1 / 10, 1 / 2], [0, 1 / 5, 0], [-1 / 2, 3 / 10, -3 / 2]], "N⁻¹ = [1/2 −1/10 1/2; 0 1/5 0; −1/2 3/10 −3/2].",
     "El apunte dice que N no tiene inversa y da como O⁻¹ una matriz de 3×3. Con los elementos impresos |N| = −10 ≠ 0 y la matriz que el apunte rotula O⁻¹ es exactamente N⁻¹: las respuestas de N y O están intercambiadas."),
   e16s("O", [[1, 0, 2, 1], [1, 1, 1, 1], [2, 1, 3, 0], [3, 2, 4, 2]], "Con los elementos impresos O (4×4) tiene |O| = 0: no tiene inversa. La respuesta del apunte rotulada O⁻¹ es de 3×3 y corresponde a N.")]);

ejercicio3(17, "det(A⁻¹·A³·Aᵗ)", "Dada A (4×4), calcular det(A⁻¹·A³·Aᵗ) = |A|⁻¹·|A|³·|A| = |A|³.",
  [{ cmds: ["A=" + mx([[1, 3, 0, 1], [-1, 2, 0, 1], [0, 2, 1, 2], [0, 3, -3, 4]]), "d=Det(A)", "r=Det(Inversa(A)*A^3*A^T)"], focus: "r", expect: { d: 32, r: 32768 }, ans: "det(A⁻¹·A³·Aᵗ) = 32.768 (= 32³).",
    note: "El apunte imprime «32.76»: el valor es 32.768 = 32768 (con punto de miles), porque |A| = 32." }]);

ejercicio3(18, "Hallar A conociendo A⁻¹", "Sea A inversible con A⁻¹ = [3 4; 5 6]. Hallar A.",
  [{ cmds: ["Ai=" + mx([[3, 4], [5, 6]]), "A=Inversa(Ai)"], focus: "A", expect: { A: MM([[-3, 2], [5 / 2, -3 / 2]]) }, ans: "A = [−3 2; 5/2 −3/2].", sol: "A = (A⁻¹)⁻¹." }]);

ejercicio3(19, "Potencias de A", "Dada A = [1 0; 2 3], calcular A³, A⁻³ y A² − 2A + I.",
  [{ cmds: ["A=" + mx([[1, 0], [2, 3]]), "A3=A^3", "Am3=A^-3", "r=A^2-2*A+Identidad(2)"], focus: "A3", expect: { A3: MM([[1, 0], [26, 27]]), Am3: MM([[1, 0], [-26 / 27, 1 / 27]]), r: MM([[0, 0], [4, 4]]) },
    ans: "A³ = [1 0; 26 27] · A⁻³ = [1 0; −26/27 1/27] · A² − 2A + I = [0 0; 4 4]." }]);

ejercicio3(20, "(A·B·C)⁻¹", "Dadas A = [1 2; 1 3], B⁻¹ = [5 2; 9 4] y C = [2 3; 3 5], calcular (A·B·C)⁻¹ = C⁻¹·B⁻¹·A⁻¹.",
  [{ cmds: ["A=" + mx([[1, 2], [1, 3]]), "Bi=" + mx([[5, 2], [9, 4]]), "C=" + mx([[2, 3], [3, 5]]), "r=Inversa(C)*Bi*Inversa(A)"], focus: "r", expect: { r: MM([[-4, 2], [7, -4]]) }, ans: "(A·B·C)⁻¹ = [−4 2; 7 −4].", sol: "La inversa de un producto es el producto de las inversas en orden inverso." }]);

ejercicio3(21, "A y B a partir de A + B y A − B", "Dadas (A + B)⁻¹ = [2 1; 5 3] y A − B = [3 1; −1 0], hallar a) A + B, b) A, c) B.",
  [{ cmds: ["Si=" + mx([[2, 1], [5, 3]]), "D=" + mx([[3, 1], [-1, 0]]), "S=Inversa(Si)", "A=(S+D)/2", "B=(S-D)/2"], focus: "S", expect: { S: MM([[3, -1], [-5, 2]]), A: MM([[3, 0], [-3, 1]]), B: MM([[0, -1], [-2, 1]]) },
    ans: "a) A + B = [3 −1; −5 2] · b) A = [3 0; −3 1] · c) B = [0 −1; −2 1].", sol: "A = ½[(A + B) + (A − B)] y B = ½[(A + B) − (A − B)]." }]);

ejercicio3(22, "A + Aᵗ y B + Bᵗ", "Dadas (A + B)⁻¹ = [1 3; 2 1] y A − B = [3 −1; 0 2], hallar a) A + Aᵗ y b) B + Bᵗ.",
  [{ l: "a)", cmds: ["Si=" + mx([[1, 3], [2, 1]]), "D=" + mx([[3, -1], [0, 2]]), "S=Inversa(Si)", "A=(S+D)/2", "B=(S-D)/2", "r=A+A^T"], focus: "r", expect: { r: MM([[14 / 5, 0], [0, 9 / 5]]) }, ans: "A + Aᵗ = [14/5 0; 0 9/5]. La matriz resultante es simétrica." },
   { l: "b)", cmds: ["Si=" + mx([[1, 3], [2, 1]]), "D=" + mx([[3, -1], [0, 2]]), "S=Inversa(Si)", "A=(S+D)/2", "B=(S-D)/2", "r=B+B^T"], focus: "r", expect: { r: MM([[-16 / 5, 1], [1, -11 / 5]]) }, ans: "B + Bᵗ = [−16/5 1; 1 −11/5]. La matriz resultante es simétrica." }]);

ejercicio3(23, "Ecuación matricial (A + B)C = B(A + C)", "Dadas A = [2 1; 1 1] y C = [3 1; −1 0], encontrar B tal que (A + B)C = B(A + C).",
  [{ cmds: ["A=" + mx([[2, 1], [1, 1]]), "C=" + mx([[3, 1], [-1, 0]]), "B=A*C*Inversa(A)", "izq=(A+B)*C", "der=B*(A+C)", "ok=Igual(izq,der)"], focus: "B", expect: { B: MM([[3, -1], [1, 0]]), ok: "Son iguales" },
    ans: "B = [3 −1; 1 0].", sol: "Distribuyendo: AC + BC = BA + BC, entonces AC = BA y B = A·C·A⁻¹." }]);

ejercicio3(24, "Ecuación matricial A·K·B = C", "Dadas A (3×2), B (2×3) y C (3×3), encontrar K tal que A·K·B = C. Como A y B no son cuadradas, se usan inversas laterales: K = (AᵗA)⁻¹·Aᵗ·C·Bᵗ·(B·Bᵗ)⁻¹.",
  [{ cmds: ["A=" + mx([[1, 4], [-2, 3], [1, -2]]), "B=" + mx([[2, 0, 0], [0, 1, -1]]), "C=" + mx([[8, 6, -6], [6, -1, 1], [-4, 0, 0]]), "K=Inversa(A^T*A)*A^T*C*B^T*Inversa(B*B^T)", "chk=A*K*B"], focus: "K", expect: { K: MM([[0, 2], [1, 1]]), chk: MM([[8, 6, -6], [6, -1, 1], [-4, 0, 0]]) },
    ans: "K = [0 2; 1 1].", sol: "AᵗA y B·Bᵗ son cuadradas e inversibles, y (AᵗA)⁻¹Aᵗ·A = I, B·Bᵗ(B·Bᵗ)⁻¹ = I. Se comprueba con chk = A·K·B = C." }]);

ejercicio3(25, "Ecuación matricial A·B = C", "Dadas A = [2 3 −1; 0 3 0; 0 3 −1] y C = [11 1; 2 0; 1 2], encontrar B tal que A·B = C: B = A⁻¹·C.",
  [{ cmds: ["A=" + mx([[2, 3, -1], [0, 3, 0], [0, 3, -1]]), "C=" + mx([[11, 1], [2, 0], [1, 2]]), "B=Inversa(A)*C", "chk=A*B"], focus: "B", expect: { B: MM([[5, -1 / 2], [2 / 3, 0], [1, -2]]), chk: MM([[11, 1], [2, 0], [1, 2]]) }, ans: "B = [5 −1/2; 2/3 0; 1 −2]." }]);

ejercicio3(26, "A² conociendo (7A)⁻¹", "Sea A inversible y (7A)⁻¹ = [−1 2; 4 −7]. Hallar A². Como (7A)⁻¹ = (1/7)·A⁻¹, resulta A⁻¹ = 7·(7A)⁻¹.",
  [{ cmds: ["Mi=" + mx([[-1, 2], [4, -7]]), "Ai=7*Mi", "A=Inversa(Ai)", "A2=A^2"], focus: "A2", expect: { A2: MM([[57 / 49, 16 / 49], [32 / 49, 9 / 49]]) }, ans: "A² = [57/49 16/49; 32/49 9/49]." }]);

ejercicio3(27, "Matrices elementales", "Dada A = [1 0; 3 4]: a) hallar E₁ y E₂ tales que E₂·E₁·A = I, b) escribir A⁻¹ como producto de matrices elementales, c) escribir A como producto de matrices elementales.",
  [{ l: "a)", cmds: ["A=" + mx([[1, 0], [3, 4]]), "E1=" + mx([[1, 0], [-3, 1]]), "E2=[1,0;0,1/4]", "r=E2*E1*A"], focus: "r", expect: { r: I2 }, ans: "E₁ = [1 0; −3 1] (e₂₁(−3)) y E₂ = [1 0; 0 1/4] (e₂(1/4)).", sol: "E₁ anula el 3 sumando a la fila 2 la fila 1 por −3; E₂ lleva el 4 a 1 multiplicando la fila 2 por 1/4." },
   { l: "b)", cmds: ["A=" + mx([[1, 0], [3, 4]]), "E1=" + mx([[1, 0], [-3, 1]]), "E2=[1,0;0,1/4]", "Ai=E2*E1", "chk=Inversa(A)"], focus: "Ai", expect: { Ai: MM([[1, 0], [-3 / 4, 1 / 4]]), chk: MM([[1, 0], [-3 / 4, 1 / 4]]) }, ans: "A⁻¹ = E₂·E₁." },
   { l: "c)", cmds: ["A=" + mx([[1, 0], [3, 4]]), "F2=" + mx([[1, 0], [0, 4]]), "F1=[1,0;3/4,1]", "r=F2*F1", "ok=Igual(r,A)"], focus: "r", expect: { r: MM([[1, 0], [3, 4]]), ok: "Son iguales" }, ans: "E₂ = [1 0; 0 4] y E₁ = [1 0; 3/4 1]: E₂·E₁ = A.", sol: "Las inversas de las matrices elementales son elementales. También A = E₁⁻¹·E₂⁻¹ con E₁⁻¹ = [1 0; 3 1] y E₂⁻¹ = [1 0; 0 4]." }]);

const A28 = "A=" + mx([[1, 3], [-1, 0], [2, -2]]);
ejercicio3(28, "Matriz elemental E tal que E·A = B", "Para A (3×2), dar en cada caso la matriz elemental E (3×3) tal que E·A = B.",
  [{ l: "a)", cmds: [A28, "E=" + mx([[0, 1, 0], [1, 0, 0], [0, 0, 1]]), "r=E*A"], focus: "r", expect: { r: MM([[-1, 0], [1, 3], [2, -2]]) }, ans: "E = [0 1 0; 1 0 0; 0 0 1] (e₁₂: intercambia las filas 1 y 2)." },
   { l: "b)", cmds: [A28, "E=" + mx([[1, 0, 0], [0, 4, 0], [0, 0, 1]]), "r=E*A"], focus: "r", expect: { r: MM([[1, 3], [-4, 0], [2, -2]]) }, ans: "E = [1 0 0; 0 4 0; 0 0 1] (e₂(4): multiplica la fila 2 por 4)." },
   { l: "c)", cmds: [A28, "E=" + mx([[1, 0, 0], [0, 1, 0], [0, 2, 1]]), "r=E*A"], focus: "r", expect: { r: MM([[1, 3], [-1, 0], [0, -2]]) }, ans: "E = [1 0 0; 0 1 0; 0 2 1] (e₃₂(2): a la fila 3 sumarle la fila 2 por 2)." }]);

ejercicio3(29, "Ecuaciones con determinantes", "Resolver las ecuaciones determinando los valores de x. La app comprueba cada raíz en ambos miembros.",
  [{ l: "a) x = 1", cmds: ["x=1", "izq=Det([x+1,-1;2,-x])", "der=(x-1)^2/2", "ok=Igual(izq,der)"], focus: "ok", expect: { izq: 0, der: 0, ok: "Son iguales" }, ans: "x₁ = 1 ; x₂ = −1.", sol: "−x(x + 1) + 2 = ½(x − 1)² ⇒ 3x² = 3 ⇒ x = ±1." },
   { l: "a) x = −1", cmds: ["x=-1", "izq=Det([x+1,-1;2,-x])", "der=(x-1)^2/2", "ok=Igual(izq,der)"], focus: "ok", expect: { izq: 2, der: 2, ok: "Son iguales" }, ans: "x₁ = 1 ; x₂ = −1." },
   { l: "b) x = 0", cmds: ["x=0", "izq=Det([x-1,-3;1,x+2])", "der=Det([1,-2,3;1,x,0;-x,1,-1])", "ok=Igual(izq,der)"], focus: "ok", expect: { izq: 1, der: 1, ok: "Son iguales" }, ans: "x₁ = 0 ; x₂ = 1.", sol: "x² + x + 1 = 3x² − x + 1 ⇒ 2x(x − 1) = 0." },
   { l: "b) x = 1", cmds: ["x=1", "izq=Det([x-1,-3;1,x+2])", "der=Det([1,-2,3;1,x,0;-x,1,-1])", "ok=Igual(izq,der)"], focus: "ok", expect: { izq: 3, der: 3, ok: "Son iguales" }, ans: "x₁ = 0 ; x₂ = 1." }]);

ejercicio3(30, "Determinante por observación", "Por observación y aplicando propiedades, encontrar el determinante de A = [1 −2 7; −4 8 5; 2 −4 3].",
  [{ cmds: ["A=" + mx([[1, -2, 7], [-4, 8, 5], [2, -4, 3]]), "d=Det(A)"], focus: "d", expect: { d: 0 }, ans: "|A| = 0. La primera y la segunda columna son proporcionales.", sol: "Columna 2 = −2·columna 1: dos líneas paralelas proporcionales (tercera propiedad)." }]);

ejercicio3(31, "Inversibilidad por observación", "Por observación y aplicando propiedades, decir si A = [1 2 3; 1 0 1; 2 4 6] es inversible.",
  [{ cmds: ["A=" + mx([[1, 2, 3], [1, 0, 1], [2, 4, 6]]), "d=Det(A)", "Ai=Inversa(A)"], focus: "d", expect: { d: 0, Ai: "ERR" }, ans: "No es inversible porque |A| = 0. El primer y el tercer renglón son proporcionales.", sol: "La fila 3 es el doble de la fila 1." }]);

ejercicio3(32, "Determinantes con propiedades", "Aplicando alguna propiedad de los determinantes, encontrar el determinante de A (triangular), B y C (permutaciones de filas de una triangular).",
  [{ l: "a) A", cmds: ["A=" + mx([[2, 0, 2], [0, 3, 0], [0, 0, 1]]), "d=Det(A)"], focus: "d", expect: { d: 6 }, ans: "|A| = 6.", sol: "Matriz triangular: producto de la diagonal, 2·3·1 = 6." },
   { l: "b) B", cmds: ["B=" + mx([[0, 3, 0], [2, 0, 2], [0, 0, 1]]), "d=Det(B)"], focus: "d", expect: { d: -6 }, ans: "|B| = −6.", sol: "B se obtiene de A intercambiando las filas 1 y 2: el signo cambia." },
   { l: "c) C", cmds: ["C=" + mx([[0, 0, 1], [2, 0, 2], [0, 3, 0]]), "d=Det(C)"], focus: "d", expect: { d: 6 }, ans: "|C| = 6.", sol: "C se obtiene de B intercambiando las filas 2 y 3: el signo vuelve a cambiar." }]);

ejercicio3(33, "Propiedades con |A| = 5 y |B| = 10", "Sean A y B de 3×3 con |A| = 5 y |B| = 10. Calcular cada expresión. La app usa A con |A| = 5 y B con |B| = 10 concretas.",
  [{ cmds: ["A=" + mx(M0), "B=" + mx([[1, 2, 0], [0, 5, 1], [0, 0, 2]]), "dA=Det(A)", "dB=Det(B)", "r1=Det(A*B)", "r2=Det(2*A)", "r3=Det(A^T*B^2)", "r4=Det((2*A)^T*3*B)", "r5=Det(Inversa(A))*Det(A^T)", "r6=Det(A*A^T)+Det(B*B^T)", "r7=Det(A*B^T)"], focus: "r1",
    expect: { dA: 5, dB: 10, r1: 50, r2: 40, r3: 500, r4: 10800, r5: 1, r6: 125, r7: 50 },
    ans: "|A·B| = 50 · |2A| = 40 · |AᵗB²| = 500 · |(2A)ᵗ·3B| = 10800 · |A⁻¹|·|Aᵗ| = 1 · |A·Bᵗ| = 50 · |A·Aᵗ| + |B·Bᵗ| = 125.",
    note: "En el apunte, la respuesta de |A⁻¹|·|Aᵗ| quedó en blanco; vale (1/5)·5 = 1." }]);

const e34 = (l, a, b, c, d) => ({ l, cmds: [`a=${a}`, `b=${b}`, `c=${c}`, `d=${d}`, "A=[1,2,3,4;0,2,0,2;1,2,1,2;a,b,c,d]", "B=[1,2,3,8;a,b,c,2*d;0,1,0,2;1,2,1,4]", "dA=Det(A)", "dB=Det(B)", "ok=Igual(dA,dB)"], focus: "ok", expect: { ok: "Son iguales" },
  ans: "Se verifica |A| = |B|.", sol: "Operando con filas: B se obtiene de A intercambiando filas y sumando múltiplos de otras, con un factor 2 que se compensa en la última columna." });
ejercicio3(34, "Demostrar |A| = |B|", "Demostrar que si A = [1 2 3 4; 0 2 0 2; 1 2 1 2; a b c d] y B = [1 2 3 8; a b c 2d; 0 1 0 2; 1 2 1 4], entonces |A| = |B|. La app lo comprueba con valores concretos de a, b, c, d.",
  [e34("a, b, c, d = 1, 2, 3, 4", 1, 2, 3, 4), e34("a, b, c, d = 2, −1, 5, 7", 2, -1, 5, 7)]);
