// Unidad 4 · AFND: construcción (ejercicios 1 a 3) y conversión de AFND a AFD (ejercicios 3 a 8 y 15 a 18).
// Guía: págs. 69 a 80 (libro) y 93 a 103 (cátedra). Los autómatas dados por tabla se cargan con afFromTable;
// los AFD de referencia de las conversiones se calculan con determinize (los tests comprueban que coinciden
// con las tablas de la guía).
import { afFromList, afFromTable } from "../machines/build.js";
import { determinize } from "../machines/convert.js";

const B = ["0", "1"];
const AB = ["a", "b"];
const nfa = (rows, extra) => afFromTable({ type: "afnd", rows, ...extra });

// ---- Construcción de AFND con condiciones de error (ejercicios 1 y 2) ----
export const AFND1 = afFromList({
  type: "afnd", name: "AFND1", alphabet: B, states: ["p", "q", "r", "s", "t", "E"], start: "p", accepting: ["t"],
  transitions: ["p 0 p", "p 1 p", "p 1 q", "q 0 r", "q 1 E", "r 0 s", "r 1 E", "s 0 t", "s 1 E", "t 0 E", "t 1 E", "E 0 E", "E 1 E"],
});
export const AFND2 = afFromList({
  type: "afnd", name: "AFND2", alphabet: B, states: ["p", "q", "r", "s", "t", "E"], start: "p", accepting: ["t"],
  transitions: ["p 0 p", "p 1 p", "p 1 q", "q 0 r", "q 1 r", "r 0 s", "r 1 E", "s 0 t", "s 1 E", "t 0 E", "t 1 E", "E 0 E", "E 1 E"],
});

// ---- AFND dados por tabla ----
export const AFND3 = nfa([["p", "p", "p q"], ["q", "r", "-"], ["r", "s", "s"], ["s", "t", "-"], ["t", "-", "-"]], { name: "AFND3", alphabet: AB, start: "p", accepting: ["t"] });
export const AFND4 = nfa([["p", "p", "p q"], ["q", "p r", "q r"], ["r", "r", "q"]], { name: "AFND4", alphabet: B, start: "p", accepting: ["r"] });
export const AFND5 = nfa([["p", "q", "p", "p s"], ["q", "q", "p s", "p r"], ["r", "r", "p s", "r"], ["s", "s", "q s", "r"]], { name: "AFND5", alphabet: ["a", "b", "c"], start: "p", accepting: ["s"] });
export const AFND6 = nfa([["p", "-", "q r", "q"], ["q", "q", "-", "s"], ["r", "p", "p r", "-"], ["s", "-", "-", "-"]], { name: "AFND-λ", alphabet: AB, extraColumns: ["λ"], start: "p", accepting: ["r"] });
export const AFND7 = nfa([["A", "B C", "A", "B D"], ["B", "-", "B D", "D"], ["C", "C", "B C D", "-"], ["D", "-", "A C", "B"]], { name: "AFND-λ", alphabet: B, extraColumns: ["λ"], start: "A", accepting: ["C"] });
export const AFND8 = nfa([["p", "-", "q r", "r"], ["q", "p", "p q", "-"], ["r", "r", "-", "s"], ["s", "-", "s", "-"]], { name: "AFND-λ", alphabet: B, extraColumns: ["λ"], start: "p", accepting: ["q"] });
export const AFND15 = nfa([["A", "B E", "B"], ["B", "C", "C D"], ["C", "C", "B"], ["D", "D", "D"], ["E", "C", "D"]], { name: "AFND", alphabet: B, start: "A", accepting: ["C", "E"] });
export const AFND16 = nfa([["A", "B", "D", "D"], ["B", "A C", "B C", "D"], ["C", "C", "C", "C D"], ["D", "D", "D", "D"]], { name: "AFND", alphabet: ["a", "b", "c"], start: "A", accepting: ["D"] });
export const AFND17 = nfa([["a", "a b", "-", "b"], ["b", "-", "c", "c"], ["c", "-", "c d", "-"], ["d", "b", "-", "-"]], { name: "AFND-λ", alphabet: ["1", "2"], extraColumns: ["λ"], start: "a", accepting: ["d"] });
export const AFND18 = nfa([["A", "B", "-", "B"], ["B", "-", "C D", "C"], ["C", "-", "-", "B"], ["D", "E A", "-", "-"], ["E", "-", "E", "B"]], { name: "AFND-λ", alphabet: B, extraColumns: ["λ"], start: "A", accepting: ["E"] });

