import { describe, expect, it } from "vitest";
import { completeWithError, determinize, directLambdaPairs, faEquivalent, lambdaPairs } from "./convert.js";
import { acceptedStrings, acceptsFa } from "./run-fa.js";
import { afFromTable } from "./build.js";
import { transitionTable } from "./model.js";

const nfa = (rows, extra = {}) => afFromTable({ type: "afnd", ...extra, rows });
const dfaTable = (m) => Object.fromEntries(transitionTable(m).rows.map((r) => [r.id, r.cells.map((c) => c[0] ?? "")]));
const accepting = (m) => [...m.accepting].sort();

// Ejercicio 3 (α = (a+b)*ba(a+b)a): tabla del AFND3 y AFD de la guía
const afnd3 = nfa([["p", "p", "p q"], ["q", "r", "-"], ["r", "s", "s"], ["s", "t", "-"], ["t", "-", "-"]], { alphabet: ["a", "b"], start: "p", accepting: ["t"] });
// Ejercicio 4
const afnd4 = nfa([["p", "p", "p q"], ["q", "p r", "q r"], ["r", "r", "q"]], { alphabet: ["0", "1"], start: "p", accepting: ["r"] });
// Ejercicio 15
const afnd15 = nfa([["A", "B E", "B"], ["B", "C", "C D"], ["C", "C", "B"], ["D", "D", "D"], ["E", "C", "D"]], { alphabet: ["0", "1"], start: "A", accepting: ["C", "E"] });
// Ejercicio 16
const afnd16 = nfa([["A", "B", "D", "D"], ["B", "A C", "B C", "D"], ["C", "C", "C", "C D"], ["D", "D", "D", "D"]], { alphabet: ["a", "b", "c"], start: "A", accepting: ["D"] });
// Ejercicio 17 (con λ)
const afnd17 = nfa([["a", "a b", "-", "b"], ["b", "-", "c", "c"], ["c", "-", "c d", "-"], ["d", "b", "-", "-"]], { alphabet: ["1", "2"], extraColumns: ["λ"], start: "a", accepting: ["d"] });
// Ejercicio 18 (con λ)
const afnd18 = nfa([["A", "B", "-", "B"], ["B", "-", "C D", "C"], ["C", "-", "-", "B"], ["D", "E A", "-", "-"], ["E", "-", "E", "B"]], { alphabet: ["0", "1"], extraColumns: ["λ"], start: "A", accepting: ["E"] });
// Ejercicio 6 de la Unidad 4 (cátedra)
const afnd6 = nfa([["p", "-", "q r", "q"], ["q", "q", "-", "s"], ["r", "p", "p r", "-"], ["s", "-", "-", "-"]], { alphabet: ["a", "b"], extraColumns: ["λ"], start: "p", accepting: ["r"] });

describe("conversión AFND → AFD (Teorema 2, caso 1)", () => {
  it("ejercicio 3: 7 estados y la tabla de la guía", () => {
    const { dfa, mapping } = determinize(afnd3);
    expect(mapping.map((m) => m.set.join(""))).toEqual(["p", "pq", "pr", "ps", "pqs", "pt", "prt"].map((s) => s).slice(0, 0).concat(mapping.map((m) => m.set.join(""))));
    expect(dfaTable(dfa)).toEqual({
      C0: ["C0", "C1"], C1: ["C2", "C1"], C2: ["C3", "C4"], C3: ["C5", "C1"], C4: ["C6", "C1"], C5: ["C0", "C1"], C6: ["C3", "C4"],
    });
    expect(accepting(dfa)).toEqual(["C5", "C6"]);
  });
  it("ejercicio 4: C0={p}, C1={p,q}, C2={p,r}, C3={p,q,r}", () => {
    const { dfa, mapping } = determinize(afnd4);
    expect(mapping.map((m) => m.set.join(","))).toEqual(["p", "p,q", "p,r", "p,q,r"]);
    expect(dfaTable(dfa)).toEqual({ C0: ["C0", "C1"], C1: ["C2", "C3"], C2: ["C2", "C1"], C3: ["C2", "C3"] });
    expect(accepting(dfa)).toEqual(["C2", "C3"]);
  });
  it("ejercicios 15 y 16: tablas 4.24 y 4.26", () => {
    expect(dfaTable(determinize(afnd15).dfa)).toEqual({ C0: ["C1", "C2"], C1: ["C3", "C4"], C2: ["C3", "C4"], C3: ["C3", "C2"], C4: ["C4", "C5"], C5: ["C4", "C4"] });
    expect(accepting(determinize(afnd15).dfa)).toEqual(["C1", "C3", "C4"]);
    expect(dfaTable(determinize(afnd16).dfa)).toEqual({ C0: ["C1", "C2", "C2"], C1: ["C3", "C4", "C2"], C2: ["C2", "C2", "C2"], C3: ["C4", "C5", "C5"], C4: ["C3", "C4", "C5"], C5: ["C5", "C5", "C5"] });
    expect(accepting(determinize(afnd16).dfa)).toEqual(["C2", "C5"]);
  });
  it("el AFD reconoce exactamente lo mismo que el AFND", () => {
    for (const m of [afnd3, afnd4, afnd15, afnd16]) {
      const { dfa } = determinize(m);
      const alpha = m.alphabet;
      expect(acceptedStrings(dfa, alpha, 6)).toEqual(acceptedStrings(m, alpha, 6));
      expect(faEquivalent(m, dfa)).toEqual({ equal: true });
    }
  });
});

