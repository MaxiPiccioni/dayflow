// Unidad 6 · Autómatas de referencia (ALA y máquinas de Turing).
// Transición "estado destino lee/escribe,mov": D derecha, I izquierda, N neutro, P parada. El cabezal del ALA arranca en ├;
// el de la MT, en el primer símbolo de la cadena. Todas las máquinas se verifican en unit6.test.js.
import { BOT, EOT } from "../machines/model.js";
import { tapeFromList } from "../machines/build.js";

const ala = (opts) => tapeFromList({ type: "ala", name: "ALA", ...opts });
const mt = (opts) => tapeFromList({ type: "mt", name: "MT", blank: "b", ...opts });
const L = `${BOT}/${BOT},D`;
const R = `${EOT}/${EOT},P`;
const BITS = ["0", "1"];

// Pasa de una lista de transiciones por símbolo a líneas "q r a/a,D" (mismo símbolo, mismo movimiento).
const keep = (from, to, symbols, move) => symbols.map((s) => `${from} ${to} ${s}/${s},${move}`);

// Agrega un estado de error qE y manda ahí todo símbolo sin transición (con parada), como pide la guía.
export function withErrorState(machine, { symbols, skip = [] }) {
  const m = JSON.parse(JSON.stringify(machine));
  const errorId = "qE";
  if (!m.states.some((s) => s.id === errorId)) m.states.push({ id: errorId, x: 80 + 150 * Math.min(m.states.length, 5), y: 340 });
  let n = m.transitions.length;
  for (const s of m.states) {
    if (s.id === errorId || skip.includes(s.id) || m.accepting.includes(s.id)) continue;
    for (const symbol of symbols) {
      if (m.transitions.some((t) => t.from === s.id && t.read === symbol)) continue;
      m.transitions.push({ id: `t${++n}e`, from: s.id, to: errorId, read: symbol, write: symbol, move: "P" });
    }
  }
  return m;
}

// ───────── ALA · ejercicio 1 ─────────
export const ALA1A = ala({ alphabet: BITS, states: ["q0", "e", "o", "f"], start: "q0", accepting: ["f"], transitions: [`q0 e ${L}`, "e o 0/0,D", "e e 1/1,D", "o e 0/0,D", "o o 1/1,D", `e f ${R}`] });
export const ALA1B = ala({ alphabet: BITS, states: ["q0", "e", "o", "f"], start: "q0", accepting: ["f"], transitions: [`q0 e ${L}`, "e e 0/0,D", "e o 1/1,D", "o o 0/0,D", "o e 1/1,D", `o f ${R}`] });
export const ALA1C = ala({ alphabet: BITS, states: ["q0", "e", "o", "f"], start: "q0", accepting: ["f"], transitions: [`q0 e ${L}`, "e o 0/0,D", "e o 1/1,D", "o e 0/0,D", "o e 1/1,D", `e f ${R}`] });
export const ALA1D = ala({
  alphabet: BITS, states: ["q0", "pp", "pi", "ip", "ii", "f"], start: "q0", accepting: ["f"],
  // pp: ceros pares y unos pares; pi: ceros pares y unos impares; ip: ceros impares y unos pares; ii: los dos impares.
  transitions: [`q0 pp ${L}`, "pp ip 0/0,D", "pp pi 1/1,D", "pi ii 0/0,D", "pi pp 1/1,D", "ip pp 0/0,D", "ip ii 1/1,D", "ii pi 0/0,D", "ii ip 1/1,D", `pp f ${R}`],
});

// ───────── ALA · Ejemplo 6.2 y ejercicio 2: palíndromos (largo par o impar) ─────────
// X marca lo ya comparado. Se toma el primer símbolo sin marcar, se lo compara con el último sin marcar y se vuelve.
const PAL = [
  `q0 q1 ${L}`,
  "q1 a0 0/X,D", "q1 a1 1/X,D", "q1 f X/X,P", `q1 f ${R}`,
  ...["0", "1"].flatMap((s) => [`a${s} a${s} 0/0,D`, `a${s} a${s} 1/1,D`, `a${s} b${s} X/X,I`, `a${s} b${s} ${EOT}/${EOT},I`]),
  "b0 c 0/X,I", "b0 qE 1/1,P", "b0 f X/X,P",
  "b1 c 1/X,I", "b1 qE 0/0,P", "b1 f X/X,P",
  "c c 0/0,I", "c c 1/1,I", `c q1 X/X,D`, `c q1 ${BOT}/${BOT},D`,
];
export const ALA_PAL = ala({ alphabet: BITS, extra: ["X"], states: ["q0", "q1", "a0", "a1", "b0", "b1", "c", "f", "qE"], start: "q0", accepting: ["f"], transitions: PAL });
// Versión del Ejemplo 6.2 sin el estado de error (las no coincidencias simplemente se quedan sin transición).
export const ALA_PAL_SIN_ERROR = ala({ alphabet: BITS, extra: ["X"], states: ["q0", "q1", "a0", "a1", "b0", "b1", "c", "f"], start: "q0", accepting: ["f"], transitions: PAL.filter((t) => !t.includes("qE")) });

// ───────── ALA · ejercicio 3: 00 por 11 ─────────
export const ALA3 = ala({
  alphabet: BITS, states: ["q0", "q1", "q2", "q3", "q4", "f"], start: "q0", accepting: ["f"],
  transitions: [`q0 q1 ${L}`, "q1 q1 1/1,D", "q1 q2 0/0,D", `q1 f ${R}`, "q2 q1 1/1,D", "q2 q3 0/1,I", `q2 f ${R}`, "q3 q4 0/1,D", "q4 q1 1/1,D"],
});

