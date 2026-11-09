// Unidad 4 · De la expresión regular al AFD mínimo con el algoritmo de Thompson (ejercicios 14 y 25; guía págs. 71 y 81 a 92).
import { afFromTable } from "../machines/build.js";
import { determinize } from "../machines/convert.js";
import { minimizeMachine, thompson } from "../machines/constructions.js";

const B = ["0", "1"];
const AB = ["a", "b"];

// Tablas de la guía (ejercicio 25).
export const AFD_11_0 = afFromTable({ name: "AFD'", alphabet: B, start: "C0", accepting: ["C0", "C1", "C4"], rows: [["C0", "C1", "C2"], ["C1", "C1", "C2"], ["C2", "C3", "C4"], ["C3", "C3", "C3"], ["C4", "C1", "C2"]] });
export const MIN_11_0 = afFromTable({ name: "AFD''", alphabet: B, start: "P3", accepting: ["P3"], rows: [["P1", "P2", "P3"], ["P2", "P2", "P2"], ["P3", "P3", "P1"]] });
export const AFD_ABB = afFromTable({ name: "AFD'", alphabet: AB, start: "C0", accepting: ["C0", "C1", "C3", "C4", "C6"], rows: [["C0", "C1", "C2"], ["C1", "C3", "C4"], ["C2", "C5", "C6"], ["C3", "C3", "C2"], ["C4", "C5", "C6"], ["C5", "C5", "C5"], ["C6", "C3", "C2"]] });
export const MIN_ABB = afFromTable({ name: "AFD''", alphabet: AB, start: "P1", accepting: ["P1", "P2", "P4", "P6"], rows: [["P1", "P2", "P3"], ["P2", "P6", "P4"], ["P3", "P5", "P6"], ["P4", "P5", "P6"], ["P5", "P5", "P5"], ["P6", "P6", "P3"]] });

const lang = (machineType, alphabet, regex, extra = {}) => ({ kind: "machine-language", machineType, alphabet, maxLen: 8, predicate: "regex", params: { regex }, ...extra });
const dfaOf = (regex) => determinize(thompson(regex).machine).dfa;
const minOf = (regex) => minimizeMachine(dfaOf(regex)).machine;

// Tres partes por expresión: a) AFND de Thompson, b) AFD equivalente, c) AFD mínimo.
function threeParts({ regex, alphabet, afd, min, minStates, solutions }) {
  return [
    {
      id: "a",
      prompt: `Construí en el editor el AFND de Thompson para ${regex} (con transiciones λ).`,
      tool: { type: "thompson", regex },
      machine: { type: "afnd", alphabet, lockAlphabet: true, runExamples: [], spec: lang("afnd", alphabet, regex), reference: thompson(regex).machine, referenceSource: "sandbox", referenceNote: "Solución propuesta por el sandbox: la guía trae el grafo; la numeración de los estados puede diferir." },
      solution: solutions.a,
    },
    {
      id: "b",
      prompt: "Determiná el AFD equivalente (con las transiciones λ explícitas y T*) y dibujalo.",
      machine: { type: "afd", alphabet, lockAlphabet: true, runExamples: [], spec: lang("afd", alphabet, regex), reference: afd, referenceSource: "guia" },
      solution: solutions.b,
    },
    {
      id: "c",
      prompt: `Minimizá el AFD (el mínimo tiene ${minStates} estados) y dibujalo.`,
      machine: { type: "afd", alphabet, lockAlphabet: true, runExamples: [], spec: lang("afd", alphabet, regex, { complete: true, exactStates: minStates }), reference: min, referenceSource: "guia" },
      solution: solutions.c,
    },
  ];
}

const REGEX_E7 = [["a", "0+(11)*0"], ["b", "0+(11)0*"], ["c", "0(11)*+0"], ["d", "0*(11)+0"], ["e", "0*(11)0*"]];

