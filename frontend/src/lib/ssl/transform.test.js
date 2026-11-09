import { describe, expect, it } from "vitest";
import { generateLanguage, parseGrammar } from "./grammar.js";
import { cleanGrammar, eliminateLeftRecursion, isFNC, isFNG, toChomsky, toGreibach, wellFormed } from "./transform.js";

const g = (productions, extra = {}) => {
  const result = parseGrammar({ productions, ...extra });
  if (result.error) throw new Error(result.error);
  return result.grammar;
};
const rules = (grammar) => grammar.productions.map((p) => `${p.lhs}:=${p.rhs || "λ"}`).sort();
const expected = (text, extra) => rules(g(text, extra));
const words = (grammar, n = 7) => generateLanguage(grammar, n).words;

describe("gramática limpia (ejercicios 12 a 15)", () => {
  it("ejercicio 12", () => {
    const grammar = g("S:= 0A | 1B | 01, A:= A | 1B | 0, B:= 0C | 0E | 10, C:= 1, E:= 0E, D:=0A|1B|0", { terminals: "0,1,2,3", nonterminals: "S,A,B,C,D,E" });
    const r = cleanGrammar(grammar);
    expect(r.unnecessary.map((x) => `${x.lhs}:=${x.rhs}`)).toEqual(["A:=A"]);
    expect(r.inaccessibleTerminals).toEqual(["2", "3"]);
    expect(r.inaccessibleNonterminals).toEqual(["D"]);
    expect(r.superfluous).toEqual(["E"]);
    expect(rules(r.grammar)).toEqual(expected("S:= 0A | 1B | 01, A:= 1B | 0, B:= 0C | 10, C:= 1"));
    expect(r.grammar.nonterminals).toEqual(["S", "A", "B", "C"]);
    expect(r.grammar.terminals).toEqual(["0", "1"]);
  });
  it("ejercicio 13", () => {
    const r = cleanGrammar(g("S:= 0A|1|S, A:= 1B0|01, C:= 0|1B|1|C, B:= 1A|A0|1B", { terminals: "0,1,2", nonterminals: "S,A,B,C" }));
    expect(rules(r.grammar)).toEqual(expected("S:= 0A|1, A:= 1B0|01, B:= 1A|A0|1B"));
    expect(r.inaccessibleNonterminals).toEqual(["C"]);
  });
  it("ejercicio 14", () => {
    const r = cleanGrammar(g("S:= aBb | λ, A:= bB | Ca, B:= bA | b | a | bE | B, C:= a | bB | aD, D:= a, E:= aE | E", { terminals: "a,b,c", nonterminals: "S,A,B,C,D,E" }));
    expect(rules(r.grammar)).toEqual(expected("S:= aBb | λ, A:= bB | Ca, B:= bA | b | a, C:= a | bB | aD, D:= a"));
    expect(r.inaccessibleTerminals).toEqual(["c"]);
    expect(r.superfluous).toEqual(["E"]);
  });
  it("ejercicio 15 solo saca el terminal 2", () => {
    const grammar = g("Q:= 1R0 | λ, R:= 0S1 | 0T | 1, T:= 0R | RT1, S:= 0", { terminals: "0,1,2", nonterminals: "Q,R,S,T", axiom: "Q" });
    const r = cleanGrammar(grammar);
    expect(rules(r.grammar)).toEqual(rules(grammar));
    expect(r.inaccessibleTerminals).toEqual(["2"]);
  });
  it("avisa cuando el axioma es superfluo", () => {
    expect(cleanGrammar(g("S := aS")).empty).toBe(true);
  });
});

