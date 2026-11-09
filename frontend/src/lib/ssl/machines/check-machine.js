import { allStrings } from "./run-fa.js";
import { faEquivalent } from "./convert.js";
import { acceptsMachine } from "./accepts.js";
import { OUTPUTS, predicateOf } from "./predicates.js";
import { analyze, inputSymbols, isDeterministicFa, isFa, isTape, TYPE_LABEL } from "./model.js";
import { runTape } from "./run-tape.js";
import { fmtWord } from "../notation.js";

// Comprobación de los autómatas que dibuja el estudiante. Devuelve { ok, message, detail?, counterexamples? }.
//
// spec.kind:
//   "machine-language"   la máquina tiene que reconocer exactamente el lenguaje de un predicado, probando todas
//                        las cadenas hasta maxLen. Muestra contraejemplos concretos.
//   "machine-equivalent" la máquina tiene que ser equivalente a una de referencia (exacto para AF).
//   "machine-output"     una MT/ALA tiene que dejar en la cinta la salida esperada para cada entrada de prueba.
//
// Otros campos: machineType (tipo pedido), alphabet, maxLen, deterministic, complete, errorState.

const BUDGET_MS = 2500;
const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
const bad = (message, extra = {}) => ({ ok: false, message, ...extra });
const show = (w) => fmtWord(w);

function typeProblem(machine, spec) {
  if (spec.machineType && machine.type !== spec.machineType) {
    return `Este ejercicio se resuelve con un ${TYPE_LABEL[spec.machineType]} y el editor tiene un ${TYPE_LABEL[machine.type]}.`;
  }
  return "";
}

function structureProblems(machine, spec) {
  const { errors } = analyze(machine);
  if (errors.length) return [errors[0]];
  const problems = [];
  if (machine.type === "afd" && !isDeterministicFa(machine)) problems.push("No es determinista: hay un estado con dos transiciones para el mismo símbolo.");
  if (isFa(machine) && (spec.complete ?? false)) {
    const symbols = (spec.alphabet ?? inputSymbols(machine)).filter((s) => s !== "");
    const missing = [];
    for (const s of machine.states) for (const a of symbols) if (!machine.transitions.some((t) => t.from === s.id && t.symbol === a)) missing.push(`f(${s.id}, ${a})`);
    if (missing.length) problems.push(`Está incompleto: faltan ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}. Completalo con un estado de error E.`);
  }
  if (spec.exactStates && machine.states.length !== spec.exactStates) problems.push(`Pasa el lenguaje, pero el autómata pedido tiene ${spec.exactStates} estados y el tuyo tiene ${machine.states.length}${machine.states.length > spec.exactStates ? " (todavía se puede minimizar)" : ""}.`);
  if (spec.errorState && !machine.states.some((s) => /^(q?[eE]|error)$/.test(s.id))) problems.push("Falta el estado de error E que pide el ejercicio.");
  return problems;
}

function incompleteNote(machine, spec) {
  if (!isFa(machine) || (spec.complete ?? false)) return "";
  const symbols = (spec.alphabet ?? inputSymbols(machine)).filter((s) => s !== "");
  const incomplete = machine.states.some((s) => symbols.some((a) => !machine.transitions.some((t) => t.from === s.id && t.symbol === a)));
  return incomplete ? " Tu autómata es parcial (faltan transiciones): la guía lo completa con un estado de error E, pero reconoce el mismo lenguaje." : "";
}

function languageCheck(machine, spec) {
  const predicate = predicateOf(spec);
  const alphabet = spec.alphabet ?? machine.alphabet;
  const maxLen = spec.maxLen ?? (isFa(machine) ? 8 : machine.type === "ap" ? 6 : 6);
  const started = Date.now();
  const wrongAccept = [];
  const wrongReject = [];
  let checked = 0;
  let truncatedAny = false;
  let timedOut = false;
  for (const w of allStrings(alphabet, maxLen)) {
    if (Date.now() - started > BUDGET_MS) { timedOut = true; break; }
    const expected = predicate(w);
    if (expected === null) continue;
    const { accepted, truncated } = acceptsMachine(machine, w);
    truncatedAny ||= truncated;
    checked++;
    if (accepted && !expected) wrongAccept.push(w);
    else if (!accepted && expected) wrongReject.push(w);
    if (wrongAccept.length + wrongReject.length >= 6) break;
  }
  return { wrongAccept, wrongReject, checked, maxLen, truncatedAny, timedOut };
}

