// AFD dados por tabla de transición (como en la guía), con eliminación de estados no conexos,
// minimización por conjuntos cocientes y comparación de equivalencia. No dibuja autómatas.
//
// table = { name, alphabet: ["0","1"], start: "A", accepting: ["C"], rows: [["A", "B", "C"], …] }
// cada fila es [estado, destino con el 1.er símbolo, destino con el 2.º, …]

export function tableToMap(table) {
  const next = new Map();
  for (const [state, ...targets] of table.rows) next.set(state, Object.fromEntries(table.alphabet.map((symbol, i) => [symbol, targets[i]])));
  return next;
}

const blockLabel = (block) => `{${block.join(", ")}}`;

// Estados alcanzables desde el inicial, en orden de aparición en la tabla.
export function reachableStates(table) {
  const map = tableToMap(table);
  const seen = new Set([table.start]);
  const stack = [table.start];
  while (stack.length) {
    const state = stack.pop();
    for (const symbol of table.alphabet) {
      const target = map.get(state)?.[symbol];
      if (target && !seen.has(target)) { seen.add(target); stack.push(target); }
    }
  }
  return table.rows.map((row) => row[0]).filter((state) => seen.has(state));
}

// Minimiza el AFD: { removed, partitions, minimal: { alphabet, start, accepting, rows, blocks }, steps }.
export function minimize(table) {
  const map = tableToMap(table);
  const states = reachableStates(table);
  const removed = table.rows.map((row) => row[0]).filter((state) => !states.includes(state));
  const accepting = new Set(table.accepting);
  const steps = [];
  steps.push(removed.length ? `El AFD es no conexo: se eliminan los estados ${removed.join(", ")}.` : "El AFD es conexo: no hay estados que eliminar.");

  let blockOf = new Map(states.map((state) => [state, accepting.has(state) ? 1 : 0]));
  const partitionOf = (assignment) => {
    const groups = new Map();
    for (const state of states) {
      const id = assignment.get(state);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(state);
    }
    return [...groups.values()];
  };
  let partition = partitionOf(blockOf);
  const partitions = [partition];
  steps.push(`Conjunto cociente inicial Q/E0 = {${partition.map(blockLabel).join(", ")}} (no finales y finales).`);

  for (let round = 1; round <= states.length + 1; round++) {
    const signature = (state) => `${blockOf.get(state)}|${table.alphabet.map((symbol) => blockOf.get(map.get(state)[symbol])).join(",")}`;
    const ids = new Map();
    const refined = new Map(states.map((state) => {
      const sig = signature(state);
      if (!ids.has(sig)) ids.set(sig, ids.size);
      return [state, ids.get(sig)];
    }));
    const next = partitionOf(refined);
    const same = next.length === partition.length;
    steps.push(`Q/E${round} = {${next.map(blockLabel).join(", ")}}${same ? " (no cambió: es el cociente final)" : ""}`);
    partitions.push(next);
    blockOf = refined;
    partition = next;
    if (same) break;
  }

  // El bloque del estado inicial es el primero (P1), como en la guía.
  const blocks = [...partition].sort((a, b) => (b.includes(table.start) ? 1 : 0) - (a.includes(table.start) ? 1 : 0));
  const names = new Map(blocks.map((block, i) => [block.join("|"), `P${i + 1}`]));
  const nameOf = (state) => names.get(blocks.find((block) => block.includes(state)).join("|"));
  const minimal = {
    alphabet: table.alphabet,
    start: nameOf(table.start),
    accepting: blocks.filter((block) => block.some((s) => accepting.has(s))).map((block) => names.get(block.join("|"))),
    rows: blocks.map((block) => [names.get(block.join("|")), ...table.alphabet.map((symbol) => nameOf(map.get(block[0])[symbol]))]),
    blocks: blocks.map((block) => ({ name: names.get(block.join("|")), members: block })),
  };
  steps.push(`AFD mínimo con ${blocks.length} estado${blocks.length === 1 ? "" : "s"}: ${minimal.blocks.map((b) => `${b.name} = ${blockLabel(b.members)}`).join(", ")}.`);
  return { removed, partitions, minimal, steps };
}

// Dos AFD son equivalentes si sus mínimos son iguales salvo el nombre de los estados.
export function equivalent(a, b) {
  if (a.alphabet.join() !== b.alphabet.join()) return { equal: false, reason: "los alfabetos son distintos" };
  const ma = minimize(a).minimal;
  const mb = minimize(b).minimal;
  if (ma.rows.length !== mb.rows.length) return { equal: false, reason: `los autómatas mínimos tienen distinta cantidad de estados (${ma.rows.length} y ${mb.rows.length})` };
  const mapA = tableToMap(ma);
  const mapB = tableToMap(mb);
  const pairing = new Map([[ma.start, mb.start]]);
  const queue = [ma.start];
  while (queue.length) {
    const sa = queue.shift();
    const sb = pairing.get(sa);
    if (ma.accepting.includes(sa) !== mb.accepting.includes(sb)) return { equal: false, reason: "un estado final de uno corresponde a un no final del otro" };
    for (const symbol of a.alphabet) {
      const ta = mapA.get(sa)[symbol];
      const tb = mapB.get(sb)[symbol];
      if (!pairing.has(ta)) { pairing.set(ta, tb); queue.push(ta); }
      else if (pairing.get(ta) !== tb) return { equal: false, reason: "las transiciones de los mínimos no se corresponden" };
    }
  }
  return { equal: true, reason: "los autómatas mínimos coinciden estado a estado" };
}

// ¿La cadena es aceptada por el AFD?
export function accepts(table, word) {
  const map = tableToMap(table);
  let state = table.start;
  for (const symbol of Array.from(word)) {
    state = map.get(state)?.[symbol];
    if (!state) return false;
  }
  return table.accepting.includes(state);
}
