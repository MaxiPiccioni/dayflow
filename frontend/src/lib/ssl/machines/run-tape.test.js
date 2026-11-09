import { describe, expect, it } from "vitest";
import { outputOf, runTape, tapeText } from "./run-tape.js";
import { tapeFromList } from "./build.js";

// Ejercicio 6 de la Unidad 6: MT = ({0,1}, {0,1,I,P,b}, {p,q,r}, p, {r}, f, b)
const parity = tapeFromList({
  alphabet: ["0", "1"], extra: ["I", "P"], states: ["p", "q", "r"], start: "p", accepting: ["r"],
  transitions: ["p q 0/0,D", "p q 1/1,D", "q p 0/0,D", "q p 1/1,D", "p r b/P,P", "q r b/I,P"],
});

// ALA ejercicio 1.a (número par de ceros, al menos dos)
const evenZeros = tapeFromList({
  type: "ala", alphabet: ["0", "1"], states: ["q0", "q1", "q2"], start: "q0", accepting: ["q2"],
  transitions: ["q0 q0 ├/├,D", "q0 q0 1/1,D", "q0 q1 0/0,D", "q1 q1 1/1,D", "q1 q2 0/0,D", "q2 q2 1/1,D", "q2 q1 0/0,D", "q0 q0 ┤/┤,P", "q1 q1 ┤/┤,P", "q2 q2 ┤/┤,P"],
});

describe("máquina de Turing", () => {
  it("ejercicio 6: graba P en cadenas pares e I en impares", () => {
    const par = runTape(parity, "101101");
    expect(tapeText(par.finalTape)).toBe("b101101Pb");
    expect(par.accepted).toBe(true);
    expect(par.steps.map((s) => s.state)).toEqual(["p", "q", "p", "q", "p", "q", "p", "r"]);
    const impar = runTape(parity, "00110");
    expect(tapeText(impar.finalTape)).toBe("b00110Ib");
    expect(outputOf(parity, "00110").output).toBe("00110I");
    expect(outputOf(parity, "").output).toBe("P");
  });
  it("la cinta crece a la izquierda sin romperse", () => {
    const left = tapeFromList({ alphabet: ["0"], states: ["p", "q"], start: "p", accepting: ["q"], transitions: ["p p 0/0,I", "p q b/1,P"] });
    const r = runTape(left, "00");
    expect(tapeText(r.finalTape)).toBe("b100b");
    expect(r.accepted).toBe(true);
  });
  it("detecta bucles, falta de transición y el límite de pasos", () => {
    const loop = tapeFromList({ alphabet: ["0"], states: ["p"], start: "p", accepting: [], transitions: ["p p 0/0,N", "p p b/b,N"] });
    expect(runTape(loop, "0").outcome).toBe("error");
    expect(runTape(loop, "0").reason).toBe("bucle");
    const stuck = tapeFromList({ alphabet: ["0", "1"], states: ["p", "f"], start: "p", accepting: ["f"], transitions: ["p p 0/0,D", "p f b/b,P"] });
    const r = runTape(stuck, "01");
    expect(r.reason).toBe("sin transición");
    expect(r.outcome).toBe("no reconocida");
    const runaway = tapeFromList({ alphabet: ["0"], states: ["p"], start: "p", accepting: [], transitions: ["p p 0/0,D", "p p b/b,D"] });
    expect(runTape(runaway, "0", { maxSteps: 50 }).reason).toBe("límite");
  });
  it("estado de error", () => {
    const m = tapeFromList({ alphabet: ["0", "1"], states: ["p", "E", "f"], start: "p", accepting: ["f"], transitions: ["p E 1/1,P", "p f 0/0,P"] });
    expect(runTape(m, "1").outcome).toBe("error");
    expect(runTape(m, "0").outcome).toBe("reconocida");
  });
});

describe("autómata linealmente acotado", () => {
  it("ejercicio 1.a: número par de ceros", () => {
    const yes = ["00", "0110", "100", "1001", "0000"];
    const no = ["0", "0100", "000", "10"];
    for (const w of yes) expect(runTape(evenZeros, w).accepted, w).toBe(true);
    for (const w of no) expect(runTape(evenZeros, w).accepted, w).toBe(false);
    expect(tapeText(runTape(evenZeros, "1100").finalTape)).toBe("├1100┤");
  });
  it("no puede salirse de la cinta", () => {
    const out = tapeFromList({ type: "ala", alphabet: ["0"], states: ["p"], start: "p", accepting: [], transitions: ["p p ├/├,I"] });
    expect(runTape(out, "0").reason).toBe("fuera de cinta");
  });
});
