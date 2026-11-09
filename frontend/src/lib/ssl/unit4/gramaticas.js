// Unidad 4 · Autómatas y gramáticas regulares (ejercicios 9 a 13 y 19 a 24; guía págs. 70 a 71, 79 a 81 y 103 a 106).
import { afFromList } from "../machines/build.js";
import { nfaFromGrammarText } from "../machines/constructions.js";

const B = ["0", "1"];

// ---- Gramáticas dadas (ejercicios 9, 10, 11, 19, 20, 21) ----
const G9 = { axiom: "D", productions: "D := 0E | 1\nE := 0 | 1E | 1" };
const G10 = { axiom: "S", productions: "S := xX\nX := yY\nY := xX | y" };
const G11 = { axiom: "S", productions: "S := xN | x\nN := yM | y\nM := zN | z" };
const G19 = { axiom: "S", productions: "S := λ | xX | yY\nY := yY | x\nX := xX | y" };
const G20 = { axiom: "A", productions: "A := 0A | 1B\nB := 0C | 0D\nC := 0 | 1B | 1D\nD := 1" };
const G21 = { axiom: "A", productions: "A := 0B | 1A\nB := 0B | 1C\nC := 0B | 1D | 1\nD := 0E | 0\nE := 0D | 0 | 1C" };

// ---- Autómatas dados (ejercicios 12, 13, 22, 23, 24): el grafo es un dibujo; se reconstruyeron a partir de la gramática de la solución ----
export const AF12 = afFromList({ name: "AFD", alphabet: B, states: ["A", "B", "C", "F"], start: "A", accepting: ["F"], transitions: ["A 1 A", "A 0 B", "B 0 B", "B 1 C", "C 1 F", "C 0 B", "F 0 B", "F 1 A"] });
export const AF13 = afFromList({ name: "AFD", alphabet: B, states: ["A", "B", "C", "D", "F"], start: "A", accepting: ["F"], transitions: ["A 0 A", "A 1 B", "B 1 B", "B 0 C", "C 0 C", "C 1 D", "D 0 D", "D 1 F", "F 0 F", "F 1 F"] });
export const AF22 = afFromList({ name: "AFD", alphabet: B, states: ["A", "B", "C", "F"], start: "A", accepting: ["F"], transitions: ["A 0 B", "A 1 A", "B 0 C", "B 1 B", "C 0 F", "C 1 C", "F 0 A", "F 1 F"] });
export const AF23 = afFromList({ type: "afnd", name: "AFND", alphabet: ["a", "b"], states: ["A", "B", "C", "F"], start: "A", accepting: ["F"], transitions: ["A a B", "A b F", "B a B", "B b C", "C a F", "C b F", "C b C", "F b A", "F a C"] });
export const AF24 = afFromList({ type: "afnd", name: "AFND", alphabet: B, states: ["A", "B", "C"], start: "A", accepting: ["B"], transitions: ["A 0 A", "A 0 B", "A 1 B", "B 0 B", "B 1 C", "C 0 A", "C 1 B"] });

const lang = (grammar, alphabet) => ({ kind: "machine-language", machineType: "afnd", alphabet, maxLen: 7, predicate: "grammar", params: { grammar, maxLen: 7 } });

// Ejercicios "definir el AF a partir de la gramática".
function toAutomaton({ number, page, solutionPage, grammar, alphabet, solution, source = "sandbox", note }) {
  const text = grammar.productions;
  return {
    id: `u4-e${number}`,
    number,
    page,
    solutionPage,
    statement: `Definir el autómata finito correspondiente, que reconozca el mismo lenguaje que genera la siguiente gramática regular:\nG = ({${alphabet.join(", ")}}, {${[...new Set(text.match(/^[A-Z]/gm))].join(", ")}}, ${grammar.axiom}, P)\nP = {${text.split("\n").map((l) => l.replace(" := ", ":= ")).join(", ")}}`,
    ...(note ? { note } : {}),
    parts: [{
      id: "",
      prompt: "Dibujá en el editor el autómata finito (agregá el estado de aceptación nuevo, F).",
      machine: {
        type: "afnd",
        alphabet,
        lockAlphabet: true,
        runExamples: [],
        spec: lang(grammar, alphabet),
        reference: nfaFromGrammarText(grammar),
        referenceSource: source,
        referenceNote: source === "guia" ? "Autómata de la guía." : "Solución propuesta por el sandbox: la guía trae el grafo (y la definición formal) del autómata.",
      },
      solution,
    }],
  };
}

