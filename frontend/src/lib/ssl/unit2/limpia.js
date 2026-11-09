// Gramática limpia (ejercicios 12 a 15, págs. 15 a 17 y 23) y gramática bien formada (ejercicios 16 a 18, págs. 18 a 20, 23 y 24).
const cleanTool = (grammar) => ({ type: "transform", mode: "clean", grammar });

// Los cuatro datos que pide el procedimiento de limpieza más la gramática limpia resultante.
function cleanParts(grammar, expectedClean, solutions) {
  const field = (id, label, key) => ({ id, label, spec: { kind: "clean-field", field: key, grammar } });
  return [
    { id: "a", prompt: "Reglas innecesarias (las de la forma A := A)", checks: [field("r", "Reglas (por ejemplo A := A) o \"ninguna\"", "unnecessary")], solution: solutions.unnecessary },
    { id: "b", prompt: "Símbolos terminales inaccesibles", checks: [field("r", "Terminales o \"ninguno\"", "inaccessibleTerminals")], solution: solutions.terminals },
    { id: "c", prompt: "Símbolos no terminales inaccesibles", checks: [field("r", "No terminales o \"ninguno\"", "inaccessibleNonterminals")], solution: solutions.nonterminals },
    { id: "d", prompt: "Símbolos superfluos", checks: [field("r", "Símbolos o \"ninguno\"", "superfluous")], solution: solutions.superfluous },
    { id: "e", prompt: "Gramática limpia (escribí las producciones, una por línea o separadas por coma)", checks: [{ id: "g", label: "Producciones de la gramática limpia", spec: { kind: "grammar", expected: expectedClean, maxLen: 7 } }], solution: solutions.clean },
  ];
}

const G12 = { terminals: "0, 1, 2, 3", nonterminals: "S, A, B, C, D, E", axiom: "S", productions: "S := 0A | 1B | 01\nA := A | 1B | 0\nB := 0C | 0E | 10\nC := 1\nE := 0E\nD := 0A | 1B | 0" };
const G13 = { terminals: "0, 1, 2", nonterminals: "S, A, B, C", axiom: "S", productions: "S := 0A | 1 | S\nA := 1B0 | 01\nC := 0 | 1B | 1 | C\nB := 1A | A0 | 1B" };
const G14 = { terminals: "a, b, c", nonterminals: "S, A, B, C, D, E", axiom: "S", productions: "S := aBb | λ\nA := bB | Ca\nB := bA | b | a | bE | B\nC := a | bB | aD\nD := a\nE := aE | E" };
const G15 = { terminals: "0, 1, 2", nonterminals: "Q, R, S, T", axiom: "Q", productions: "Q := 1R0 | λ\nR := 0S1 | 0T | 1\nT := 0R | RT1\nS := 0" };

const L12 = { axiom: "S", productions: "S := 0A | 1B | 01\nA := 1B | 0\nB := 0C | 10\nC := 1" };
const L13 = { axiom: "S", productions: "S := 0A | 1\nA := 1B0 | 01\nB := 1A | A0 | 1B" };
const L14 = { axiom: "S", productions: "S := aBb | λ\nA := bB | Ca\nB := bA | b | a\nC := a | bB | aD\nD := a" };
const L15 = { axiom: "Q", productions: "Q := 1R0 | λ\nR := 0S1 | 0T | 1\nT := 0R | RT1\nS := 0" };

const WF16 = { axiom: "S", productions: "S := AB1 | λ | B1 | A1 | 1\nA := BA | 0A | 0\nB := 0A | 0" };
const WF17 = { axiom: "S", productions: "S := C0 | λ | 0\nC := 1 | 0" };
// La guía llega a C := BB | bBa | ba | bDa | aC | b, pero BB es anulable: C := BB puede derivar λ y por eso falta B := a (de B := aC).
const WF18 = { axiom: "A", productions: "A := bBa | ba\nB := bDa | ba | aC | a | b\nC := BB | bDa | ba | aC | a | b | bBa\nD := a | b" };

