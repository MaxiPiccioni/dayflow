// Modelo de datos único para los cuatro tipos de máquina del sandbox (AFD, AFND, AP, ALA y MT) y las
// operaciones del editor sobre él. Todo es puro e inmutable: cada operación devuelve una máquina nueva
// o { error }. La cadena vacía (λ) se guarda como "" y se muestra como λ.
//
// machine = {
//   v: 1, type: "afd" | "afnd" | "ap" | "ala" | "mt", name,
//   alphabet: string[],            // ΣE (entrada)
//   extra: string[],               // símbolos auxiliares de cinta o de pila (Ω / no terminales)
//   bottom: "#", blank: "b",       // fondo de pila (AP) y blanco (MT)
//   pushMode: "natural" | "production",  // AP: cómo se apila lo que va tras la "/" (ver run-ap.js)
//   states: [{ id, x, y }], initial, accepting: string[],
//   transitions: [{ id, from, to, ... }]
// }
// Campos de una transición según el tipo:
//   afd / afnd : symbol ("" = λ, solo AFND)
//   ap         : read ("" = λ), pop (cadena de abajo hacia arriba, "" = nada), push (idem)
//   ala / mt   : read, write, move ("D" | "I" | "N" | "P")

export const MACHINE_TYPES = ["afd", "afnd", "ap", "ala", "mt"];
export const TYPE_LABEL = { afd: "AFD", afnd: "AFND", ap: "AP", ala: "ALA", mt: "MT" };
export const MOVES = ["D", "I", "N", "P"];
export const BOT = "├";
export const EOT = "┤";

export const isFa = (m) => m.type === "afd" || m.type === "afnd";
export const isTape = (m) => m.type === "ala" || m.type === "mt";

export function createMachine(type, options = {}) {
  if (!MACHINE_TYPES.includes(type)) throw new Error(`Tipo de máquina desconocido: ${type}`);
  return {
    v: 1,
    type,
    name: options.name ?? "",
    alphabet: [...(options.alphabet ?? [])],
    extra: [...(options.extra ?? [])],
    bottom: options.bottom ?? "#",
    blank: options.blank ?? "b",
    pushMode: options.pushMode ?? "natural",
    states: [],
    initial: null,
    accepting: [],
    transitions: [],
  };
}

const chars = (text) => Array.from(text);
const unique = (list) => [...new Set(list)];
const nextTransitionId = (m) => {
  let max = 0;
  for (const t of m.transitions) max = Math.max(max, Number(String(t.id).replace(/\D/g, "")) || 0);
  return `t${max + 1}`;
};

// ---------- Estados ----------

export const hasState = (m, id) => m.states.some((s) => s.id === id);

// Nombre libre para un estado nuevo: q0, q1, …
export function freshStateId(m, prefix = "q") {
  for (let i = 0; i < 10000; i++) if (!hasState(m, `${prefix}${i}`)) return `${prefix}${i}`;
  return `${prefix}x`;
}

export function validateStateName(m, name, ignore = null) {
  const id = String(name ?? "").trim();
  if (!id) return { error: "El estado necesita un nombre." };
  if (/[\s,;/|]/.test(id)) return { error: "El nombre del estado no puede tener espacios, comas, ; ni /." };
  if (id.length > 12) return { error: "El nombre del estado es demasiado largo (máximo 12 caracteres)." };
  if (id !== ignore && hasState(m, id)) return { error: `Ya hay un estado llamado ${id}.` };
  return { id };
}

export function addState(m, { id, x = 80, y = 80 } = {}) {
  const check = validateStateName(m, id ?? freshStateId(m));
  if (check.error) return check;
  const next = { ...m, states: [...m.states, { id: check.id, x: Math.round(x), y: Math.round(y) }] };
  if (next.initial === null) next.initial = check.id;
  return { machine: next, id: check.id };
}

export function removeState(m, id) {
  if (!hasState(m, id)) return { error: `No existe el estado ${id}.` };
  const states = m.states.filter((s) => s.id !== id);
  return {
    machine: {
      ...m,
      states,
      initial: m.initial === id ? (states[0]?.id ?? null) : m.initial,
      accepting: m.accepting.filter((a) => a !== id),
      transitions: m.transitions.filter((t) => t.from !== id && t.to !== id),
    },
  };
}

