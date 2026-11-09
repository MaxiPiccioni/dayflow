import { describe, expect, it } from "vitest";
import { checkAnswer } from "./check.js";
import { compareRegex, compileRegex, enumerateRegex, parseRegex } from "./regex.js";
import { STORAGE_KEY, countDone, emptyProgress, loadProgress, saveProgress, setAnswer, setDone } from "./progress.js";

const env = { α: "aab", β: "cdee", γ: "eddcc", δ: "aacddd" };

describe("expresiones regulares (ejercicios 28 y 29)", () => {
  it("(11+0)* y sus primeras cadenas", () => {
    const { words } = enumerateRegex("(11+0)*", { count: 8 });
    expect(words).toEqual(["", "0", "00", "11", "000", "011", "110", "0000"]);
    const re = compileRegex("(11+0)*");
    expect(re.test("11011")).toBe(true);
    expect(re.test("101")).toBe(false);
  });
  it("(a+bb)*+ab incluye ab, λ, a y bb", () => {
    const re = compileRegex("(a+bb)*+ab");
    for (const w of ["ab", "", "a", "bb", "aa", "abb", "bba", "bbbb"]) expect(re.test(w)).toBe(true);
    expect(re.test("b")).toBe(false);
  });
  it("29: pares y potencias de dos", () => {
    expect(compareRegex("1(0+1)*0", "1(0+1)*0", ["0", "1"]).equal).toBe(true);
    expect(compareRegex("1(0)*", "10*", ["0", "1"]).equal).toBe(true);
    const diff = compareRegex("1(0)*", "1(0+1)*0", ["0", "1"]);
    expect(diff.equal).toBe(false);
  });
  it("errores de sintaxis", () => {
    expect(parseRegex("(a+").error).toBeTruthy();
    expect(parseRegex("*a").error).toBeTruthy();
    expect(parseRegex("a+").error).toMatch(/falta/);
    expect(parseRegex("a)").error).toBeTruthy();
    expect(parseRegex("").error).toBeTruthy();
  });
  it("clausura positiva con ⁺", () => {
    const re = compileRegex("a⁺b");
    expect(re.test("b")).toBe(false);
    expect(re.test("aab")).toBe(true);
  });
});

