import { describe, expect, it } from "vitest";
import { evalScene, fmtVal } from "./engine.js";

const run = (cmds) => Object.fromEntries(evalScene(cmds).map((o) => [o.name, o.err ? "ERR: " + o.err : fmtVal(o.v).main]));

describe("espacios vectoriales", () => {
  it("Genera e Indep usan los vectores como columnas", () => {
    expect(run(["A=[1,0;0,1;0,0]", "g=Genera(A)", "i=Indep(A)"])).toMatchObject({ g: expect.stringContaining("No genera"), i: "Linealmente independientes" });
    expect(run(["A=[1,2;2,4]", "i=Indep(A)"]).i).toContain("dependientes");
    expect(run(["A=Identidad(3)", "g=Genera(A)"]).g).toBe("Genera ℝ³");
  });
  it("Base exige n vectores independientes", () => {
    expect(run(["A=[1,2;3,4]", "b=Base(A)"]).b).toContain("Es base");
    expect(run(["A=[1,2;2,4]", "b=Base(A)"]).b).toContain("No es base");
  });
  it("Dimension del espacio de soluciones es n − rango", () => {
    expect(run(["A=[1,-4,3,-1;2,-8,6,-2]", "d=Dimension(A)"]).d).toBe("3");
    expect(run(["A=[2,1,3;1,0,5;0,1,1]", "d=Dimension(A)"]).d).toBe("0");
  });
  it("Caracterizar da la condición de compatibilidad", () => {
    expect(run(["A=[1,2;1,1;1,3]", "c=Caracterizar(A)"]).c).toBe("2y₁ − y₂ − y₃ = 0");
  });
  it("la matriz de cambio de base lleva coordenadas de B a B′", () => {
    const r = run(["Bm=[2,7;1,3]", "Bp=Identidad(2)", "P=Inversa(Bp)*Bm", "v=[-3;4]", "vp=P*v"]);
    expect(r.vp).toBe("[22; 9]");
  });
});
