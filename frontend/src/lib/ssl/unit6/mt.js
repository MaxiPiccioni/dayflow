// Unidad 6 · Máquina de Turing (ejercicios 6 a 21 y 28 a 31; guía págs. 141 a 143 y 146 a 156 y 166 a 179).
// MT = (ΣE, Γ, Q, q0, A, f, b): la cinta tiene blancos b a los dos lados, el cabezal arranca en el primer símbolo de la cadena y
// cada transición es "lee / escribe, movimiento" (D, I, N o P).
import * as M from "./machines.js";
import { guide, lang, nibblePairs, outSpec, sandbox, shannon, solutionText, tape, words } from "./helpers.js";

const BITS = ["0", "1"];
const bits8 = words(BITS, 8);
const nib = nibblePairs();
const stars = (alphabet, max) => words(alphabet, max).map((w) => `${w}*`);
const NIBBLE_NOTE = "Los nibbles tienen cuatro bits cada uno; la máquina del sandbox funciona con dos palabras cualquiera del mismo largo.";

export const MT_PROPUESTOS = {
  id: "mt-propuestos",
  title: "Máquina de Turing: ejercicios propuestos",
  exerciseRange: "6 a 21",
  context: "La máquina de Turing (MT) es como el ALA pero la cinta es infinita para los dos lados (con blancos b) y no tiene marcas de inicio y fin. La cadena de entrada está rodeada de blancos y el cabezal empieza sobre su primer símbolo. Se acepta si la máquina se detiene (por falta de transición o con el movimiento P) en un estado de aceptación; si la tarea es transformar la cinta, importa lo que queda escrito. N deja el cabezal en su lugar y la máquina sigue; P graba, cambia de estado y se detiene.",
  example: {
    title: "Ejemplo resuelto: longitud par o impar (ejercicio 6)",
    page: 141,
    statement: "Comprobar que la función que cumple la siguiente máquina de Turing es verificar si una cadena formada por bits, es de longitud par o impar. Al finalizar graba una P si la cadena resultó ser par o una I en caso contrario. La cadena no tiene longitud fija. MT = ({0,1}, {0,1,I,P,b}, {p,q,r}, p, {r}, f, b).",
    machine: { ...tape("mt", BITS, ["I", "P"]), initial: M.MT6, runExamples: ["0110", "101", "", "1"] },
    steps: [
      { title: "Alternar p y q", text: "p y q se turnan: p significa \"leí una cantidad par de símbolos\" y q, \"impar\". En ambos se lee 0 o 1, se lo deja igual y se avanza a la derecha (0/0,D y 1/1,D)." },
      { title: "Grabar el resultado", text: "Al llegar al blanco de la derecha, si el estado es p (par) se graba P, y si es q (impar) se graba I. El movimiento P detiene la máquina en r, de aceptación." },
      { title: "Función de transición (tabla 6.12)", text: "f     0      1      b\n→p   q,0,D  q,1,D  r,P,P\n q   p,0,D  p,1,D  r,I,P\n*r" },
    ],
  },
  exercises: [
    {
      id: "u6-e6",
      number: 6,
      page: 141,
      solutionPage: 141,
      statement: "Comprobar que la función que cumple la máquina de turing del ejemplo de arriba (tabla 6.12) es verificar si una cadena de bits es de longitud par o impar, y grabar al finalizar una P (par) o una I (impar).",
      note: "Es el ejercicio del ejemplo: cargá la solución, ejecutala con 0110 (graba P) y con 101 (graba I) y mirá cómo cambia la cinta.",
      parts: [
        { id: "", prompt: "Armá la MT de la tabla 6.12 (o cargá la de la guía) y probala.", machine: { ...tape("mt", BITS, ["I", "P"]), runExamples: ["0110", "101", "", "1"], spec: outSpec("mt", "length-parity-letter", bits8), ...guide(M.MT6, "Es la máquina de la figura 6.24 y la tabla 6.12 de la guía.") }, solution: solutionText(M.MT6, "p: cantidad par de símbolos leídos; q: impar. En el blanco final se graba P (desde p) o I (desde q).") },
      ],
    },
    {
      id: "u6-e7",
      number: 7,
      page: 142,
      solutionPage: 167,
      statement: "Construir una MT que verifique en una cadena formada por bits, si la cantidad de 0s (ceros) es par o impar y grabe la letra P si es par o I si es impar, al finalizar la cadena. La cadena no tiene longitud fija. Ejemplo: Entrada b0100110b, Salida b0100110Pb.",
      parts: [
        { id: "", prompt: "0100110 → 0100110P", machine: { ...tape("mt", BITS, ["I", "P"]), runExamples: ["0100110", "101", "000", ""], spec: outSpec("mt", "zeros-parity-letter", bits8), ...sandbox(M.MT7, "Solución propuesta por el sandbox (es la MT del ejercicio 6 contando solo los ceros).") }, solution: solutionText(M.MT7, "Como el ejercicio 6, pero solo los 0 cambian de estado.") },
      ],
    },
    {
      id: "u6-e8",
      number: 8,
      page: 142,
      solutionPage: 168,
      statement: "Diseñar una MT que verifique en una cadena formada por bits, si la cantidad de 1s (unos) es par o impar. En caso de que sea par, al finalizar la comprobación, negar la cadena (cambiar ceros por unos y viceversa), en caso contrario, la máquina solo se detiene. La cadena no tiene longitud fija. Ejemplo: Entrada b101011b, Salida b010100b (cadena negada).",
      parts: [
        { id: "", prompt: "101011 → 010100 (cantidad par de unos: se niega; si es impar solo se detiene)", machine: { ...tape("mt", BITS), runExamples: ["101011", "1011", "000", "1"], spec: outSpec("mt", "negate-if-even-ones", bits8), ...sandbox(M.MT8) }, solution: solutionText(M.MT8, "Se cuenta la paridad de unos hasta el blanco; si es impar se detiene; si es par se vuelve (r) al primer símbolo y se recorre cambiando 0 por 1 y 1 por 0 (n).") },
      ],
    },
    {
      id: "u6-e9",
      number: 9,
      page: 142,
      solutionPage: 169,
      statement: "Construir una MT que opere sobre el alfabeto Σ = {A, B, C, D, E, F, G, H, I} y sustituya las subtiras en una cadena dada según se indica: BA por FG y DE por HI. Ejemplo: Entrada bCFHBAAGDEb, Salida bCFHFGAGHIb.",
      parts: [
        { id: "", prompt: "BA → FG y DE → HI", machine: { ...tape("mt", ["A", "B", "C", "D", "E", "F", "G", "H", "I"]), runExamples: ["CFHBAAGDE", "BBAADE", "DDE", "ABCDEFGHI"], spec: outSpec("mt", "substitute-ba-de", words(["A", "B", "C", "D", "E"], 5)), ...sandbox(M.MT9) }, solution: solutionText(M.MT9, "q0 recorre la cadena; al leer B pasa a q1 y al leer D a q2; si después viene A (o E) se reescriben los dos símbolos (q3 o q5) y se sigue.") },
      ],
    },
    {
      id: "u6-e10",
      number: 10,
      page: 142,
      solutionPage: 170,
      statement: "Diseñar una MT que cree la imagen refleja de la entrada después de un * (asterisco), dejando inalterada al finalizar la cadena original. Ejemplo: Entrada bABB*b, Salida bABB*BBAb.",
      parts: [
        { id: "", prompt: "ABB* → ABB*BBA", machine: { ...tape("mt", ["A", "B", "*"]), runExamples: ["ABB*", "AB*", "*", "ABAB*"], spec: outSpec("mt", "mirror-after-star", stars(["A", "B"], 5)), ...sandbox(M.MT10, "Solución propuesta por el sandbox: marca (X, Y) el último símbolo todavía no copiado, lo agrega al final y repite; al terminar restaura las marcas.") }, solution: solutionText(M.MT10, "Cada vuelta toma, de derecha a izquierda, el próximo símbolo de la cadena original, lo marca (X por A, Y por B), lo lleva al primer blanco después del * y vuelve (qL). Al final qR restaura X → A e Y → B.") },
      ],
    },
    {
      id: "u6-e11",
      number: 11,
      page: 142,
      solutionPage: 173,
      statement: "Diseñar una MT que verifique si dos palabras separadas por un * (asterisco) son iguales (en este caso, acepta la cadena de entrada). Ejemplo: b0010*0010b.",
      dubious: "El enunciado no dice el alfabeto: se usan palabras de bits (puede ser cualquier cadena, incluso vacía, a cada lado del *).",
      parts: [
        { id: "", prompt: "x*x con x ∈ {0,1}*", machine: { ...tape("mt", ["0", "1", "*"]), runExamples: ["0010*0010", "01*10", "*", "0*00"], spec: lang("mt", ["0", "1", "*"], "equal-star", {}, { maxLen: 8 }), ...sandbox(M.MT11) }, solution: solutionText(M.MT11, "Se marca (X o Y) el primer símbolo sin marcar de la izquierda, se lo busca igual en la derecha y se marca; al agotarse la izquierda, qc verifica que la derecha también quedó marcada.") },
      ],
    },
    {
      id: "u6-e12",
      number: 12,
      page: 142,
      solutionPage: 173,
      statement: "Diseñar una MT que copie el primer nibble de un byte sobre el segundo, que se encuentra separado por un * (asterisco). Ejemplo: Entrada b1001*0011b, Salida b1001*1001b.",
      parts: [
        { id: "", prompt: "1001*0011 → 1001*1001", machine: { ...tape("mt", ["0", "1", "*"]), runExamples: ["1001*0011", "0000*1111", "1010*1010"], spec: outSpec("mt", "copy-first-nibble", nib), ...sandbox(M.MT12, NIBBLE_NOTE) }, solution: solutionText(M.MT12, "Cada símbolo del primer nibble se marca (X, Y), se lleva al primer símbolo sin copiar del segundo y lo reemplaza por una marca (A, B); al final se restauran todas las marcas.") },
      ],
    },
    {
      id: "u6-e13",
      number: 13,
      page: 142,
      solutionPage: 174,
      statement: "Construir una MT que intercambie el primer nibble por el segundo, estando ambos separados por un * (asterisco). Ejemplo: Entrada b1001*0011b, Salida b0011*1001b.",
      parts: [
        { id: "", prompt: "1001*0011 → 0011*1001", machine: { ...tape("mt", ["0", "1", "*"]), runExamples: ["1001*0011", "0000*1111", "1010*1010"], spec: outSpec("mt", "swap-nibbles", nib), ...sandbox(M.MT13, NIBBLE_NOTE) }, solution: solutionText(M.MT13, "Se intercambian de a un par de símbolos (primero sin intercambiar de cada lado), dejando marcas A (0) y B (1) para no volver a tocarlos; al final se restauran.") },
      ],
    },
    {
      id: "u6-e14",
      number: 14,
      page: 142,
      solutionPage: 176,
      statement: "Construir una MT que reordene en orden ascendente una cadena de bits de cualquier longitud y la grabe sobre la cinta a partir de un * (asterisco). Ejemplo: Entrada b0110100*b, Salida b0110100*0000111b.",
      parts: [
        { id: "", prompt: "0110100* → 0110100*0000111", machine: { ...tape("mt", ["0", "1", "*"]), runExamples: ["0110100*", "1*", "*", "101*"], spec: outSpec("mt", "sort-after-star", stars(BITS, 6)), ...sandbox(M.MT14, "Solución propuesta por el sandbox: primero copia todos los 0 y después todos los 1 a la derecha del *.") }, solution: solutionText(M.MT14, "Primera etapa: cada 0 se marca (X) y se agrega al final de lo escrito después del *. Segunda etapa: igual con los 1 (Y). Al terminar se restauran los símbolos originales.") },
      ],
    },
    {
      id: "u6-e15",
      number: 15,
      page: 143,
      solutionPage: 177,
      statement: "Construir una MT que verifique en una cadena formada por bits, que haya la misma cantidad de 0s (ceros) que de 1s (unos). La cadena no tiene longitud fija. Ejemplo: b00100111b (la misma cantidad de 0 que de 1).",
      dubious: "No dice si la cadena vacía se acepta: queda a tu criterio.",
      parts: [
        { id: "", prompt: "Misma cantidad de ceros que de unos.", machine: { ...tape("mt", BITS), runExamples: ["00100111", "0110", "001", "10"], spec: lang("mt", BITS, "equal-count", {}, { maxLen: 8 }), ...sandbox(M.MT15) }, solution: solutionText(M.MT15, "Se marca un 0 (X) y se busca un 1 para marcarlo (Y), o al revés, y se repite; si se acaban los símbolos sin marcar a la vez, se acepta.") },
      ],
    },
    {
      id: "u6-e16",
      number: 16,
      page: 143,
      solutionPage: 179,
      statement: "Construir una MT para reconocer cada uno de los lenguajes presentados en el ejercicio 4 del Capítulo 5 (autómatas con pila): a) L1 = { 0ⁿ 1 0ⁿ / n ≥ 1 }; b) L2 = { aᵖ bⁿ cᵖ / p ≥ 1, n > 0 }; c) L3 = { 0ⁿ 1²ⁿ / n ≥ 1 }; d) L4 = { aⁿ bᵖ / n > p }.",
      dubious: "En b) y d) el alfabeto tiene una b, que choca con el blanco b de la MT: en esas dos máquinas el blanco se escribe _ (guion bajo). En d) no se aclara si p puede ser 0 (se deja a tu criterio).",
      parts: [
        { id: "a", prompt: "L1 = { 0ⁿ 1 0ⁿ / n ≥ 1 }", machine: { ...tape("mt", BITS, ["X"]), runExamples: ["0001000", "010", "0100", "00100"], spec: lang("mt", BITS, "sym-mid-sym", { side: "0", mid: "1" }, { maxLen: 8 }), ...sandbox(M.MT16A) }, solution: solutionText(M.MT16A, "Se marca el primer 0 y el último 0 (X) en cada vuelta; al quedar solo el 1, qc verifica que todo lo demás está marcado.") },
        { id: "b", prompt: "L2 = { aᵖ bⁿ cᵖ / p ≥ 1, n > 0 }", machine: { ...tape("mt", ["a", "b", "c"], ["X", "Z"], { blank: "_" }), runExamples: ["aabbcc", "abc", "aabc", "abbc"], spec: lang("mt", ["a", "b", "c"], "a-b-c-outer", { a: "a", b: "b", c: "c" }, { maxLen: 7 }), ...sandbox(M.MT16B) }, solution: solutionText(M.MT16B, "Se marca la primera a (X) y la última c (Z) por vuelta; cuando solo quedan b entre las marcas, qd y qe verifican el resto.") },
        { id: "c", prompt: "L3 = { 0ⁿ 1²ⁿ / n ≥ 1 }", machine: { ...tape("mt", BITS, ["X", "Y"]), runExamples: ["0011", "001111", "011", "0111"], spec: lang("mt", BITS, "ratio-blocks", { x: "0", y: "1", ratio: 2 }, { maxLen: 9 }), ...sandbox(M.MT16C) }, solution: solutionText(M.MT16C, "Por cada 0 (X) se marcan dos 1 (Y); al final no puede quedar ningún 1 sin marcar.") },
        { id: "d", prompt: "L4 = { aⁿ bᵖ / n > p }", machine: { ...tape("mt", ["a", "b", "c"], ["A", "B"], { blank: "_" }), runExamples: ["aab", "aabb", "aaab", "ab"], spec: lang("mt", ["a", "b", "c"], "ab-relation", { relation: ">", bOptionalZero: true }, { maxLen: 6 }), ...sandbox(M.MT16D) }, solution: solutionText(M.MT16D, "Cada b se empareja con una a (A y B); si cuando se acaban las b todavía queda una a sin marcar, se acepta.") },
      ],
    },
    {
      id: "u6-e17",
      number: 17,
      page: 143,
      statement: "Identificar las posibles condiciones de error cuando la máquina de Turing del Ejemplo 6.1 evalúa sus cadenas de entrada. Incorporar el estado de error en el correspondiente grafo y completar la tabla de la función de transición.",
      dubious: "El Ejemplo 6.1 (cᵏ dᵏ eᵏ) no está en las páginas del práctico; el editor arranca con la MT del ejemplo propuesta por el sandbox, sin estado de error. Es una MT distinta de la de la guía (que usa los estados p, q, r, s, t, z), pero hace el mismo trabajo.",
      parts: [
        { id: "", prompt: "Agregá el estado de error qE y mandá ahí los símbolos inesperados.", machine: { ...tape("mt", ["c", "d", "e"], ["X", "Y", "Z"]), initial: M.MT61, runExamples: ["ccddee", "cde", "cdd", "cdee"], spec: lang("mt", ["c", "d", "e"], "triple-blocks", { x: "c", y: "d", z: "e" }, { maxLen: 8, errorState: true }), ...sandbox(M.MT61_ERROR, "Solución propuesta por el sandbox: cada símbolo que no tiene transición va a qE con parada (en los estados donde no se puede leer, por ejemplo, un blanco).") }, solution: solutionText(M.MT61_ERROR, "Condiciones de error: p debe leer c; q solo puede leer c, Y o d; r solo d, Z o e; s solo c, d, Y, Z o X; t c o Y; u Y, Z o b. Todo lo demás (y también los blancos inesperados) va a qE.") },
      ],
    },
    {
      id: "u6-e18",
      number: 18,
      page: 143,
      statement: "Proponer una MT que resuelva el problema del Ejemplo 6.2 comportándose como un autómata con pila, implementando para ello una memoria LIFO en un sector de la cinta. Presentar el grafo de la MT, su función de transición y comparar esta solución con la del Ejemplo 6.2 utilizando como criterio la complejidad estructural de Shannon.",
      dubious: "El Ejemplo 6.2 no está en las páginas: se verifica que la cadena binaria sea un palíndromo (largo par o impar, incluida la vacía). Para comparar, la complejidad de Shannon del ALA de palíndromos del sandbox es " + shannon(M.ALA_PAL) + ".",
      parts: [
        { id: "", prompt: "Palíndromos de {0,1}* con una pila en la cinta.", machine: { ...tape("mt", BITS, ["#", "X", "Y", "M"]), runExamples: ["0110", "10101", "0100", "1"], spec: lang("mt", BITS, "palindrome", {}, { maxLen: 8 }), ...sandbox(M.MT18, "Solución propuesta por el sandbox: la pila es la zona a la derecha del # y su tope es el símbolo de más a la derecha.") }, solution: solutionText(M.MT18, "Etapa 1: cada símbolo de la entrada se marca (X por 0, Y por 1) y se apila al final de la zona que está a la derecha del #. Etapa 2: cada símbolo marcado, de izquierda a derecha, se compara con el tope de la pila (el último apilado), que se desapila (se borra).", `Complejidad estructural de Shannon: ${shannon(M.MT18)}.`) },
      ],
    },
    {
      id: "u6-e19",
      number: 19,
      page: 143,
      statement: "Proponer una máquina de Turing que, para el caso de palíndromos de largo par, resuelva el problema del Ejemplo 6.2 en dos etapas: primero, identificando la mitad de la cadena y luego, comprobando que se trata verdaderamente de un palíndromo. Se sugiere leer los comentarios referidos a este problema al tratarse la Combinación de Máquinas de Turing en el teórico de este capítulo.",
      parts: [
        { id: "", prompt: "Palíndromos de largo par en dos etapas.", machine: { ...tape("mt", BITS, ["A", "B", "C", "D", "M"]), runExamples: ["0110", "1001", "010", "0100"], spec: lang("mt", BITS, "palindrome", { parity: "even" }, { maxLen: 8 }), ...sandbox(M.MT19, "Solución propuesta por el sandbox, con las dos etapas pedidas.") }, solution: solutionText(M.MT19, "Etapa 1 (s0, u, v, w): se marcan los extremos de a pares (A/B a la izquierda, C/D a la derecha); si sobra un símbolo sin pareja, el largo es impar y se rechaza. Etapa 2 (g0, ga, gc, gr): se comparan los símbolos marcados de afuera hacia adentro.") },
      ],
    },
    {
      id: "u6-e20",
      number: 20,
      page: 143,
      statement: "Proponer una solución alternativa para el problema de ordenar cadenas de un alfabeto de tres símbolos {0, 1, 2}, sin utilizar un movimiento neutro N como fue el caso del Ejemplo 6.4. Presentar el grafo de la MT, su función de transición y comparar esta solución con la anterior utilizando como criterio la complejidad estructural de Shannon.",
      dubious: "El Ejemplo 6.4 no está en las páginas, así que no se puede comparar con él: abajo se muestra la complejidad de Shannon de la solución del sandbox.",
      parts: [
        { id: "", prompt: "Ordenar cadenas de {0,1,2} sin usar el movimiento N.", machine: { ...tape("mt", ["0", "1", "2"]), runExamples: ["2102", "210", "0120", "1"], spec: outSpec("mt", "sort-bits", words(["0", "1", "2"], 6, 1), {}, { forbidMoves: ["N"] }), ...sandbox(M.MT20, "Solución propuesta por el sandbox: burbujeo con el último símbolo leído recordado en el estado.") }, solution: solutionText(M.MT20, "Los estados u0, u1, u2 recuerdan el último símbolo leído; si el siguiente es menor se intercambian con s01, s02 o s12 y se pasa a los estados f0, f1, f2 (hubo cambios). Al final de la pasada con cambios, r vuelve al inicio y se repite.", `Complejidad estructural de Shannon: ${shannon(M.MT20)}.`) },
      ],
    },
    {
      id: "u6-e21",
      number: 21,
      page: 143,
      statement: "Para aceptar las cadenas del lenguaje propuesto en el ejemplo 6.9 se propuso una MTND. Se pide como alternativa diseñar una MTD y comparar ambas máquinas utilizando la complejidad estructural de Shannon.",
      dubious: "Falta el Ejemplo 6.9 (el lenguaje y la MTND) en las páginas del práctico, por eso el sandbox no puede comprobar la solución: queda el editor libre para que dibujes y ejecutes tu MTD, y la comparación de Shannon la calculás vos con estados × símbolos de la cinta.",
      parts: [
        { id: "", prompt: "Diseñá tu MTD en el editor (sin comprobación automática).", machine: { ...tape("mt", BITS, []), runExamples: [] }, solution: "No hay solución cargada: depende del lenguaje del Ejemplo 6.9, que no está en las páginas del práctico." },
      ],
    },
  ],
};

