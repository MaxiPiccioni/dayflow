import { createMachine, addState, addTransition, setInitial, toggleAccepting, autoLayout } from "./model.js";

// Autómatas con pila asociados a una gramática independiente del contexto (analizadores sintácticos),
// construidos como en la guía (págs. 127 a 140).
//
// ASD (descendente, Top-Down): AP = (ΣT, ΣT ∪ ΣN ∪ {#}, {t, p, r}, t, #, {r}, f)
//    λ,#/ #S            de t a p   (se carga el axioma)
//    λ,A/ α             en p, por cada regla A := α (α se apila de forma refleja)
//    a,a/ λ             en p, por cada terminal a
//    λ,#/ #             de p a r   (pila vacía: se acepta)
// ASA (ascendente, Bottom-Up): AP = (ΣT, ΣT ∪ ΣN ∪ {#}, {t, p}, t, #, {p}, f)
//    a,λ/ a             en t, por cada terminal a (se lee y se apila)
//    λ,α/ A             en t, por cada regla A := α (reducción: se desapila α y se apila A)
//    λ,S/ λ             en t (se desapila el axioma)
//    λ,#/ #             de t a p   (pila vacía: se acepta)
// ASD para gramáticas en Forma Normal de Greibach (A := aη): un solo estado operativo que lee el terminal
//    a,A/ η             en p, por cada regla A := aη (η se apila de forma refleja)

function must(result) {
  if (result.error) throw new Error(result.error);
  return result.machine;
}

const rulesOf = (g) => g.productions.map((p) => ({ lhs: p.lhs, rhs: p.rhs }));

function base(g, name, states) {
  let m = createMachine("ap", { name, alphabet: [...g.terminals], extra: [...g.nonterminals], pushMode: "production", acceptBy: "both" });
  for (const id of states) m = must(addState(m, { id }));
  return m;
}

export function buildAsd(g, { names = { start: "t", work: "p", accept: "r" }, name = "ASD" } = {}) {
  const { start, work, accept } = names;
  let m = base(g, name, [start, work, accept]);
  m = must(addTransition(m, { from: start, to: work, read: "", pop: "#", push: `#${g.axiom}` }));
  for (const r of rulesOf(g)) m = must(addTransition(m, { from: work, to: work, read: "", pop: r.lhs, push: r.rhs }));
  for (const a of g.terminals) m = must(addTransition(m, { from: work, to: work, read: a, pop: a, push: "" }));
  m = must(addTransition(m, { from: work, to: accept, read: "", pop: "#", push: "#" }));
  m = must(setInitial(m, start));
  m = must(toggleAccepting(m, accept));
  return autoLayout({ ...m, states: m.states.map((s, i) => ({ ...s, x: 90 + i * 170, y: 110 })) });
}

export function buildAsa(g, { names = { start: "t", accept: "p" }, name = "ASA" } = {}) {
  const { start, accept } = names;
  let m = base(g, name, [start, accept]);
  m = { ...m, pushMode: "natural" };
  for (const a of g.terminals) m = must(addTransition(m, { from: start, to: start, read: a, pop: "", push: a }));
  for (const r of rulesOf(g)) m = must(addTransition(m, { from: start, to: start, read: "", pop: r.rhs, push: r.lhs }));
  m = must(addTransition(m, { from: start, to: start, read: "", pop: g.axiom, push: "" }));
  m = must(addTransition(m, { from: start, to: accept, read: "", pop: "#", push: "#" }));
  m = must(setInitial(m, start));
  m = must(toggleAccepting(m, accept));
  return { ...m, states: m.states.map((s, i) => ({ ...s, x: 120 + i * 220, y: 110 })) };
}

// ¿Está la gramática en FNG (A := aη con η de no terminales)? Si hay λ, no.
export function isGreibach(g) {
  return g.productions.every(({ rhs }) => {
    const r = Array.from(rhs);
    return r.length > 0 && g.terminals.includes(r[0]) && r.slice(1).every((s) => g.nonterminals.includes(s));
  });
}

export function buildGreibachAsd(g, { names = { start: "t", work: "p", accept: "r" }, name = "ASD (Greibach)" } = {}) {
  if (!isGreibach(g)) throw new Error("La gramática no está en Forma Normal de Greibach (A := aη).");
  const { start, work, accept } = names;
  let m = base(g, name, [start, work, accept]);
  m = must(addTransition(m, { from: start, to: work, read: "", pop: "#", push: `#${g.axiom}` }));
  for (const r of rulesOf(g)) {
    const [a, ...eta] = Array.from(r.rhs);
    m = must(addTransition(m, { from: work, to: work, read: a, pop: r.lhs, push: eta.join("") }));
  }
  m = must(addTransition(m, { from: work, to: accept, read: "", pop: "#", push: "#" }));
  m = must(setInitial(m, start));
  m = must(toggleAccepting(m, accept));
  return { ...m, states: m.states.map((s, i) => ({ ...s, x: 90 + i * 170, y: 110 })) };
}
