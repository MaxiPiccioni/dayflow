import { EX1 } from "./unit1.js";
import { EX2 } from "./unit2.js";
import { EX3 } from "./unit3.js";

// Unidades del sandbox de Álgebra y Geometría Analítica. `mat: true` muestra la vista de matrices en vez del plano.
export const UNITS = [
  { n: 1, title: "Unidad 1 · Vectores libres en ℝ², ℝ³ y ℝⁿ" },
  { n: 2, title: "Unidad 2 · Matrices", mat: true },
  { n: 3, title: "Unidad 3 · Determinantes", mat: true },
];

export const EX = [...EX1, ...EX2, ...EX3];
export const unitByNumber = (n) => UNITS.find((u) => u.n === n);