// Renombrar no rompe transiciones: se actualizan todas las referencias.
export function renameState(m, oldId, newName) {
  if (!hasState(m, oldId)) return { error: `No existe el estado ${oldId}.` };
  const check = validateStateName(m, newName, oldId);
  if (check.error) return check;
  const swap = (id) => (id === oldId ? check.id : id);
  return {
    machine: {
      ...m,
      states: m.states.map((s) => (s.id === oldId ? { ...s, id: check.id } : s)),
      initial: swap(m.initial),
      accepting: m.accepting.map(swap),
      transitions: m.transitions.map((t) => ({ ...t, from: swap(t.from), to: swap(t.to) })),
    },
  };
}

export const moveState = (m, id, x, y) => ({ ...m, states: m.states.map((s) => (s.id === id ? { ...s, x: Math.round(x), y: Math.round(y) } : s)) });

export function setInitial(m, id) {
  if (!hasState(m, id)) return { error: `No existe el estado ${id}.` };
  return { machine: { ...m, initial: id } };
}

export function toggleAccepting(m, id) {
  if (!hasState(m, id)) return { error: `No existe el estado ${id}.` };
  const accepting = m.accepting.includes(id) ? m.accepting.filter((a) => a !== id) : [...m.accepting, id];
  return { machine: { ...m, accepting } };
}

// ---------- Transiciones ----------

// Normaliza y valida una transición según el tipo de máquina. Devuelve { transition } o { error }.
export function normalizeTransition(m, input) {
  const { from, to } = input;
  if (!hasState(m, from)) return { error: `No existe el estado de origen ${from}.` };
  if (!hasState(m, to)) return { error: `No existe el estado de destino ${to}.` };
  if (isFa(m)) {
    const symbol = input.symbol ?? "";
    if (symbol === "" && m.type === "afd") return { error: "Un AFD no tiene transiciones λ. Usá un AFND." };
    if (Array.from(symbol).length > 1) return { error: "Cada transición lleva un solo símbolo (para varios, agregalas por separado o separalas con coma)." };
    return { transition: { from, to, symbol } };
  }
  if (m.type === "ap") {
    const read = input.read ?? "";
    if (Array.from(read).length > 1) return { error: "Se lee a lo sumo un símbolo de la entrada." };
    return { transition: { from, to, read, pop: input.pop ?? "", push: input.push ?? "" } };
  }
  const move = input.move ?? "D";
  if (!MOVES.includes(move)) return { error: "El movimiento tiene que ser D, I, N o P." };
  const read = input.read ?? "";
  const write = input.write ?? "";
  if (Array.from(read).length !== 1) return { error: "Hay que leer exactamente un símbolo de la cinta." };
  if (Array.from(write).length !== 1) return { error: "Hay que escribir exactamente un símbolo en la cinta." };
  return { transition: { from, to, read, write, move } };
}

const sameTransition = (a, b) => ["from", "to", "symbol", "read", "pop", "push", "write", "move"].every((k) => a[k] === b[k]);

export function addTransition(m, input) {
  const result = normalizeTransition(m, input);
  if (result.error) return result;
  if (m.transitions.some((t) => sameTransition(t, result.transition))) return { error: "Esa transición ya existe." };
  const transition = { id: nextTransitionId(m), ...result.transition };
  return { machine: { ...m, transitions: [...m.transitions, transition] }, transition };
}

// Para los AF: "0, 1" agrega una transición por símbolo.
export function addTransitions(m, from, to, symbols) {
  let current = m;
  let added = 0;
  for (const symbol of symbols) {
    const result = addTransition(current, { from, to, symbol });
    if (result.error) {
      if (result.error === "Esa transición ya existe.") continue;
      return result;
    }
    current = result.machine;
    added++;
  }
  if (!added) return { error: "Esas transiciones ya existen." };
  return { machine: current };
}

export function updateTransition(m, id, patch) {
  const old = m.transitions.find((t) => t.id === id);
  if (!old) return { error: "No existe esa transición." };
  const result = normalizeTransition(m, { ...old, ...patch });
  if (result.error) return result;
  if (m.transitions.some((t) => t.id !== id && sameTransition(t, result.transition))) return { error: "Esa transición ya existe." };
  return { machine: { ...m, transitions: m.transitions.map((t) => (t.id === id ? { id, ...result.transition } : t)) } };
}

