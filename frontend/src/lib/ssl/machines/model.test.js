import { describe, expect, it } from "vitest";
import { addState, addTransition, addTransitions, analyze, createMachine, formalDefinition, groupEdges, importMachine, moveState, removeState, removeTransition, renameState, setInitial, toggleAccepting, transitionTable, updateTransition } from "./model.js";

const build = () => {
  let m = createMachine("afd", { alphabet: ["1"] });
  m = addState(m, { id: "p", x: 10, y: 10 }).machine;
  m = addState(m, { id: "q", x: 100, y: 10 }).machine;
  m = toggleAccepting(m, "q").machine;
  m = addTransition(m, { from: "p", to: "q", symbol: "1" }).machine;
  m = addTransition(m, { from: "q", to: "p", symbol: "1" }).machine;
  return m;
};

describe("estados", () => {
  it("el primer estado es el inicial y los nombres son únicos", () => {
    const m = build();
    expect(m.initial).toBe("p");
    expect(addState(m, { id: "p" }).error).toMatch(/Ya hay/);
    expect(addState(m, { id: "a b" }).error).toMatch(/espacios/);
    expect(addState(m, { id: "" }).error).toBeTruthy();
    expect(addState(m).id).toBe("q0");
  });
  it("renombrar actualiza transiciones, inicial y aceptación sin romper nada", () => {
    const r = renameState(build(), "q", "fin").machine;
    expect(r.accepting).toEqual(["fin"]);
    expect(r.transitions.map((t) => [t.from, t.to])).toEqual([["p", "fin"], ["fin", "p"]]);
    expect(renameState(build(), "q", "p").error).toMatch(/Ya hay/);
    expect(renameState(build(), "z", "w").error).toBeTruthy();
  });
  it("borrar un estado borra sus transiciones y reasigna el inicial", () => {
    const m = removeState(build(), "p").machine;
    expect(m.states.map((s) => s.id)).toEqual(["q"]);
    expect(m.transitions).toEqual([]);
    expect(m.initial).toBe("q");
    expect(removeState(removeState(m, "q").machine, "q").error).toBeTruthy();
  });
  it("mover, marcar inicial y alternar aceptación", () => {
    let m = moveState(build(), "p", 33.6, 44.2);
    expect(m.states[0]).toMatchObject({ x: 34, y: 44 });
    m = setInitial(m, "q").machine;
    expect(m.initial).toBe("q");
    expect(toggleAccepting(m, "q").machine.accepting).toEqual([]);
  });
});

describe("transiciones", () => {
  it("valida estados, λ en AFD y duplicados", () => {
    const m = build();
    expect(addTransition(m, { from: "p", to: "zz", symbol: "1" }).error).toMatch(/destino/);
    expect(addTransition(m, { from: "p", to: "q", symbol: "" }).error).toMatch(/λ/);
    expect(addTransition(m, { from: "p", to: "q", symbol: "1" }).error).toMatch(/ya existe/);
  });
  it("addTransitions agrega varios símbolos y salta los repetidos", () => {
    let m = createMachine("afnd");
    m = addState(m, { id: "a" }).machine;
    const r = addTransitions(m, "a", "a", ["0", "1", ""]);
    expect(r.machine.transitions).toHaveLength(3);
    expect(addTransitions(r.machine, "a", "a", ["0"]).error).toBeTruthy();
  });
  it("actualizar y borrar", () => {
    const m = build();
    const id = m.transitions[0].id;
    expect(updateTransition(m, id, { symbol: "0" }).machine.transitions[0].symbol).toBe("0");
    expect(removeTransition(m, id).machine.transitions).toHaveLength(1);
    expect(removeTransition(m, "tx").error).toBeTruthy();
  });
  it("AP, ALA y MT validan sus campos", () => {
    let ap = createMachine("ap", { alphabet: ["a"] });
    ap = addState(addState(ap, { id: "p" }).machine, { id: "q" }).machine;
    expect(addTransition(ap, { from: "p", to: "q", read: "a", pop: "#", push: "#a" }).machine.transitions[0]).toMatchObject({ read: "a", pop: "#", push: "#a" });
    expect(addTransition(ap, { from: "p", to: "q", read: "ab", pop: "", push: "" }).error).toBeTruthy();
    let mt = createMachine("mt", { alphabet: ["0"] });
    mt = addState(mt, { id: "p" }).machine;
    expect(addTransition(mt, { from: "p", to: "p", read: "0", write: "0", move: "D" }).machine.transitions).toHaveLength(1);
    expect(addTransition(mt, { from: "p", to: "p", read: "0", write: "0", move: "X" }).error).toMatch(/movimiento/);
    expect(addTransition(mt, { from: "p", to: "p", read: "", write: "0", move: "D" }).error).toBeTruthy();
  });
});

describe("análisis, aristas y definición", () => {
  it("avisa de máquinas incompletas, no deterministas y sin inicial", () => {
    expect(analyze(createMachine("afd")).errors).toContain("Todavía no hay estados.");
    let m = createMachine("afd", { alphabet: ["0", "1"] });
    m = addState(m, { id: "p" }).machine;
    m = addTransition(m, { from: "p", to: "p", symbol: "0" }).machine;
    expect(analyze(m).warnings.join(" ")).toMatch(/incompleto/);
    m = addTransition(m, { from: "p", to: "p", symbol: "1" }).machine;
    m = addState(m, { id: "q" }).machine;
    m = addTransition(m, { from: "p", to: "q", symbol: "1" }).machine;
    expect(analyze(m).warnings.join(" ")).toMatch(/No es determinista/);
  });
  it("agrupa transiciones entre el mismo par y detecta ida y vuelta", () => {
    const m = addTransition(build(), { from: "p", to: "p", symbol: "1" }).machine;
    const edges = groupEdges(m);
    expect(edges.find((e) => e.loop).labels).toEqual(["1"]);
    expect(edges.filter((e) => e.hasReverse)).toHaveLength(2);
    let two = createMachine("afd", { alphabet: ["0", "1"] });
    two = addState(addState(two, { id: "a" }).machine, { id: "b" }).machine;
    two = addTransitions(two, "a", "b", ["0", "1"]).machine;
    expect(groupEdges(two)[0].labels).toEqual(["0, 1"]);
  });
  it("tabla y definición formal como en la guía", () => {
    const m = build();
    expect(formalDefinition({ ...m, name: "AFD2a" })).toBe("AFD2a = ({1}, {p, q}, p, {q}, f)");
    const t = transitionTable(m);
    expect(t.columns).toEqual(["1"]);
    expect(t.rows.map((r) => [r.id, r.initial, r.accepting, r.cells[0]])).toEqual([["p", true, false, ["q"]], ["q", false, true, ["p"]]]);
  });
  it("exporta e importa JSON sin perder nada", () => {
    const m = build();
    const r = importMachine(JSON.stringify(m));
    expect(r.machine.states).toEqual(m.states);
    expect(r.machine.transitions.map((t) => [t.from, t.to, t.symbol])).toEqual(m.transitions.map((t) => [t.from, t.to, t.symbol]));
    expect(importMachine("{no").error).toBeTruthy();
    expect(importMachine({ type: "xx" }).error).toBeTruthy();
  });
});