export const THOMPSON = {
  id: "thompson",
  title: "Expresión regular → AFND → AFD → mínimo",
  exerciseRange: "14 y 25",
  context: "Algoritmo de Thompson: se arma el AFND con transiciones λ componiendo AF chicos (símbolo, unión, concatenación y estrella). Después se pasa a AFD con el Teorema 2, caso 2 (con la tabla de transiciones λ explícitas, reflexivas y transitivas, T y T*), y por último se minimiza con los conjuntos cocientes. La herramienta de cada ejercicio hace las tres etapas.",
  example: {
    title: "Ejemplo resuelto: L((11+0)*) (ejercicio 25)",
    page: 81,
    statement: "Usando la expresión regular L((11+0)*), construir el AFND con el método de Thompson, determinar el AFD equivalente y minimizarlo.",
    tool: { type: "thompson", regex: "(11+0)*" },
    steps: [
      { title: "a) Construcción de Thompson", text: "La expresión es la estrella de (11+0). Se arma un AF para 11+0 (la unión de 11 y 0) y se lo rodea con la estructura de la estrella (λ para entrar, para repetir y para salir). Las flechas de línea punteada de las figuras 4.48 y 4.49 representan un AF en sí mismas (uno para 11+0 y otro para 11).\nAFND = ({0, 1}, {q0, q1, …, q11}, q0, {q3}, f)" },
      { title: "b) AFD equivalente", text: "Se construye la tabla de f con las transiciones λ explícitas, reflexivas y transitivas (T y T*). Se obtiene: f(q0, λ) = {q0, q1, q3, q4, q6, q8} = C0 y\nf'(C0, 0) = C1, f'(C0, 1) = C2, f'(C1, 0) = C1, f'(C1, 1) = C2, f'(C2, 0) = C3, f'(C2, 1) = C4, f'(C4, 0) = C1, f'(C4, 1) = C2.\nAFD' = ({0, 1}, {C0, C1, C2, C3, C4}, C0, {C0, C1, C4}, f')\nf'      0    1\n→*C0   C1   C2\n*C1   C1   C2\n  C2   C3   C4\n  C3   C3   C3\n*C4   C1   C2" },
      { title: "c) Minimización", text: "Es conexo. Q/E0 = {{C2, C3}, {C0, C1, C4}}; C2 y C3 no son equivalentes y C0, C1 y C4 sí: Q/E1 = {{C2}, {C3}, {C0, C1, C4}} = Q/E2.\nAFD'' = ({0, 1}, {P1, P2, P3}, P3, {P3}, f'')\nf''     0    1\n  P1   P2   P3\n  P2   P2   P2\n→*P3   P3   P1" },
    ],
  },
  exercises: [
    {
      id: "u4-e14",
      number: 14,
      page: 71,
      solutionPage: 71,
      statement: "Usando las expresiones regulares del Ejercicio 9 del Capítulo 3, para cada una de ellas se pide:\na) Construya el AFND que reconoce el lenguaje que determina la expresión usando el método de Thompson (grafo y definición formal).\nb) Determine cuál es el AFD equivalente al obtenido en el punto anterior (grafo y definición formal).\nc) Minimice el AFD obtenido en el punto anterior (grafo y definición formal).",
      dubious: "Las expresiones del Ejercicio 9 del Capítulo 3 del libro no figuran en estas páginas de la guía. Se usan las del ejercicio 7 de la Unidad 3 (a a e), que son las expresiones regulares de ese práctico.",
      parts: REGEX_E7.map(([id, regex]) => ({
        id,
        prompt: `${regex}: dibujá en el editor el AFD mínimo de este lenguaje (la herramienta muestra Thompson, el AFD y el mínimo).`,
        tool: { type: "thompson", regex },
        machine: { type: "afd", alphabet: B, lockAlphabet: true, runExamples: [], spec: lang("afd", B, regex, { complete: true }), reference: minOf(regex), referenceSource: "sandbox", referenceNote: "Solución propuesta por el sandbox: la guía no resuelve este ejercicio." },
        solution: `La guía no resuelve este ejercicio. Con la herramienta se ve todo el procedimiento para ${regex}.`,
      })),
    },
    {
      id: "u4-e25",
      number: 25,
      page: 81,
      solutionPage: 92,
      statement: "Usando las expresiones regulares del Ejercicio 28 del Capítulo 2, para cada una de ellas se pide:\na) Construya el AFND que reconoce el lenguaje que determina la expresión usando el método de Thompson (grafo y definición formal).\nb) Determine cuál es el AFD equivalente al obtenido en el punto anterior (grafo y definición formal).\nc) Minimice el AFD obtenido en el punto anterior (grafo y definición formal).\nLas expresiones son L((11+0)*) y L((a+bb)*+ab).",
      note: "En la guía, la definición del AFD'' del segundo caso escribe el alfabeto como {0, 1}: es {a, b}.",
      parts: [
        ...threeParts({
          regex: "(11+0)*", alphabet: B, afd: AFD_11_0, min: MIN_11_0, minStates: 3,
          solutions: {
            a: "AFND = ({0, 1}, {q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11}, q0, {q3}, f) (figuras 4.48 a 4.50).",
            b: "AFD' = ({0, 1}, {C0, C1, C2, C3, C4}, C0, {C0, C1, C4}, f') con la tabla 4.34: C0 → C1, C2; C1 → C1, C2; C2 → C3, C4; C3 → C3, C3; C4 → C1, C2.",
            c: "AFD'' = ({0, 1}, {P1, P2, P3}, P3, {P3}, f'') con la tabla 4.35: P1 → P2, P3; P2 → P2, P2; P3 → P3, P1.",
          },
        }).map((p) => ({ ...p, id: `1${p.id}`, prompt: `L((11+0)*) — ${p.prompt}` })),
        ...threeParts({
          regex: "(a+bb)*+ab", alphabet: AB, afd: AFD_ABB, min: MIN_ABB, minStates: 6,
          solutions: {
            a: "AFND = ({a, b}, {q0, q1, …, q19}, q0, {q1}, f) (figuras 4.53 a 4.56): una unión entre (a+bb)* y ab.",
            b: "AFD' = ({a, b}, {C0, C1, C2, C3, C4, C5, C6}, C0, {C0, C1, C3, C4, C6}, f') con la tabla 4.37.",
            c: "Q/E0 = {{C2, C5}, {C0, C1, C3, C4, C6}}; Q/E1 = {{C1}, {C2}, {C4}, {C5}, {C0, C3, C6}}; Q/E2 = {{C0}, {C1}, {C2}, {C4}, {C5}, {C3, C6}} = Q/E3.\nAFD'' = ({a, b}, {P1, P2, P3, P4, P5, P6}, P1, {P1, P2, P4, P6}, f'') con la tabla 4.38.",
          },
        }).map((p) => ({ ...p, id: `2${p.id}`, prompt: `L((a+bb)*+ab) — ${p.prompt}` })),
      ],
    },
  ],
};
