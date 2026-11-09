import { describe, expect, it } from "vitest";
import { acceptsAp, runAp } from "./run-ap.js";
import { buildAsa, buildAsd, buildGreibachAsd, isGreibach } from "./analyzers.js";
import { apFromList } from "./build.js";
import { parseGrammar } from "../grammar.js";

const grammar = (productions, extra = {}) => parseGrammar({ productions, ...extra }).grammar;
const rows = (r) => r.table.map((x) => `${x.state} ${x.rest === "" ? "-" : x.rest} ${x.stack}`);
const level = (r, k) => r.levels[k].map((id) => `${r.nodes[id].state},${r.nodes[id].rest === "" ? "λ" : r.nodes[id].rest},${r.nodes[id].stack}`).sort();
const allConfigs = (r) => new Set(r.nodes.map((n) => `${n.state},${n.rest === "" ? "λ" : n.rest},${n.stack}`));

// Ejercicio 1.a de la Unidad 5: paréntesis balanceados ( ( ) )
const balanced = apFromList({
  name: "AP", alphabet: ["(", ")"], extra: ["("], states: ["q0", "q1", "q2", "q3"], start: "q0", accepting: ["q3"],
  transitions: ["q0 q1 (,#/#(", "q1 q1 (,(/((", "q1 q2 ),(/λ", "q2 q2 ),(/λ", "q2 q3 λ,#/#"],
});

describe("AP de diseño", () => {
  it("paréntesis balanceados: tabla operativa de ((()))", () => {
    const r = runAp(balanced, "((()))");
    expect(r.accepted).toBe(true);
    expect(rows(r)).toEqual(["q0 ((())) #", "q1 (())) #(", "q1 ())) #((", "q1 ))) #(((", "q2 )) #((", "q2 ) #(", "q2 - #", "q3 - #"]);
  });
  it("rechaza lo que no está balanceado", () => {
    for (const w of ["(()", "())", ")(", "", "(()))"]) expect(runAp(balanced, w).accepted, w).toBe(false);
    expect(acceptsAp(balanced, "(())").accepted).toBe(true);
    expect(acceptsAp(balanced, "(()").accepted).toBe(false);
  });
  it("la condición de aceptación se puede cambiar", () => {
    const byState = { ...balanced, acceptBy: "state" };
    expect(runAp(byState, "()").accepted).toBe(true);
    expect(runAp({ ...balanced, acceptBy: "empty", accepting: [] }, "()").accepted).toBe(true);
  });
  it("los ciclos λ y las pilas enormes no cuelgan el ejecutor", () => {
    const loop = apFromList({ alphabet: ["a"], states: ["p"], start: "p", accepting: [], transitions: ["p p λ,#/#a", "p p λ,a/aa"] });
    const r = runAp(loop, "", { maxStack: 20 });
    expect(r.accepted).toBe(false);
    expect(r.truncated).toBe(true);
    expect(acceptsAp(loop, "").truncated).toBe(true);
  });
});

describe("analizadores sintácticos (ejercicio 13 de la guía)", () => {
  const g13 = grammar("S := 0B, B := 1B, B := 1");

  it("ASD: tabla operativa 5.21 de 0111", () => {
    const asd = buildAsd(g13);
    const r = runAp(asd, "0111");
    expect(r.accepted).toBe(true);
    expect(rows(r)).toEqual(["t 0111 #", "p 0111 #S", "p 0111 #B0", "p 111 #B", "p 111 #B1", "p 11 #B", "p 11 #B1", "p 1 #B", "p 1 #1", "p - #", "r - #"]);
  });
  it("ASD: árbol 5.35, cada configuración de la figura está en el árbol", () => {
    const r = runAp(buildAsd(g13), "0111", { maxNodes: 4000 });
    const tree = allConfigs(r);
    const figure = ["t,0111,#", "p,0111,#S", "p,0111,#B0", "p,111,#B", "p,111,#1", "p,111,#B1", "p,11,#", "p,11,#B", "p,11,#1", "p,11,#B1", "p,1,#", "p,1,#B", "p,1,#1", "p,1,#B1", "p,λ,#", "p,λ,#B", "r,λ,#", "p,λ,#1", "p,λ,#B1"];
    // En el árbol sin podar hay más ramas que en la figura; ninguna configuración de la figura puede faltar.
    for (const c of figure) expect(tree.has(c), c).toBe(true);
    expect(level(r, 3)).toEqual(["p,111,#B"]);
    expect(level(r, 4)).toEqual(["p,111,#1", "p,111,#B1"]);
  });
  it("ASA: tabla operativa 5.22 de 0111", () => {
    const r = runAp(buildAsa(g13), "0111");
    expect(r.accepted).toBe(true);
    expect(rows(r)).toEqual(["t 0111 #", "t 111 #0", "t 11 #01", "t 1 #011", "t - #0111", "t - #011B", "t - #01B", "t - #0B", "t - #S", "t - #", "p - #"]);
  });
  it("ASA: árbol 5.37, cada configuración de la figura está en el árbol", () => {
    const r = runAp(buildAsa(g13), "0111", { maxNodes: 4000 });
    const tree = allConfigs(r);
    const figure = ["t,0111,#", "t,111,#0", "t,11,#01", "t,1,#011", "t,11,#0B", "t,λ,#0111", "t,1,#01B", "t,11,#S", "t,1,#0B1", "t,λ,#011B", "t,1,#0B", "t,λ,#01B1", "t,1,#0BB", "t,λ,#01B", "t,1,#S", "t,λ,#0B1", "t,λ,#01BB", "t,λ,#0BB1", "t,λ,#0B", "t,λ,#S1", "t,λ,#0BB", "t,λ,#S", "t,λ,#", "p,λ,#"];
    for (const c of figure) expect(tree.has(c), c).toBe(true);
  });
});

