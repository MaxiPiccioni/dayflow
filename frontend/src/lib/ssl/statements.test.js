import { describe, expect, it } from "vitest";
import { UNITS } from "./units.js";

describe("enunciados", () => {
  it("todos los ejercicios tienen enunciado (propio o, si tienen un solo apartado, en el apartado) y los ejemplos también", () => {
    const empty = [];
    for (const u of UNITS) for (const s of u.sections) {
      if (!s.example?.statement?.trim()) empty.push(`${u.n}/${s.id}/ejemplo`);
      for (const e of s.exercises) if (!e.statement?.trim() && !(e.parts.length === 1 && e.parts[0].prompt?.trim())) empty.push(`${u.n}/${e.id}`);
    }
    expect(empty).toEqual([]);
  });
});
