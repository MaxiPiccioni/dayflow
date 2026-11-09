// Expresiones regulares: ejercicios 28 y 29 de la guía (págs. 29, 30, 35). En la notación de la cátedra "+" es la unión.
const regexTool = (regex, extra = {}) => ({ type: "regex", regex, ...extra });

export const REGULARES = {
  id: "regulares",
  title: "Expresiones regulares",
  exerciseRange: "28 y 29",
  context: "En una expresión regular, + es la unión, la yuxtaposición es la concatenación, * es la clausura de Kleene y ⁺ la clausura positiva. L(e) es el lenguaje que denota la expresión e.",
  tool: regexTool("(11+0)*"),
  example: {
    title: "Ejemplo resuelto: ejercicio 28a, L1 ((11+0)*)",
    page: 29,
    statement: "Construya ocho cadenas correspondientes al lenguaje regular representado por L1 ((11+0)*).\nEl lenguaje que denota la expresión regular puede determinarse aplicando la definición paso por paso.",
    steps: [
      { title: "Estrella de Kleene", text: "L((11+0)*) = [L((11+0))]*  (por ser una expresión regular que denota al lenguaje formado por la estrella de Kleene del lenguaje denotado)." },
      { title: "Paréntesis", text: "= [L(11+0)]*  (por ser una expresión regular que denota al mismo lenguaje denotado)." },
      { title: "Unión", text: "= [L(11) ∪ L(0)]*  (por ser una expresión regular que denota al lenguaje unión de los lenguajes denotados)." },
      { title: "Concatenación", text: "= [(L(1) . L(1)) ∪ L(0)]*  (por ser una expresión regular que denota al lenguaje concatenación de los lenguajes denotados)." },
      { title: "Lenguajes de un símbolo", text: "= [{1} . {1} ∪ {0}]*  (por ser una expresión regular que denota al lenguaje cuya única palabra es la de largo unitario)." },
      { title: "Concatenación y unión", text: "= [{11, 0}]*" },
      { title: "Estrella de Kleene", text: "= {11, 0}^{0} ∪ {11, 0}^{1} ∪ {11, 0}^{2} ∪ {11, 0}^{3} ∪ …" },
      { title: "Cadenas", text: "= {λ, 11, 0, 1111, 110, 011, 00, 111111, 11110, 11011, …}" },
    ],
  },
  exercises: [
    {
      id: "u2-e28",
      number: 28,
      page: 29,
      solutionPage: 35,
      statement: "Construya ocho cadenas correspondientes a cada uno de los lenguajes regulares representados por las siguientes expresiones.",
      parts: [
        { id: "a", prompt: "L1 ((11+0)*)", tool: regexTool("(11+0)*"), checks: [{ id: "r", label: "Ocho cadenas de L1, separadas por comas", spec: { kind: "regex-words", regex: "(11+0)*", min: 8 } }], solution: "L1 = {λ, 11, 0, 1111, 110, 011, 00, 111111, 11110, 11011, …}" },
        {
          id: "b",
          prompt: "L2 ((a+bb)*+ab)",
          tool: regexTool("(a+bb)*+ab"),
          checks: [{ id: "r", label: "Ocho cadenas de L2, separadas por comas", spec: { kind: "regex-words", regex: "(a+bb)*+ab", min: 8 } }],
          solution: "L2((a+bb)*+ab) = [L(a+bb)]* ∪ L(ab) = [{a} ∪ {b}.{b}]* ∪ {ab} = [{a, bb}]* ∪ {ab}\n= [{a, bb}^{0} ∪ {a, bb}^{1} ∪ {a, bb}^{2} ∪ …] ∪ {ab}\n= {λ, a, bb, aa, abb, bba, bbbb, …} ∪ {ab}\n= {ab, λ, a, bb, aa, abb, bba, bbbb, …}",
        },
      ],
    },
    {
      id: "u2-e29",
      number: 29,
      page: 30,
      solutionPage: 35,
      statement: "Determine una expresión regular para cada uno de los siguientes conjuntos de palabras. Se acepta cualquier expresión equivalente.",
      parts: [
        { id: "a", prompt: "Cadenas de bits que empiezan con 1 y terminan con 0 (números binarios pares)", tool: regexTool("1(0+1)*0"), checks: [{ id: "r", label: "Expresión regular", spec: { kind: "regex", expected: "1(0+1)*0", alphabet: ["0", "1"], maxLen: 9 } }], solution: "1(0+1)*0" },
        { id: "b", prompt: "Cadenas de bits que se expresen como la unidad seguida de ceros (potencias de dos escritas en sistema binario)", tool: regexTool("10*"), checks: [{ id: "r", label: "Expresión regular", spec: { kind: "regex", expected: "10*", alphabet: ["0", "1"], maxLen: 9 } }], solution: "1(0)*" },
      ],
    },
  ],
};