// ───────── ALA · ejercicio 4: ordenar bits (burbujeo) ─────────
export const ALA4 = ala({
  alphabet: BITS, states: ["q0", "q1", "q2", "q3", "q4", "r", "f"], start: "q0", accepting: ["f"],
  transitions: [
    `q0 q1 ${L}`, "q1 q1 0/0,D", "q1 q2 1/1,D", `q1 f ${R}`,
    "q2 q2 1/1,D", "q2 q3 0/1,I", `q2 f ${R}`,
    "q3 q4 1/0,D",
    "q4 q4 1/1,D", "q4 q3 0/1,I", `q4 r ${EOT}/${EOT},I`,
    "r r 0/0,I", "r r 1/1,I", `r q1 ${L}`,
  ],
});

// ───────── ALA · ejercicio 5: cartel luminoso ─────────
// "=" es un segmento rojo, "v" uno verde y "-" uno apagado. La barra roja se achica de a uno (primero por la izquierda,
// después por la derecha, y así) hasta apagarse; después crece en verde desde la izquierda. Cuando se llena de verde
// vuelve a empezar en rojo. En cada vuelta el cabezal pasa por ├ con una imagen distinta del cartel.
export const ALA5 = ala({
  alphabet: ["="], extra: ["-", "v"],
  states: ["P0", "P1", "R0", "R1", "L0a", "L0b", "M", "L1", "W", "G", "C", "Z", "Z2"], start: "P0",
  transitions: [
    `P0 P0 ${L}`,
    "P0 P1 -/-,D", "P1 P0 -/-,D", "P0 R0 =/=,D", "P1 R1 =/=,D", "P0 G v/v,D",
    "R0 R0 =/=,D", "R0 R1 -/-,D", "R1 R1 =/=,D", "R1 R0 -/-,D", `R0 L0a ${EOT}/${EOT},I`, `R1 L1 ${EOT}/${EOT},I`,
    "L0a L0a -/-,I", "L0a L0b =/=,I", "L0b L0b =/=,I", "L0b M -/-,D", `L0b M ${BOT}/${BOT},D`, "M W =/-,I",
    "L1 L1 -/-,I", "L1 W =/-,I",
    "G G v/v,D", "G W -/v,I", `G C ${EOT}/${EOT},I`, "C C v/=,I", `C P0 ${L}`,
    `P0 Z ${EOT}/${EOT},I`, "Z Z -/-,I", `Z Z2 ${L}`, "Z2 W -/v,I",
    "W W =/=,I", "W W -/-,I", "W W v/v,I", `W P0 ${L}`,
  ],
});
// Las imágenes del cartel, en orden, que tiene que mostrar ALA5 (ver unit6.test.js).
export const CARTEL_FRAMES = ["======", "-=====", "-====-", "--===-", "--==--", "---=--", "------", "v-----", "vv----", "vvv---", "vvvv--", "vvvvv-", "vvvvvv"];

// ───────── ALA · ejercicio 25: a^i b^j ─────────
// Primero se verifica la forma a⁺b⁺ y después se empareja cada a con una b (A y B marcan lo emparejado).
const FORM = [`f0 f1 ${L}`, "f1 f2 a/a,D", "f2 f2 a/a,D", "f2 f3 b/b,D", "f3 f3 b/b,D", `f3 fr ${EOT}/${EOT},I`, "fr fr a/a,I", "fr fr b/b,I", `fr q1 ${L}`];
const PAIR = ["q1 q1 A/A,D", "q1 q2 a/A,D", "q2 q2 a/a,D", "q2 q2 B/B,D", "q2 q3 b/B,I", "q3 q3 a/a,I", "q3 q3 B/B,I", "q3 q1 A/A,D"];
const abAla = (rest, extraStates = []) => ala({ alphabet: ["a", "b"], extra: ["A", "B"], states: ["f0", "f1", "f2", "f3", "fr", "q1", "q2", "q3", ...extraStates, "f"], start: "f0", accepting: ["f"], transitions: [...FORM, ...PAIR, ...rest] });
export const ALA25A = abAla([`q2 f ${R}`]);
export const ALA25B = abAla(["q1 q5 B/B,D", "q5 q5 B/B,D", "q5 f b/b,P"], ["q5"]);
export const ALA25C = abAla(["q1 q5 B/B,D", `q5 f ${R}`, "q5 q5 B/B,D"], ["q5"]);

// ───────── ALA · ejercicio 26: cadena recíproca ─────────
// Se intercambian el primer símbolo y el último sin intercambiar (X guarda el lugar), A y B marcan "ya puesto 0 / 1".
export const ALA26 = ala({
  alphabet: BITS, extra: ["A", "B", "X"],
  states: ["q0", "s0", "qs0", "qs1", "qt0", "qt1", "qL0", "qL1", "rf", "cv", "f"], start: "q0", accepting: ["f"],
  transitions: [
    `q0 s0 ${L}`,
    "s0 s0 A/A,D", "s0 s0 B/B,D", "s0 qs0 0/X,D", "s0 qs1 1/X,D", `s0 rf ${EOT}/${EOT},I`,
    ...["0", "1"].flatMap((s) => [`qs${s} qs${s} 0/0,D`, `qs${s} qs${s} 1/1,D`, `qs${s} qt${s} A/A,I`, `qs${s} qt${s} B/B,I`, `qs${s} qt${s} ${EOT}/${EOT},I`]),
    "qt0 qL0 0/A,I", "qt0 qL1 1/A,I", "qt0 rf X/A,I", "qt1 qL0 0/B,I", "qt1 qL1 1/B,I", "qt1 rf X/B,I",
    ...["0", "1"].flatMap((t) => ["0", "1", "A", "B"].map((s) => `qL${t} qL${t} ${s}/${s},I`)),
    "qL0 s0 X/A,D", "qL1 s0 X/B,D",
    "rf rf 0/0,I", "rf rf 1/1,I", "rf rf A/A,I", "rf rf B/B,I", `rf cv ${L}`,
    "cv cv A/0,D", "cv cv B/1,D", `cv f ${R}`,
  ],
});

