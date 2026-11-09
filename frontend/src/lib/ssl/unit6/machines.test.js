import { describe, expect, it } from "vitest";
import * as M from "./machines.js";
import { checkMachine } from "../machines/check-machine.js";
import { runTape } from "../machines/run-tape.js";
import { BOT, EOT, analyze } from "../machines/model.js";

const lang = (machineType, alphabet, predicate, params = {}, extra = {}) => ({ kind: "machine-language", machineType, alphabet, maxLen: 7, predicate, params, ...extra });
const words = (alphabet, max, min = 0) => {
  const out = [];
  const go = (w) => { if (w.length >= min) out.push(w); if (w.length < max) for (const a of alphabet) go(w + a); };
  go("");
  return out;
};
const out = (fn, inputs, extra = {}) => ({ kind: "machine-output", fn, inputs, ...extra });

const LANGUAGE = {
  ALA1A: lang("ala", ["0", "1"], "count-parity", { symbol: "0", parity: "even", emptyOptional: true }),
  ALA1B: lang("ala", ["0", "1"], "count-parity", { symbol: "1", parity: "odd", emptyOptional: true }),
  ALA1C: lang("ala", ["0", "1"], "length-parity", { parity: "even", emptyOptional: true }),
  ALA1D: lang("ala", ["0", "1"], "even-zeros-even-ones"),
  ALA_PAL: lang("ala", ["0", "1"], "palindrome", {}, { maxLen: 8 }),
  ALA_PAL_SIN_ERROR: lang("ala", ["0", "1"], "palindrome", {}, { maxLen: 8 }),
  ALA25A: lang("ala", ["a", "b"], "ab-relation", { relation: ">" }, { maxLen: 8 }),
  ALA25B: lang("ala", ["a", "b"], "ab-relation", { relation: "<" }, { maxLen: 8 }),
  ALA25C: lang("ala", ["a", "b"], "ab-relation", { relation: "=" }, { maxLen: 8 }),
  ALA27: lang("ala", ["0", "1"], "byte-double", {}, { maxLen: 9 }),
  MT11: lang("mt", ["0", "1", "*"], "equal-star", {}, { maxLen: 8 }),
  MT15: lang("mt", ["0", "1"], "equal-count", {}, { maxLen: 8 }),
  MT16A: lang("mt", ["0", "1"], "sym-mid-sym", { side: "0", mid: "1" }, { maxLen: 8 }),
  MT16B: lang("mt", ["a", "b", "c"], "a-b-c-outer", { a: "a", b: "b", c: "c" }, { maxLen: 7 }),
  MT16C: lang("mt", ["0", "1"], "ratio-blocks", { x: "0", y: "1", ratio: 2 }, { maxLen: 9 }),
  MT16D: lang("mt", ["a", "b", "c"], "ab-relation", { relation: ">", bOptionalZero: true }, { maxLen: 6 }),
  MT18: lang("mt", ["0", "1"], "palindrome", {}, { maxLen: 8 }),
  MT19: lang("mt", ["0", "1"], "palindrome", { parity: "even" }, { maxLen: 8 }),
  MT32: lang("mt", ["0", "1", "#"], "reverse-hash", {}, { maxLen: 9 }),
  MT61: lang("mt", ["c", "d", "e"], "triple-blocks", { x: "c", y: "d", z: "e" }, { maxLen: 8 }),
  MT61_ERROR: lang("mt", ["c", "d", "e"], "triple-blocks", { x: "c", y: "d", z: "e" }, { maxLen: 8 }),
  MT31A: lang("mt", ["1", "2", "3"], "triple-blocks", { x: "1", y: "2", z: "3" }, { maxLen: 8 }),
  MT31B: lang("mt", ["1", "2", "3"], "a-b-c-outer", { a: "1", b: "2", c: "3" }, { maxLen: 8 }),
  MT31C: lang("mt", ["1", "2", "3", "4"], "abab-blocks", { a: "1", b: "2", c: "3", d: "4" }, { maxLen: 8 }),
};

const nibbles = [];
for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) nibbles.push(`${a.toString(2).padStart(4, "0")}*${b.toString(2).padStart(4, "0")}`);
const bitsPlus = words(["0", "1"], 8, 1);
const star = (alphabet, max) => words(alphabet, max).map((w) => `${w}*`);

const OUTPUT = {
  ALA3: out("replace-00-by-11", bitsPlus),
  ALA4: out("sort-bits", bitsPlus),
  ALA26: out("reverse", bitsPlus),
  MT6: out("length-parity-letter", words(["0", "1"], 8)),
  MT7: out("zeros-parity-letter", words(["0", "1"], 8)),
  MT8: out("negate-if-even-ones", words(["0", "1"], 8)),
  MT9: out("substitute-ba-de", words(["A", "B", "C", "D", "E"], 5)),
  MT10: out("mirror-after-star", star(["A", "B"], 6)),
  MT12: out("copy-first-nibble", nibbles),
  MT13: out("swap-nibbles", nibbles),
  MT14: out("sort-after-star", star(["0", "1"], 6)),
  MT20: out("sort-bits", words(["0", "1", "2"], 6, 1)),
  MT28: out("swap-00-11", words(["0", "1"], 9)),
  MT29: out("copy-second-nibble", nibbles),
  MT30A: out("swap-bits", nibbles, { params: { from1: 0, from2: 0 } }),
  MT30B: out("swap-bits", nibbles, { params: { from1: 0, from2: 2 } }),
  MT30C: out("swap-bits", nibbles, { params: { from1: 2, from2: 0 } }),
  MT30D: out("swap-bits", nibbles, { params: { from1: 2, from2: 2 } }),
};

