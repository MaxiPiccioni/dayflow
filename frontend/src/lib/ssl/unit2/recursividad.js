// Eliminación de recursividad por izquierda en un paso (ejercicios 19 a 23, págs. 21, 22 y 24 a 25)
// y formas normales de Chomsky y Greibach (ejercicios 24 a 27, págs. 26 a 29 y 31 a 34).
const lrTool = (grammar) => ({ type: "transform", mode: "leftrec", grammar });
const fncTool = (grammar) => ({ type: "transform", mode: "fnc", grammar });
const fngTool = (grammar) => ({ type: "transform", mode: "fng", grammar });
const lrPart = (grammar, expected, solution, extra = {}) => ({ id: "", prompt: "Gramática sin recursividad por izquierda (escribí las producciones)", tool: lrTool(grammar), checks: [{ id: "g", label: "Producciones resultantes", spec: { kind: "grammar", expected, maxLen: 7, form: "noleftrec" } }], solution, ...extra });

const LR_RULE = "Dada A := Aα₁ | Aα₂ | … | Aαₙ | β₁ | β₂ | … | βₘ\nse transforma en  A := β₁X | β₂X | … | βₘX | β₁ | β₂ | … | βₘ\ny  X := α₁X | α₂X | … | αₙX | α₁ | α₂ | … | αₙ";

const G19 = { terminals: "a, b", nonterminals: "P, Q, R", axiom: "P", productions: "P := abP | aQ\nQ := a | bR\nR := Ra | b" };
const G20 = { terminals: "a, b, c", nonterminals: "S, A, B, C, D", axiom: "S", productions: "S := AB | c\nA := aC\nB := aD\nC := Ca | Cab | b\nD := b" };
const G21 = { terminals: "a, b, c", nonterminals: "S, A, B", axiom: "S", productions: "S := aAb\nA := aB | a | Ac\nB := c" };
const G22 = { terminals: "a, b", nonterminals: "M, N, P", axiom: "M", productions: "M := Ma | aP | b\nN := aP | a\nP := b | aN | Pb" };
const G23 = { terminals: "a, b", nonterminals: "M, P", axiom: "M", productions: "M := Ma | b\nP := Mb | b" };

const R19 = { axiom: "P", productions: "P := abP | aQ\nQ := a | bR\nR := bX | b\nX := aX | a" };
const R20 = { axiom: "S", productions: "S := AB | c\nA := aC\nB := aD\nC := bX | b\nX := aX | abX | a | ab\nD := b" };
const R21 = { axiom: "S", productions: "S := aAb\nA := aB | a | aBX | aX\nX := c | cX\nB := c" };
const R22 = { axiom: "M", productions: "M := aPX | bX | aP | b\nX := aX | a\nN := aP | a\nP := bY | aNY | b | aN\nY := bY | b" };
const R23 = { axiom: "M", productions: "M := bX | b\nX := aX | a\nP := Mb | b" };

