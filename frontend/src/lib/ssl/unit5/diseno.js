// Unidad 5 · Autómatas con pila de diseño (ejercicios 1 a 4, 11 y 12; guía págs. 107 a 110 y 117 a 126).
// La pila se escribe de abajo hacia arriba (el tope a la derecha) y la transición dice "entrada, tope / lo que se apila":
// (, # / # (  lee ( con # en el tope y vuelve a apilar # y después (. Se acepta con estado final, cadena leída y pila vacía.
import { apFromList } from "../machines/build.js";

const lang = (alphabet, predicate, params = {}, extra = {}) => ({ kind: "machine-language", machineType: "ap", alphabet, maxLen: extra.maxLen ?? 8, predicate, params, ...extra });
const ap = (alphabet, extra = []) => ({ type: "ap", alphabet, extra, lockAlphabet: true, bottom: "#" });
const sandbox = (reference) => ({ reference, referenceSource: "sandbox", referenceNote: "Solución propuesta por el sandbox: la guía muestra este AP con el simulador JFLAP (dibujo y tabla operativa). Hay otras soluciones correctas." });
const guide = (reference, note) => ({ reference, referenceSource: "guia", ...(note ? { referenceNote: note } : {}) });

// ---- Ejercicio 1: paréntesis y corchetes balanceados ----
export const AP1A = apFromList({
  name: "AP", alphabet: ["(", ")"], extra: ["("], states: ["q0", "q1", "q2", "q3"], start: "q0", accepting: ["q3"],
  transitions: ["q0 q1 (,#/#(", "q1 q1 (,(/((", "q1 q2 ),(/λ", "q2 q2 ),(/λ", "q2 q3 λ,#/#"],
});
export const AP1B = apFromList({
  name: "AP", alphabet: ["(", ")"], extra: ["("], states: ["p", "q0", "q1"], start: "p", accepting: ["q1"],
  transitions: ["p q0 (,#/#(", "q0 q0 (,#/#(", "q0 q0 (,(/((", "q0 q0 ),(/λ", "q0 q1 λ,#/#"],
});
export const AP1C = apFromList({
  name: "AP", alphabet: ["(", ")", "[", "]"], extra: ["(", "["], states: ["p", "q0", "q1"], start: "p", accepting: ["q1"],
  transitions: ["p q0 (,#/#(", "p q0 [,#/#[", "q0 q0 (,#/#(", "q0 q0 [,#/#[", "q0 q0 (,(/((", "q0 q0 (,[/[(", "q0 q0 [,(/([", "q0 q0 [,[/[[", "q0 q0 ),(/λ", "q0 q0 ],[/λ", "q0 q1 λ,#/#"],
});

// ---- Ejercicio 2: bytes (cuatro primeros y cuatro últimos bits) ----
// Los cuatro primeros bits pasan por s0..s3 (apilando según el ejercicio) y los cuatro últimos por t0..t3 (comparando).
function byteAp({ first, second }) {
  const transitions = [];
  const sNext = ["s1", "s2", "s3", "t0"];
  ["s0", "s1", "s2", "s3"].forEach((s, i) => { for (const line of first) transitions.push(`${s} ${sNext[i]} ${line}`); });
  const tNext = ["t1", "t2", "t3", "e"];
  ["t0", "t1", "t2", "t3"].forEach((t, i) => { for (const line of second) transitions.push(`${t} ${tNext[i]} ${line}`); });
  transitions.push("e f λ,#/#");
  return apFromList({ name: "AP", alphabet: ["0", "1"], extra: [], states: ["s0", "s1", "s2", "s3", "t0", "t1", "t2", "t3", "e", "f"], start: "s0", accepting: ["f"], transitions });
}
export const AP2A = byteAp({ first: ["0,#/#", "0,1/1", "1,#/#1", "1,1/11"], second: ["0,#/#", "0,1/1", "1,1/λ"] });
export const AP2B = byteAp({ first: ["1,#/#", "1,0/0", "0,#/#0", "0,0/00"], second: ["0,#/#", "0,0/0", "1,0/λ"] });
export const AP2C = byteAp({ first: ["0,#/#0", "0,0/00", "0,1/10", "1,#/#1", "1,0/01", "1,1/11"], second: ["0,0/λ", "1,1/λ"] });
export const AP2D = byteAp({ first: ["0,#/#0", "0,0/00", "0,1/10", "1,#/#1", "1,0/01", "1,1/11"], second: ["0,1/λ", "1,0/λ"] });

