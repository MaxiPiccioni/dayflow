import { describe, expect, it } from "vitest";
import { EX, UNITS } from "./index.js";
import { cmpExpect, evalScene, expShown, fmtVal } from "./engine.js";

// Comprueba cada ejercicio y ejemplo contra las respuestas del apunte (antes era `node aga/check2.js`).
describe("ejercicios del apunte", () => {
  it("hay ejercicios en cada unidad", () => {
    for (const unit of UNITS) expect(EX.some((e) => e.unit === unit.n), `unidad ${unit.n}`).toBe(true);
  });

  for (const e of EX) {
    e.items.forEach((item, i) => {
      it(`${e.id} (inciso ${item.l || i + 1}) se evalúa y coincide con la respuesta`, () => {
        const objs = evalScene(item.cmds);
        const values = {};
        const errors = {};
        objs.forEach((o) => { if (o.err) errors[o.name] = o.err; else values[o.name] = o.v; });
        const expected = item.expect ?? {};
        expect(objs.filter((o) => o.err && expected[o.name] !== "ERR").map((o) => `${o.raw} => ${o.err}`)).toEqual([]);
        const wrong = Object.entries(expected)
          .filter(([name, exp]) => !cmpExpect(values[name], exp, errors[name]))
          .map(([name, exp]) => `${name}: obtuvo ${values[name] ? fmtVal(values[name]).main : "nada"}, esperaba ${expShown(exp)}`);
        expect(wrong).toEqual([]);
      });
    });
  }

  it("evalúa expresiones sueltas", () => {
    const show = (src) => evalScene([src]).map((o) => o.err || fmtVal(o.v).main)[0];
    expect(show("|(3,4)|")).toBe("5");
    expect(show("3.5*2")).toBe("7");
  });
});