describe("gramática bien formada (ejercicios 16 y 17)", () => {
  it("ejercicio 16", () => {
    const r = wellFormed(g("S:= AB1 | λ, A:= BA | λ, B:= 0A | λ", { terminals: "0,1", nonterminals: "S,A,B" }));
    expect(rules(r.grammar)).toEqual(expected("S:= AB1 | λ | B1 | A1 | 1, A:= BA | 0A | 0, B:= 0A | 0", { terminals: "0,1", nonterminals: "S,A,B" }));
  });
  it("ejercicio 17", () => {
    const r = wellFormed(g("S := C0 | λ | D10, A:= 1C3, B:= B, C:= 1 | λ | 0, D:= 1D", { terminals: "0,1,2,3", nonterminals: "S,A,B,C,D" }));
    expect(rules(r.grammar)).toEqual(expected("S:= C0 | λ | 0, C:= 1 | 0"));
  });
  it("ejercicio 18 conserva lo que da la guía y agrega lo que la guía omitió (C := BB es anulable)", () => {
    const r = wellFormed(g("A:= bBa, B:=bDa | aC | b | λ, C:= BB | A, D:= λ | a | b", { terminals: "a,b,c,d", nonterminals: "A,B,C,D", axiom: "A" }));
    const guide = expected("A:= bBa | ba, B:=bDa | aC | b | ba, C:= BB | bBa | ba | bDa | aC | b, D:= a | b");
    const mine = rules(r.grammar);
    for (const rule of guide) expect(mine).toContain(rule);
    expect(mine).toContain("B:=a"); // viene de B := aC con C anulable
    expect(r.grammar.productions.some((p) => p.rhs === "" )).toBe(false);
  });
  it("no cambia el lenguaje", () => {
    const original = g("S:= AB1 | λ, A:= BA | λ, B:= 0A | λ", { terminals: "0,1", nonterminals: "S,A,B" });
    expect(words(wellFormed(original).grammar, 6)).toEqual(words(original, 6));
  });
});

describe("recursividad por izquierda (ejercicios 19 a 23)", () => {
  it("ejercicio 19", () => {
    const r = eliminateLeftRecursion(g("P:= abP | aQ, Q:= a | bR, R:= Ra | b", { axiom: "P" }));
    expect(rules(r.grammar)).toEqual(expected("P:= abP | aQ, Q:= a | bR, R:= bX | b, X:= aX | a", { axiom: "P" }));
  });
  it("ejercicio 20", () => {
    const r = eliminateLeftRecursion(g("S:= AB | c, A:= aC, B:= aD, C:= Ca | Cab | b, D:= b"));
    expect(rules(r.grammar)).toEqual(expected("S:= AB | c, A:= aC, B:= aD, C:= bX | b, X:= aX | abX | a | ab, D:= b"));
  });
  it("ejercicios 21, 22 y 23", () => {
    expect(rules(eliminateLeftRecursion(g("S:= aAb, A:= aB | a | Ac, B:=c")).grammar)).toEqual(expected("S:= aAb, A:= aB | a | aBX | aX, X:= c | cX, B:=c"));
    expect(rules(eliminateLeftRecursion(g("M:= Ma | aP | b, N:= aP | a, P:= b | aN | Pb", { axiom: "M" })).grammar)).toEqual(expected("M:= aPX| bX | aP | b, X:= aX | a, N:= aP|a, P:= bY | aNY | b | aN, Y:= bY | b", { axiom: "M" }));
    expect(rules(eliminateLeftRecursion(g("M:= Ma | b, P:= Mb | b", { axiom: "M" })).grammar)).toEqual(expected("M:= bX | b, X:= aX | a, P:= Mb | b", { axiom: "M" }));
  });
  it("conserva el lenguaje", () => {
    const original = g("S:= Sa | b");
    expect(words(eliminateLeftRecursion(original).grammar, 5)).toEqual(words(original, 5));
  });
  it("avisa si hay recursividad en más de un paso", () => {
    expect(eliminateLeftRecursion(g("S:= Aa | b, A:= Sc | d")).warnings.length).toBe(1);
  });
});

