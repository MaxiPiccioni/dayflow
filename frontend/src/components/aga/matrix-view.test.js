import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MatrixView } from "@/components/aga/matrix-view";
import { EX, UNITS } from "@/lib/aga/index";
import { evalScene } from "@/lib/aga/engine";

// Humo: la vista de matrices dibuja cada objeto de cada inciso de las unidades matriciales sin romperse.
describe("vista de matrices", () => {
  const matUnits = new Set(UNITS.filter((u) => u.mat).map((u) => u.n));
  for (const ex of EX.filter((e) => matUnits.has(e.unit))) {
    ex.items.forEach((item, i) => {
      it(`${ex.id} inciso ${item.l ?? i + 1}`, () => {
        const objs = evalScene(item.cmds);
        for (const obj of objs) {
          const html = renderToStaticMarkup(createElement(MatrixView, { obj, objs, dec: !!item.dec }));
          expect(html.length).toBeGreaterThan(0);
        }
      });
    });
  }

  it("Det de una 3×3 muestra Sarrus, Laplace y triangulación", () => {
    const objs = evalScene(["B=[-1,-2,-2;-1,3,1;2,5,-1]", "d=Det(B)"]);
    const html = renderToStaticMarkup(createElement(MatrixView, { obj: objs[1], objs, dec: false }));
    for (const title of ["Regla de Sarrus", "Método de Laplace", "Triangulación"]) expect(html).toContain(title);
  });

  it("Inversa de una matriz singular muestra por qué falla", () => {
    const objs = evalScene(["K=[1,2;2,4]", "Ki=Inversa(K)"]);
    const html = renderToStaticMarkup(createElement(MatrixView, { obj: objs[1], objs, dec: false }));
    expect(html).toContain("no es inversible");
  });

  it("un sistema muestra Rouché-Frobenius, Gauss-Jordan con CC y la solución", () => {
    const objs = evalScene(["A=[1,2,-2;2,-5,4;-1,16,-14]", "B=[3;6;-3]", "X=Resolver(A,B)"]);
    const html = renderToStaticMarkup(createElement(MatrixView, { obj: objs[2], objs, dec: false }));
    for (const text of ["Rouché-Frobenius", "Gauss-Jordan paso a paso", "compatible indeterminado", "Incógnitas secundarias"]) expect(html).toContain(text);
  });

  it("Cramer muestra los determinantes sustitutos", () => {
    const objs = evalScene(["A=[2,1;1,5]", "B=[3;6]", "X=Cramer(A,B)"]);
    const html = renderToStaticMarkup(createElement(MatrixView, { obj: objs[2], objs, dec: false }));
    expect(html).toContain("Método de Cramer");
  });
});