const dfaOf = (m, includeEmpty = true) => determinize(m, { includeEmpty }).dfa;

const lang = (machineType, alphabet, predicate, params, extra = {}) => ({ kind: "machine-language", machineType, alphabet, maxLen: 8, predicate, params, ...extra });
const equiv = (reference, extra = {}) => ({ kind: "machine-equivalent", machineType: "afd", reference, alphabet: reference.alphabet, ...extra });

// Un ejercicio de conversión: (a) árboles de las cadenas dadas, (b) AFD equivalente en el editor.
function conversion({ id, number, page, solutionPage, statement, machine, strings, includeEmpty = true, source = "guia", solutionA, solutionB, extra = {} }) {
  const dfa = dfaOf(machine, includeEmpty);
  return {
    id: `u4-e${number}`,
    number,
    page,
    solutionPage,
    statement,
    ...extra,
    parts: [
      {
        id: "a",
        prompt: `Árbol de descripciones instantáneas para cada una de las cadenas ${strings.join(", ")}. Ejecutalas en el editor (el árbol se ramifica) y escribí cuáles se reconocen.`,
        machine: { type: machine.type, initial: machine, readOnly: true, lockAlphabet: true, runExamples: strings },
        checks: [{ id: "r", label: "Cadenas reconocidas (separadas por coma, o ninguna)", spec: { kind: "fa-accepts", machine, strings } }],
        solution: solutionA,
      },
      {
        id: "b",
        prompt: "Realizar la conversión del AFND a AFD: dibujá en el editor el AFD equivalente. La herramienta muestra el procedimiento del Teorema 2 paso a paso.",
        tool: { type: "convert", machine },
        machine: {
          type: "afd",
          alphabet: machine.alphabet,
          lockAlphabet: true,
          runExamples: strings,
          spec: equiv(machine),
          reference: dfa,
          referenceSource: source,
          referenceNote: source === "guia" ? "El AFD de referencia coincide con la tabla de la guía." : "Solución propuesta por el sandbox: la guía no resuelve este ejercicio.",
        },
        solution: solutionB,
      },
    ],
  };
}

