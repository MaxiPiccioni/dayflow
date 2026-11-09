import { describe, expect, it } from "vitest";
import { isSslSubject } from "./subject.js";

describe("isSslSubject", () => {
  it("ignora tildes, mayúsculas y espacios de más", () => {
    expect(isSslSubject({ name: "Sintaxis y Semántica de los Lenguajes" })).toBe(true);
    expect(isSslSubject({ name: "  SINTAXIS  Y SEMANTICA DE LOS LENGUAJES " })).toBe(true);
    expect(isSslSubject({ name: "sintaxis y semántica de los lenguajes (SSL)" })).toBe(true);
  });
  it("no confunde otras materias", () => {
    expect(isSslSubject({ name: "Análisis Matemático I" })).toBe(false);
    expect(isSslSubject({ name: "Paradigmas de Programación" })).toBe(false);
    expect(isSslSubject({})).toBe(false);
    expect(isSslSubject(null)).toBe(false);
  });
});