export const RECURSIVIDAD = {
  id: "recursividad",
  title: "Recursividad por izquierda",
  exerciseRange: "19 a 23",
  context: "Una producción es recursiva por izquierda si su parte derecha empieza con el mismo no terminal de la izquierda (A := Aα). Se elimina agregando un no terminal nuevo X, como en la guía (X, Y, Z…).",
  tool: lrTool(G19),
  example: {
    title: "Ejemplo resuelto: ejercicio 19",
    page: 21,
    statement: "G1 = ({a, b}, {P, Q, R}, P, P1)\nP1 = {P := abP | aQ, Q := a | bR, R := Ra | b}",
    steps: [
      { title: "El procedimiento", text: LR_RULE },
      { title: "Identificar α y β", text: "La producción recursiva por izquierda es R := Ra, de forma que α = a y β = b." },
      { title: "Reescribir", text: "R := Ra | b se reescribe como R := bX | b  y  X := aX | a." },
      { title: "Gramática resultante", text: "G1 = ({a, b}, {P, Q, R, X}, P, P1')\nP1' = {P := abP | aQ, Q := a | bR, R := bX | b, X := aX | a}" },
    ],
  },
  exercises: [
    { id: "u2-e19", number: 19, page: 21, solutionPage: 21, statement: "Eliminar la recursividad por izquierda.\nG1 = ({a, b}, {P, Q, R}, P, P1)\nP1 = {P := abP | aQ, Q := a | bR, R := Ra | b}", parts: [lrPart(G19, R19, "P1' = {P := abP | aQ, Q := a | bR, R := bX | b, X := aX | a}")] },
    { id: "u2-e20", number: 20, page: 22, solutionPage: 24, statement: "Eliminar la recursividad por izquierda.\nG2 = ({a, b, c}, {S, A, B, C, D}, S, P2)\nP2 = {S := AB | c, A := aC, B := aD, C := Ca | Cab | b, D := b}", parts: [lrPart(G20, R20, "Reglas recursivas (por izquierda): C := Ca | Cab. Se agrega el no terminal X:\nC := bX | b\nX := aX | abX | a | ab\nP'2 = {S := AB | c, A := aC, B := aD, C := bX | b, X := aX | abX | a | ab, D := b}")] },
    { id: "u2-e21", number: 21, page: 22, solutionPage: 24, statement: "Eliminar la recursividad por izquierda.\nG3 = ({a, b, c}, {S, A, B}, S, P3)\nP3 = {S := aAb, A := aB | a | Ac, B := c}", parts: [lrPart(G21, R21, "Regla recursiva: A := Ac. Se agrega el no terminal X:\nA := aBX | aX | aB | a\nX := cX | c\nP'3 = {S := aAb, A := aB | a | aBX | aX, X := c | cX, B := c}")] },
    { id: "u2-e22", number: 22, page: 22, solutionPage: 25, statement: "Eliminar la recursividad por izquierda (hay dos reglas recursivas: usá un no terminal nuevo para cada una).\nG4 = ({a, b}, {M, N, P}, M, P4)\nP4 = {M := Ma | aP | b, N := aP | a, P := b | aN | Pb}", parts: [lrPart(G22, R22, "Regla recursiva M := Ma: se agrega X.  M := aPX | bX | aP | b,  X := aX | a\nRegla recursiva P := Pb: se agrega Y.  P := bY | aNY | b | aN,  Y := bY | b\nP'4 = {M := aPX | bX | aP | b, X := aX | a, N := aP | a, P := bY | aNY | b | aN, Y := bY | b}")] },
    {
      id: "u2-e23",
      number: 23,
      page: 22,
      solutionPage: 25,
      statement: "Eliminar la recursividad por izquierda.\nG5 = ({a, b}, {M, P}, M, P5)\nP5 = {M := Ma | b, P := Mb | b}",
      dubious: "El enunciado de la pág. 22 dice M := Pa | b (recursividad en más de un paso), pero la solución de la pág. 25 resuelve M := Ma | b. Se carga la versión de la solución.",
      parts: [lrPart(G23, R23, "Regla recursiva M := Ma: se agrega X.  M := bX | b,  X := aX | a\nP'5 = {M := bX | b, X := aX | a, P := Mb | b}")],
    },
  ],
};

const fncPart = (id, prompt, grammar, expected, solution) => ({ id, prompt, tool: fncTool(grammar), checks: [{ id: "g", label: "Producciones en Forma Normal de Chomsky", spec: { kind: "grammar", expected, maxLen: 7, form: "fnc" } }], solution });
const fngPart = (grammar, expected, solution, extra = {}) => ({ id: "", prompt: "Gramática en Forma Normal de Greibach (escribí las producciones)", tool: fngTool(grammar), checks: [{ id: "g", label: "Producciones en Forma Normal de Greibach", spec: { kind: "grammar", expected, maxLen: 7, form: "fng" } }], solution, ...extra });