// ---- Ejercicio 3: dos nibbles separados por * con la misma cantidad de 1s ----
function nibbleAp({ first, second, star }) {
  const transitions = [];
  const sNext = ["s1", "s2", "s3", "m"];
  ["s0", "s1", "s2", "s3"].forEach((s, i) => { for (const line of first) transitions.push(`${s} ${sNext[i]} ${line}`); });
  for (const line of star) transitions.push(`m t0 ${line}`);
  const tNext = ["t1", "t2", "t3", "e"];
  ["t0", "t1", "t2", "t3"].forEach((t, i) => { for (const line of second) transitions.push(`${t} ${tNext[i]} ${line}`); });
  transitions.push("e f λ,#/#");
  return apFromList({ name: "AP", alphabet: ["0", "1", "*"], extra: [], states: ["s0", "s1", "s2", "s3", "m", "t0", "t1", "t2", "t3", "e", "f"], start: "s0", accepting: ["f"], transitions });
}
export const AP3 = nibbleAp({ first: ["0,#/#", "0,1/1", "1,#/#1", "1,1/11"], star: ["*,#/#", "*,1/1"], second: ["0,#/#", "0,1/1", "1,1/λ"] });

// ---- Ejercicio 4: lenguajes de bloques ----
export const AP4A = apFromList({ name: "AP", alphabet: ["0", "1"], extra: ["0"], states: ["q0", "q1", "q2", "q3"], start: "q0", accepting: ["q3"], transitions: ["q0 q1 0,#/#0", "q1 q1 0,0/00", "q1 q2 1,0/0", "q2 q2 0,0/λ", "q2 q3 λ,#/#"] });
export const AP4B = apFromList({ name: "AP", alphabet: ["a", "b", "c"], extra: ["a"], states: ["q0", "q1", "q2", "q3", "q4"], start: "q0", accepting: ["q4"], transitions: ["q0 q1 a,#/#a", "q1 q1 a,a/aa", "q1 q2 b,a/a", "q2 q2 b,a/a", "q2 q3 c,a/λ", "q3 q3 c,a/λ", "q3 q4 λ,#/#"] });
export const AP4C = apFromList({ name: "AP", alphabet: ["0", "1"], extra: ["0"], states: ["q0", "q1", "q2", "q3"], start: "q0", accepting: ["q3"], transitions: ["q0 q1 0,#/#00", "q1 q1 0,0/000", "q1 q2 1,0/λ", "q2 q2 1,0/λ", "q2 q3 λ,#/#"] });
export const AP4D = apFromList({ name: "AP", alphabet: ["a", "b", "c"], extra: ["a"], states: ["q0", "q1", "q2", "q3", "q4"], start: "q0", accepting: ["q4"], transitions: ["q0 q1 a,#/#a", "q1 q1 a,a/aa", "q1 q2 b,a/λ", "q2 q2 b,a/λ", "q1 q3 λ,a/λ", "q2 q3 λ,a/λ", "q3 q3 λ,a/λ", "q3 q4 λ,#/#"] });

// ---- Ejercicio 11: paréntesis, corchetes y llaves ordenados jerárquicamente ----
export const AP11 = apFromList({
  name: "AP", alphabet: ["(", ")", "[", "]", "{", "}"], extra: ["(", "[", "{"], states: ["q0", "q1"], start: "q0", accepting: ["q1"],
  transitions: ["q0 q0 (,#/#(", "q0 q0 (,[/[(", "q0 q0 (,{/{(", "q0 q0 [,#/#[", "q0 q0 [,{/{[", "q0 q0 {,#/#{", "q0 q0 ),(/λ", "q0 q0 ],[/λ", "q0 q0 },{/λ", "q0 q1 λ,#/#"],
});

