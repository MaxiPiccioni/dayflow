import { describe, expect, it } from "vitest";
import { DISENIO_AP } from "./diseno.js";
import { checkMachine } from "../machines/check-machine.js";
import { acceptsAp, runAp } from "../machines/run-ap.js";

const parts = DISENIO_AP.exercises.flatMap((e) => e.parts.map((p) => ({ e, p })));

describe("Unidad 5: AP de diseño", () => {
  it("cubre los ejercicios 1 a 4, 11 y 12", () => {
    expect(DISENIO_AP.exercises.map((e) => e.number)).toEqual([1, 2, 3, 4, 11, 12]);
    expect(DISENIO_AP.example.steps.length).toBeGreaterThan(3);
  });

  it("cada AP de referencia pasa su propia comprobación", () => {
    expect(parts.length).toBe(16);
    for (const { e, p } of parts) {
      const r = checkMachine(p.machine.reference, p.machine.spec);
      expect(r.ok, `${e.id}.${p.id}: ${r.message} ${(r.detail ?? []).join(" ")}`).toBe(true);
    }
  });

  it("tablas operativas de la guía: ((())), 0001000 y 0101*1001", () => {
    const get = (id, part = "") => parts.find(({ e, p }) => e.id === id && p.id === part).p.machine.reference;
    const rows = (r) => r.table.map((x) => `${x.state} ${x.rest === "" ? "-" : x.rest} ${x.stack}`);
    expect(rows(runAp(get("u5-e1", "a"), "((()))"))).toEqual(["q0 ((())) #", "q1 (())) #(", "q1 ())) #((", "q1 ))) #(((", "q2 )) #((", "q2 ) #(", "q2 - #", "q3 - #"]);
    expect(rows(runAp(get("u5-e4", "a"), "0001000"))).toEqual(["q0 0001000 #", "q1 001000 #0", "q1 01000 #00", "q1 1000 #000", "q2 000 #000", "q2 00 #00", "q2 0 #0", "q2 - #", "q3 - #"]);
  });

  it("el AP del 12.a coincide con la tabla 5.18: cuenta 1s del primero y 0s del segundo", () => {
    const ap = parts.find(({ e, p }) => e.id === "u5-e12" && p.id === "a").p.machine.reference;
    expect(acceptsAp(ap, "1100*0011").accepted).toBe(true);
    expect(acceptsAp(ap, "1100*0111").accepted).toBe(false);
    expect(acceptsAp(ap, "0000*1111").accepted).toBe(true);
    // Sin la transición (q2, 1, #) que le falta a la tabla de la guía, 1100*0011 se rechazaría.
    const guideTable = { ...ap, transitions: ap.transitions.filter((t) => !(t.from === "q2" && t.read === "1" && t.pop === "#")) };
    expect(acceptsAp(guideTable, "1100*0011").accepted).toBe(false);
  });

  it("el AP de la jerarquía rechaza llaves dentro de corchetes", () => {
    const ap = parts.find(({ e }) => e.id === "u5-e11").p.machine.reference;
    expect(acceptsAp(ap, "{[()()][()]}(){[()]}").accepted).toBe(true);
    expect(acceptsAp(ap, "[{}]").accepted).toBe(false);
    expect(acceptsAp(ap, "(())").accepted).toBe(false);
  });

  it("detecta un AP incorrecto con contraejemplo", () => {
    const { p } = parts.find(({ e, p }) => e.id === "u5-e1" && p.id === "a");
    const wrong = { ...p.machine.reference, transitions: p.machine.reference.transitions.filter((t) => !(t.from === "q2" && t.read === ")")) };
    const r = checkMachine(wrong, p.machine.spec);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/no acepta/);
  });
});
