import { LAMBDA, normalizeInput } from "./notation.js";
import { sortWords } from "./languages.js";

// Expresiones regulares con la notación de la cátedra: "+" es la unión, la yuxtaposición es la concatenación,
// "*" es la clausura de Kleene y "⁺" la clausura positiva. λ es la cadena vacía.

const chars = (text) => Array.from(text);
const SPECIAL = new Set(["+", "|", "*", "⁺", "(", ")"]);

// Árbol: { t: "sym"|"empty"|"cat"|"alt"|"star"|"plus", ... }
export function parseRegex(source) {
  const text = chars(normalizeInput(source).replace(/\s+/g, ""));
  if (!text.length) return { error: "Escribí una expresión regular." };
  let pos = 0;

  function fail(message) { throw new Error(message); }

  function union() {
    const parts = [concat()];
    while (text[pos] === "+" || text[pos] === "|") {
      pos++;
      if (pos >= text.length || text[pos] === ")" || text[pos] === "+" || text[pos] === "|") fail('Después de "+" falta una expresión. (La clausura positiva se escribe con ⁺.)');
      parts.push(concat());
    }
    return parts.length === 1 ? parts[0] : { t: "alt", parts };
  }

  function concat() {
    const parts = [];
    while (pos < text.length && text[pos] !== ")" && text[pos] !== "+" && text[pos] !== "|") parts.push(postfix());
    if (!parts.length) fail("Falta una expresión (hay una unión o un paréntesis vacío).");
    return parts.length === 1 ? parts[0] : { t: "cat", parts };
  }

  function postfix() {
    let node = atom();
    while (text[pos] === "*" || text[pos] === "⁺") { node = { t: text[pos] === "*" ? "star" : "plus", e: node }; pos++; }
    return node;
  }

  function atom() {
    const ch = text[pos];
    if (ch === "(") {
      pos++;
      const inner = union();
      if (text[pos] !== ")") fail("Falta cerrar un paréntesis.");
      pos++;
      return inner;
    }
    if (ch === "*" || ch === "⁺") fail(`El ${ch} necesita algo a su izquierda.`);
    if (SPECIAL.has(ch)) fail(`No esperaba "${ch}" en esa posición.`);
    pos++;
    return ch === LAMBDA ? { t: "empty" } : { t: "sym", v: ch };
  }

  try {
    const tree = union();
    if (pos < text.length) fail(`Sobra "${text.slice(pos).join("")}" al final (¿un paréntesis de cierre de más?).`);
    return { tree, alphabet: [...new Set(symbols(tree))].sort() };
  } catch (err) {
    return { error: err.message };
  }
}

function symbols(node) {
  switch (node.t) {
    case "sym": return [node.v];
    case "empty": return [];
    case "star":
    case "plus": return symbols(node.e);
    default: return node.parts.flatMap(symbols);
  }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function toSource(node) {
  switch (node.t) {
    case "sym": return escapeRe(node.v);
    case "empty": return "(?:)";
    case "cat": return node.parts.map((p) => `(?:${toSource(p)})`).join("");
    case "alt": return `(?:${node.parts.map(toSource).join("|")})`;
    case "star": return `(?:${toSource(node.e)})*`;
    default: return `(?:${toSource(node.e)})+`;
  }
}

// Función que dice si una cadena pertenece al lenguaje de la expresión.
export function compileRegex(source) {
  const parsed = parseRegex(source);
  if (parsed.error) return parsed;
  const re = new RegExp(`^(?:${toSource(parsed.tree)})$`, "u");
  return { ...parsed, test: (word) => re.test(word) };
}

// Primeras `count` cadenas del lenguaje en orden creciente de longitud (probando todas las cadenas sobre su alfabeto).
export function enumerateRegex(source, { count = 10, maxLen = 12, alphabet = null, cap = 30000 } = {}) {
  const compiled = compileRegex(source);
  if (compiled.error) return compiled;
  const symbolsUsed = alphabet ?? compiled.alphabet;
  const words = [];
  let level = [""];
  let seen = 0;
  for (let size = 0; size <= maxLen && words.length < count; size++) {
    for (const w of level) if (compiled.test(w)) { words.push(w); if (words.length >= count) break; }
    if (words.length >= count) break;
    const next = [];
    for (const w of level) for (const s of symbolsUsed) { next.push(w + s); }
    seen += next.length;
    if (seen > cap) return { words, truncated: true, alphabet: symbolsUsed };
    level = next;
  }
  return { words: sortWords(words, symbolsUsed), truncated: false, alphabet: symbolsUsed };
}

// ¿Dos expresiones denotan el mismo lenguaje? Se comparan todas las cadenas sobre el alfabeto hasta maxLen.
export function compareRegex(a, b, alphabet, maxLen = 8) {
  const ra = compileRegex(a);
  const rb = compileRegex(b);
  if (ra.error) return { error: ra.error };
  if (rb.error) return { error: rb.error };
  let level = [""];
  for (let size = 0; size <= maxLen; size++) {
    for (const w of level) if (ra.test(w) !== rb.test(w)) return { equal: false, counterexample: w, inFirst: ra.test(w) };
    level = level.flatMap((w) => alphabet.map((s) => w + s));
  }
  return { equal: true, maxLen };
}