const G16 = { terminals: "0, 1", nonterminals: "S, A, B", axiom: "S", productions: "S := AB1 | λ\nA := BA | λ\nB := 0A | λ" };
const G17 = { terminals: "0, 1, 2, 3", nonterminals: "S, A, B, C, D", axiom: "S", productions: "S := C0 | λ | D10\nA := 1C3\nB := B\nC := 1 | λ | 0\nD := 1D" };
const G18 = { terminals: "a, b, c, d", nonterminals: "A, B, C, D", axiom: "A", productions: "A := bBa\nB := bDa | aC | b | λ\nC := BB | A\nD := λ | a | b" };

const wfTool = (grammar) => ({ type: "transform", mode: "wellformed", grammar });
const wfPart = (grammar, expected, solution, extra = {}) => ({ id: "", prompt: "Gramática bien formada (escribí las producciones)", tool: wfTool(grammar), checks: [{ id: "g", label: "Producciones de la gramática bien formada", spec: { kind: "grammar", expected, maxLen: 7 } }], solution, ...extra });

export const LIMPIA = {
  id: "limpia",
  title: "Gramática limpia",
  exerciseRange: "12 a 15",
  context: "Una gramática limpia no tiene reglas innecesarias (A := A), símbolos inaccesibles (terminales o no terminales a los que nunca se llega) ni símbolos superfluos (no terminales que no permiten generar una cadena solo de terminales o λ).",
  tool: cleanTool(G12),
  example: {
    title: "Ejemplo resuelto: ejercicio 12",
    page: 15,
    statement: "G1 = ({0, 1, 2, 3}, {S, A, B, C, D, E}, S, P1)\nP1 = {S := 0A | 1B | 01, A := A | 1B | 0, B := 0C | 0E | 10, C := 1, E := 0E, D := 0A | 1B | 0}",
    steps: [
      { title: "Reglas innecesarias", text: "A := A. Son las reglas donde está el mismo símbolo no terminal a ambos lados de :=." },
      { title: "Símbolos terminales inaccesibles", text: "2 y 3. Si bien están en el alfabeto, nunca intervienen en ninguna derivación porque no aparecen en las producciones." },
      { title: "Símbolos no terminales inaccesibles", text: "D. No se menciona en la parte derecha de ninguna producción." },
      { title: "Símbolos superfluos", text: "E. Son los que no permiten generar una cadena solo de terminales (o vacía): S → 0A → 01B → 010E → 0100E → 01000E… y así se seguiría sucesivamente." },
      { title: "Gramática limpia", text: "Se define de nuevo la gramática eliminando de los alfabetos los símbolos inaccesibles y superfluos, y las producciones que los contienen:\nG1(Limpia) = ({0, 1}, {S, A, B, C}, S, P1L)\nP1L = {S := 0A | 1B | 01, A := 1B | 0, B := 0C | 10, C := 1}" },
    ],
  },
  exercises: [
    {
      id: "u2-e12",
      number: 12,
      page: 15,
      solutionPage: 15,
      statement: "Para la siguiente gramática obtener una gramática limpia equivalente (su definición formal) indicando: reglas innecesarias, símbolos inaccesibles terminales y no terminales y símbolos superfluos, si los hubiera.\nG1 = ({0, 1, 2, 3}, {S, A, B, C, D, E}, S, P1)\nP1 = {S := 0A | 1B | 01, A := A | 1B | 0, B := 0C | 0E | 10, C := 1, E := 0E, D := 0A | 1B | 0}",
      tool: cleanTool(G12),
      parts: cleanParts(G12, L12, { unnecessary: "A := A", terminals: "2, 3", nonterminals: "D", superfluous: "E", clean: "G1(Limpia) = ({0, 1}, {S, A, B, C}, S, P1L)\nP1L = {S := 0A | 1B | 01, A := 1B | 0, B := 0C | 10, C := 1}" }),
    },
    {
      id: "u2-e13",
      number: 13,
      page: 17,
      solutionPage: 23,
      statement: "Aplicar el procedimiento para limpiar la gramática.\nG2 = ({0, 1, 2}, {S, A, B, C}, S, P2)\nP2 = {S := 0A | 1 | S, A := 1B0 | 01, C := 0 | 1B | 1 | C, B := 1A | A0 | 1B}",
      tool: cleanTool(G13),
      parts: cleanParts(G13, L13, { unnecessary: "S := S y C := C", terminals: "2", nonterminals: "C", superfluous: "ninguno", clean: "G13L = ({0, 1}, {S, A, B}, S, P13L)\nP13L = {S := 0A | 1, A := 1B0 | 01, B := 1A | A0 | 1B}" }),
    },
    {
      id: "u2-e14",
      number: 14,
      page: 17,
      solutionPage: 23,
      statement: "Aplicar el procedimiento para limpiar la gramática.\nG3 = ({a, b, c}, {S, A, B, C, D, E}, S, P3)\nP3 = {S := aBb | λ, A := bB | Ca, B := bA | b | a | bE | B, C := a | bB | aD, D := a, E := aE | E}",
      tool: cleanTool(G14),
      parts: cleanParts(G14, L14, { unnecessary: "B := B y E := E", terminals: "c", nonterminals: "ninguno", superfluous: "E", clean: "G14L = ({a, b}, {S, A, B, C, D}, S, P14L)\nP14L = {S := aBb | λ, A := bB | Ca, B := bA | b | a, C := a | bB | aD, D := a}" }),
    },
    {
      id: "u2-e15",
      number: 15,
      page: 17,
      solutionPage: 23,
      statement: "Aplicar el procedimiento para limpiar la gramática.\nG4 = ({0, 1, 2}, {Q, R, S, T}, Q, P4)\nP4 = {Q := 1R0 | λ, R := 0S1 | 0T | 1, T := 0R | RT1, S := 0}",
      tool: cleanTool(G15),
      parts: cleanParts(G15, L15, { unnecessary: "ninguna", terminals: "2", nonterminals: "ninguno", superfluous: "ninguno", clean: "G15L = ({0, 1}, {Q, R, S, T}, Q, P15L)\nP15L = {Q := 1R0 | λ, R := 0S1 | 0T | 1, T := 0R | RT1, S := 0}" }),
    },
  ],
};

