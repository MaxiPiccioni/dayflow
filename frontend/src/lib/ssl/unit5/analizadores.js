// Unidad 5 · Analizadores sintácticos (ejercicios 8, 9, 10, 13 y 14; guía págs. 107 a 116 y 127 a 140) y
// determinismo y condiciones de error (ejercicios 5, 6 y 7). Los analizadores se arman como en la guía:
// ASD (t, p, r) con las producciones apiladas de forma refleja y ASA (t, p) con las reducciones.
import { buildAsa, buildAsd, buildGreibachAsd } from "../machines/analyzers.js";
import { apFromList } from "../machines/build.js";
import { parseGrammar } from "../grammar.js";
import { toGreibach } from "../transform.js";

const G13 = { axiom: "S", productions: "S := 0B\nB := 1B\nB := 1" };
const G14 = { axiom: "S", productions: "S := AaB\nA := bB\nA := aa\nB := bC\nB := b\nC := b" };
const G8 = { axiom: "S", productions: "S := cMc\nM := aMa | bNb | c\nN := a | b | c" };
const G10 = { axiom: "S", productions: "S := bAaB\nA := bBa | b\nB := Ab | a" };

const grammarOf = (fields) => parseGrammar(fields).grammar;
const words = (g) => g.terminals;
const lang = (fields, g, maxLen, extra = {}) => ({ kind: "machine-language", machineType: "ap", alphabet: words(g), maxLen, predicate: "grammar", params: { grammar: fields, maxLen }, ...extra });

const asdPart = ({ id, fields, input, names, source, maxLen = 6, prompt, solution, tool }) => {
  const g = grammarOf(fields);
  return {
    id,
    prompt,
    tool: tool ?? { type: "analyzer", grammar: fields, kind: "asd", input },
    machine: { type: "ap", alphabet: words(g), extra: g.nonterminals, pushMode: "production", lockAlphabet: true, runExamples: [input], spec: lang(fields, g, maxLen), reference: buildAsd(g, { names }), referenceSource: source, referenceNote: source === "guia" ? "ASD de la guía: λ,#/ #S de t a p; λ,A/ α por cada regla y a,a/ λ por cada terminal en p; λ,#/ # de p a r." : "Solución propuesta por el sandbox: la guía muestra el grafo de este analizador como dibujo (se construye con el mismo procedimiento)." },
    solution,
  };
};
const asaPart = ({ id, fields, input, names, source, maxLen = 6, prompt, solution }) => {
  const g = grammarOf(fields);
  return {
    id,
    prompt,
    tool: { type: "analyzer", grammar: fields, kind: "asa", input },
    machine: { type: "ap", alphabet: words(g), extra: g.nonterminals, pushMode: "natural", lockAlphabet: true, runExamples: [input], spec: lang(fields, g, maxLen), reference: buildAsa(g, { names }), referenceSource: source, referenceNote: (source === "guia" ? "ASA de la guía: a,λ/ a por cada terminal, λ,α/ A por cada regla A := α y λ,S/ λ en t; λ,#/ # de t a p." : "Solución propuesta por el sandbox: la guía muestra el grafo de este analizador como dibujo (se construye con el mismo procedimiento).") + " El ASA se arma con λ,#S/ # hacia el estado de aceptación (forma de la teoría): solo acepta las cadenas del lenguaje." },
    solution,
  };
};