describe("analizadores sintácticos (ejercicio 14 de la guía)", () => {
  const g14 = grammar("S := AaB, A := bB, A := aa, B := bC, B := b, C := b");
  it("ASD: tabla 5.23 y árbol 5.39 de aaabb", () => {
    const r = runAp(buildAsd(g14), "aaabb");
    expect(rows(r)).toEqual(["t aaabb #", "p aaabb #S", "p aaabb #BaA", "p aaabb #Baaa", "p aabb #Baa", "p abb #Ba", "p bb #B", "p bb #Cb", "p b #C", "p b #b", "p - #", "r - #"]);
    const full = runAp(buildAsd(g14), "aaabb", { maxNodes: 4000 });
    expect(level(full, 3)).toEqual(["p,aaabb,#BaBb", "p,aaabb,#Baaa"]);
    for (const c of ["p,bb,#Cb", "p,bb,#b", "p,b,#C", "p,b,#", "p,b,#b", "p,λ,#", "r,λ,#"]) expect(allConfigs(full).has(c), c).toBe(true);
  });
  it("ASA: tabla 5.24 de aaabb", () => {
    const r = runAp(buildAsa(g14), "aaabb");
    expect(rows(r)).toEqual(["t aaabb #", "t aabb #a", "t abb #aa", "t abb #A", "t bb #Aa", "t b #Aab", "t - #Aabb", "t - #AabC", "t - #AaB", "t - #S", "t - #", "p - #"]);
  });
});

describe("ejercicios 8 y 10 de la Unidad 5", () => {
  it("ASD y ASA de G1 reconocen cabcbac", () => {
    const g1 = grammar("S := cMc, M := aMa | bNb | c, N := a | b | c");
    const asd = runAp(buildAsd(g1, { names: { start: "p", work: "q", accept: "r" } }), "cabcbac");
    expect(asd.accepted).toBe(true);
    expect(rows(asd)).toEqual(["p cabcbac #", "q cabcbac #S", "q cabcbac #cMc", "q abcbac #cM", "q abcbac #caMa", "q bcbac #caM", "q bcbac #cabNb", "q cbac #cabN", "q cbac #cabc", "q bac #cab", "q ac #ca", "q c #c", "q - #", "r - #"]);
    const asa = runAp(buildAsa(g1, { names: { start: "p", accept: "q" } }), "cabcbac");
    expect(asa.accepted).toBe(true);
    expect(rows(asa).at(-1)).toBe("q - #");
    expect(acceptsAp(buildAsa(g1), "cabcbab").accepted).toBe(false);
  });
  it("G2 con bbaaaa: tabla operativa del ASD y reducciones del ASA", () => {
    const g2 = grammar("S := bAaB, A := bBa | b, B := Ab | a");
    const asd = runAp(buildAsd(g2), "bbaaaa");
    expect(rows(asd)).toEqual(["t bbaaaa #", "p bbaaaa #S", "p bbaaaa #BaAb", "p baaaa #BaA", "p baaaa #BaaBb", "p aaaa #BaaB", "p aaaa #Baaa", "p aaa #Baa", "p aa #Ba", "p a #B", "p a #a", "p - #", "r - #"]);
    const asa = runAp(buildAsa(g2), "bbaaaa");
    expect(asa.accepted).toBe(true);
    expect(rows(asa)).toEqual(["t bbaaaa #", "t baaaa #b", "t aaaa #bb", "t aaa #bba", "t aaa #bbB", "t aa #bbBa", "t aa #bA", "t a #bAa", "t - #bAaa", "t - #bAaB", "t - #S", "t - #", "p - #"]);
  });
});

describe("ASD para gramáticas en Forma Normal de Greibach", () => {
  it("construye y acepta", () => {
    const g = grammar("S := aSB | b, B := b");
    expect(isGreibach(g)).toBe(true);
    const ap = buildGreibachAsd(g);
    for (const w of ["b", "abb", "aabbb"]) expect(acceptsAp(ap, w).accepted, w).toBe(true);
    for (const w of ["", "ab", "abbb", "aab"]) expect(acceptsAp(ap, w).accepted, w).toBe(false);
    expect(() => buildGreibachAsd(grammar("S := AB, A := a, B := b"))).toThrow(/Greibach/);
  });
});
