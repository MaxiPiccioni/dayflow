import { describe, expect, it } from "vitest";
import { evalStringExpr, innerSubstrings, length, power, properPrefixes, properSuffixes, reverse } from "./strings.js";
import { parseWordList, splitMath, unsuper } from "./notation.js";

const env = { α: "aab", β: "cdee", γ: "eddcc", δ: "aacddd" };

describe("cadenas (ejercicios 1 a 4)", () => {
  it("longitud", () => {
    expect([env.α, env.β, env.γ, env.δ].map(length)).toEqual([3, 4, 5, 6]);
  });
  it("potencia y reflejo", () => {
    expect(power(env.α, 2)).toBe("aabaab");
    expect(reverse(env.β)).toBe("eedc");
  });
  it("prefijos, sufijos y subcadenas internas de δ", () => {
    expect(properPrefixes(env.δ)).toEqual(["a", "aa", "aac", "aacd", "aacdd"]);
    expect(properSuffixes(env.δ)).toEqual(["d", "dd", "ddd", "cddd", "acddd"]);
    // La guía lista ac, acd, acdd, cd, cdd y se olvida de "c", que tampoco es prefijo ni sufijo.
    expect(innerSubstrings(env.δ)).toEqual(["ac", "acd", "acdd", "c", "cd", "cdd"]);
  });
});

describe("evalStringExpr", () => {
  it("resuelve los ejercicios 2b, 2d y 2e", () => {
    expect(evalStringExpr("α . δ", env).value).toBe("aabaacddd");
    expect(evalStringExpr("(δ . α)^-1", env).value).toBe("baadddcaa");
    expect(evalStringExpr("[(β . γ)⁻¹]²", env).value).toBe("ccddeeedcccddeeedc");
  });
  it("informa símbolos desconocidos y paréntesis sin cerrar", () => {
    expect(evalStringExpr("ω", env).error).toMatch(/ω/);
    expect(evalStringExpr("(α", env).error).toMatch(/cerrar/);
  });
});

describe("notación", () => {
  it("convierte superíndices y listas", () => {
    expect(unsuper("aⁿ")).toBe("a^n");
    expect(unsuper("β⁻¹")).toBe("β^-1");
    expect(parseWordList("λ, a; bb {c}")).toEqual(["", "a", "bb", "c"]);
    expect(splitMath("a^{n} b")).toEqual([{ text: "a", sup: false }, { text: "n", sup: true }, { text: " b", sup: false }]);
  });
});
