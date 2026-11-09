// Unidad 3 · Minimización y equivalencia de AFD (ejercicios 10 y 11 de la guía, págs. 58 a 68).
const minimizeTool = (tables) => ({ type: "dfa", tables });

const T10A = { name: "fA", alphabet: ["0", "1", "2"], start: "A", accepting: ["D", "F", "G"], rows: [["A", "A", "B", "F"], ["B", "B", "A", "G"], ["C", "E", "C", "B"], ["D", "F", "G", "B"], ["E", "C", "B", "E"], ["F", "F", "G", "F"], ["G", "F", "F", "G"]] };
const T10B = { name: "fB", alphabet: ["0", "1", "2"], start: "A", accepting: ["B", "C", "D", "G"], rows: [["A", "E", "B", "F"], ["B", "C", "D", "B"], ["C", "D", "B", "B"], ["D", "B", "C", "C"], ["E", "A", "D", "E"], ["F", "F", "C", "A"], ["G", "C", "B", "E"]] };

const T11 = [
  { name: "fA", alphabet: ["0", "1"], start: "A", accepting: ["C", "E"], rows: [["A", "B", "C"], ["B", "B", "D"], ["C", "E", "B"], ["D", "C", "B"], ["E", "C", "B"]] },
  { name: "fB", alphabet: ["0", "1"], start: "A", accepting: ["F"], rows: [["A", "B", "F"], ["B", "C", "E"], ["C", "D", "E"], ["D", "B", "E"], ["E", "F", "D"], ["F", "F", "B"]] },
  { name: "fC", alphabet: ["0", "1"], start: "A", accepting: ["C", "E"], rows: [["A", "C", "B"], ["B", "E", "B"], ["C", "E", "F"], ["D", "B", "A"], ["E", "C", "F"], ["F", "F", "B"], ["G", "G", "A"]] },
  { name: "fD", alphabet: ["0", "1"], start: "A", accepting: ["D", "E", "F"], rows: [["A", "F", "B"], ["B", "E", "C"], ["C", "D", "A"], ["D", "E", "C"], ["E", "F", "B"], ["F", "D", "E"]] },
  { name: "fE", alphabet: ["0", "1"], start: "A", accepting: ["C", "D"], rows: [["A", "C", "A"], ["B", "F", "G"], ["C", "D", "E"], ["D", "C", "F"], ["E", "F", "G"], ["F", "E", "G"], ["G", "C", "G"]] },
];