export const CONSTRUCCION = {
  id: "construccion",
  title: "Construcción de AFND",
  exerciseRange: "1 a 3",
  context: "Un AFND = (ΣE, Q, q0, A, f) tiene f: Q × (ΣE ∪ {λ}) → partes de Q: desde un estado, con un mismo símbolo, puede haber varias transiciones (o ninguna), y puede haber transiciones λ. Una cadena se reconoce si alguna rama de su árbol de descripciones instantáneas termina, con la cadena leída, en un estado de aceptación. El estado E es el estado de error: se agregan las transiciones que faltan hacia E.",
  example: {
    title: "Ejemplo resuelto: árbol de descripciones instantáneas de un AFND (ejercicio 4)",
    page: 96,
    statement: "AFND4 = ({0, 1}, {p, q, r}, p, {r}, f)\nf      0       1\n→p    {p}    {p, q}\n  q   {p, r}  {q, r}\n *r    {r}     {q}",
    machine: { type: "afnd", initial: AFND4, runExamples: ["1000", "1001", "1101"] },
    steps: [
      { title: "Cómo se arma el árbol", text: "Para construir el árbol de una cadena se crean tantas ramas como transiciones tenga cada símbolo de la palabra." },
      { title: "Cadena 1000", text: "(p, 1000) → (p, 000) y (q, 000)\n(p, 000) → (p, 00); (q, 000) → (p, 00) y (r, 00)\n(p, 00) → (p, 0); (r, 00) → (r, 0)\n(p, 0) → (p, λ); (r, 0) → (r, λ)\nEl estado r es de aceptación y una rama llega a (r, λ): la cadena es aceptada." },
      { title: "Cadena 1001", text: "Ninguna rama llega al estado r con la cadena leída: las hojas son (p, λ) y (q, λ). La cadena es rechazada." },
      { title: "Cadena 1101", text: "Tampoco por ninguna rama se llega a r con la cadena leída: la cadena es rechazada." },
      { title: "Probalo", text: "Debajo del ejemplo podés ejecutar este AFND con las tres cadenas (o con otras) y ver cómo el árbol se ramifica paso a paso." },
    ],
  },
  exercises: [
    {
      id: "u4-e1",
      number: 1,
      page: 93,
      solutionPage: 93,
      statement: "Reconocer las condiciones de error del AFND del Ejemplo 4.1 e incorporarlas en la definición formal del autómata y su grafo. El Ejemplo 4.1 pide proponer un AFND destinado a reconocer cadenas que respondan a la forma general α = (0+1)*1000.",
      parts: [{
        id: "",
        prompt: "Dibujá el AFND completo, con el estado de error E, que reconozca (0+1)*1000.",
        machine: { type: "afnd", alphabet: B, lockAlphabet: true, runExamples: ["1000", "01000", "100", "10000"], spec: lang("afnd", B, "regex", { regex: "(0+1)*1000" }, { complete: true, errorState: true }), reference: AFND1, referenceSource: "sandbox", referenceNote: "Solución propuesta por el sandbox: la guía trae el grafo, con AFND1 = ({0, 1}, {p, q, r, s, t, E}, p, {t}, f)." },
        solution: "AFND1 = ({0, 1}, {p, q, r, s, t, E}, p, {t}, f)\nEl AFND del Ejemplo 4.1 tiene f(p,0) = {p}, f(p,1) = {p, q}, f(q,0) = {r}, f(r,0) = {s} y f(s,0) = {t}. Las condiciones de error son las transiciones que faltan: f(q,1), f(r,1), f(s,1), f(t,0) y f(t,1) van al estado de error E, que tiene bucles con 0 y con 1.",
      }],
    },
    {
      id: "u4-e2",
      number: 2,
      page: 93,
      solutionPage: 93,
      statement: "Reconocer las condiciones de error del AFND del Ejemplo 4.2 e incorporarlas en la definición formal del autómata y su grafo. El Ejemplo 4.2 pide proponer un AFND destinado a reconocer cadenas que respondan a la forma general α = (0+1)*1(0+1)00.",
      parts: [{
        id: "",
        prompt: "Dibujá el AFND completo, con el estado de error E, que reconozca (0+1)*1(0+1)00.",
        machine: { type: "afnd", alphabet: B, lockAlphabet: true, runExamples: ["10000", "11100", "1100", "0100"], spec: lang("afnd", B, "regex", { regex: "(0+1)*1(0+1)00" }, { complete: true, errorState: true }), reference: AFND2, referenceSource: "sandbox", referenceNote: "Solución propuesta por el sandbox: la guía trae el grafo, con AFND2 = ({0, 1}, {p, q, r, s, t, E}, p, {t}, f)." },
        solution: "AFND2 = ({0, 1}, {p, q, r, s, t, E}, p, {t}, f)\nDespués del 1 que se “adivina” (p → q) viene un símbolo cualquiera (q → r con 0 o 1) y luego 00 (r → s → t). Las condiciones de error son los símbolos que no se esperan en r, s y t, y las salidas de t: todas van al estado de error E.",
      }],
    },
    {
      id: "u4-e3",
      number: 3,
      page: 94,
      solutionPage: 95,
      statement: "Proponer un AFND que reconozca cadenas de la forma general α = (a+b)*ba(a+b)a y luego convertirlo a un AFD equivalente. Para ambos autómatas presentar las definiciones formales y grafos.",
      parts: [
        {
          id: "a",
          prompt: "Dibujá el AFND que reconozca (a+b)*ba(a+b)a.",
          machine: { type: "afnd", alphabet: AB, lockAlphabet: true, runExamples: ["baaa", "abbaba", "baa", "bbaa"], spec: lang("afnd", AB, "regex", { regex: "(a+b)*ba(a+b)a" }), reference: AFND3, referenceSource: "guia", referenceNote: "AFND3 = ({a, b}, {p, q, r, s, t}, p, {t}, f), con la tabla de la guía." },
          solution: "AFND3 = ({a, b}, {p, q, r, s, t}, p, {t}, f)\nf      a       b\n→p    {p}   {p, q}\n  q   {r}\n  r   {s}    {s}\n  s   {t}\n *t",
        },
        {
          id: "b",
          prompt: "Convertilo a un AFD equivalente: dibujalo en el editor.",
          tool: { type: "convert", machine: AFND3 },
          machine: { type: "afd", alphabet: AB, lockAlphabet: true, runExamples: ["baaa", "abbaba", "baa"], spec: equiv(AFND3), reference: dfaOf(AFND3), referenceSource: "guia", referenceNote: "El AFD coincide con AFDE3 de la guía: C0 = {p}, C1 = {p, q}, C2 = {p, r}, C3 = {p, s}, C4 = {p, q, s}, C5 = {p, t}, C6 = {p, r, t}." },
          solution: "Procedimiento: 1° se renombra el estado inicial: C0 = {p}. 2° desde él se determinan las transiciones y los nuevos estados, hasta que no aparezcan más:\nf(C0,a) = {p} = C0   f(C0,b) = {p,q} = C1\nf(C1,a) = {p,r} = C2   f(C1,b) = {p,q} = C1\nf(C2,a) = {p,s} = C3   f(C2,b) = {p,q,s} = C4\nf(C3,a) = {p,t} = C5   f(C3,b) = {p,q} = C1\nf(C4,a) = {p,r,t} = C6   f(C4,b) = {p,q} = C1\nf(C5,a) = {p} = C0   f(C5,b) = {p,q} = C1\nf(C6,a) = {p,s} = C3   f(C6,b) = {p,q,s} = C4\nAFDE3 = ({a, b}, {C0, C1, C2, C3, C4, C5, C6}, C0, {C5, C6}, f). Los estados de aceptación son las clases que contienen al estado de aceptación del AFND original (t): C5 y C6.",
        },
      ],
    },
  ],
};

