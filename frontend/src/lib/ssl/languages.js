import { LAMBDA, normalizeInput, unsuper } from "./notation.js";

const len = (word) => Array.from(word).length;

// Orden de la guía: por longitud creciente y, a igual longitud, por el orden del alfabeto dado (o el alfabético).
export function sortWords(words, order = null) {
  const rank = (word) => Array.from(word).map((ch) => { const i = order ? order.indexOf(ch) : -1; return i < 0 ? ch.codePointAt(0) + 1000 : i; });
  const cmp = (a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < Math.min(ra.length, rb.length); i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
    return 0;
  };
  return [...words].sort((a, b) => len(a) - len(b) || cmp(a, b));
}

export const MAX_WORDS = 5000;

// Σ* (o Σ+ si positive): todas las cadenas sobre el alfabeto hasta maxLen símbolos, por longitud creciente.
export function sigmaClosure(alphabet, maxLen, { positive = false, limit = MAX_WORDS } = {}) {
  const symbols = [...new Set(alphabet)];
  const out = positive ? [] : [""];
  let level = [""];
  for (let size = 1; size <= maxLen; size++) {
    const next = [];
    for (const word of level) {
      for (const symbol of symbols) {
        if (out.length + next.length >= limit) return { words: [...out, ...next], truncated: true };
        next.push(word + symbol);
      }
    }
    out.push(...next);
    level = next;
  }
  return { words: out, truncated: false };
}

export const unionSets = (a, b, order = null) => sortWords([...new Set([...a, ...b])], order);
export const intersectSets = (a, b) => { const second = new Set(b); return [...new Set(a)].filter((x) => second.has(x)); };

// Concatenación de lenguajes (no conmutativa): cada palabra de A seguida de cada palabra de B, hasta maxLen.
export function concatLanguages(a, b, maxLen) {
  const out = new Set();
  for (const x of a) for (const y of b) { const word = x + y; if (len(word) <= maxLen) out.add(word); }
  return sortWords([...out]);
}

// Potencia de un lenguaje: L^0 = {λ}, L^n = L^(n-1) . L.
export function powerLanguage(lang, n, maxLen) {
  let acc = [""];
  for (let i = 0; i < n; i++) acc = concatLanguages(acc, lang, maxLen);
  return acc;
}

// Clausura L* o clausura positiva L+ de un lenguaje, acotada por longitud.
export function closureLanguage(lang, maxLen, positive = false) {
  const base = lang.filter((w) => len(w) <= maxLen);
  const all = new Set(positive ? base : ["", ...base]);
  let frontier = [...all];
  while (frontier.length) {
    const fresh = concatLanguages(frontier, base, maxLen).filter((w) => !all.has(w));
    fresh.forEach((w) => all.add(w));
    frontier = fresh;
  }
  return sortWords([...all]);
}

// ---------- Fórmulas lingüísticas: 0^a 1^(2a) / a ≥ 0   (en las condiciones, "^" es "y") ----------

const VAR_LIMIT = 4;
const STEP_GUARD = 400000;

function tokenizeExpr(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/\d/.test(ch)) { let j = i; while (/\d/.test(text[j] ?? "")) j++; tokens.push({ t: "num", v: Number(text.slice(i, j)) }); i = j; continue; }
    if (/[a-z]/i.test(ch)) { tokens.push({ t: "var", v: ch }); i++; continue; }
    if ("+-*()".includes(ch)) { tokens.push({ t: ch }); i++; continue; }
    if (ch === "×" || ch === "·") { tokens.push({ t: "*" }); i++; continue; }
    throw new Error(`Símbolo no válido en la expresión: "${ch}".`);
  }
  return tokens;
}

