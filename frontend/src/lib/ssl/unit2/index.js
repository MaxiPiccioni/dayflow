import { CADENAS } from "./cadenas.js";
import { GRAMATICAS } from "./gramaticas.js";
import { LIMPIA, BIEN_FORMADA } from "./limpia.js";
import { RECURSIVIDAD, FORMAS_NORMALES } from "./recursividad.js";
import { REGULARES } from "./regulares.js";
import { AUTOMATAS } from "./automatas.js";

// Secciones de la Unidad 2 en el orden de la guía. Cada una trae un ejemplo resuelto y sus ejercicios.
export const UNIT2_SECTIONS = [CADENAS, GRAMATICAS, LIMPIA, BIEN_FORMADA, RECURSIVIDAD, FORMAS_NORMALES, REGULARES, AUTOMATAS];

export const UNIT2_EXERCISES = UNIT2_SECTIONS.flatMap((section) => section.exercises);

// Unidades 3 a 6: todavía sin contenido.
export const COMING_UNITS = [3, 4, 5, 6];
