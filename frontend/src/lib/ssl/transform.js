import { LAMBDA } from "./notation.js";
import { formatProductions, formatRule, groupRules, showForm } from "./grammar.js";

// Transformaciones de gramáticas. Cada una devuelve { grammar, steps, ... } con steps = [{ title, lines }]
// para mostrar el procedimiento paso a paso. Las gramáticas no se modifican: se devuelven copias.

const chars = (text) => Array.from(text);
const unique = (list) => [...new Set(list)];
const ruleKey = (r) => `${r.lhs}\u0000${r.rhs}`;
const dedupe = (rules) => { const seen = new Set(); return rules.filter((r) => { const k = ruleKey(r); if (seen.has(k)) return false; seen.add(k); return true; }); };
const copy = (g, productions) => ({ terminals: [...g.terminals], nonterminals: [...g.nonterminals], axiom: g.axiom, productions: dedupe(productions) });
const prodText = (rules) => formatProductions(rules).split("\n");
const NAMES = "XYZWVUTRQPONMLKJIHGFEDCBA";

// Generador de símbolos nuevos (X, Y, Z, W, V…) que no choquen con los existentes, como en la guía.
function makeNamer(g, extra = []) {
  const taken = new Set([...g.terminals, ...g.nonterminals, ...extra]);
  return () => {
    const name = chars(NAMES).find((n) => !taken.has(n));
    if (!name) throw new Error("Se acabaron las letras disponibles para símbolos nuevos.");
    taken.add(name);
    return name;
  };
}

const isNt = (g, s) => g.nonterminals.includes(s);

// ---------- Gramática limpia ----------

export function cleanGrammar(g) {
  const steps = [];
  const unnecessary = g.productions.filter((r) => r.rhs === r.lhs && g.nonterminals.includes(r.lhs));
  let rules = g.productions.filter((r) => !unnecessary.includes(r));
  steps.push({
    title: "1. Reglas innecesarias",
    lines: unnecessary.length ? [`Son las que tienen el mismo no terminal a ambos lados: ${unnecessary.map(formatRule).join(", ")}. Se eliminan.`] : ["No hay reglas del tipo A := A."],
  });

  // Símbolos superfluos: no terminales que no llegan a derivar una cadena de terminales (o λ).
  const productive = new Set();
  const rounds = [];
  for (let changed = true; changed;) {
    changed = false;
    const added = [];
    for (const { lhs, rhs } of rules) {
      if (productive.has(lhs)) continue;
      if (chars(rhs).every((s) => !isNt(g, s) || productive.has(s))) { productive.add(lhs); added.push(lhs); changed = true; }
    }
    if (added.length) rounds.push(added);
  }
  const superfluous = g.nonterminals.filter((n) => !productive.has(n));
  steps.push({
    title: "2. Símbolos superfluos (los que no derivan una cadena de terminales)",
    lines: [
      ...rounds.map((added, i) => `Paso ${i + 1}: derivan cadenas de terminales ${added.join(", ")}.`),
      superfluous.length ? `Superfluos: ${superfluous.join(", ")}. Se eliminan junto con las producciones que los contienen.` : "No hay símbolos superfluos.",
    ],
  });
  if (!productive.has(g.axiom)) {
    return { grammar: null, empty: true, unnecessary, superfluous, inaccessibleNonterminals: [], inaccessibleTerminals: [], steps: [...steps, { title: "Resultado", lines: [`El axioma ${g.axiom} es superfluo: la gramática no genera ninguna cadena (L(G) = ∅).`] }] };
  }
  rules = rules.filter((r) => ![r.lhs, ...chars(r.rhs)].some((s) => superfluous.includes(s)));

  // Símbolos inaccesibles: no terminales a los que no se llega desde el axioma.
  const reachable = new Set([g.axiom]);
  for (let changed = true; changed;) {
    changed = false;
    for (const { lhs, rhs } of rules) {
      if (!reachable.has(lhs)) continue;
      for (const s of chars(rhs)) if (isNt(g, s) && !reachable.has(s)) { reachable.add(s); changed = true; }
    }
  }
  const inaccessibleNonterminals = g.nonterminals.filter((n) => !reachable.has(n) && !superfluous.includes(n));
  rules = rules.filter((r) => reachable.has(r.lhs));
  steps.push({
    title: "3. Símbolos inaccesibles (a los que no se llega desde el axioma)",
    lines: [
      `Se llega desde ${g.axiom} a: ${[...reachable].join(", ")}.`,
      inaccessibleNonterminals.length ? `No terminales inaccesibles: ${inaccessibleNonterminals.join(", ")}. Se eliminan con sus producciones.` : "No hay no terminales inaccesibles.",
    ],
  });

  const usedTerminals = new Set(rules.flatMap((r) => chars(r.rhs)).filter((s) => g.terminals.includes(s)));
  const inaccessibleTerminals = g.terminals.filter((t) => !usedTerminals.has(t));
  steps.push({
    title: "4. Terminales inaccesibles (están en ΣT pero ninguna producción los usa)",
    lines: [inaccessibleTerminals.length ? `Terminales inaccesibles: ${inaccessibleTerminals.join(", ")}.` : "Todos los terminales se usan."],
  });

  const grammar = {
    terminals: g.terminals.filter((t) => usedTerminals.has(t)),
    nonterminals: g.nonterminals.filter((n) => reachable.has(n) && productive.has(n)),
    axiom: g.axiom,
    productions: dedupe(rules),
  };
  steps.push({ title: "Gramática limpia", lines: prodText(grammar.productions) });
  return { grammar, unnecessary, superfluous, inaccessibleNonterminals, inaccessibleTerminals, steps };
}

