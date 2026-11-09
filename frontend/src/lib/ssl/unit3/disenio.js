// Unidad 3 · Diseño de AFD (ejercicios 2 a 8 de la guía, págs. 46 a 57). Cada ejercicio de diseño se resuelve en el editor:
// el sandbox prueba todas las cadenas hasta una longitud y muestra contraejemplos. Los autómatas de referencia
// que vienen de una tabla de la guía están marcados "guia"; los que la guía solo dibuja (y describe con palabras)
// son "sandbox": soluciones propuestas por el sandbox, verificadas con tests contra el lenguaje esperado.
import { afFromList, afFromTable } from "../machines/build.js";

const B = ["0", "1"];
const AB = ["a", "b"];

const spec = (alphabet, predicate, params = {}, extra = {}) => ({ kind: "machine-language", machineType: "afd", alphabet, maxLen: extra.maxLen ?? 8, predicate, params, ...extra });
const afd = (alphabet) => ({ type: "afd", alphabet, lockAlphabet: true });

// ---- Referencias de la guía (tablas) ----
export const AFD2A = afFromTable({ name: "AFD2a", alphabet: ["1"], start: "p", accepting: ["q"], rows: [["p", "q"], ["q", "p"]] });
export const AFD2B = afFromTable({ name: "AFD2b", alphabet: ["1"], start: "p", accepting: ["p"], rows: [["p", "q"], ["q", "p"]] });
export const AFD2B2 = afFromTable({ name: "AFD2b", alphabet: ["1"], start: "p", accepting: ["r"], rows: [["p", "q"], ["q", "r"], ["r", "q"]] });
export const AFD3A = afFromTable({ name: "AFD3a", alphabet: AB, start: "p", accepting: ["q"], rows: [["p", "q", "p"], ["q", "p", "q"]] });
export const AFD3B = afFromTable({ name: "AFD3b", alphabet: AB, start: "p", accepting: ["r"], rows: [["p", "q", "p"], ["q", "r", "q"], ["r", "q", "r"]] });

