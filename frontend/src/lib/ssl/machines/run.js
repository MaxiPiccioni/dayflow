import { isFa, isTape } from "./model.js";
import { formatFaConfig, runFa } from "./run-fa.js";
import { formatApConfig, runAp } from "./run-ap.js";
import { runTape, tapeText } from "./run-tape.js";

// Ejecución unificada para el ejecutor visual. Devuelve:
//   { kind: "fa" | "ap" | "tape", total, accepted, outcome, message, at(k) }
// at(k) = { states: Set, edges: Set (ids de transición), lines: string[] (descripciones del paso k) }
// total = cantidad de pasos mostrables (el paso 0 es la configuración inicial).
export function runMachine(m, input) {
  if (isFa(m)) {
    const r = runFa(m, input);
    return {
      kind: "fa",
      raw: r,
      total: r.levels.length,
      accepted: r.accepted,
      outcome: r.outcome,
      message: r.message,
      truncated: r.truncated,
      at: (k) => {
        const ids = r.levels[Math.min(k, r.levels.length - 1)] ?? [];
        return {
          states: new Set(ids.map((id) => r.nodes[id].state)),
          edges: new Set(ids.map((id) => r.nodes[id].via).filter(Boolean)),
          lines: ids.map((id) => formatFaConfig(r.nodes[id])),
        };
      },
    };
  }
  if (m.type === "ap") {
    const r = runAp(m, input);
    return {
      kind: "ap",
      raw: r,
      total: r.levels.length,
      accepted: r.accepted,
      outcome: r.outcome,
      message: r.message,
      truncated: r.truncated,
      at: (k) => {
        const ids = r.levels[Math.min(k, r.levels.length - 1)] ?? [];
        return {
          states: new Set(ids.map((id) => r.nodes[id].state)),
          edges: new Set(ids.map((id) => r.nodes[id].via).filter(Boolean)),
          lines: ids.map((id) => formatApConfig(r.nodes[id])),
          stacks: ids.map((id) => r.nodes[id].stack),
        };
      },
    };
  }
  if (isTape(m)) {
    const r = runTape(m, input);
    return {
      kind: "tape",
      raw: r,
      total: r.steps.length,
      accepted: r.accepted,
      outcome: r.outcome,
      message: r.message,
      truncated: !!r.truncated,
      at: (k) => {
        const s = r.steps[Math.min(k, r.steps.length - 1)];
        return { states: new Set([s.state]), edges: new Set(s.via ? [s.via] : []), lines: [`${s.state}: ${tapeText(s.tape)}`], tape: s.tape, head: s.head, state: s.state };
      },
    };
  }
  throw new Error("Tipo de máquina no soportado");
}