// Expresión aritmética sobre variables: 2a, a+1, (n-1)*2. Devuelve un árbol evaluable.
function parseExpression(text) {
  const tokens = tokenizeExpr(text);
  let p = 0;
  const startsOperand = () => tokens[p] && (tokens[p].t === "num" || tokens[p].t === "var" || tokens[p].t === "(");
  function primary() {
    const tok = tokens[p];
    if (!tok) throw new Error("Falta un valor en la expresión.");
    if (tok.t === "num") { p++; return { k: "num", v: tok.v }; }
    if (tok.t === "var") { p++; return { k: "var", v: tok.v }; }
    if (tok.t === "(") {
      p++;
      const inner = sum();
      if (tokens[p]?.t !== ")") throw new Error("Falta cerrar un paréntesis.");
      p++;
      return inner;
    }
    if (tok.t === "-") { p++; return { k: "neg", e: primary() }; }
    throw new Error(`No esperaba "${tok.t}" ahí.`);
  }
  function product() {
    let left = primary();
    while (tokens[p]?.t === "*" || startsOperand()) {
      if (tokens[p].t === "*") p++;
      left = { k: "mul", a: left, b: primary() };
    }
    return left;
  }
  function sum() {
    let left = product();
    while (tokens[p]?.t === "+" || tokens[p]?.t === "-") {
      const op = tokens[p].t;
      p++;
      left = { k: op === "+" ? "add" : "sub", a: left, b: product() };
    }
    return left;
  }
  const ast = sum();
  if (p < tokens.length) throw new Error("Sobra algo al final de la expresión.");
  return ast;
}

function evalAst(ast, vars) {
  switch (ast.k) {
    case "num": return ast.v;
    case "var": return vars[ast.v];
    case "neg": return -evalAst(ast.e, vars);
    case "add": return evalAst(ast.a, vars) + evalAst(ast.b, vars);
    case "sub": return evalAst(ast.a, vars) - evalAst(ast.b, vars);
    default: return evalAst(ast.a, vars) * evalAst(ast.b, vars);
  }
}

function astVars(ast, set = new Set()) {
  if (ast.k === "var") set.add(ast.v);
  else for (const key of ["a", "b", "e"]) if (ast[key]) astVars(ast[key], set);
  return set;
}

// Parte izquierda: secuencia de factores  base^exp  con base = símbolo, λ o un grupo entre paréntesis.
function parseTerms(text) {
  const src = unsuper(text);
  let pos = 0;
  const skip = () => { while (/\s/.test(src[pos] ?? "")) pos++; };

  function parseExponent() {
    skip();
    if (src[pos] !== "^") return null;
    pos++;
    skip();
    if (src[pos] === "(") {
      let depth = 0;
      let end = pos;
      for (; end < src.length; end++) {
        if (src[end] === "(") depth++;
        if (src[end] === ")") { depth--; if (depth === 0) break; }
      }
      if (depth !== 0) throw new Error("Falta cerrar un paréntesis del exponente.");
      const inner = src.slice(pos + 1, end);
      pos = end + 1;
      return parseExpression(inner);
    }
    const m = /^(\d+|[a-z])/i.exec(src.slice(pos));
    if (!m) throw new Error("Después de ^ va un número, una variable o una expresión entre paréntesis.");
    pos += m[0].length;
    return parseExpression(m[0]);
  }

  function parseSeq(untilParen) {
    const factors = [];
    for (;;) {
      skip();
      const ch = src[pos];
      if (ch === undefined) {
        if (untilParen) throw new Error("Falta cerrar un paréntesis.");
        return factors;
      }
      if (ch === ")") {
        if (!untilParen) throw new Error("Hay un paréntesis de cierre de más.");
        pos++;
        return factors;
      }
      let base;
      if (ch === "(") { pos++; base = { group: parseSeq(true) }; }
      else if (ch === LAMBDA) { pos++; base = { lit: "" }; }
      else if (ch === "^") throw new Error("Un exponente necesita algo a su izquierda.");
      else { const symbol = Array.from(src.slice(pos))[0]; pos += symbol.length; base = { lit: symbol }; }
      factors.push({ ...base, exp: parseExponent() });
    }
  }
  return parseSeq(false);
}