describe("Unidad 6: máquinas de referencia", () => {
  for (const [name, spec] of Object.entries(LANGUAGE)) {
    it(`${name} reconoce su lenguaje`, () => {
      const r = checkMachine(M[name], spec);
      expect(r.ok, `${r.message} ${(r.detail ?? []).join(" ")}`).toBe(true);
    });
  }
  for (const [name, spec] of Object.entries(OUTPUT)) {
    it(`${name} deja en la cinta la salida pedida`, () => {
      const r = checkMachine(M[name], spec);
      expect(r.ok, `${r.message} ${(r.detail ?? []).join(" ")}`).toBe(true);
    });
  }

  it("ninguna referencia tiene errores estructurales", () => {
    for (const [name, m] of Object.entries(M)) {
      if (typeof m !== "object" || !m.transitions) continue;
      const { errors } = analyze(m);
      expect(errors, name).toEqual([]);
    }
  });

  it("ejemplos de la guía: ejercicio 7 y ejercicio 8", () => {
    expect(runTape(M.MT7, "0100110").content).toBe("0100110P");
    expect(runTape(M.MT8, "101011").content).toBe("010100");
    expect(runTape(M.MT28, "01001011011").content).toBe("01111000000");
    expect(runTape(M.MT9, "CFHBAAGDE").content).toBe("CFHFGAGHI");
    expect(runTape(M.MT10, "ABB*").content).toBe("ABB*BBA");
    expect(runTape(M.MT14, "0110100*").content).toBe("0110100*0000111");
    expect(runTape(M.ALA3, "00101100").content).toBe("11101111");
  });

  it("el cartel luminoso muestra las imágenes en orden y se repite", () => {
    const r = runTape(M.ALA5, "======", { maxSteps: 6000 });
    const frames = [];
    for (const step of r.steps) {
      if (step.state === "P0" && step.head === 1) {
        const frame = step.tape.filter((s) => s !== BOT && s !== EOT).join("");
        if (frames[frames.length - 1] !== frame) frames.push(frame);
      }
    }
    expect(frames.slice(0, 13)).toEqual(M.CARTEL_FRAMES);
    expect(frames[13]).toBe("======");
    expect(r.reason).toBe("bucle");
  });

  it("el ALA de la recíproca y el de bytes dan las tablas esperadas", () => {
    expect(runTape(M.ALA26, "10110").content).toBe("01101");
    expect(runTape(M.ALA27, "10111011").accepted).toBe(true);
    expect(runTape(M.ALA27, "10111010").accepted).toBe(false);
  });

  it("la MT de α#α⁻¹ cuesta T(n) = n²/2 + 2n + 1/2 pasos (guía, ejercicio 6.32)", () => {
    const steps = (m) => runTape(M.MT32, `${"01".repeat(m).slice(0, m)}#${Array.from("01".repeat(m).slice(0, m)).reverse().join("")}`).steps.length - 1;
    for (const m of [1, 2, 3, 4, 5]) { const n = 2 * m + 1; expect(steps(m)).toBe((n * n) / 2 + 2 * n + 0.5); }
  });

  it("la tabla 6.14 de la guía acepta 1232 (falla); la versión corregida no", () => {
    expect(runTape(M.MT31B_GUIA, "1232").accepted).toBe(true);
    expect(runTape(M.MT31B, "1232").accepted).toBe(false);
    expect(runTape(M.MT31B, "123").accepted).toBe(true);
  });

  it("el error de 6.1 va a qE y el ALA de palíndromos con error cae en qE", () => {
    const r = runTape(M.MT61_ERROR, "cdd");
    expect(r.state).toBe("qE");
    expect(r.outcome).toBe("error");
    const p = runTape(M.ALA_PAL, "0110111");
    expect(p.outcome).toBe("error");
    expect(runTape(M.ALA_PAL_SIN_ERROR, "0110111").outcome).toBe("no reconocida");
  });

  it("la MT del ejemplo 6.1 cuesta T(n) = 4/9 n² + n + 1 pasos (como en la guía)", () => {
    const t = (k) => runTape(M.MT61, "c".repeat(k) + "d".repeat(k) + "e".repeat(k)).steps.length - 1;
    for (const k of [2, 3, 4, 5, 6]) expect(t(k)).toBe((4 * (3 * k) ** 2) / 9 + 3 * k + 1);
  });
});