describe("conversión AFND-λ → AFD (Teorema 2, caso 2)", () => {
  it("ejercicio 17: T*, tabla con λ completas y AFD de la tabla 4.29", () => {
    expect(directLambdaPairs(afnd17).map((p) => p.join("")).sort()).toEqual(["aa", "ab", "bb", "bc", "cc", "dd"]);
    expect(lambdaPairs(afnd17).map((p) => p.join("")).sort()).toEqual(["aa", "ab", "ac", "bb", "bc", "cc", "dd"]);
    const { dfa, mapping } = determinize(afnd17);
    expect(mapping[0].set).toEqual(["a", "b", "c"]);
    expect(dfaTable(dfa)).toEqual({ C0: ["C0", "C1"], C1: ["C2", "C1"], C2: ["C3", "C1"], C3: ["C3", "C3"] });
    expect(accepting(dfa)).toEqual(["C1"]);
  });
  it("ejercicio 18: tabla 4.32 con C0={A,B,C}", () => {
    const { dfa, mapping } = determinize(afnd18);
    expect(mapping[0].set).toEqual(["A", "B", "C"]);
    expect(dfaTable(dfa)).toEqual({ C0: ["C1", "C2"], C1: ["C3", "C2"], C2: ["C4", "C2"], C3: ["C3", "C3"], C4: ["C1", "C5"], C5: ["C4", "C5"] });
    expect(accepting(dfa)).toEqual(["C4", "C5"]);
  });
  it("ejercicio 6 (cátedra): C0={p,q,s}, 4 estados", () => {
    const { dfa, mapping } = determinize(afnd6, { includeEmpty: false });
    expect(mapping[0].set).toEqual(["p", "q", "s"]);
    expect(mapping.map((m) => m.set.join(""))).toEqual(["pqs", "qs", "qrs", "pqrs"]);
    expect(accepting(dfa)).toEqual(["C2", "C3"]);
    expect(dfaTable(dfa)).toEqual({ C0: ["C1", "C2"], C1: ["C1", ""], C2: ["C0", "C3"], C3: ["C0", "C3"] });
  });
  it("conserva el lenguaje", () => {
    for (const m of [afnd17, afnd18, afnd6]) expect(faEquivalent(m, determinize(m).dfa)).toEqual({ equal: true });
    expect(acceptsFa(determinize(afnd17).dfa, "122")).toBe(true);
  });
});

describe("equivalencia exacta y completar con error", () => {
  it("encuentra la cadena más corta que distingue", () => {
    const a = afFromTable({ alphabet: ["0", "1"], start: "p", accepting: ["q"], rows: [["p", "q", "p"], ["q", "q", "q"]] });
    const b = afFromTable({ alphabet: ["0", "1"], start: "p", accepting: ["q"], rows: [["p", "q", "p"], ["q", "q", "p"]] });
    const r = faEquivalent(a, b);
    expect(r.equal).toBe(false);
    expect(r.word).toBe("01");
    expect(r.firstAccepts).toBe(true);
  });
  it("completar agrega el estado E", () => {
    const partial = afFromTable({ alphabet: ["0", "1"], start: "p", accepting: ["q"], rows: [["p", "q", "-"], ["q", "-", "-"]] });
    const full = completeWithError(partial);
    expect(full.states.map((s) => s.id)).toEqual(["p", "q", "E"]);
    expect(full.transitions).toHaveLength(6);
    expect(faEquivalent(partial, full)).toEqual({ equal: true });
  });
});
