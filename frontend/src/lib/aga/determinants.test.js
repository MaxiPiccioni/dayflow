import { describe, expect, it } from "vitest";
import { adjointInfo, laplaceInfo, sarrusTerms, triangulate } from "./determinants.js";

const B = [[-1, -2, -2], [-1, 3, 1], [2, 5, -1]];

describe("métodos de determinantes", () => {
  it("Sarrus del ejemplo del apunte (|B| = 28)", () => {
    const { plus, minus } = sarrusTerms(B);
    expect(plus.reduce((s, x) => s + x.p, 0) - minus.reduce((s, x) => s + x.p, 0)).toBe(28);
  });
  it("Laplace elige la fila con más ceros (|C| = 21)", () => {
    const r = laplaceInfo([[-1, 2, 4], [0, 3, 1], [-2, 1, 0]]);
    expect([r.kind, r.k, r.total]).toEqual(["fila", 1, 21]);
  });
  it("triangulación del ejemplo del apunte (|A| = −21)", () => {
    expect(triangulate([[2, 3, 7], [0, 0, -3], [1, -2, 7]]).det).toBe(-21);
  });
  it("triangulación detecta la matriz singular", () => {
    const t = triangulate([[1, 2], [2, 4]]);
    expect([t.singular, t.det]).toEqual([true, 0]);
    expect(triangulate([[1, 1, 1], [1, 1, 1], [0, 1, 2]]).det).toBe(0);
  });
  it("adjunta de B y B⁻¹ = adj/28", () => {
    const a = adjointInfo(B);
    expect(a.adj).toEqual([[-8, -12, 4], [1, 5, 3], [-11, 1, -5]]);
    expect(a.det).toBe(28);
    expect(a.inv[0][0]).toBeCloseTo(-8 / 28);
  });
});
