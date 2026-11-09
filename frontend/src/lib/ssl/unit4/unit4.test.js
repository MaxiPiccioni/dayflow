import { describe, expect, it } from "vitest";
import { UNIT4_SECTIONS } from "./index.js";
import { checkMachine } from "../machines/check-machine.js";
import { checkAnswer } from "../check.js";
import { determinize } from "../machines/convert.js";
import { AFND4 } from "./afnd.js";

const exercises = UNIT4_SECTIONS.flatMap((s) => s.exercises);
const parts = exercises.flatMap((e) => e.parts.map((p) => ({ e, p })));

describe("Unidad 4: datos", () => {
  it("cubre los ejercicios 1 a 25 de la guía", () => {
    const numbers = exercises.map((e) => e.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
    for (const s of UNIT4_SECTIONS) expect(s.example.steps.length).toBeGreaterThan(2);
  });

  it("cada autómata de referencia pasa su propia comprobación", () => {
    const withMachine = parts.filter(({ p }) => p.machine?.spec && p.machine?.reference);
    expect(withMachine.length).toBeGreaterThanOrEqual(30);
    for (const { e, p } of withMachine) {
      const r = checkMachine(p.machine.reference, p.machine.spec);
      expect(r.ok, `${e.id}.${p.id}: ${r.message}`).toBe(true);
    }
  });

  it("las comprobaciones de cadenas reconocidas coinciden con la guía", () => {
    const get = (n) => exercises.find((e) => e.number === n).parts[0].checks[0].spec;
    expect(checkAnswer(get(4), "1000").ok).toBe(true);
    expect(checkAnswer(get(4), "1000, 1001").ok).toBe(false);
    expect(checkAnswer(get(6), "babb, bbbb").ok).toBe(true);
    expect(checkAnswer(get(7), "001, 1100, 101").ok).toBe(true);
    expect(checkAnswer(get(8), "111").ok).toBe(true);
    expect(checkAnswer(get(15), "010, 1100").ok).toBe(true);
    expect(checkAnswer(get(17), "122").ok).toBe(true);
  });

  it("las comprobaciones de gramática aceptan la solución de la guía", () => {
    for (const n of [12, 13, 22, 23, 24]) {
      const ex = exercises.find((e) => e.number === n);
      const check = ex.parts[0].checks[0];
      expect(checkAnswer(check.spec, check.spec.expected.productions).ok, `ej. ${n}`).toBe(true);
    }
  });

  it("rechaza un AFD que no es equivalente y avisa cuál es la cadena", () => {
    const ex = exercises.find((e) => e.number === 4).parts[1].machine;
    const wrong = { ...ex.reference, accepting: ex.reference.accepting.slice(1) };
    const r = checkMachine(wrong, ex.spec);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/Tu autómata no acepta/);
  });

  it("exige la cantidad de estados del mínimo", () => {
    const e25 = exercises.find((e) => e.number === 25);
    const spec = e25.parts.find((p) => p.id === "1c").machine.spec;
    const notMin = e25.parts.find((p) => p.id === "1b").machine.reference;
    const r = checkMachine(notMin, spec);
    expect(r.ok).toBe(false);
    expect(r.message + (r.detail ?? []).join(" ")).toMatch(/3 estados/);
  });

  it("el ejemplo de conversión coincide con la tabla de la guía", () => {
    const { dfa } = determinize(AFND4);
    expect(dfa.states.map((s) => s.id)).toEqual(["C0", "C1", "C2", "C3"]);
  });
});
