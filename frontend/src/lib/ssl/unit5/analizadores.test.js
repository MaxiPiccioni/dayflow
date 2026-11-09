import { describe, expect, it } from "vitest";
import { ANALIZADORES, DETERMINISMO } from "./analizadores.js";
import { checkMachine } from "../machines/check-machine.js";
import { runAp } from "../machines/run-ap.js";

const parts = ANALIZADORES.exercises.flatMap((e) => e.parts.map((p) => ({ e, p })));

describe("Unidad 5: analizadores y determinismo", () => {
  it("cubre los ejercicios 5 a 10, 13 y 14", () => {
    expect([...ANALIZADORES.exercises, ...DETERMINISMO.exercises].map((e) => e.number).sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9, 10, 13, 14]);
  });

  it("cada analizador de referencia pasa su comprobación", () => {
    for (const { e, p } of parts) {
      const r = checkMachine(p.machine.reference, p.machine.spec);
      expect(r.ok, `${e.id}.${p.id}: ${r.message}`).toBe(true);
    }
  });

  it("los analizadores aceptan la cadena de cada ejercicio", () => {
    for (const { e, p } of parts) {
      const word = p.machine.runExamples[0];
      expect(runAp(p.machine.reference, word, { maxNodes: 8000 }).accepted, `${e.id}.${p.id} ${word}`).toBe(true);
    }
  });

  it("las tablas operativas escritas en la solución coinciden con las que calcula el motor (ejercicios 13 y 14)", async () => {
    const rows = (r) => r.table.map((x) => `${x.state} ${x.rest === "" ? "-" : x.rest} ${x.stack}`);
    const get = (id, part) => parts.find(({ e, p }) => e.id === id && p.id === part).p;
    const a13 = get("u5-e13", "a");
    expect(rows(runAp(a13.machine.reference, "0111")).map((r) => r.replace(/ /g, "")))
      .toEqual(a13.solution.split("\n").filter((l) => /^\d+\s/.test(l)).map((l) => l.split(/\s+/).slice(1).join("")));
    const b14 = get("u5-e14", "b");
    const { buildAsa } = await import("../machines/analyzers.js");
    const { parseGrammar } = await import("../grammar.js");
    const g14 = parseGrammar({ productions: ["S := AaB", "A := bB", "A := aa", "B := bC", "B := b", "C := b"].join(String.fromCharCode(10)) }).grammar;
    expect(rows(runAp(buildAsa(g14, { style: "exercise" }), "aaabb")).map((r) => r.replace(/ /g, "")))
      .toEqual(b14.solution.split("\n").filter((l) => /^\d+\s/.test(l)).map((l) => l.split(/\s+/).slice(1).join("")));
  });

  it("el AP del ejemplo con estado de error es no determinista (λ,# contra ),#) y reconoce lo mismo que el original", async () => {
    const { analyze } = await import("../machines/model.js");
    const { acceptsAp } = await import("../machines/run-ap.js");
    const m = DETERMINISMO.example.machine.initial;
    expect(analyze(m).warnings.join(" ")).toMatch(/no determinista/);
    expect(acceptsAp(m, "(())").accepted).toBe(true);
    expect(acceptsAp(m, "())").accepted).toBe(false);
  });
});
