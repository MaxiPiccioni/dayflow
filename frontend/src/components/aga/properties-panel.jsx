"use client";

import { Fragment } from "react";
import { PALETTE } from "@/lib/aga/scene";
import { useDarkMode } from "@/components/aga/use-dark-mode";
import { TOL, cartesian, detOf, dimS, fmtNum, fmtVal, isExact, isM, normOf, rankM, tipoInfo } from "@/lib/aga/engine";

const ANGLES = ["α", "β", "γ"];
const heading = "mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500";

function facts(v, dec) {
  const rows = [["Tipo", typeof v === "number" ? "Número" : v.t === "s" ? "Texto" : v.t === "p" ? "Punto" : isM(v) ? "Matriz" : "Vector"], ["Valor", fmtVal(v, dec).main]];
  if (isM(v)) {
    rows.push(["Orden", dimS(v)], ["Tipo de matriz", tipoInfo(v)], ["Rango", String(rankM(v.d))]);
    if (v.d.length === v.d[0].length) {
      const det = detOf(v);
      rows.push(["Traza", fmtNum(v.d.reduce((s, r, i) => s + r[i], 0))], ["Determinante", fmtNum(det)], ["Inversible", Math.abs(det) > 1e-9 ? "sí" : "no"]);
    }
  }
  if (v && v.c) {
    rows.push(["Dimensión", `ℝ${v.c.length === 2 ? "²" : v.c.length === 3 ? "³" : `ⁿ (n = ${v.c.length})`}`]);
    if (v.t === "v") {
      const n = normOf(v);
      if (v.c.length <= 3) rows.push(["Cartesiana", cartesian(v, dec)]);
      rows.push(["Módulo", fmtNum(n, dec) + (isExact(fmtNum(n)) ? ` ≈ ${+n.toFixed(4)}` : "")]);
      if (n > TOL) {
        rows.push(["Versor", fmtVal({ t: "v", c: v.c.map((x) => x / n) }).main]);
        if (v.c.length <= 3) {
          rows.push(["cos dir.", v.c.map((x, i) => `cos ${ANGLES[i]} = ${fmtNum(x / n)}`)]);
          rows.push(["Ángulos", v.c.map((x, i) => `${ANGLES[i]} = ${((Math.acos(Math.max(-1, Math.min(1, x / n))) * 180) / Math.PI).toFixed(2)}°`)]);
        }
      }
      if (v.o) rows.push(["Origen", `(${v.o.map((x) => fmtNum(x, dec)).join(", ")})`]);
    }
  }
  return rows;
}

// Propiedades del objeto elegido (valor, módulo, versor, ángulos…) y su estilo en el gráfico.
export function PropertiesPanel({ session }) {
  const { objs, scene, sel, item } = session;
  const dark = useDarkMode();
  const obj = objs.find((o) => o.name === sel && !o.err);
  if (!obj) return <p className="text-[11px] text-zinc-500">Seleccioná un objeto en la vista algebraica o en el gráfico para ver sus propiedades.</p>;
  const op = session.opt(obj.name);
  const palette = dark ? PALETTE.dark : PALETTE.light;
  const toggles = [
    ["Mostrar objeto", op.vis, (checked) => session.setOpt(obj.name, { vis: checked })],
    ["Mostrar nombre", op.label, (checked) => session.setOpt(obj.name, { label: checked })],
    ["Mostrar componentes (vector seleccionado)", scene.comp, session.setComp],
  ];
  return (
    <>
      <div>
        <h3 className={heading}>Objeto</h3>
        <dl className="grid gap-x-2.5 gap-y-1 text-xs [grid-template-columns:auto_1fr]">
          <dt className="text-zinc-500">Nombre</dt><dd className="break-words font-mono">{obj.name}</dd>
          {facts(obj.v, !!item.dec).map(([k, val]) => (
            <Fragment key={k}>
              <dt className="text-zinc-500">{k}</dt>
              <dd className="break-words font-mono">{Array.isArray(val) ? val.map((line) => <div key={line}>{line}</div>) : val}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
      <div>
        <h3 className={heading}>Estilo</h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Color">
          {palette.map((color, i) => (
            <button key={color} type="button" aria-label={`Color ${i + 1}`} aria-pressed={op.color === i} onClick={() => session.setOpt(obj.name, { color: i })} style={{ background: color }} className={`h-[22px] w-[22px] rounded-full border-2 border-white p-0 dark:border-zinc-900 ${op.color === i ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : "ring-1 ring-zinc-300 dark:ring-zinc-700"}`} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-[12.5px]">
        {toggles.map(([text, checked, set]) => (
          <label key={text} className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => set(event.target.checked)} className="accent-lime-600" /> {text}</label>
        ))}
      </div>
    </>
  );
}