export function checkMachine(machine, spec) {
  try {
    const type = typeProblem(machine, spec);
    if (type) return bad(type);
    const problems = structureProblems(machine, spec);

    if (spec.kind === "machine-language") {
      if (problems.length && !problems[0].startsWith("Está incompleto")) return bad(problems[0], { detail: problems.slice(1) });
      const r = languageCheck(machine, spec);
      const counter = [
        ...r.wrongAccept.slice(0, 3).map((w) => `Tu autómata acepta ${show(w)} y no debería.`),
        ...r.wrongReject.slice(0, 3).map((w) => `Tu autómata no acepta ${show(w)} y debería.`),
      ];
      if (counter.length) return bad(counter[0], { detail: [...counter.slice(1), ...problems], counterexamples: [...r.wrongAccept, ...r.wrongReject] });
      if (problems.length) return bad(problems[0], { detail: problems.slice(1) });
      const note = r.truncatedAny ? " La búsqueda de alguna cadena se cortó por límite de tamaño." : r.timedOut ? " (La comprobación se cortó por tiempo antes de revisar todas las cadenas.)" : "";
      return ok(`¡Correcto! Reconoce exactamente el lenguaje pedido (se probaron las ${r.checked} cadenas de hasta ${r.maxLen} símbolos).${incompleteNote(machine, spec)}${note}`);
    }

    if (spec.kind === "machine-equivalent") {
      if (problems.length && !problems[0].startsWith("Está incompleto")) return bad(problems[0], { detail: problems.slice(1) });
      const reference = spec.reference;
      if (isFa(machine) && isFa(reference)) {
        const r = faEquivalent(machine, reference);
        if (r.equal) return ok(`¡Correcto! Es equivalente al autómata dado (comparación exacta).${incompleteNote(machine, spec)}`);
        return bad(r.firstAccepts ? `Tu autómata acepta ${show(r.word)} y el original no.` : `Tu autómata no acepta ${show(r.word)} y el original sí.`);
      }
      const alphabet = spec.alphabet ?? reference.alphabet;
      const maxLen = spec.maxLen ?? 6;
      for (const w of allStrings(alphabet, maxLen)) {
        const a = acceptsMachine(machine, w).accepted;
        const b = acceptsMachine(reference, w).accepted;
        if (a !== b) return bad(a ? `Tu autómata acepta ${show(w)} y el original no.` : `Tu autómata no acepta ${show(w)} y el original sí.`);
      }
      return ok(`¡Correcto! Coincide con el autómata dado en todas las cadenas de hasta ${maxLen} símbolos.`);
    }

    if (spec.kind === "machine-output") {
      if (!isTape(machine)) return bad("Este ejercicio se resuelve con una máquina que escribe en la cinta.");
      const expectedOf = spec.fn ? (input) => OUTPUTS[spec.fn](input, spec.params ?? {}) : null;
      const inputs = [...(spec.inputs ?? [])];
      if (spec.generate) for (const w of allStrings(spec.generate.alphabet, spec.generate.maxLen)) if (w.length >= (spec.generate.minLen ?? 1) && (!spec.generate.filter || new RegExp(spec.generate.filter).test(w))) inputs.push(w);
      const unique = [...new Set(inputs)];
      const failures = [];
      for (const input of unique) {
        const expected = spec.cases?.find((c) => c.input === input)?.output ?? expectedOf?.(input);
        if (expected == null) continue;
        const r = runTape(machine, input, { maxSteps: 6000 });
        if (r.outcome === "error") { failures.push(`Con la entrada ${show(input)} la máquina falló: ${r.message}`); continue; }
        if (r.content !== expected) failures.push(`Con la entrada ${show(input)} tu máquina dejó ${show(r.content)} en la cinta y tendría que dejar ${show(expected)}.`);
        else if (spec.requireAccept && !r.accepted) failures.push(`Con la entrada ${show(input)} la cinta quedó bien, pero la máquina no terminó en un estado de aceptación.`);
        if (failures.length >= 4) break;
      }
      if (failures.length) return bad(failures[0], { detail: failures.slice(1) });
      return ok(`¡Correcto! Dejó la cinta como se pide en las ${unique.length} entradas de prueba.`);
    }

    return bad("Este ejercicio todavía no se puede comprobar automáticamente.");
  } catch (err) {
    return bad(err.message);
  }
}
