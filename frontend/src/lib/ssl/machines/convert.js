import { addState, addTransition, autoLayout, createMachine, inputSymbols, isFa, setInitial, toggleAccepting } from "./model.js";
import { lambdaClosure } from "./run-fa.js";

// Conversión de AFND a AFD por el Teorema 2 de la guía:
//  - Caso 1 (sin λ):  C0 = {q0};  f'(Ci, a) = unión de f(q, a) para q en Ci.
//  - Caso 2 (con λ):  se completa f con T* (cierre de las transiciones λ);  C0 = λ-cierre de {q0};
//    f'(Ci, a) = λ-cierre de la unión de f(q, a) para q en Ci.
// Los estados del AFD son conjuntos de estados del AFND y se nombran C0, C1, … en el orden en que aparecen.

function must(result) {
  if (result.error) throw new Error(result.error);
  return result.machine;
}

const setText = (items) => `{${[...items].join(", ")}}`;
const sortedBy = (m) => {
  const order = new Map(m.states.map((s, i) => [s.id, i]));
  return (items) => [...items].sort((a, b) => order.get(a) - order.get(b));
};

export const hasLambda = (m) => m.transitions.some((t) => t.symbol === "");

// Cierre transitivo de las transiciones λ: T* como lista de pares (p, q), con los reflexivos.
export function lambdaPairs(m) {
  const order = sortedBy(m);
  const pairs = [];
  for (const s of m.states) for (const t of order(lambdaClosure(m, [s.id]))) pairs.push([s.id, t]);
  return pairs;
}

// Pares directos T (λ explícitas más los reflexivos), antes de la clausura transitiva.
export function directLambdaPairs(m) {
  const pairs = m.states.map((s) => [s.id, s.id]);
  for (const t of m.transitions) if (t.symbol === "" && t.from !== t.to) pairs.push([t.from, t.to]);
  return pairs;
}

// Convierte el AFND en un AFD. Devuelve { dfa, steps, mapping, table, caso }.
//   options.includeEmpty: si es true (por defecto) el conjunto vacío es un estado (sumidero), como en la tabla 4.29 de la guía.
export function determinize(nfa, { includeEmpty = true, prefix = "C" } = {}) {
  if (!isFa(nfa)) throw new Error("Solo se convierten AFND.");
  const lambda = hasLambda(nfa);
  const order = sortedBy(nfa);
  const symbols = inputSymbols(nfa).filter((s) => s !== "");
  const steps = [];
  const caso = lambda ? 2 : 1;

  steps.push({ title: `Teorema 2, caso ${caso}`, lines: lambda ? ["El AFND tiene transiciones λ: se aplica el caso 2, que trabaja con el cierre T* de las transiciones λ."] : ["El AFND no tiene transiciones λ: se aplica el caso 1."] });
  if (lambda) {
    steps.push({ title: "Conjunto T (pares vinculados por λ, cada estado consigo mismo)", lines: [`T = {${directLambdaPairs(nfa).map(([a, b]) => `(${a}, ${b})`).join(", ")}}`] });
    steps.push({ title: "Conjunto T* (con la propiedad transitiva)", lines: [`T* = {${lambdaPairs(nfa).map(([a, b]) => `(${a}, ${b})`).join(", ")}}`] });
    const complete = symbols.length ? nfa.states.map((s) => {
      const cells = symbols.map((a) => {
        const targets = new Set();
        for (const q of lambdaClosure(nfa, [s.id])) for (const t of nfa.transitions) if (t.from === q && t.symbol === a) for (const r of lambdaClosure(nfa, [t.to])) targets.add(r);
        return `${a}: ${setText(order(targets))}`;
      });
      return `f(${s.id}) con λ completas → ${cells.join("   ")}`;
    }) : [];
    steps.push({ title: "Función de transición con las transiciones λ completas", lines: complete });
  }

  const close = (set) => (lambda ? lambdaClosure(nfa, [...set]) : new Set(set));
  const start = close(new Set([nfa.initial]));
  const key = (set) => order(set).join("|");
  const names = new Map();
  const sets = [];
  const nameOf = (set) => {
    const k = key(set);
    if (!names.has(k)) { names.set(k, `${prefix}${sets.length}`); sets.push(order(set)); }
    return names.get(k);
  };
  nameOf(start);
  steps.push({ title: "Estado inicial", lines: [lambda ? `f(${nfa.initial}, λ) = ${setText(order(start))} = ${prefix}0` : `${prefix}0 = ${setText(order(start))}`] });

  const edges = [];
  const lines = [];
  for (let i = 0; i < sets.length; i++) {
    const from = `${prefix}${i}`;
    for (const a of symbols) {
      const targets = new Set();
      for (const q of sets[i]) for (const t of nfa.transitions) if (t.from === q && t.symbol === a) targets.add(t.to);
      const reached = close(targets);
      if (!reached.size && !includeEmpty) {
        lines.push(`f'(${from}, ${a}) = ∅ (sin transición)`);
        continue;
      }
      const before = names.size;
      const to = nameOf(reached);
      edges.push({ from, symbol: a, to });
      lines.push(`f'(${from}, ${a}) = ${reached.size ? setText(order(reached)) : "∅"} = ${to}${names.size > before ? "  (estado nuevo)" : ""}`);
    }
  }
  steps.push({ title: "Transiciones del AFD, estado por estado", lines });

  let dfa = createMachine("afd", { name: "AFD", alphabet: symbols });
  for (let i = 0; i < sets.length; i++) dfa = must(addState(dfa, { id: `${prefix}${i}` }));
  for (const e of edges) dfa = must(addTransition(dfa, { from: e.from, to: e.to, symbol: e.symbol }));
  dfa = must(setInitial(dfa, `${prefix}0`));
  const accepting = [];
  sets.forEach((set, i) => { if (set.some((q) => nfa.accepting.includes(q))) accepting.push(`${prefix}${i}`); });
  for (const a of accepting) dfa = must(toggleAccepting(dfa, a));
  dfa = autoLayout(dfa, 4, 130);
  steps.push({ title: "Estados de aceptación", lines: [`Son los que contienen algún estado de aceptación del AFND (${setText(nfa.accepting)}): ${setText(accepting)}.`] });

  const mapping = sets.map((set, i) => ({ name: `${prefix}${i}`, set }));
  return { dfa, steps, mapping, caso };
}