// ───────── ALA · ejercicio 27: bytes αα ─────────
function ala27() {
  const t = [`p0 p1 ${L}`];
  // Primero se verifica que haya exactamente ocho bits.
  for (let i = 1; i <= 8; i++) for (const s of BITS) t.push(`p${i} p${i + 1} ${s}/${s},D`);
  t.push(`p9 rw ${EOT}/${EOT},I`, "rw rw 0/0,I", "rw rw 1/1,I", `rw s0 ${L}`);
  // Después se empareja cada bit de la izquierda (A = 0, B = 1) con el que está cuatro celdas más a la derecha.
  t.push("s0 s0 A/A,D", "s0 s0 B/B,D", "s0 u01 0/A,D", "s0 u11 1/B,D", `s0 f ${R}`);
  for (const s of BITS) {
    for (let k = 1; k <= 3; k++) for (const c of ["0", "1", "A", "B"]) t.push(`u${s}${k} u${s}${k + 1} ${c}/${c},D`);
    t.push(`u${s}4 back ${s}/${s === "0" ? "A" : "B"},I`);
  }
  t.push("back back 0/0,I", "back back 1/1,I", "back back A/A,I", "back back B/B,I", `back s0 ${L}`);
  const states = ["p0", ...Array.from({ length: 9 }, (_, i) => `p${i + 1}`), "rw", "s0", ...BITS.flatMap((s) => [1, 2, 3, 4].map((k) => `u${s}${k}`)), "back", "f"];
  return ala({ alphabet: BITS, extra: ["A", "B"], states, start: "p0", accepting: ["f"], transitions: t });
}
export const ALA27 = ala27();

// ───────── MT · ejercicios 6 a 8 ─────────
export const MT6 = mt({ alphabet: BITS, extra: ["I", "P"], states: ["p", "q", "r"], start: "p", accepting: ["r"], transitions: ["p q 0/0,D", "p q 1/1,D", "p r b/P,P", "q p 0/0,D", "q p 1/1,D", "q r b/I,P"] });
export const MT7 = mt({ alphabet: BITS, extra: ["I", "P"], states: ["p", "q", "r"], start: "p", accepting: ["r"], transitions: ["p q 0/0,D", "p p 1/1,D", "q p 0/0,D", "q q 1/1,D", "p r b/P,P", "q r b/I,P"] });
export const MT8 = mt({
  alphabet: BITS, states: ["p", "q", "r", "n", "f"], start: "p", accepting: ["f"],
  transitions: ["p p 0/0,D", "p q 1/1,D", "q q 0/0,D", "q p 1/1,D", "q f b/b,P", "p r b/b,I", "r r 0/0,I", "r r 1/1,I", "r n b/b,D", "n n 0/1,D", "n n 1/0,D", "n f b/b,P"],
});

// ───────── MT · ejercicio 9: BA por FG y DE por HI ─────────
function mt9() {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const t = [];
  for (const state of ["q0", "q1", "q2"]) {
    for (const x of letters) {
      let to = "q0";
      if (x === "B") to = "q1";
      else if (x === "D") to = "q2";
      let line = `${state} ${to} ${x}/${x},D`;
      if (state === "q1" && x === "A") line = "q1 q3 A/G,I";
      if (state === "q2" && x === "E") line = "q2 q5 E/I,I";
      t.push(line);
    }
    t.push(`${state} f b/b,P`);
  }
  t.push("q3 q0 B/F,D", "q5 q0 D/H,D");
  return mt({ alphabet: letters, states: ["q0", "q1", "q2", "q3", "q5", "f"], start: "q0", accepting: ["f"], transitions: t });
}
export const MT9 = mt9();

// ───────── MT · ejercicio 10: imagen refleja después del * ─────────
export const MT10 = mt({
  alphabet: ["A", "B", "*"], extra: ["X", "Y"],
  states: ["q0", "q1", "qa", "qa2", "qb", "qb2", "qL", "qR", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 A/A,D", "q0 q0 B/B,D", "q0 q0 X/X,D", "q0 q0 Y/Y,D", "q0 q1 */*,I",
    "q1 q1 X/X,I", "q1 q1 Y/Y,I", "q1 qa A/X,D", "q1 qb B/Y,D", "q1 qR b/b,D",
    ...["a", "b"].flatMap((s) => ["A", "B", "X", "Y"].map((c) => `q${s} q${s} ${c}/${c},D`)),
    "qa qa2 */*,D", "qb qb2 */*,D", "qa2 qa2 A/A,D", "qa2 qa2 B/B,D", "qb2 qb2 A/A,D", "qb2 qb2 B/B,D", "qa2 qL b/A,I", "qb2 qL b/B,I",
    ...["A", "B", "X", "Y", "*"].map((c) => `qL qL ${c}/${c},I`), "qL q0 b/b,D",
    "qR qR X/A,D", "qR qR Y/B,D", "qR f */*,P",
  ],
});

