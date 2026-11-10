import { addState, addTransition, hasState, isFa, isTape, tapeAlphabet } from "./model.js";
import { nextFreePosition } from "./layout.js";

const ERROR_ID = { fa: "E", tape: "qE" };

// "Completar con estado de error": agrega el estado de error (E en los AF, qE en ALA y MT) y manda ahí todo lo que
// no tiene transición. En los AF cada símbolo faltante lleva a E (y E se queda en E); en ALA y MT se graba lo mismo que se
// leyó y la máquina se detiene (P). Devuelve { machine } o { error }.
export function completeWithError(machine) {
  if (machine.type === "ap") return { error: "En un autómata con pila no se completa con estado de error: faltar una transición ya lo rechaza." };
  const fa = isFa(machine);
  const errorId = fa ? ERROR_ID.fa : ERROR_ID.tape;
  let m = machine;
  if (!hasState(m, errorId)) {
    const added = addState(m, { id: errorId, ...nextFreePosition(m.states) });
    if (added.error) return added;
    m = added.machine;
  }
  const symbols = (fa ? m.alphabet : tapeAlphabet(m)).filter((s) => s !== "");
  const states = m.states.map((s) => s.id).filter((id) => !(isTape(m) && m.accepting.includes(id) && id !== errorId));
  let added = 0;
  for (const from of states) {
    if (isTape(m) && from === errorId) continue;
    for (const symbol of symbols) {
      const exists = m.transitions.some((t) => t.from === from && (fa ? t.symbol === symbol : t.read === symbol));
      if (exists) continue;
      const result = fa
        ? addTransition(m, { from, to: errorId, symbol })
        : addTransition(m, { from, to: errorId, read: symbol, write: symbol, move: "P" });
      if (result.error) return result;
      m = result.machine;
      added++;
    }
  }
  if (!added && m === machine) return { error: "El autómata ya está completo." };
  return { machine: m };
}

// "Convertir en estado de error" (solo AF): el estado deja de ser de aceptación y se queda en sí mismo con todos los símbolos
// del alfabeto. Si ya sale hacia otro estado no se toca nada: primero hay que borrar esas flechas.
export function makeErrorState(machine, id) {
  if (!isFa(machine)) return { error: "El estado de error con bucles se usa en los autómatas finitos." };
  if (!hasState(machine, id)) return { error: `No existe el estado ${id}.` };
  if (machine.transitions.some((t) => t.from === id && t.to !== id)) return { error: `${id} tiene transiciones hacia otros estados: borralas antes de convertirlo en estado de error.` };
  let m = { ...machine, accepting: machine.accepting.filter((a) => a !== id) };
  for (const symbol of m.alphabet.filter((s) => s !== "")) {
    if (m.transitions.some((t) => t.from === id && t.symbol === symbol)) continue;
    const result = addTransition(m, { from: id, to: id, symbol });
    if (result.error) return result;
    m = result.machine;
  }
  return { machine: m };
}