describe("checkAnswer", () => {
  it("números y cadenas", () => {
    expect(checkAnswer({ kind: "number", expected: 5 }, "5").ok).toBe(true);
    expect(checkAnswer({ kind: "number", expected: 5 }, "6").ok).toBe(false);
    expect(checkAnswer({ kind: "number", expected: 5 }, "").ok).toBe(false);
    expect(checkAnswer({ kind: "expr", expr: "α^2", env }, "aabaab").ok).toBe(true);
    expect(checkAnswer({ kind: "expr", expr: "(δ . α)^-1", env }, "baadddcaa").ok).toBe(true);
    expect(checkAnswer({ kind: "expr", expr: "(δ . α)^-1", env }, "aabaacddd").ok).toBe(false);
    expect(checkAnswer({ kind: "text", expected: "" }, "lambda").ok).toBe(true);
  });
  it("conjuntos de cadenas", () => {
    const spec = { kind: "wordset", expected: ["a", "aa", "aac"] };
    expect(checkAnswer(spec, "aac, a, aa").ok).toBe(true);
    expect(checkAnswer(spec, "a, aa").message).toMatch(/faltan 1/i);
    expect(checkAnswer(spec, "a, aa, aac, b").message).toMatch(/No corresponden: b/);
  });
  it("lenguajes por fórmula (ejercicio 3) y operaciones (ejercicio 5)", () => {
    const l3 = { kind: "language-words", language: { formula: "0^a 1^(2a) / a ≥ 0" }, min: 3 };
    expect(checkAnswer(l3, "λ, 011, 001111").ok).toBe(true);
    expect(checkAnswer(l3, "011, 0111").ok).toBe(false);
    expect(checkAnswer(l3, "011").ok).toBe(false); // faltan cadenas
    const sigma = { kind: "language-words", language: { intersect: [{ sigma: "a,b,c,d" }, { sigma: "c,d,e" }] }, min: 2 };
    expect(checkAnswer(sigma, "λ, c, d, cd").ok).toBe(true);
    const l3sq = { kind: "language-words", language: { power: [{ formula: "0^a 1^(2a) / a ≥ 0" }, 2] }, min: 2 };
    expect(checkAnswer(l3sq, "011011, 011001111").ok).toBe(true);
    expect(checkAnswer(l3sq, "0110").ok).toBe(false);
  });
  it("gramáticas: lenguaje, tipo, ambigüedad, recursividad, equivalencia", () => {
    const g1 = { productions: "S:= 0B | 0A1, A:= 0B | 0, B:= 1" };
    expect(checkAnswer({ kind: "grammar-language", grammar: g1 }, "01, 0011, 001").ok).toBe(true);
    expect(checkAnswer({ kind: "grammar-language", grammar: g1 }, "01, 0011").ok).toBe(false);
    expect(checkAnswer({ kind: "grammar-type", grammar: { productions: "S := xX, X := xY, Y := yY, Y := y" } }, "3").ok).toBe(true);
    expect(checkAnswer({ kind: "grammar-type", grammar: { productions: "S := xX, X := xY, Y := yY, Y := y" } }, "2").ok).toBe(false);
    expect(checkAnswer({ kind: "ambiguity", grammar: { productions: "S := AB | aA, B := AB | b, A := a | b" } }, "si").ok).toBe(true);
    expect(checkAnswer({ kind: "recursion", grammar: { productions: "S := aAb, A := aB | a, B := c" } }, "no").ok).toBe(true);
    expect(checkAnswer({ kind: "equivalent", a: { productions: "S:= aS, S:= aA, A:=ab" }, b: { productions: "S:= aS, S:=aab" } }, "si").ok).toBe(true);
  });
  it("una gramática equivalente pero distinta se acepta con aviso; una distinta, no", () => {
    const spec = { kind: "grammar", expected: { productions: "S:= aX | a, X:= aX | a" } };
    expect(checkAnswer(spec, "S:= aX | a, X:= aX | a")).toMatchObject({ ok: true });
    expect(checkAnswer(spec, "S:= aS | a")).toMatchObject({ ok: true, exact: false });
    expect(checkAnswer(spec, "S:= aS | b").ok).toBe(false);
  });
  it("expresiones regulares escritas por el usuario", () => {
    expect(checkAnswer({ kind: "regex", expected: "1(0+1)*0", alphabet: ["0", "1"] }, "1(1+0)*0").ok).toBe(true);
    expect(checkAnswer({ kind: "regex", expected: "1(0+1)*0", alphabet: ["0", "1"] }, "1(0+1)*").ok).toBe(false);
    expect(checkAnswer({ kind: "regex-words", regex: "(11+0)*", min: 3 }, "0, 11, 011").ok).toBe(true);
    expect(checkAnswer({ kind: "regex-words", regex: "(11+0)*", min: 3 }, "0, 1").ok).toBe(false);
  });
  it("tipo desconocido", () => {
    expect(checkAnswer({ kind: "nada" }, "x").ok).toBe(false);
  });
});

describe("progreso en localStorage", () => {
  const fakeStorage = (initial = {}) => {
    const data = { ...initial };
    return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; }, data };
  };
  it("guarda y vuelve a leer", () => {
    const storage = fakeStorage();
    let progress = setDone(emptyProgress(), "u2-e1", true);
    progress = setAnswer(progress, "u2-e1-a", "aabaab");
    expect(saveProgress(progress, storage)).toBe(true);
    const loaded = loadProgress(storage);
    expect(loaded.done).toEqual({ "u2-e1": true });
    expect(loaded.answers["u2-e1-a"]).toBe("aabaab");
    expect(countDone(loaded, ["u2-e1", "u2-e2"])).toBe(1);
    expect(JSON.parse(storage.data[STORAGE_KEY]).v).toBe(1);
  });
  it("sigue funcionando si localStorage falla o está roto", () => {
    const broken = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("cuota"); } };
    expect(loadProgress(broken)).toEqual(emptyProgress());
    expect(saveProgress(emptyProgress(), broken)).toBe(false);
    expect(loadProgress(null)).toEqual(emptyProgress());
    expect(saveProgress(emptyProgress(), null)).toBe(false);
    expect(loadProgress(fakeStorage({ [STORAGE_KEY]: "{no es json" }))).toEqual(emptyProgress());
    expect(loadProgress(fakeStorage({ [STORAGE_KEY]: JSON.stringify({ v: 99, done: { a: true } }) }))).toEqual(emptyProgress());
  });
  it("desmarcar quita la marca", () => {
    const progress = setDone(setDone(emptyProgress(), "x", true), "x", false);
    expect(progress.done).toEqual({});
  });
});
