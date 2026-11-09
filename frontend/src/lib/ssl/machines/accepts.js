import { isFa } from "./model.js";
import { acceptsFa } from "./run-fa.js";
import { acceptsAp } from "./run-ap.js";
import { runTape } from "./run-tape.js";

// ¿La máquina reconoce la cadena? Funciona para los cinco tipos. { accepted, truncated }.
export function acceptsMachine(m, word, limits = {}) {
  if (isFa(m)) return { accepted: acceptsFa(m, word), truncated: false };
  if (m.type === "ap") return acceptsAp(m, word, limits);
  const r = runTape(m, word, { maxSteps: limits.maxSteps ?? 4000 });
  return { accepted: r.accepted, truncated: r.reason === "límite" };
}