export const MT_RESUELTOS = {
  id: "mt-resueltos",
  title: "Máquina de Turing: ejercicios resueltos",
  exerciseRange: "28 a 31",
  context: "Ejercicios de la guía con su solución. En los de dos nibbles separados por * (ejercicio 30), la entrada tiene la forma b x₁x₂x₃x₄ * y₁y₂y₃y₄ b. Cuando hay una tabla de la función de transición en la guía (31.a y 31.b), se carga esa misma tabla.",
  example: {
    title: "Ejemplo resuelto: intercambiar 00 por 11 (ejercicio 28)",
    page: 146,
    statement: "Diseñar una MT tal que dada una palabra, encuentra las subcadenas 00 y las cambie por 11 y las subcadenas 11 las cambie por 00. La palabra finaliza cuando se lee un b (blanco). Ejemplo: Entrada b01001011011b, Salida b01111000000b. MT = ({0,1}, {0,1,b}, {q0, …, q5}, q0, {q5}, f, b).",
    machine: { ...tape("mt", BITS), initial: M.MT28, runExamples: ["01001011011", "0011", "000", "1101"] },
    steps: [
      { title: "Recordar el símbolo anterior", text: "q0 es el estado sin símbolo pendiente; q1 recuerda que se leyó un 0 y q2 que se leyó un 1." },
      { title: "Reescribir el par", text: "Desde q1 al leer otro 0 se retrocede (I), se escribe 1 en el primero y 1 en el segundo (q3, q4) y se sigue desde q0. Con 11 es simétrico (q2, q5, q6, con 0)." },
      { title: "Fin", text: "El blanco detiene la máquina en el estado de aceptación. La figura 6.30 de la guía es un dibujo; esta es una versión equivalente del sandbox (verificada con todas las cadenas de hasta 9 bits)." },
    ],
  },
  exercises: [
    {
      id: "u6-e28",
      number: 28,
      page: 146,
      solutionPage: 146,
      statement: "Diseñar una MT tal que dada una palabra, encuentra las subcadenas 00 y las cambie por 11 y las subcadenas 11 las cambie por 00. La palabra finaliza cuando se lee un b (blanco). Ejemplo: Entrada b01001011011b, Salida b01111000000b.",
      parts: [
        { id: "", prompt: "01001011011 → 01111000000", machine: { ...tape("mt", BITS), runExamples: ["01001011011", "0011", "000", "1101"], spec: outSpec("mt", "swap-00-11", bits8), ...sandbox(M.MT28, "La guía solo trae el dibujo (figura 6.30): esta es una solución propuesta por el sandbox. Los pares se reemplazan de izquierda a derecha sin superponerse.") }, solution: solutionText(M.MT28, "q1 recuerda un 0 pendiente y q2 un 1 pendiente; al repetirse el símbolo se reescribe el par con el opuesto.") },
      ],
    },
    {
      id: "u6-e29",
      number: 29,
      page: 146,
      solutionPage: 147,
      statement: "Construir una MT que copie el nibble que se encuentra a la derecha del * (asterisco) sobre el que se encuentra a la izquierda del mismo. MT = ({0,1}, {0,1,A,B,b}, {q0, …, q7}, q0, {q7}, f, b).",
      parts: [
        { id: "", prompt: "1001*0011 → 0011*0011", machine: { ...tape("mt", ["0", "1", "*"], ["A", "B"]), runExamples: ["1001*0011", "0000*1111", "1010*1010"], spec: outSpec("mt", "copy-second-nibble", nib), ...sandbox(M.MT29, "La guía solo trae el dibujo (figura 6.31): esta es una solución propuesta por el sandbox. " + NIBBLE_NOTE) }, solution: solutionText(M.MT29, "Para cada posición de la izquierda se deja una marca W, se lleva hasta el primer símbolo sin copiar de la derecha (que se marca X o Y) y se reemplaza W por A o B; al final se restauran todas las marcas.") },
      ],
    },
    {
      id: "u6-e30",
      number: 30,
      page: 147,
      solutionPage: 148,
      statement: "Diseñar una MT por cada uno de los siguientes casos, donde la entrada está dada por dos nibbles separados por un * (asterisco).",
      dubious: "La guía resuelve cada inciso con un dibujo (figuras 6.32 a 6.35) y después con una solución general alternativa en dos etapas (30.a' a 30.d', figuras 6.36 a 6.39). Acá se cargan soluciones propuestas por el sandbox (un solo método para los cuatro incisos: llevar cada símbolo contando celdas con estados).",
      parts: [
        { id: "a", prompt: "Intercambiar los dos primeros bits del primer nibble, por los dos primeros bits del segundo nibble. Ejemplo: 0101*1100 → 1101*0100.", machine: { ...tape("mt", ["0", "1", "*"], ["X", "Z"]), runExamples: ["0101*1100", "0000*1111"], spec: outSpec("mt", "swap-bits", nib, { from1: 0, from2: 0 }), ...sandbox(M.MT30A) }, solution: solutionText(M.MT30A, "Se intercambian la celda 1 con la 6 y la 2 con la 7 de la cinta contando cinco pasos con estados.") },
        { id: "b", prompt: "Intercambiar los dos primeros bits del primer nibble, por los dos últimos bits del segundo nibble. Ejemplo: 0101*1100 → 0001*1101.", machine: { ...tape("mt", ["0", "1", "*"], ["X", "Z"]), runExamples: ["0101*1100", "0000*1111"], spec: outSpec("mt", "swap-bits", nib, { from1: 0, from2: 2 }), ...sandbox(M.MT30B) }, solution: solutionText(M.MT30B, "Se intercambian las celdas 1 y 8, y 2 y 9, contando siete pasos con estados.") },
        { id: "c", prompt: "Intercambiar los dos últimos bits del primer nibble, por los dos primeros bits del segundo nibble. Ejemplo: 0101*0011 → 0100*0111.", machine: { ...tape("mt", ["0", "1", "*"], ["X", "Z"]), runExamples: ["0101*0011", "0000*1111"], spec: outSpec("mt", "swap-bits", nib, { from1: 2, from2: 0 }), ...sandbox(M.MT30C) }, solution: solutionText(M.MT30C, "Se avanza dos celdas y se intercambian las celdas 3 y 6, y 4 y 7, contando tres pasos.") },
        { id: "d", prompt: "Intercambiar los dos últimos bits del primer nibble, por los dos últimos bits del segundo nibble. Ejemplo: 0101*1100 → 0100*1101.", machine: { ...tape("mt", ["0", "1", "*"], ["X", "Z"]), runExamples: ["0101*1100", "0000*1111"], spec: outSpec("mt", "swap-bits", nib, { from1: 2, from2: 2 }), ...sandbox(M.MT30D) }, solution: solutionText(M.MT30D, "Se avanza dos celdas y se intercambian las celdas 3 y 8, y 4 y 9, contando cinco pasos.") },
      ],
    },
    {
      id: "u6-e31",
      number: 31,
      page: 154,
      solutionPage: 155,
      statement: "Proponer una MT para reconocer cada uno de los lenguajes que se definen a continuación. En cada caso, presentar el grafo y la función de transición. a) L = { 1ⁿ 2ⁿ 3ⁿ | n > 0 }; b) L = { 1ᵐ 2ⁿ 3ᵐ | m > 0, n > 0 }; c) L = { 1ᵐ 2ⁿ 3ᵐ 4ⁿ | m > 0, n > 0 }.",
      dubious: "La tabla 6.14 de la guía (31.b) acepta también cadenas que no son del lenguaje, como 1232 o 12322 (q4 deja pasar 2 después de los 3). Se carga una versión corregida; la de la guía está en los tests. La guía deja para el lector detectar esa vulnerabilidad.",
      parts: [
        { id: "a", prompt: "L = { 1ⁿ 2ⁿ 3ⁿ | n > 0 }", machine: { ...tape("mt", ["1", "2", "3"], ["A", "B", "C"]), runExamples: ["123", "112233", "1123", "12"], spec: lang("mt", ["1", "2", "3"], "triple-blocks", { x: "1", y: "2", z: "3" }, { maxLen: 8 }), ...guide(M.MT31A, "Es la tabla 6.13 de la guía (q5 es el estado de error y q4 el de aceptación).") }, solution: solutionText(M.MT31A, "Cada 1 se marca con A y se buscan un 2 (B) y un 3 (C); al volver se restaura el 1. q4 restaura los 2 y los 3 y acepta con el blanco; q5 es el error.") },
        { id: "b", prompt: "L = { 1ᵐ 2ⁿ 3ᵐ | m > 0, n > 0 }", machine: { ...tape("mt", ["1", "2", "3"], ["A", "B", "C"]), runExamples: ["12223", "123", "11223", "1223"], spec: lang("mt", ["1", "2", "3"], "a-b-c-outer", { a: "1", b: "2", c: "3" }, { maxLen: 8 }), ...guide(M.MT31B, "Es la tabla 6.14 de la guía con una corrección: el estado q6 impide aceptar 2 después de los 3.") }, solution: solutionText(M.MT31B, "Como 31.a, pero solo el primer 2 se marca: basta con que haya por lo menos uno entre los 1 y los 3, de igual cantidad.") },
        { id: "c", prompt: "L = { 1ᵐ 2ⁿ 3ᵐ 4ⁿ | m > 0, n > 0 }", machine: { ...tape("mt", ["1", "2", "3", "4"], ["A", "B", "C", "E"]), runExamples: ["1234", "112233", "11223344", "123"], spec: lang("mt", ["1", "2", "3", "4"], "abab-blocks", { a: "1", b: "2", c: "3", d: "4" }, { maxLen: 8 }), ...sandbox(M.MT31C, "La guía resuelve este inciso combinando dos MT como la de 31.b (figura 6.36); la solución del sandbox es una sola máquina en dos etapas.") }, solution: solutionText(M.MT31C, "Etapa 1: cada 1 (A) se empareja con un 3 (C). Etapa 2: cada 2 (B) se empareja con un 4 (E). Al final solo pueden quedar marcas.") },
      ],
    },
  ],
};
