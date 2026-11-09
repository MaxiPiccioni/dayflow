import { describe, expect, it } from "vitest";
import { analyzeComplexity, evaluatePolynomial, fitPolynomial, polynomialText } from "./complexity.js";
import { MT10, MT13, MT61 } from "../unit6/machines.js";

describe("complejidad de máquinas de Turing", () => {
  it("ajusta un polinomio exacto con fracciones", () => {
    const coeffs = fitPolynomial([6, 9, 12, 15].map((n) => ({ n, y: (4 * n * n) / 9 + n + 1 })), 3);
    expect(polynomialText(coeffs)).toBe("4/9 n² + n + 1");
    expect(evaluatePolynomial(coeffs, 18)).toEqual({ n: 163n, d: 1n });
  });

  it("el Ejemplo 6.1 da T(n) = 4/9 n² + n + 1 y E(n) = n + 1 (guía, ejercicio 22)", () => {
    const r = analyzeComplexity(MT61, "ckdkek");
    expect(r.time.text).toBe("4/9 n² + n + 1");
    expect(r.time.verified).toBe(true);
    expect(r.space.text).toBe("n + 1");
    expect(r.rows.find((row) => row.n === 6).steps).toBe(23);
    expect(r.rows.find((row) => row.n === 18).steps).toBe(163);
  });

  it("el espejo y el intercambio de nibbles son cuadráticos", () => {
    for (const [machine, family] of [[MT10, "mirror"], [MT13, "swap"]]) {
      const r = analyzeComplexity(machine, family);
      expect(r.time.verified, family).toBe(true);
      expect(r.time.coeffs[3].n).toBe(0n);
      expect(r.time.coeffs[2].n).not.toBe(0n);
    }
  });

  it("avisa si la máquina no resuelve el ejercicio", () => {
    const broken = { ...MT61, transitions: MT61.transitions.filter((t) => !(t.from === "p")) };
    expect(analyzeComplexity(broken, "ckdkek").error).toMatch(/no terminó bien/);
  });
});
