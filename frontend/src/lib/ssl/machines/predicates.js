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
  // a^i b^j con una relación entre i y j (> , < , =), i, j >= 1 (con bOptionalZero, j = 0 queda a criterio).
  "ab-relation": (w, { relation, bOptionalZero = false }) => {
    const m = /^(a+)(b*)$/.exec(w);
    if (!m) return false;
    const [i, j] = [m[1].length, m[2].length];
    if (j === 0) return bOptionalZero ? null : false;
    return relation === ">" ? i > j : relation === "<" ? i < j : i === j;
  },
  // x^n y^n con n >= min (por ejemplo ( ) o 0^n 1^n).
  "blocks-equal": (w, { x, y, min = 1 }) => {
    const n = Array.from(w).length / 2;
    return Number.isInteger(n) && n >= min && w === x.repeat(n) + y.repeat(n);
  },
  // 0^n 1 0^n con n >= 1 (el símbolo del medio puede ser otro).
  "sym-mid-sym": (w, { side, mid, min = 1 }) => {
    const n = (Array.from(w).length - 1) / 2;
    return Number.isInteger(n) && n >= min && w === side.repeat(n) + mid + side.repeat(n);
  },
  // a^p b^n c^p con p >= 1 y n >= 1.
  "a-b-c-outer": (w, { a, b, c }) => {
    const m = new RegExp(`^(${a}+)(${b}+)(${c}+)$`).exec(w);
    return !!m && m[1].length === m[3].length;
  },
  // x^n y^(k n) con n >= 1.
  "ratio-blocks": (w, { x, y, ratio, min = 1 }) => {
    const m = new RegExp(`^(${x}+)(${y}+)$`).exec(w);
    return !!m && m[1].length >= min && m[2].length === ratio * m[1].length;
  },
  // Bytes (8 bits): primeros cuatro y últimos cuatro.
  "byte-ones-equal": (w) => Array.from(w).length === 8 && count(w.slice(0, 4), "1") === count(w.slice(4), "1"),
  "byte-zeros-ones": (w) => Array.from(w).length === 8 && count(w.slice(0, 4), "0") === count(w.slice(4), "1"),
  "byte-mirror": (w) => Array.from(w).length === 8 && w.slice(4) === Array.from(w.slice(0, 4)).reverse().join(""),
  "byte-mirror-neg": (w) => Array.from(w).length === 8 && w.slice(4) === Array.from(w.slice(0, 4)).reverse().map((b) => (b === "0" ? "1" : "0")).join(""),
  // Dos nibbles separados por * (las cadenas que no tienen esa forma quedan a criterio de la guía).
  "nibbles-star": (w, { rel }) => {
    const m = /^([01]{4})\*([01]{4})$/.exec(w);
    if (!m) return null;
    const [a, b] = [m[1], m[2]];
    if (rel === "ones-equal") return count(a, "1") === count(b, "1");
    if (rel === "ones-zeros") return count(a, "1") === count(b, "0");
    if (rel === "mirror") return a === Array.from(b).reverse().join("");
    return a === Array.from(b).reverse().map((x) => (x === "0" ? "1" : "0")).join("");
  },
  // Paréntesis (), corchetes [] y llaves {} ordenados jerárquicamente: ( dentro de [ dentro de {.
  "hier-balanced": (w, { emptyOptional = true }) => {
    if (w === "") return emptyOptional ? null : false;
    const rank = { "(": 1, "[": 2, "{": 3 };
    const close = { ")": "(", "]": "[", "}": "{" };
    const stack = [];
    for (const ch of w) {
      if (rank[ch]) { if (stack.length && rank[stack[stack.length - 1]] <= rank[ch]) return false; stack.push(ch); }
      else if (close[ch]) { if (stack.pop() !== close[ch]) return false; }
      else return false;
    }
    return stack.length === 0;
  },
  // Unidad 6: cantidad par de ceros y par de unos a la vez.
  "even-zeros-even-ones": (w, { emptyOptional = true }) => {
    if (w === "" && emptyOptional) return null;
    return count(w, "0") % 2 === 0 && count(w, "1") % 2 === 0;
  },
  // Bytes αα con α de cuatro bits.
  "byte-double": (w) => Array.from(w).length === 8 && w.slice(0, 4) === w.slice(4),
  // Palíndromos (parity: "even" | "odd" | "any"); la cadena vacía queda a criterio con emptyOptional.
  "palindrome": (w, { parity = "any", emptyOptional = false }) => {
    if (w === "" && emptyOptional) return null;
    const chars = Array.from(w);
    if (parity === "even" && chars.length % 2 !== 0) return false;
    if (parity === "odd" && chars.length % 2 !== 1) return false;
    return chars.join("") === chars.reverse().join("");
  },
  // x^n y^n z^n con n >= 1.
  "triple-blocks": (w, { x, y, z }) => {
    const n = Array.from(w).length / 3;
    return Number.isInteger(n) && n >= 1 && w === x.repeat(n) + y.repeat(n) + z.repeat(n);
  },
  // 1^m 2^n 3^m 4^n con m, n >= 1.
  "abab-blocks": (w, { a, b, c, d }) => {
    const m = new RegExp(`^(${a}+)(${b}+)(${c}+)(${d}+)$`).exec(w);
    return !!m && m[1].length === m[3].length && m[2].length === m[4].length;
  },
  // Dos palabras binarias iguales separadas por * (ejercicio 11).
  "equal-star": (w) => /^([01]*)\*\1$/.test(w),
  // α#α⁻¹ con α en {0,1}⁺ (ejercicio 32).
  "reverse-hash": (w) => { const m = /^([01]+)#([01]+)$/.exec(w); return !!m && m[2] === Array.from(m[1]).reverse().join(""); },
  // Misma cantidad de ceros y de unos (ejercicio 15).
  "equal-count": (w, { emptyOptional = true }) => {
    if (w === "" && emptyOptional) return null;
    return count(w, "0") === count(w, "1");
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

// Conjuntos de cadenas de prueba para los lenguajes con estructura fija (evitan recorrer todas las cadenas de un alfabeto grande).
export const GENERATORS = {
  // Todas las cadenas x*y con x e y de cuatro bits, más algunas mal formadas.
  nibbles: () => {
    const bits = [];
    for (let n = 0; n < 16; n++) bits.push(n.toString(2).padStart(4, "0"));
    const out = [];
    for (const a of bits) for (const b of bits) out.push(`${a}*${b}`);
    out.push("", "*", "0101", "0101*", "*0101", "01*0101", "0101*010", "01010101", "0101**0101", "1*1", "0101*01010");
    return out;
  },
};