const TABLE_13A = "N°  Estado  Cadena  Pila\n1   t    0111   #\n2   p    0111   #S\n3   p    0111   #B0\n4   p    111    #B\n5   p    111    #B1\n6   p    11     #B\n7   p    11     #B1\n8   p    1      #B\n9   p    1      #1\n10  p    -      #\n11  r    -      #";
const TABLE_13B = "N°  Estado  Cadena  Pila\n1   t    0111   #\n2   t    111    #0\n3   t    11     #01\n4   t    1      #011\n5   t    -      #0111\n6   t    -      #011B\n7   t    -      #01B\n8   t    -      #0B\n9   t    -      #S\n10  t    -      #\n11  p    -      #";
const TABLE_14A = "N°  Estado  Cadena  Pila\n1   t    aaabb  #\n2   p    aaabb  #S\n3   p    aaabb  #BaA\n4   p    aaabb  #Baaa\n5   p    aabb   #Baa\n6   p    abb    #Ba\n7   p    bb     #B\n8   p    bb     #Cb\n9   p    b      #C\n10  p    b      #b\n11  p    -      #\n12  r    -      #";
const TABLE_14B = "N°  Estado  Cadena  Pila\n1   t    aaabb  #\n2   t    aabb   #a\n3   t    abb    #aa\n4   t    abb    #A\n5   t    bb     #Aa\n6   t    b      #Aab\n7   t    -      #Aabb\n8   t    -      #AabC\n9   t    -      #AaB\n10  t    -      #S\n11  t    -      #\n12  p    -      #";

const NOTE_ASA = "Nota: la guía usa en los ejercicios 13 y 14 las transiciones λ,S/ λ y λ,#/ # (por eso la tabla tiene un paso más que el ASA del sandbox, que usa λ,#S/ # como en la teoría). Con la variante de los ejercicios también se aceptarían concatenaciones de cadenas del lenguaje (por ejemplo 011011) y la cadena vacía.";

const NOTE_REFLEJO = "La carga en la pila cuando es más de un símbolo y en este caso la parte derecha de las reglas, ingresan de manera refleja: si la regla es X := 0YZ, en la pila se representa #ZY0.";

