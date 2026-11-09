import { describe, expect, it } from "vitest";
import { UNIT3_SECTIONS } from "./index.js";
import { checkMachine } from "../machines/check-machine.js";
import { checkAnswer } from "../check.js";
import { runFa } from "../machines/run-fa.js";
import { minimize } from "../automata.js";

const exercises = UNIT3_SECTIONS.flatMap((s) => s.exercises);
const machineParts = exercises.flatMap((e) => e.parts.filter((p) => p.machine).map((p) => ({ e, p })));

describe("Unidad 3: datos", () => {
  it("cubre los ejercicios 2 a 8, 10 y 11 con ids únicos", () => {
    expect(exercises.map((e) => e.number)).toEqual([2, 3, 4, 5, 6, 7, 8, 10, 11]);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
    for (const s of UNIT3_SECTIONS) expect(s.example.steps.length).toBeGreaterThan(2);
  });

  it("cada autómata de referencia pasa su propia comprobación", () => {
    expect(machineParts.length).toBe(16);
    for (const { e, p } of machineParts) {
      const result = checkMachine(p.machine.reference, p.machine.spec);
      expect(result.ok, `${e.id}.${p.id}: ${result.message}`).toBe(true);
    }
  });

  it("las comprobaciones detectan errores con contraejemplos concretos", () => {
    const e2a = machineParts.find(({ e, p }) => e.id === "u3-e2" && p.id === "a").p.machine;
    const e2b = machineParts.find(({ e, p }) => e.id === "u3-e2" && p.id === "b").p.machine;
    // Un AFD que acepta todo
    const wrong = { ...e2a.reference, accepting: ["p", "q"] };
    const r = checkMachine(wrong, e2a.spec);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/acepta 11 y no debería|acepta λ y no debería/);
    expect(checkMachine(e2b.reference, e2a.spec).ok).toBe(false);
  });

  it("detecta no determinismo, incompletitud y tipo equivocado", () => {
    const { p } = machineParts.find(({ e }) => e.id === "u3-e4");
    const ref = p.machine.reference;
    const incomplete = { ...ref, transitions: ref.transitions.filter((t) => t.from !== "E") };
    const r = checkMachine(incomplete, p.machine.spec);
    expect(r.ok).toBe(false);
    expect(r.message + (r.detail ?? []).join(" ")).toMatch(/incompleto/);
    const nd = { ...ref, transitions: [...ref.transitions, { id: "tx", from: "p", to: "E", symbol: "0" }] };
    expect(checkMachine(nd, p.machine.spec).message).toMatch(/determinista/);
    expect(checkMachine({ ...ref, type: "afnd" }, p.machine.spec).message).toMatch(/AFD/);
  });

  it("el ejemplo resuelto reproduce el árbol de 111", () => {
    const m = UNIT3_SECTIONS[0].example.machine.initial;
    const r = runFa(m, "111");
    expect(r.levels.map((l) => `${r.nodes[l[0]].state},${r.nodes[l[0]].rest}`)).toEqual(["p,111", "q,11", "p,1", "q,"]);
  });

  it("minimización: ejercicio 10 y 11 coinciden con la guía", () => {
    const e10 = exercises.find((e) => e.id === "u3-e10");
    expect(minimize(e10.tables[0]).minimal.rows).toEqual([["P1", "P1", "P1", "P2"], ["P2", "P2", "P2", "P2"]]);
    expect(checkAnswer(e10.parts[0].checks[0].spec, "no").ok).toBe(true);
    expect(checkAnswer(e10.parts[0].checks[0].spec, "si").ok).toBe(false);
    const e11 = exercises.find((e) => e.id === "u3-e11");
    const spec = e11.parts[0].checks[0].spec;
    expect(checkAnswer(spec, "A=B, C=E").ok).toBe(true);
    expect(checkAnswer(spec, "C=E, B=A").ok).toBe(true);
    expect(checkAnswer(spec, "A=B").ok).toBe(false);
    expect(checkAnswer(spec, "A=B, C=D, C=E").ok).toBe(false);
  });
});