// ---- Soluciones propuestas por el sandbox (la guía solo trae el grafo y la descripción) ----
export const AF4A = afFromList({
  name: "AF4a", alphabet: B, states: ["p", "q", "r", "s", "t", "u", "v", "z", "E"], start: "p", accepting: ["z"],
  transitions: ["p 0 q", "p 1 r", "q 0 s", "q 1 s", "s 0 t", "s 1 t", "t 0 z", "t 1 E", "r 0 u", "r 1 u", "u 0 v", "u 1 v", "v 1 z", "v 0 E", "z 0 E", "z 1 E", "E 0 E", "E 1 E"],
});
export const AFD4B = afFromList({
  name: "AFD4b", alphabet: B, states: ["p", "q", "r", "s", "t", "u", "z", "E"], start: "p", accepting: ["z"],
  transitions: ["p 0 q", "p 1 q", "q 0 r", "q 1 s", "r 0 t", "r 1 E", "s 1 u", "s 0 E", "t 0 z", "t 1 z", "u 0 z", "u 1 z", "z 0 E", "z 1 E", "E 0 E", "E 1 E"],
});
export const AFD4C = afFromList({
  name: "AFD4c", alphabet: B, states: ["p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "m", "z", "E"], start: "p", accepting: ["z"],
  transitions: [
    "p 0 q", "p 1 r", "q 0 s", "q 1 t", "r 0 u", "r 1 v",
    "s 0 w", "s 1 E", "t 0 x", "t 1 E", "u 0 E", "u 1 y", "v 0 E", "v 1 m",
    "w 0 z", "w 1 E", "x 1 z", "x 0 E", "y 0 z", "y 1 E", "m 1 z", "m 0 E",
    "z 0 E", "z 1 E", "E 0 E", "E 1 E",
  ],
});
export const AFD5 = afFromList({
  name: "AFD5", alphabet: AB, states: ["p", "q", "r", "E"], start: "p", accepting: ["q", "r"],
  transitions: ["p a q", "p b r", "q a E", "q b r", "r a q", "r b E", "E a E", "E b E"],
});
export const AFD6A = afFromList({ name: "AFD6a", alphabet: B, states: ["p", "q", "r", "s"], start: "p", accepting: ["s"], transitions: ["p 0 q", "q 0 q", "q 1 r", "r 0 s", "s 0 s"] });
export const AFD6B = afFromList({ name: "AFD6b", alphabet: B, states: ["p", "q", "r", "s", "t"], start: "p", accepting: ["t"], transitions: ["p 0 q", "q 1 r", "r 0 q", "r 1 s", "s 1 t", "t 1 s"] });
export const AFD7A = afFromList({ name: "AFD7a", alphabet: B, states: ["p", "q", "r", "s"], start: "p", accepting: ["r"], transitions: ["p 0 r", "p 1 s", "s 1 q", "q 1 s", "q 0 r"] });
export const AFD7B = afFromList({ name: "AFD7b", alphabet: B, states: ["p", "q", "r", "z"], start: "p", accepting: ["z", "r"], transitions: ["p 0 z", "p 1 q", "q 1 r", "r 0 r"] });
export const AFD7C = afFromList({ name: "AFD7c", alphabet: B, states: ["p", "s", "z"], start: "p", accepting: ["z"], transitions: ["p 0 z", "z 1 s", "s 1 z"] });
export const AFD7D = afFromList({ name: "AFD7d", alphabet: B, states: ["p", "r", "s", "u", "z"], start: "p", accepting: ["s", "z"], transitions: ["p 0 z", "p 1 r", "z 0 u", "z 1 r", "u 0 u", "u 1 r", "r 1 s"] });
export const AFD7E = afFromList({ name: "AFD7e", alphabet: B, states: ["p", "q", "r"], start: "p", accepting: ["r"], transitions: ["p 0 p", "p 1 q", "q 1 r", "r 0 r"] });
export const AFD8 = afFromList({
  name: "AFD8", alphabet: AB, states: ["p", "q", "r", "s", "E"], start: "p", accepting: ["s"],
  transitions: ["p a q", "p b E", "q a r", "q b s", "r a E", "r b s", "s b s", "s a q", "E a E", "E b E"],
});

const guide = (reference, extra = {}) => ({ reference, referenceSource: "guia", ...extra });
const proposed = (reference) => ({ reference, referenceSource: "sandbox", referenceNote: "Solución propuesta por el sandbox: la guía solo trae el dibujo de este autómata (y su descripción con palabras)." });

const TABLE_2A = "f      1\n→p     q\n*q     p";

export const DISENIO = {
  id: "disenio",
  title: "Diseño de AFD",
  exerciseRange: "2 a 8",
  context: "AFD = (ΣE, Q, q0, A, f): ΣE es el alfabeto de entrada, Q el conjunto finito y no vacío de estados, q0 el estado inicial, A ⊆ Q los estados de aceptación y f: Q × ΣE → Q la función de transición, que se muestra como tabla (* marca los estados de aceptación). Cada cadena se procesa con una sucesión de descripciones instantáneas (estado, cadena restante). El estado E es el estado de error: no es de aceptación y se usa para completar el autómata.",
  example: {
    title: "Ejemplo resuelto: ejercicio 2.a, número impar de 1s",
    page: 46,
    statement: "Siendo ΣE = {1}, diseñar un AFD que reconozca cadenas compuestas por un número impar de 1s (unos).",
    machine: { type: "afd", alphabet: ["1"], initial: AFD2A, runExamples: ["111", "11", "1"] },
    steps: [
      { title: "Definición formal", text: "AFD2a = ({1}, {p, q}, p, {q}, f)" },
      { title: "Tabla de la función de transición", text: TABLE_2A },
      { title: "Idea del diseño", text: "Para que la cantidad de 1 sea impar hace falta cambiar de estado. En p se llevan leídos una cantidad par de 1s y en q una cantidad impar. Cuando en p se lee un 1 se pasa a q: si la cadena es un solo 1, termina en q, que es de aceptación. Si en q se lee otro 1 se vuelve a p (par), que no es de aceptación." },
      { title: "Árbol de descripciones instantáneas de α = 111", text: "(p, 111) → (q, 11) → (p, 1) → (q, λ)\nLa cadena 111 es reconocida: termina en q, estado de aceptación." },
      { title: "Ahora en el editor", text: "Debajo del ejemplo podés ejecutar este mismo autómata con tus cadenas en modo manual (paso a paso) o automático, y ver cómo se resaltan el estado actual y la transición usada." },
    ],
  },
  exercises: [
    {
      id: "u3-e2",
      number: 2,
      page: 46,
      solutionPage: 47,
      statement: "Siendo ΣE = {1}, se pide dibujar en el editor:",
      parts: [
        {
          id: "a",
          prompt: "Un AFD que reconozca cadenas compuestas por un número impar de 1s (unos).",
          machine: { ...afd(["1"]), runExamples: ["111", "1", "11"], spec: spec(["1"], "count-parity", { symbol: "1", parity: "odd" }), ...guide(AFD2A) },
          solution: `AFD2a = ({1}, {p, q}, p, {q}, f)\n${TABLE_2A}\nÁrbol de α = 111: (p, 111) → (q, 11) → (p, 1) → (q, λ). La cadena 111 es reconocida.`,
        },
        {
          id: "b",
          prompt: "Un AFD que reconozca cadenas compuestas por un número par de 1s (unos).",
          machine: { ...afd(["1"]), runExamples: ["1111", "11", "111"], spec: spec(["1"], "count-parity", { symbol: "1", parity: "even", emptyOptional: true }), ...guide(AFD2B2, { referenceNote: "Se carga la segunda solución de la guía (la que no acepta λ). La primera es AFD2b = ({1}, {p, q}, p, {p}, f) y también se acepta." }) },
          solution: "AFD2b = ({1}, {p, q}, p, {p}, f)\nf      1\n→*p    q\n  q    p\nÁrbol de α = 1111: (p, 1111) → (q, 111) → (p, 11) → (q, 1) → (p, λ). La cadena 1111 es reconocida.\nAclaración: el estado inicial puede ser también estado final. Este AFD acepta también la cadena vacía y el enunciado no lo indica; un grafo que ajusta mejor es AFD2b = ({1}, {p, q, r}, p, {r}, f) (p →1 q, q →1 r, r →1 q).",
          note: "La cadena vacía queda a tu criterio: la guía muestra una solución que la acepta y otra que no.",
        },
      ],
    },
    {
      id: "u3-e3",
      number: 3,
      page: 48,
      solutionPage: 49,
      statement: "Siendo ΣE = {a, b}, se pide dibujar en el editor:",
      parts: [
        {
          id: "a",
          prompt: "Un AFD que reconozca cadenas compuestas por un número impar de a (aes).",
          machine: { ...afd(AB), runExamples: ["abbaa", "a", "bab"], spec: spec(AB, "count-parity", { symbol: "a", parity: "odd" }), ...guide(AFD3A) },
          solution: "AFD3a = ({a, b}, {p, q}, p, {q}, f)\nf      a   b\n→p     q   p\n*q     p   q\nÁrbol de α = abbaa: (p, abbaa) → (q, bbaa) → (q, baa) → (q, aa) → (p, a) → (q, λ). La cadena abbaa es reconocida.\nCuando lee una b el AFD permanece en el estado en que está, porque eso no cambia la paridad de la cantidad de a leídas.",
        },
        {
          id: "b",
          prompt: "Un AFD que reconozca cadenas compuestas por un número par de a (aes).",
          machine: { ...afd(AB), runExamples: ["abba", "aa", "bab"], spec: spec(AB, "count-parity", { symbol: "a", parity: "even", zeroOptional: true }), ...guide(AFD3B) },
          solution: "AFD3b = ({a, b}, {p, q, r}, p, {r}, f)\nf      a   b\n→p     q   p\n  q    r   q\n*r     q   r\nÁrbol de α = abba: (p, abba) → (q, bba) → (q, ba) → (q, a) → (r, λ). La cadena abba es reconocida.",
          note: "Las cadenas sin ninguna a (λ, b, bb…) quedan a tu criterio: el AFD de la guía no las acepta.",
        },
      ],
    },
    {
      id: "u3-e4",
      number: 4,
      page: 49,
      solutionPage: 50,
      statement: "Diseñar un AFD que reconozca cadenas formadas por 4 bits (ΣE = {0, 1}), para cada una de las siguientes condiciones. Solo se aceptan cadenas de exactamente 4 bits.",
      parts: [
        {
          id: "a",
          prompt: "El primer bit igual al último.",
          machine: { ...afd(B), runExamples: ["0110", "1001", "0101"], spec: spec(B, "bits4-first-last", {}, { maxLen: 6, complete: true }), ...proposed(AF4A) },
          solution: "AF4a = ({0, 1}, {p, q, r, s, t, u, v, z, E}, p, {z}, f)\nComo importa saber si el primer bit es 0 o 1, al leerlo el AFD cambia de estado según sea 0 o 1. El segundo y el tercer bit no importan: con cualquiera se pasa al mismo estado, pero hay que cambiar de estado para “contar” que se leyó un bit. Al leer el cuarto bit, si el primero fue 0 y el cuarto es 0 se va al estado de aceptación z; si el cuarto es 1 se va a E (estado de error: no es de aceptación). El AFD tiene dos caminos por los que acepta: uno si el primer bit es 0 y otro si es 1.",
        },
        {
          id: "b",
          prompt: "El segundo bit igual al tercero.",
          machine: { ...afd(B), runExamples: ["0110", "1001", "0100"], spec: spec(B, "bits4-second-third", {}, { maxLen: 6, complete: true }), ...proposed(AFD4B) },
          solution: "AFD4b = ({0, 1}, {p, q, r, s, t, u, z, E}, p, {z}, f)\nEl primer bit no importa: se pasa siempre al mismo estado (q). Al leer el segundo bit se va a estados distintos porque interesa saber si es 0 o 1. Si el segundo fue 0 y el tercero es 0 se pasa a un estado desde el que, al leer el cuarto bit, se llega a z; si el tercero es 1 se va al estado de error E. Si el segundo fue 1 y el tercero es 1 se sigue; si es 0 se va a E.",
          note: "En el texto de la guía la tupla dice que el estado de aceptación es {u}, pero la explicación habla del estado de aceptación z: el sandbox toma z.",
        },
        {
          id: "c",
          prompt: "Los dos primeros bits iguales a los dos últimos.",
          machine: { ...afd(B), runExamples: ["0101", "1111", "0110"], spec: spec(B, "bits4-two-two", {}, { maxLen: 6, complete: true }), ...proposed(AFD4C) },
          solution: "AFD4c = ({0, 1}, {p, q, r, s, t, u, v, w, x, y, m, z, E}, p, {z}, f)\nAl leer el primer bit se transita a un estado si es 0 y a otro si es 1, y lo mismo con el segundo. Después se comprueba el tercer bit y el cuarto contra esos dos: cualquier diferencia lleva al estado de error E, y si coinciden los cuatro se llega al estado de aceptación z. La guía muestra además otro diseño del mismo AFD4c.",
        },
      ],
    },
    {
      id: "u3-e5",
      number: 5,
      page: 52,
      solutionPage: 52,
      statement: "Construir un AFD que reconozca un lenguaje compuesto por símbolos a y b (ΣE = {a, b}), que excluya del mismo todas aquellas cadenas que contengan las subcadenas aa o bb. Las palabras a ser reconocidas no deben tener una longitud predeterminada.",
      parts: [{
        id: "",
        prompt: "",
        machine: { ...afd(AB), runExamples: ["abab", "ab", "abba"], spec: spec(AB, "avoid-factors", { factors: ["aa", "bb"], emptyOptional: true }, { complete: true }), ...proposed(AFD5) },
        solution: "AFD5 = ({a, b}, {p, q, r, E}, p, {q, r}, f)\nHace falta transitar a estados distintos al leer el primer símbolo para “saber” si se leyó una a o una b. Si el primer símbolo es a y se lee otra a se pasa a E (error); lo mismo con b y b. Después de leer una a se está en q: con una b se pasa a r, con una a a E. Después de leer una b se está en r: con una a se pasa a q, con una b a E.",
        note: "La cadena vacía queda a tu criterio: el AFD de la guía no la acepta (p no es de aceptación).",
      }],
    },
    {
      id: "u3-e6",
      number: 6,
      page: 52,
      solutionPage: 53,
      statement: "Proponer un AFD destinado a aceptar cada uno de los siguientes lenguajes y hacer una descripción alternativa según se indica.",
      dubious: "En el texto extraído se perdieron los exponentes y los ≥ de L1; se reconstruyeron mirando la página.",
      parts: [
        {
          id: "a",
          prompt: "L1 = { 0^{i} 1 0^{j} / i ≥ 1, j ≥ 1 }.  Determinar su expresión regular.",
          machine: { ...afd(B), runExamples: ["0100", "010", "1", "00100"], spec: spec(B, "regex", { regex: "00*100*" }), ...proposed(AFD6A), referenceNote: "Solución propuesta por el sandbox; la guía trae el grafo (AFD6a = ({0, 1}, {p, q, r, s}, p, {s}, f)) y no lo completa con el estado de error." },
          solution: "L1 = L(00*100*)\nAFD6a = ({0, 1}, {p, q, r, s}, p, {s}, f)\nCabe aclarar que no se usó el estado de error E: los autómatas mostrados son parciales y se podrían completar agregando E con las transiciones que correspondan.",
        },
        {
          id: "b",
          prompt: "L2 = L( 01 (01)* 11 (11)* ).  Determinar su expresión algebraica.",
          machine: { ...afd(B), runExamples: ["0111", "010111", "0111111", "011"], spec: spec(B, "regex", { regex: "01(01)*11(11)*" }), ...proposed(AFD6B) },
          solution: "L2 = { (01)^{i} (11)^{j} / i ≥ 1, j ≥ 1 }\nAFD6b = ({0, 1}, {p, q, r, s, t}, p, {t}, f)\nEste autómata también es parcial (sin estado de error).",
        },
      ],
    },
    {
      id: "u3-e7",
      number: 7,
      page: 53,
      solutionPage: 54,
      statement: "Identificar el lenguaje expresado por cada una de las siguientes expresiones regulares y construir el AFD que lo reconozca (grafo y definición formal). En esta notación + es la unión.",
      parts: [
        { id: "a", prompt: "L1 (0 + (11)* 0)", tool: { type: "regex", regex: "0+(11)*0" }, machine: { ...afd(B), runExamples: ["0", "110", "11110", "10"], spec: spec(B, "regex", { regex: "0+(11)*0" }), ...proposed(AFD7A) }, solution: "L = {0, 110, 11110, 1111110, …}\nAFD7a = ({0, 1}, {p, q, r, s}, p, {r}, f)\nSi lee un 0 debe ir al estado de aceptación (la cadena puede ser un solo 0). Si lee como primer símbolo un 1, va a otro estado s, y de allí al leer un 1 pasa a q, desde el cual puede leer un 0 y pasar al estado de aceptación o leer un 1 volviendo a s para leer otro 1: hay que leer “paquetes 11” y terminar siempre con un 0 en el estado de aceptación r." },
        { id: "b", prompt: "L2 (0 + (11) 0*)", tool: { type: "regex", regex: "0+(11)0*" }, machine: { ...afd(B), runExamples: ["0", "11", "1100", "110"], spec: spec(B, "regex", { regex: "0+(11)0*" }), ...proposed(AFD7B) }, solution: "L = {0, 11, 110, 1100, 11000, …}\nAFD7b = ({0, 1}, {p, q, r, z}, p, {z, r}, f)\nSi lee un 0 va al estado de aceptación z. Si lee un 1 pasa a q y, al leer otro 1, al estado r, que es final: hay que leer dos 1 para aceptar. Si en r sigue leyendo 0 permanece en r." },
        { id: "c", prompt: "L3 (0 (11)* + 0)", tool: { type: "regex", regex: "0(11)*+0" }, machine: { ...afd(B), runExamples: ["0", "011", "01111", "01"], spec: spec(B, "regex", { regex: "0(11)*+0" }), ...proposed(AFD7C) }, solution: "L = {0, 011, 01111, 0111111, …}\nAFD7c = ({0, 1}, {p, s, z}, p, {z}, f)\nSi lee un 0 va al estado de aceptación z. Si luego lee un 1 pasa a s, ya que debe aceptar un número par de 1; desde s, al leer otro 1, vuelve a z." },
        { id: "d", prompt: "L4 (0* (11) + 0)", tool: { type: "regex", regex: "0*(11)+0" }, machine: { ...afd(B), runExamples: ["0", "11", "011", "0011"], spec: spec(B, "regex", { regex: "0*(11)+0" }), ...proposed(AFD7D) }, solution: "L = {0, 11, 011, 0011, 00011, …}\nAFD7d = ({0, 1}, {p, r, s, u, z}, p, {s, z}, f)\nSi lee un 0 pasa al estado de aceptación z (la cadena puede ser un solo 0); si sigue leyendo 0 pasa a u. Desde z o u, al leer un 1 va a r y de allí, al leer otro 1, a s (final): las cadenas siempre contienen el par 11." },
        { id: "e", prompt: "L5 (0* (11) 0*)", tool: { type: "regex", regex: "0*(11)0*" }, machine: { ...afd(B), runExamples: ["11", "011", "00011", "0110"], spec: spec(B, "regex", { regex: "0*(11)0*" }), ...proposed(AFD7E) }, solution: "L = {11, 011, 00011, 0011000, 000110, 00001100000, …}\nAFD7e = ({0, 1}, {p, q, r}, p, {r}, f)\nSi lee un 0 permanece en p (cualquier cantidad de 0). Si lee un 1 pasa a q para contar que leyó un 1; desde q, otro 1 lleva a r, de aceptación. En r, los 0 que siguen lo dejan en r." },
      ],
    },
    {
      id: "u3-e8",
      number: 8,
      page: 56,
      solutionPage: 56,
      statement: "Diseñar un AFD que reconozca el lenguaje L ⊆ {a, b}*, cuyas cadenas α, sin longitud fija, satisfagan simultáneamente las siguientes condiciones:\na) Toda cadena α comienza con a y termina con b.\nb) La secuencia de caracteres aaa no debe ser subcadena de α.",
      parts: [{
        id: "",
        prompt: "",
        machine: { ...afd(AB), runExamples: ["aabaab", "ab", "aaab", "abb"], spec: spec(AB, "a-b-no-aaa", {}, { complete: true }), ...proposed(AFD8) },
        solution: "AFD8 = ({a, b}, {p, q, r, s, E}, p, {s}, f)\nEl AFD empieza leyendo una a y pasa a q, para contar la cantidad de a; si en q lee otra a pasa a r, y si lee una tercera a pasa a E (error). Si después de leer una a lee una b pasa a s, que es de aceptación y en el que permanece si sigue leyendo b. Si en s lee una a vuelve a q para contar nuevamente.",
      }],
    },
  ],
};