const C1 = { terminals: "0, 1", nonterminals: "S, A, B, C", axiom: "S", productions: "S := 0A | 1B | 01\nA := 1B | 0\nB := 0C | 10\nC := 1" };
const C13 = { terminals: "0, 1", nonterminals: "S, A, B", axiom: "S", productions: "S := 0A | 1\nA := 1B0 | 01\nB := 1A | A0 | 1B" };
const C14 = { terminals: "a, b", nonterminals: "S, A, B, C, D", axiom: "S", productions: "S := aBb | λ\nA := bB | Ca\nB := bA | b | a\nC := a | bB | aD\nD := a" };
const C15 = { terminals: "0, 1", nonterminals: "Q, R, S, T", axiom: "Q", productions: "Q := 1R0 | λ\nR := 0S1 | 0T | 1\nT := 0R | RT1\nS := 0" };
const N1 = { axiom: "S", productions: "S := XA | YB | XY\nA := YB | 0\nB := XC | YX\nC := 1\nX := 0\nY := 1" };
const N13 = { axiom: "S", productions: "S := XA | 1\nA := ZX | XY\nZ := YB\nB := YA | AX | YB\nX := 0\nY := 1" };
const N14 = { axiom: "S", productions: "S := XZ | λ\nX := a\nY := b\nZ := BY\nA := YB | CX\nB := YA | b | a\nC := a | YB | XD\nD := a" };
const N15 = { axiom: "Q", productions: "Q := XZ | λ\nX := 1\nY := 0\nZ := RY\nW := SX\nV := TX\nR := YW | YT | 1\nT := YR | RV\nS := 0" };

const H25 = { terminals: "0, 1", nonterminals: "S, A, B, C", axiom: "S", productions: "S := A0 | 1 | C1\nA := 0B | 1\nB := A0 | 0\nC := 1" };
const H26 = { terminals: "0, 1", nonterminals: "S, A, B, C, D", axiom: "S", productions: "S := DA | 1\nA := B0 | 1\nB := B1 | 0\nC := 0\nD := C0 | 01" };
const H27 = { terminals: "a, b, c", nonterminals: "S, A, B, C, D, E, F", axiom: "S", productions: "S := Aa | bB | bC\nA := Da | D\nB := Ba | b | a | B\nC := a | Db | bE\nD := a\nE := bF\nF := aF" };
const F25 = { axiom: "S", productions: "S := 1 | 0BX | 1X | 1Y\nA := 0B | 1\nB := 0BX | 1X | 0\nC := 1\nX := 0\nY := 1" };
const F26 = { axiom: "S", productions: "S := 0YA | 0ZA | 1\nY := 0\nZ := 1\nA := 0Y | 0XY | 1\nB := 0 | 0X\nX := 1 | 1X\nC := 0\nD := 0Y | 0Z" };
const F27 = { axiom: "S", productions: "S := aYY | aY | bB | bC\nA := aY | a\nB := b | a | bX | aX\nX := a | aX\nY := a\nZ := b\nC := a | aZ\nD := a" };