// ───────── MT · ejercicio 11: dos palabras iguales separadas por * ─────────
export const MT11 = mt({
  alphabet: ["0", "1", "*"], extra: ["X", "Y"],
  states: ["q0", "qa", "qb", "qa2", "qb2", "qL", "qc", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 X/X,D", "q0 q0 Y/Y,D", "q0 qa 0/X,D", "q0 qb 1/Y,D", "q0 qc */*,D",
    ...["a", "b"].flatMap((s) => ["0", "1", "X", "Y"].map((c) => `q${s} q${s} ${c}/${c},D`)),
    "qa qa2 */*,D", "qb qb2 */*,D",
    "qa2 qa2 X/X,D", "qa2 qa2 Y/Y,D", "qb2 qb2 X/X,D", "qb2 qb2 Y/Y,D",
    "qa2 qL 0/X,I", "qb2 qL 1/Y,I",
    ...["0", "1", "X", "Y", "*"].map((c) => `qL qL ${c}/${c},I`), "qL q0 b/b,D",
    "qc qc X/X,D", "qc qc Y/Y,D", "qc f b/b,P",
  ],
});

// ───────── MT · ejercicio 12: copiar el primer nibble sobre el segundo ─────────
export const MT12 = mt({
  alphabet: ["0", "1", "*"], extra: ["X", "Y", "A", "B"],
  states: ["q0", "qa", "qb", "qa2", "qb2", "qL", "q7", "q8", "q9", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 X/X,D", "q0 q0 Y/Y,D", "q0 qa 0/X,D", "q0 qb 1/Y,D", "q0 q7 */*,I",
    ...["a", "b"].flatMap((s) => ["0", "1", "X", "Y"].map((c) => `q${s} q${s} ${c}/${c},D`)),
    "qa qa2 */*,D", "qb qb2 */*,D",
    ...["a", "b"].flatMap((s) => ["A", "B"].map((c) => `q${s}2 q${s}2 ${c}/${c},D`)),
    "qa2 qL 0/A,I", "qa2 qL 1/A,I", "qb2 qL 0/B,I", "qb2 qL 1/B,I",
    ...["0", "1", "X", "Y", "A", "B", "*"].map((c) => `qL qL ${c}/${c},I`), "qL q0 b/b,D",
    "q7 q7 X/0,I", "q7 q7 Y/1,I", "q7 q8 b/b,D",
    "q8 q8 0/0,D", "q8 q8 1/1,D", "q8 q9 */*,D", "q9 q9 A/0,D", "q9 q9 B/1,D", "q9 f b/b,P",
  ],
});