export const ANALIZADORES = {
  id: "analizadores",
  title: "Analizadores sintácticos",
  exerciseRange: "8, 9, 10, 13 y 14",
  context: "Dada una gramática independiente del contexto G = (ΣT, ΣN, S, P), el AP no determinista de un analizador sintáctico descendente (ASD, Top-Down) es AP = (ΣT, ΣT ∪ ΣN ∪ {#}, {t, p, r}, t, #, {r}, f): λ,#/ #S carga el axioma; λ,A/ α por cada regla A := α (la parte derecha se apila de forma refleja) y a,a/ λ por cada terminal; λ,#/ # lleva al estado de aceptación. El ascendente (ASA, Bottom-Up) es AP = (ΣT, ΣT ∪ ΣN ∪ {#}, {t, p}, t, #, {p}, f): a,λ/ a lee y apila cada terminal; λ,α/ A reduce por cada regla A := α; λ,S/ λ desapila el axioma y λ,#/ # acepta. Como son no deterministas, se muestra el árbol de descripciones instantáneas completo y la tabla operativa del camino que acepta.",
  example: {
    title: "Ejemplo resuelto: ASD y ASA de S := 0B, B := 1B | 1 con α = 0111 (ejercicio 13)",
    page: 111,
    statement: "G = ({0, 1}, {B, S}, S, P) con P = {S := 0B, B := 1B, B := 1}. Derivación de α = 0111: S → 0B → 01B → 011B → 0111.",
    tool: { type: "analyzer", grammar: G13, kind: "asd", input: "0111" },
    steps: [
      { title: "ASD: el grafo", text: "AP = ({0, 1}, {0, 1, B, S, #}, {t, p, r}, t, #, {r}, f)\nλ,#/ #S de t a p; en p: λ,S/ 0B, λ,B/ 1B, λ,B/ 1, 0,0/ λ y 1,1/ λ; λ,#/ # de p a r." },
      { title: "ASD: tabla operativa de 0111", text: `${TABLE_13A}\nLa aceptación se manifiesta con el arribo a la configuración final: el estado r, la cadena completamente leída y la pila vacía.` },
      { title: "ASD: no determinismo", text: "En el árbol de descripciones instantáneas las ramificaciones ponen en evidencia la condición no determinista del AP: con B en el tope hay dos reglas (B := 1B y B := 1)." },
      { title: "ASA: el grafo", text: "AP = ({0, 1}, {0, 1, B, S, #}, {t, p}, t, #, {p}, f)\nEn t: λ,0B/ S, λ,1B/ B, λ,1/ B, 0,λ/ 0, 1,λ/ 1 y λ,S/ λ; λ,#/ # de t a p. Estos AP tienen un único estado operativo cuyas transiciones dependen de las reglas de la gramática." },
      { title: "ASA: tabla operativa de 0111", text: `${TABLE_13B}\nDerivación por derecha (las reducciones se hacen en sentido inverso): S → 0B → 01B → 011B → 0111.` },
    ],
  },
  exercises: [
    {
      id: "u5-e8",
      number: 8,
      page: 107,
      solutionPage: 128,
      statement: "Dada la siguiente gramática formal G1 = ({a, b, c}, {S, M, N}, S, P1) con P1 = {S := cMc, M := aMa | bNb | c, N := a | b | c}, se pide:",
      parts: [
        asdPart({ id: "a", fields: G8, input: "cabcbac", names: { start: "p", work: "q", accept: "r" }, source: "sandbox", maxLen: 7, prompt: "Construir un analizador sintáctico descendente (grafo) y verificar el funcionamiento del mismo con la palabra α = cabcbac. Usar un árbol de descripciones instantáneas y la tabla operativa.", solution: `Se carga el axioma en la pila, luego las reglas una por una: primero las que derivan solo terminales (a,a/ λ para cada terminal) y después λ,A/ α para cada regla. ASD = ({a, b, c}, {S, M, N, a, b, c, #}, {p, q, r}, p, #, {r}, f).\nTabla operativa de cabcbac: p cabcbac #; q cabcbac #S; q cabcbac #cMc; q abcbac #cM; q abcbac #caMa; q bcbac #caM; q bcbac #cabNb; q cbac #cabN; q cbac #cabc; q bac #cab; q ac #ca; q c #c; q λ #; r λ #.\nDerivación: S → cMc → caMac → cabNbac → cabcbac.\n${NOTE_REFLEJO}` }),
        asaPart({ id: "b", fields: G8, input: "cabcbac", names: { start: "p", accept: "q" }, source: "sandbox", maxLen: 7, prompt: "Construir un analizador sintáctico ascendente (grafo) y verificar el funcionamiento del mismo con la misma palabra α = cabcbac del caso anterior. Usar un árbol de descripciones instantáneas y tabla operativa.", solution: "ASA = ({a, b, c}, {S, M, N, a, b, c, #}, {p, q}, p, #, {q}, f)\nTabla operativa de cabcbac: p cabcbac #; p abcbac #c; p bcbac #ca; p cbac #cab; p bac #cabc; p bac #cabN (reducción N := c); p ac #cabNb; p ac #caM (reducción M := bNb); p c #caMa; p c #cM (reducción M := aMa); p λ #cMc; p λ #S (reducción S := cMc); q λ #.\nDerivación por derecha: S → cMc → caMac → cabNbac → cabcbac. Se trabaja en sentido inverso (las reducciones)." }),
      ],
    },
    {
      id: "u5-e9",
      number: 9,
      page: 108,
      solutionPage: 108,
      statement: "Resolver el Ejercicio 8.a utilizando el analizador sintáctico descendente específico para gramáticas expresadas en forma normal de Greibach. Representar su grafo y verificar su funcionamiento al leer la misma palabra α = cabcbac. Representar el árbol de descripciones instantáneas y hacer un análisis comparativo del comportamiento de ambos analizadores sintácticos.",
      note: "La definición del analizador descendente para la Forma Normal de Greibach no está en las páginas de la guía. El sandbox usa la construcción estándar: un estado operativo con a,A/ η por cada regla A := aη (η apilada de forma refleja). Como G1 no está en FNG (S := cMc termina en un terminal), primero se la lleva a FNG con el procedimiento de la Unidad 2; esa gramática puede diferir de la de tu cátedra.",
      parts: [{
        id: "",
        prompt: "Llevá G1 a Forma Normal de Greibach, construí el analizador y verificá cabcbac. La herramienta compara el esfuerzo de los tres analizadores (nodos, profundidad y ramificación media).",
        tool: { type: "analyzer", grammar: G8, kind: "gnf", input: "cabcbac" },
        machine: (() => {
          const g = grammarOf(G8);
          const gnf = toGreibach(g).grammar;
          return { type: "ap", alphabet: g.terminals, extra: gnf.nonterminals, pushMode: "production", lockAlphabet: true, runExamples: ["cabcbac"], spec: lang(G8, g, 7), reference: buildGreibachAsd(gnf), referenceSource: "sandbox", referenceNote: "Solución propuesta por el sandbox: analizador descendente sobre la FNG de G1 obtenida con el procedimiento de la Unidad 2." };
        })(),
        solution: "La guía no incluye la solución de este ejercicio. En el ASD de Greibach cada transición lee un terminal y reemplaza el no terminal del tope por la cola η de la regla A := aη: en cada paso se consume un símbolo de la entrada, por lo que el árbol es menos profundo que el del ASD general.",
      }],
    },
    {
      id: "u5-e10",
      number: 10,
      page: 108,
      solutionPage: 135,
      statement: "Construir: a) un analizador sintáctico descendente y b) un analizador ascendente, que reconozcan el lenguaje producido por la siguiente gramática. Verificar los comportamientos en cada caso a través de árboles de descripciones instantáneas. La cadena de entrada es α = bbaaaa.\nG2 = ({a, b}, {A, B, S}, S, P2) con P2 = {S := bAaB, A := bBa | b, B := Ab | a}",
      parts: [
        asdPart({ id: "a", fields: G10, input: "bbaaaa", names: { start: "p", work: "q", accept: "r" }, source: "sandbox", prompt: "Analizador sintáctico descendente de G2 y verificación con bbaaaa.", solution: `ASD = ({a, b}, {S, A, B, a, b, #}, {p, q, r}, p, #, {r}, f)\nTabla operativa de bbaaaa: p bbaaaa #; q bbaaaa #S; q bbaaaa #BaAb; q baaaa #BaA; q baaaa #BaaBb; q aaaa #BaaB; q aaaa #Baaa; q aaa #Baa; q aa #Ba; q a #B; q a #a; q λ #; r λ #.\nDerivación: S → bAaB → bbBaaB → bbaaaB → bbaaaa.\n${NOTE_REFLEJO}` }),
        asaPart({ id: "b", fields: G10, input: "bbaaaa", names: { start: "p", accept: "q" }, source: "sandbox", prompt: "Analizador sintáctico ascendente de G2 y verificación con bbaaaa.", solution: "ASA = ({a, b}, {S, A, B, a, b, #}, {p, q}, p, #, {q}, f)\nTabla operativa de bbaaaa: p bbaaaa #; p baaaa #b; p aaaa #bb; p aaa #bba; p aaa #bbB (B := a); p aa #bbBa; p aa #bA (A := bBa); p a #bAa; p λ #bAaa; p λ #bAaB (B := a); p λ #S (S := bAaB); q λ #.\nDerivación por derecha: S → bAaB → bAaa → bbBaaa → bbaaaa." }),
      ],
    },
    {
      id: "u5-e13",
      number: 13,
      page: 111,
      solutionPage: 111,
      statement: "Construir: a) un analizador sintáctico descendente y b) un analizador ascendente, que reconozcan el lenguaje producido por la gramática mostrada más abajo. En cada caso, representar los grafos y verificar sus comportamientos ante la lectura de la cadena α = 0111 con las tablas operativas y los árboles de descripciones instantáneas.\nG = ({0, 1}, {B, S}, S, P) siendo P = {S := 0B, B := 1B, B := 1}",
      parts: [
        asdPart({ id: "a", fields: G13, input: "0111", names: { start: "t", work: "p", accept: "r" }, source: "guia", prompt: "Analizador sintáctico descendente (ASD).", solution: `Derivación de α = 0111: S → 0B → 01B → 011B → 0111.\nAP = ({0, 1}, {0, 1, B, S, #}, {t, p, r}, t, #, {r}, f)\n${TABLE_13A}` }),
        asaPart({ id: "b", fields: G13, input: "0111", names: { start: "t", accept: "p" }, source: "guia", prompt: "Analizador sintáctico ascendente (ASA).", solution: `AP = ({0, 1}, {0, 1, B, S, #}, {t, p}, t, #, {p}, f)\n${TABLE_13B}\n${NOTE_ASA}` }),
      ],
    },
    {
      id: "u5-e14",
      number: 14,
      page: 112,
      solutionPage: 113,
      statement: "Construir: a) un analizador sintáctico descendente y b) un analizador sintáctico ascendente, que reconozcan el lenguaje producido por la gramática definida abajo. En cada caso, representar los grafos y verificar sus comportamientos ante la lectura de la cadena α = aaabb con las tablas operativas y los árboles de descripciones instantáneas.\nG = ({a, b}, {A, B, C, S}, S, P), siendo P = {S := AaB, A := bB, A := aa, B := bC, B := b, C := b}\nDerivación de la palabra α = aaabb: S → AaB → aaaB → aaabC → aaabb",
      parts: [
        asdPart({ id: "a", fields: G14, input: "aaabb", names: { start: "t", work: "p", accept: "r" }, source: "guia", prompt: "Analizador sintáctico descendente (ASD).", solution: `AP = ({a, b}, {a, b, A, B, C, S, #}, {t, p, r}, t, #, {r}, f)\n${TABLE_14A}` }),
        asaPart({ id: "b", fields: G14, input: "aaabb", names: { start: "t", accept: "p" }, source: "guia", prompt: "Analizador sintáctico ascendente (ASA).", solution: `AP = ({a, b, A, B, C, S, #}, {a, b, A, B, C, S, #}, {t, p}, t, #, {p}, f)\n${TABLE_14B}\n${NOTE_ASA}\nLa guía aclara que la línea de trazos del árbol de la figura 5.41 representa otra ramificación que no se incluye por razones de espacio: podría dar lugar a movimientos que no conducen a la aceptación (o, si hubiera más de un movimiento a la configuración final, no sería un árbol sino un grafo).` }),
      ],
    },
  ],
};