// ---------- Gramática bien formada ----------

// Quita las reglas no generativas (A := λ) y las de redenominación (A := B). Si la gramática no está limpia, la limpia antes.
export function wellFormed(input) {
  const steps = [];
  const warnings = [];
  let g = input;
  const cleaned = cleanGrammar(g);
  const alreadyClean = cleaned.grammar && !cleaned.unnecessary.length && !cleaned.superfluous.length && !cleaned.inaccessibleNonterminals.length && !cleaned.inaccessibleTerminals.length;
  if (cleaned.empty) return { grammar: null, empty: true, steps: cleaned.steps, warnings };
  if (!alreadyClean) {
    steps.push({ title: "Primero hay que limpiar la gramática", lines: ["Se aplica el procedimiento de gramática limpia (reglas innecesarias, símbolos superfluos e inaccesibles)."] });
    steps.push(...cleaned.steps.slice(0, -1));
    g = cleaned.grammar;
    steps.push({ title: "Gramática limpia de partida", lines: prodText(g.productions) });
  } else {
    steps.push({ title: "La gramática ya está limpia", lines: [] });
  }

  // Reglas no generativas: se agregan las variantes que omiten los no terminales anulables.
  const nullable = new Set();
  for (let changed = true; changed;) {
    changed = false;
    for (const { lhs, rhs } of g.productions) {
      if (nullable.has(lhs)) continue;
      if (chars(rhs).every((s) => nullable.has(s))) { nullable.add(lhs); changed = true; }
    }
  }
  const nonGenerative = g.productions.filter((r) => r.rhs === "");
  const noLambda = [];
  for (const rule of g.productions) {
    if (rule.rhs === "") continue;
    const symbols = chars(rule.rhs);
    const slots = symbols.map((s, i) => (nullable.has(s) ? i : -1)).filter((i) => i >= 0).slice(0, 12);
    for (let mask = 0; mask < 1 << slots.length; mask++) {
      const omit = new Set(slots.filter((_, bit) => mask & (1 << bit)));
      const variant = symbols.filter((_, i) => !omit.has(i)).join("");
      if (variant === "" || variant === rule.lhs) continue; // λ no se agrega y A := A es innecesaria
      noLambda.push({ lhs: rule.lhs, rhs: variant });
    }
  }
  const axiomNullable = nullable.has(g.axiom);
  let rules = dedupe([...noLambda, ...(axiomNullable ? [{ lhs: g.axiom, rhs: "" }] : [])]);
  steps.push({
    title: "Reglas no generativas (A := λ)",
    lines: nonGenerative.length || nullable.size
      ? [
          `Anulables (derivan λ): ${[...nullable].join(", ") || "ninguno"}.`,
          "Para cada producción que usa un anulable, se agregan las variantes que lo omiten (sin generar reglas A := A ni A := λ nuevas).",
          ...(axiomNullable ? [`Se conserva ${g.axiom} := λ porque el axioma es anulable.`] : []),
          ...prodText(rules),
        ]
      : ["No hay reglas no generativas."],
  });
  if (axiomNullable && g.productions.some((r) => chars(r.rhs).includes(g.axiom))) {
    warnings.push(`El axioma ${g.axiom} aparece en una parte derecha y es anulable: con λ ∈ L(G) lo habitual es agregar un axioma nuevo. La guía conserva ${g.axiom} := λ como está acá.`);
  }

  // Reglas de redenominación (A := B): se reemplazan por las producciones de B.
  const isUnit = (r) => chars(r.rhs).length === 1 && isNt(g, r.rhs) && r.rhs !== r.lhs;
  const unitRules = rules.filter(isUnit);
  const closure = new Map(g.nonterminals.map((n) => [n, new Set([n])]));
  for (let changed = true; changed;) {
    changed = false;
    for (const u of unitRules) {
      for (const [, set] of closure) {
        if (set.has(u.lhs) && !set.has(u.rhs)) { set.add(u.rhs); changed = true; }
      }
    }
  }
  const nonUnit = rules.filter((r) => !isUnit(r));
  const finalRules = [];
  for (const A of g.nonterminals) {
    for (const B of closure.get(A)) {
      for (const r of nonUnit.filter((x) => x.lhs === B)) finalRules.push({ lhs: A, rhs: r.rhs });
    }
  }
  // Se mantiene el orden por no terminal de la gramática original.
  const grammar = copy(g, finalRules.filter((r) => !(r.lhs !== g.axiom && r.rhs === "")));
  steps.push({
    title: "Reglas de redenominación (A := B)",
    lines: unitRules.length
      ? [`Reglas de redenominación: ${unitRules.map(formatRule).join(", ")}.`, "Cada una se reemplaza por las producciones del no terminal de la derecha.", ...prodText(grammar.productions)]
      : ["No hay reglas de redenominación."],
  });

  // Después de reemplazar, puede quedar algo inaccesible o innecesario: se limpia de nuevo.
  const again = cleanGrammar(grammar);
  let result = grammar;
  if (again.grammar && (again.unnecessary.length || again.inaccessibleNonterminals.length || again.superfluous.length)) {
    result = again.grammar;
    steps.push({ title: "Limpieza final", lines: ["Quedaron símbolos o reglas que ya no sirven; se vuelve a limpiar.", ...prodText(result.productions)] });
  }
  steps.push({ title: "Gramática bien formada", lines: prodText(result.productions) });
  return { grammar: result, steps, warnings, nullable: [...nullable], unitRules: unitRules.map(formatRule) };
}

