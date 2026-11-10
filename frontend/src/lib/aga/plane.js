import { fmtNum, plottable } from "./engine.js";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const MATH = "Georgia, 'Times New Roman', serif";

export const MIN_SCALE = 4;
export const MAX_SCALE = 4000;
export const clampScale = (s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

// Vista: centro (cx, cy) en coordenadas del plano y escala en píxeles por unidad.
export const toScreen = (view, W, H) => ({
  x: (x) => W / 2 + (x - view.cx) * view.sc,
  y: (y) => H / 2 - (y - view.cy) * view.sc,
});
export const toWorld = (view, W, H) => ({
  x: (px) => (px - W / 2) / view.sc + view.cx,
  y: (py) => -(py - H / 2) / view.sc + view.cy,
});

function niceStep(target) {
  const e = 10 ** Math.floor(Math.log10(target));
  const m = target / e;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e;
}
export function snapStep(sc) {
  for (const s of [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100]) if (s * sc >= 24) return s;
  return 100;
}
export const snap = (v, sc) => { const st = snapStep(sc); return +(Math.round(v / st) * st).toFixed(6); };

// Vista que encuadra un ejercicio: la región del ejercicio o todos los objetos dibujados.
export function fitView(list, region, W, H) {
  let [x0, x1, y0, y1] = [0, 0, 0, 0];
  if (region) [x0, x1, y0, y1] = region;
  else {
    const pts = [[0, 0]];
    list.forEach(({ o }) => {
      const o0 = o.v.o || [0, 0];
      if (o.v.t === "p") pts.push(o.v.c);
      else pts.push(o0, [o0[0] + o.v.c[0], o0[1] + o.v.c[1]]);
    });
    x0 = Math.min(...pts.map((p) => p[0])); x1 = Math.max(...pts.map((p) => p[0]));
    y0 = Math.min(...pts.map((p) => p[1])); y1 = Math.max(...pts.map((p) => p[1]));
    const px = Math.max(1.5, (x1 - x0) * 0.25), py = Math.max(1.5, (y1 - y0) * 0.25);
    x0 -= px; x1 += px; y0 -= py; y1 += py;
    if (x1 - x0 < 6) { const m = (x0 + x1) / 2; x0 = m - 3; x1 = m + 3; }
    if (y1 - y0 < 6) { const m = (y0 + y1) / 2; y0 = m - 3; y1 = m + 3; }
  }
  return { sc: Math.max(MIN_SCALE, Math.min(W / (x1 - x0), H / (y1 - y0))), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// Objeto del gráfico más cercano al punto (px, py) de la pantalla, a menos de 9 px.
export function hitTest(list, optOf, view, W, H, px, py) {
  const sx = toScreen(view, W, H).x, sy = toScreen(view, W, H).y;
  let best = null, bd = 9;
  list.forEach(({ o }) => {
    if (!optOf(o.name).vis) return;
    const v = o.v;
    if (v.t === "p") {
      const d = Math.hypot(sx(v.c[0]) - px, sy(v.c[1]) - py);
      if (d < bd) { bd = d; best = o.name; }
      return;
    }
    const o0 = v.o || [0, 0];
    const ax = sx(o0[0]), ay = sy(o0[1]), bx = sx(o0[0] + v.c[0]), by = sy(o0[1] + v.c[1]);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2));
    const d = Math.hypot(ax + t * dx - px, ay + t * dy - py);
    if (d < bd) { bd = d; best = o.name; }
  });
  return best;
}

// Aviso cuando hay objetos que no se pueden dibujar en el plano (ℝ³, ℝⁿ).
export function planeNotice(objs, list) {
  const graphable = (o) => !o.err && o.graph && o.v && typeof o.v !== "number" && o.v.t !== "s";
  const hidden = objs.filter((o) => graphable(o) && !plottable(o)).length;
  const none = objs.some(graphable) && list.length === 0;
  const dim = Math.max(0, ...objs.map((o) => (o.v && o.v.c ? o.v.c.length : 0)));
  return {
    banner: hidden > 0 && !none ? "Algunos objetos están en ℝ³: se calculan en el panel algebraico y se grafican en la vista 3D (próxima etapa)." : "",
    empty: none ? (dim > 3 ? "Vectores de ℝⁿ con n > 3: no se pueden graficar. Los resultados están en el panel algebraico." : "Este ejercicio está en ℝ³. Los resultados se calculan a la izquierda; el gráfico 3D llega en la próxima etapa.") : "",
  };
}

function arrow(g, x0, y0, x1, y1, col, w, dash) {
  const L = Math.hypot(x1 - x0, y1 - y0);
  if (L < 0.5) return;
  const ux = (x1 - x0) / L, uy = (y1 - y0) / L, hl = Math.min(12, L * 0.6), hw = hl * 0.42;
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = "round"; g.setLineDash(dash || []);
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - ux * hl * 0.8, y1 - uy * hl * 0.8); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - ux * hl + uy * hw, y1 - uy * hl - ux * hw); g.lineTo(x1 - ux * hl - uy * hw, y1 - uy * hl + ux * hw); g.closePath(); g.fill();
}

function label(g, txt, x, y, col, italic) {
  g.font = `${italic ? "italic 500 16px" : "500 12px"} ${MATH}`;
  g.fillStyle = col; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText(txt, x, y);
}

