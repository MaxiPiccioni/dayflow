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
