import { describe, expect, it } from "vitest";
import { analyzeRecursion, classify, compareGrammars, detectAmbiguity, findDerivations, formatDerivation, generateLanguage, parseGrammar, parseTrees, allDerivations } from "./grammar.js";

const g = (productions, extra = {}) => {
  const result = parseGrammar({ productions, ...extra });
  if (result.error) throw new Error(result.error);
  return result.grammar;
};

describe("parseGrammar", () => {
  it("infiere alfabetos y axioma", () => {
    const grammar = g("S:= 0B | 0A1, A:= 0B | 0, B:= 1");
    expect(grammar.axiom).toBe("S");
    expect(grammar.nonterminals.sort()).toEqual(["A", "B", "S"]);
    expect(grammar.terminals.sort()).toEqual(["0", "1"]);
    expect(grammar.productions).toHaveLength(5);
  });
  it("acepta λ, el axioma declarado y la forma P = { ... }", () => {
    const grammar = g("P = {P := aQ | λ, Q := b}", { axiom: "P" });
    expect(grammar.axiom).toBe("P");
    expect(grammar.productions[1]).toEqual({ lhs: "P", rhs: "" });
  });
  it("informa errores", () => {
    expect(parseGrammar({ productions: "S aA" }).error).toMatch(/:=/);
    expect(parseGrammar({ productions: "S := a |", }).error).toMatch(/vacía/);
    expect(parseGrammar({ productions: "S := aA", terminals: "a", nonterminals: "S" }).error).toMatch(/A/);
    expect(parseGrammar({ productions: "" }).error).toBeTruthy();
  });
});

describe("clasificación de Chomsky (ejercicios 6 y 7)", () => {
  const typeOf = (text, extra) => classify(g(text, extra)).type;
  it("ejercicio 6", () => {
    expect(typeOf("D:= cE | d, E:= cd", { axiom: "D" })).toBe(2);
    expect(classify(g("P:= 1R | 2Q, Q:= 0R | 0, R:= 1S | 2, S:= 0", { axiom: "P" }))).toMatchObject({ type: 3, side: "derecha" });
    expect(typeOf("P:= aQ, Q:= ab | caR, R:= c | ac", { axiom: "P" })).toBe(2);
    expect(typeOf("S:= aAb | bBa, aAb:= aBb, aBb:= abb | acb, bBa:= bca")).toBe(1);
    expect(typeOf("S:= CA0, A:= 0B, A0:=00B0 | 10, 0B:= 11, C:= 0BD | 01, D:= 0")).toBe(0);
  });
  it("ejercicio 7", () => {
    expect(typeOf("S := aab | aAc, aAc := aBc, aBc := acc | abbc")).toBe(1);
    expect(typeOf("S := aB, B:= bcAe, A := d")).toBe(2);
    expect(typeOf("S := zMz, M := zA , zA := zaazB, B := a, A := aza")).toBe(1);
    expect(typeOf("S := xX, X := xY, Y := yY, Y := y")).toBe(3);
  });
  it("tipo 3 por izquierda", () => {
    expect(classify(g("S := Sa | b"))).toMatchObject({ type: 3, side: "izquierda" });
  });
});

describe("lenguaje y derivaciones (ejercicio 6)", () => {
  it("L(G1) = { 01, 0011, 001 }", () => {
    const { words } = generateLanguage(g("S:= 0B | 0A1, A:= 0B | 0, B:= 1"), 6);
    expect(words.sort()).toEqual(["001", "0011", "01"].sort());
  });
  it("L(G2), L(G3), L(G4), L(G5), L(G6)", () => {
    expect(generateLanguage(g("D:= cE | d, E:= cd", { axiom: "D" }), 6).words.sort()).toEqual(["d", "ccd"].sort());
    expect(generateLanguage(g("P:= 1R | 2Q, Q:= 0R | 0, R:= 1S | 2, S:= 0", { axiom: "P" }), 6).words.sort()).toEqual(["110", "12", "20", "2010", "202"].sort());
    expect(generateLanguage(g("P:= aQ, Q:= ab | caR, R:= c | ac", { axiom: "P" }), 6).words.sort()).toEqual(["aab", "acac", "acaac"].sort());
    expect(generateLanguage(g("S:= aAb | bBa, aAb:= aBb, aBb:= abb | acb, bBa:= bca"), 6).words.sort()).toEqual(["abb", "acb", "bca"].sort());
  });
  it("G6 genera las cadenas de la guía (con las que se obtienen con el reemplazo exacto)", () => {
    const { words } = generateLanguage(g("S:= CA0, A:= 0B, A0:=00B0 | 10, 0B:= 11, C:= 0BD | 01, D:= 0"), 8);
    expect(words.length).toBeGreaterThan(0);
    for (const w of ["110110", "1100110", "11010", "01110", "010110", "0110"]) expect(words).toContain(w);
  });
  it("muestra una derivación concreta y todas las posibles", () => {
    const grammar = g("S:= 0B | 0A1, A:= 0B | 0, B:= 1");
    const { derivations } = findDerivations(grammar, "0011");
    expect(formatDerivation(derivations[0])).toBe("S → 0A1 → 00B1 → 0011");
    const all = allDerivations(grammar, 6);
    expect(all.paths.map(formatDerivation).sort()).toEqual(["S → 0A1 → 00B1 → 0011", "S → 0A1 → 001", "S → 0B → 01"].sort());
  });
  it("ejercicio 7d: derivación sucesiva", () => {
    const grammar = g("S := xX, X := xY, Y := yY, Y := y");
    expect(formatDerivation(findDerivations(grammar, "xxyyyy").derivations[0])).toBe("S → xX → xxY → xxyY → xxyyY → xxyyyY → xxyyyy");
  });
});