// ---- Ejercicios 5, 6 y 7 (determinismo y condiciones de error) ----
const free = (prompt) => ({ id: "", prompt, machine: { type: "ap", alphabet: ["(", ")"], extra: ["("], runExamples: ["(())", "()"] }, solution: "La guía no incluye la solución de este ejercicio ni los Ejemplos 5.1 a 5.6 del libro a los que se refiere. En el editor podés dibujar el AP que corresponda: avisa si es no determinista (más de una opción para el mismo estado, lectura y tope de pila, o una transición λ junto a otra que lee) y si le faltan condiciones de error." });

export const AP_ERROR = apFromList({
  name: "AP", alphabet: ["(", ")"], extra: ["("], states: ["q0", "q1", "q2", "q3", "qe"], start: "q0", accepting: ["q3"],
  transitions: [
    "q0 q1 (,#/#(", "q0 qe ),#/#",
    "q1 q1 (,(/((", "q1 q2 ),(/λ",
    "q2 q2 ),(/λ", "q2 qe (,(/(", "q2 qe (,#/#", "q2 qe ),#/#", "q2 q3 λ,#/#",
    "q3 qe (,#/#", "q3 qe ),#/#",
    "qe qe (,#/#", "qe qe ),#/#", "qe qe (,(/(", "qe qe ),(/(",
  ],
});

