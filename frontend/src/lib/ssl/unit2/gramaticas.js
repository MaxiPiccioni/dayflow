// Derivaciones y tipos de gramáticas: ejercicios 6 a 11 de la guía (págs. 7 a 14).
const G1 = { terminals: "0, 1", nonterminals: "S, A, B", axiom: "S", productions: "S := 0B | 0A1\nA := 0B | 0\nB := 1" };
const G2 = { terminals: "c, d", nonterminals: "D, E", axiom: "D", productions: "D := cE | d\nE := cd" };
const G3 = { terminals: "0, 1, 2", nonterminals: "P, Q, R, S", axiom: "P", productions: "P := 1R | 2Q\nQ := 0R | 0\nR := 1S | 2\nS := 0" };
const G4 = { terminals: "a, b, c", nonterminals: "P, Q, R", axiom: "P", productions: "P := aQ\nQ := ab | caR\nR := c | ac" };
const G5 = { terminals: "a, b, c", nonterminals: "S, A, B", axiom: "S", productions: "S := aAb | bBa\naAb := aBb\naBb := abb | acb\nbBa := bca" };
const G6 = { terminals: "0, 1", nonterminals: "S, A, B, C, D", axiom: "S", productions: "S := CA0\nA := 0B\nA0 := 00B0 | 10\n0B := 11\nC := 0BD | 01\nD := 0" };

const typeCheck = (grammar) => ({ id: "tipo", label: "Tipo de gramática (Chomsky)", spec: { kind: "grammar-type", grammar } });
const wordsCheck = (grammar, expected) => ({ id: "l", label: "Cadenas de L(G) (todas, separadas por comas)", spec: { kind: "wordset", expected } });
const grammarTool = (grammar, extra = {}) => ({ type: "grammar", grammar, ...extra });

const G7 = (productions, axiom = "S") => ({ axiom, productions });
const P7A = "S := aab | aAc\naAc := aBc\naBc := acc | abbc";
const P7B = "S := aB\nB := bcAe\nA := d";
const P7C = "S := zMz\nM := zA\nzA := zaazB\nB := a\nA := aza";
const P7D = "S := xX\nX := xY\nY := yY\nY := y";

const P8A1 = "S := aS\nS := aA\nA := ab";
const P8A2 = "S := aS\nS := aab";
const P8B1 = "S := aS\nS := b";
const P8B2 = "S := aSb\nS := b";

const P9A = "S := AB | aA\nB := AB | b\nA := a | b";
const P9B = "S := AB\nA := aB | b | ab\nB := b | a";

const P10 = {
  a: "S := aAb\nA := aB | a\nB := c",
  b: "S := abS | aA\nA := a",
  c: "S := Sa | aB\nA := ad | a\nB := b | aA",
  d: "S := AB | c\nA := aC\nC := bS\nB := aD\nD := b",
};
const fix10 = (productions) => ({ terminals: "a, b, c, d", nonterminals: "S, A, B, C, D", axiom: "S", productions });
const fix11 = (productions) => ({ terminals: "a, b, c", nonterminals: "S, A, B", axiom: "S", productions });
const P11 = {
  a: "S := aSA\nS := AB\nA := b\nB := c",
  b: "S := aA\nA := aBb\nB := aBb\nB := c",
  c: "S := AB\nA := aA\nA := a\nB := AB\nB := b",
  d: "S := bBa\nB := bBa\nB := c",
  e: "S := AB\nA := aA\nA := b\nB := a\nB := bB",
};

const recursionCheck = (grammar) => ({ id: "rec", label: "Recursividad", spec: { kind: "recursion-type", grammar } });
const ambiguityCheck = (grammar) => ({ id: "amb", label: "¿Es ambigua?", spec: { kind: "ambiguity", grammar, maxLen: 6 } });

