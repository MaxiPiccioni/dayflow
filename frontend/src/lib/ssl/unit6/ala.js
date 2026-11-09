// Unidad 6 · Autómata linealmente acotado (ejercicios 1 a 5 y 25 a 27; guía págs. 141, 144 a 146 y 159 a 166).
// En la cinta la cadena va entre ├ y ┤ y el cabezal arranca en ├. Cada transición se rotula "lee / escribe, movimiento".
import * as M from "./machines.js";
import { lang, outSpec, sandbox, shannon, solutionText, tape, words } from "./helpers.js";

const BITS = ["0", "1"];
const bitsPlus = words(BITS, 8, 1);
const ab = ["a", "b"];

const inA = (symbol, parity) => ({ symbol, parity, emptyOptional: true });

export const ALA_SECTION = {
  id: "ala",
  title: "Autómata linealmente acotado (ALA)",
  exerciseRange: "1 a 5 y 25 a 27",
  context: "ALA = (ΣE, Γ, Q, q0, A, f): es un AF bidireccional que además puede escribir en la cinta. La cadena α se escribe entre dos símbolos ├ (inicio de cinta) y ┤ (fin de cinta), el cabezal arranca en ├ y no puede pasar de esos límites (si se sale, hay error). Cada transición se rotula \"lee / escribe, mov\": lee un símbolo de la cinta, graba otro (o el mismo) y mueve el cabezal: D (derecha), I (izquierda), N (se queda y la máquina sigue) o P (graba, cambia de estado y se detiene). La máquina acepta si se detiene en un estado de aceptación. Los símbolos auxiliares (A, B, X…) sirven para marcar lo que ya se revisó.",
  example: {
    title: "Ejemplo resuelto: palíndromos de largo par o impar (ejercicio 2)",
    page: 141,
    statement: "Un ALA verifica que una cadena binaria es un palíndromo, de largo par o impar. El Ejemplo 6.2 de la guía no está en las páginas del práctico, así que acá se usa un ALA propuesto por el sandbox con la misma idea: se compara el primer símbolo sin marcar con el último sin marcar y se los tacha (X), hasta que no quede nada.",
    machine: { ...tape("ala", BITS, ["X"]), initial: M.ALA_PAL_SIN_ERROR, runExamples: ["0110", "10101", "0100", "1"] },
    steps: [
      { title: "Tomar el primer símbolo", text: "q0 lee ├ y avanza. En q1 se lee el primer símbolo sin marcar: si es 0 (o 1) se lo marca con X y se pasa a recordar el valor (a0 o a1). Si q1 lee X o ┤, ya no queda nada por comparar: se acepta." },
      { title: "Ir hasta el último símbolo", text: "a0 y a1 recorren la cadena hacia la derecha hasta pasar el último símbolo sin marcar (leen una X o ┤) y retroceden un lugar con movimiento I." },
      { title: "Comparar", text: "Si el último símbolo sin marcar es igual al que se recordó (b0 lee 0, b1 lee 1) se lo marca con X y se vuelve al principio por el estado c. Si es distinto, el ALA se traba: no hay transición (en el ejercicio 2 se la manda al estado de error qE). Si b0 o b1 lee una X, el símbolo del medio de un palíndromo impar quedó solo y se acepta." },
    ],
  },
  exercises: [
    {
      id: "u6-e1",
      number: 1,
      page: 141,
      solutionPage: 160,
      statement: "Para cada uno de los siguientes ítems, construir un autómata linealmente acotado que, dada una cadena {0, 1}+ escrita en su cinta y encerrada entre los símbolos de inicio y fin de cinta, acepte aquellas que:",
      parts: [
        { id: "a", prompt: "Tengan un número par de ceros.", machine: { ...tape("ala", BITS), runExamples: ["100", "01011", "111100", "10"], spec: lang("ala", BITS, "count-parity", inA("0", "even")), ...sandbox(M.ALA1A, "Solución propuesta por el sandbox (la guía la muestra con el simulador, con las cadenas ├100┤, ├01011┤ y ├111100┤).") }, solution: solutionText(M.ALA1A, "Dos estados, e (cantidad par de ceros leídos) y o (impar), con ┤ aceptando solo desde e.") },
        { id: "b", prompt: "Tengan un número impar de unos.", machine: { ...tape("ala", BITS), runExamples: ["1", "0110", "111", "0"], spec: lang("ala", BITS, "count-parity", inA("1", "odd")), ...sandbox(M.ALA1B) }, solution: solutionText(M.ALA1B, "Igual que el anterior contando unos; se acepta al llegar a ┤ desde el estado o.") },
        { id: "c", prompt: "Tengan un número par de caracteres.", machine: { ...tape("ala", BITS), runExamples: ["01", "101", "0000", "1"], spec: lang("ala", BITS, "length-parity", { parity: "even", emptyOptional: true }), ...sandbox(M.ALA1C) }, solution: solutionText(M.ALA1C, "e y o alternan con cualquier símbolo; se acepta con ┤ desde e.") },
        { id: "d", prompt: "Tengan, a la vez, un número par de ceros y un número par de unos.", machine: { ...tape("ala", BITS), runExamples: ["0110", "0011", "01", "000"], spec: lang("ala", BITS, "even-zeros-even-ones"), ...sandbox(M.ALA1D, "Solución propuesta por el sandbox: cuatro estados según la paridad de ceros y de unos.") }, solution: solutionText(M.ALA1D, "pp: ceros pares y unos pares; pi: ceros pares y unos impares; ip: al revés; ii: los dos impares. Se acepta con ┤ desde pp.") },
      ],
    },
    {
      id: "u6-e2",
      number: 2,
      page: 141,
      statement: "Identificar las posibles condiciones de error cuando el autómata linealmente acotado del Ejemplo 6.2 verifica que las cadenas de entrada son palíndromas de largo par o impar. Incorporar el estado de error al correspondiente grafo y completar la tabla de la función de transición.",
      dubious: "El Ejemplo 6.2 no está en las páginas del práctico: el editor arranca con un ALA de palíndromos propuesto por el sandbox (el del ejemplo de arriba), sin estado de error. El error aparece cuando se compara con un símbolo distinto: hay que mandar esa transición a un estado qE (con parada).",
      parts: [
        { id: "", prompt: "Agregá el estado de error qE y las transiciones que llegan a él.", machine: { ...tape("ala", BITS, ["X"]), initial: M.ALA_PAL_SIN_ERROR, runExamples: ["0110", "0100", "10101", "011"], spec: lang("ala", BITS, "palindrome", {}, { maxLen: 8, errorState: true }), ...sandbox(M.ALA_PAL, "Solución propuesta por el sandbox: las no coincidencias (b0 lee 1 y b1 lee 0) van al estado de error qE.") }, solution: solutionText(M.ALA_PAL, "Condiciones de error: en b0 leer 1 y en b1 leer 0, es decir, el último símbolo sin marcar no coincide con el primero. En el estado qE la máquina se detiene (movimiento P) sin aceptar.") },
      ],
    },
    {
      id: "u6-e3",
      number: 3,
      page: 141,
      solutionPage: 163,
      statement: "Proponer un ALA que reemplace la presencia de subcadenas 00 por 11 en una cadena que no tiene una longitud predeterminada. Por ejemplo, el ALA transformará la cadena α = 00101100 en la cadena α = 11101111.",
      parts: [
        { id: "", prompt: "00101100 → 11101111", machine: { ...tape("ala", BITS), runExamples: ["00101100", "000", "0000", "1010"], spec: outSpec("ala", "replace-00-by-11", bitsPlus), ...sandbox(M.ALA3, "Solución propuesta por el sandbox. Los 00 se reemplazan de izquierda a derecha sin superponerse: 000 pasa a 110.") }, solution: solutionText(M.ALA3, "q2 recuerda que se leyó un 0; si el siguiente también es 0, se reescriben los dos como 11 (I, 0/1 y D).") },
      ],
    },
    {
      id: "u6-e4",
      number: 4,
      page: 141,
      solutionPage: 164,
      statement: "Proponer una solución alternativa al problema presentado en el Ejemplo 6.3, que es el de ordenar en forma creciente los símbolos de las cadenas binarias representadas en su cinta. Comparar ambos autómatas utilizando como indicador la complejidad estructural de Shannon.",
      dubious: "El Ejemplo 6.3 no está en las páginas del práctico, así que no se puede comparar con él: se muestra la complejidad de Shannon (estados × símbolos de la cinta) de la solución propuesta para que la compares con la del libro.",
      parts: [
        { id: "", prompt: "Ordenar de forma creciente los símbolos binarios de la cinta.", machine: { ...tape("ala", BITS), runExamples: ["1010", "110100", "0011", "1"], spec: outSpec("ala", "sort-bits", bitsPlus), ...sandbox(M.ALA4, "Solución propuesta por el sandbox: burbujeo, se intercambia cada \"10\" por \"01\" y se repite hasta que no haya intercambios.") }, solution: solutionText(M.ALA4, "Se recorre la cinta: al encontrar un 0 después de un 1 se intercambian (q2 → q3 → q4) y se marca que hubo cambios; al llegar a ┤ con cambios se vuelve al inicio por r y se repite. Sin cambios, se acepta.", `Complejidad estructural de Shannon: ${shannon(M.ALA4)}.`) },
      ],
    },
    {
      id: "u6-e5",
      number: 5,
      page: 141,
      statement: "Se desea diseñar un autómata linealmente acotado que comande el siguiente efecto visual en un cartel luminoso: una barra de seis segmentos (símbolo =) tiene un largo inicial de seis y color rojo, progresivamente su largo se reduce en uno (alternativamente por cada extremo) hasta desaparecer y luego comienza nuevamente a crecer, esta vez de color verde. La secuencia en que la barra se reduce y aumenta cambiando de color se repite indefinidamente. Presentar el grafo, la función de transición del ALA y un ejemplo que demuestre su correcta operación.",
      dubious: "El enunciado deja varias cosas libres. Decisiones del sandbox: = es un segmento rojo, v uno verde y - uno apagado; se achica primero por la izquierda; crece en verde desde la izquierda hasta llenarse y vuelve a empezar en rojo. Como la secuencia se repite para siempre, el simulador corta con \"repite una configuración\": eso es lo esperado.",
      note: "No hay comprobación automática: cargá la solución, ejecutá con ======, avanzá en modo manual y mirá la cinta cada vez que el cabezal vuelve a ├.",
      parts: [
        { id: "", prompt: "Barra de 6 segmentos: roja que se achica de a uno y verde que crece de a uno, para siempre.", machine: { ...tape("ala", ["="], ["-", "v"]), runExamples: ["======"], ...sandbox(M.ALA5, "Solución propuesta por el sandbox. Imágenes en orden: ======, -=====, -====-, --===-, --==--, ---=--, ------, v-----, vv----, vvv---, vvvv--, vvvvv-, vvvvvv y otra vez ======.") }, solution: solutionText(M.ALA5, "Cada vuelta recorre la cinta: la paridad de segmentos apagados (P0/P1, R0/R1) dice de qué extremo se apaga un segmento rojo; con la cinta toda apagada se enciende el primer verde (Z, Z2); con verdes, el siguiente apagado pasa a verde (G) y con todo verde se vuelve a rojo (C). W rebobina hasta ├ para la vuelta siguiente.") },
      ],
    },
    {
      id: "u6-e25",
      number: 25,
      page: 144,
      solutionPage: 144,
      statement: "Construir un ALA que acepte cadenas de la forma general α = a^i b^j para cada uno de los siguientes casos, donde i > 0 y j > 0; a) i > j, b) i < j y c) i = j.",
      dubious: "La guía muestra solo los grafos (imágenes). Se cargan soluciones propuestas por el sandbox: primero se verifica la forma a⁺b⁺ y después se empareja cada a (A) con una b (B).",
      parts: [
        { id: "a", prompt: "i > j", machine: { ...tape("ala", ab, ["A", "B"]), runExamples: ["aab", "ab", "aaabb", "abb"], spec: lang("ala", ab, "ab-relation", { relation: ">" }, { maxLen: 8 }), ...sandbox(M.ALA25A) }, solution: solutionText(M.ALA25A, "Se verifica a⁺b⁺ (f0 a fr), se marca una a (A) y una b (B) por vuelta; si sobra una a cuando no quedan b, se acepta (q2 lee ┤).") },
        { id: "b", prompt: "i < j", machine: { ...tape("ala", ab, ["A", "B"]), runExamples: ["abb", "ab", "aabbb", "aab"], spec: lang("ala", ab, "ab-relation", { relation: "<" }, { maxLen: 8 }), ...sandbox(M.ALA25B) }, solution: solutionText(M.ALA25B, "Igual, pero se acepta cuando se acabaron las a y todavía queda una b sin marcar (q5 lee b).") },
        { id: "c", prompt: "i = j", machine: { ...tape("ala", ab, ["A", "B"]), runExamples: ["aabb", "ab", "aab", "abb"], spec: lang("ala", ab, "ab-relation", { relation: "=" }, { maxLen: 8 }), ...sandbox(M.ALA25C) }, solution: solutionText(M.ALA25C, "Se acepta cuando se acabaron las a y q5 llega a ┤ sin encontrar b sin marcar.") },
      ],
    },
    {
      id: "u6-e26",
      number: 26,
      page: 145,
      solutionPage: 145,
      statement: "Dado cualquier número binario α, construir un ALA que lo sobrescriba como α⁻¹, su cadena recíproca. ALA = ({0,1}, {0,1,A,B,├,┤}, {q0, q1, …, q7}, q0, {q7}, f).",
      dubious: "El grafo de la guía (figura 6.28) es una imagen y tiene ocho estados; el sandbox propone otro ALA con la misma idea (A y B marcan los símbolos ya intercambiados y al final se vuelven 0 y 1).",
      parts: [
        { id: "", prompt: "Sobrescribir α como α⁻¹ (por ejemplo 10110 → 01101).", machine: { ...tape("ala", BITS, ["A", "B"]), runExamples: ["10110", "1100", "1", "011"], spec: outSpec("ala", "reverse", bitsPlus), ...sandbox(M.ALA26) }, solution: solutionText(M.ALA26, "Se toma el primer símbolo sin intercambiar (se deja una X), se lo lleva hasta el último símbolo sin intercambiar y se lo cambia por él, escribiendo A (0) o B (1); al terminar, cv convierte A en 0 y B en 1.") },
      ],
    },
    {
      id: "u6-e27",
      number: 27,
      page: 145,
      solutionPage: 146,
      statement: "Construir un ALA que acepte bytes de la forma αα, siendo α cualquier cadena de cuatro bits.",
      dubious: "El grafo de la guía (figura 6.29) usa estados qa a qp con dos copias del estado de error qE. El sandbox propone otro ALA: primero verifica que haya exactamente ocho bits (p1 a p9) y después empareja cada bit de la izquierda con el que está cuatro celdas a la derecha.",
      parts: [
        { id: "", prompt: "Bytes de la forma αα con α de cuatro bits (por ejemplo 10111011).", machine: { ...tape("ala", BITS, ["A", "B"]), runExamples: ["10111011", "10111010", "1011101", "00000000"], spec: lang("ala", BITS, "byte-double", {}, { maxLen: 9 }), ...sandbox(M.ALA27) }, solution: solutionText(M.ALA27, "Verifica el largo con p1 a p9, vuelve a ├ y empareja los bits: se marca uno (A o B), se avanzan exactamente cuatro celdas con estados u*1 a u*4, se compara y se marca el otro.") },
      ],
    },
  ],
};
