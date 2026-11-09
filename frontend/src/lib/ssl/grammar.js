import { LAMBDA, normalizeInput } from "./notation.js";
import { sortWords } from "./languages.js";

// Gramática G = (ΣT, ΣN, S, P). Los símbolos son un solo carácter; una parte derecha vacía es λ ("").
// { terminals: string[], nonterminals: string[], axiom: string, productions: [{ lhs, rhs }] }

const chars = (text) => Array.from(text);
const isUpper = (ch) => /^\p{Lu}$/u.test(ch);
const splitSymbols = (text) => chars(normalizeInput(text).replace(/[{}()]/g, " ").replace(/[\s,;]+/g, ""));
const unique = (list) => [...new Set(list)];

// Lee los campos del editor. ΣT, ΣN y el axioma se infieren si se dejan vacíos
// (mayúsculas = no terminales, el resto = terminales, axioma = S o la primera parte izquierda).
export function parseGrammar({ terminals = "", nonterminals = "", axiom = "", productions = "" }) {
  const text = normalizeInput(productions)
    .replace(/^\s*[A-Za-z]\w*[′'₀-₉]*\s*=\s*\{/, "{")
    .replace(/^\s*\{/, "")
    .replace(/\}\s*$/, "");
  const chunks = text.split(/[\n;,]/).map((c) => c.trim()).filter(Boolean);
  if (!chunks.length) return { error: "Escribí al menos una producción, por ejemplo S := aA | b." };

  const rules = [];
  for (const chunk of chunks) {
    const m = /^(.*?)(::=|:=|→|=)(.*)$/.exec(chunk);
    if (!m) return { error: `No entiendo "${chunk}". Cada producción lleva := (por ejemplo S := aA | b).` };
    const lhs = m[1].replace(/\s+/g, "");
    if (!lhs) return { error: `Falta la parte izquierda en "${chunk}".` };
    for (const alt of m[3].split("|")) {
      const rhs = alt.replace(/\s+/g, "");
      if (!rhs) return { error: `Hay una alternativa vacía en "${chunk}". Para la cadena vacía escribí λ.` };
      rules.push({ lhs: lhs === LAMBDA ? "" : lhs, rhs: rhs === LAMBDA ? "" : rhs });
    }
  }
  if (rules.some((r) => r.lhs === "")) return { error: "La parte izquierda de una producción no puede ser λ." };

  const used = unique(rules.flatMap((r) => chars(r.lhs + r.rhs)));
  const declaredN = splitSymbols(nonterminals);
  const declaredT = splitSymbols(terminals);
  const ntSet = declaredN.length ? new Set(declaredN) : new Set(used.filter(isUpper));
  const tSet = declaredT.length ? new Set(declaredT) : new Set(used.filter((ch) => !ntSet.has(ch) && ch !== LAMBDA));

  const both = [...tSet].filter((s) => ntSet.has(s));
  if (both.length) return { error: `El símbolo ${both.join(", ")} no puede ser terminal y no terminal a la vez.` };
  const unknown = used.filter((s) => !tSet.has(s) && !ntSet.has(s));
  if (unknown.length) return { error: `El símbolo ${unique(unknown).join(", ")} aparece en las producciones pero no está en ΣT ni en ΣN.` };

  for (const rule of rules) {
    if (!chars(rule.lhs).some((s) => ntSet.has(s))) return { error: `La parte izquierda "${rule.lhs}" tiene que contener algún no terminal.` };
  }

  const declaredAxiom = splitSymbols(axiom)[0];
  const firstNt = chars(rules[0].lhs).find((s) => ntSet.has(s));
  const start = declaredAxiom ?? (ntSet.has("S") ? "S" : firstNt);
  if (!ntSet.has(start)) return { error: `El axioma ${start} tiene que ser un no terminal.` };

  return {
    grammar: {
      terminals: [...tSet],
      nonterminals: [...ntSet],
      axiom: start,
      productions: dedupeRules(rules),
    },
  };
}

function dedupeRules(rules) {
  const seen = new Set();
  return rules.filter((r) => { const key = `${r.lhs}\u0000${r.rhs}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

export const showForm = (form) => (form === "" ? LAMBDA : form);
export const formatRule = (rule) => `${rule.lhs} := ${showForm(rule.rhs)}`;

// Producciones agrupadas por parte izquierda: "S := aA | b".
export function groupRules(productions) {
  const groups = new Map();
  for (const { lhs, rhs } of productions) {
    if (!groups.has(lhs)) groups.set(lhs, []);
    groups.get(lhs).push(rhs);
  }
  return groups;
}
export const formatProductions = (productions) => [...groupRules(productions)].map(([lhs, rhss]) => `${lhs} := ${rhss.map(showForm).join(" | ")}`).join("\n");
export const formatSet = (symbols) => `{${symbols.join(", ")}}`;
export const formatGrammar = (g, name = "G", pname = "P") => `${name} = (${formatSet(g.terminals)}, ${formatSet(g.nonterminals)}, ${g.axiom}, ${pname})\n${pname} = {${[...groupRules(g.productions)].map(([lhs, rhss]) => `${lhs} := ${rhss.map(showForm).join(" | ")}`).join(", ")}}`;

// Para volver a cargar una gramática en los campos del editor.
export const grammarToFields = (g) => ({
  terminals: g.terminals.join(", "),
  nonterminals: g.nonterminals.join(", "),
  axiom: g.axiom,
  productions: formatProductions(g.productions),
});

// ---------- Clasificación de Chomsky ----------

export const CHOMSKY = {
  0: "Tipo 0 · Gramática estructurada por frases",
  1: "Tipo 1 · Gramática dependiente del contexto",
  2: "Tipo 2 · Gramática independiente del contexto",
  3: "Tipo 3 · Gramática regular",
};

// ¿La regla l := r tiene la forma αAβ := αγβ con A no terminal y γ no vacío? (tipo 1)
function keepsContext(rule, ntSet) {
  const l = chars(rule.lhs);
  const r = chars(rule.rhs);
  for (let i = 0; i < l.length; i++) {
    if (!ntSet.has(l[i])) continue;
    const alpha = l.slice(0, i);
    const beta = l.slice(i + 1);
    if (r.length - alpha.length - beta.length < 1) continue;
    if (alpha.every((s, k) => r[k] === s) && beta.every((s, k) => r[r.length - beta.length + k] === s)) return true;
  }
  return false;
}

// Mejor tipo que cumple una regla: "3R" (lineal por derecha), "3L" (por izquierda), 2, 1 o 0.
function ruleKinds(rule, g, axiomInRhs) {
  const ntSet = new Set(g.nonterminals);
  const tSet = new Set(g.terminals);
  const l = chars(rule.lhs);
  const r = chars(rule.rhs);
  const kinds = new Set([0]);
  const single = l.length === 1 && ntSet.has(l[0]);
  if (single) {
    kinds.add(2);
    if (r.length === 0 || (r.length === 1 && tSet.has(r[0])) || (r.length === 2 && tSet.has(r[0]) && ntSet.has(r[1]))) kinds.add("3R");
    if (r.length === 0 || (r.length === 1 && tSet.has(r[0])) || (r.length === 2 && ntSet.has(r[0]) && tSet.has(r[1]))) kinds.add("3L");
  }
  if (r.length === 0) { if (rule.lhs === g.axiom && !axiomInRhs) kinds.add(1); }
  else if (keepsContext(rule, ntSet)) kinds.add(1);
  return kinds;
}

// Tipo de la gramática según la clasificación de Chomsky, con la razón. type: 0..3, side: "derecha" | "izquierda" | null.
export function classify(g) {
  const axiomInRhs = g.productions.some((p) => chars(p.rhs).includes(g.axiom));
  const kinds = g.productions.map((rule) => ({ rule, kinds: ruleKinds(rule, g, axiomInRhs) }));
  const all = (pred) => kinds.every(({ kinds: k }) => pred(k));
  const offenders = (pred) => kinds.filter(({ kinds: k }) => !pred(k)).map(({ rule }) => formatRule(rule));
  const list = (items) => items.slice(0, 4).join(", ") + (items.length > 4 ? "…" : "");

  if (all((k) => k.has("3R"))) {
    return { type: 3, side: "derecha", name: `${CHOMSKY[3]} por derecha`, reasons: ["Todas las producciones son de la forma A := aB o A := a (un terminal seguido, a lo sumo, de un no terminal), por eso es lineal por derecha."] };
  }
  if (all((k) => k.has("3L"))) {
    return { type: 3, side: "izquierda", name: `${CHOMSKY[3]} por izquierda`, reasons: ["Todas las producciones son de la forma A := Ba o A := a (un no terminal seguido de un terminal), por eso es lineal por izquierda."] };
  }
  if (all((k) => k.has(2))) {
    const why = [];
    const mixed = all((k) => k.has("3R") || k.has("3L"));
    if (mixed) why.push("Todas las producciones son regulares, pero algunas son por derecha y otras por izquierda: mezclar los dos sentidos ya no es tipo 3.");
    else why.push(`No es tipo 3 porque ${list(offenders((k) => k.has("3R") || k.has("3L")))} no tiene la forma A := aB, A := Ba ni A := a.`);
    why.push("Todas las partes izquierdas son un único no terminal, por eso es independiente del contexto.");
    return { type: 2, side: null, name: CHOMSKY[2], reasons: why };
  }
  if (all((k) => k.has(1))) {
    return {
      type: 1,
      side: null,
      name: CHOMSKY[1],
      reasons: [
        `No es tipo 2 porque ${list(offenders((k) => k.has(2)))} tiene más de un símbolo a la izquierda.`,
        "Todas las producciones tienen la forma αAβ := αγβ: se reemplaza un no terminal sin tocar su contexto α, β, y γ no es vacío.",
      ],
    };
  }
  return {
    type: 0,
    side: null,
    name: CHOMSKY[0],
    reasons: [`${list(offenders((k) => k.has(1)))} no conserva el contexto (αAβ := αγβ con γ no vacío), así que la gramática no es de tipo 1.`],
  };
}

// ---------- Derivaciones ----------

const MAX_STATES = 60000;
const isContextFree = (g) => g.productions.every((p) => chars(p.lhs).length === 1);
const isContracting = (g) => g.productions.some((p) => chars(p.rhs).length < chars(p.lhs).length);

// Todos los pasos directos desde una forma sentencial: { form, prod, pos }.
export function successors(g, form, { leftmost = false } = {}) {
  const out = [];
  g.productions.forEach((rule, prod) => {
    let from = 0;
    for (;;) {
      const pos = form.indexOf(rule.lhs, from);
      if (pos < 0) break;
      out.push({ form: form.slice(0, pos) + rule.rhs + form.slice(pos + rule.lhs.length), prod, pos });
      from = pos + 1;
    }
  });
  if (!leftmost || !out.length) return out;
  const first = Math.min(...out.map((s) => s.pos));
  return out.filter((s) => s.pos === first);
}

const allTerminals = (form, g) => chars(form).every((s) => g.terminals.includes(s));

// Lenguaje generado hasta maxLen símbolos: { words, truncated, approximate, derivations } (derivations: palabra -> camino más corto).
export function generateLanguage(g, maxLen = 8, { maxStates = MAX_STATES } = {}) {
  const slack = isContracting(g) || g.productions.some((p) => p.rhs === "") ? 4 : 0;
  const cap = maxLen + slack;
  const start = g.axiom;
  const parent = new Map([[start, null]]);
  let frontier = [start];
  const words = [];
  let truncated = false;
  while (frontier.length) {
    const next = [];
    for (const form of frontier) {
      if (allTerminals(form, g)) { if (chars(form).length <= maxLen) words.push(form); continue; }
      for (const step of successors(g, form)) {
        if (chars(step.form).length > cap || parent.has(step.form)) continue;
        if (parent.size >= maxStates) { truncated = true; continue; }
        parent.set(step.form, { from: form, prod: step.prod, pos: step.pos });
        next.push(step.form);
      }
    }
    frontier = next;
  }
  const derivations = {};
  for (const word of words) derivations[word] = pathTo(parent, word);
  return { words: sortWords(words, g.terminals), truncated, approximate: slack > 0, derivations };
}

function pathTo(parent, form) {
  const steps = [];
  for (let cur = form; parent.get(cur); cur = parent.get(cur).from) steps.push({ form: cur, prod: parent.get(cur).prod, pos: parent.get(cur).pos });
  steps.push({ form: [...parent.keys()][0], prod: null, pos: null });
  return steps.reverse();
}

// Derivaciones de una cadena concreta (hasta `limit`), cada una como lista de pasos { form, prod, pos }.
export function findDerivations(g, target, { limit = 6, maxSteps = 30, leftmost = isContextFree(g) } = {}) {
  const tlen = chars(target).length;
  const slack = isContracting(g) || g.productions.some((p) => p.rhs === "") ? 5 : 0;
  const cap = Math.max(tlen, 1) + slack;
  const results = [];
  let visited = 0;
  const walk = (path) => {
    if (results.length >= limit || visited > MAX_STATES) return;
    const form = path[path.length - 1].form;
    if (form === target) { results.push(path); return; }
    if (path.length > maxSteps || allTerminals(form, g)) return;
    for (const step of successors(g, form, { leftmost })) {
      visited++;
      if (chars(step.form).length > cap) continue;
      if (path.some((p) => p.form === step.form)) continue;
      walk([...path, step]);
    }
  };
  walk([{ form: g.axiom, prod: null, pos: null }]);
  results.sort((a, b) => a.length - b.length);
  return { derivations: results, exhausted: visited > MAX_STATES };
}

export const formatDerivation = (path) => path.map((step) => showForm(step.form)).join(" → ");

// Todos los caminos de derivación hasta palabras de longitud ≤ maxLen (para lenguajes finitos chicos): { paths, truncated }.
export function allDerivations(g, maxLen = 8, { limit = 200, leftmost = isContextFree(g) } = {}) {
  const slack = isContracting(g) || g.productions.some((p) => p.rhs === "") ? 4 : 0;
  const cap = maxLen + slack;
  const paths = [];
  let truncated = false;
  let visited = 0;
  const walk = (path) => {
    if (truncated) return;
    const form = path[path.length - 1].form;
    if (allTerminals(form, g)) { if (chars(form).length <= maxLen) { if (paths.length >= limit) truncated = true; else paths.push(path); } return; }
    if (path.length > 40) { truncated = true; return; }
    for (const step of successors(g, form, { leftmost })) {
      if (++visited > MAX_STATES) { truncated = true; return; }
      if (chars(step.form).length > cap || path.some((p) => p.form === step.form)) continue;
      walk([...path, step]);
    }
  };
  walk([{ form: g.axiom, prod: null, pos: null }]);
  return { paths, truncated };
}

// ---------- Árboles de derivación y ambigüedad (gramáticas de tipo 2 y 3) ----------

// Largo mínimo de la cadena que deriva cada símbolo (Infinity si es improductivo).
function minLengths(g) {
  const min = new Map(g.nonterminals.map((n) => [n, Infinity]));
  for (let changed = true; changed;) {
    changed = false;
    for (const { lhs, rhs } of g.productions) {
      const total = chars(rhs).reduce((sum, s) => sum + (g.terminals.includes(s) ? 1 : min.get(s) ?? Infinity), 0);
      if (total < min.get(lhs)) { min.set(lhs, total); changed = true; }
    }
  }
  return min;
}

// Árboles de derivación distintos de la cadena (hasta `limit`). Solo para gramáticas independientes del contexto.
// Un árbol es { sym, rule, children }; las hojas terminales no tienen children y la hoja de λ es { sym: "λ" }.
export function parseTrees(g, word, { limit = 6 } = {}) {
  if (!isContextFree(g)) return { error: "El árbol de derivación se construye para gramáticas de tipo 2 y 3 (partes izquierdas de un solo no terminal)." };
  const input = chars(word);
  const n = input.length;
  const min = minLengths(g);
  const memo = new Map();
  const active = new Set();
  const byLhs = groupRules(g.productions);

  function treesFor(sym, i, j) {
    if (g.terminals.includes(sym)) return j === i + 1 && input[i] === sym ? [{ sym }] : [];
    const key = `${sym}|${i}|${j}`;
    if (memo.has(key)) return memo.get(key);
    if (active.has(key) || min.get(sym) > j - i) return [];
    active.add(key);
    const found = [];
    for (const rhs of byLhs.get(sym) ?? []) {
      if (found.length >= limit) break;
      const symbols = chars(rhs);
      if (!symbols.length) { if (i === j) found.push({ sym, rule: { lhs: sym, rhs }, children: [{ sym: LAMBDA }] }); continue; }
      for (const kids of sequence(symbols, 0, i, j)) {
        found.push({ sym, rule: { lhs: sym, rhs }, children: kids });
        if (found.length >= limit) break;
      }
    }
    active.delete(key);
    // Un resultado calculado dentro de un ciclo puede estar incompleto: solo se guarda si no hay ciclos abiertos.
    if (!active.size) memo.set(key, found);
    return found;
  }

  function sequence(symbols, k, i, j) {
    if (k === symbols.length) return i === j ? [[]] : [];
    const rest = symbols.slice(k + 1).reduce((sum, s) => sum + (g.terminals.includes(s) ? 1 : min.get(s) ?? Infinity), 0);
    const out = [];
    for (let mid = i; mid <= j - rest; mid++) {
      const heads = treesFor(symbols[k], i, mid);
      if (!heads.length) continue;
      for (const tails of sequence(symbols, k + 1, mid, j)) {
        for (const head of heads) { out.push([head, ...tails]); if (out.length >= limit * limit) return out; }
      }
    }
    return out;
  }

  return { trees: treesFor(g.axiom, 0, n).slice(0, limit) };
}

// Busca cadenas con más de un árbol de derivación (gramática ambigua): { ambiguous, examples: [{ word, trees }] }.
export function detectAmbiguity(g, maxLen = 7, { maxExamples = 3 } = {}) {
  if (!isContextFree(g)) return { error: "La ambigüedad se analiza con árboles de derivación: hace falta una gramática de tipo 2 o 3." };
  const { words, truncated } = generateLanguage(g, maxLen);
  const examples = [];
  for (const word of words) {
    const { trees } = parseTrees(g, word, { limit: 3 });
    if (trees.length > 1) { examples.push({ word, trees }); if (examples.length >= maxExamples) break; }
  }
  return { ambiguous: examples.length > 0, examples, checked: words.length, truncated, maxLen };
}

// ---------- Recursividad ----------

// Dónde está el no terminal A dentro de la parte derecha: "izquierda", "derecha", "mixta" (en ambos extremos) o "central".
function positionOf(rhs, sym) {
  const r = chars(rhs);
  const left = r[0] === sym;
  const right = r[r.length - 1] === sym;
  if (left && right && r.length > 1) return "mixta";
  if (left) return "izquierda";
  if (right) return "derecha";
  return "central";
}

// Recursividad de la gramática: { recursive, findings: [{ symbol, kind, side, rules, cycle }] }.
export function analyzeRecursion(g) {
  if (!isContextFree(g)) return { error: "La recursividad se analiza en gramáticas de tipo 2 y 3 (parte izquierda de un solo no terminal)." };
  const nts = new Set(g.nonterminals);
  const edges = new Map(g.nonterminals.map((n) => [n, []]));
  for (const rule of g.productions) {
    for (const s of unique(chars(rule.rhs).filter((x) => nts.has(x)))) edges.get(rule.lhs).push({ to: s, rule });
  }
  const findings = [];
  for (const symbol of g.nonterminals) {
    const direct = g.productions.filter((r) => r.lhs === symbol && chars(r.rhs).includes(symbol) && r.rhs !== symbol);
    if (direct.length) {
      const sides = unique(direct.map((r) => positionOf(r.rhs, symbol)));
      const side = sides.length > 1 ? "mixta" : sides[0];
      findings.push({ symbol, kind: "directa", side, rules: direct.map(formatRule), cycle: [symbol] });
      continue;
    }
    // Camino más corto de symbol hacia symbol pasando por otros no terminales.
    const queue = [{ at: symbol, rules: [], nodes: [symbol] }];
    const seen = new Set();
    let cycle = null;
    while (queue.length && !cycle) {
      const cur = queue.shift();
      for (const edge of edges.get(cur.at)) {
        if (edge.to === symbol && cur.rules.length >= 1) { cycle = { rules: [...cur.rules, edge.rule], nodes: cur.nodes }; break; }
        if (edge.to !== symbol && !seen.has(edge.to)) { seen.add(edge.to); queue.push({ at: edge.to, rules: [...cur.rules, edge.rule], nodes: [...cur.nodes, edge.to] }); }
      }
    }
    if (cycle) findings.push({ symbol, kind: "en más de un paso", side: null, rules: unique(cycle.rules.map(formatRule)), cycle: cycle.nodes });
  }
  return { recursive: findings.length > 0, findings };
}

// Etiqueta corta con los nombres de la guía: "recursiva por izquierda", "recursiva en más de un paso", "no es recursiva".
export function recursionLabel(analysis) {
  if (analysis.error) return analysis.error;
  if (!analysis.recursive) return "No es recursiva";
  const labels = unique(analysis.findings.map((f) => (f.kind === "directa" ? (f.side === "central" ? "recursiva directa (el símbolo queda en el centro)" : `recursiva por ${f.side}`) : "recursiva en más de un paso")));
  return `Es ${labels.join(" y ")}`.replace("Es recursiva", "Es recursiva");
}

// ---------- Comparación de gramáticas ----------

export function compareGrammars(a, b, maxLen = 8) {
  const la = generateLanguage(a, maxLen);
  const lb = generateLanguage(b, maxLen);
  const sa = new Set(la.words);
  const sb = new Set(lb.words);
  const onlyA = la.words.filter((w) => !sb.has(w));
  const onlyB = lb.words.filter((w) => !sa.has(w));
  return { equal: !onlyA.length && !onlyB.length, onlyA, onlyB, wordsA: la.words, wordsB: lb.words, maxLen, truncated: la.truncated || lb.truncated };
}

export { isContextFree, isContracting };
