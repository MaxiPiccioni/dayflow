import { LAMBDA, unsuper } from "./notation.js";

// Operaciones con cadenas. Una cadena es un string de JS; la cadena vacía (λ) es "".
export const length = (word) => Array.from(word).length;
export const power = (word, n) => word.repeat(n);
export const concat = (a, b) => a + b;
export const reverse = (word) => Array.from(word).reverse().join("");

// Prefijos y sufijos propios, como en la guía: sin λ y sin la cadena completa.
export function properPrefixes(word) {
  const chars = Array.from(word);
  return Array.from({ length: Math.max(chars.length - 1, 0) }, (_, i) => chars.slice(0, i + 1).join(""));
}
export function properSuffixes(word) {
  const chars = Array.from(word);
  return Array.from({ length: Math.max(chars.length - 1, 0) }, (_, i) => chars.slice(chars.length - 1 - i).join(""));
}

// Todas las subcadenas (no vacías), sin repetir, en orden de posición inicial y luego de largo.
export function substrings(word) {
  const chars = Array.from(word);
  const seen = new Set();
  const out = [];
  for (let start = 0; start < chars.length; start++) {
    for (let end = start + 1; end <= chars.length; end++) {
      const sub = chars.slice(start, end).join("");
      if (!seen.has(sub)) { seen.add(sub); out.push(sub); }
    }
  }
  return out;
}

// Subcadenas que no son prefijos ni sufijos (ni la cadena completa), como pide el ejercicio 4.
export function innerSubstrings(word) {
  const skip = new Set([...properPrefixes(word), ...properSuffixes(word), word]);
  return substrings(word).filter((sub) => !skip.has(sub));
}

// Evalúa expresiones como (δ . α)^-1 o [(β . γ)^-1]^2 sobre un entorno { α: "aab", ... }.
// "." o "·" concatena (también la yuxtaposición); ^n es potencia y ^-1 es el reflejo.
export function evalStringExpr(source, env) {
  const text = unsuper(source.replace(/\s+/g, " ").trim());
  let pos = 0;
  const peek = () => text[pos];
  const skip = () => { while (text[pos] === " ") pos++; };
  const fail = (message) => { throw new Error(message); };

  function parsePostfix(value) {
    let current = value;
    for (;;) {
      skip();
      if (peek() !== "^") return current;
      pos++;
      skip();
      let raw;
      if (peek() === "(") {
        const close = text.indexOf(")", pos);
        if (close < 0) fail("Falta cerrar un paréntesis del exponente.");
        raw = text.slice(pos + 1, close).trim();
        pos = close + 1;
      } else {
        const m = /^-?\d+/.exec(text.slice(pos));
        if (!m) fail("Después de ^ va un número (por ejemplo ^2 o ^-1).");
        raw = m[0];
        pos += raw.length;
      }
      if (raw === "-1") current = reverse(current);
      else if (/^\d+$/.test(raw)) current = power(current, Number(raw));
      else fail(`Exponente no válido: ${raw}. Usá un número natural o -1 (reflejo).`);
    }
  }

  function parseAtom() {
    skip();
    const ch = peek();
    if (ch === "(" || ch === "[") {
      const closer = ch === "(" ? ")" : "]";
      pos++;
      const inner = parseExpr();
      skip();
      if (peek() !== closer) fail(`Falta cerrar con ${closer}.`);
      pos++;
      return inner;
    }
    if (ch === '"') {
      const end = text.indexOf('"', pos + 1);
      if (end < 0) fail("Falta cerrar las comillas.");
      const lit = text.slice(pos + 1, end);
      pos = end + 1;
      return lit === LAMBDA ? "" : lit;
    }
    if (ch === LAMBDA) { pos++; return ""; }
    const symbol = Array.from(text.slice(pos))[0];
    if (symbol && Object.hasOwn(env, symbol)) { pos += symbol.length; return env[symbol]; }
    return fail(symbol ? `No conozco el símbolo "${symbol}".` : "La expresión está incompleta.");
  }

  function parseExpr() {
    let acc = parsePostfix(parseAtom());
    for (;;) {
      skip();
      const next = peek();
      if (next === "." || next === "·") { pos++; acc += parsePostfix(parseAtom()); continue; }
      if (next === undefined || next === ")" || next === "]") return acc;
      acc += parsePostfix(parseAtom()); // yuxtaposición
    }
  }

  try {
    if (!text) return { error: "Escribí una expresión." };
    const value = parseExpr();
    if (pos < text.length) return { error: `Sobra "${text.slice(pos)}" al final.` };
    return { value };
  } catch (err) {
    return { error: err.message };
  }
}