// ---- Ejercicio 12: dos nibbles separados por * (tablas 5.18 a 5.20 de la guía) ----
export const AP12A = apFromList({
  name: "AP", alphabet: ["0", "1", "*"], extra: ["1"], states: ["q0", "q1", "q2", "q3", "qe"], start: "q0", accepting: ["q3"],
  transitions: ["q0 q1 0,#/#", "q0 q1 1,#/#1", "q1 q1 0,1/1", "q1 q1 1,1/11", "q1 q1 0,#/#", "q1 q1 1,#/#1", "q1 q2 *,1/1", "q1 q2 *,#/#", "q2 q2 0,1/λ", "q2 q2 1,1/1", "q2 q2 1,#/#", "q2 qe *,1/1", "q2 qe λ,1/1", "q2 qe 0,#/#", "q2 q3 λ,#/#"],
});
export const AP12B = apFromList({
  name: "AP", alphabet: ["0", "1", "*"], extra: ["0", "1"], states: ["q0", "q1", "q2", "q3", "qe"], start: "q0", accepting: ["q3"],
  transitions: ["q0 q1 0,#/#0", "q0 q1 1,#/#1", "q1 q1 0,0/00", "q1 q1 0,1/10", "q1 q1 1,0/01", "q1 q1 1,1/11", "q1 q2 *,0/0", "q1 q2 *,1/1", "q2 q2 0,0/λ", "q2 q2 1,1/λ", "q2 qe 1,0/0", "q2 qe 0,1/1", "q2 q3 λ,#/#"],
});
export const AP12C = apFromList({
  name: "AP", alphabet: ["0", "1", "*"], extra: ["0", "1"], states: ["q0", "q1", "q2", "q3", "qe"], start: "q0", accepting: ["q3"],
  transitions: ["q0 q1 0,#/#0", "q0 q1 1,#/#1", "q1 q1 0,0/00", "q1 q1 0,1/10", "q1 q1 1,0/01", "q1 q1 1,1/11", "q1 q2 *,0/0", "q1 q2 *,1/1", "q2 q2 0,1/λ", "q2 q2 1,0/λ", "q2 qe 0,0/0", "q2 qe 1,1/1", "q2 q3 λ,#/#"],
});

const B = ["0", "1"];
const PAR = ["(", ")"];
const BR = ["(", ")", "[", "]"];

const single = (prompt, machine, solution, extra = {}) => ({ ...extra, parts: [{ id: "", prompt, machine, solution }] });
const AP_MAX = 6;