export function removeTransition(m, id) {
  if (!m.transitions.some((t) => t.id === id)) return { error: "No existe esa transición." };
  return { machine: { ...m, transitions: m.transitions.filter((t) => t.id !== id) } };
}

// ---------- Alfabetos ----------

// Símbolos auxiliares que usan las transiciones (pila o cinta) además del alfabeto de entrada.
export function usedSymbols(m) {
  const set = new Set();
  for (const t of m.transitions) {
    if (m.type === "ap") for (const s of chars(`${t.pop}${t.push}`)) set.add(s);
    if (isTape(m)) { set.add(t.read); set.add(t.write); }
  }
  return [...set];
}

export function stackAlphabet(m) {
  return unique([m.bottom, ...m.extra, ...usedSymbols(m), ...m.alphabet]);
}

export function tapeAlphabet(m) {
  const base = m.type === "ala" ? [BOT, EOT] : [m.blank];
  return unique([...m.alphabet, ...base, ...m.extra, ...usedSymbols(m)]);
}

export function inputSymbols(m) {
  const set = new Set(m.alphabet);
  if (isFa(m)) for (const t of m.transitions) if (t.symbol) set.add(t.symbol);
  if (m.type === "ap") for (const t of m.transitions) if (t.read) set.add(t.read);
  return [...set];
}

// ---------- Validación y análisis ----------

// { errors, warnings }: errors impiden ejecutar; warnings avisan (no determinista, incompleto…).
export function analyze(m) {
  const errors = [];
  const warnings = [];
  if (!m.states.length) errors.push("Todavía no hay estados.");
  else if (!m.initial) errors.push("Falta marcar el estado inicial.");
  if (m.states.length && !m.accepting.length) warnings.push("No hay estados de aceptación.");
  const symbols = inputSymbols(m);

  if (m.type === "afd") {
    const seen = new Map();
    for (const t of m.transitions) {
      const key = `${t.from}|${t.symbol}`;
      if (seen.has(key)) warnings.push(`No es determinista: ${t.from} tiene más de una transición con ${t.symbol}.`);
      seen.set(key, true);
    }
    const missing = [];
    for (const s of m.states) for (const a of symbols) if (!seen.has(`${s.id}|${a}`)) missing.push(`f(${s.id}, ${a})`);
    if (missing.length) warnings.push(`Está incompleto: faltan ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}. La guía lo completa con un estado de error E.`);
  }
  if (m.type === "ap") {
    const detKeys = new Map();
    let nondeterministic = false;
    for (const t of m.transitions) {
      const key = `${t.from}|${t.pop}`;
      const list = detKeys.get(key) ?? [];
      for (const other of list) if (other.read === t.read || other.read === "" || t.read === "") nondeterministic = true;
      list.push(t);
      detKeys.set(key, list);
    }
    if (nondeterministic) warnings.push("Es no determinista: hay estados con más de una opción para la misma lectura y tope de pila.");
  }
  if (isTape(m)) {
    const seen = new Set();
    for (const t of m.transitions) {
      const key = `${t.from}|${t.read}`;
      if (seen.has(key)) warnings.push(`No es determinista: ${t.from} tiene más de una transición leyendo ${t.read}.`);
      seen.add(key);
    }
  }
  return { errors, warnings: unique(warnings) };
}

