import { cmpExpect, evalScene, expShown, fmtVal, plottable } from "./engine.js";

// Colores de los objetos (se guardan como índice para que sobrevivan al cambio de tema) y del lienzo.
export const PALETTE = {
  light: ["#3b6fe0", "#d9531e", "#1f9d6b", "#b4308f", "#8a6d00", "#0f8f9c", "#7a4fd6", "#c43d56"],
  dark: ["#6d9bff", "#ff8a57", "#3fcf95", "#e56bc4", "#e0be3a", "#3ccfdc", "#a98aff", "#ff7790"],
};
export const CANVAS = {
  light: { canvas: "#ffffff", grid: "#e6e9f0", grid2: "#cdd2de", axis: "#394054", ink2: "#5a6274", accent: "#4d7c0f" },
  dark: { canvas: "#09090b", grid: "#1f1f26", grid2: "#323240", axis: "#c4c9d8", ink2: "#9aa2b6", accent: "#a3e635" },
};

const DEFAULT_OPT = { vis: true, label: true, color: null };

export const newScene = (item) => ({ cmds: item.cmds.slice(), opts: {}, view: null, comp: true });
export const optOf = (scene, name) => scene.opts[name] ?? DEFAULT_OPT;
export const withOpt = (scene, name, patch) => ({ ...scene, opts: { ...scene.opts, [name]: { ...optOf(scene, name), ...patch } } });

export const evalCommands = (cmds) => evalScene(cmds);

// Objetos dibujables con su color. El color automático sale del orden entre los objetos que no son números.
export function plotted(objs, scene, palette) {
  let i = 0;
  const out = [];
  objs.forEach((o) => {
    if (o.err || !o.graph || !plottable(o)) {
      if (!o.err && o.v && typeof o.v !== "number") i++;
      return;
    }
    const op = optOf(scene, o.name);
    out.push({ o, color: op.color !== null ? palette[op.color] : palette[i % palette.length], index: i });
    i++;
  });
  return out;
}

// Nombre libre para un objeto nuevo: P, Q… para los puntos y u, v… para los vectores.
export function nextName(objs, kind) {
  const used = new Set(objs.map((o) => o.name));
  const letters = kind === "p" ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "uvwabcdefghijklmnopqrstxyz";
  for (const c of letters) if (!used.has(c)) return c;
  let n = 1;
  while (used.has(`o${n}`)) n++;
  return `o${n}`;
}

// Prueba una orden nueva sin guardarla: devuelve el error o null.
export function tryCommand(cmds, cmd) {
  const test = evalScene(cmds.concat([cmd]));
  return test[test.length - 1].err ?? null;
}

// Compara lo que dan las órdenes del ejercicio con las respuestas esperadas del apunte.
export function checkItem(item, objs) {
  const values = {};
  const errors = {};
  objs.forEach((o) => { if (o.err) errors[o.name] = o.err; else values[o.name] = o.v; });
  return Object.entries(item.expect ?? {}).map(([name, exp]) => {
    const got = values[name];
    return { name, ok: cmpExpect(got, exp, errors[name]), shown: errors[name] ? "no definida" : got === undefined ? "—" : fmtVal(got, item.dec).main, expected: expShown(exp, item.dec) };
  });
}

export const exerciseTitle = (e) => (e.kind === "ej" ? `Ejemplo ${e.n}` : `Ejercicio ${e.num}`);