// Dibuja el plano completo: cuadrícula, ejes, objetos, el vector a medio crear y la selección.
export function drawPlane(g, { W, H, dpr, view, theme, list, optOf, sel, comp, tmp, mouse }) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = theme.canvas; g.fillRect(0, 0, W, H);
  const { x: sx, y: sy } = toScreen(view, W, H);
  const { x: wx, y: wy } = toWorld(view, W, H);
  const major = niceStep(70 / view.sc), mant = major / 10 ** Math.floor(Math.log10(major)), minor = major / (mant === 2 ? 4 : 5);
  const xa = wx(0), xb = wx(W), ya = wy(H), yb = wy(0);
  const lines = (st, col) => {
    g.strokeStyle = col; g.lineWidth = 1; g.beginPath();
    for (let x = Math.ceil(xa / st) * st; x <= xb; x += st) { const X = Math.round(sx(x)) + 0.5; g.moveTo(X, 0); g.lineTo(X, H); }
    for (let y = Math.ceil(ya / st) * st; y <= yb; y += st) { const Y = Math.round(sy(y)) + 0.5; g.moveTo(0, Y); g.lineTo(W, Y); }
    g.stroke();
  };
  if (minor * view.sc >= 9) lines(minor, theme.grid);
  lines(major, theme.grid2);
  const X0 = sx(0), Y0 = sy(0);
  g.strokeStyle = theme.axis; g.fillStyle = theme.axis; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, Y0); g.lineTo(W - 8, Y0); g.moveTo(X0, H); g.lineTo(X0, 8); g.stroke();
  g.beginPath(); g.moveTo(W - 2, Y0); g.lineTo(W - 11, Y0 - 4); g.lineTo(W - 11, Y0 + 4); g.fill();
  g.beginPath(); g.moveTo(X0, 2); g.lineTo(X0 - 4, 11); g.lineTo(X0 + 4, 11); g.fill();
  g.font = `11px ${MONO}`; g.fillStyle = theme.ink2; g.textBaseline = "top";
  const ty = Math.min(Math.max(Y0 + 4, 4), H - 16), tx = Math.min(Math.max(X0 + 6, 4), W - 40);
  g.textAlign = "center";
  for (let x = Math.ceil(xa / major) * major; x <= xb; x += major) { if (Math.abs(x) < major / 2) continue; g.fillText(fmtNum(+x.toFixed(6), true).replace(/\.00$/, ""), sx(x), ty); }
  g.textAlign = X0 > W - 50 ? "right" : "left"; g.textBaseline = "middle";
  for (let y = Math.ceil(ya / major) * major; y <= yb; y += major) { if (Math.abs(y) < major / 2) continue; g.fillText(fmtNum(+y.toFixed(6), true).replace(/\.00$/, ""), X0 > W - 50 ? X0 - 6 : tx - 2, sy(y)); }
  g.textAlign = "left"; g.textBaseline = "top"; g.fillText("0", Math.min(X0 + 5, W - 14), Math.min(Y0 + 4, H - 16));
  label(g, "x", W - 14, Y0 - 12 < 8 ? Y0 + 14 : Y0 - 12, theme.axis, true);
  label(g, "y", X0 + 13 > W - 10 ? X0 - 13 : X0 + 13, 14, theme.axis, true);

  // Los auxiliares (punteados) van detrás.
  [...list].sort((a, b) => (b.o.aux ? 1 : 0) - (a.o.aux ? 1 : 0)).reverse().forEach(({ o, color }) => {
    const op = optOf(o.name);
    if (!op.vis) return;
    const v = o.v, isSel = sel === o.name;
    if (v.t === "p") {
      const X = sx(v.c[0]), Y = sy(v.c[1]);
      if (isSel) { g.fillStyle = `${color}44`; g.beginPath(); g.arc(X, Y, 11, 0, 7); g.fill(); }
      g.fillStyle = color; g.strokeStyle = theme.canvas; g.lineWidth = 1.5; g.beginPath(); g.arc(X, Y, 4.6, 0, 7); g.fill(); g.stroke();
      if (op.label) label(g, o.name, X + 13, Y - 11, color, true);
      return;
    }
    const o0 = v.o || [0, 0], x0 = sx(o0[0]), y0 = sy(o0[1]), x1 = sx(o0[0] + v.c[0]), y1 = sy(o0[1] + v.c[1]);
    if (isSel) {
      g.strokeStyle = `${color}40`; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      if (comp) {
        g.strokeStyle = color; g.lineWidth = 1.2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
        label(g, fmtNum(v.c[0]), (x0 + x1) / 2, y0 + (v.c[1] >= 0 ? 12 : -12), color);
        label(g, fmtNum(v.c[1]), x1 + (v.c[0] >= 0 ? 14 : -14), (y0 + y1) / 2, color);
      }
    }
    if (o.aux) arrow(g, x0, y0, x1, y1, theme.ink2, 1.6, [5, 4]);
    else arrow(g, x0, y0, x1, y1, color, isSel ? 3 : 2.4);
    if (op.label && !o.aux) {
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, L = Math.hypot(x1 - x0, y1 - y0) || 1;
      label(g, o.name, mx - ((y1 - y0) / L) * 14, my + ((x1 - x0) / L) * 14, color, true);
    }
  });
  if (tmp && mouse) {
    arrow(g, sx(tmp.x), sy(tmp.y), sx(mouse.x), sy(mouse.y), theme.accent, 2, [6, 4]);
    g.fillStyle = theme.accent; g.beginPath(); g.arc(sx(tmp.x), sy(tmp.y), 4, 0, 7); g.fill();
  }
}