export const FORMAS_NORMALES = {
  id: "formasnormales",
  title: "Formas normales",
  exerciseRange: "24 a 27",
  context: "Forma Normal de Chomsky (FNC): las producciones son A := BC, A := a o S := λ (con A, B, C no terminales y a terminal). Forma Normal de Greibach (FNG): A := aη o S := λ, con a terminal y η en ΣN*. La gramática debe ser bien formada y, para Greibach, sin recursividad por izquierda.",
  tool: fncTool(C1),
  example: {
    title: "Ejemplo resuelto: la gramática G1 (limpia y bien formada) en FNC",
    page: 26,
    statement: "G1(Limpia) = ({0, 1}, {S, A, B, C}, S, P1L)\nP1L = {S := 0A | 1B | 01, A := 1B | 0, B := 0C | 10, C := 1}\nEsta gramática está limpia y bien formada.",
    steps: [
      { title: "Qué se busca", text: "En la FNC las producciones tienen la forma A := BC, A := a, S := λ (con S, A, B, C ∈ ΣN y a ∈ ΣT). Se analiza producción por producción." },
      { title: "S := 0A", text: "No está en FNC: se agrega el no terminal X := 0 y se convierte en S := XA." },
      { title: "S := 1B", text: "No está en FNC: se agrega Y := 1 y se convierte en S := YB." },
      { title: "S := 01", text: "No está en FNC: se convierte en S := XY." },
      { title: "El resto", text: "A := 1B → A := YB.  A := 0 ya está en FNC.  B := 0C → B := XC.  B := 10 → B := YX.  C := 1 ya está en FNC." },
      { title: "Gramática en FNC", text: "G1(FNC) = ({0, 1}, {S, A, B, C, X, Y}, S, P1')\nP1' = {S := XA | YB | XY, A := YB | 0, B := XC | YX, C := 1, X := 0, Y := 1}" },
      { title: "Derivar antes y después", text: "ANTES:  S → 0A → 01B → 0110   y   S → 1B → 10C → 101\nDESPUÉS:  S → XA → 0A → 0YB → 01B → 01YX → 011X → 0110   y   S → YB → YXC → 1XC → 10C → 101" },
    ],
  },
  exercises: [
    {
      id: "u2-e24",
      number: 24,
      page: 26,
      solutionPage: 31,
      statement: "A las cuatro gramáticas obtenidas de los ejercicios de gramática limpia (12, 13, 14 y 15), llevarlas a gramáticas bien formadas, expresarlas en Forma Normal de Chomsky y derivar dos palabras con la gramática antes y después de haber aplicado la FNC (la herramienta muestra las derivaciones).",
      note: "La guía separa las partes derechas largas de izquierda a derecha en el ejercicio 13 y de derecha a izquierda en el 14 y el 15. El sandbox siempre lo hace de derecha a izquierda; si tu resultado es equivalente y está en FNC, se acepta.",
      parts: [
        fncPart("a", "G1 (ejercicio 12 limpio): P1L = {S := 0A | 1B | 01, A := 1B | 0, B := 0C | 10, C := 1}", C1, N1, "P1' = {S := XA | YB | XY, A := YB | 0, B := XC | YX, C := 1, X := 0, Y := 1}"),
        fncPart("b", "G13L (ejercicio 13 limpio): P13L = {S := 0A | 1, A := 1B0 | 01, B := 1A | A0 | 1B}", C13, N13, "Reglas no generativas: no tiene. Reglas de redenominación: no tiene. La gramática ya está bien formada.\nAntes de la FNC: S → 0A → 001   y   S → 0A → 01B0 → 01A00 → 010100\nP13FNC = {S := XA | 1, A := ZX | XY, Z := YB, B := YA | AX | YB, X := 0, Y := 1}\nDespués: S → XA → 0A → 0XY → 00Y → 001   y   S → XA → 0A → 0ZX → 0YBX → 01BX → 01AXX → 01XYXX → 010YXX → 0101XX → 01010X → 010100"),
        fncPart("c", "G14L (ejercicio 14 limpio): P14L = {S := aBb | λ, A := bB | Ca, B := bA | b | a, C := a | bB | aD, D := a}", C14, N14, "Reglas no generativas y de redenominación: no tiene. Ya está bien formada.\nAntes: S → aBb → abAb → abbBb → abbab   y   S → aBb → abb\nP14FNC = {S := XZ | λ, X := a, Y := b, Z := BY, A := YB | CX, B := YA | b | a, C := a | YB | XD, D := a}\nDespués: S → XZ → aZ → aBY → aYAY → abAY → abYBY → abbBY → abbaY → abbab   y   S → XZ → aZ → aBY → abY → abb"),
        fncPart("d", "G15L (ejercicio 15 limpio): P15L = {Q := 1R0 | λ, R := 0S1 | 0T | 1, T := 0R | RT1, S := 0}", C15, N15, "Reglas no generativas y de redenominación: no tiene. Ya está bien formada.\nAntes: Q → 1R0 → 10T0 → 100R0 → 10010   y   Q → 1R0 → 10T0 → 10RT10 → 101T10 → 1010R10 → 1010110\nP15FNC = {Q := XZ | λ, X := 1, Y := 0, Z := RY, W := SX, V := TX, R := YW | YT | 1, T := YR | RV, S := 0}\nDespués: Q → XZ → 1Z → 1RY → 1YWY → 10WY → 10SXY → 100XY → 1001Y → 10010"),
      ],
    },
    {
      id: "u2-e25",
      number: 25,
      page: 27,
      solutionPage: 28,
      statement: "Expresar la siguiente gramática en Forma Normal de Greibach. En la FNG las producciones tienen la forma A := aη, S := λ, con A, S ∈ ΣN, a ∈ ΣT y η ∈ ΣN*. La gramática debe ser bien formada y sin recursividad por izquierda.\nG1 = ({0, 1}, {S, A, B, C}, S, P1)\nP1 = {S := A0 | 1 | C1, A := 0B | 1, B := A0 | 0, C := 1}",
      parts: [fngPart(H25, F25, "S := A0 no está en FNG: se sustituye A por sus partes derechas (0B | 1): S := 0B0 y S := 10; como aún no están en FNG se agrega X := 0 y quedan S := 0BX y S := 1X.\nS := 1 está en FNG.\nS := C1: se reemplaza C por 1: S := 11; se agrega Y := 1 y queda S := 1Y.\nA := 0B y A := 1 están en FNG.\nB := A0: se sustituye A: B := 0B0 y B := 10; con X := 0 quedan B := 0BX y B := 1X. B := 0 y C := 1 están en FNG.\nG1' = ({0, 1}, {S, A, B, C, X, Y}, S, P1')\nP1' = {S := 1 | 0BX | 1X | 1Y, A := 0B | 1, B := 0BX | 1X | 0, C := 1, X := 0, Y := 1}")],
    },
    {
      id: "u2-e26",
      number: 26,
      page: 29,
      solutionPage: 32,
      statement: "Expresar la siguiente gramática en Forma Normal de Greibach.\nG2 = ({0, 1}, {S, A, B, C, D}, S, P2)\nP2 = {S := DA | 1, A := B0 | 1, B := B1 | 0, C := 0, D := C0 | 01}",
      parts: [fngPart(H26, F26, "La gramática está limpia y bien formada pero con recursividad por izquierda: B := B1. Se levanta: B := 0 | 0X, X := 1 | 1X.\nP'2 = {S := DA | 1, A := B0 | 1, B := 0 | 0X, X := 1 | 1X, C := 0, D := C0 | 01}\nS := DA: se reemplaza D por sus partes derechas; C0A → 00A, con Y := 0: S := 0YA; 01A, con Z := 1: S := 0ZA.\nA := B0: se reemplaza B y con Y := 0: A := 0Y y A := 0XY.\nD := C0 → D := 0Y;  D := 01 → D := 0Z.\nP'2 = {S := 0YA | 0ZA | 1, Y := 0, Z := 1, A := 0Y | 0XY | 1, B := 0 | 0X, X := 1 | 1X, C := 0, D := 0Y | 0Z}")],
    },
    {
      id: "u2-e27",
      number: 27,
      page: 29,
      solutionPage: 33,
      statement: "Expresar la siguiente gramática en Forma Normal de Greibach (primero hay que limpiarla, bien formarla y levantar la recursividad por izquierda).\nG3 = ({a, b, c}, {S, A, B, C, D, E, F}, S, P3)\nP3 = {S := Aa | bB | bC, A := Da | D, B := Ba | b | a | B, C := a | Db | bE, D := a, E := bF, F := aF}",
      parts: [fngPart(H27, F27, "La gramática no está limpia. Reglas innecesarias: B := B. Terminales inaccesibles: c. Símbolos superfluos: E, F.\nGramática limpia: P'3 = {S := Aa | bB | bC, A := Da | D, B := Ba | b | a, C := a | Db, D := a}\nNo está bien formada: se elimina la regla de redenominación A := D → A := Da | a.\nRecursividad por izquierda B := Ba: B := b | a | bX | aX, X := a | aX.\nFNG: S := aYY | aY | bB | bC, A := aY | a, B := b | a | bX | aX, X := a | aX, Y := a, Z := b, C := a | aZ, D := a")],
    },
  ],
};
