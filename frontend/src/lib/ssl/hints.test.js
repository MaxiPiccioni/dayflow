import { describe, expect, it } from "vitest";
import { HINTS } from "./hints.js";
import { UNITS } from "./units.js";

describe("pistas del sandbox", () => {
  const exercises = UNITS.flatMap((u) => u.sections.flatMap((s) => s.exercises));

  it("cada ejercicio de las Unidades 2 a 6 tiene su pista cargada", () => {
    const missing = exercises.filter((e) => !e.hint).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it("no hay pistas para ejercicios que no existen", () => {
    const ids = new Set(exercises.map((e) => e.id));
    expect(Object.keys(HINTS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it("las pistas son cortas (orientan, no resuelven)", () => {
    for (const [id, hint] of Object.entries(HINTS)) {
      expect(hint.length, id).toBeGreaterThan(30);
      expect(hint.length, id).toBeLessThan(330);
    }
  });
});
