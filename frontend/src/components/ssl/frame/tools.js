import { Braces, FlaskConical, Regex, Shuffle, Type, Wrench } from "lucide-react";

// Herramientas de la Unidad 2 que siempre están a mano en la barra lateral cuando el ejercicio no es un autómata.
export const GENERIC_TOOLS = [
  { id: "strings", label: "Cadenas", icon: Type },
  { id: "langops", label: "Lenguajes", icon: Braces },
  { id: "grammar", label: "Gramáticas", icon: FlaskConical },
  { id: "transform", label: "Transformaciones de gramáticas", icon: Shuffle },
  { id: "regex", label: "Expresiones regulares", icon: Regex },
];
export const OWN_TOOL_ICON = Wrench;
export const TOOL_LABEL = { formula: "Enumerador de lenguajes", dfa: "Minimización de AFD", analyzer: "Analizador sintáctico", convert: "Conversión AFND → AFD", thompson: "Thompson" };

// Datos con los que arrancan las herramientas genéricas cuando se abren desde la barra (no vienen de un ejercicio).
export const TOOL_DEFAULTS = {
  strings: { env: { α: "aab", β: "cdee", γ: "eddcc", δ: "aacddd" } },
  langops: { a: "{a, b, c, d}", b: "{c, d, e}", op: "union", n: 2 },
  grammar: { grammar: { terminals: "", nonterminals: "", axiom: "S", productions: "S := aA | b\nA := aA | a" } },
  transform: { mode: "clean", grammar: { terminals: "", nonterminals: "", axiom: "S", productions: "S := aA | b\nA := aA\nB := b" } },
  regex: { regex: "a(b+c)*d" },
};