// ---------- Eliminación de recursividad por izquierda (en un paso) ----------

export function eliminateLeftRecursion(g) {
  const steps = [];
  const warnings = [];
  const namer = makeNamer(g);
  const groups = groupRules(g.productions);
  const newNonterminals = [];
  const productions = [];
  let changedAny = false;
  for (const [lhs, rhss] of groups) {
    const recursive = rhss.filter((rhs) => rhs !== lhs && chars(rhs)[0] === lhs);
    if (!recursive.length) { rhss.forEach((rhs) => productions.push({ lhs, rhs })); continue; }
    changedAny = true;
    const alphas = recursive.map((rhs) => rhs.slice(lhs.length));
    const betas = rhss.filter((rhs) => !recursive.includes(rhs) && rhs !== lhs);
    if (!betas.length) {
      warnings.push(`${lhs} solo tiene reglas recursivas por izquierda: no deriva ninguna cadena (es un símbolo superfluo).`);
      rhss.forEach((rhs) => productions.push({ lhs, rhs }));
      continue;
    }
    const X = namer();
    newNonterminals.push(X);
    betas.forEach((b) => productions.push({ lhs, rhs: b === "" ? X : b + X }));
    betas.forEach((b) => productions.push({ lhs, rhs: b }));
    alphas.forEach((a) => productions.push({ lhs: X, rhs: a + X }));
    alphas.forEach((a) => productions.push({ lhs: X, rhs: a }));
    steps.push({
      title: `Regla recursiva por izquierda de ${lhs}`,
      lines: [
        `${lhs} := ${recursive.map(showForm).join(" | ")} tiene la forma A := Aα₁ | … | β₁ | …`,
        `α = ${alphas.map(showForm).join(", ")}   ·   β = ${betas.map(showForm).join(", ")}`,
        "Se agrega un no terminal nuevo " + X + ":",
        `${lhs} := ${[...betas.map((b) => b + X), ...betas].map(showForm).join(" | ")}`,
        `${X} := ${[...alphas.map((a) => a + X), ...alphas].map(showForm).join(" | ")}`,
      ],
    });
  }
  if (!changedAny) steps.push({ title: "Recursividad por izquierda", lines: ["No hay producciones recursivas por izquierda en un paso: no hay nada que transformar."] });
  const grammar = { terminals: [...g.terminals], nonterminals: [...g.nonterminals, ...newNonterminals], axiom: g.axiom, productions: dedupe(productions) };
  if (hasIndirectLeftRecursion(grammar)) warnings.push("Hay recursividad por izquierda en más de un paso: este procedimiento solo elimina la que ocurre en un paso.");
  steps.push({ title: "Gramática sin recursividad por izquierda", lines: prodText(grammar.productions) });
  return { grammar, steps, warnings, newNonterminals };
}