export const DISENIO_AP = {
  id: "diseno",
  title: "Diseño de autómatas con pila",
  exerciseRange: "1 a 4, 11 y 12",
  context: "AP = (ΣE, Γ, Q, q0, #, A, f): además de un AF tiene una pila (memoria LIFO) con alfabeto Γ y un símbolo # de fondo. Cada transición se rotula \"entrada, tope / apila\": lee un símbolo de la cadena (o λ) y el tope de la pila (que sale), y graba en la pila. Si se quiere conservar el tope, se lo vuelve a apilar: (, # / # ( deja # y arriba (. Para desapilar se escribe λ después de la barra. Se acepta cuando la cadena se leyó por completo, la pila quedó vacía (solo #) y el estado es de aceptación. La pila se escribe de abajo hacia arriba: el tope es el símbolo de la derecha.",
  example: {
    title: "Ejemplo resuelto: paréntesis balanceados (ejercicio 1.a)",
    page: 119,
    statement: "Construir un AP que verifique si los paréntesis se encuentran balanceados, es decir que por cada símbolo de apertura debe haber uno de cierre. Cadenas del lenguaje: L = { ( ), ( ( ) ), ( ( ( ) ) ), … }.",
    machine: { type: "ap", alphabet: PAR, extra: ["("], initial: AP1A, runExamples: ["(())", "()", "(()", "())"] },
    steps: [
      { title: "Por qué hace falta la pila", text: "Un AF no puede reconocer este lenguaje: cada vez que la cadena crece habría que agregar estados. La solución es la memoria de la pila: se guardan todos los paréntesis de apertura que presenta la cadena hasta que se lee el primer paréntesis de cierre, y se compara cada cierre con una apertura guardada." },
      { title: "Primera transición: f(q0, (, #) = (q1, #()", text: "Rótulo: (, # / # ( . En la primera parte se lee en la cadena un ( y la pila tiene el tope # (pila vacía); en la segunda parte se almacena de nuevo el tope (recordar que al leer la pila el símbolo sale) y se agrega el símbolo nuevo (. En q1 la pila queda #(, con el ( arriba." },
      { title: "Segunda transición: f(q1, ), () = (q2, λ)", text: "Aquí se ve el objetivo de la pila: al leer un ) y tener un ( en el tope, se desapila (λ después de la barra): por cada cierre se había leído antes una apertura." },
      { title: "Tercera: f(q2, λ, #) = (q3, #)", text: "Finaliza el AP por vaciado de pila y por estado de aceptación: la pila quedó vacía (#) y q3 es el estado de aceptación." },
      { title: "Cadenas de cualquier longitud", text: "En q1 se almacenan todos los paréntesis de apertura (rótulo (, ( / ( ( ), cuando se lee el primer cierre se pasa a q2, donde se compara cada cierre con una apertura almacenada.\nAP = ({(, )}, {(, #}, {q0, q1, q2, q3}, q0, #, {q3}, f)" },
      { title: "Tabla operativa de (( ))", text: "N°  Q   Cadena  Pila\n1   q0  (())   #\n2   q1  ())    #(\n3   q1  ))     #((\n4   q2  )      #(\n5   q2  λ      #\n6   q3  λ      #" },
    ],
  },
  exercises: [
    {
      id: "u5-e1",
      number: 1,
      page: 107,
      solutionPage: 122,
      statement: "Construir un AP por cada ítem, que verifique si los paréntesis y/o corchetes se encuentran balanceados, es decir que por cada símbolo de apertura debe haber uno de cierre. Cada punto del ejercicio es un AP distinto.",
      dubious: "Cada ítem muestra una cadena de ejemplo y no el lenguaje. Se tomó: a) ( ^n ) ^n con n ≥ 1; b) cualquier cadena no vacía de paréntesis balanceados; c) cualquier cadena no vacía con paréntesis y corchetes balanceados y bien anidados.",
      parts: [
        { id: "a", prompt: "( ( ) )", machine: { ...ap(PAR, ["("]), runExamples: ["(())", "()", "((()))", "(()"], spec: lang(PAR, "blocks-equal", { x: "(", y: ")" }, { maxLen: 8 }), ...guide(AP1A) }, solution: "AP = ({(, )}, {(, #}, {q0, q1, q2, q3}, q0, #, {q3}, f)\nTabla operativa de ((())): q0 ((())) #; q1 (())) #(; q1 ())) #((; q1 ))) #(((; q2 )) #((; q2 ) #(; q2 λ #; q3 λ #." },
        { id: "b", prompt: "( ( ) ) ( ( ( ) ) )", machine: { ...ap(PAR, ["("]), runExamples: ["(())((()))", "()()", "(()", ")("], spec: lang(PAR, "balanced", { pairs: ["()"], nonEmpty: true }, { maxLen: 8 }), ...sandbox(AP1B) }, solution: "AP = ({(, )}, {(, Z}, {q0, q1, q2, qe}, q0, Z, {q2}, f) (hecho con JFLAP, donde la pila vacía es Z).\nTabla operativa de (())(()) en la guía: q0 (()(())) z; q0 ()(())) z(; q0 )(())) z((; q1 (())) z(; …; q1 λ z; q2 λ z." },
        { id: "c", prompt: "[ ( ) ( ( ) ) ]", machine: { ...ap(BR, ["(", "["]), runExamples: ["[()(())]", "([])", "[(])", "[()"], spec: lang(BR, "balanced", { pairs: ["()", "[]"], nonEmpty: true }, { maxLen: AP_MAX }), ...sandbox(AP1C) }, solution: "AP = ({[, (, ), ]}, {[, (, Z}, {q0, q1, q2, qe}, q0, Z, {q2}, f) (hecho con JFLAP).\nTabla operativa de [()(())] en la guía: q0 [()()] z; q1 ()()] z[; q1 )()] z[(; q1 ()] z[; q1 )] z[(; q1 ] z[; q1 λ z; q2 λ z." },
      ],
    },
    {
      id: "u5-e2",
      number: 2,
      page: 107,
      solutionPage: 123,
      statement: "Para cada condición diseñar un AP que verifique si en un byte leído (8 bits, ΣE = {0, 1}):",
      parts: [
        { id: "a", prompt: "La cantidad de 1s en los cuatro primeros bits es la misma que en los cuatro últimos.", machine: { ...ap(B, ["1"]), runExamples: ["10100011", "11110000", "00000001"], spec: lang(B, "byte-ones-equal", {}), ...sandbox(AP2A) }, solution: "AP = ({0, 1}, {1, Z}, {q0, q1, q2, q3, q4, q5, qe}, q0, Z, {q5}, f) (JFLAP). Idea: en la primera mitad se apila un 1 por cada 1; en la segunda, cada 1 desapila uno; al final la pila tiene que estar vacía." },
        { id: "b", prompt: "La cantidad de 0s en los cuatro primeros bits es la misma que la cantidad de 1s en los cuatro últimos.", machine: { ...ap(B, ["0"]), runExamples: ["00110011", "11110000", "00001111"], spec: lang(B, "byte-zeros-ones", {}), ...sandbox(AP2B) }, solution: "AP = ({0, 1}, {0, Z}, {q0, q1, q2, q3, q4, q5, qe}, q0, Z, {q5}, f) (JFLAP). Idea: se apila un 0 por cada 0 de la primera mitad y cada 1 de la segunda desapila uno." },
        { id: "c", prompt: "Los cuatro primeros bits constituyen la imagen refleja de los cuatro últimos.", machine: { ...ap(B, ["0", "1"]), runExamples: ["10010110", "11110000", "01100110"], spec: lang(B, "byte-mirror", {}), ...sandbox(AP2C) }, solution: "AP = ({0, 1}, {0, 1, Z}, {q0, q1, q2, q3, q4, q5, qe}, q0, Z, {q5}, f) (JFLAP). Idea: se apilan los cuatro primeros bits; al desapilar salen en orden inverso, que es la imagen refleja." },
        { id: "d", prompt: "Los cuatro últimos bits constituyen la imagen refleja negada de los cuatro primeros.", machine: { ...ap(B, ["0", "1"]), runExamples: ["00001111", "10100101", "11110000"], spec: lang(B, "byte-mirror-neg", {}), ...sandbox(AP2D) }, solution: "AP = ({0, 1}, {0, 1, Z}, {q0, q1, q2, q3, q4, q5, qe}, q0, Z, {q5}, f) (JFLAP). Idea: igual que el anterior, pero cada bit de la segunda mitad tiene que ser el complemento del bit que se desapila." },
      ],
    },
    single(
      "Diseñar un AP que verifique si dos nibbles (4 bits) leídos, separados por el símbolo * (asterisco), tienen ambos la misma cantidad de 1s.",
      { ...ap(["0", "1", "*"], ["1"]), runExamples: ["0101*1001", "1111*0000", "0000*0000"], spec: lang(["0", "1", "*"], "nibbles-star", { rel: "ones-equal" }, { generator: "nibbles" }), ...sandbox(AP3) },
      "AP = ({0, 1, *}, {1, Z}, {q0, q1, q2, qe}, q0, Z, {q2}, f) (JFLAP). Tabla operativa de 0101*1001: q0 0101*1001 z; q0 101*1001 z; q0 01*1001 z1; q0 1*1001 z1; q0 *1001 z11; q1 1001 z11; q1 001 z1; q1 01 z1; q1 1 z1; q1 λ z; q2 λ z.",
      { id: "u5-e3", number: 3, page: 107, solutionPage: 124 },
    ),
    {
      id: "u5-e4",
      number: 4,
      page: 107,
      solutionPage: 124,
      statement: "Diseñar un AP para cada uno de los lenguajes definidos a continuación:",
      dubious: "En el texto extraído se perdieron los exponentes; se reconstruyeron por el contexto y las tablas operativas de la guía. El inciso d no tiene solución en la guía y no aclara si p puede ser 0 (se deja a tu criterio).",
      parts: [
        { id: "a", prompt: "L1 = { 0^{n} 1 0^{n} / n ≥ 1, Σ = {0, 1} }", machine: { ...ap(B, ["0"]), runExamples: ["0001000", "010", "0100", "00100"], spec: lang(B, "sym-mid-sym", { side: "0", mid: "1" }), ...guide(AP4A, "AP = ({0, 1}, {0, Z}, {q0, q1, q2, q3, qe}, q0, Z, {q3}, f): la guía muestra la tabla operativa de 0001000.") }, solution: "AP = ({0, 1}, {0, Z}, {q0, q1, q2, q3, qe}, q0, Z, {q3}, f)\nTabla operativa de 0001000: q0 0001000 z; q1 001000 z0; q1 01000 z00; q1 1000 z000; q2 000 z000; q2 00 z00; q2 0 z0; q2 λ z; q3 λ z." },
        { id: "b", prompt: "L2 = { a^{p} b^{n} c^{p} / p ≥ 1, n > 0, Σ = {a, b, c} }", machine: { ...ap(["a", "b", "c"], ["a"]), runExamples: ["aabbcc", "abc", "aabc", "abbc"], spec: lang(["a", "b", "c"], "a-b-c-outer", { a: "a", b: "b", c: "c" }), ...sandbox(AP4B) }, solution: "AP = ({a, b, c}, {a, Z}, {q0, q1, q2, q3, q4, qe}, q0, Z, {q4}, f) (JFLAP). Idea: se apila una a por cada a, las b no tocan la pila y cada c desapila una a." },
        { id: "c", prompt: "L3 = { 0^{n} 1^{2n} / n ≥ 1, Σ = {0, 1} }", machine: { ...ap(B, ["0"]), runExamples: ["0011", "001111", "011", "0111"], spec: lang(B, "ratio-blocks", { x: "0", y: "1", ratio: 2 }), ...sandbox(AP4C) }, solution: "Hay dos estrategias. Estrategia 1: se leen los 0 y se apilan; por cada par de 1: con el primero no se modifica la pila y con el segundo se desapila un 0 (tabla operativa de 001111: q0 001111 z; q1 01111 z0; q1 1111 z00; q2 111 z00; q3 11 z0; q2 1 z0; q3 λ z; q4 λ z).\nEstrategia 2: por cada 0 que se lee se apilan dos 0 (00) y por cada 1 se desapila un 0.\nAP = ({0, 1}, {0, Z}, {q0, q1, q2, q3, qe}, q0, Z, {q3}, f)." },
        { id: "d", prompt: "L4 = { a^{n} b^{p} / n > p, Σ = {a, b, c} }", machine: { ...ap(["a", "b", "c"], ["a"]), runExamples: ["aab", "aabb", "aaab", "ab"], spec: lang(["a", "b", "c"], "ab-relation", { relation: ">", bOptionalZero: true }), ...sandbox(AP4D) }, solution: "La guía no incluye la solución de este inciso. Idea: se apila una a por cada a; cada b desapila una a; al terminar tiene que sobrar al menos una a, que se vacía con transiciones λ para llegar a la pila vacía." },
      ],
    },
    single(
      "Construir un AP que verifique que los paréntesis, corchetes y llaves se encuentren balanceados y ordenados jerárquicamente en cadenas tales como α = {[()()][()]}(){[()]}. Estas cadenas provienen de expresiones algebraicas a las que se les han eliminado las variables, constantes y operadores aritméticos, dejando solamente los símbolos objeto del análisis sintáctico.",
      { ...ap(["(", ")", "[", "]", "{", "}"], ["(", "[", "{"]), runExamples: ["{[()()][()]}(){[()]}", "([])", "{(})", "[{}]"], spec: lang(["(", ")", "[", "]", "{", "}"], "hier-balanced", {}, { maxLen: 5 }), ...sandbox(AP11) },
      "La guía muestra el grafo (figura 5.30) con estados q0 a q7. Idea de jerarquía: las llaves van afuera de los corchetes y estos afuera de los paréntesis; una llave solo se abre con la pila vacía, un corchete con la pila vacía o con una llave en el tope y un paréntesis con la pila vacía, un corchete o una llave en el tope.",
      { id: "u5-e11", number: 11, page: 108, solutionPage: 108, dubious: "En el texto del enunciado se perdió el contenido entre los símbolos; se tomó “ordenados jerárquicamente” como llaves ⊃ corchetes ⊃ paréntesis (un paréntesis no puede contener a otro, ni un corchete a otro corchete)." },
    ),
    {
      id: "u5-e12",
      number: 12,
      page: 108,
      solutionPage: 109,
      statement: "Diseñar un AP por cada uno de los siguientes ítems, que verifique si para dos nibbles leídos, separados por el símbolo * (asterisco):",
      parts: [
        { id: "a", prompt: "El primer nibble tiene la misma cantidad de 1s que 0s el segundo.", machine: { ...ap(["0", "1", "*"], ["1"]), runExamples: ["1100*0011", "1111*0000", "0000*1111"], spec: lang(["0", "1", "*"], "nibbles-star", { rel: "ones-zeros" }, { generator: "nibbles" }), ...guide(AP12A, "AP = ({0, 1}, {1, #}, {q0, q1, q2, q3, qe}, q0, #, {q3}, f) de la guía (figura 5.31 y tabla 5.18), con una transición más: (q2, 1, #) → (q2, #). La tabla de la guía no la tiene y sin ella rechaza, por ejemplo, 1100*0011 (un 1 del segundo nibble después de vaciar la pila).") }, solution: "AP = ({0, 1}, {1, #}, {q0, q1, q2, q3, qe}, q0, #, {q3}, f)\nf:        0       1      *      λ\nq0,#    q1,#    q1,#1\nq1,#    q1,#    q1,#1   q2,#\nq1,1    q1,1    q1,11   q2,1\nq2,1    q2,λ    q2,1    qe,1   qe,1\nq2,#    qe,#                   q3,#\nNota: a esta tabla le falta f(q2, 1, #) = (q2, #); sin esa transición el AP rechaza cadenas como 1100*0011." },
        { id: "b", prompt: "El primer nibble constituye la imagen refleja del segundo.", machine: { ...ap(["0", "1", "*"], ["0", "1"]), runExamples: ["1001*1001", "0011*1100", "0011*0011"], spec: lang(["0", "1", "*"], "nibbles-star", { rel: "mirror" }, { generator: "nibbles" }), ...guide(AP12B, "AP = ({0, 1}, {0, 1, #}, {q0, q1, q2, q3, qe}, q0, #, {q3}, f) de la guía (figura 5.32 y tabla 5.19).") }, solution: "AP = ({0, 1}, {0, 1, #}, {q0, q1, q2, q3, qe}, q0, #, {q3}, f)\nf:        0       1       *     λ\nq0,#    q1,#0   q1,#1\nq1,0    q1,00   q1,01   q2,0\nq1,1    q1,10   q1,11   q2,1\nq2,0    q2,λ    qe,0\nq2,1    qe,1    q2,λ\nq2,#                          q3,#" },
        { id: "c", prompt: "El segundo nibble es la imagen refleja negada del primero.", machine: { ...ap(["0", "1", "*"], ["0", "1"]), runExamples: ["0011*0011", "1001*0110", "1111*1111"], spec: lang(["0", "1", "*"], "nibbles-star", { rel: "mirror-neg" }, { generator: "nibbles" }), ...guide(AP12C, "AP de la guía (figura 5.33 y tabla 5.20).") }, solution: "AP = ({0, 1}, {0, 1, #}, {q0, q1, q2, q3, qe}, q0, #, {q3}, f)\nf:        0       1       *     λ\nq0,#    q1,#0   q1,#1\nq1,0    q1,00   q1,01   q2,0\nq1,1    q1,10   q1,11   q2,1\nq2,0    qe,0    q2,λ\nq2,1    q2,λ    qe,1\nq2,#                          q3,#" },
      ],
      note: "En esta guía los nibbles son de exactamente 4 bits; el sandbox solo juzga cadenas con esa forma (las otras quedan a criterio, como en las soluciones de la guía, que no cuentan los bits).",
    },
  ],
};
