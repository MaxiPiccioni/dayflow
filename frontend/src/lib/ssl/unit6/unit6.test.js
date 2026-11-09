import { describe, expect, it } from "vitest";
import { UNIT6_SECTIONS } from "./index.js";
import { UNITS } from "../units.js";
import { checkMachine } from "../machines/check-machine.js";
import { analyze } from "../machines/model.js";
import { runMachine } from "../machines/run.js";

const parts = UNIT6_SECTIONS.flatMap((s) => s.exercises.flatMap((e) => e.parts.map((p) => ({ e, p }))));
const numbers = UNIT6_SECTIONS.flatMap((s) => s.exercises.map((e) => e.number));

describe("Unidad 6: ejercicios cargados", () => {
  it("están todos los ejercicios de la guía (1 a 32) y la unidad está activa", () => {
    expect([...numbers].sort((a, b) => a - b)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1).filter((n) => n !== 0));
    const unit = UNITS.find((u) => u.n === 6);
    expect(unit.sections.length).toBe(4);
  });

  it("los ids de ejercicios son únicos", () => {
    const ids = UNIT6_SECTIONS.flatMap((s) => s.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada referencia pasa su propia comprobación", () => {
    let withSpec = 0;
    for (const { e, p } of parts) {
      const cfg = p.machine;
      if (!cfg.spec) continue;
      withSpec++;
      expect(cfg.reference, `${e.id}.${p.id} sin referencia`).toBeTruthy();
      const r = checkMachine(cfg.reference, cfg.spec);
      expect(r.ok, `${e.id}.${p.id}: ${r.message} ${(r.detail ?? []).join(" ")}`).toBe(true);
    }
    expect(withSpec).toBeGreaterThanOrEqual(40);
  }, 30000);

  it("las máquinas de arranque (initial) y las referencias no tienen errores estructurales", () => {
    for (const { e, p } of parts) {
      for (const key of ["initial", "reference"]) {
        const m = p.machine[key];
        if (m) expect(analyze(m).errors, `${e.id}.${p.id}.${key}`).toEqual([]);
      }
    }
  });

  it("el tipo de máquina coincide con el del editor y los ejemplos se pueden ejecutar", () => {
    for (const { e, p } of parts) {
      const cfg = p.machine;
      if (cfg.reference) expect(cfg.reference.type, `${e.id}.${p.id}`).toBe(cfg.type);
      for (const input of cfg.runExamples ?? []) {
        const m = cfg.reference ?? cfg.initial;
        if (m) expect(() => runMachine(m, input), `${e.id}.${p.id} ${input}`).not.toThrow();
      }
    }
    for (const s of UNIT6_SECTIONS) {
      const m = s.example.machine;
      expect(analyze(m.initial).errors, s.id).toEqual([]);
    }
  });

  it("los ejercicios 2 y 17 piden el estado de error y arrancan sin él", () => {
    for (const id of ["u6-e2", "u6-e17"]) {
      const { p } = parts.find(({ e }) => e.id === id);
      expect(p.machine.spec.errorState).toBe(true);
      expect(p.machine.initial.states.some((s) => s.id === "qE")).toBe(false);
      const sinError = checkMachine(p.machine.initial, p.machine.spec);
      expect(sinError.ok).toBe(false);
    }
  });

  it("el ejercicio 20 rechaza el movimiento N", () => {
    const { p } = parts.find(({ e }) => e.id === "u6-e20");
    const withN = { ...p.machine.reference, transitions: p.machine.reference.transitions.map((t, i) => (i === 0 ? { ...t, move: "N" } : t)) };
    expect(checkMachine(withN, p.machine.spec).message).toMatch(/no permite el movimiento N/);
  });

  it("detecta una MT incorrecta con la entrada y la cinta que dejó", () => {
    const { p } = parts.find(({ e }) => e.id === "u6-e7");
    const wrong = { ...p.machine.reference, transitions: p.machine.reference.transitions.map((t) => (t.write === "P" ? { ...t, write: "I" } : t)) };
    const r = checkMachine(wrong, p.machine.spec);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/dejó .* en la cinta y tendría que dejar/);
  });
});