export const MINIMIZACION = {
  id: "minimizacion",
  title: "Minimización y equivalencia",
  exerciseRange: "10 y 11",
  context: "Minimizar un AF es reducir la cantidad de estados, de dos maneras: eliminando los estados no conexos (a los que nunca se llega desde el inicial) y verificando estados equivalentes con los conjuntos cocientes Q/E0, Q/E1, … Dos o más estados son equivalentes si, para cada entrada, transitan a la misma clase. Dos AFD son equivalentes si sus autómatas mínimos coinciden. La herramienta de cada ejercicio hace el proceso paso a paso.",
  tool: minimizeTool([T10A]),
  example: {
    title: "Ejemplo resuelto: AFDA del ejercicio 10",
    page: 58,
    statement: "AFDA = ({0, 1, 2}, {A, B, C, D, E, F, G}, A, {D, F, G}, fA)",
    tables: [T10A],
    steps: [
      { title: "Paso 1: estados no conexos", text: "Desde el inicial A se llega a A, B y F; desde B se llega a B, A y G; desde F a F y G. No se puede acceder a C, D y E: se eliminan. El AF se redujo de 7 estados a 4 (A, B, F, G)." },
      { title: "Paso 2: cociente inicial", text: "Q/E0 = { C0 = {A, B}, C1 = {F, G} }, con C0 = Q − F y C1 = F (los estados finales por un lado y el resto por el otro)." },
      { title: "Verificar C0 = {A, B}", text: "f(A,0) = A y f(B,0) = B: con la entrada 0 transitan a la misma clase C0.\nf(A,1) = B y f(B,1) = A: con la entrada 1 transitan a C0.\nf(A,2) = F y f(B,2) = G: con la entrada 2 transitan a C1.\nSiempre a la misma clase: son equivalentes y quedan agrupados." },
      { title: "Verificar C1 = {F, G}", text: "f(F,0) = F y f(G,0) = F → C1.   f(F,1) = G y f(G,1) = F → C1.   f(F,2) = F y f(G,2) = G → C1.\nTambién son equivalentes. Entonces Q/E1 = Q/E0 y se detiene el cálculo." },
      { title: "AFD mínimo", text: "AFD mínimo = ({0, 1, 2}, {C0, C1}, C0, {C1}, f'A)\nf'A    0    1    2\n→C0   C0   C0   C1\n*C1   C1   C1   C1\nLos nuevos estados son las clases Ci; para cada transición se toma cualquier estado de la clase y se ve a qué clase pertenece su destino. El estado de aceptación es la clase que contiene al estado de aceptación original." },
    ],
  },
  exercises: [
    {
      id: "u3-e10",
      number: 10,
      page: 58,
      solutionPage: 61,
      statement: "Comprobar si los siguientes AFD son equivalentes. Para ello, se deberá minimizar cada autómata, eliminando, en primera instancia, los estados no conexos, si los hubiese, y construir luego los conjuntos cocientes necesarios.\nAFDA = ({0, 1, 2}, {A, B, C, D, E, F, G}, A, {D, F, G}, fA)\nAFDB = ({0, 1, 2}, {A, B, C, D, E, F, G}, A, {B, C, D, G}, fB)",
      tables: [T10A, T10B],
      tool: minimizeTool([T10A, T10B]),
      parts: [{
        id: "",
        prompt: "¿Son equivalentes?",
        checks: [{ id: "eq", label: "¿Son equivalentes?", spec: { kind: "dfa-equivalent", a: T10A, b: T10B } }],
        solution: "AFDA: se eliminan los estados no conexos C, D, E (quedan A, B, F, G). Q/E0 = {C0 = {A, B}, C1 = {F, G}} = Q/E1. AFD mínimo = ({0, 1, 2}, {C0, C1}, C0, {C1}, f'A) con f'A: C0 → C0, C0, C1; *C1 → C1, C1, C1.\nAFDB: se elimina G. Q/E0 = {C0 = {A, E, F}, C1 = {B, C, D}} = Q/E1. AFD mínimo = ({0, 1, 2}, {C0, C1}, C0, {C1}, f'B) con f'B: C0 → C0, C1, C0; *C1 → C1, C1, C1.\nComo se ve, el AFD mínimo 1 posee un grafo diferente al AFD mínimo 2, por lo tanto estos autómatas no son equivalentes.",
      }],
    },
    {
      id: "u3-e11",
      number: 11,
      page: 62,
      solutionPage: 68,
      statement: "Determinar cuáles de los cinco AFD presentados son equivalentes entre sí. Minimizar cada autómata, eliminando en primera instancia los estados no conexos, si los hubiese, y luego construir los conjuntos cocientes necesarios.\nAFDA = ({0, 1}, {A, B, C, D, E}, A, {C, E}, fA)   AFDB = ({0, 1}, {A, B, C, D, E, F}, A, {F}, fB)\nAFDC = ({0, 1}, {A, B, C, D, E, F, G}, A, {C, E}, fC)   AFDD = ({0, 1}, {A, B, C, D, E, F}, A, {D, E, F}, fD)\nAFDE = ({0, 1}, {A, B, C, D, E, F, G}, A, {C, D}, fE)",
      dubious: "En la guía las tuplas de AFDC, AFDD y AFDE dicen que el estado de aceptación es {F}, pero las tablas (con *) y los conjuntos cocientes usan {C, E}, {D, E, F} y {C, D}. Se cargaron los de las tablas.",
      tables: T11,
      tool: minimizeTool(T11),
      parts: [{
        id: "",
        prompt: "Escribí los pares de autómatas equivalentes entre sí (por ejemplo A=B, C=E).",
        checks: [{ id: "cl", label: "Pares equivalentes", spec: { kind: "dfa-classes", tables: T11 } }],
        solution: "AFDA mínimo: 4 estados, C0 = {A}, C1 = {B}, C2 = {D}, C3 = {C, E} (Q/E2 = Q/E1).\nAFDB mínimo: 4 estados, C0 = {A}, C1 = {B, C, D}, C2 = {E}, C3 = {F}.\nAFDC: estados no conexos D y G; Q/E2 = {C0 = {A, B}, C1 = {F}, C2 = {C, E}}; mínimo de 3 estados.\nAFDD: no hay estados no conexos y ya es mínimo (6 estados: Q/E3 separa a todos).\nAFDE: estado no conexo B; Q/E2 = {C0 = {A, G}, C1 = {E, F}, C2 = {C, D}}; mínimo de 3 estados.\nComparando los cinco AFD resulta: el AFDA es equivalente con el AFDB y el AFDC es equivalente con el AFDE.",
      }],
    },
  ],
};
