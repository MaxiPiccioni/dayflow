// Unidad 6 · Complejidad de la máquina de Turing (ejercicios 22 a 24 y 6.32; guía págs. 143, 157 y 180 a 183).
// T(n): cantidad de pasos (movimientos) en función del largo n de la cadena. E(n): celdas de cinta recorridas.
import * as M from "./machines.js";
import { lang, nibblePairs, outSpec, sandbox, tape, words } from "./helpers.js";

const stars = (alphabet, max) => words(alphabet, max).map((w) => `${w}*`);

export const COMPLEJIDAD = {
  id: "complejidad",
  title: "Complejidad de la máquina de Turing",
  exerciseRange: "22 a 24 y 32",
  context: "La complejidad temporal T(n) es la cantidad de pasos (cada transición es un movimiento) que hace la máquina con una cadena de largo n, y la complejidad espacial E(n) es la cantidad de celdas de cinta que usa. Hay dos caminos: analítico (contar los movimientos de avance y de retroceso en función de n) o experimental (medir con el simulador cadenas de distinto largo y ajustar un polinomio; conviene proponer uno de grado mayor al esperado, y los coeficientes de más dan 0). Después se predice una cadena más larga y se compara con la simulación. En esta sección, el botón \"Medir T(n) y E(n)\" mide tu máquina del editor con cadenas cada vez más largas y ajusta los polinomios de forma exacta.",
  example: {
    title: "Ejemplo resuelto: cᵏdᵏeᵏ (ejercicio 22)",
    page: 180,
    statement: "Determinar las expresiones de complejidad temporal T(n) y complejidad espacial E(n) en función del largo n de la cadena procesada en el caso de la máquina de Turing representada en el Ejemplo 6.1, que valida cadenas de la forma general α = cᵏ dᵏ eᵏ donde k ≥ 1.",
    machine: { ...tape("mt", ["c", "d", "e"], ["X", "Y", "Z"]), initial: M.MT61, runExamples: ["cde", "ccddee", "cccdddeee"], complexity: "ckdkek" },
    steps: [
      { title: "Análisis analítico", text: "Con una cadena de largo n, cada tercio mide n/3. Por cada c el cabezal avanza 2n/3 celdas (marca una d y una e) y retrocede 2n/3 + 1 para volver a la c. Se repite k = n/3 veces; al final limpia con 2n/3 + 1 movimientos más hasta el blanco." },
      { title: "T(n)", text: "T(n) = (2n/3 + 2n/3 + 1)·n/3 + 2n/3 + 1 = (4n/3 + 1)·n/3 + 2n/3 + 1 = 4/9 n² + n + 1." },
      { title: "Método experimental", text: "Con el simulador, la guía obtiene 23, 46, 77 y 116 pasos para n = 6, 9, 12 y 15. Se propone un polinomio de grado 3 (A n³ + B n² + C n + D) y se resuelve el sistema: A = 0, B = 0,4444, C = 1 y D = 1. Se predice n = 18: 0,4444·18² + 18 + 1 = 163, y la simulación da 163." },
      { title: "Espacio", text: "El cabezal recorre la cadena y el blanco de la derecha: E(n) = n + 1." },
      { title: "Probalo", text: "La MT de abajo (del sandbox, equivalente a la del Ejemplo 6.1) hace exactamente esos pasos. Apretá \"Medir T(n) y E(n)\" para ver la tabla y los polinomios." },
    ],
  },
  exercises: [
    {
      id: "u6-e22",
      number: 22,
      page: 143,
      solutionPage: 180,
      statement: "Determinar las expresiones de complejidad temporal T(n) y complejidad espacial E(n) en función del largo n de la cadena procesada en el caso de la máquina de Turing presentada en el Ejemplo 6.1, destinada a validar cadenas de la forma general α = cᵏdᵏeᵏ, donde k > 0. Construir la MT, determinar T(n) en forma analítica, predecir el costo de cadenas más largas y comparar con la simulación.",
      dubious: "El Ejemplo 6.1 no está en las páginas; se carga la MT equivalente del sandbox, que da los mismos números que la guía (23, 46, 77, 116 y 163 pasos para n = 6, 9, 12, 15 y 18).",
      parts: [
        { id: "", prompt: "Armá la MT de cᵏdᵏeᵏ y medí su complejidad.", machine: { ...tape("mt", ["c", "d", "e"], ["X", "Y", "Z"]), runExamples: ["cde", "ccddee", "cccdddeee"], complexity: "ckdkek", spec: lang("mt", ["c", "d", "e"], "triple-blocks", { x: "c", y: "d", z: "e" }, { maxLen: 8 }), ...sandbox(M.MT61, "Solución propuesta por el sandbox (equivalente a la del Ejemplo 6.1).") }, solution: "T(n) = 4/9 n² + n + 1 y E(n) = n + 1 (n = 3k). Análisis: por cada una de las n/3 vueltas se hacen 2n/3 avances y 2n/3 + 1 retrocesos, más 2n/3 + 1 movimientos para limpiar: T(n) = (4n/3 + 1)·n/3 + 2n/3 + 1. Es O(n²)." },
      ],
    },
    {
      id: "u6-e23",
      number: 23,
      page: 143,
      statement: "Determinar las expresiones de complejidad temporal T(n) y espacial E(n) en función del largo de la cadena n en el caso de la MT resuelta en el Ejercicio 10, destinada a generar una imagen refleja de la entrada.",
      note: "En esta herramienta n es el largo de la palabra antes del * (cadena w*). La complejidad depende de tu máquina: la del sandbox es cuadrática.",
      parts: [
        { id: "", prompt: "Imagen refleja después del * (ejercicio 10): medí T(n) y E(n).", machine: { ...tape("mt", ["A", "B", "*"], ["X", "Y"]), initial: M.MT10, runExamples: ["ABB*", "AB*"], complexity: "mirror", spec: outSpec("mt", "mirror-after-star", stars(["A", "B"], 5)), ...sandbox(M.MT10) }, solution: "Depende de la máquina del ejercicio 10: la del sandbox copia cada símbolo yendo y viniendo, así que T(n) es un polinomio de grado 2 en n (se ve con el botón de medir). E(n) es lineal: usa la cadena, el * y su imagen." },
      ],
    },
    {
      id: "u6-e24",
      number: 24,
      page: 143,
      statement: "Determinar las expresiones de complejidad temporal T(n) y espacial E(n) en el caso de la MT resuelta en el Ejercicio 13, destinada a intercambiar dos nibbles.",
      note: "En esta herramienta n es el largo de cada palabra (x*y con x e y de n bits): con nibbles, n = 4. La máquina del sandbox funciona para cualquier largo, por eso se puede medir T(n).",
      parts: [
        { id: "", prompt: "Intercambio de nibbles (ejercicio 13): medí T(n) y E(n).", machine: { ...tape("mt", ["0", "1", "*"], ["A", "B"]), initial: M.MT13, runExamples: ["1001*0011"], complexity: "swap", spec: outSpec("mt", "swap-nibbles", nibblePairs()), ...sandbox(M.MT13) }, solution: "Depende de la máquina del ejercicio 13: la del sandbox intercambia un par de símbolos por vuelta, yendo y viniendo, así que T(n) es cuadrático (se ve con el botón de medir) y E(n) es lineal." },
      ],
    },
    {
      id: "u6-e32",
      number: 32,
      page: 157,
      solutionPage: 157,
      statement: "Ejercicio 6.32 (resuelto): se desea conocer la expresión de la complejidad temporal de una máquina de Turing que reconoce el lenguaje de palíndromos L = { α#α⁻¹ / α ∈ {0,1}⁺ }, es decir que el sufijo es la cadena inversa del prefijo. Para validar las cadenas la MT mueve el cabezal hasta el separador # y a partir de allí avanza desde el medio de la cadena hacia los extremos, verificando los símbolos del sufijo y del prefijo con sucesivos movimientos de avance y retroceso. n = 2|α| + 1.",
      dubious: "El Ejemplo 6.12 al que remite no está en las páginas. La MT del sandbox hace los pasos que cuenta la guía: T(n) = n²/2 + 2n + 1/2.",
      parts: [
        { id: "", prompt: "Armá la MT de α#α⁻¹ y medí T(n).", machine: { ...tape("mt", ["0", "1", "#"], ["X"]), runExamples: ["011#110", "01#10", "0#0"], complexity: "palindrome", spec: lang("mt", ["0", "1", "#"], "reverse-hash", {}, { maxLen: 9 }), ...sandbox(M.MT32, "Solución propuesta por el sandbox, que da la misma cantidad de pasos que la guía.") }, solution: "Primer movimiento hasta #: 0,5·(n − 1). Avances desde el prefijo al sufijo: ½(1 + n)·½(1 + n). Retrocesos: ½(2 + n + 1)·½(1 + n). Combinados: T(n) = (n − 1)/2 + (2n + 4)(n + 1)/4 = ½ n² + 2n + ½ = O(n²)." },
      ],
    },
  ],
};