describe("árboles y ambigüedad (ejercicios 9 y 11)", () => {
  it("9a es ambigua con la cadena ab", () => {
    const result = detectAmbiguity(g("S := AB | aA, B := AB | b, A := a | b"), 4);
    expect(result.ambiguous).toBe(true);
    expect(result.examples.map((e) => e.word)).toContain("ab");
  });
  it("9b es ambigua con la cadena abb", () => {
    const result = detectAmbiguity(g("S := AB, A := aB | b | ab, B := b | a"), 4);
    expect(result.examples.map((e) => e.word)).toContain("abb");
  });
  it("11: a, b, d, e no ambiguas; c ambigua", () => {
    expect(detectAmbiguity(g("S:= aSA, S:= AB, A:= b, B:= c"), 6).ambiguous).toBe(false);
    expect(detectAmbiguity(g("S:= aA, A:= aBb, B:= aBb, B:= c"), 8).ambiguous).toBe(false);
    const c = detectAmbiguity(g("S:= AB, A:= aA, A:= a, B:= AB, B:= b"), 4);
    expect(c.ambiguous).toBe(true);
    expect(c.examples.map((e) => e.word)).toContain("aab");
    expect(detectAmbiguity(g("S:= bBa, B:= bBa, B:= c"), 8).ambiguous).toBe(false);
    expect(detectAmbiguity(g("S:= AB, A:= aA, A:= b, B:= a, B:= bB"), 6).ambiguous).toBe(false);
  });
  it("el árbol del ejercicio 7b tiene la forma de la guía", () => {
    const { trees } = parseTrees(g("S := aB, B:= bcAe, A := d"), "abcde");
    expect(trees).toHaveLength(1);
    expect(trees[0].children.map((c) => c.sym)).toEqual(["a", "B"]);
    expect(trees[0].children[1].children.map((c) => c.sym)).toEqual(["b", "c", "A", "e"]);
  });
  it("no construye árboles para gramáticas dependientes del contexto", () => {
    expect(parseTrees(g("S := aab | aAc, aAc := aBc, aBc := acc | abbc"), "aab").error).toBeTruthy();
  });
});

describe("recursividad (ejercicio 10)", () => {
  const rec = (text) => analyzeRecursion(g(text));
  it("10a no es recursiva", () => expect(rec("S:= aAb, A := aB | a, B := c").recursive).toBe(false));
  it("10b por derecha", () => expect(rec("S := abS | aA, A := a").findings[0]).toMatchObject({ symbol: "S", kind: "directa", side: "derecha" }));
  it("10c por izquierda", () => expect(rec("S := Sa | aB, A := ad | a, B := b | aA").findings[0]).toMatchObject({ symbol: "S", kind: "directa", side: "izquierda" }));
  it("10d en más de un paso", () => {
    const { findings } = rec("S := AB | c, A := aC, C := bS, B := aD, D := b");
    expect(findings[0]).toMatchObject({ symbol: "S", kind: "en más de un paso" });
    expect(findings[0].rules).toEqual(["S := AB", "A := aC", "C := bS"]);
  });
  it("11b es recursiva por B := aBb (central)", () => expect(rec("S:= aA, A:= aBb, B:= aBb, B:= c").findings[0]).toMatchObject({ symbol: "B", side: "central" }));
});

describe("equivalencia (ejercicio 8)", () => {
  it("8a son equivalentes y 8b no", () => {
    expect(compareGrammars(g("S:= aS, S:= aA, A:=ab"), g("S:= aS, S:=aab"), 8).equal).toBe(true);
    const b = compareGrammars(g("S := aS, S:=b"), g("S := aSb, S := b"), 8);
    expect(b.equal).toBe(false);
    expect(b.onlyA).toContain("ab");
    expect(b.onlyB).toContain("abb");
  });
});
