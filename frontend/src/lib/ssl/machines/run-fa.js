import { isFa } from "./model.js";

// Ejecución de AFD y AFND (con o sin transiciones λ). Genera el árbol de descripciones instantáneas
// (estado, cadena restante) por anchura. En un AFD el árbol es una sola rama.

const MAX_NODES = 4000;
const ERROR_STATE = /^(q?[eE]|error)$/;

export const formatFaConfig = (c) => `(${c.state}, ${c.rest === "" ? "λ" : c.rest})`;

// { nodes, levels, accepted, outcome, message, acceptingPath, truncated }
// nodes[i] = { id, parent, state, rest, via (id de transición), depth }
export function runFa(m, input, { maxNodes = MAX_NODES } = {}) {
  if (!isFa(m)) throw new Error("runFa es para AFD y AFND.");
  if (!m.initial) return { nodes: [], levels: [], accepted: false, outcome: "error", message: "Falta el estado inicial.", acceptingPath: [], truncated: false };
  const symbols = Array.from(input);
  const byState = new Map();
  for (const t of m.transitions) {
    if (!byState.has(t.from)) byState.set(t.from, []);
    byState.get(t.from).push(t);
  }
  const nodes = [{ id: 0, parent: null, state: m.initial, rest: input, via: null, depth: 0 }];
  const levels = [[0]];
  let truncated = false;
  let frontier = [0];
  while (frontier.length) {
    const next = [];
    for (const id of frontier) {
      const node = nodes[id];
      for (const t of byState.get(node.state) ?? []) {
        let rest;
        if (t.symbol === "") rest = node.rest;
        else if (node.rest !== "" && Array.from(node.rest)[0] === t.symbol) rest = Array.from(node.rest).slice(1).join("");
        else continue;
        // Una transición λ no puede repetir una configuración de su propia rama (ciclos λ).
        if (t.symbol === "") {
          let cur = node;
          let cycle = false;
          while (cur) { if (cur.state === t.to && cur.rest === rest) { cycle = true; break; } cur = cur.parent === null ? null : nodes[cur.parent]; }
          if (cycle) continue;
        }
        if (nodes.length >= maxNodes) { truncated = true; continue; }
        nodes.push({ id: nodes.length, parent: id, state: t.to, rest, via: t.id, depth: node.depth + 1 });
        next.push(nodes.length - 1);
      }
    }
    if (next.length) levels.push(next);
    frontier = next;
  }
  void symbols;

  const accepting = new Set(m.accepting);
  const winner = nodes.find((n) => n.rest === "" && accepting.has(n.state));
  const path = [];
  for (let cur = winner; cur; cur = cur.parent === null ? null : nodes[cur.parent]) path.unshift(cur.id);
  let outcome;
  let message;
  if (winner) {
    outcome = "reconocida";
    message = `La cadena ${input === "" ? "λ" : input} es reconocida.`;
  } else {
    const reachedEnd = nodes.filter((n) => n.rest === "");
    const stuck = nodes.filter((n) => n.rest !== "" && !(byState.get(n.state) ?? []).some((t) => t.symbol === "" || Array.from(n.rest)[0] === t.symbol));
    if (!reachedEnd.length && stuck.length && m.type === "afd") {
      outcome = "error";
      const s = stuck[0];
      message = `Error: en el estado ${s.state} no hay transición para ${Array.from(s.rest)[0]}. La cadena no es reconocida.`;
    } else if (reachedEnd.length && reachedEnd.every((n) => ERROR_STATE.test(n.state))) {
      outcome = "no reconocida";
      message = `La cadena ${input === "" ? "λ" : input} no es reconocida: terminó en el estado de error.`;
    } else {
      outcome = "no reconocida";
      message = `La cadena ${input === "" ? "λ" : input} no es reconocida${m.type === "afnd" ? ": ninguna rama llega a un estado de aceptación con la cadena leída" : ""}.`;
    }
  }
  return { nodes, levels, accepted: !!winner, outcome, message, acceptingPath: path, truncated };
}

// Cierre λ de un conjunto de estados.
export function lambdaClosure(m, states) {
  const seen = new Set(states);
  const stack = [...states];
  while (stack.length) {
    const s = stack.pop();
    for (const t of m.transitions) if (t.from === s && t.symbol === "" && !seen.has(t.to)) { seen.add(t.to); stack.push(t.to); }
  }
  return seen;
}

// ¿Acepta la cadena? Simulación por conjuntos de estados (rápida, sin armar el árbol).
export function acceptsFa(m, input) {
  if (!m.initial) return false;
  let current = lambdaClosure(m, [m.initial]);
  for (const symbol of Array.from(input)) {
    const next = new Set();
    for (const t of m.transitions) if (t.symbol === symbol && current.has(t.from)) next.add(t.to);
    current = lambdaClosure(m, next);
    if (!current.size) return false;
  }
  return m.accepting.some((a) => current.has(a));
}

// Todas las cadenas hasta maxLen sobre el alfabeto, en orden de longitud.
export function* allStrings(alphabet, maxLen) {
  yield "";
  let level = [""];
  for (let len = 1; len <= maxLen; len++) {
    const next = [];
    for (const w of level) for (const a of alphabet) next.push(w + a);
    for (const w of next) yield w;
    level = next;
  }
}

// Cadenas que acepta el autómata hasta maxLen.
export function acceptedStrings(m, alphabet, maxLen) {
  const out = [];
  for (const w of allStrings(alphabet, maxLen)) if (acceptsFa(m, w)) out.push(w);
  return out;
}