export const GRAMATICAS = {
  id: "gramaticas",
  title: "Derivaciones y tipos de gramáticas",
  exerciseRange: "6 a 11",
  context: "Una gramática es G = (ΣT, ΣN, S, P): terminales, no terminales, axioma y producciones (:=). Los terminales van en minúscula (o dígitos), los no terminales en mayúscula y S es el axioma. Una derivación se escribe S → aA → ab.",
  tool: grammarTool(G1),
  example: {
    title: "Ejemplo resuelto: todas las derivaciones de G1 (ejercicio 6a)",
    page: 7,
    statement: "G1 = ({0, 1}, {S, A, B}, S, P1)\nP1 = {S := 0B | 0A1, A := 0B | 0, B := 1}",
    steps: [
      { title: "Empezar por el axioma", text: "Se comienza con el axioma, que en este caso es el símbolo no terminal S, y se aplican todas las producciones posibles hasta quedarse solo con terminales." },
      { title: "Primera derivación", text: "S → 0B → 01" },
      { title: "Segunda derivación", text: "S → 0A1 → 00B1 → 0011" },
      { title: "Tercera derivación", text: "S → 0A1 → 001" },
      { title: "Lenguaje generado", text: "L(G1) = { 01, 0011, 001 }" },
      { title: "Ambigüedad (ejercicio 9a)", text: "Para P1 = {S := AB | aA, B := AB | b, A := a | b}, con la cadena ab hay más de una derivación:\nS → aA → ab\nS → AB → aB → ab\nComo sus árboles de derivación son distintos, se está en presencia de una sentencia ambigua." },
    ],
  },
  exercises: [
    {
      id: "u2-e6",
      number: 6,
      page: 7,
      solutionPage: 12,
      statement: "Obtener todas las derivaciones posibles de las siguientes gramáticas y determinar el tipo de lenguaje generado en cada caso.",
      parts: [
        { id: "a", prompt: "G1 = ({0, 1}, {S, A, B}, S, P1)\nP1 = {S := 0B | 0A1, A := 0B | 0, B := 1}", tool: grammarTool(G1, { tab: "derive" }), checks: [wordsCheck(G1, ["01", "0011", "001"]), typeCheck(G1)], solution: "S → 0B → 01\nS → 0A1 → 00B1 → 0011\nS → 0A1 → 001\nL(G1) = { 01, 0011, 001 }", note: "La guía no da el tipo de G1; el sandbox lo calcula (tipo 2: 0A1 no es lineal)." },
        { id: "b", prompt: "G2 = ({c, d}, {D, E}, D, P2)\nP2 = {D := cE | d, E := cd}", tool: grammarTool(G2, { tab: "derive" }), checks: [wordsCheck(G2, ["d", "ccd"]), typeCheck(G2)], solution: "Tipo 2 · Gramática independiente del contexto\nL(G2) = { d, ccd }" },
        { id: "c", prompt: "G3 = ({0, 1, 2}, {P, Q, R, S}, P, P3)\nP3 = {P := 1R | 2Q, Q := 0R | 0, R := 1S | 2, S := 0}", tool: grammarTool(G3, { tab: "derive" }), checks: [wordsCheck(G3, ["110", "12", "20", "2010", "202"]), typeCheck(G3)], solution: "Tipo 3 · Gramática regular por derecha\nL(G3) = { 110, 12, 20, 2010, 202 }" },
        { id: "d", prompt: "G4 = ({a, b, c}, {P, Q, R}, P, P4)\nP4 = {P := aQ, Q := ab | caR, R := c | ac}", tool: grammarTool(G4, { tab: "derive" }), checks: [wordsCheck(G4, ["aab", "acac", "acaac"]), typeCheck(G4)], solution: "Tipo 2 · Gramática independiente del contexto\nL(G4) = { aab, acac, acaac }" },
        { id: "e", prompt: "G5 = ({a, b, c}, {S, A, B}, S, P5)\nP5 = {S := aAb | bBa, aAb := aBb, aBb := abb | acb, bBa := bca}", tool: grammarTool(G5, { tab: "derive" }), checks: [wordsCheck(G5, ["abb", "acb", "bca"]), typeCheck(G5)], solution: "Tipo 1 · Gramática dependiente del contexto\nL(G5) = { abb, acb, bca }" },
        { id: "f", prompt: "G6 = ({0, 1}, {S, A, B, C, D}, S, P6)\nP6 = {S := CA0, A := 0B, A0 := 00B0 | 10, 0B := 11, C := 0BD | 01, D := 0}", tool: grammarTool(G6, { tab: "derive" }), checks: [wordsCheck(G6, ["110110", "1100110", "11010", "01110", "010110", "0110"]), typeCheck(G6)], solution: "Tipo 0 · Gramática estructurada por frases\nL(G6) = { 110110, 1100110, 11010, 01110, 010110, 0110 }" },
      ],
    },
    {
      id: "u2-e7",
      number: 7,
      page: 8,
      solutionPage: 12,
      statement: "Siendo S el axioma, los símbolos terminales en minúscula y los no terminales en mayúscula, considerá los siguientes conjuntos de producciones como las reglas de alguna gramática. Determiná a qué tipo corresponde según la clasificación de Chomsky, indicá las derivaciones sucesivas directas para la cadena dada y, si es tipo 2 o tipo 3, construí el árbol de derivación (la herramienta lo dibuja).",
      parts: [
        { id: "a", prompt: "Cadena abbc, con P = { S := aab | aAc, aAc := aBc, aBc := acc | abbc }", tool: grammarTool(G7(P7A), { tab: "derive", target: "abbc" }), checks: [typeCheck(G7(P7A)), { id: "der", label: "Derivación de abbc (con →)", spec: { kind: "derivation", grammar: G7(P7A), target: "abbc" } }], solution: "Tipo 1\nS → aAc → aBc → abbc" },
        { id: "b", prompt: "Cadena abcde, con P = { S := aB, B := bcAe, A := d }", tool: grammarTool(G7(P7B), { tab: "tree", target: "abcde" }), checks: [typeCheck(G7(P7B)), { id: "der", label: "Derivación de abcde (con →)", spec: { kind: "derivation", grammar: G7(P7B), target: "abcde" } }], solution: "Tipo 2\nS → aB → abcAe → abcde\nÁrbol de derivación: S con hijos a y B; B con hijos b, c, A y e; A con hijo d (dibujo en la pág. 8)." },
        { id: "c", prompt: "Cadena zzaazaz, con P = { S := zMz, M := zA, zA := zaazB, B := a, A := aza }", tool: grammarTool(G7(P7C), { tab: "derive", target: "zzaazaz" }), checks: [typeCheck(G7(P7C)), { id: "der", label: "Derivación de zzaazaz (con →)", spec: { kind: "derivation", grammar: G7(P7C), target: "zzaazaz" } }], solution: "Tipo 1 · Gramática dependiente del contexto\nS → zMz → zzAz → zzaazBz → zzaazaz" },
        { id: "d", prompt: "Cadena xxyyyy, con P = { S := xX, X := xY, Y := yY, Y := y }", tool: grammarTool(G7(P7D), { tab: "tree", target: "xxyyyy" }), checks: [typeCheck(G7(P7D)), { id: "der", label: "Derivación de xxyyyy (con →)", spec: { kind: "derivation", grammar: G7(P7D), target: "xxyyyy" } }], solution: "Tipo 3 · Gramática regular\nS → xX → xxY → xxyY → xxyyY → xxyyyY → xxyyyy\nÁrbol de derivación: en la pág. 13." },
      ],
    },
    {
      id: "u2-e8",
      number: 8,
      page: 9,
      solutionPage: 13,
      statement: "Considerando G = ({a, b}, {A, S}, S, P), establecer si las reglas de producción dadas corresponden a gramáticas equivalentes. Para resolverlo, derivá varias cadenas de cada gramática, describí el lenguaje que genera y compará.",
      parts: [
        { id: "a", prompt: "P1 = { S := aS, S := aA, A := ab }\nP2 = { S := aS, S := aab }", tool: grammarTool({ axiom: "S", productions: P8A1 }, { tab: "compare", compare: { axiom: "S", productions: P8A2 } }), checks: [{ id: "eq", label: "¿Son equivalentes?", spec: { kind: "equivalent", a: { axiom: "S", productions: P8A1 }, b: { axiom: "S", productions: P8A2 }, maxLen: 9 } }], solution: "L(P1) = { a^{n} b / n ≥ 2 }\nL(P2) = { a^{n} b / n ≥ 2 }\nLas gramáticas son equivalentes." },
        { id: "b", prompt: "P1 = { S := aS, S := b }\nP2 = { S := aSb, S := b }", tool: grammarTool({ axiom: "S", productions: P8B1 }, { tab: "compare", compare: { axiom: "S", productions: P8B2 } }), checks: [{ id: "eq", label: "¿Son equivalentes?", spec: { kind: "equivalent", a: { axiom: "S", productions: P8B1 }, b: { axiom: "S", productions: P8B2 }, maxLen: 9 } }], solution: "S → aS → aaS → aab (las palabras de P1 tienen uno o muchos símbolos a y terminan con un b).\nS → aSb → aaSbb → aabbb (las de P2 tienen un b más que a).\nComo NO generan el mismo lenguaje, no son gramáticas equivalentes.", note: "La guía escribe L(P1) = {ab, aab, …} y L(P2) = {abb, aabbb, …}, pero con S := b ambas generan además la cadena b. La conclusión no cambia." },
      ],
    },
    {
      id: "u2-e9",
      number: 9,
      page: 10,
      solutionPage: 13,
      statement: "Para cada uno de los siguientes conjuntos de producciones, y considerando la gramática Gi = ({a, b}, {S, A, B}, S, Pi), investigar si se obtienen sentencias ambiguas representando los árboles de derivación.",
      parts: [
        { id: "a", prompt: "P1 = { S := AB | aA, B := AB | b, A := a | b }", tool: grammarTool({ axiom: "S", productions: P9A }, { tab: "ambiguity" }), checks: [ambiguityCheck({ axiom: "S", productions: P9A })], solution: "Con la cadena ab hay más de una derivación:\nS → aA → ab\nS → AB → aB → ab\nAl tener más de una derivación posible hay una sentencia ambigua. Sus árboles de derivación siempre van a ser diferentes (dibujo en la pág. 10).", drawing: true },
        { id: "b", prompt: "P2 = { S := AB, A := aB | b | ab, B := b | a }", tool: grammarTool({ axiom: "S", productions: P9B }, { tab: "ambiguity" }), checks: [ambiguityCheck({ axiom: "S", productions: P9B })], solution: "La gramática es ambigua ya que existe la cadena abb que posee dos árboles de derivación diferentes (dibujo en la pág. 13).", drawing: true },
      ],
    },
    {
      id: "u2-e10",
      number: 10,
      page: 11,
      solutionPage: 11,
      statement: "Establecer si las siguientes gramáticas son recursivas y, en caso afirmativo, indicar cuáles son las reglas recursivas y el tipo de recursividad que presentan (directa, en más de un paso, por izquierda, por derecha, mixta).\nG = ({a, b, c, d}, {S, A, B, C, D}, S, P)",
      parts: [
        { id: "a", prompt: "P = { S := aAb, A := aB | a, B := c }", tool: grammarTool(fix10(P10.a), { tab: "recursion" }), checks: [recursionCheck(fix10(P10.a))], solution: "No es recursiva" },
        { id: "b", prompt: "P = { S := abS | aA, A := a }", tool: grammarTool(fix10(P10.b), { tab: "recursion" }), checks: [recursionCheck(fix10(P10.b))], solution: "Es recursiva por derecha (S := abS)" },
        { id: "c", prompt: "P = { S := Sa | aB, A := ad | a, B := b | aA }", tool: grammarTool(fix10(P10.c), { tab: "recursion" }), checks: [recursionCheck(fix10(P10.c))], solution: "Es recursiva por izquierda (S := Sa)" },
        { id: "d", prompt: "P = { S := AB | c, A := aC, C := bS, B := aD, D := b }", tool: grammarTool(fix10(P10.d), { tab: "recursion" }), checks: [recursionCheck(fix10(P10.d))], solution: "Es recursiva en más de un paso (S := AB, A := aC, C := bS)" },
      ],
    },
    {
      id: "u2-e11",
      number: 11,
      page: 11,
      solutionPage: 14,
      statement: "Dados ΣT = {a, b, c} y ΣN = {S, A, B}, siendo S el axioma, para cada uno de los siguientes conjuntos de producciones establecer si las gramáticas construidas son equivalentes, si son recursivas y si son ambiguas (construyendo árboles de derivación).",
      parts: [
        { id: "a", prompt: "P = { S := aSA, S := AB, A := b, B := c }", tool: grammarTool(fix11(P11.a), { tab: "recursion" }), checks: [recursionCheck(fix11(P11.a)), ambiguityCheck(fix11(P11.a))], solution: "Recursiva (S := aSA). No ambigua." },
        { id: "b", prompt: "P = { S := aA, A := aBb, B := aBb, B := c }", tool: grammarTool(fix11(P11.b), { tab: "recursion" }), checks: [recursionCheck(fix11(P11.b)), ambiguityCheck(fix11(P11.b))], solution: "Recursiva (B := aBb). No ambigua." },
        { id: "c", prompt: "P = { S := AB, A := aA, A := a, B := AB, B := b }", tool: grammarTool(fix11(P11.c), { tab: "ambiguity" }), checks: [recursionCheck(fix11(P11.c)), ambiguityCheck(fix11(P11.c))], solution: "Recursiva por derecha (A := aA, B := AB). Ambigua: la cadena aab tiene dos árboles de derivación (dibujo en la pág. 14).", drawing: true },
        { id: "d", prompt: "P = { S := bBa, B := bBa, B := c }", tool: grammarTool(fix11(P11.d), { tab: "recursion" }), checks: [recursionCheck(fix11(P11.d)), ambiguityCheck(fix11(P11.d))], solution: "Recursiva (B := bBa). No ambigua." },
        { id: "e", prompt: "P = { S := AB, A := aA, A := b, B := a, B := bB }", tool: grammarTool(fix11(P11.e), { tab: "recursion" }), checks: [recursionCheck(fix11(P11.e)), ambiguityCheck(fix11(P11.e))], solution: "Recursiva por derecha (A := aA, B := bB). No ambigua." },
        { id: "f", prompt: "¿Cuáles de las cinco gramáticas son equivalentes entre sí? Usá la pestaña Equivalencia de la herramienta para compararlas de a pares.", tool: grammarTool(fix11(P11.a), { tab: "compare", compare: fix11(P11.b) }), checks: [], solution: "La guía no da solución para este punto: comparalas de a pares con la herramienta." },
      ],
    },
  ],
};