// Una máquina FA es determinista si no tiene λ y no repite (estado, símbolo).
export function isDeterministicFa(m) {
  const seen = new Set();
  for (const t of m.transitions) {
    if (t.symbol === "") return false;
    const key = `${t.from}|${t.symbol}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

// ---------- Aristas para el dibujo y las tablas ----------

export const formatSymbol = (symbol) => (symbol === "" ? "λ" : symbol);

export function transitionLabel(m, t) {
  if (isFa(m)) return formatSymbol(t.symbol);
  if (m.type === "ap") return `${formatSymbol(t.read)},${formatSymbol(t.pop)}/ ${formatSymbol(t.push)}`;
  return `${t.read}/ ${t.write},${t.move}`;
}

// Agrupa las transiciones entre el mismo par ordenado de estados en una sola flecha con varias etiquetas.
export function groupEdges(m) {
  const edges = new Map();
  for (const t of m.transitions) {
    const key = `${t.from}\u0000${t.to}`;
    if (!edges.has(key)) edges.set(key, { from: t.from, to: t.to, items: [] });
    edges.get(key).items.push({ id: t.id, label: transitionLabel(m, t) });
  }
  const list = [...edges.values()];
  const keys = new Set(list.map((e) => `${e.from}\u0000${e.to}`));
  return list.map((e) => {
    const labels = e.items.map((i) => i.label);
    // Los AF juntan los símbolos: "0, 1" en una sola línea.
    const text = isFa(m) ? [labels.join(", ")] : labels;
    return { ...e, labels: text, ids: e.items.map((i) => i.id), loop: e.from === e.to, hasReverse: e.from !== e.to && keys.has(`${e.to}\u0000${e.from}`) };
  });
}

// Tabla de transición de un AF: { columns, rows: [{ id, initial, accepting, cells: [string[]] }] }.
export function transitionTable(m) {
  const columns = [...inputSymbols(m)];
  const hasLambda = m.transitions.some((t) => t.symbol === "");
  if (hasLambda) columns.push("");
  return {
    columns,
    rows: m.states.map((s) => ({
      id: s.id,
      initial: m.initial === s.id,
      accepting: m.accepting.includes(s.id),
      cells: columns.map((c) => m.transitions.filter((t) => t.from === s.id && t.symbol === c).map((t) => t.to)),
    })),
  };
}

// Definición formal con la notación de la guía: AFD = ({0, 1}, {p, q}, p, {q}, f).
export function formalDefinition(m) {
  const set = (items) => `{${items.join(", ")}}`;
  const q = set(m.states.map((s) => s.id));
  const A = set(m.accepting);
  const name = m.name ? `${m.name} = ` : `${TYPE_LABEL[m.type]} = `;
  const start = m.initial ?? "—";
  if (isFa(m)) return `${name}(${set(inputSymbols(m))}, ${q}, ${start}, ${A}, f)`;
  if (m.type === "ap") return `${name}(${set(inputSymbols(m))}, ${set(stackAlphabet(m))}, ${q}, ${start}, ${m.bottom}, ${A}, f)`;
  if (m.type === "ala") return `${name}(${set(m.alphabet)}, ${set(tapeAlphabet(m))}, ${q}, ${start}, ${A}, f)`;
  return `${name}(${set(m.alphabet)}, ${set(tapeAlphabet(m))}, ${q}, ${start}, ${A}, f, ${m.blank})`;
}

// Copia profunda (para duplicar o deshacer).
export const cloneMachine = (m) => JSON.parse(JSON.stringify(m));

// Reparte los estados en una grilla cuando no tienen posición (por ejemplo, al importarlos de una tabla).
export function autoLayout(m, columns = 4, gap = 120) {
  return { ...m, states: m.states.map((s, i) => ({ ...s, x: 70 + (i % columns) * gap, y: 70 + Math.floor(i / columns) * gap })) };
}

// Valida un JSON importado y lo normaliza. Devuelve { machine } o { error }.
export function importMachine(raw) {
  let data;
  try {
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { error: "El archivo no es un JSON válido." };
  }
  if (!data || typeof data !== "object" || !MACHINE_TYPES.includes(data.type)) return { error: "El JSON no es un autómata del sandbox." };
  const base = createMachine(data.type, { name: typeof data.name === "string" ? data.name : "", alphabet: Array.isArray(data.alphabet) ? data.alphabet.map(String) : [], extra: Array.isArray(data.extra) ? data.extra.map(String) : [], bottom: data.bottom, blank: data.blank, pushMode: data.pushMode });
  let machine = base;
  for (const s of Array.isArray(data.states) ? data.states : []) {
    const r = addState(machine, { id: String(s.id), x: Number(s.x) || 80, y: Number(s.y) || 80 });
    if (r.error) return { error: r.error };
    machine = r.machine;
  }
  if (data.initial && hasState(machine, data.initial)) machine = { ...machine, initial: data.initial };
  machine = { ...machine, accepting: (Array.isArray(data.accepting) ? data.accepting : []).filter((a) => hasState(machine, a)) };
  for (const t of Array.isArray(data.transitions) ? data.transitions : []) {
    const r = addTransition(machine, t);
    if (r.error && r.error !== "Esa transición ya existe.") return { error: `Transición no válida: ${r.error}` };
    if (r.machine) machine = r.machine;
  }
  return { machine };
}
