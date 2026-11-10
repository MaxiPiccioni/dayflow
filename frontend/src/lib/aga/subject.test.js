import { describe, expect, it } from "vitest";
import { isAgaSubject } from "./subject";

describe("isAgaSubject", () => {
  it("reconoce el nombre con tildes, mayúsculas y espacios de más", () => {
    expect(isAgaSubject({ name: "Álgebra y Geometría Analítica" })).toBe(true);
    expect(isAgaSubject({ name: "  ALGEBRA  y geometria analitica " })).toBe(true);
  });
  it("rechaza otras materias y valores vacíos", () => {
    expect(isAgaSubject({ name: "Análisis Matemático I" })).toBe(false);
    expect(isAgaSubject(null)).toBe(false);
    expect(isAgaSubject({})).toBe(false);
  });
});