// A =>+ Aα pasando por otros no terminales (primer símbolo de la parte derecha).
export function hasIndirectLeftRecursion(g) {
  const first = new Map(g.nonterminals.map((n) => [n, new Set()]));
  for (const { lhs, rhs } of g.productions) {
    const s = chars(rhs)[0];
    if (s && isNt(g, s)) first.get(lhs).add(s);
  }
  for (const start of g.nonterminals) {
    const seen = new Set();
    const stack = [...first.get(start)].filter((s) => s !== start);
    while (stack.length) {
      const cur = stack.pop();
      if (cur === start) return true;
      if (seen.has(cur)) continue;
      seen.add(cur);
      first.get(cur).forEach((s) => stack.push(s));
    }
    if ([...seen].some((s) => first.get(s).has(start))) return true;
  }
  return false;
}

// ---------- Formas normales ----------

export function isFNC(g) {
  return g.productions.every(({ lhs, rhs }) => {
    const r = chars(rhs);
    if (r.length === 0) return lhs === g.axiom;
    if (r.length === 1) return g.terminals.includes(r[0]);
    return r.length === 2 && r.every((s) => isNt(g, s));
  });
}

export function isFNG(g) {
  return g.productions.every(({ lhs, rhs }) => {
    const r = chars(rhs);
    if (r.length === 0) return lhs === g.axiom;
    return g.terminals.includes(r[0]) && r.slice(1).every((s) => isNt(g, s));
  });
}

// Prepara la gramática: limpia y bien formada, con los pasos que hicieron falta.
function prepare(g) {
  const wf = wellFormed(g);
  return wf;
}

// Forma Normal de Chomsky: A := BC | a | λ (λ solo en el axioma). Binariza de derecha a izquierda, como los ejercicios 14 y 15.
export function toChomsky(input) {
  const prep = prepare(input);
  if (prep.empty) return { grammar: null, empty: true, steps: prep.steps };
  const steps = [{ title: "Gramática de partida (limpia y bien formada)", lines: prodText(prep.grammar.productions) }];
  if (prep.steps.length > 2 || prep.grammar.productions.length !== input.productions.length) steps.unshift(...prep.steps.map((s) => ({ ...s, title: `Previo · ${s.title}` })));
  const g = prep.grammar;
  const namer = makeNamer(g);
  const terminalNt = new Map(); // terminal -> no terminal nuevo
  const helperNt = new Map(); // secuencia de no terminales -> no terminal auxiliar
  const helperRules = [];
  const newNonterminals = [];
  const productions = [];
  const lines = [];
  const nameTerminal = (t) => {
    if (!terminalNt.has(t)) { const name = namer(); terminalNt.set(t, name); newNonterminals.push(name); }
    return terminalNt.get(t);
  };
  // Parte derecha de dos símbolos para una secuencia de 2 o más no terminales: A := s1 H, H := s2 H2, …
  const chain = (seq) => {
    if (seq.length === 2) return seq.join("");
    const rest = seq.slice(1);
    const key = rest.join("");
    if (!helperNt.has(key)) {
      const name = namer();
      helperNt.set(key, name);
      newNonterminals.push(name);
      const index = helperRules.push(null) - 1;
      helperRules[index] = { lhs: name, rhs: chain(rest) };
    }
    return seq[0] + helperNt.get(key);
  };
  for (const rule of g.productions) {
    const symbols = chars(rule.rhs);
    if (symbols.length <= 1) { productions.push(rule); lines.push(`${formatRule(rule)} ya está en FNC.`); continue; }
    const replaced = symbols.map((s) => (g.terminals.includes(s) ? nameTerminal(s) : s));
    const converted = { lhs: rule.lhs, rhs: chain(replaced) };
    productions.push(converted);
    lines.push(`${formatRule(rule)} no está en FNC → ${formatRule(converted)}.`);
  }
  const terminalRules = [...terminalNt].map(([t, name]) => ({ lhs: name, rhs: t }));
  const grammar = {
    terminals: [...g.terminals],
    nonterminals: [...g.nonterminals, ...newNonterminals],
    axiom: g.axiom,
    productions: dedupe([...productions, ...terminalRules, ...helperRules]),
  };
  steps.push({ title: "Se revisa producción por producción", lines });
  steps.push({
    title: "Símbolos nuevos",
    lines: [
      ...[...terminalNt].map(([t, name]) => `${name} := ${t}  (reemplaza al terminal ${t} dentro de partes derechas largas)`),
      ...helperRules.map((r) => `${formatRule(r)}  (agrupa el resto de una parte derecha de más de dos símbolos)`),
    ],
  });
  steps.push({ title: "Gramática en Forma Normal de Chomsky", lines: prodText(grammar.productions) });
  return { grammar, steps, newNonterminals, valid: isFNC(grammar), warnings: prep.warnings };
}

