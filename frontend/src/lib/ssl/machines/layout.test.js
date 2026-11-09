import { describe, expect, it } from "vitest";
import { R, canvasSize, clampPoint, edgeGeometry, initialArrow, nextFreePosition, stateAt } from "./layout.js";

const a = { id: "a", x: 100, y: 100 };
const b = { id: "b", x: 300, y: 100 };

describe("geometría del lienzo", () => {
  it("la flecha recta sale y llega a la circunferencia, no al centro", () => {
    const g = edgeGeometry(a, b);
    expect(g.d.startsWith(`M ${100 + R} 100`)).toBe(true);
    expect(g.d).toContain(`L ${300 - R - 1} 100`);
    expect(g.angle).toBeCloseTo(0);
  });
  it("ida y vuelta se curvan hacia lados opuestos y no se superponen", () => {
    const ab = edgeGeometry(a, b, { hasReverse: true });
    const ba = edgeGeometry(b, a, { hasReverse: true });
    expect(ab.label.y).not.toBeCloseTo(ba.label.y);
    expect(ab.label.y * ba.label.y).toBeGreaterThan(0);
    expect(Math.sign(ab.label.y - 100)).toBe(-Math.sign(ba.label.y - 100));
    expect(ab.d).toContain(" Q ");
  });
  it("el bucle queda sobre el estado", () => {
    const g = edgeGeometry(a, a, { loop: true });
    expect(g.label.y).toBeLessThan(100 - R);
    expect(g.d).toContain(" C ");
  });
  it("detecta estados bajo un punto y calcula el tamaño del lienzo", () => {
    expect(stateAt([a, b], 110, 105)?.id).toBe("a");
    expect(stateAt([a, b], 200, 100)).toBe(null);
    expect(stateAt([a, b], 100 + R + 8, 100, 10)?.id).toBe("a");
    expect(canvasSize([{ x: 900, y: 500 }]).width).toBeGreaterThan(900);
    expect(canvasSize([]).width).toBe(520);
  });
  it("posiciones libres y flecha de entrada", () => {
    const first = nextFreePosition([]);
    const second = nextFreePosition([{ ...first }]);
    expect(second).not.toEqual(first);
    expect(initialArrow(a).x2).toBeLessThan(100 - R + 1);
    expect(clampPoint(-5, 3)).toEqual({ x: R + 6, y: R + 6 });
  });
});