// Completa un AFD agregando un estado de error E (como en la guía) para las transiciones que faltan.
export function completeWithError(m, errorId = "E") {
  const symbols = inputSymbols(m).filter((s) => s !== "");
  let next = m;
  const missing = [];
  for (const s of m.states) for (const a of symbols) if (!m.transitions.some((t) => t.from === s.id && t.symbol === a)) missing.push([s.id, a]);
  if (!missing.length) return m;
  let id = errorId;
  for (let n = 1; next.states.some((s) => s.id === id); n++) id = `${errorId}${n}`;
  next = must(addState(next, { id, x: 90, y: 90 }));
  for (const [from, a] of missing) next = must(addTransition(next, { from, to: id, symbol: a }));
  for (const a of symbols) next = must(addTransition(next, { from: id, to: id, symbol: a }));
  return next;
}

// Equivalencia exacta de dos autómatas finitos (AFD o AFND): ambos se determinizan y se recorre el producto.
// Devuelve { equal: true } o { equal: false, word, firstAccepts } con la cadena más corta que los distingue.
export function faEquivalent(a, b) {
  const alphabet = [...new Set([...inputSymbols(a), ...inputSymbols(b)])].filter((s) => s !== "");
  const prep = (m) => {
    const withAlpha = { ...m, alphabet: [...new Set([...m.alphabet, ...alphabet])] };
    return determinize(withAlpha, { includeEmpty: true }).dfa;
  };
  const da = prep(a);
  const db = prep(b);
  const next = (m, state, symbol) => m.transitions.find((t) => t.from === state && t.symbol === symbol)?.to ?? null;
  const acc = (m, state) => state !== null && m.accepting.includes(state);
  const seen = new Set();
  let queue = [{ x: da.initial, y: db.initial, word: "" }];
  while (queue.length) {
    const following = [];
    for (const { x, y, word } of queue) {
      const key = `${x}|${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (acc(da, x) !== acc(db, y)) return { equal: false, word, firstAccepts: acc(da, x) };
      for (const s of alphabet) following.push({ x: next(da, x, s), y: next(db, y, s), word: word + s });
    }
    queue = following;
  }
  return { equal: true };
}
