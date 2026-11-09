import { addState, addTransition, autoLayout, createMachine, setInitial, toggleAccepting } from "./model.js";

// Armado rápido de máquinas desde datos compactos (para los ejercicios y los tests). Todo se verifica:
// si algo está mal escrito, lanza un error en vez de dejar una máquina rota.

function must(result) {
  if (result.error) throw new Error(result.error);
  return result.machine;
}

// Tabla de un AF: rows = [[estado, destino con el 1.er símbolo, …]]; un destino puede ser "-" (nada),
// "p" o varios "p q" separados por espacio. Ejemplo: afFromTable({ alphabet: ["a","b"], start: "p", accepting: ["q"], rows: [["p","q","p"], …] }).
export function afFromTable({ type = "afd", name = "", alphabet, extraColumns = [], start, accepting = [], rows, layout }) {
  let m = createMachine(type, { name, alphabet });
  for (const row of rows) m = must(addState(m, { id: row[0] }));
  const columns = [...alphabet, ...extraColumns];
  for (const row of rows) {
    columns.forEach((symbol, i) => {
      const cell = row[i + 1];
      if (!cell || cell === "-") return;
      for (const target of String(cell).split(/[\s,]+/).filter(Boolean)) {
        m = must(addTransition(m, { from: row[0], to: target, symbol: symbol === "λ" ? "" : symbol }));
      }
    });
  }
  m = must(setInitial(m, start));
  for (const a of accepting) m = must(toggleAccepting(m, a));
  return layout ? { ...autoLayout(m, layout.columns, layout.gap), name } : { ...autoLayout(m), name };
}

// Lista de transiciones de AF: ["p 1 q", "q 1 p"] ("λ" para la vacía).
export function afFromList({ type = "afd", name = "", alphabet, states, start, accepting = [], transitions }) {
  let m = createMachine(type, { name, alphabet });
  for (const id of states) m = must(addState(m, { id }));
  for (const line of transitions) {
    const [from, symbol, to] = line.split(" ");
    m = must(addTransition(m, { from, to, symbol: symbol === "λ" ? "" : symbol }));
  }
  m = must(setInitial(m, start));
  for (const a of accepting) m = must(toggleAccepting(m, a));
  return { ...autoLayout(m), name };
}

// AP: transiciones "p q a,λ/ b" (de, a, etiqueta); el campo pop/push admite λ.
export function apFromList({ name = "", alphabet, extra = [], bottom = "#", pushMode = "natural", states, start, accepting = [], transitions }) {
  let m = createMachine("ap", { name, alphabet, extra, bottom, pushMode });
  for (const id of states) m = must(addState(m, { id }));
  for (const line of transitions) {
    const [from, to, ...rest] = line.split(" ");
    const label = rest.join("");
    const slash = label.indexOf("/");
    const [read, pop] = label.slice(0, slash).split(",").map((x) => (x === "λ" ? "" : x));
    const push = label.slice(slash + 1) === "λ" ? "" : label.slice(slash + 1);
    m = must(addTransition(m, { from, to, read, pop, push }));
  }
  m = must(setInitial(m, start));
  for (const a of accepting) m = must(toggleAccepting(m, a));
  return { ...autoLayout(m), name };
}

// ALA / MT: transiciones "q0 q1 a/A,D".
export function tapeFromList({ type = "mt", name = "", alphabet, extra = [], blank = "b", states, start, accepting = [], transitions }) {
  let m = createMachine(type, { name, alphabet, extra, blank });
  for (const id of states) m = must(addState(m, { id }));
  for (const line of transitions) {
    const [from, to, label] = line.split(" ");
    const slash = label.indexOf("/");
    const read = label.slice(0, slash);
    const [write, move] = label.slice(slash + 1).split(",");
    m = must(addTransition(m, { from, to, read, write, move }));
  }
  m = must(setInitial(m, start));
  for (const a of accepting) m = must(toggleAccepting(m, a));
  return { ...autoLayout(m), name };
}
