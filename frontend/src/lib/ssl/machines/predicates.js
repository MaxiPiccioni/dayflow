import { compileRegex } from "../regex.js";
import { generateLanguage, parseGrammar } from "../grammar.js";

// Lenguajes esperados de los ejercicios de diseño. Cada predicado recibe una cadena y devuelve
// true (debe aceptarse), false (debe rechazarse) o null (la guía admite las dos cosas, por ejemplo λ).

const count = (word, symbol) => Array.from(word).filter((s) => s === symbol).length;
const regexCache = new Map();
const grammarCache = new Map();

function regexPredicate(source) {
  if (!regexCache.has(source)) {
    const compiled = compileRegex(source);
    if (compiled.error) throw new Error(compiled.error);
    regexCache.set(source, compiled.test);
  }
  return regexCache.get(source);
}

function grammarWords(fields, maxLen) {
  const key = `${JSON.stringify(fields)}|${maxLen}`;
  if (!grammarCache.has(key)) {
    const parsed = parseGrammar(fields);
    if (parsed.error) throw new Error(parsed.error);
    grammarCache.set(key, new Set(generateLanguage(parsed.grammar, maxLen).words));
  }
  return grammarCache.get(key);
}

// Cadenas de un solo tipo de símbolo repetido, etc.: se escriben con funciones chicas.
export const PREDICATES = {
  // Cantidad de un símbolo par o impar. zeroOptional: la guía deja sin decidir las cadenas sin ese símbolo.
  "count-parity": (w, { symbol, parity, zeroOptional = false, emptyOptional = false }) => {
    if (w === "" && emptyOptional) return null;
    const n = count(w, symbol);
    if (zeroOptional && n === 0) return null;
    return parity === "odd" ? n % 2 === 1 : n % 2 === 0;
  },
  "length-parity": (w, { parity, emptyOptional = false }) => {
    if (w === "" && emptyOptional) return null;
    return parity === "odd" ? Array.from(w).length % 2 === 1 : Array.from(w).length % 2 === 0;
  },
  // Cadenas de exactamente 4 bits con una condición.
  "bits4-first-last": (w) => Array.from(w).length === 4 && w[0] === w[3],
  "bits4-second-third": (w) => Array.from(w).length === 4 && w[1] === w[2],
  "bits4-two-two": (w) => Array.from(w).length === 4 && w.slice(0, 2) === w.slice(2),
  // Sin subcadenas prohibidas (ejercicio 5).
  "avoid-factors": (w, { factors, emptyOptional = false }) => {
    if (w === "" && emptyOptional) return null;
    return !factors.some((f) => w.includes(f));
  },
  "regex": (w, { regex, emptyOptional = false }) => {
    if (w === "" && emptyOptional) return null;
    return regexPredicate(regex)(w);
  },
  // Empieza con a, termina con b y no contiene aaa (ejercicio 8).
  "a-b-no-aaa": (w) => w.length >= 2 && w[0] === "a" && w[w.length - 1] === "b" && !w.includes("aaa"),
  // Cadenas generadas por una gramática (hasta maxLen).
  "grammar": (w, { grammar, maxLen = 8 }) => grammarWords(grammar, maxLen).has(w),
  // Paréntesis balanceados (un solo tipo de par o varios, bien anidados).
  "balanced": (w, { pairs = ["()"], nonEmpty = true }) => {
    if (w === "") return !nonEmpty;
    const open = new Map(pairs.map((p) => [p[0], p[1]]));
    const close = new Set(pairs.map((p) => p[1]));
    const stack = [];
    for (const ch of w) {
      if (open.has(ch)) stack.push(open.get(ch));
      else if (close.has(ch)) { if (stack.pop() !== ch) return false; } else return false;
    }
    return stack.length === 0;
  },
  // a^i b^j con una relación entre i y j (> , < , =), i, j >= 1.
  "ab-relation": (w, { relation }) => {
    const m = /^(a+)(b+)$/.exec(w);
    if (!m) return false;
    const [i, j] = [m[1].length, m[2].length];
    return relation === ">" ? i > j : relation === "<" ? i < j : i === j;
  },
};

// Predicado de una especificación: { predicate: "id", params }.
export function predicateOf(spec) {
  const fn = PREDICATES[spec.predicate];
  if (!fn) throw new Error(`Predicado desconocido: ${spec.predicate}`);
  return (word) => fn(word, spec.params ?? {});
}

// Funciones de salida esperada de las máquinas de Turing que calculan (id → entrada → salida | null si no aplica).
export const OUTPUTS = {
  // Ejercicio 6: graba P si la cantidad de símbolos es par e I si es impar.
  "length-parity-letter": (input) => `${input}${Array.from(input).length % 2 === 0 ? "P" : "I"}`,
  // Ejercicio 7: graba P si la cantidad de ceros es par e I si es impar.
  "zeros-parity-letter": (input) => `${input}${count(input, "0") % 2 === 0 ? "P" : "I"}`,
  // Ejercicio 8: si hay una cantidad par de unos, niega la cadena; si no, la deja como está.
  "negate-if-even-ones": (input) => (count(input, "1") % 2 === 0 ? Array.from(input).map((s) => (s === "0" ? "1" : "0")).join("") : input),
  // Ejercicio 9: BA por FG y DE por HI.
  "substitute-ba-de": (input) => input.replaceAll("BA", "FG").replaceAll("DE", "HI"),
  // Ejercicio 10: la imagen refleja después del *.
  "mirror-after-star": (input) => {
    const [left] = input.split("*");
    return `${left}*${Array.from(left).reverse().join("")}`;
  },
  // Ejercicio 13: intercambia los dos nibbles.
  "swap-nibbles": (input) => { const [a, b] = input.split("*"); return `${b}*${a}`; },
  // Ejercicio 12: copia el primer nibble sobre el segundo.
  "copy-first-nibble": (input) => { const [a] = input.split("*"); return `${a}*${a}`; },
  // Ejercicio 14: ordena los bits y los graba después del *.
  "sort-after-star": (input) => {
    const [bits] = input.split("*");
    return `${bits}*${Array.from(bits).sort().join("")}`;
  },
  // ALA ejercicio 3: reemplaza cada 00 por 11 (de izquierda a derecha, sin superponer).
  "replace-00-by-11": (input) => input.replaceAll("00", "11"),
  // ALA ejercicio 4: ordena en forma creciente los símbolos binarios.
  "sort-bits": (input) => Array.from(input).sort().join(""),
  // Ejercicio 28: 00 por 11 y 11 por 00 (de izquierda a derecha, sin superponer).
  "swap-00-11": (input) => input.replaceAll(/00|11/g, (m) => (m === "00" ? "11" : "00")),
  // Ejercicio 29: copia el nibble de la derecha sobre el de la izquierda.
  "copy-second-nibble": (input) => { const [, b] = input.split("*"); return `${b}*${b}`; },
  // Ejercicio 30: intercambios parciales de bits entre nibbles ([nibble1 bits, nibble2 bits] por posiciones).
  "swap-bits": (input, { from1, from2 }) => {
    const [a, b] = input.split("*").map((x) => Array.from(x));
    const [x1, x2] = [a.slice(from1, from1 + 2), b.slice(from2, from2 + 2)];
    a.splice(from1, 2, ...x2);
    b.splice(from2, 2, ...x1);
    return `${a.join("")}*${b.join("")}`;
  },
  // ALA ejercicio 26: reemplaza el número por su recíproca (la cadena al revés).
  "reverse": (input) => Array.from(input).reverse().join(""),
};
