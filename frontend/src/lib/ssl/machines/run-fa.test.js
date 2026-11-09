import { describe, expect, it } from "vitest";
import { acceptedStrings, acceptsFa, lambdaClosure, runFa } from "./run-fa.js";
import { afFromTable } from "./build.js";

const afd2a = afFromTable({ name: "AFD2a", alphabet: ["1"], start: "p", accepting: ["q"], rows: [["p", "q"], ["q", "p"]] });
const afd2b = afFromTable({ name: "AFD2b", alphabet: ["1"], start: "p", accepting: ["p"], rows: [["p", "q"], ["q", "p"]] });
const afd3b = afFromTable({ alphabet: ["a", "b"], start: "p", accepting: ["r"], rows: [["p", "q", "p"], ["q", "r", "q"], ["r", "q", "r"]] });
// Ejercicio 15 de la Unidad 4: AFND ({0,1},{A,B,C,D,E},A,{C,E},f)
const afnd15 = afFromTable({ type: "afnd", alphabet: ["0", "1"], start: "A", accepting: ["C", "E"], rows: [["A", "B E", "B"], ["B", "C", "C D"], ["C", "C", "B"], ["D", "D", "D"], ["E", "C", "D"]] });
// Ejercicio 4 de la Unidad 4
const afnd4 = afFromTable({ type: "afnd", alphabet: ["0", "1"], start: "p", accepting: ["r"], rows: [["p", "p", "p q"], ["q", "p r", "q r"], ["r", "r", "q"]] });
// Ejercicio 17 de la Unidad 4 (AFND-λ): columnas 1, 2, λ
const afnd17 = afFromTable({ type: "afnd", alphabet: ["1", "2"], extraColumns: ["λ"], start: "a", accepting: ["d"], rows: [["a", "a b", "-", "b"], ["b", "-", "c", "c"], ["c", "-", "c d", "-"], ["d", "b", "-", "-"]] });

const configs = (r, level) => r.levels[level].map((id) => `${r.nodes[id].state},${r.nodes[id].rest}`).sort();

describe("AFD", () => {
  it("árbol de descripciones instantáneas de 111 en el AFD2a", () => {
    const r = runFa(afd2a, "111");
    expect(r.levels.map((l) => configs(r, r.levels.indexOf(l)))).toEqual([["p,111"], ["q,11"], ["p,1"], ["q,"]]);
    expect(r.accepted).toBe(true);
    expect(r.outcome).toBe("reconocida");
    expect(r.message).toBe("La cadena 111 es reconocida.");
  });
  it("AFD2b con 1111 y AFD3b con abba", () => {
    expect(runFa(afd2b, "1111").accepted).toBe(true);
    expect(runFa(afd2b, "111").accepted).toBe(false);
    const r = runFa(afd3b, "abba");
    expect(r.levels.map((l, i) => configs(r, i)[0])).toEqual(["p,abba", "q,bba", "q,ba", "q,a", "r,"]);
    expect(r.accepted).toBe(true);
  });
  it("transición faltante: error", () => {
    const partial = afFromTable({ alphabet: ["0", "1"], start: "p", accepting: ["q"], rows: [["p", "q", "-"], ["q", "-", "-"]] });
    expect(runFa(partial, "01").outcome).toBe("error");
    expect(runFa(partial, "0").outcome).toBe("reconocida");
  });
  it("cadena vacía y estado de error", () => {
    expect(runFa(afd2a, "").outcome).toBe("no reconocida");
    expect(runFa(afd2b, "").outcome).toBe("reconocida");
  });
});

describe("AFND", () => {
  it("árbol ramificado de 010 del ejercicio 15 (figura 4.34)", () => {
    const r = runFa(afnd15, "010");
    expect(configs(r, 0)).toEqual(["A,010"]);
    expect(configs(r, 1)).toEqual(["B,10", "E,10"]);
    expect(configs(r, 2)).toEqual(["C,0", "D,0", "D,0"]);
    expect(configs(r, 3)).toEqual(["C,", "D,", "D,"]);
    expect(r.accepted).toBe(true);
  });
  it("cadenas del ejercicio 4: 1000 sí, 1001 y 1101 no", () => {
    expect(runFa(afnd4, "1000").accepted).toBe(true);
    expect(runFa(afnd4, "1001").accepted).toBe(false);
    expect(runFa(afnd4, "1101").accepted).toBe(false);
    const r = runFa(afnd4, "1000");
    expect(configs(r, 1)).toEqual(["p,000", "q,000"]);
    expect(configs(r, 2)).toEqual(["p,00", "p,00", "r,00"]);
  });
  it("λ: cierre y aceptación (ejercicio 17)", () => {
    expect([...lambdaClosure(afnd17, ["a"])].sort()).toEqual(["a", "b", "c"]);
    expect(runFa(afnd17, "11221").accepted).toBe(true);
    expect(runFa(afnd17, "122").accepted).toBe(true);
    expect(acceptsFa(afnd17, "11221")).toBe(true);
  });
  it("los ciclos λ no cuelgan el ejecutor", () => {
    const loop = afFromTable({ type: "afnd", alphabet: ["a"], extraColumns: ["λ"], start: "p", accepting: ["q"], rows: [["p", "-", "q"], ["q", "-", "p"]] });
    const r = runFa(loop, "");
    expect(r.accepted).toBe(true);
    expect(r.truncated).toBe(false);
  });
  it("acceptsFa coincide con el árbol", () => {
    for (const w of ["", "0", "01", "010", "1100", "111", "0101"]) expect(acceptsFa(afnd15, w), w).toBe(runFa(afnd15, w).accepted);
  });
  it("enumera cadenas aceptadas", () => {
    expect(acceptedStrings(afd2a, ["1"], 5)).toEqual(["1", "111", "11111"]);
  });
});
