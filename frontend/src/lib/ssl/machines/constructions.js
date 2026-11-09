import { addState, addTransition, createMachine, setInitial, toggleAccepting } from "./model.js";
import { layeredLayout } from "./layout.js";
import { parseRegex } from "../regex.js";
import { parseGrammar } from "../grammar.js";
import { minimize } from "../automata.js";
import { afFromTable } from "./build.js";
import { inputSymbols } from "./model.js";

// Construcciones entre expresiones regulares, gramáticas regulares y autómatas finitos, como en la guía.

function must(result) {
  if (result.error) throw new Error(result.error);
  return result.machine;
}

// ---------- Algoritmo de Thompson: expresión regular → AFND con transiciones λ ----------
// Cada fragmento tiene un estado de entrada y uno de salida. Las uniones y las estrellas agregan estados nuevos
// y transiciones λ; la concatenación enlaza la salida del primero con la entrada del segundo con una λ.
export function thompson(source) {
  const parsed = parseRegex(source);
  if (parsed.error) return { error: parsed.error };
  let m = createMachine("afnd", { name: "AFND (Thompson)", alphabet: parsed.alphabet });
  let counter = 0;
  const newState = () => { const id = `q${counter++}`; m = must(addState(m, { id })); return id; };
  const link = (from, to, symbol = "") => { m = must(addTransition(m, { from, to, symbol })); };
  const steps = [];

  const build = (node) => {
    switch (node.t) {
      case "sym": {
        const s = newState();
        const e = newState();
        link(s, e, node.v);
        steps.push(`Símbolo ${node.v}: ${s} —${node.v}→ ${e}`);
        return { s, e };
      }
      case "empty": {
        const s = newState();
        const e = newState();
        link(s, e);
        steps.push(`λ: ${s} —λ→ ${e}`);
        return { s, e };
      }
      case "cat": {
        const parts = node.parts.map(build);
        for (let i = 0; i + 1 < parts.length; i++) link(parts[i].e, parts[i + 1].s);
        steps.push(`Concatenación de ${parts.length} partes: se enlazan con transiciones λ`);
        return { s: parts[0].s, e: parts[parts.length - 1].e };
      }
      case "alt": {
        const s = newState();
        const parts = node.parts.map(build);
        const e = newState();
        for (const p of parts) { link(s, p.s); link(p.e, e); }
        steps.push(`Unión: ${s} se bifurca con λ hacia cada alternativa y todas llegan con λ a ${e}`);
        return { s, e };
      }
      case "star": {
        const s = newState();
        const inner = build(node.e);
        const e = newState();
        link(s, inner.s); link(inner.e, e); link(s, e); link(inner.e, inner.s);
        steps.push(`Estrella: ${s} puede saltar a ${e} (cero repeticiones) o entrar; ${inner.e} vuelve a ${inner.s} para repetir`);
        return { s, e };
      }
      default: {
        const s = newState();
        const inner = build(node.e);
        const e = newState();
        link(s, inner.s); link(inner.e, e); link(inner.e, inner.s);
        steps.push(`Clausura positiva: como la estrella pero sin el salto directo (al menos una repetición)`);
        return { s, e };
      }
    }
  };

  const frag = build(parsed.tree);
  m = must(setInitial(m, frag.s));
  m = must(toggleAccepting(m, frag.e));
  return { machine: layeredLayout(m), steps, alphabet: parsed.alphabet };
}

