import { fmtWord, normalizeInput, parseWord, parseWordList } from "./notation.js";
import { evalStringExpr } from "./strings.js";
import { closureLanguage, concatLanguages, enumerateFormula, intersectSets, powerLanguage, sigmaClosure, unionSets } from "./languages.js";
import { RECURSION_OPTIONS, analyzeRecursion, classify, compareGrammars, detectAmbiguity, generateLanguage, parseGrammar, recursionKey, recursionLabel, successors } from "./grammar.js";
import { cleanGrammar, hasIndirectLeftRecursion, isFNC, isFNG } from "./transform.js";
import { compareRegex, compileRegex } from "./regex.js";
import { equivalent } from "./automata.js";
import { acceptsFa } from "./machines/run-fa.js";

// Comprobación de respuestas. Cada ejercicio declara un `check` (datos puros) y checkAnswer lo evalúa:
// devuelve { ok, message, detail? }. Los textos están en español rioplatense.

const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
const bad = (message, extra = {}) => ({ ok: false, message, ...extra });
const showList = (words) => words.map(fmtWord).join(", ");
const len = (w) => Array.from(w).length;

// Evalúa la descripción de un lenguaje (fórmula, lista, Σ*, unión, concatenación, potencia, clausura) acotada por longitud.
export function languageWords(spec, maxLen) {
  if (spec.formula) {
    const r = enumerateFormula(spec.formula, { maxLen, limit: Infinity, maxVar: Math.max(maxLen, 1) });
    if (r.error) throw new Error(r.error);
    return r.words;
  }
  if (spec.list) return spec.list.filter((w) => len(w) <= maxLen);
  if (spec.sigma) return sigmaClosure(spec.sigma.split(","), maxLen, { positive: !!spec.positive }).words;
  if (spec.union) return unionSets(languageWords(spec.union[0], maxLen), languageWords(spec.union[1], maxLen));
  if (spec.intersect) return intersectSets(languageWords(spec.intersect[0], maxLen), languageWords(spec.intersect[1], maxLen));
  if (spec.concat) return concatLanguages(languageWords(spec.concat[0], maxLen), languageWords(spec.concat[1], maxLen), maxLen);
  if (spec.power) return powerLanguage(languageWords(spec.power[0], maxLen), spec.power[1], maxLen);
  if (spec.closure) return closureLanguage(languageWords(spec.closure, maxLen), maxLen, !!spec.positive);
  throw new Error("Lenguaje no soportado");
}

const grammarOf = (fields) => {
  const parsed = parseGrammar(fields);
  if (parsed.error) throw new Error(parsed.error);
  return parsed.grammar;
};
const ruleSet = (g) => new Set(g.productions.map((p) => `${p.lhs}:=${p.rhs}`));

// Si el ejercicio pide una forma (FNC, FNG, sin recursividad por izquierda), devuelve qué incumple la gramática del usuario.
function formViolation(form, g) {
  const show = (p) => `${p.lhs} := ${fmtWord(p.rhs)}`;
  if (form === "fnc") {
    const rule = g.productions.find((p) => !isFNC({ ...g, productions: [p] }));
    return rule ? `no está en Forma Normal de Chomsky: ${show(rule)} no es de la forma A := BC, A := a ni S := λ.` : "";
  }
  if (form === "fng") {
    const rule = g.productions.find((p) => !isFNG({ ...g, productions: [p] }));
    return rule ? `no está en Forma Normal de Greibach: ${show(rule)} no es de la forma A := aη.` : "";
  }
  if (form === "noleftrec") {
    const rule = g.productions.find((p) => p.rhs !== "" && Array.from(p.rhs)[0] === p.lhs);
    if (rule) return `todavía tiene recursividad por izquierda: ${show(rule)}.`;
    return hasIndirectLeftRecursion(g) ? "todavía tiene recursividad por izquierda en más de un paso." : "";
  }
  return "";
}

