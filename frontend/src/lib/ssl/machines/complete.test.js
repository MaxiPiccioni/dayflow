import { describe, expect, it } from "vitest";
import { completeWithError } from "./complete.js";
import { afFromList, tapeFromList } from "./build.js";
import { acceptsFa } from "./run-fa.js";
import { analyze } from "./model.js";

describe("completar con estado de error", () => {
  it("un AFD parcial queda completo y reconoce lo mismo", () => {
    const m = afFromList({ type: "afd", alphabet: ["0", "1"], states: ["p", "q"], start: "p", accepting: ["q"], transitions: ["p 1 q", "q 1 q"] });
    const r = completeWithError(m);
    expect(r.error).toBeUndefined();
    const done = r.machine;
    expect(done.states.map((s) => s.id)).toContain("E");
    for (const s of done.states) for (const a of ["0", "1"]) expect(done.transitions.some((t) => t.from === s.id && t.symbol === a)).toBe(true);
    for (const w of ["", "1", "11", "0", "10", "01"]) expect(acceptsFa(done, w)).toBe(acceptsFa(m, w));
    expect(completeWithError(done).error).toMatch(/ya está completo/);
  });

  it("una MT recibe qE con parada y el resto sigue igual", () => {
    const m = tapeFromList({ alphabet: ["0", "1"], states: ["p", "f"], start: "p", accepting: ["f"], transitions: ["p p 0/0,D", "p f b/b,P"] });
    const r = completeWithError(m);
    expect(r.error).toBeUndefined();
    expect(r.machine.transitions.some((t) => t.from === "p" && t.read === "1" && t.to === "qE" && t.move === "P")).toBe(true);
    expect(analyze(r.machine).errors).toEqual([]);
  });

  it("no aplica a los autómatas con pila", () => {
    expect(completeWithError({ type: "ap", states: [], transitions: [], alphabet: [], extra: [] }).error).toMatch(/pila/);
  });
});
