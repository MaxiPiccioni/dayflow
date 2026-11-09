import { describe, expect, it } from "vitest";
import { UNIT2_EXERCISES, UNIT2_SECTIONS } from "./index.js";
import { checkAnswer, languageWords } from "../check.js";
import { analyzeRecursion, classify, compareGrammars, detectAmbiguity, generateLanguage, parseGrammar, recursionKey } from "../grammar.js";
import { cleanGrammar } from "../transform.js";
import { enumerateRegex } from "../regex.js";
import { equivalent } from "../automata.js";
import { enumerateFormula } from "../languages.js";

const grammarOf = (fields) => parseGrammar(fields).grammar;

// Una respuesta correcta para cada tipo de comprobación, calculada con el motor, para probar que los datos son coherentes.
function sampleAnswer(spec) {
  switch (spec.kind) {
    case "number": return String(spec.expected);
    case "text": return spec.expected === "" ? "λ" : spec.expected;
    case "wordset": return spec.expected.join(", ");
    case "grammar-language": return generateLanguage(grammarOf(spec.grammar), spec.maxLen ?? 10).words.join(", ");
    case "language-words": return languageWords(spec.language, 12).slice(0, spec.min ?? 3).map((w) => w || "λ").join(", ");
    case "grammar-type": return String(classify(grammarOf(spec.grammar)).type);
    case "recursion-type": return recursionKey(analyzeRecursion(grammarOf(spec.grammar)));
    case "ambiguity": return detectAmbiguity(grammarOf(spec.grammar), spec.maxLen ?? 7).ambiguous ? "si" : "no";
    case "equivalent": return compareGrammars(grammarOf(spec.a), grammarOf(spec.b), spec.maxLen ?? 8).equal ? "si" : "no";
    case "dfa-equivalent": return equivalent(spec.a, spec.b).equal ? "si" : "no";
    case "clean-field": {
      const r = cleanGrammar(grammarOf(spec.grammar))[spec.field];
      const list = spec.field === "unnecessary" ? r.map((x) => `${x.lhs}:=${x.rhs}`) : r;
      return list.length ? list.join(", ") : "ninguno";
    }
    case "grammar": return spec.expected.productions;
    case "regex": return spec.expected;
    case "regex-words": return enumerateRegex(spec.regex, { count: spec.min ?? 3 }).words.map((w) => w || "λ").join(", ");
    case "derivation": return null;
    case "expr": return null;
    default: return undefined;
  }
}

