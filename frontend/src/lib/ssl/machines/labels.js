import { LAMBDA, normalizeInput } from "../notation.js";
import { MOVES, isFa } from "./model.js";

// Etiquetas de transición con la notación de la guía, según el tipo de máquina:
//   AF:  "0, 1" (λ para la transición vacía, solo AFND)
//   AP:  "entrada, tope / lo que se apila"   por ejemplo  a,λ/ b   λ,S/ AaB   λ,#/ #S
//   ALA y MT: "lee / escribe, movimiento"    por ejemplo  a/ a,D   B/ B,I   b/ P,P

const toSymbol = (text) => {
  const t = text.trim();
  return t === LAMBDA ? "" : t;
};

export const LABEL_HELP = {
  afd: "Símbolos separados por coma, por ejemplo 0, 1.",
  afnd: "Símbolos separados por coma; λ para la transición vacía.",
  ap: "entrada, tope / apila — por ejemplo a,λ/ b · λ,S/ AaB · λ,#/ #S. Lo que va tras la barra se escribe de abajo hacia arriba (el tope queda a la derecha).",
  ala: "lee / escribe, movimiento — por ejemplo a/ a,D · B/ B,I. Movimientos: D, I, N (neutro) y P (parada).",
  mt: "lee / escribe, movimiento — por ejemplo 0/ 0,D · b/ P,P. Movimientos: D, I, N (neutro) y P (parada).",
};

export const LABEL_PLACEHOLDER = { afd: "0, 1", afnd: "0, 1, λ", ap: "a,#/ #a", ala: "a/ A,D", mt: "0/ 0,D" };

// Devuelve { symbols } (AF) o { fields } (AP, ALA, MT) o { error }.
export function parseLabel(m, rawText) {
  const text = normalizeInput(rawText).trim();
  if (!text) return { error: "Escribí la etiqueta de la transición." };

  if (isFa(m)) {
    const symbols = text.split(/[,\s]+/).filter(Boolean).map(toSymbol);
    if (!symbols.length) return { error: "Escribí al menos un símbolo." };
    for (const s of symbols) {
      if (Array.from(s).length > 1) return { error: `"${s}" tiene más de un símbolo: separalos con comas.` };
    }
    return { symbols: [...new Set(symbols)] };
  }

  const slash = text.indexOf("/");
  if (slash < 0) return { error: "Falta la barra /. El formato es " + (m.type === "ap" ? "entrada, tope / apila." : "lee / escribe, movimiento.") };
  const left = text.slice(0, slash);
  const right = text.slice(slash + 1);

  if (m.type === "ap") {
    const parts = left.split(",");
    if (parts.length !== 2) return { error: "Antes de la barra van dos cosas: entrada y tope, separadas por coma (λ si no se lee o no se mira la pila)." };
    const read = toSymbol(parts[0].replace(/\s+/g, ""));
    if (Array.from(read).length > 1) return { error: "Se lee a lo sumo un símbolo de la entrada." };
    return {
      fields: {
        read,
        pop: toSymbol(parts[1].replace(/\s+/g, "")),
        push: toSymbol(right.replace(/\s+/g, "")),
      },
    };
  }

  const parts = right.split(",").map((p) => p.trim());
  if (parts.length !== 2) return { error: "Después de la barra van lo que se escribe y el movimiento, separados por coma (por ejemplo a/ a,D)." };
  const read = left.trim();
  const [write, moveRaw] = parts;
  const move = moveRaw.toUpperCase();
  if (Array.from(read).length !== 1) return { error: "Antes de la barra va un solo símbolo de la cinta." };
  if (Array.from(write).length !== 1) return { error: "Hay que escribir un solo símbolo (el mismo que se leyó si no cambia)." };
  if (!MOVES.includes(move)) return { error: "El movimiento tiene que ser D, I, N o P." };
  return { fields: { read, write, move } };
}