// Forma Normal de Greibach: A := aη con η ∈ ΣN*. Hace falta una gramática bien formada y sin recursividad por izquierda.
export function toGreibach(input) {
  const prep = prepare(input);
  if (prep.empty) return { grammar: null, empty: true, steps: prep.steps };
  const steps = [];
  if (prep.steps.length > 2 || prep.grammar.productions.length !== input.productions.length) steps.push(...prep.steps.map((s) => ({ ...s, title: `Previo · ${s.title}` })));
  let g = prep.grammar;
  const warnings = [...(prep.warnings ?? [])];
  const lr = eliminateLeftRecursion(g);
  if (lr.newNonterminals.length) {
    steps.push({ title: "Se elimina la recursividad por izquierda", lines: lr.steps.flatMap((s) => [s.title, ...s.lines]) });
    g = lr.grammar;
  }
  if (hasIndirectLeftRecursion(g)) return { grammar: null, error: "La gramática tiene recursividad por izquierda en más de un paso: este procedimiento no la elimina.", steps, warnings };

  const namer = makeNamer(g);
  const byLhs = () => groupRules(g.productions);
  const terminalNt = new Map();
  const lines = [];
  const out = [];
  const newNonterminals = [...lr.newNonterminals];
  for (const rule of g.productions) {
    if (rule.rhs === "") { out.push(rule); continue; }
    // 1) Sustituir el no terminal inicial por sus partes derechas hasta que empiece con un terminal.
    let pending = [rule.rhs];
    const finished = [];
    const notes = [];
    for (let guard = 0; pending.length && guard < 200; guard++) {
      const rhs = pending.shift();
      const head = chars(rhs)[0];
      if (g.terminals.includes(head)) { finished.push(rhs); continue; }
      const alternatives = byLhs().get(head) ?? [];
      notes.push(`${head} se reemplaza por ${alternatives.map(showForm).join(" | ")}`);
      pending = [...alternatives.map((alt) => alt + rhs.slice(head.length)), ...pending]; // en profundidad, como en la guía
    }
    if (pending.length) return { grammar: null, error: "No se pudo llegar a la Forma Normal de Greibach (sustituciones sin fin).", steps, warnings };
    // 2) Los terminales que no están al principio se reemplazan por no terminales nuevos.
    const converted = finished.map((rhs) => {
      const [first, ...rest] = chars(rhs);
      return first + rest.map((s) => {
        if (!g.terminals.includes(s)) return s;
        if (!terminalNt.has(s)) { const name = namer(); terminalNt.set(s, name); newNonterminals.push(name); }
        return terminalNt.get(s);
      }).join("");
    });
    const same = converted.length === 1 && converted[0] === rule.rhs;
    lines.push(same ? `${formatRule(rule)} ya está en FNG.` : `${formatRule(rule)}${notes.length ? ` (${notes.join("; ")})` : ""} → ${converted.map((c) => `${rule.lhs} := ${c}`).join(", ")}.`);
    converted.forEach((c) => out.push({ lhs: rule.lhs, rhs: c }));
  }
  const terminalRules = [...terminalNt].map(([t, name]) => ({ lhs: name, rhs: t }));
  const grammar = { terminals: [...g.terminals], nonterminals: [...g.nonterminals.filter((n) => !newNonterminals.includes(n)), ...newNonterminals], axiom: g.axiom, productions: dedupe([...out, ...terminalRules]) };
  steps.push({ title: "Se revisa producción por producción", lines });
  if (terminalNt.size) steps.push({ title: "Símbolos nuevos", lines: [...terminalNt].map(([t, name]) => `${name} := ${t}`) });
  steps.push({ title: "Gramática en Forma Normal de Greibach", lines: prodText(grammar.productions) });
  return { grammar, steps, warnings, valid: isFNG(grammar), newNonterminals };
}

export { LAMBDA };
