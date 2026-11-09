import { describe, expect, it } from "vitest";
import { grammarFromAf, grammarText, nfaFromGrammarText, thompson } from "./constructions.js";
import { determinize, faEquivalent } from "./convert.js";
import { acceptedStrings, acceptsFa } from "./run-fa.js";
import { afFromList, afFromTable } from "./build.js";
import { minimize } from "../automata.js";
import { compileRegex } from "../regex.js";
import { parseGrammar, generateLanguage } from "../grammar.js";

const regexWords = (regex, alphabet, maxLen) => {
  const test = compileRegex(regex).test;
  const out = [];
  let level = [""];
  for (let n = 0; n <= maxLen; n++) {
    for (const w of level) if (test(w)) out.push(w);
    level = level.flatMap((w) => alphabet.map((a) => w + a));
  }
  return out;
};

describe("Thompson", () => {
  it("(11+0)* y (a+bb)*+ab: el AFND reconoce el lenguaje de la expresión", () => {
    for (const [regex, alphabet] of [["(11+0)*", ["0", "1"]], ["(a+bb)*+ab", ["a", "b"]], ["0+(11)*0", ["0", "1"]], ["a(b+c)*d", ["a", "b", "c", "d"]], ["01(01)*11(11)*", ["0", "1"]]]) {
      const { machine } = thompson(regex);
      expect(acceptedStrings(machine, alphabet, 7), regex).toEqual(regexWords(regex, alphabet, 7));
    }
  });
  it("tiene una única entrada y una única salida, con transiciones λ", () => {
    const { machine } = thompson("(11+0)*");
    expect(machine.accepting).toHaveLength(1);
    expect(machine.transitions.some((t) => t.symbol === "")).toBe(true);
    expect(thompson("(a").error).toBeTruthy();
  });
  it("el AFD mínimo de (11+0)* tiene 3 estados y el de (a+bb)*+ab 6, como en la guía", () => {
    const m1 = determinize(thompson("(11+0)*").machine).dfa;
    expect(minimize({ name: "x", alphabet: ["0", "1"], start: m1.initial, accepting: m1.accepting, rows: m1.states.map((s) => [s.id, ...["0", "1"].map((a) => m1.transitions.find((t) => t.from === s.id && t.symbol === a)?.to ?? "-")]) }).minimal.rows).toHaveLength(3);
    const m2 = determinize(thompson("(a+bb)*+ab").machine).dfa;
    const table = { name: "x", alphabet: ["a", "b"], start: m2.initial, accepting: m2.accepting, rows: m2.states.map((s) => [s.id, ...["a", "b"].map((a) => m2.transitions.find((t) => t.from === s.id && t.symbol === a)?.to ?? "-")]) };
    expect(minimize(table).minimal.rows).toHaveLength(6);
    expect(faEquivalent(thompson("(a+bb)*+ab").machine, m2)).toEqual({ equal: true });
  });
});

describe("gramática regular → AF", () => {
  const nfa = (productions, extra = {}) => nfaFromGrammarText({ productions, ...extra });
  it("ejercicio 9: D := 0E | 1, E := 0 | 1E | 1", () => {
    const m = nfa("D := 0E | 1\nE := 0 | 1E | 1", { axiom: "D" });
    expect(m.states.map((s) => s.id)).toEqual(["D", "E", "F"]);
    expect(m.transitions.map((t) => `${t.from}${t.symbol}${t.to}`).sort()).toEqual(["D0E", "D1F", "E0F", "E1E", "E1F"]);
    expect(m.accepting).toEqual(["F"]);
  });
  it("el AF reconoce exactamente el lenguaje de la gramática (ejercicios 10, 11, 19, 20, 21)", () => {
    const cases = [
      ["S := xX\nX := yY\nY := xX | y", "S"],
      ["S := xN | x\nN := yM | y\nM := zN | z", "S"],
      ["S := λ | xX | yY\nY := yY | x\nX := xX | y", "S"],
      ["A := 0A | 1B\nB := 0C | 0D\nC := 0 | 1B | 1D\nD := 1", "A"],
      ["A := 0B | 1A\nB := 0B | 1C\nC := 0B | 1D | 1\nD := 0E | 0\nE := 0D | 0 | 1C", "A"],
    ];
    for (const [text, axiom] of cases) {
      const g = parseGrammar({ productions: text, axiom }).grammar;
      const m = nfaFromGrammarText({ productions: text, axiom });
      expect(acceptedStrings(m, g.terminals, 7).sort(), text).toEqual(generateLanguage(g, 7).words.sort());
    }
  });
  it("rechaza gramáticas que no son regulares", () => {
    expect(() => nfa("S := aSb | ab")).toThrow(/regular/);
  });
});

describe("AF → gramática regular", () => {
  it("ejercicio 12 (cátedra): G12 de la guía", () => {
    const af = afFromList({ alphabet: ["0", "1"], states: ["A", "B", "C", "F"], start: "A", accepting: ["F"], transitions: ["A 1 A", "A 0 B", "B 0 B", "B 1 C", "C 1 F", "C 0 B", "F 0 B", "F 1 A"] });
    expect(grammarText(grammarFromAf(af)).split("\n").map((l) => l.split(" := ")[1].split(" | ").sort().join("|"))).toEqual(["0B|1A", "0B|1C", "0B|1|1F", "0B|1A"]);
  });
  it("la gramática obtenida genera el lenguaje del autómata", () => {
    const af = afFromTable({ alphabet: ["0", "1"], start: "A", accepting: ["F"], rows: [["A", "B", "A"], ["B", "C", "B"], ["C", "F", "C"], ["F", "A", "F"]] });
    const g = grammarFromAf(af);
    const words = new Set(generateLanguage(parseGrammar({ ...{ productions: grammarText(g) }, axiom: "A" }).grammar, 7).words);
    expect(acceptedStrings(af, ["0", "1"], 7).sort()).toEqual([...words].sort());
    expect(acceptsFa(af, "000")).toBe(true);
  });
});

describe("minimizar un AFD generado", () => {
  it("minimizeMachine devuelve el mínimo del AFD de Thompson", async () => {
    const { minimizeMachine } = await import("./constructions.js");
    const dfa = determinize(thompson("(11+0)*").machine).dfa;
    const r = minimizeMachine(dfa);
    expect(r.machine.states).toHaveLength(3);
    expect(faEquivalent(r.machine, thompson("(11+0)*").machine)).toEqual({ equal: true });
  });
});