export const CONVERSION = {
  id: "conversion",
  title: "Conversión de AFND a AFD",
  exerciseRange: "4 a 8 y 15 a 18",
  context: "La equivalencia entre AFND y AFD se obtiene con el Teorema 2. Para un AFND sin λ se aplica el caso 1: C0 = {q0} y, para cada Ci y cada símbolo a, f'(Ci, a) es la unión de f(q, a) con q en Ci. Para un AFND con λ se aplica el caso 2: se arma T (los pares unidos por λ, cada estado consigo mismo) y T* (con la propiedad transitiva); el estado inicial es el λ-cierre de q0 y cada f'(Ci, a) es el λ-cierre de la unión. Los estados de aceptación del AFD son los conjuntos que contienen algún estado de aceptación del AFND.",
  example: {
    title: "Ejemplo resuelto: conversión del AFND4 (ejercicio 4.b)",
    page: 98,
    statement: "AFND4 = ({0, 1}, {p, q, r}, p, {r}, f)\nf      0       1\n→p    {p}    {p, q}\n  q   {p, r}  {q, r}\n *r    {r}     {q}",
    tool: { type: "convert", machine: AFND4 },
    steps: [
      { title: "Estado inicial", text: "C0 = {p}" },
      { title: "Transiciones desde C0", text: "f(C0, 0) = {p} = C0\nf(C0, 1) = {p, q} = C1 (conjunto nuevo: nuevo estado)" },
      { title: "Transiciones desde C1 y siguientes", text: "f(C1, 0) = {p, r} = C2\nf(C1, 1) = {p, q, r} = C3\nf(C2, 0) = {p, r} = C2\nf(C2, 1) = {p, q} = C1\nf(C3, 0) = {p, r} = C2\nf(C3, 1) = {p, q, r} = C3" },
      { title: "Estados de aceptación", text: "Los que contienen a r: C2 y C3." },
      { title: "AFD equivalente", text: "AFDE4 = ({0, 1}, {C0, C1, C2, C3}, C0, {C2, C3}, f)\nf      0    1\n→C0   C0   C1\n  C1   C2   C3\n*C2   C2   C1\n*C3   C2   C3" },
    ],
  },
  exercises: [
    conversion({
      number: 4, page: 96, solutionPage: 96,
      statement: "Dado el siguiente AFND, se pide:\na) Construir un árbol de descripciones instantáneas para cada una de las siguientes cadenas: 1000, 1001, 1101.\nb) Realizar la conversión del AFND a AFD.\nAFND4 = ({0, 1}, {p, q, r}, p, {r}, f)\nf      0       1\n→p    {p}    {p, q}\n  q   {p, r}  {q, r}\n *r    {r}     {q}",
      machine: AFND4, strings: ["1000", "1001", "1101"],
      solutionA: "Cadena 1000: el estado r es de aceptación y una rama del árbol llega a (r, λ): la cadena es aceptada.\nCadena 1001: por ninguna rama se llega a r con la cadena leída: es rechazada.\nCadena 1101: tampoco: es rechazada.",
      solutionB: "C0 = {p}; f(C0,0) = {p} = C0; f(C0,1) = {p,q} = C1; f(C1,0) = {p,r} = C2; f(C1,1) = {p,q,r} = C3; f(C2,0) = {p,r} = C2; f(C2,1) = {p,q} = C1; f(C3,0) = {p,r} = C2; f(C3,1) = {p,q,r} = C3.\nAFDE4 = ({0, 1}, {C0, C1, C2, C3}, C0, {C2, C3}, f)\n→C0: C0, C1   C1: C2, C3   *C2: C2, C1   *C3: C2, C3",
    }),
    conversion({
      number: 5, page: 69, solutionPage: 69, source: "sandbox",
      statement: "Dado el siguiente AFND, se pide:\na) Construir un árbol de descripciones instantáneas para cada una de las siguientes cadenas: aacbb, baca, ccba.\nb) Realizar la conversión del AFND a AFD.\nAFND = ({a, b, c}, {p, q, r, s}, p, {s}, f)\nf      a     b       c\n→p   {q}   {p}    {p, s}\n  q  {q}  {p, s}  {p, r}\n  r  {r}  {p, s}   {r}\n *s  {s}  {q, s}   {r}",
      machine: AFND5, strings: ["aacbb", "baca", "ccba"],
      solutionA: "La guía no resuelve este ejercicio. El sandbox calcula qué cadenas se reconocen ejecutando el AFND: usá el editor para ver cada árbol.",
      solutionB: "La guía no resuelve este ejercicio: la herramienta muestra la conversión completa con el Teorema 2, caso 1.",
    }),
    conversion({
      number: 6, page: 98, solutionPage: 99, includeEmpty: false,
      statement: "Dado el siguiente AFND-λ, se pide:\na) Construir un árbol de descripciones instantáneas para cada una de las siguientes cadenas: babb, bbbb, bbbaa.\nb) Realizar la conversión del AFND a AFD.\nAFND-λ = ({a, b}, {p, q, r, s}, p, {r}, f)\nf      a       b         λ\n→p           {q, r}     {q}\n  q   {q}              {s}\n *r   {p}   {p, r}\n  s",
      machine: AFND6, strings: ["babb", "bbbb", "bbbaa"],
      solutionA: "La cadena babb es aceptada, la cadena bbbb es aceptada y la cadena bbbaa no es aceptada. (En la guía no se grafican las transiciones λ porque el árbol se vuelve muy voluminoso.)",
      solutionB: "1° T = {(p,p), (p,q), (q,q), (q,s), (r,r), (s,s)}\n2° T* = {(p,p), (p,q), (p,s), (q,q), (q,s), (r,r), (s,s)}: se agrega (p,s) por transitividad (p con q y q con s a través de λ).\n3° Se completa la columna de λ: f(p) con λ completas = a ∅, b {p,q,s}... \n4° C0 = f(p, λ) = {p, q, s}\n5° f(C0,a) = {q} → {q,s} = C1; f(C0,b) = {q,r} → {q,r,s} = C2; f(C1,a) = {q,s} = C1; f(C1,b) = ∅; f(C2,a) = {p,q} → {p,q,s} = C0; f(C2,b) = {p,r} → {p,q,r,s} = C3; f(C3,a) = C0; f(C3,b) = C3.\nAFDE6 = ({a, b}, {C0, C1, C2, C3}, C0, {C2, C3}, f)",
      extra: { note: "En la guía el conjunto vacío no se escribe como estado (la celda queda en blanco). La herramienta tiene una opción para mostrarlo o no." },
    }),
    conversion({
      number: 7, page: 100, solutionPage: 101, includeEmpty: false,
      statement: "Dado el siguiente AFND-λ, se pide:\na) Construir un árbol de descripciones instantáneas para cada una de las siguientes cadenas: 001, 1100, 101.\nb) Realizar la conversión del AFND a AFD.\nAFND-λ = ({0, 1}, {A, B, C, D}, A, {C}, f)\nf       0         1           λ\n→A   {B, C}      {A}       {B, D}\n  B           {B, D}        {D}\n *C   {C}     {B, C, D}\n  D            {A, C}        {B}",
      machine: AFND7, strings: ["001", "1100", "101"],
      dubious: "En la versión de la cátedra la tupla dice que el estado de aceptación es {D}, pero la tabla (*C) y el AFD resultante (C1, C2 y C3 contienen a C) usan {C}. Se cargó {C}.",
      solutionA: "La cadena 001 es aceptada (en la guía solo se construye el árbol de esta cadena); las cadenas 1100 y 101 también son aceptadas.",
      solutionB: "T = {(A,A), (A,B), (A,D), (B,B), (B,D), (C,C), (D,D), (D,B)} y T* = T.\nf(A, λ) = {A,B,D} = C0\nf(C0,0) = {B,C} → {B,C,D} = C1; f(C0,1) = {A,B,C,D} = C2\nf(C1,0) = {C} = C3; f(C1,1) = {A,B,C,D} = C2\nf(C2,0) = {B,C,D} = C1; f(C2,1) = {A,B,C,D} = C2\nf(C3,0) = {C} = C3; f(C3,1) = {B,C,D} = C1\nAFDE7 = ({0, 1}, {C0, C1, C2, C3}, C0, {C1, C2, C3}, f)",
    }),
    conversion({
      number: 8, page: 101, solutionPage: 102, includeEmpty: false,
      statement: "Dado el siguiente AFND-λ, se pide:\na) Construir un árbol de descripciones instantáneas para cada una de las siguientes cadenas: 1000, 111, 1001.\nb) Realizar la conversión del AFND a AFD.\nAFND-λ = ({0, 1}, {p, q, r, s}, p, {q}, f)\nf       0         1        λ\n→p          {q, r}     {r}\n *q   {p}   {p, q}\n  r   {r}              {s}\n  s          {s}",
      machine: AFND8, strings: ["1000", "111", "1001"],
      solutionA: "La cadena 1000 no es aceptada; la cadena 111 sí es aceptada y la cadena 1001 no es aceptada.",
      solutionB: "T = {(p,p), (p,r), (q,q), (r,r), (r,s), (s,s)} y T* = {(p,p), (p,r), (p,s), (q,q), (r,r), (r,s), (s,s)}: se agrega (p,s) por transitividad.\nf(p, λ) = {p,r,s} = C0\nf(C0,0) = {r} → {r,s} = C1; f(C0,1) = {q,r,s} = C2\nf(C1,0) = {r,s} = C1; f(C1,1) = {s} = C3\nf(C2,0) = {p,r} → {p,r,s} = C0; f(C2,1) = {p,q,s} → {p,q,r,s} = C4\nf(C3,0) = ∅; f(C3,1) = {s} = C3\nf(C4,0) = C0; f(C4,1) = C4\nAFDE8 = ({0, 1}, {C0, C1, C2, C3, C4}, C0, {C2, C4}, f)",
      extra: { note: "La guía escribe la definición del AFD con cuatro estados, pero en la tabla y en el desarrollo aparecen C0 a C4 (cinco). Se carga el de cinco estados." },
    }),
    conversion({
      number: 15, page: 71, solutionPage: 72,
      statement: "Dado el siguiente AFND, se pide:\na) Construir un árbol de descripciones instantáneas para cada una de las siguientes cadenas: 010, 1100.\nb) Realizar la conversión del AFND a AFD.\nAFND = ({0, 1}, {A, B, C, D, E}, A, {C, E}, f)\nf       0        1\n→A   {B, E}    {B}\n  B    {C}     {C, D}\n *C    {C}      {B}\n  D    {D}      {D}\n *E    {C}      {D}",
      machine: AFND15, strings: ["010", "1100"],
      solutionA: "Árbol de 010: (A, 010) → (B, 10) y (E, 10); (B, 10) → (C, 0) y (D, 0); (E, 10) → (D, 0); luego (C, λ), (D, λ) y (D, λ). Se reconoce (C es de aceptación).\nÁrbol de 1100: (A, 1100) → (B, 100) → (C, 00) y (D, 00) → (C, 0) y (D, 0) → (C, λ) y (D, λ). Se reconoce.",
      solutionB: "Se aplica el caso 1 del Teorema 2: C0 = {A}; f'(C0,0) = {B,E} = C1; f'(C0,1) = {B} = C2; f'(C1,0) = {C} = C3; f'(C1,1) = {C,D} = C4; f'(C2,0) = {C} = C3; f'(C2,1) = {C,D} = C4; f'(C3,0) = {C} = C3; f'(C3,1) = {B} = C2; f'(C4,0) = {C,D} = C4; f'(C4,1) = {B,D} = C5; f'(C5,0) = {C,D} = C4; f'(C5,1) = {C,D} = C4.\nAFD = ({0, 1}, {C0, C1, C2, C3, C4, C5}, C0, {C1, C3, C4}, f')\nf'      0    1\n→C0   C1   C2\n*C1   C3   C4\n  C2   C3   C4\n*C3   C3   C2\n*C4   C4   C5\n  C5   C4   C4",
    }),
    conversion({
      number: 16, page: 73, solutionPage: 73,
      statement: "Dado el siguiente AFND, se pide:\na) Construir un árbol de descripciones instantáneas para cada una de las siguientes cadenas: aab, cba, abaa.\nb) Realizar la conversión del AFND a AFD.\nAFND = ({a, b, c}, {A, B, C, D}, A, {D}, f)\nf       a        b        c\n→A    {B}     {D}      {D}\n  B   {A, C}  {B, C}   {D}\n  C    {C}     {C}    {C, D}\n *D    {D}     {D}      {D}",
      machine: AFND16, strings: ["aab", "cba", "abaa"],
      solutionA: "Árbol de aab: (A, aab) → (B, ab) → (A, b) y (C, b) → (D, λ) y (C, λ). Se reconoce (D).\nÁrbol de abaa: (A, abaa) → (B, baa) → (B, aa) y (C, aa) → (A, a), (C, a) y (C, a) → (B, λ), (C, λ) y (C, λ). No se reconoce.",
      solutionB: "C0 = {A}; f'(C0,a) = {B} = C1; f'(C0,b) = {D} = C2; f'(C0,c) = {D} = C2; f'(C1,a) = {A,C} = C3; f'(C1,b) = {B,C} = C4; f'(C1,c) = {D} = C2; f'(C2,·) = {D} = C2; f'(C3,a) = {B,C} = C4; f'(C3,b) = {C,D} = C5; f'(C3,c) = {C,D} = C5; f'(C4,a) = {A,C} = C3; f'(C4,b) = {B,C} = C4; f'(C4,c) = {C,D} = C5; f'(C5,·) = {C,D} = C5.\nAFD = ({a, b, c}, {C0, C1, C2, C3, C4, C5}, C0, {C2, C5}, f')",
      extra: { note: "En la guía el alfabeto del AFD resultante figura como {0, 1}: es un error de tipeo, es {a, b, c}." },
    }),
    conversion({
      number: 17, page: 73, solutionPage: 74,
      statement: "Dado el siguiente AFND-λ, se pide:\na) Construir el árbol de descripciones instantáneas para las cadenas: 11221, 122.\nb) Realizar la conversión del AFND-λ a AFD.\nAFND-λ = ({1, 2}, {a, b, c, d}, a, {d}, f)\nf       1        2        λ\n→a   {a, b}             {b}\n  b             {c}      {c}\n  c            {c, d}\n *d    {b}",
      machine: AFND17, strings: ["11221", "122"],
      solutionA: "Los árboles de la guía no incluyen las transiciones λ por simplicidad. Con 11221 las ramas terminan en (c, 1) y (b, λ): ninguna llega al estado de aceptación d con la cadena leída, por lo que no se reconoce. Con 122 una rama termina en (d, λ): se reconoce.",
      solutionB: "T = {(a,a), (a,b), (b,b), (b,c), (c,c), (d,d)} y T* = {(a,a), (a,b), (a,c), (b,b), (b,c), (c,c), (d,d)}.\nf(a, λ) = {a,b,c} = C0\nf'(C0,1) = {a,b} → {a,b,c} = C0; f'(C0,2) = {c,d} = C1\nf'(C1,1) = {b} → {b,c} = C2; f'(C1,2) = {c,d} = C1\nf'(C2,1) = ∅ = C3; f'(C2,2) = {c,d} = C1\nAFD = ({1, 2}, {C0, C1, C2, C3}, C0, {C1}, f')\n→C0: C0, C1   *C1: C2, C1   C2: C3, C1   C3: C3, C3",
    }),
    conversion({
      number: 18, page: 76, solutionPage: 77,
      statement: "Dado el siguiente AFND-λ, se pide:\na) Construir el árbol de descripciones instantáneas para las cadenas: 0101, 0111.\nb) Realizar la conversión del AFND-λ a AFD.\nAFND-λ = ({0, 1}, {A, B, C, D, E}, A, {E}, f)\nf       0         1         λ\n→A   {B}                   {B}\n  B          {C, D}      {C}\n  C                       {B}\n  D  {E, A}\n *E           {E}        {B}",
      machine: AFND18, strings: ["0101", "0111"],
      solutionA: "Con 0101 una rama termina en (E, λ): se reconoce. Con 0111 ninguna rama llega a E con la cadena leída: no se reconoce. (La guía grafica los árboles de 01111 y 0101 sin las transiciones λ.)",
      solutionB: "T = {(A,A), (A,B), (B,B), (B,C), (C,C), (C,B), (D,D), (E,E), (E,B)} y T* = {(A,A), (A,B), (A,C), (B,B), (B,C), (C,C), (C,B), (D,D), (E,E), (E,B), (E,C)}.\nf(A, λ) = {A,B,C} = C0; f'(C0,0) = {B,C} = C1; f'(C0,1) = {B,C,D} = C2; f'(C1,0) = ∅ = C3; f'(C1,1) = C2; f'(C2,0) = {A,B,C,E} = C4; f'(C2,1) = C2; f'(C4,0) = C1; f'(C4,1) = {B,C,D,E} = C5; f'(C5,0) = C4; f'(C5,1) = C5.\nAFD = ({0, 1}, {C0, C1, C2, C3, C4, C5}, C0, {C4, C5}, f')",
      extra: { note: "El texto de la guía menciona la cadena 01111 en la figura 4.40 y 0111 en el enunciado; se usan las cadenas del enunciado." },
    }),
  ],
};
