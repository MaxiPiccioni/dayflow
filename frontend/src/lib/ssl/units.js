import { UNIT2_SECTIONS } from "./unit2/index.js";
import { UNIT3_SECTIONS } from "./unit3/index.js";
import { UNIT4_SECTIONS } from "./unit4/index.js";
import { UNIT5_SECTIONS } from "./unit5/index.js";

// Unidades del sandbox. Una unidad se activa cuando tiene todas sus secciones cargadas; las demás
// muestran "Próximamente". `title` es el nombre de la unidad en la guía.
export const UNITS = [
  { n: 2, title: "Gramáticas y lenguajes formales", sections: UNIT2_SECTIONS },
  { n: 3, title: "Autómatas finitos deterministas", sections: UNIT3_SECTIONS },
  { n: 4, title: "Autómatas finitos no deterministas", sections: UNIT4_SECTIONS },
  { n: 5, title: "Autómatas con pila", sections: UNIT5_SECTIONS },
  { n: 6, title: "Autómata linealmente acotado y máquina de Turing", sections: [] },
];

export const unitByNumber = (n) => UNITS.find((u) => u.n === n);
export const isActive = (unit) => unit.sections.length > 0;
export const ALL_SECTIONS = UNITS.flatMap((u) => u.sections);
export const ALL_EXERCISES = ALL_SECTIONS.flatMap((s) => s.exercises);