// ───────── MT · ejercicio 13: intercambiar dos palabras (nibbles) ─────────
// Se intercambian de a un símbolo: el de la izquierda queda marcado con lo que vino de la derecha (A = 0, B = 1) y viceversa.
export const MT13 = mt({
  alphabet: ["0", "1", "*"], extra: ["A", "B"],
  states: ["q0", "qs0", "qs1", "qr0", "qr1", "qL0", "qL1", "qc0", "qc1", "q7", "q8", "q9", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 A/A,D", "q0 q0 B/B,D", "q0 qs0 0/0,D", "q0 qs1 1/1,D", "q0 q7 */*,I",
    ...["0", "1"].flatMap((s) => [...["0", "1", "A", "B"].map((c) => `qs${s} qs${s} ${c}/${c},D`), `qs${s} qr${s} */*,D`]),
    "qr0 qr0 A/A,D", "qr0 qr0 B/B,D", "qr1 qr1 A/A,D", "qr1 qr1 B/B,D",
    "qr0 qL0 0/A,I", "qr0 qL1 1/A,I", "qr1 qL0 0/B,I", "qr1 qL1 1/B,I",
    ...["0", "1"].flatMap((t) => [...["0", "1", "A", "B", "*"].map((c) => `qL${t} qL${t} ${c}/${c},I`), `qL${t} qc${t} b/b,D`]),
    "qc0 qc0 A/A,D", "qc0 qc0 B/B,D", "qc0 q0 0/A,D", "qc0 q0 1/A,D",
    "qc1 qc1 A/A,D", "qc1 qc1 B/B,D", "qc1 q0 0/B,D", "qc1 q0 1/B,D",
    "q7 q7 A/0,I", "q7 q7 B/1,I", "q7 q8 b/b,D",
    "q8 q8 0/0,D", "q8 q8 1/1,D", "q8 q9 */*,D", "q9 q9 A/0,D", "q9 q9 B/1,D", "q9 f b/b,P",
  ],
});

// ───────── MT · ejercicio 14: ordenar los bits y grabarlos después del * ─────────
export const MT14 = mt({
  alphabet: ["0", "1", "*"], extra: ["X", "Y"],
  states: ["q0", "qa", "qa2", "qL", "qM", "q1", "qb", "qb2", "qL1", "qR", "qS", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 X/X,D", "q0 q0 Y/Y,D", "q0 q0 1/1,D", "q0 qa 0/X,D", "q0 qM */*,I",
    "qa qa 0/0,D", "qa qa 1/1,D", "qa qa X/X,D", "qa qa Y/Y,D", "qa qa2 */*,D", "qa2 qa2 0/0,D", "qa2 qa2 1/1,D", "qa2 qL b/0,I",
    ...["0", "1", "X", "Y", "*"].map((c) => `qL qL ${c}/${c},I`), "qL q0 b/b,D",
    "qM qM X/X,I", "qM qM Y/Y,I", "qM qM 1/1,I", "qM q1 b/b,D",
    "q1 q1 X/X,D", "q1 q1 Y/Y,D", "q1 qb 1/Y,D", "q1 qR */*,I",
    "qb qb 1/1,D", "qb qb X/X,D", "qb qb Y/Y,D", "qb qb2 */*,D", "qb2 qb2 0/0,D", "qb2 qb2 1/1,D", "qb2 qL1 b/1,I",
    ...["0", "1", "X", "Y", "*"].map((c) => `qL1 qL1 ${c}/${c},I`), "qL1 q1 b/b,D",
    "qR qR X/0,I", "qR qR Y/1,I", "qR qS b/b,D", "qS qS 0/0,D", "qS qS 1/1,D", "qS f */*,P",
  ],
});

// ───────── MT · ejercicio 15: misma cantidad de 0 y de 1 ─────────
export const MT15 = mt({
  alphabet: BITS, extra: ["X", "Y"], states: ["q0", "qa", "qb", "qL", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 X/X,D", "q0 q0 Y/Y,D", "q0 qa 0/X,D", "q0 qb 1/Y,D", "q0 f b/b,P",
    "qa qa 0/0,D", "qa qa X/X,D", "qa qa Y/Y,D", "qa qL 1/Y,I",
    "qb qb 1/1,D", "qb qb X/X,D", "qb qb Y/Y,D", "qb qL 0/X,I",
    "qL qL 0/0,I", "qL qL 1/1,I", "qL qL X/X,I", "qL qL Y/Y,I", "qL q0 b/b,D",
  ],
});

// ───────── MT · ejercicio 16: los lenguajes del ejercicio 4 de la Unidad 5 ─────────
export const MT16A = mt({
  alphabet: BITS, extra: ["X"], states: ["qs", "q0", "qa", "qb", "qL", "qc", "f"], start: "qs", accepting: ["f"],
  transitions: [
    "qs qa 0/X,D", "q0 qa 0/X,D", "q0 qc 1/1,D",
    "qa qa 0/0,D", "qa qa 1/1,D", "qa qb X/X,I", "qa qb b/b,I",
    "qb qL 0/X,I",
    "qL qL 0/0,I", "qL qL 1/1,I", "qL q0 X/X,D",
    "qc qc X/X,D", "qc f b/b,P",
  ],
});
// En las máquinas 16.b y 16.d el alfabeto tiene una b: el blanco pasa a ser "_" (con b como blanco chocarían).
export const MT16B = mt({
  blank: "_", alphabet: ["a", "b", "c"], extra: ["X", "Z"], states: ["qs", "q0", "qa", "qb", "qL", "qd", "qe", "f"], start: "qs", accepting: ["f"],
  transitions: [
    "qs qa a/X,D", "q0 qa a/X,D", "q0 qd b/b,D",
    "qa qa a/a,D", "qa qa b/b,D", "qa qa c/c,D", "qa qb Z/Z,I", "qa qb _/_,I",
    "qb qL c/Z,I",
    "qL qL a/a,I", "qL qL b/b,I", "qL qL c/c,I", "qL q0 X/X,D",
    "qd qd b/b,D", "qd qe Z/Z,D", "qe qe Z/Z,D", "qe f _/_,P",
  ],
});
export const MT16C = mt({
  alphabet: BITS, extra: ["X", "Y"], states: ["q0", "qa", "qb", "qL", "qc", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 qa 0/X,D", "q0 q0 X/X,D", "q0 qc Y/Y,D",
    "qa qa 0/0,D", "qa qa X/X,D", "qa qa Y/Y,D", "qa qb 1/Y,D",
    "qb qL 1/Y,I",
    "qL qL 0/0,I", "qL qL 1/1,I", "qL qL X/X,I", "qL qL Y/Y,I", "qL q0 b/b,D",
    "qc qc Y/Y,D", "qc f b/b,P",
  ],
});
// L4 = a^n b^p con n > p (el ejercicio no aclara si p puede ser 0: se deja a criterio). Cada b se empareja con una a;
// si sobra alguna a cuando se acaban las b, se acepta.
export const MT16D = mt({
  blank: "_", alphabet: ["a", "b", "c"], extra: ["A", "B"], states: ["q0", "q1", "q1b", "q2", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 A/A,D", "q0 q1 a/A,D",
    "q1 q1 a/a,D", "q1 q1b B/B,D", "q1 q2 b/B,I", "q1 f _/_,P",
    "q1b q1b B/B,D", "q1b q2 b/B,I", "q1b f _/_,P",
    "q2 q2 a/a,I", "q2 q2 B/B,I", "q2 q0 A/A,D",
  ],
});

// ───────── MT · ejercicio 17: Ejemplo 6.1, c^k d^k e^k ─────────
// Sin condiciones de error: lo que no tiene transición simplemente deja la máquina trabada.
export const MT61 = mt({
  alphabet: ["c", "d", "e"], extra: ["X", "Y", "Z"], states: ["p", "q", "r", "s", "t", "u", "z"], start: "p", accepting: ["z"],
  transitions: [
    "p q c/X,D",
    "q q c/c,D", "q q Y/Y,D", "q r d/Y,D",
    "r r d/d,D", "r r Z/Z,D", "r s e/Z,I",
    "s s c/c,I", "s s d/d,I", "s s Y/Y,I", "s s Z/Z,I", "s t X/X,D",
    "t q c/X,D", "t u Y/Y,D",
    "u u Y/Y,D", "u u Z/Z,D", "u z b/b,P",
  ],
});
export const MT61_ERROR = withErrorState(MT61, { symbols: ["c", "d", "e", "X", "Y", "Z", "b"] });

// ───────── MT · ejercicio 18: palíndromos con una pila (memoria LIFO) en la cinta ─────────
// Se copia la cadena a la derecha de un # (la "pila": el último símbolo copiado queda arriba, a la derecha) y después
// se compara cada símbolo de la entrada, de izquierda a derecha, con el tope, que se desapila.
export const MT18 = mt({
  alphabet: BITS, extra: ["#", "X", "Y", "M"],
  states: ["q0", "qr", "q1", "qa0", "qa1", "rw", "p0", "pa0", "pa1", "pb0", "pb1", "pr", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 0/0,D", "q0 q0 1/1,D", "q0 qr b/#,I",
    "qr qr 0/0,I", "qr qr 1/1,I", "qr qr X/X,I", "qr qr Y/Y,I", "qr qr #/#,I", "qr q1 b/b,D",
    "q1 q1 X/X,D", "q1 q1 Y/Y,D", "q1 qa0 0/X,D", "q1 qa1 1/Y,D", "q1 rw #/#,I",
    ...["0", "1"].flatMap((s) => [...["0", "1", "X", "Y", "#"].map((c) => `qa${s} qa${s} ${c}/${c},D`), `qa${s} qr b/${s},I`]),
    "rw rw X/X,I", "rw rw Y/Y,I", "rw p0 b/b,D",
    "p0 p0 M/M,D", "p0 pa0 X/M,D", "p0 pa1 Y/M,D", "p0 f #/#,P",
    ...["0", "1"].flatMap((s) => [...["0", "1", "X", "Y", "M", "#"].map((c) => `pa${s} pa${s} ${c}/${c},D`), `pa${s} pb${s} b/b,I`]),
    "pb0 pr 0/b,I", "pb1 pr 1/b,I",
    ...["0", "1", "X", "Y", "M", "#"].map((c) => `pr pr ${c}/${c},I`), "pr p0 b/b,D",
  ],
});

// ───────── MT · ejercicio 19: palíndromos de largo par en dos etapas ─────────
// Etapa 1: se marcan los extremos de a pares (A, B a la izquierda y C, D a la derecha) hasta encontrar la mitad.
// Etapa 2: se compara cada símbolo de la mitad izquierda con el de la derecha (de afuera hacia adentro).
export const MT19 = mt({
  alphabet: BITS, extra: ["A", "B", "C", "D", "M"],
  states: ["s0", "u", "v", "w", "gr", "g0", "ga0", "ga1", "gc0", "gc1", "f"], start: "s0", accepting: ["f"],
  transitions: [
    "s0 s0 A/A,D", "s0 s0 B/B,D", "s0 u 0/A,D", "s0 u 1/B,D", "s0 gr C/C,I", "s0 gr D/D,I", "s0 f b/b,P",
    ...["0", "1", "A", "B", "C", "D"].map((c) => `u u ${c}/${c},D`), "u v b/b,I",
    "v v C/C,I", "v v D/D,I", "v w 0/C,I", "v w 1/D,I",
    ...["0", "1", "A", "B", "C", "D"].map((c) => `w w ${c}/${c},I`), "w s0 b/b,D",
    ...["A", "B", "C", "D", "M"].map((c) => `gr gr ${c}/${c},I`), "gr g0 b/b,D",
    "g0 g0 M/M,D", "g0 ga0 A/M,D", "g0 ga1 B/M,D", "g0 f C/C,P", "g0 f D/D,P", "g0 f b/b,P",
    ...["0", "1"].flatMap((s) => [...["A", "B", "C", "D", "M"].map((c) => `ga${s} ga${s} ${c}/${c},D`), `ga${s} gc${s} b/b,I`]),
    "gc0 gc0 M/M,I", "gc0 gr C/M,I", "gc1 gc1 M/M,I", "gc1 gr D/M,I",
  ],
});

// ───────── MT · ejercicio 20: ordenar {0,1,2} sin movimiento neutro ─────────
function mt20() {
  const t = [];
  const syms = ["0", "1", "2"];
  for (const flag of ["u", "f"]) {
    for (const x of syms) {
      for (const y of syms) {
        if (y >= x) t.push(`${flag}${x} ${flag}${y} ${y}/${y},D`);
        else t.push(`${flag}${x} s${y}${x} ${y}/${x},I`);
      }
      t.push(flag === "u" ? `u${x} fin b/b,P` : `f${x} r b/b,I`);
    }
  }
  for (const [y, x] of [["0", "1"], ["0", "2"], ["1", "2"]]) t.push(`s${y}${x} f${x} ${x}/${y},D`);
  t.push("r r 0/0,I", "r r 1/1,I", "r r 2/2,I", "r u0 b/b,D");
  const states = ["u0", "u1", "u2", "f0", "f1", "f2", "s01", "s02", "s12", "r", "fin"];
  return mt({ alphabet: syms, states, start: "u0", accepting: ["fin"], transitions: t });
}
export const MT20 = mt20();

// ───────── MT · ejercicio 28: 00 por 11 y 11 por 00 ─────────
export const MT28 = mt({
  alphabet: BITS, states: ["q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7"], start: "q0", accepting: ["q7"],
  transitions: [
    "q0 q1 0/0,D", "q0 q2 1/1,D", "q0 q7 b/b,P",
    "q1 q3 0/1,I", "q1 q2 1/1,D", "q1 q7 b/b,P", "q3 q4 0/1,D", "q4 q0 1/1,D",
    "q2 q5 1/0,I", "q2 q1 0/0,D", "q2 q7 b/b,P", "q5 q6 1/0,D", "q6 q0 0/0,D",
  ],
});

// ───────── MT · ejercicio 29: copiar el nibble derecho sobre el izquierdo ─────────
export const MT29 = mt({
  alphabet: ["0", "1", "*"], extra: ["A", "B", "W", "X", "Y"],
  states: ["q0", "qa", "qb", "qL0", "qL1", "qr", "qr2", "qr3", "f"], start: "q0", accepting: ["f"],
  transitions: [
    "q0 q0 A/A,D", "q0 q0 B/B,D", "q0 qa 0/W,D", "q0 qa 1/W,D", "q0 qr */*,D",
    ...["0", "1", "A", "B"].map((c) => `qa qa ${c}/${c},D`), "qa qb */*,D",
    "qb qb X/X,D", "qb qb Y/Y,D", "qb qL0 0/X,I", "qb qL1 1/Y,I",
    ...["0", "1"].flatMap((t) => ["0", "1", "A", "B", "*", "X", "Y"].map((c) => `qL${t} qL${t} ${c}/${c},I`)),
    "qL0 q0 W/A,D", "qL1 q0 W/B,D",
    "qr qr X/0,D", "qr qr Y/1,D", "qr qr2 b/b,I",
    ...["0", "1", "*", "A", "B"].map((c) => `qr2 qr2 ${c}/${c},I`), "qr2 qr3 b/b,D",
    "qr3 qr3 A/0,D", "qr3 qr3 B/1,D", "qr3 f */*,P",
  ],
});

// ───────── MT · ejercicio 30: intercambiar dos bits entre nibbles ─────────
// Los nibbles ocupan las celdas 0 a 3 (primero), 4 (*) y 5 a 8 (segundo). Se intercambian las celdas (p1, q1) y (p2, q2), con
// p2 = p1 + 1 y q2 = q1 + 1: se lleva el símbolo contando pasos con estados y se lo cambia por el del otro lado.
const PASS = ["0", "1", "*"];
function swapMachine({ from1, from2 }) {
  const p = from1;
  const q = 5 + from2;
  const d = q - p;
  const t = [];
  const states = new Set();
  const add = (from, to, a, b, move) => { states.add(from); states.add(to); t.push(`${from} ${to} ${a}/${b},${move}`); };
  // Llegar a la celda p.
  for (let i = 0; i < p; i++) for (const s of BITS) add(`g${i}`, i + 1 === p ? "e1" : `g${i + 1}`, s, s, "D");
  const entry = p === 0 ? "e1" : "g0";
  for (const k of [1, 2]) {
    const e = `e${k}`;
    const done = k === 1 ? "e2" : "fin";
    for (const v of BITS) {
      // Ir hasta la celda q+(k-1) llevando v.
      let cur = e;
      for (let j = 1; j <= d; j++) {
        const next = j === d ? `at${k}${v}` : `f${k}${v}${j}`;
        for (const c of j === 1 ? [v] : PASS) add(cur, next, c, c, "D");
        cur = next;
      }
      // En q: leer w, escribir v y volver.
      for (const w of BITS) {
        let back = `ar${k}${w}`;
        if (d > 1) back = `b${k}${w}1`;
        add(`at${k}${v}`, back, w, v, "I");
      }
    }
    for (const w of BITS) {
      for (let j = 1; j < d; j++) {
        const next = j + 1 === d ? `ar${k}${w}` : `b${k}${w}${j + 1}`;
        for (const c of PASS) add(`b${k}${w}${j}`, next, c, c, "I");
      }
      // De vuelta en p: escribir w y seguir (k = 1: a la celda p+1; k = 2: parar).
      for (const c of BITS) add(`ar${k}${w}`, done, c, w, k === 1 ? "D" : "P");
    }
  }
  return mt({ alphabet: [...BITS, "*"], states: [...states], start: entry, accepting: ["fin"], transitions: t });
}
export const MT30A = swapMachine({ from1: 0, from2: 0 });
export const MT30B = swapMachine({ from1: 0, from2: 2 });
export const MT30C = swapMachine({ from1: 2, from2: 0 });
export const MT30D = swapMachine({ from1: 2, from2: 2 });

// ───────── MT · ejercicio 31 ─────────
// 31.a y 31.b son las tablas 6.13 y 6.14 de la guía (con el estado q5 como estado de error).
const T613 = [
  "q0 q1 1/A,D", "q0 q5 2/2,P", "q0 q5 3/3,P", "q0 q4 B/2,D",
  "q1 q1 1/1,D", "q1 q2 2/B,D", "q1 q5 3/3,P", "q1 q1 B/B,D", "q1 q5 C/C,P", "q1 q5 b/b,P",
  "q2 q5 1/1,P", "q2 q2 2/2,D", "q2 q3 3/C,I", "q2 q2 C/C,D", "q2 q5 b/b,P",
  "q3 q3 1/1,I", "q3 q3 2/2,I", "q3 q0 A/1,D", "q3 q3 B/B,I", "q3 q3 C/C,I",
  "q4 q5 1/1,P", "q4 q5 2/2,P", "q4 q5 3/3,P", "q4 q4 B/2,D", "q4 q4 C/3,D", "q4 q4 b/b,P",
];
export const MT31A = mt({ alphabet: ["1", "2", "3"], extra: ["A", "B", "C"], states: ["q0", "q1", "q2", "q3", "q4", "q5"], start: "q0", accepting: ["q4"], transitions: T613 });
// 31.b: basta con que haya por lo menos un 2 separando prefijo y sufijo de igual largo (tabla 6.14 de la guía).
// La tabla de la guía tiene una falla: q4 acepta cualquier 2 que aparezca después de los 3 (1232, 12322, …) porque
// q4 deja pasar los 2 en cualquier momento. Acá q4 pasa a q6 cuando restaura el primer 3 y q6 ya no admite 2.
const T614 = [
  "q0 q1 1/A,D", "q0 q5 2/2,P", "q0 q5 3/3,P", "q0 q4 B/2,D",
  "q1 q1 1/1,D", "q1 q2 2/B,D", "q1 q5 3/3,P", "q1 q2 B/B,D", "q1 q5 b/b,P",
  "q2 q5 1/1,P", "q2 q2 2/2,D", "q2 q3 3/C,I", "q2 q2 C/C,D", "q2 q5 b/b,P",
  "q3 q3 1/1,I", "q3 q3 2/2,I", "q3 q0 A/1,D", "q3 q3 B/B,I", "q3 q3 C/C,I",
  "q4 q5 1/1,P", "q4 q4 2/2,D", "q4 q5 3/3,P", "q4 q6 C/3,D",
  "q6 q6 C/3,D", "q6 q5 1/1,P", "q6 q5 2/2,P", "q6 q5 3/3,P", "q6 q4 b/b,P",
];
export const T614_GUIA = [...T614.slice(0, -9), "q4 q5 1/1,P", "q4 q4 2/2,D", "q4 q5 3/3,P", "q4 q4 C/3,D", "q4 q4 b/b,P"];
export const MT31B = mt({ alphabet: ["1", "2", "3"], extra: ["A", "B", "C"], states: ["q0", "q1", "q2", "q3", "q4", "q5", "q6"], start: "q0", accepting: ["q4"], transitions: T614 });
// La MT tal como está en la tabla 6.14 (con la falla): se usa en un test para mostrar que acepta 1232.
export const MT31B_GUIA = mt({ alphabet: ["1", "2", "3"], extra: ["A", "B", "C"], states: ["q0", "q1", "q2", "q3", "q4", "q5"], start: "q0", accepting: ["q4"], transitions: T614_GUIA });
// 31.c: 1^m 2^n 3^m 4^n. Etapa 1: cada 1 (A) se empareja con un 3 (C). Etapa 2: cada 2 (B) se empareja con un 4 (E).
export const MT31C = mt({
  alphabet: ["1", "2", "3", "4"], extra: ["A", "B", "C", "E"],
  states: ["qs", "q0", "q1", "q3", "q5", "q6", "q7", "q8", "f"], start: "qs", accepting: ["f"],
  transitions: [
    "qs q1 1/A,D", "q0 q1 1/A,D", "q0 q0 A/A,D", "q0 q6 2/B,D",
    "q1 q1 1/1,D", "q1 q1 2/2,D", "q1 q1 C/C,D", "q1 q3 3/C,I",
    "q3 q3 1/1,I", "q3 q3 2/2,I", "q3 q3 C/C,I", "q3 q0 A/A,D",
    "q6 q6 2/2,D", "q6 q6 C/C,D", "q6 q6 E/E,D", "q6 q7 4/E,I",
    "q7 q7 2/2,I", "q7 q7 C/C,I", "q7 q7 E/E,I", "q7 q5 B/B,D",
    "q5 q5 B/B,D", "q5 q6 2/B,D", "q5 q8 C/C,D",
    "q8 q8 C/C,D", "q8 q8 E/E,D", "q8 f b/b,P",
  ],
});

// ───────── MT · ejercicio 32 (6.32): α#α⁻¹ con α ∈ {0,1}⁺ ─────────
// El cabezal va hasta el separador # y de ahí compara hacia afuera: marca (X) el símbolo del prefijo más cercano a # y
// el que le corresponde del sufijo, yendo y viniendo. Al final verifica que todo quedó marcado: se acepta al llegar al blanco
// de la derecha (qd es de aceptación y ahí no hay transición, así que la máquina se detiene).
export const MT32 = mt({
  alphabet: ["0", "1", "#"], extra: ["X"], states: ["qs", "q0", "qL", "qa0", "qa1", "qc", "qd", "qE"], start: "qs", accepting: ["qd"],
  transitions: [
    "qs q0 0/0,D", "qs q0 1/1,D", "q0 q0 0/0,D", "q0 q0 1/1,D", "q0 qL #/#,I",
    "qL qL X/X,I", "qL qL #/#,I", "qL qa0 0/X,D", "qL qa1 1/X,D", "qL qc b/b,D",
    "qa0 qa0 X/X,D", "qa0 qa0 #/#,D", "qa0 qL 0/X,I", "qa1 qa1 X/X,D", "qa1 qa1 #/#,D", "qa1 qL 1/X,I",
    "qc qc X/X,D", "qc qd #/#,D", "qd qd X/X,D", "qd qE 0/0,P", "qd qE 1/1,P", "qd qE #/#,P",
  ],
});
