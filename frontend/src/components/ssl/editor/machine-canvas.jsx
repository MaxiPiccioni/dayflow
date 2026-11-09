import { useId, useRef, useState } from "react";
import { addState, groupEdges } from "@/lib/ssl/machines/model";
import { R, canvasSize, clampPoint, edgeGeometry, initialArrow, nextFreePosition, stateAt } from "@/lib/ssl/machines/layout";

const stateLabelSize = (id) => (id.length > 7 ? 9 : id.length > 4 ? 11 : 14);

// Lienzo SVG del editor. Modos: "select" (mover y elegir), "state" (agregar estado con un clic),
// "link" (unir: clic en el origen y clic en el destino; el mismo estado hace un bucle) y "delete".
// Cada estado es un botón enfocable: Enter lo elige, las flechas lo mueven y Supr lo borra.
export function MachineCanvas({ machine, mode, selection, highlight, readOnly, onLiveChange, onCommitDrag, onChange, onSelect, onDelete, onRequestTransition, linkFrom, onLinkFrom }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [hover, setHover] = useState(null);
  const markerId = useId();
  const { width, height } = canvasSize(machine.states);
  const edges = groupEdges(machine);
  const byId = new Map(machine.states.map((s) => [s.id, s]));
  const hiStates = highlight?.states ?? new Set();
  const hiEdges = highlight?.edges ?? new Set();

  const toPoint = (event) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  };

  const canvasClick = (event) => {
    if (readOnly || mode !== "state" || event.target !== svgRef.current) return;
    const { x, y } = toPoint(event);
    if (stateAt(machine.states, x, y, 6)) return;
    const p = clampPoint(x, y);
    const r = addState(machine, { x: p.x, y: p.y });
    if (!r.error) { onChange(r.machine); onSelect({ state: r.id }); }
  };

  const statePointerDown = (event, s) => {
    if (readOnly) return;
    event.stopPropagation();
    if (mode === "delete") { onDelete({ state: s.id }); return; }
    if (mode === "link") {
      if (linkFrom === null) onLinkFrom(s.id);
      else { onRequestTransition(linkFrom, s.id); onLinkFrom(null); }
      onSelect({ state: s.id });
      return;
    }
    const p = toPoint(event);
    drag.current = { id: s.id, dx: s.x - p.x, dy: s.y - p.y, moved: false, start: machine };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelect({ state: s.id });
  };

  const pointerMove = (event) => {
    const d = drag.current;
    if (!d) return;
    const p = toPoint(event);
    const q = clampPoint(p.x + d.dx, p.y + d.dy);
    d.moved = true;
    onLiveChange(d.id, q.x, q.y);
  };

  const pointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) onCommitDrag(d.start);
  };

  const stateKeyDown = (event, s) => {
    if (readOnly) return;
    const step = event.shiftKey ? 30 : 10;
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (move) {
      event.preventDefault();
      const q = clampPoint(s.x + move[0], s.y + move[1]);
      onLiveChange(s.id, q.x, q.y);
      onCommitDrag(machine);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (mode === "link") {
        if (linkFrom === null) onLinkFrom(s.id);
        else { onRequestTransition(linkFrom, s.id); onLinkFrom(null); }
      }
      onSelect({ state: s.id });
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onDelete({ state: s.id });
    }
  };

  const describe = (s) => `Estado ${s.id}${machine.initial === s.id ? ", inicial" : ""}${machine.accepting.includes(s.id) ? ", de aceptación" : ""}`;

  return (
    <div className="w-0 min-w-full overflow-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/60" style={{ maxHeight: 440, touchAction: "pan-x pan-y" }}>
      <svg
        ref={svgRef}
        role="group"
        aria-label={`Lienzo del autómata: ${machine.states.length} estados y ${machine.transitions.length} transiciones`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`block text-zinc-800 dark:text-zinc-100 ${mode === "state" && !readOnly ? "cursor-crosshair" : ""}`}
        onClick={canvasClick}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <defs>
          <marker id={`${markerId}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-current" />
          </marker>
          <marker id={`${markerId}-hi`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lime-600" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const a = byId.get(edge.from);
          const b = byId.get(edge.to);
          if (!a || !b) return null;
          const g = edgeGeometry(a, b, { loop: edge.loop, hasReverse: edge.hasReverse, lineCount: edge.labels.length });
          const active = edge.ids.some((id) => hiEdges.has(id));
          const selected = selection?.edge && edge.ids.includes(selection.edge);
          return (
            <g key={`${edge.from}->${edge.to}`} className={active ? "text-lime-600" : selected ? "text-sky-600" : ""}>
              <path d={g.d} fill="none" strokeWidth={active ? 3 : 1.8} className="stroke-current" markerEnd={`url(#${markerId}-${active ? "hi" : "arrow"})`} />
              {/* Zona de clic más ancha para elegir o borrar la flecha. */}
              <path
                d={g.d}
                fill="none"
                stroke="transparent"
                strokeWidth="14"
                style={{ cursor: mode === "delete" ? "pointer" : "default" }}
                onPointerDown={(event) => { event.stopPropagation(); if (readOnly) return; if (mode === "delete") onDelete({ edge: edge.ids }); else onSelect({ edge: edge.ids[0], edgeIds: edge.ids }); }}
              />
              <text x={g.label.x} y={g.label.y} textAnchor="middle" className="fill-current font-mono" style={{ fontSize: 12, paintOrder: "stroke", stroke: "var(--background, #fff)", strokeWidth: 3, strokeLinejoin: "round" }}>
                {edge.labels.map((line, i) => <tspan key={i} x={g.label.x} dy={i === 0 ? 0 : 14}>{line}</tspan>)}
              </text>
            </g>
          );
        })}

        {machine.initial && byId.get(machine.initial) && (() => {
          const arrow = initialArrow(byId.get(machine.initial));
          return <line x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2} strokeWidth="2" className="stroke-current" markerEnd={`url(#${markerId}-arrow)`} />;
        })()}

        {machine.states.map((s) => {
          const accepting = machine.accepting.includes(s.id);
          const active = hiStates.has(s.id);
          const selected = selection?.state === s.id;
          const linking = linkFrom === s.id;
          return (
            <g
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={describe(s)}
              aria-pressed={selected}
              transform={`translate(${s.x} ${s.y})`}
              style={{ cursor: readOnly ? "default" : mode === "select" ? "grab" : "pointer", outline: "none" }}
              onPointerDown={(event) => statePointerDown(event, s)}
              onKeyDown={(event) => stateKeyDown(event, s)}
              onFocus={() => setHover(s.id)}
              onBlur={() => setHover(null)}
              onPointerEnter={() => setHover(s.id)}
              onPointerLeave={() => setHover(null)}
            >
              <circle r={R} strokeWidth={selected || linking ? 3 : 2} className={`${active ? "fill-lime-300 dark:fill-lime-500/50" : "fill-white dark:fill-zinc-900"} ${selected ? "stroke-sky-600" : linking ? "stroke-amber-500" : active ? "stroke-lime-600" : "stroke-current"}`} />
              {accepting && <circle r={R - 5} fill="none" strokeWidth="1.6" className={active ? "stroke-lime-700" : "stroke-current"} />}
              <text textAnchor="middle" dominantBaseline="central" className="fill-current font-mono" style={{ fontSize: stateLabelSize(s.id), pointerEvents: "none" }}>{s.id}</text>
              {hover === s.id && <circle r={R + 4} fill="none" strokeWidth="1" strokeDasharray="3 3" className="stroke-sky-500" style={{ pointerEvents: "none" }} />}
            </g>
          );
        })}
        {machine.states.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" className="fill-zinc-400" style={{ fontSize: 14 }}>
            {readOnly ? "Sin estados" : "Elegí “Agregar estado” y hacé clic acá, o usá el botón + de abajo."}
          </text>
        )}
      </svg>
    </div>
  );
}

export { nextFreePosition };