const CHECKERS = {
  number(spec, answer) {
    const n = Number(String(answer).trim().replace(",", "."));
    if (String(answer).trim() === "" || Number.isNaN(n)) return bad("Escribí un número.");
    return n === spec.expected ? ok("¡Correcto!") : bad(`No coincide: ${n} no es el resultado.`);
  },

  text(spec, answer) {
    const word = parseWord(answer);
    if (answer.trim() === "") return bad("Escribí la cadena (o λ si es la cadena vacía).");
    return word === spec.expected ? ok("¡Correcto!") : bad(`No coincide: ${fmtWord(word)} no es el resultado esperado.`);
  },

  expr(spec, answer) {
    const result = evalStringExpr(spec.expr, spec.env);
    if (result.error) return bad(`Error en la expresión del ejercicio: ${result.error}`);
    return CHECKERS.text({ expected: result.value }, answer);
  },

  wordset(spec, answer) {
    const given = new Set(parseWordList(answer));
    const expected = new Set(spec.expected);
    if (!given.size) return bad("Escribí las cadenas separadas por comas.");
    const missing = [...expected].filter((w) => !given.has(w));
    const extra = [...given].filter((w) => !expected.has(w));
    if (!missing.length && !extra.length) return ok("¡Correcto! Tenés todas las cadenas.");
    const parts = [];
    if (extra.length) parts.push(`No corresponden: ${showList(extra)}.`);
    if (missing.length) parts.push(`Te faltan ${missing.length}.`);
    return bad(parts.join(" "));
  },

  // El usuario lista cadenas; cada una tiene que pertenecer al lenguaje (y tiene que haber al menos `min`).
  "language-words"(spec, answer) {
    const words = [...new Set(parseWordList(answer))];
    if (!words.length) return bad("Escribí algunas cadenas del lenguaje, separadas por comas.");
    const maxLen = Math.max(...words.map(len), 4);
    let members;
    try { members = new Set(languageWords(spec.language, maxLen)); } catch (err) { return bad(err.message); }
    const wrong = words.filter((w) => !members.has(w));
    if (wrong.length) return bad(`No pertenecen al lenguaje: ${showList(wrong)}.`, { wrong });
    const min = spec.min ?? 1;
    if (words.length < min) return bad(`Todas pertenecen al lenguaje, pero el ejercicio pide al menos ${min} (escribiste ${words.length}).`);
    const ordered = words.every((w, i) => i === 0 || len(words[i - 1]) <= len(w));
    if (spec.ordered && !ordered) return bad("Todas pertenecen al lenguaje, pero el ejercicio las pide en orden creciente de longitud.");
    return ok("¡Correcto! Todas pertenecen al lenguaje.");
  },

  // Lenguaje finito generado por una gramática: tiene que coincidir exactamente.
  "grammar-language"(spec, answer) {
    const g = grammarOf(spec.grammar);
    const { words } = generateLanguage(g, spec.maxLen ?? 10);
    return CHECKERS.wordset({ expected: words }, answer);
  },

  choice(spec, answer) {
    if (!answer) return bad("Elegí una opción.");
    return answer === spec.expected ? ok("¡Correcto!") : bad("No es esa. Revisá la definición y volvé a probar.");
  },

  "grammar-type"(spec, answer) {
    const g = grammarOf(spec.grammar);
    const c = classify(g);
    if (!answer) return bad("Elegí un tipo.");
    return answer === String(c.type) ? ok(`¡Correcto! ${c.name}.`, { detail: c.reasons }) : bad("No es ese tipo.", { detail: [`Pista: mirá las partes izquierdas y derechas de cada producción.`] });
  },

  recursion(spec, answer) {
    const g = grammarOf(spec.grammar);
    const analysis = analyzeRecursion(g);
    const expected = analysis.recursive ? "si" : "no";
    if (!answer) return bad("Elegí una opción.");
    return answer === expected ? ok(`¡Correcto! ${recursionLabel(analysis)}.`) : bad(analysis.recursive ? "Sí es recursiva: buscá un no terminal que vuelva a aparecer en sus propias derivaciones." : "No es recursiva: ningún no terminal se alcanza a sí mismo.");
  },

  // Tipo de recursividad con los nombres de la guía (ejercicios 10 y 11).
  "recursion-type"(spec, answer) {
    if (!answer) return bad("Elegí una opción.");
    const analysis = analyzeRecursion(grammarOf(spec.grammar));
    const expected = recursionKey(analysis);
    const label = RECURSION_OPTIONS.find(([key]) => key === expected)[1];
    if (answer === expected) return ok(`¡Correcto! ${label}.`, { detail: analysis.findings?.map((f) => `${f.symbol}: ${f.rules.join(", ")}`) });
    return bad(analysis.recursive ? "Sí es recursiva, pero no de ese tipo. Mirá en qué lugar de la parte derecha vuelve a aparecer el no terminal." : "No es recursiva: ningún no terminal se alcanza a sí mismo.");
  },

  // Derivación escrita por el usuario: S → aA → ab. Cada paso tiene que ser una derivación directa.
  derivation(spec, answer) {
    const g = grammarOf(spec.grammar);
    const forms = answer.split(/→|->|⇒/).map((f) => f.replace(/\s+/g, "")).map((f) => (f === "λ" ? "" : f));
    if (forms.length < 2 || forms.some((f, i) => f === "" && i < forms.length - 1)) return bad("Escribí la derivación con flechas, por ejemplo S → aA → ab.");
    if (forms[0] !== g.axiom) return bad(`La derivación empieza en el axioma ${g.axiom}.`);
    for (let i = 1; i < forms.length; i++) {
      if (!successors(g, forms[i - 1]).some((step) => step.form === forms[i])) return bad(`El paso ${fmtWord(forms[i - 1])} → ${fmtWord(forms[i])} no es una derivación directa con las producciones dadas.`);
    }
    if (forms[forms.length - 1] !== spec.target) return bad(`La derivación es válida, pero termina en ${fmtWord(forms[forms.length - 1])} y la cadena pedida es ${spec.target}.`);
    return ok("¡Correcto! Cada paso es una derivación directa y llegás a la cadena.");
  },

  // Dato que sale de aplicar el procedimiento de gramática limpia: reglas innecesarias, superfluos o inaccesibles.
  "clean-field"(spec, answer) {
    const result = cleanGrammar(grammarOf(spec.grammar));
    let expected = result[spec.field] ?? [];
    if (spec.field === "unnecessary") expected = expected.map((r) => `${r.lhs}:=${r.rhs}`);
    const nothing = /^(ninguno|ninguna|ningunos|ningunas|no hay|-|∅|vac[ií]o)$/i;
    const given = nothing.test(answer.trim()) ? [] : answer.split(spec.field === "unnecessary" ? /[,;]/ : /[\s,;]+/).map((t) => t.replace(/\s+/g, "").replace(/→/g, ":=")).filter(Boolean);
    const got = new Set(given);
    const want = new Set(expected);
    if (!answer.trim()) return bad("Escribí los símbolos separados por comas, o \"ninguno\" si no hay.");
    const missing = [...want].filter((x) => !got.has(x));
    const extra = [...got].filter((x) => !want.has(x));
    if (!missing.length && !extra.length) return ok(want.size ? "¡Correcto!" : "¡Correcto! No hay ninguno.");
    return bad(extra.length ? `No corresponde: ${extra.join(", ")}.` : `Te falta${missing.length > 1 ? "n" : ""} ${missing.length}.`);
  },

  "dfa-equivalent"(spec, answer) {
    const result = equivalent(spec.a, spec.b);
    const expected = result.equal ? "si" : "no";
    if (!answer) return bad("Elegí una opción.");
    return answer === expected ? ok(result.equal ? `¡Correcto! Son equivalentes: ${result.reason}.` : `¡Correcto! No son equivalentes: ${result.reason}.`) : bad(result.equal ? "Sí son equivalentes: al minimizarlos quedan iguales." : `No son equivalentes: ${result.reason}.`);
  },

  // Clases de equivalencia entre AFD dados por tabla: se escriben los pares, por ejemplo "A=B, C=E".
  "dfa-classes"(spec, answer) {
    const letter = (t) => t.name.replace(/^f/, "");
    const expected = new Set();
    for (let i = 0; i < spec.tables.length; i++) for (let j = i + 1; j < spec.tables.length; j++) {
      if (equivalent(spec.tables[i], spec.tables[j]).equal) expected.add([letter(spec.tables[i]), letter(spec.tables[j])].sort().join("="));
    }
    const text = answer.trim();
    const none = /^(ninguno|ninguna|no hay|-|∅)$/i.test(text);
    const given = new Set(none ? [] : text.split(/[,;\s]+/).filter(Boolean).map((p) => p.replace(/AFD/gi, "").split("=").map((x) => x.trim().toUpperCase()).sort().join("=")));
    if (!text) return bad("Escribí los pares de autómatas equivalentes, por ejemplo A=B, C=E (o \"ninguno\").");
    const wrong = [...given].filter((p) => !expected.has(p));
    const missing = [...expected].filter((p) => !given.has(p));
    if (!wrong.length && !missing.length) return ok(expected.size ? `¡Correcto! Son equivalentes: ${[...expected].join(", ")}.` : "¡Correcto! No hay autómatas equivalentes entre sí.");
    return bad(wrong.length ? `No son equivalentes: ${wrong.join(", ")}.` : `Te falta${missing.length > 1 ? "n" : ""} ${missing.length} par${missing.length > 1 ? "es" : ""}.`);
  },

  // ¿Cuáles de estas cadenas reconoce el autómata finito? (árboles de descripciones instantáneas de la guía)
  "fa-accepts"(spec, answer) {
    const expected = spec.strings.filter((w) => acceptsFa(spec.machine, w));
    const text = answer.trim();
    if (!text) return bad("Escribí las cadenas que se reconocen, separadas por comas (o \"ninguna\").");
    const given = /^(ninguna|ninguno|no hay|-|∅)$/i.test(text) ? [] : parseWordList(text);
    const wrongIn = given.filter((w) => !expected.includes(w));
    const missing = expected.filter((w) => !given.includes(w));
    if (!wrongIn.length && !missing.length) return ok(expected.length ? `¡Correcto! Se reconocen ${showList(expected)}.` : "¡Correcto! Ninguna de las cadenas se reconoce.");
    if (wrongIn.length) return bad(`${showList(wrongIn)} no ${wrongIn.length > 1 ? "se reconocen" : "se reconoce"}: ninguna rama de su árbol llega a un estado de aceptación con la cadena leída.`);
    return bad(`Se reconoce también ${showList(missing)}: hay una rama de su árbol que llega a un estado de aceptación.`);
  },

  ambiguity(spec, answer) {
    const g = grammarOf(spec.grammar);
    const result = detectAmbiguity(g, spec.maxLen ?? 7);
    const expected = result.ambiguous ? "si" : "no";
    if (!answer) return bad("Elegí una opción.");
    return answer === expected ? ok(result.ambiguous ? `¡Correcto! Es ambigua: ${result.examples[0].word} tiene más de un árbol de derivación.` : "¡Correcto! No encontré ninguna cadena con dos árboles distintos.") : bad(result.ambiguous ? `Es ambigua: la cadena ${result.examples[0].word} tiene dos árboles de derivación diferentes.` : "No es ambigua: cada cadena tiene un único árbol de derivación.");
  },

  equivalent(spec, answer) {
    const result = compareGrammars(grammarOf(spec.a), grammarOf(spec.b), spec.maxLen ?? 8);
    const expected = result.equal ? "si" : "no";
    if (!answer) return bad("Elegí una opción.");
    return answer === expected ? ok(result.equal ? "¡Correcto! Generan el mismo lenguaje." : "¡Correcto! No generan el mismo lenguaje.") : bad(result.equal ? "Sí son equivalentes: generan el mismo lenguaje." : "No son equivalentes: generan lenguajes distintos.");
  },

  // El usuario escribe una gramática (producciones); se compara con la de la guía y, si no es igual, por lenguaje.
  grammar(spec, answer) {
    let expected;
    try { expected = grammarOf(spec.expected); } catch (err) { return bad(err.message); }
    const parsed = parseGrammar({ productions: answer, terminals: spec.userTerminals ?? "", nonterminals: spec.userNonterminals ?? "", axiom: spec.expected.axiom ?? "" });
    if (parsed.error) return bad(parsed.error);
    const mine = parsed.grammar;
    const a = ruleSet(mine);
    const b = ruleSet(expected);
    if (a.size === b.size && [...a].every((r) => b.has(r))) return ok("¡Correcto! Coincide con la solución de la guía.");
    const cmp = compareGrammars(mine, expected, spec.maxLen ?? 7);
    if (cmp.equal) {
      const violation = formViolation(spec.form, mine);
      if (violation) return bad(`Genera el mismo lenguaje, pero ${violation}`);
      return ok("Genera el mismo lenguaje que la solución de la guía, pero las producciones no son las mismas (puede ser otra forma válida de resolverlo).", { exact: false });
    }
    const sample = cmp.onlyA[0] ?? cmp.onlyB[0];
    return bad(cmp.onlyA.length ? `Tu gramática genera ${fmtWord(cmp.onlyA[0])}, que no está en el lenguaje original.` : `Tu gramática no genera ${fmtWord(sample)}, que sí está en el lenguaje original.`);
  },

  // Expresión regular escrita por el usuario, comparada con una de referencia sobre un alfabeto.
  regex(spec, answer) {
    const mine = compileRegex(answer);
    if (mine.error) return bad(mine.error);
    const result = compareRegex(answer, spec.expected, spec.alphabet, spec.maxLen ?? 8);
    if (result.error) return bad(result.error);
    if (result.equal) return ok("¡Correcto! Reconoce las mismas cadenas que la solución (comprobado hasta longitud " + result.maxLen + ").");
    return bad(result.inFirst ? `Tu expresión acepta ${fmtWord(result.counterexample)}, que no pertenece al lenguaje.` : `Tu expresión no acepta ${fmtWord(result.counterexample)}, que sí pertenece al lenguaje.`);
  },

  // Cadenas que el usuario cree que pertenecen al lenguaje de una expresión regular.
  "regex-words"(spec, answer) {
    const compiled = compileRegex(spec.regex);
    if (compiled.error) return bad(compiled.error);
    const words = [...new Set(parseWordList(answer))];
    if (!words.length) return bad("Escribí algunas cadenas, separadas por comas.");
    const wrong = words.filter((w) => !compiled.test(w));
    if (wrong.length) return bad(`No pertenecen al lenguaje: ${showList(wrong)}.`);
    const min = spec.min ?? 1;
    return words.length >= min ? ok("¡Correcto! Todas pertenecen al lenguaje.") : bad(`Todas pertenecen, pero el ejercicio pide ${min} cadenas (escribiste ${words.length}).`);
  },
};

// Las respuestas de opción (choice) se comparan tal cual; las de texto se normalizan (lambda -> λ, >= -> ≥…).
const CHOICE_KINDS = new Set(["choice", "grammar-type", "recursion", "recursion-type", "ambiguity", "equivalent", "dfa-equivalent"]);

export function checkAnswer(spec, answer) {
  const checker = CHECKERS[spec.kind];
  if (!checker) return bad("Este ejercicio todavía no se puede comprobar automáticamente.");
  const value = CHOICE_KINDS.has(spec.kind) ? (answer ?? "") : normalizeInput(answer ?? "");
  try {
    return checker(spec, value);
  } catch (err) {
    return bad(err.message);
  }
}