describe("Forma Normal de Chomsky (ejercicio 24)", () => {
  it("ejercicio 14 / G1 de la guía producen FNC con el mismo lenguaje", () => {
    const g1 = g("S:= 0A | 1B | 01, A:= 1B | 0, B:= 0C | 10, C:= 1");
    const r = toChomsky(g1);
    expect(isFNC(r.grammar)).toBe(true);
    expect(rules(r.grammar)).toEqual(expected("S:= XA | YB | XY, A:= YB | 0, B:= XC | YX, C:= 1, X:=0, Y:=1".replace(/X/g, "X").replace(/Y/g, "Y")));
    expect(words(r.grammar, 6)).toEqual(words(g1, 6));
  });
  it("ejercicios 14 y 15 de la guía", () => {
    const g14 = g("S:= aBb | λ, A:= bB | Ca, B:= bA | b | a, C:= a | bB | aD, D:= a");
    const r14 = toChomsky(g14);
    expect(rules(r14.grammar)).toEqual(expected("S:= XZ | λ, X:=a, Y:=b, Z:=BY, A:= YB | CX, B:= YA | b | a, C:= a | YB | XD, D:= a"));
    const g15 = g("Q:= 1R0 | λ, R:= 0S1 | 0T | 1, T:= 0R | RT1, S:= 0", { axiom: "Q" });
    const r15 = toChomsky(g15);
    expect(rules(r15.grammar)).toEqual(expected("Q:= XZ | λ, X:=1, Y:=0, Z:=RY, W:=SX, V:=TX, R:= YW | YT | 1, T:= YR | RV, S:= 0", { axiom: "Q" }));
    expect(isFNC(r15.grammar)).toBe(true);
    expect(words(r15.grammar, 7)).toEqual(words(g15, 7));
  });
  it("ejercicio 13 queda en FNC y conserva el lenguaje", () => {
    const original = g("S:=0A|1 , A :=1B0|01 , B:=1A|A0|1B");
    const r = toChomsky(original);
    expect(isFNC(r.grammar)).toBe(true);
    expect(words(r.grammar, 8)).toEqual(words(original, 8));
  });
});

describe("Forma Normal de Greibach (ejercicios 25 a 27)", () => {
  it("ejercicio 25", () => {
    const r = toGreibach(g("S:= A0 | 1 | C1, A:= 0B | 1, B:= A0 | 0, C:= 1"));
    expect(isFNG(r.grammar)).toBe(true);
    expect(rules(r.grammar)).toEqual(expected("S:= 1 | 0BX | 1X | 1Y, A:= 0B | 1, B:= 0BX | 1X | 0, C:= 1, X:= 0, Y:= 1"));
  });
  it("ejercicio 26", () => {
    const r = toGreibach(g("S:= DA | 1, A:= B0 | 1, B:= B1 | 0, C:= 0, D:= C0 | 01"));
    expect(isFNG(r.grammar)).toBe(true);
    expect(rules(r.grammar)).toEqual(expected("S:= 0YA | 0ZA | 1, Y:= 0, Z:= 1, A:= 0Y | 0XY | 1, B:= 0 | 0X, X:= 1 | 1X, C:= 0, D:= 0Y | 0Z"));
  });
  it("ejercicio 27 (hay que limpiar, bien formar y levantar la recursividad)", () => {
    const original = g("S:= Aa | bB | bC, A:= Da | D, B:= Ba | b | a | B, C:= a | Db | bE, D:= a, E:= bF, F:= aF", { terminals: "a,b,c", nonterminals: "S,A,B,C,D,E,F" });
    const r = toGreibach(original);
    expect(isFNG(r.grammar)).toBe(true);
    expect(rules(r.grammar)).toEqual(expected("S:= aYY | aY | bB | bC, A:= aY | a, B:= b | a | bX | aX, X:= a | aX, Y:= a, Z:= b, C:= a | aZ, D:= a"));
    expect(words(r.grammar, 6)).toEqual(words(original, 6));
  });
});