export const BIEN_FORMADA = {
  id: "bienformada",
  title: "Gramática bien formada",
  exerciseRange: "16 a 18",
  context: "Una gramática bien formada es limpia y no tiene reglas no generativas (A := λ, con el lado derecho de menor longitud que el izquierdo) ni reglas de redenominación (A := B, un solo no terminal distinto a cada lado). Se conserva S := λ si el axioma deriva λ. Recordá que primero deben estar limpias.",
  tool: wfTool(G16),
  example: {
    title: "Ejemplo resuelto: ejercicio 16",
    page: 18,
    statement: "G1 = ({0}, {S, A, B}, S, P1)\nP1 = {S := AB1 | λ, A := BA | λ, B := 0A | λ}",
    steps: [
      { title: "¿Está limpia?", text: "La gramática ya está limpia." },
      { title: "Reglas no generativas: A := λ", text: "Se reemplaza, en todas las producciones que tengan a A en la parte derecha, A por λ:\nS := B1   A := B   B := 0\nAgregando estas producciones queda: P1' = {S := AB1 | λ | B1, A := BA | B, B := 0A | λ | 0}" },
      { title: "Reglas no generativas: B := λ", text: "S := A1   A := A (se elimina por regla innecesaria)   S := 1\nA := λ: se debe volver a comprobar si hay alguna producción para reemplazar y luego eliminarla.\nQueda: P1'' = {S := AB1 | λ | B1 | A1 | 1, A := BA | B | λ, B := 0A | 0}" },
      { title: "Reglas no generativas: de nuevo A := λ", text: "Para A := λ: S := B1 y S := 1 ya existen; A := B es una regla de redenominación; B := 0 ya existe.\nQueda: P1''' = {S := AB1 | λ | B1 | A1 | 1, A := BA | B, B := 0A | 0}" },
      { title: "Reglas de redenominación: A := B", text: "Es una regla donde hay un solo símbolo no terminal diferente a cada lado de :=. Su lectura dice que A debe producir todo lo que produce B, entonces, si B := 0A | 0, se agregan A := 0A y A := 0." },
      { title: "Gramática bien formada", text: "P1'''' = {S := AB1 | λ | B1 | A1 | 1, A := BA | 0A | 0, B := 0A | 0}" },
    ],
  },
  exercises: [
    {
      id: "u2-e16",
      number: 16,
      page: 18,
      solutionPage: 20,
      statement: "Generar la gramática bien formada equivalente, eliminando, si las hay, reglas no generativas y reglas de redenominación.\nG1 = ({0}, {S, A, B}, S, P1)\nP1 = {S := AB1 | λ, A := BA | λ, B := 0A | λ}",
      dubious: "La guía declara ΣT = {0} pero las producciones usan el 1; el sandbox toma ΣT = {0, 1}, como en su gramática final.",
      parts: [wfPart(G16, WF16, "P1'''' = {S := AB1 | λ | B1 | A1 | 1, A := BA | 0A | 0, B := 0A | 0}")],
    },
    {
      id: "u2-e17",
      number: 17,
      page: 20,
      solutionPage: 23,
      statement: "Generar la gramática bien formada equivalente (recordá limpiarla primero).\nG2 = ({0, 1, 2, 3}, {S, A, B, C, D}, S, P2)\nP2 = {S := C0 | λ | D10, A := 1C3, B := B, C := 1 | λ | 0, D := 1D}",
      parts: [wfPart(G17, WF17, "Reglas innecesarias: B := B. No terminales inaccesibles: A, B. Terminales inaccesibles: 2, 3. Símbolos superfluos: D.\nGramática limpia: G2L = ({0, 1}, {S, C}, S, P2L), P2L = {S := C0 | λ, C := 1 | λ | 0}\nRegla no generativa C := λ: se elimina agregando las producciones que surgen de reemplazar C por λ: P'2L = {S := C0 | λ | 0, C := 1 | 0}\nReglas de redenominación: no hay.\nGramática bien formada: G'2L = ({0, 1}, {S, C}, S, P'2L)")],
    },
    {
      id: "u2-e18",
      number: 18,
      page: 20,
      solutionPage: 23,
      statement: "Generar la gramática bien formada equivalente (recordá limpiarla primero).\nG3 = ({a, b, c, d}, {A, B, C, D}, A, P3)\nP3 = {A := bBa, B := bDa | aC | b | λ, C := BB | A, D := λ | a | b}",
      note: "La solución de la guía (pág. 24) termina en C := BB | bBa | ba | bDa | aC | b y no genera, por ejemplo, baa. Como C := BB es anulable, falta B := a (que sale de B := aC). El sandbox usa la versión completa.",
      parts: [wfPart(G18, WF18, "Reglas innecesarias: no hay. Terminales inaccesibles: c, d.\nSe elimina la regla no generativa B := λ: P'3L = {A := bBa | ba, B := bDa | aC | b, C := BB | A | B, D := λ | a | b}\nSe elimina D := λ: P''3L = {A := bBa | ba, B := bDa | aC | b | ba, C := BB | A | B, D := a | b}\nSe elimina la regla de redenominación C := A y luego C := B.\nGramática bien formada (según la guía): G3BF = ({a, b}, {A, B, C, D}, A, P'''' 3L)\nP'''' 3L = {A := bBa | ba, B := bDa | aC | b | ba, C := BB | bBa | ba | bDa | aC | b, D := a | b}")],
    },
  ],
};
