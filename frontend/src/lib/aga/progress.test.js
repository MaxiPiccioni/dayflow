import { describe, expect, it } from "vitest";
import { STORAGE_KEY, emptyProgress, loadProgress, saveProgress } from "./progress.js";

const memory = (initial = {}) => {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; }, data };
};

describe("progreso del sandbox de Álgebra", () => {
  it("guarda y vuelve a leer el último ejercicio de cada unidad", () => {
    const storage = memory();
    expect(saveProgress({ v: 1, last: { 2: { id: "u2e5", item: 1 } } }, storage)).toBe(true);
    expect(loadProgress(storage).last).toEqual({ 2: { id: "u2e5", item: 1 } });
  });
  it("ignora datos rotos o de otra versión", () => {
    expect(loadProgress(memory({ [STORAGE_KEY]: "{no es json" }))).toEqual(emptyProgress());
    expect(loadProgress(memory({ [STORAGE_KEY]: JSON.stringify({ v: 2, last: {} }) }))).toEqual(emptyProgress());
    expect(loadProgress(memory({ [STORAGE_KEY]: JSON.stringify({ v: 1, last: { 1: { id: 5 } } }) })).last).toEqual({});
  });
  it("sin localStorage no falla", () => {
    expect(loadProgress(null)).toEqual(emptyProgress());
    expect(saveProgress(emptyProgress(), null)).toBe(false);
  });
});
