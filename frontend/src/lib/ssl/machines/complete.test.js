import { describe, expect, it } from "vitest";
import { completeWithError, makeErrorState } from "./complete.js";
import { afFromList, tapeFromList } from "./build.js";
import { acceptsFa } from "./run-fa.js";
import { addState, addTransition, analyze, createMachine, toggleAccepting } from "./model.js";

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

describe("makeErrorState", () => {
  const base = () => {
    let m = createMachine("afd", { alphabet: ["0", "1"] });
    m = addState(m, { id: "p" }).machine;
    m = addState(m, { id: "e" }).machine;
    m = toggleAccepting(m, "e").machine;
    return m;
  };

  it("saca la aceptación y agrega un bucle por cada símbolo", () => {
    const r = makeErrorState(base(), "e").machine;
    expect(r.accepting).toEqual([]);
    expect(r.transitions.map((t) => [t.from, t.to, t.symbol])).toEqual([["e", "e", "0"], ["e", "e", "1"]]);
  });
  it("no pisa los bucles que ya hay y se puede repetir", () => {
    const once = makeErrorState(addTransition(base(), { from: "e", to: "e", symbol: "0" }).machine, "e").machine;
    expect(once.transitions).toHaveLength(2);
    expect(makeErrorState(once, "e").machine.transitions).toHaveLength(2);
  });
  it("se niega si el estado sale hacia otro y en máquinas que no son AF", () => {
    const m = addTransition(base(), { from: "e", to: "p", symbol: "0" }).machine;
    expect(makeErrorState(m, "e").error).toMatch(/borralas/);
    expect(makeErrorState(createMachine("ap", {}), "q").error).toBeTruthy();
  });
});
