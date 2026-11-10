import { describe, expect, it } from "vitest";
import { evalScene, fmtVal } from "./engine.js";

const run = (cmds) => Object.fromEntries(evalScene(cmds).map((o) => [o.name, o.err ? "ERR: " + o.err : fmtVal(o.v).main]));

describe("sistemas de ecuaciones lineales", () => {
  it("clasifica con Rouché-Frobenius", () => {
    expect(run(["A=[1,1;1,-1]", "B=[2;0]", "t=Clasificar(A,B)"]).t).toBe("Compatible determinado");
    expect(run(["A=[1,1;2,2]", "B=[1;2]", "t=Clasificar(A,B)"]).t).toBe("Compatible indeterminado");
    expect(run(["A=[1,1;2,2]", "B=[1;3]", "t=Clasificar(A,B)"]).t).toBe("Incompatible");
  });
  it("resuelve con la matriz ampliada de un solo argumento", () => {
    expect(run(["M=[1,0,0,4;0,1,0,3;0,0,1,2]", "X=Resolver(M)"]).X).toBe("[4; 3; 2]");
  });
  it("Cramer coincide con Gauss-Jordan y rechaza |A| = 0", () => {
    const r = run(["A=[2,1;1,5]", "B=[3;6]", "X=Cramer(A,B)", "Y=Resolver(A,B)"]);
    expect(r.X).toBe(r.Y);
    expect(run(["A=[2,1;4,2]", "B=[3;5]", "X=Cramer(A,B)"]).X).toContain("ERR");
  });
  it("la solución general verifica el sistema", () => {
    const r = run(["A=[1,2,-2;2,-5,4;-1,16,-14]", "B=[3;6;-3]", "p=Particular(A,B)", "N=Nucleo(A)", "c1=A*p", "c2=A*N"]);
    expect(r.c1).toBe("[3; 6; -3]");
    expect(r.c2).toBe("[0; 0; 0]");
  });
  it("Balancear devuelve coeficientes enteros mínimos", () => {
    expect(run(["A=[3,0,-1,0;8,0,0,-2;0,2,-2,-1]", "x=Balancear(A)"]).x).toBe("[1; 5; 3; 4]");
  });
  it("Resolver explica la incompatibilidad", () => {
    expect(run(["A=[1,1;1,1]", "B=[1;2]", "X=Resolver(A,B)"]).X).toMatch(/^Incompatible/);
  });
});