export const DETERMINISMO = {
  id: "determinismo",
  title: "Determinismo y condiciones de error",
  exerciseRange: "5, 6 y 7",
  context: "Un AP es determinista si, para cada estado, símbolo de entrada y tope de pila, hay a lo sumo una transición (y ninguna transición λ compite con otra que lee). Las condiciones de error son las combinaciones de estado, entrada y tope que no tienen transición: se pueden completar llevándolas a un estado de error qe. El editor avisa cuando el AP dibujado es no determinista.",
  example: {
    title: "Ejemplo: el AP de los paréntesis balanceados con su estado de error",
    page: 119,
    statement: "El AP del ejercicio 1.a (q0 a q3) tiene transiciones definidas solo para los casos esperados. Las condiciones de error son, por ejemplo, un ) con la pila vacía (q0, ), #), un ( después de empezar a cerrar (q2, (, (), o cualquier símbolo después de aceptar.",
    machine: { type: "ap", alphabet: ["(", ")"], extra: ["("], initial: AP_ERROR, runExamples: ["(())", "())", "(()", "()("] },
    steps: [
      { title: "Condiciones de error", text: "Cada combinación (estado, entrada, tope) sin transición es una condición de error. Por ejemplo: en q0 con tope # un ) no tiene sentido (cierra algo que nunca se abrió); en q2, una vez que se empezó a cerrar, un ( ya no se acepta." },
      { title: "Estado de error", text: "Se agrega qe y todas las condiciones de error lo tienen como destino; qe tiene bucles con todos los símbolos (la cadena ya no se puede aceptar)." },
      { title: "¿Determinista?", text: "Al completar con el estado de error el AP queda no determinista: en q2, con tope # y un ) en la entrada, pueden aplicarse a la vez λ,# / # (hacia q3, para aceptar) y ),# / # (hacia qe, error). El AP original de la guía (sin esas transiciones de error) sí es determinista: en cada estado, para cada entrada y tope, hay a lo sumo una transición, y la λ solo compite con transiciones que tienen otro tope. Probalo: el editor avisa del no determinismo." },
    ],
  },
  exercises: [
    {
      id: "u5-e5",
      number: 5,
      page: 107,
      solutionPage: 107,
      statement: "Verificar si los autómatas con pila de los Ejemplos 5.2, 5.5 y 5.6 son no deterministas. Explicar detalladamente el motivo en cada caso.",
      note: "Los Ejemplos 5.2, 5.5 y 5.6 son del libro y no figuran en las páginas de la guía: solo se carga el enunciado. Podés dibujar esos AP en el editor, que avisa si son no deterministas.",
      parts: [free("Dibujá el AP del ejemplo y mirá los avisos de determinismo del editor.")],
    },
    {
      id: "u5-e6",
      number: 6,
      page: 107,
      solutionPage: 107,
      statement: "Incluir las condiciones de error en los autómatas con pila de los Ejemplos 5.1, 5.3 y 5.4, y verificar si son deterministas. Explicar detalladamente cada caso.",
      note: "Los Ejemplos 5.1, 5.3 y 5.4 son del libro y no figuran en las páginas de la guía: solo se carga el enunciado.",
      parts: [free("Dibujá el AP del ejemplo con su estado de error y mirá los avisos del editor.")],
    },
    {
      id: "u5-e7",
      number: 7,
      page: 107,
      solutionPage: 107,
      statement: "Describir y justificar las condiciones de error que pueden presentarse en los Ejemplos 5.1, 5.2, 5.3 y 5.4 brindando detalles de cada caso.",
      note: "Los Ejemplos 5.1 a 5.4 son del libro y no figuran en las páginas de la guía: solo se carga el enunciado. El ejemplo resuelto de esta sección muestra cómo se identifican las condiciones de error del AP de los paréntesis.",
      parts: [free("Describí las condiciones de error del AP que dibujes (el editor las marca como transiciones faltantes).")],
    },
  ],
};
