import { BOT, EOT } from "./model.js";

// Ejecución de autómatas linealmente acotados (ALA) y máquinas de Turing (MT), deterministas.
//  - ALA: la cinta es ├ cadena ┤ y el cabezal arranca en ├; no puede salirse de ├ ni ┤.
//  - MT: la cinta es b cadena b (blancos "b" a los lados, que se agregan sin límite); el cabezal arranca
//    en el primer símbolo de la cadena.
// Movimientos: D (derecha), I (izquierda), N (neutro: el cabezal se queda y la máquina sigue) y P (parada:
// se graba, se cambia de estado y la máquina se detiene).

const ERROR_STATE = /^(q?[eE]|error)$/;

const DEFAULTS = { maxSteps: 20000 };

// La cinta de la MT siempre muestra al menos un blanco a cada lado del cabezal (cinta infinita en los dos sentidos).
function padBlanks(m, tape, getHead, setHead) {
  while (getHead() < 1) { tape.unshift(m.blank); setHead(getHead() + 1); }
  while (getHead() > tape.length - 2) tape.push(m.blank);
}

export function initialTape(m, input) {
  if (m.type === "ala") return { tape: [BOT, ...Array.from(input), EOT], head: 0 };
  return { tape: [m.blank, ...Array.from(input), m.blank], head: 1 };
}

// Cinta como texto: ├ 1 1 0 0 ┤ se muestra "├1100┤"; en la MT, "b0100110b".
export const tapeText = (tape) => tape.join("");

// Contenido de la cinta sin los blancos de los extremos (para comparar salidas): "0100110P".
export function tapeContent(m, tape) {
  let from = 0;
  let to = tape.length;
  if (m.type === "ala") return tape.filter((s) => s !== BOT && s !== EOT).join("");
  while (from < to && tape[from] === m.blank) from++;
  while (to > from && tape[to - 1] === m.blank) to--;
  return tape.slice(from, to).join("");
}

// { steps, halted, reason, state, accepted, outcome, message, usedCells, truncated }
// steps[i] = { n, state, tape, head, via } (via = id de la transición que llevó hasta acá)
export function runTape(m, input, limits = {}) {
  const { maxSteps } = { ...DEFAULTS, ...limits };
  if (m.type !== "ala" && m.type !== "mt") throw new Error("runTape es para ALA y MT.");
  if (!m.initial) return finish(m, input, [{ n: 0, state: "—", tape: [], head: 0, via: null }], "error", "Falta el estado inicial.");
  const table = new Map();
  let nondeterministic = false;
  for (const t of m.transitions) {
    const key = `${t.from}\u0000${t.read}`;
    if (table.has(key)) nondeterministic = true;
    else table.set(key, t);
  }
  let { tape, head } = initialTape(m, input);
  if (m.type === "mt") padBlanks(m, tape, () => head, (h) => { head = h; });
  let state = m.initial;
  const steps = [{ n: 0, state, tape: [...tape], head, via: null }];
  const seen = new Set([`${state}|${head}|${tape.join("")}`]);
  let minCell = head;
  let maxCell = head;
  for (let n = 1; n <= maxSteps; n++) {
    const t = table.get(`${state}\u0000${tape[head]}`);
    if (!t) return { ...finish(m, input, steps, "sin transición", `En el estado ${state} no hay transición para leer ${tape[head]}.`), nondeterministic, usedCells: maxCell - minCell + 1 };
    tape = [...tape];
    tape[head] = t.write;
    state = t.to;
    if (t.move === "D") head++;
    else if (t.move === "I") head--;
    if (m.type === "ala" && (head < 0 || head >= tape.length)) {
      steps.push({ n, state, tape: [...tape], head: Math.min(Math.max(head, 0), tape.length - 1), via: t.id });
      return { ...finish(m, input, steps, "fuera de cinta", "El cabezal se salió de la cinta (un ALA no puede pasar de ├ ni ┤)."), nondeterministic, usedCells: maxCell - minCell + 1 };
    }
    if (m.type === "mt") padBlanks(m, tape, () => head, (h) => { head = h; });
    minCell = Math.min(minCell, head);
    maxCell = Math.max(maxCell, head);
    steps.push({ n, state, tape: [...tape], head, via: t.id });
    if (t.move === "P") return { ...finish(m, input, steps, "parada", ""), nondeterministic, usedCells: maxCell - minCell + 1 };
    const key = `${state}|${head}|${tape.join("")}`;
    if (seen.has(key)) return { ...finish(m, input, steps, "bucle", "La máquina repite una configuración: se quedaría dando vueltas para siempre."), nondeterministic, usedCells: maxCell - minCell + 1 };
    seen.add(key);
  }
  return { ...finish(m, input, steps, "límite", `Se cortó la ejecución a los ${maxSteps} pasos.`), nondeterministic, usedCells: maxCell - minCell + 1, truncated: true };
}

function finish(m, input, steps, reason, detail) {
  const last = steps[steps.length - 1];
  const halted = reason === "parada" || reason === "sin transición";
  const isError = ERROR_STATE.test(last.state) || ["fuera de cinta", "bucle", "límite"].includes(reason);
  const accepted = halted && m.accepting.includes(last.state) && !ERROR_STATE.test(last.state);
  let outcome;
  if (isError) outcome = "error";
  else if (accepted) outcome = "reconocida";
  else if (!m.accepting.length && halted) outcome = "se detuvo";
  else outcome = "no reconocida";
  const shown = input === "" ? "λ" : input;
  const final = tapeContent(m, last.tape);
  let message;
  if (outcome === "reconocida") message = `La cadena ${shown} es reconocida: la máquina se detuvo en el estado de aceptación ${last.state} con la cinta ${tapeText(last.tape)}.`;
  else if (outcome === "se detuvo") message = `La máquina se detuvo en ${last.state}. Cinta final: ${tapeText(last.tape)}.`;
  else if (outcome === "error") message = detail || `La máquina cayó en el estado de error ${last.state}.`;
  else message = `La cadena ${shown} no es reconocida: la máquina se detuvo en ${last.state}, que no es de aceptación${detail ? ` (${detail})` : ""}.`;
  return { steps, halted, reason, state: last.state, accepted, outcome, message, content: final, finalTape: last.tape, truncated: false };
}

// Salida de la máquina para una entrada: contenido de la cinta al final (sin blancos de los extremos).
export function outputOf(m, input, limits) {
  const r = runTape(m, input, limits);
  return { ...r, output: r.content };
}