describe("datos de la Unidad 2", () => {
  it("las secciones cubren los ejercicios 1 a 29 de la guía", () => {
    const numbers = UNIT2_SECTIONS.slice(0, 7).flatMap((s) => s.exercises.map((e) => e.number));
    expect(numbers).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
    expect(UNIT2_SECTIONS[7].exercises).toHaveLength(22);
  });

  it("los ids son únicos y cada ejercicio tiene página y enunciado", () => {
    const ids = UNIT2_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const exercise of UNIT2_EXERCISES) {
      expect(exercise.page, exercise.id).toBeGreaterThan(0);
      expect(exercise.statement.length, exercise.id).toBeGreaterThan(10);
      expect(exercise.parts.length, exercise.id).toBeGreaterThan(0);
      const partIds = exercise.parts.map((p) => p.id);
      expect(new Set(partIds).size, exercise.id).toBe(partIds.length);
    }
  });

  it("cada sección tiene un ejemplo resuelto con pasos", () => {
    for (const section of UNIT2_SECTIONS) {
      expect(section.example.steps.length, section.id).toBeGreaterThan(2);
      expect(section.example.page, section.id).toBeGreaterThan(0);
    }
  });

  it("la respuesta correcta calculada por el motor pasa cada comprobación", () => {
    for (const exercise of UNIT2_EXERCISES) {
      for (const part of exercise.parts) {
        for (const check of part.checks) {
          const sample = sampleAnswer(check.spec);
          if (sample === undefined) throw new Error(`Sin muestra para ${check.spec.kind} (${exercise.id}.${part.id})`);
          if (sample === null) continue;
          const result = checkAnswer(check.spec, sample);
          expect(result.ok, `${exercise.id}.${part.id}.${check.id}: ${result.message}`).toBe(true);
        }
      }
    }
  });

  it("las comprobaciones de enunciado con expresiones coinciden con la solución de la guía", () => {
    const ex2 = UNIT2_EXERCISES.find((e) => e.id === "u2-e2");
    const answers = { a: "aabaab", b: "aabaacddd", c: "eedc", d: "baadddcaa", e: "ccddeeedcccddeeedc" };
    for (const part of ex2.parts) expect(checkAnswer(part.checks[0].spec, answers[part.id]).ok, part.id).toBe(true);
  });

  it("las derivaciones pedidas se pueden escribir como en la guía", () => {
    const ex7 = UNIT2_EXERCISES.find((e) => e.id === "u2-e7");
    const guide = { a: "S → aAc → aBc → abbc", b: "S → aB → abcAe → abcde", c: "S → zMz → zzAz → zzaazBz → zzaazaz", d: "S → xX → xxY → xxyY → xxyyY → xxyyyY → xxyyyy" };
    for (const part of ex7.parts) {
      const check = part.checks.find((c) => c.id === "der");
      expect(checkAnswer(check.spec, guide[part.id]).ok, part.id).toBe(true);
    }
  });

  it("los tipos de la guía coinciden con la clasificación (ejercicios 6 y 7)", () => {
    const expected = { "u2-e6": { a: 2, b: 2, c: 3, d: 2, e: 1, f: 0 }, "u2-e7": { a: 1, b: 2, c: 1, d: 3 } };
    for (const [id, types] of Object.entries(expected)) {
      const ex = UNIT2_EXERCISES.find((e) => e.id === id);
      for (const part of ex.parts) {
        const spec = part.checks.find((c) => c.id === "tipo").spec;
        expect(classify(grammarOf(spec.grammar)).type, `${id}.${part.id}`).toBe(types[part.id]);
      }
    }
  });

  it("recursividad y ambigüedad de los ejercicios 9, 10 y 11 coinciden con la guía", () => {
    const rec = { "u2-e10": { a: "none", b: "derecha", c: "izquierda", d: "multi" }, "u2-e11": { a: "central", b: "central", c: "derecha", d: "central", e: "derecha" } };
    for (const [id, expected] of Object.entries(rec)) {
      const ex = UNIT2_EXERCISES.find((e) => e.id === id);
      for (const part of ex.parts.filter((p) => expected[p.id])) {
        const spec = part.checks.find((c) => c.id === "rec").spec;
        expect(recursionKey(analyzeRecursion(grammarOf(spec.grammar))), `${id}.${part.id}`).toBe(expected[part.id]);
      }
    }
    const amb = { "u2-e9": { a: true, b: true }, "u2-e11": { a: false, b: false, c: true, d: false, e: false } };
    for (const [id, expected] of Object.entries(amb)) {
      const ex = UNIT2_EXERCISES.find((e) => e.id === id);
      for (const part of ex.parts.filter((p) => p.id in expected)) {
        const spec = part.checks.find((c) => c.id === "amb").spec;
        expect(detectAmbiguity(grammarOf(spec.grammar), 6).ambiguous, `${id}.${part.id}`).toBe(expected[part.id]);
      }
    }
  });

  it("las fórmulas de las herramientas son válidas", () => {
    for (const exercise of UNIT2_EXERCISES) {
      for (const tool of [exercise.tool, ...exercise.parts.map((p) => p.tool)]) {
        if (tool?.type === "formula" && tool.formula.includes("/")) expect(enumerateFormula(tool.formula).error, exercise.id).toBeUndefined();
      }
    }
  });
});
