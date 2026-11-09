// Ejecución de autómatas con pila no deterministas por anchura sobre descripciones instantáneas
// (estado, cadena restante, pila). La pila se escribe de abajo hacia arriba: el tope está a la DERECHA
// (#, #S, #BaA). La búsqueda tiene límites de nodos, de largo de pila y de profundidad para no colgarse.
//
// Convención de apilado (de la guía):
//  - "natural": lo que va tras la barra se apila de izquierda a derecha, y su último símbolo queda en el
//    tope. Es el de los AP de diseño:  (, # / # (   deja  #(
//  - "production" (analizadores sintácticos): si el tope es un no terminal (una mayúscula que no es el
//    fondo de pila), la parte derecha de la producción "ingresa de manera refleja": X := 0YZ deja #ZY0,
//    así el primer símbolo de la producción queda en el tope.

const DEFAULTS = { maxNodes: 6000, maxStack: 60, maxDepth: 600 };
const isNonterminal = (symbol, bottom) => symbol !== bottom && /^\p{Lu}$/u.test(symbol);

export const pushedString = (m, t) => {
  if (m.pushMode === "production" && Array.from(t.pop).length === 1 && isNonterminal(t.pop, m.bottom) && Array.from(t.push).length > 1) {
    return Array.from(t.push).reverse().join("");
  }
  return t.push;
};

export const formatApConfig = (c) => `(${c.state}, ${c.rest === "" ? "λ" : c.rest}, ${c.stack})`;

// Aplica una transición a una configuración: devuelve la nueva o null.
export function applyApTransition(m, t, config) {
  if (t.from !== config.state) return null;
  let rest = config.rest;
  if (t.read !== "") {
    if (rest === "" || Array.from(rest)[0] !== t.read) return null;
    rest = Array.from(rest).slice(1).join("");
  }
  if (t.pop !== "" && !config.stack.endsWith(t.pop)) return null;
  const stack = config.stack.slice(0, config.stack.length - t.pop.length) + pushedString(m, t);
  return { state: t.to, rest, stack };
}

const isAccepting = (m, config) => {
  const inState = m.accepting.includes(config.state);
  const consumed = config.rest === "";
  const empty = config.stack === m.bottom;
  const by = m.acceptBy ?? "both";
  if (by === "state") return inState && consumed;
  if (by === "empty") return empty && consumed;
  return inState && consumed && empty;
};

// { nodes, levels, accepted, outcome, message, acceptingPath, table, truncated }
export function runAp(m, input, limits = {}) {
  const { maxNodes, maxStack, maxDepth } = { ...DEFAULTS, ...limits };
  if (m.type !== "ap") throw new Error("runAp es para autómatas con pila.");
  if (!m.initial) return { nodes: [], levels: [], accepted: false, outcome: "error", message: "Falta el estado inicial.", acceptingPath: [], table: [], truncated: false };
  const byState = new Map();
  for (const t of m.transitions) {
    if (!byState.has(t.from)) byState.set(t.from, []);
    byState.get(t.from).push(t);
  }
  const nodes = [{ id: 0, parent: null, state: m.initial, rest: input, stack: m.bottom, via: null, depth: 0 }];
  const levels = [[0]];
  let truncated = false;
  let frontier = [0];
  let winner = null;
  if (isAccepting(m, nodes[0])) winner = nodes[0];
  while (frontier.length && !truncated && levels.length <= maxDepth) {
    const next = [];
    for (const id of frontier) {
      const node = nodes[id];
      for (const t of byState.get(node.state) ?? []) {
        const c = applyApTransition(m, t, node);
        if (!c) continue;
        if (Array.from(c.stack).length > maxStack) { truncated = true; continue; }
        // Una rama no puede repetir una configuración suya (ciclos).
        let cycle = false;
        for (let cur = node; cur; cur = cur.parent === null ? null : nodes[cur.parent]) {
          if (cur.state === c.state && cur.rest === c.rest && cur.stack === c.stack) { cycle = true; break; }
        }
        if (cycle) continue;
        if (nodes.length >= maxNodes) { truncated = true; break; }
        const child = { id: nodes.length, parent: id, ...c, via: t.id, depth: node.depth + 1 };
        nodes.push(child);
        next.push(child.id);
        if (!winner && isAccepting(m, child)) winner = child;
      }
      if (truncated) break;
    }
    if (next.length) levels.push(next);
    frontier = next;
    if (winner) break;
  }
  const path = [];
  for (let cur = winner; cur; cur = cur.parent === null ? null : nodes[cur.parent]) path.unshift(cur.id);
  const shown = input === "" ? "λ" : input;
  const outcome = winner ? "reconocida" : "no reconocida";
  const message = winner
    ? `La cadena ${shown} es reconocida (${(m.acceptBy ?? "both") === "both" ? "estado de aceptación, cadena leída y pila vacía" : (m.acceptBy === "state" ? "estado de aceptación y cadena leída" : "pila vacía y cadena leída")}).`
    : `La cadena ${shown} no es reconocida${truncated ? " (la búsqueda se cortó por límite de tamaño: puede ser que falten ramas)" : ""}.`;
  // Tabla operativa: solo los movimientos que llevan a la aceptación, como en la guía.
  const table = path.map((id, i) => ({ n: i + 1, state: nodes[id].state, rest: nodes[id].rest, stack: nodes[id].stack }));
  return { nodes, levels, accepted: !!winner, outcome, message, acceptingPath: path, table, truncated };
}

// ¿Acepta la cadena? Búsqueda por anchura sin repetir configuraciones (más rápida que armar el árbol).
export function acceptsAp(m, input, limits = {}) {
  const { maxNodes, maxStack } = { ...DEFAULTS, maxNodes: 20000, ...limits };
  if (!m.initial) return { accepted: false, truncated: false };
  const byState = new Map();
  for (const t of m.transitions) {
    if (!byState.has(t.from)) byState.set(t.from, []);
    byState.get(t.from).push(t);
  }
  const start = { state: m.initial, rest: input, stack: m.bottom };
  const seen = new Set([`${start.state}|${start.rest}|${start.stack}`]);
  let queue = [start];
  let truncated = false;
  while (queue.length) {
    const next = [];
    for (const c of queue) {
      if (isAccepting(m, c)) return { accepted: true, truncated };
      for (const t of byState.get(c.state) ?? []) {
        const n = applyApTransition(m, t, c);
        if (!n) continue;
        if (Array.from(n.stack).length > maxStack) { truncated = true; continue; }
        const key = `${n.state}|${n.rest}|${n.stack}`;
        if (seen.has(key)) continue;
        if (seen.size >= maxNodes) { truncated = true; return { accepted: false, truncated }; }
        seen.add(key);
        next.push(n);
      }
    }
    queue = next;
  }
  return { accepted: false, truncated };
}