function termVars(factors, set = new Set()) {
  for (const f of factors) { if (f.exp) astVars(f.exp, set); if (f.group) termVars(f.group, set); }
  return set;
}

function buildWord(factors, vars) {
  let out = "";
  for (const f of factors) {
    const count = f.exp ? evalAst(f.exp, vars) : 1;
    if (!Number.isInteger(count) || count < 0) return null;
    const unit = f.group ? buildWord(f.group, vars) : f.lit;
    if (unit === null) return null;
    out += unit.repeat(count);
  }
  return out;
}

const COMPARE = { "≥": (a, b) => a >= b, "≤": (a, b) => a <= b, ">": (a, b) => a > b, "<": (a, b) => a < b, "=": (a, b) => a === b, "≠": (a, b) => a !== b };

function parseConstraints(text) {
  const cleaned = normalizeInput(text).replace(/∧/g, "^").replace(/&/g, "^").replace(/\sy\s/gi, "^");
  return cleaned.split(/[\^,;]/).map((s) => s.trim()).filter(Boolean).map((piece) => {
    const m = /^(.*?)(≥|≤|≠|>|<|=)(.*)$/.exec(piece);
    if (!m) throw new Error(`No entiendo la condición "${piece}". Usá algo como n ≥ 0.`);
    return { left: parseExpression(m[1]), op: m[2], right: parseExpression(m[3]) };
  });
}

// "{ 0^a 1^(2a) / a ≥ 0 }" -> { factors, constraints, vars } o { error }.
export function parseFormula(source) {
  try {
    let text = normalizeInput(source).trim();
    text = text.replace(/^[A-Za-zΣ][A-Za-z0-9₀-₉]*\s*=\s*/, "").replace(/^\{/, "").replace(/\}$/, "").trim();
    const slash = text.search(/[/|]/);
    const left = slash < 0 ? text : text.slice(0, slash);
    const right = slash < 0 ? "" : text.slice(slash + 1);
    if (!left.trim()) return { error: "Falta la parte de la izquierda (por ejemplo 0^a 1^(2a))." };
    const factors = parseTerms(left);
    const constraints = parseConstraints(right);
    const vars = new Set(termVars(factors));
    constraints.forEach((c) => { astVars(c.left, vars); astVars(c.right, vars); });
    if (vars.size > VAR_LIMIT) return { error: `Demasiadas variables (${[...vars].join(", ")}). El máximo es ${VAR_LIMIT}.` };
    return { factors, constraints, vars: [...vars].sort() };
  } catch (err) {
    return { error: err.message };
  }
}

// Enumera las cadenas de la fórmula en orden creciente de longitud: { words, truncated, vars } o { error }.
export function enumerateFormula(source, { maxLen = 24, limit = 60, maxVar = 24 } = {}) {
  const parsed = parseFormula(source);
  if (parsed.error) return { error: parsed.error };
  const { factors, constraints, vars } = parsed;
  const words = new Set();
  const values = {};
  let steps = 0;
  const walk = (index) => {
    if (steps > STEP_GUARD) return;
    if (index === vars.length) {
      steps++;
      if (!constraints.every((c) => COMPARE[c.op](evalAst(c.left, values), evalAst(c.right, values)))) return;
      const word = buildWord(factors, values);
      if (word !== null && len(word) <= maxLen) words.add(word);
      return;
    }
    for (let value = 0; value <= maxVar; value++) { values[vars[index]] = value; walk(index + 1); }
  };
  walk(0);
  const sorted = sortWords([...words]);
  return { words: sorted.slice(0, limit), truncated: sorted.length > limit || steps > STEP_GUARD, vars };
}

// ¿La cadena pertenece al lenguaje de la fórmula? (se busca hasta la longitud de la cadena)
export function formulaContains(source, word) {
  const result = enumerateFormula(source, { maxLen: len(word), limit: Infinity, maxVar: Math.max(len(word), 1) });
  if (result.error) return { error: result.error };
  return { value: result.words.includes(word) };
}
