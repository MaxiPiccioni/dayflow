// Cadenas y lenguajes: ejercicios 1 a 5 de la guía (págs. 1 a 6). Los exponentes se escriben ^{...}.
const ENV = { α: "aab", β: "cdee", γ: "eddcc", δ: "aacddd" };
const L1 = "d^n e^m / n ≥ 0 ^ m ≥ 2";
const L2 = "a^r c d^r / r ≥ 1";
const L3 = "0^a 1^(2a) / a ≥ 0";
const stringsTool = { type: "strings", env: ENV };

export const CADENAS = {
  id: "cadenas",
  title: "Cadenas y lenguajes",
  exerciseRange: "1 a 5",
  context: "Alfabetos: Σ1 = {a, b, c, d}, Σ2 = {c, d, e}, Σ3 = {0, 1}.\nCadenas definidas sobre ellos: α = aab, β = cdee, γ = eddcc, δ = aacddd.",
  tool: stringsTool,
  example: {
    title: "Ejemplo resuelto: operaciones con cadenas y enumeración de lenguajes",
    page: 1,
    statement: "Con las cadenas de arriba, la guía resuelve operaciones y enumera lenguajes (págs. 1 a 5).",
    steps: [
      { title: "Longitud", text: "La longitud |α| es la cantidad de símbolos que contiene una cadena: |α| = 3 y |β| = 4." },
      { title: "Potencia", text: "La potencia enésima de una palabra es la concatenación n veces de ella misma:\nα^{2} = aab · aab = aabaab" },
      { title: "Concatenación", text: "Se colocan, a continuación de los símbolos de la primera palabra, los símbolos de la segunda:\n(α . δ) = aab · aacddd = aabaacddd" },
      { title: "Reflejo", text: "β^{-1} NO es potencia de la palabra: es la refleja de ella (se lee al revés).\nβ^{-1} = eedc" },
      { title: "Por extensión y por comprensión", text: "Un lenguaje es un conjunto de palabras. Se puede expresar por extensión (enumeración) o por comprensión: 1) coloquial, 2) por una propiedad, 3) algebraica.\nEjemplos: L = {β / β ∈ {a, b}^{+} ^ |β| = 4} y L = {0^{s} 1 0^{t} / s ≥ 1, t ≥ 1}." },
      { title: "Enumerar un lenguaje", text: "L1 = { d^{n} e^{m} / n ≥ 0 ^ m ≥ 2 } es una fórmula lingüística (algebraica). Enumerar es mencionar una a una las palabras del lenguaje:\nL1 = {ee, dee, eee, ddee, …}\nComo el exponente de d puede ser cero, algunas cadenas no incluyen ese símbolo; y como m ≥ 2, siempre hay al menos dos e." },
      { title: "Clausura positiva de una intersección", text: "(Σ1 ∩ Σ2)^{+}: la intersección de dos alfabetos es el conjunto de los símbolos comunes: {c, d}. La clausura positiva es la unión de las potencias crecientes partiendo de la potencia uno:\n{c, d}^{1} ∪ {c, d}^{2} ∪ … = {c, d, cc, dd, cd, dc, ccc, ddd, cdd, cdc, dcc, dcd, ddc, ccd, …}" },
      { title: "Clausura de una unión", text: "(Σ1 ∪ Σ2)^{*}: la unión es el conjunto de todos los símbolos, comunes y no comunes: {a, b, c, d, e}. La clausura parte de la potencia cero:\n{λ, a, b, c, d, e, aa, bb, cc, dd, ee, aaa, abb, acc, add, aee, baa, bbb, …}" },
      { title: "Concatenación de lenguajes", text: "Cada palabra del primer lenguaje se concatena con cada palabra del segundo:\n(L1 . L2) = {deeacd, deeaacdd, deeaaacddd, deeaaaacdddd, ddddeeeacd, …}\nLa concatenación NO es conmutativa: (L1 . L2) ≠ (L2 . L1)." },
    ],
  },
  exercises: [
    {
      id: "u2-e1",
      number: 1,
      page: 1,
      solutionPage: 6,
      statement: "Determinar la longitud de las cadenas: |α|, |β|, |γ|, |δ|.",
      tool: stringsTool,
      parts: [
        { id: "a", prompt: "|α|", checks: [{ id: "r", spec: { kind: "number", expected: 3 } }], solution: "|α| = 3" },
        { id: "b", prompt: "|β|", checks: [{ id: "r", spec: { kind: "number", expected: 4 } }], solution: "|β| = 4" },
        { id: "c", prompt: "|γ|", checks: [{ id: "r", spec: { kind: "number", expected: 5 } }], solution: "|γ| = 5" },
        { id: "d", prompt: "|δ|", checks: [{ id: "r", spec: { kind: "number", expected: 6 } }], solution: "|δ| = 6" },
      ],
    },
    {
      id: "u2-e2",
      number: 2,
      page: 1,
      solutionPage: 6,
      statement: "Realizar las siguientes operaciones con las palabras dadas. Podés escribir las expresiones en la herramienta (. concatena, ^2 es la potencia y ^-1 el reflejo).",
      tool: stringsTool,
      parts: [
        { id: "a", prompt: "α^{2}", checks: [{ id: "r", spec: { kind: "expr", expr: "α^2", env: ENV } }], solution: "α^{2} = aabaab" },
        { id: "b", prompt: "(α . δ)", checks: [{ id: "r", spec: { kind: "expr", expr: "α . δ", env: ENV } }], solution: "(α . δ) = aabaacddd" },
        { id: "c", prompt: "β^{-1}  (no es una potencia: es el reflejo)", checks: [{ id: "r", spec: { kind: "expr", expr: "β^-1", env: ENV } }], solution: "β^{-1} = eedc" },
        { id: "d", prompt: "(δ . α)^{-1}", checks: [{ id: "r", spec: { kind: "expr", expr: "(δ . α)^-1", env: ENV } }], solution: "(δ . α)^{-1} = baadddcaa" },
        { id: "e", prompt: "[ (β . γ)^{-1} ]^{2}", checks: [{ id: "r", spec: { kind: "expr", expr: "[(β . γ)^-1]^2", env: ENV } }], solution: "[ (β . γ)^{-1} ]^{2} = ccddeeedcccddeeedc" },
      ],
    },
    {
      id: "u2-e3",
      number: 3,
      page: 2,
      solutionPage: 6,
      statement: "Definir por enumeración los siguientes lenguajes sobre Σ1, Σ2 y Σ3. Escribí varias cadenas de cada uno, separadas por comas (λ es la cadena vacía).",
      tool: { type: "formula", formula: L1 },
      parts: [
        {
          id: "a",
          prompt: "L1 = { d^{n} e^{m} / n ≥ 0 ^ m ≥ 2 }",
          tool: { type: "formula", formula: L1 },
          checks: [{ id: "r", label: "Cadenas de L1 (al menos 5)", spec: { kind: "language-words", language: { formula: L1 }, min: 5 } }],
          solution: "L1 = {ee, ddddeee, dddeeeeee, eeeee, …}\n(en la guía las cadenas no están ordenadas)",
        },
        {
          id: "b",
          prompt: "L2 = { a^{r} c d^{r} / r ≥ 1 }",
          tool: { type: "formula", formula: L2 },
          checks: [{ id: "r", label: "Cadenas de L2 (al menos 4)", spec: { kind: "language-words", language: { formula: L2 }, min: 4 } }],
          solution: "L2 = { acd, aacdd, aaacddd, aaaaacddddd, … }",
          note: "La lista de la guía salta r = 4 (aaaacdddd). El sandbox usa la definición, no la lista.",
        },
        {
          id: "c",
          prompt: "L3 = { 0^{a} 1^{2a} / a ≥ 0 }",
          tool: { type: "formula", formula: L3 },
          checks: [{ id: "r", label: "Cadenas de L3 (al menos 4)", spec: { kind: "language-words", language: { formula: L3 }, min: 4 } }],
          solution: "L3 = {λ, 011, 001111, 000111111, …}",
        },
      ],
    },
    {
      id: "u2-e4",
      number: 4,
      page: 4,
      solutionPage: 4,
      statement: "Determinar los prefijos y sufijos propios de la cadena δ y aquellas subcadenas que no sean prefijos ni sufijos.",
      tool: { type: "strings", env: ENV, focus: "δ" },
      parts: [
        { id: "a", prompt: "Prefijos propios de δ", checks: [{ id: "r", label: "Prefijos propios", spec: { kind: "wordset", expected: ["a", "aa", "aac", "aacd", "aacdd"] } }], solution: "a, aa, aac, aacd, aacdd" },
        { id: "b", prompt: "Sufijos propios de δ", checks: [{ id: "r", label: "Sufijos propios", spec: { kind: "wordset", expected: ["d", "dd", "ddd", "cddd", "acddd"] } }], solution: "d, dd, ddd, cddd, acddd" },
        {
          id: "c",
          prompt: "Subcadenas que no son prefijos ni sufijos",
          checks: [{ id: "r", label: "Subcadenas internas", spec: { kind: "wordset", expected: ["ac", "acd", "acdd", "c", "cd", "cdd"] } }],
          solution: "ac, acd, acdd, cd, cdd",
          note: "La guía no lista la subcadena c, que tampoco es prefijo ni sufijo de aacddd. El sandbox la cuenta: son seis.",
        },
      ],
    },
    {
      id: "u2-e5",
      number: 5,
      page: 4,
      solutionPage: 6,
      statement: "Definir por extensión, mostrando al menos diez cadenas en orden creciente de longitud, los siguientes conjuntos. En la herramienta podés armar cada operación entre lenguajes.",
      tool: { type: "langops", a: `{${L1}}`, b: `{${L2}}`, op: "concat" },
      dubious: "En el texto extraído se perdieron los símbolos ∩ y ∪ de los incisos a y b; se reconstruyeron por el desarrollo de la guía.",
      parts: [
        {
          id: "a",
          prompt: "(Σ1 ∩ Σ2)^{+}",
          tool: { type: "langops", a: "{a, b, c, d}", b: "{c, d, e}", op: "intersect" },
          checks: [{ id: "r", label: "Diez cadenas, de menor a mayor longitud", spec: { kind: "language-words", language: { sigma: "c,d", positive: true }, min: 10, ordered: true } }],
          solution: "(Σ1 ∩ Σ2)^{+} = {c, d}^{+} = {c, d, cc, dd, cd, dc, ccc, ddd, cdd, cdc, dcc, dcd, ddc, ccd, …}",
        },
        {
          id: "b",
          prompt: "(Σ1 ∪ Σ2)^{*}",
          tool: { type: "langops", a: "{a, b, c, d}", b: "{c, d, e}", op: "union" },
          checks: [{ id: "r", label: "Diez cadenas, de menor a mayor longitud", spec: { kind: "language-words", language: { sigma: "a,b,c,d,e" }, min: 10, ordered: true } }],
          solution: "(Σ1 ∪ Σ2)^{*} = {a, b, c, d, e}^{*} = {λ, a, b, c, d, e, aa, bb, cc, dd, ee, aaa, abb, acc, add, aee, baa, bbb, …}",
        },
        {
          id: "c",
          prompt: "(L1 . L2)",
          tool: { type: "langops", a: `{${L1}}`, b: `{${L2}}`, op: "concat" },
          checks: [{ id: "r", label: "Diez cadenas, de menor a mayor longitud", spec: { kind: "language-words", language: { concat: [{ formula: L1 }, { formula: L2 }] }, min: 10, ordered: true } }],
          solution: "(L1 . L2) = {deeacd, deeaacdd, deeaaacddd, deeaaaacdddd, ddddeeeacd, …}",
        },
        {
          id: "d",
          prompt: "(L2 . L1)",
          tool: { type: "langops", a: `{${L2}}`, b: `{${L1}}`, op: "concat" },
          checks: [{ id: "r", label: "Diez cadenas, de menor a mayor longitud", spec: { kind: "language-words", language: { concat: [{ formula: L2 }, { formula: L1 }] }, min: 10, ordered: true } }],
          solution: "La concatenación NO es conmutativa: (L1 . L2) ≠ (L2 . L1)\n(L2 . L1) = { acdee, aacddee, aaacdddee, aaaacddddee, … }",
        },
        {
          id: "e",
          prompt: "L3^{2}",
          tool: { type: "langops", a: `{${L3}}`, b: "{}", op: "power", n: 2 },
          checks: [{ id: "r", label: "Diez cadenas, de menor a mayor longitud", spec: { kind: "language-words", language: { power: [{ formula: L3 }, 2] }, min: 10, ordered: true } }],
          solution: "L3^{2} = { λ, 011, 011011, 011001111, 011000111111, …, 001111, 001111011, …, 000111111, 000111111011, 000111111001111, … }\nRecordar que: L3^{0} = {λ} y L3^{1} = {λ, 011, 001111, 000111111, 000011111111, …}",
        },
      ],
    },
  ],
};