// Ejercicios "definir la gramática a partir del AF".
function toGrammar({ number, page, solutionPage, machine, expected, solution, note, dubious }) {
  return {
    id: `u4-e${number}`,
    number,
    page,
    solutionPage,
    statement: "Definir la gramática regular correspondiente al siguiente autómata finito (el grafo está en el editor; mirá su tabla y su definición formal):",
    ...(note ? { note } : {}),
    ...(dubious ? { dubious } : {}),
    parts: [{
      id: "",
      prompt: "Escribí las producciones de la gramática regular (una por línea).",
      machine: { type: machine.type, initial: machine, readOnly: true, lockAlphabet: true, runExamples: [] },
      checks: [{ id: "g", label: "Producciones", spec: { kind: "grammar", expected, maxLen: 7 } }],
      solution,
    }],
  };
}

export const GRAMATICAS_AF = {
  id: "gramaticas",
  title: "Autómatas y gramáticas regulares",
  exerciseRange: "9 a 13 y 19 a 24",
  context: "Del autómata a la gramática: ΣT = ΣE, ΣN = Q, y por cada f(X, a) = Y la regla X := aY; si Y es de aceptación, además X := a. De la gramática al autómata: ΣE = ΣT, Q = ΣN más un estado de aceptación nuevo F; por cada X := aY hay f(X, a) = Y y por cada X := a hay f(X, a) = F (y X := λ se representa con una transición λ hacia F).",
  example: {
    title: "Ejemplo resuelto: del autómata a la gramática (ejercicio 12)",
    page: 106,
    statement: "AFD = ({0, 1}, {A, B, C, F}, A, {F}, f)  (el grafo está en el editor)",
    machine: { type: "afd", initial: AF12, runExamples: ["011", "1011", "00"] },
    steps: [
      { title: "ΣT y ΣN", text: "ΣT de la gramática = ΣE del AFD = {0, 1}. ΣN = Q = {A, B, C, F}. El axioma es el estado inicial A." },
      { title: "Una regla por transición", text: "Por cada f(X, a) = Y se escribe X := aY:\nA := 1A | 0B   B := 0B | 1C   C := 1F | 0B   F := 0B | 1A" },
      { title: "Transiciones al estado de aceptación", text: "Como F es de aceptación, cada transición hacia F genera además una regla con solo el terminal: f(C, 1) = F da C := 1F y también C := 1." },
      { title: "Gramática", text: "G12 = ({0, 1}, {A, B, C, F}, A, P12)\nP12 = {A := 1A | 0B, B := 0B | 1C, C := 1F | 1 | 0B, F := 0B | 1A}" },
    ],
  },
  exercises: [
    toAutomaton({ number: 9, page: 70, solutionPage: 104, grammar: G9, alphabet: B, source: "guia", solution: "AF9 = ({0, 1}, {D, E, F}, D, {F}, f)\nf(D,0) = E   f(D,1) = F   f(E,0) = F   f(E,1) = E   f(E,1) = F\n(Por D := 0E | 1 y E := 0 | 1E | 1; F es el estado de aceptación nuevo.)" }),
    toAutomaton({ number: 10, page: 70, solutionPage: 104, grammar: G10, alphabet: ["x", "y"], solution: "AF10 = ({x, y}, {S, X, Y, F}, S, {F}, f)\nf(S,x) = X   f(X,y) = Y   f(Y,x) = X   f(Y,y) = F" }),
    toAutomaton({ number: 11, page: 71, solutionPage: 105, grammar: G11, alphabet: ["x", "y", "z"], solution: "AF = ({x, y, z}, {S, N, M, F}, S, {F}, f)\nf(S,x) = N y F   f(N,y) = M y F   f(M,z) = N y F" }),
    {
      id: "u4-e12",
      ...toGrammar({
        number: 12, page: 71, solutionPage: 106, machine: AF12,
        expected: { axiom: "A", productions: "A := 1A | 0B\nB := 0B | 1C\nC := 1F | 1 | 0B\nF := 0B | 1A" },
        solution: "G12 = ({0, 1}, {A, B, C, F}, A, P12)\nP12 = {A := 1A | 0B, B := 0B | 1C, C := 1F | 1 | 0B, F := 0B | 1A}",
        dubious: "El grafo de este ejercicio es un dibujo: el autómata cargado se reconstruyó a partir de la gramática de la solución.",
      }),
    },
    {
      id: "u4-e13",
      ...toGrammar({
        number: 13, page: 71, solutionPage: 106, machine: AF13,
        expected: { axiom: "A", productions: "A := 0A | 1B\nB := 1B | 0C\nC := 0C | 1D\nD := 0D | 1F | 1\nF := 0F | 1F | 0 | 1" },
        solution: "G13 = ({0, 1}, {A, B, C, D, F}, A, P13)\nP13 = {A := 0A | 1B, B := 1B | 0C, C := 0C | 1D, D := 0D | 1F | 1, F := 0F | 1F | 0 | 1}",
        dubious: "El grafo de este ejercicio es un dibujo: el autómata cargado se reconstruyó a partir de la gramática de la solución.",
      }),
    },
    toAutomaton({ number: 19, page: 79, solutionPage: 79, grammar: G19, alphabet: ["x", "y"], solution: "AFND-λ = ({x, y}, {S, X, Y, F}, S, {F}, f)\nPor S := λ hay una transición λ de S a F; S := xX y S := yY dan f(S,x) = X y f(S,y) = Y; X := xX | y da f(X,x) = X y f(X,y) = F; Y := yY | x da f(Y,y) = Y y f(Y,x) = F.", note: "Este autómata tiene una transición λ: usá un AFND (en el editor, λ se escribe lambda o λ)." }),
    toAutomaton({ number: 20, page: 79, solutionPage: 79, grammar: G20, alphabet: B, solution: "AFND = ({0, 1}, {A, B, C, D, F}, A, {F}, f)\nA := 0A | 1B → f(A,0) = A, f(A,1) = B; B := 0C | 0D → f(B,0) = {C, D}; C := 0 | 1B | 1D → f(C,0) = F, f(C,1) = {B, D}; D := 1 → f(D,1) = F." }),
    toAutomaton({ number: 21, page: 80, solutionPage: 80, grammar: G21, alphabet: B, solution: "AFND = ({0, 1}, {A, B, C, D, E, F}, A, {F}, f)\nA := 0B | 1A; B := 0B | 1C; C := 0B | 1D | 1; D := 0E | 0; E := 0D | 0 | 1C; los terminales solos (C := 1, D := 0, E := 0) van a F.", note: "En el texto de la guía el conjunto de producciones de este ejercicio no cierra la llave final; se tomó como P3 = {A:=0B|1A, B:=0B|1C, C:=0B|1D|1, D:=0E|0, E:=0D|0|1C}." }),
    {
      id: "u4-e22",
      ...toGrammar({
        number: 22, page: 80, solutionPage: 80, machine: AF22,
        expected: { axiom: "A", productions: "A := 0B | 1A\nB := 0C | 1B\nC := 0F | 1C | 0\nF := 0A | 1F | 1" },
        solution: "G1 = ({0, 1}, {A, B, C, F}, A, P1)\nP1 = {A := 0B | 1A, B := 0C | 1B, C := 0F | 1C | 0, F := 0A | 1F | 1}",
        dubious: "El grafo de este ejercicio es un dibujo: el autómata cargado se reconstruyó a partir de la gramática de la solución.",
      }),
    },
    {
      id: "u4-e23",
      ...toGrammar({
        number: 23, page: 80, solutionPage: 81, machine: AF23,
        expected: { axiom: "A", productions: "A := aB | bF | b\nB := aB | bC\nC := aF | bF | bC | a | b\nF := bA | aC" },
        solution: "G2 = ({a, b}, {A, B, C, F}, A, P2)\nP2 = {A := aB | bF | b, B := aB | bC, C := aF | bF | bC | a | b, F := bA | aC}",
        dubious: "El grafo de este ejercicio es un dibujo: el autómata cargado se reconstruyó a partir de la gramática de la solución. Es un AFND (C tiene dos transiciones con b).",
      }),
    },
    {
      id: "u4-e24",
      ...toGrammar({
        number: 24, page: 81, solutionPage: 81, machine: AF24,
        expected: { axiom: "A", productions: "A := 0A | 0B | 1B | 0 | 1\nB := 0B | 1C | 0\nC := 0A | 1B | 1" },
        solution: "G3 = ({0, 1}, {A, B, C}, A, P3)\nP3 = {A := 0A | 0B | 1B | 0 | 1, B := 0B | 1C | 0, C := 0A | 1B | 1}",
        dubious: "El grafo de este ejercicio es un dibujo: el autómata cargado se reconstruyó a partir de la gramática de la solución. Es un AFND (A tiene dos transiciones con 0).",
      }),
    },
  ],
};
