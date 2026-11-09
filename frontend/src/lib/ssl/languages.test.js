import { describe, expect, it } from "vitest";
import { closureLanguage, concatLanguages, enumerateFormula, formulaContains, powerLanguage, sigmaClosure, sortWords, unionSets } from "./languages.js";

describe("enumerateFormula (ejercicio 3)", () => {
  it("L1 = { d^n e^m / n ≥ 0 ^ m ≥ 2 }", () => {
    const { words } = enumerateFormula("{ d^n e^m / n ≥ 0 ^ m ≥ 2 }", { limit: 6 });
    expect(words).toEqual(["ee", "dee", "eee", "ddee", "deee", "eeee"]);
  });
  it("L2 = { a^r c d^r / r ≥ 1 }", () => {
    expect(enumerateFormula("a^r c d^r / r >= 1", { limit: 3 }).words).toEqual(["acd", "aacdd", "aaacddd"]);
  });
  it("L3 = { 0^a 1^(2a) / a ≥ 0 } y superíndices Unicode", () => {
    expect(enumerateFormula("0^a 1^(2a) / a ≥ 0", { limit: 4 }).words).toEqual(["", "011", "001111", "000111111"]);
    expect(enumerateFormula("0ᵃ 1^(2a) / a ≥ 0", { limit: 2 }).words).toEqual(["", "011"]);
  });
  it("informa errores de sintaxis", () => {
    expect(enumerateFormula("a^ / n ≥ 0").error).toBeTruthy();
    expect(enumerateFormula("a^n / n ?? 0").error).toBeTruthy();
  });
  it("formulaContains", () => {
    expect(formulaContains("0^a 1^(2a) / a ≥ 0", "011011").value).toBe(false);
    expect(formulaContains("0^a 1^(2a) / a ≥ 0", "001111").value).toBe(true);
  });
});

describe("operaciones entre lenguajes (ejercicio 5)", () => {
  it("(Σ1 ∩ Σ2)+ y (Σ1 ∪ Σ2)*", () => {
    expect(sigmaClosure(["c", "d"], 2, { positive: true }).words).toEqual(["c", "d", "cc", "cd", "dc", "dd"]);
    expect(sigmaClosure(["a", "b"], 1).words).toEqual(["", "a", "b"]);
    expect(unionSets(["a", "b", "c", "d"], ["c", "d", "e"])).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("la concatenación no es conmutativa", () => {
    const l1 = enumerateFormula("d^n e^m / n ≥ 0 ^ m ≥ 2", { maxLen: 6, limit: 999 }).words;
    const l2 = enumerateFormula("a^r c d^r / r ≥ 1", { maxLen: 6, limit: 999 }).words;
    expect(concatLanguages(l2, l1, 8)).toContain("acdee");
    expect(concatLanguages(l1, l2, 8)).toContain("deeacd");
    expect(concatLanguages(l1, l2, 8)).not.toEqual(concatLanguages(l2, l1, 8));
  });
  it("potencia y clausura", () => {
    const l3 = ["", "011", "001111"];
    expect(powerLanguage(l3, 0, 12)).toEqual([""]);
    expect(powerLanguage(l3, 2, 12)).toContain("011001111");
    expect(closureLanguage(["ab"], 6)).toEqual(["", "ab", "abab", "ababab"]);
    expect(closureLanguage(["ab"], 4, true)).toEqual(["ab", "abab"]);
  });
  it("sortWords ordena por longitud y luego por alfabeto", () => {
    expect(sortWords(["bb", "a", "ab", "b"])).toEqual(["a", "b", "ab", "bb"]);
  });
});