// ---------- Gramática regular → AF (procedimiento de la guía) ----------
// ΣE = ΣT; Q = ΣN más un estado de aceptación nuevo F. Por cada X := aY hay f(X, a) ∋ Y; por cada X := a hay
// f(X, a) ∋ F; por cada X := λ (solo el axioma) hay una transición λ de X a F.
export function nfaFromGrammar(g, { finalName = "F" } = {}) {
  let final = finalName;
  for (let n = 1; g.nonterminals.includes(final); n++) final = `${finalName}${n}`;
  let m = createMachine("afnd", { name: "AF", alphabet: [...g.terminals] });
  for (const n of g.nonterminals) m = must(addState(m, { id: n }));
  m = must(addState(m, { id: final }));
  for (const { lhs, rhs } of g.productions) {
    const r = Array.from(rhs);
    if (r.length === 0) m = must(addTransition(m, { from: lhs, to: final, symbol: "" }));
    else if (r.length === 1 && g.terminals.includes(r[0])) m = must(addTransition(m, { from: lhs, to: final, symbol: r[0] }));
    else if (r.length === 2 && g.terminals.includes(r[0]) && g.nonterminals.includes(r[1])) m = must(addTransition(m, { from: lhs, to: r[1], symbol: r[0] }));
    else throw new Error(`La producción ${lhs} := ${rhs} no es regular por derecha (A := aB, A := a o S := λ).`);
  }
  m = must(setInitial(m, g.axiom));
  m = must(toggleAccepting(m, final));
  return layeredLayout(m);
}

export function nfaFromGrammarText(fields) {
  const parsed = parseGrammar(fields);
  if (parsed.error) throw new Error(parsed.error);
  return nfaFromGrammar(parsed.grammar);
}

// ---------- AF → gramática regular ----------
// ΣT = ΣE; ΣN = Q; por cada f(X, a) = Y hay X := aY y, si Y es de aceptación, también X := a.
export function grammarFromAf(m) {
  if (m.transitions.some((t) => t.symbol === "")) throw new Error("El autómata tiene transiciones λ: primero hay que convertirlo.");
  const productions = [];
  for (const t of m.transitions) {
    productions.push({ lhs: t.from, rhs: `${t.symbol}${t.to}` });
    if (m.accepting.includes(t.to)) productions.push({ lhs: t.from, rhs: t.symbol });
  }
  const seen = new Set();
  const unique = productions.filter((p) => { const k = `${p.lhs}|${p.rhs}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const terminals = [...new Set(m.transitions.map((t) => t.symbol))];
  return { terminals, nonterminals: m.states.map((s) => s.id), axiom: m.initial, productions: unique };
}

export const grammarText = (g) => {
  const groups = new Map();
  for (const { lhs, rhs } of g.productions) {
    if (!groups.has(lhs)) groups.set(lhs, []);
    groups.get(lhs).push(rhs === "" ? "λ" : rhs);
  }
  return [...groups].map(([lhs, rhss]) => `${lhs} := ${rhss.join(" | ")}`).join("\n");
};

// ---------- AFD ⇄ tabla y minimización ----------

// Tabla de un AFD (para usar el minimizador por conjuntos cocientes). Los destinos faltantes se muestran como "-".
export function machineToTable(m, name = "f") {
  const alphabet = inputSymbols(m).filter((s) => s !== "");
  return {
    name,
    alphabet,
    start: m.initial,
    accepting: [...m.accepting],
    rows: m.states.map((s) => [s.id, ...alphabet.map((a) => m.transitions.find((t) => t.from === s.id && t.symbol === a)?.to ?? "-")]),
  };
}

// Minimiza un AFD (completando antes con el sumidero si le faltan transiciones). Devuelve { machine, steps, table }.
export function minimizeMachine(m) {
  const complete = m.states.every((s) => inputSymbols(m).filter((x) => x !== "").every((a) => m.transitions.some((t) => t.from === s.id && t.symbol === a)));
  const table = machineToTable(m);
  if (!complete) throw new Error("El AFD está incompleto: completalo con un estado de error antes de minimizarlo.");
  const r = minimize(table);
  const min = afFromTable({ name: "AFD mínimo", alphabet: table.alphabet, start: r.minimal.start, accepting: r.minimal.accepting, rows: r.minimal.rows });
  return { machine: layeredLayout(min), steps: r.steps, table: r.minimal, removed: r.removed };
}
