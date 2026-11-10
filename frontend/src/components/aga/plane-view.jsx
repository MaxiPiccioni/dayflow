"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Home, Minus, MousePointer2, Plus, Spline, Dot } from "lucide-react";
import { useDarkMode } from "@/components/aga/use-dark-mode";
import { CANVAS, PALETTE, plotted } from "@/lib/aga/scene";
import { clampScale, drawPlane, fitView, hitTest, planeNotice, snap, toWorld } from "@/lib/aga/plane";

const TOOLS = [["move", "Mover", MousePointer2, "Mover vista y seleccionar"], ["point", "Punto", Dot, "Crear punto"], ["vector", "Vector", Spline, "Crear vector (dos clics)"]];
const floating = "absolute rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900";
const iconBtn = "grid h-8 w-8 place-items-center rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800";

// Vista gráfica: plano cartesiano en un <canvas>. Arrastrar mueve la vista, la rueda y el pellizco hacen zoom, y con las
// herramientas Punto y Vector se crean objetos con clics (con ajuste a la cuadrícula).
export function PlaneView({ session }) {
  const { objs, scene, sel, tool, setTool, sceneKey, item, opt } = session;
  const wrap = useRef(null);
  const canvas = useRef(null);
  const pointers = useRef(new Map());
  const drag = useRef(null);
  const dark = useDarkMode();
  const [size, setSize] = useState({ W: 600, H: 400, dpr: 1, measured: false });
  const [tmp, setTmp] = useState(null); // primer punto de un vector a medio crear
  const [mouse, setMouse] = useState(null);
  const [coord, setCoord] = useState("x = 0, y = 0");

  const palette = dark ? PALETTE.dark : PALETTE.light;
  const list = useMemo(() => plotted(objs, scene, palette), [objs, scene, palette]);
  const fitted = useMemo(() => fitView(list, item.view, size.W, size.H), [list, item.view, size.W, size.H]);
  const view = scene.view ?? fitted;
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; });
  const notice = useMemo(() => planeNotice(objs, list), [objs, list]);

  useEffect(() => {
    const el = wrap.current;
    const measure = () => { const r = el.getBoundingClientRect(); setSize({ W: Math.max(50, r.width), H: Math.max(50, r.height), dpr: window.devicePixelRatio || 1, measured: true }); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    cv.width = Math.round(size.W * size.dpr);
    cv.height = Math.round(size.H * size.dpr);
    drawPlane(cv.getContext("2d"), { ...size, view, theme: dark ? CANVAS.dark : CANVAS.light, list, optOf: opt, sel, comp: scene.comp, tmp, mouse });
  }, [size, view, dark, list, opt, sel, scene.comp, tmp, mouse]);

  const setView = session.setView;
  // La vista se encuadra una vez al abrir (o restablecer) el inciso; después solo cambia con el usuario.
  useEffect(() => { if (size.measured && !scene.view) setView(fitted); }, [size.measured, sceneKey, scene.view, fitted, setView]);
  useEffect(() => {
    const cv = canvas.current;
    const onWheel = (event) => {
      event.preventDefault();
      const r = cv.getBoundingClientRect(), px = event.clientX - r.left, py = event.clientY - r.top;
      const v = viewRef.current, w = toWorld(v, size.W, size.H);
      const bx = w.x(px), by = w.y(py);
      const sc = clampScale(v.sc * 1.0015 ** -event.deltaY);
      setView({ sc, cx: bx - (px - size.W / 2) / sc, cy: by + (py - size.H / 2) / sc });
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    return () => cv.removeEventListener("wheel", onWheel);
  }, [size.W, size.H, setView]);

  const local = (event) => { const r = canvas.current.getBoundingClientRect(); return { px: event.clientX - r.left, py: event.clientY - r.top }; };
  const world = (px, py) => { const w = toWorld(viewRef.current, size.W, size.H); return { x: w.x(px), y: w.y(py) }; };
  const snapped = (p) => ({ x: snap(p.x, viewRef.current.sc), y: snap(p.y, viewRef.current.sc) });

  const onPointerDown = (event) => {
    canvas.current.setPointerCapture(event.pointerId);
    const { px, py } = local(event);
    pointers.current.set(event.pointerId, { x: px, y: py });
    const v = viewRef.current;
    drag.current = { moved: 0, startX: event.clientX, startY: event.clientY, cx: v.cx, cy: v.cy, d0: null, sc0: v.sc };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      drag.current.d0 = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (event) => {
    const { px, py } = local(event);
    const raw = world(px, py);
    setMouse(snapped(raw));
    setCoord(`x = ${raw.x.toFixed(2)}, y = ${raw.y.toFixed(2)}`);
    const d = drag.current;
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: px, y: py });
    if (pointers.current.size === 2 && d?.d0) {
      const [a, b] = [...pointers.current.values()];
      setView({ ...viewRef.current, sc: clampScale((d.sc0 * Math.hypot(a.x - b.x, a.y - b.y)) / d.d0) });
      d.moved = 99;
      return;
    }
    if (!d) return;
    const dx = event.clientX - d.startX, dy = event.clientY - d.startY;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    if (d.moved > 4 && pointers.current.size === 1) setView({ ...viewRef.current, cx: d.cx - dx / viewRef.current.sc, cy: d.cy + dy / viewRef.current.sc });
  };

  const onPointerUp = (event) => {
    const { px, py } = local(event);
    pointers.current.delete(event.pointerId);
    const d = drag.current;
    if (d && d.moved <= 4 && pointers.current.size === 0) {
      const p = snapped(world(px, py));
      if (tool === "point") session.addPoint(p.x, p.y);
      else if (tool === "vector") {
        if (!tmp) setTmp(p);
        else { if (tmp.x !== p.x || tmp.y !== p.y) session.addVector(tmp, p); setTmp(null); }
      } else {
        const name = hitTest(list, opt, viewRef.current, size.W, size.H, px, py);
        session.select(name, !!name);
      }
    }
    if (pointers.current.size === 0) drag.current = null;
  };

  const zoom = (factor) => setView({ ...viewRef.current, sc: clampScale(viewRef.current.sc * factor) });
  const pickTool = (id) => { setTool(id); setTmp(null); };

  return (
    <div ref={wrap} className="relative min-h-0 flex-1 bg-white dark:bg-zinc-950">
      <canvas
        ref={canvas}
        aria-label="Plano cartesiano"
        className={`absolute inset-0 block h-full w-full touch-none ${tool === "move" ? "cursor-grab" : "cursor-crosshair"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setMouse(null)}
      />
      <div role="toolbar" aria-label="Herramientas" className={`${floating} left-2 top-2 flex gap-1`}>
        {TOOLS.map(([id, text, Icon, title]) => (
          <button key={id} type="button" aria-pressed={tool === id} title={title} onClick={() => pickTool(id)} className={`flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium ${tool === id ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
            <Icon size={14} aria-hidden="true" /> {text}
          </button>
        ))}
      </div>
      <div className={`${floating} right-2 top-2 flex flex-col gap-0.5`}>
        <button type="button" onClick={() => zoom(1.25)} aria-label="Acercar" className={iconBtn}><Plus size={15} aria-hidden="true" /></button>
        <button type="button" onClick={() => zoom(0.8)} aria-label="Alejar" className={iconBtn}><Minus size={15} aria-hidden="true" /></button>
        <button type="button" onClick={() => setView(fitView(list, item.view, size.W, size.H))} aria-label="Ajustar vista" title="Ajustar vista" className={iconBtn}><Home size={15} aria-hidden="true" /></button>
      </div>
      <div className="absolute bottom-2 left-2 rounded-md border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">{coord}</div>
      {notice.empty && <div className="pointer-events-none absolute inset-0 grid place-items-center p-5"><p className="max-w-[340px] rounded-xl border border-dashed border-zinc-300 bg-white p-3 text-center text-[12.5px] text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900">{notice.empty}</p></div>}
      {notice.banner && <p className="absolute bottom-2 left-1/2 max-w-[calc(100%-150px)] -translate-x-1/2 rounded-lg border border-amber-500 bg-white px-2.5 py-1 text-center text-[11.5px] dark:bg-zinc-900">{notice.banner}</p>}
    </div>
  );
}
