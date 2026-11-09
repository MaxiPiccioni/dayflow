// Ayudas para armar los ejercicios de la Unidad 6 (ALA y máquinas de Turing).
import { formalDefinition, tapeAlphabet } from "../machines/model.js";

// Configuración base del editor de una máquina con cinta.
export const tape = (type, alphabet, extra = [], more = {}) => ({ type, alphabet, extra, lockAlphabet: true, ...(type === "mt" ? { blank: "b" } : {}), ...more });

export const lang = (machineType, alphabet, predicate, params = {}, extra = {}) => ({ kind: "machine-language", machineType, alphabet, maxLen: extra.maxLen ?? 7, predicate, params, ...extra });
export const outSpec = (machineType, fn, inputs, params = {}, extra = {}) => ({ kind: "machine-output", machineType, fn, inputs, params, ...extra });

export const sandbox = (reference, note) => ({ reference, referenceSource: "sandbox", referenceNote: note ?? "Solución propuesta por el sandbox: la guía muestra este autómata solo como dibujo (o con otra técnica). Hay otras soluciones correctas." });
export const guide = (reference, note) => ({ reference, referenceSource: "guia", ...(note ? { referenceNote: note } : {}) });

export const words = (alphabet, max, min = 0) => {
  const out = [];
  const go = (w) => { if (w.length >= min) out.push(w); if (w.length < max) for (const a of alphabet) go(w + a); };
  go("");
  return out;
};
export const nibblePairs = () => {
  const bits = Array.from({ length: 16 }, (_, n) => n.toString(2).padStart(4, "0"));
  return bits.flatMap((a) => bits.map((b) => `${a}*${b}`));
};

// Complejidad estructural de Shannon: estados × símbolos de la cinta (se usa para comparar dos máquinas).
export const shannon = (m) => {
  const symbols = tapeAlphabet(m).length;
  return `${m.states.length} estados × ${symbols} símbolos de cinta = ${m.states.length * symbols}`;
};

// Texto de solución: definición formal de la máquina de referencia y la idea.
export const solutionText = (m, idea, extra = "") => `${formalDefinition(m)}\n${idea}${extra ? `\n${extra}` : ""}`;
