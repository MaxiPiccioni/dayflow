// Geometría del lienzo del editor: radio de los estados, trayectos de las flechas (rectas, curvas cuando hay
// ida y vuelta entre dos estados, y bucles) y posición de las etiquetas. Es puro para poder probarlo.

export const R = 24;
export const CANVAS_PAD = 60;

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

// Punto sobre la circunferencia de un estado en la dirección de otro punto (con una separación extra).
function onCircle(center, toward, gap = 0) {
  const d = dist(center, toward) || 1;
  return { x: center.x + ((toward.x - center.x) / d) * (R + gap), y: center.y + ((toward.y - center.y) / d) * (R + gap) };
}

// Trayecto de una flecha entre dos estados.
// edge = { loop, hasReverse }; devuelve { d, label: {x, y}, angle } (angle: dirección de llegada, en radianes).
export function edgeGeometry(a, b, { loop = false, hasReverse = false, lineCount = 1 } = {}) {
  if (loop) {
    const top = a.y - R;
    const d = `M ${a.x - 12} ${top + 2} C ${a.x - 46} ${top - 52}, ${a.x + 46} ${top - 52}, ${a.x + 12} ${top + 2}`;
    return { d, label: { x: a.x, y: top - 46 - (lineCount - 1) * 8 }, angle: Math.atan2(1, 0.4) };
  }
  if (hasReverse) {
    // Las dos flechas de ida y vuelta se curvan hacia lados opuestos (según el sentido) para no superponerse.
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const d0 = dist(a, b) || 1;
    const nx = -(b.y - a.y) / d0;
    const ny = (b.x - a.x) / d0;
    const bend = Math.min(46, 18 + d0 * 0.12);
    const control = { x: mid.x + nx * bend * 2, y: mid.y + ny * bend * 2 };
    const start = onCircle(a, control);
    const end = onCircle(b, control, 1);
    return {
      d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
      label: { x: mid.x + nx * (bend + 21 + (lineCount - 1) * 6), y: mid.y + ny * (bend + 21 + (lineCount - 1) * 6) },
      angle: Math.atan2(end.y - control.y, end.x - control.x),
    };
  }
  const start = onCircle(a, b);
  const end = onCircle(b, a, 1);
  const d0 = dist(a, b) || 1;
  const nx = -(b.y - a.y) / d0;
  const ny = (b.x - a.x) / d0;
  return {
    d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
    label: { x: (a.x + b.x) / 2 + nx * 14, y: (a.y + b.y) / 2 + ny * 14 },
    angle: Math.atan2(end.y - start.y, end.x - start.x),
  };
}

// Flecha de entrada del estado inicial.
export function initialArrow(state) {
  return { x1: state.x - R - 34, y1: state.y, x2: state.x - R - 1, y2: state.y };
}

// Estado bajo un punto (o null).
export function stateAt(states, x, y, slack = 0) {
  for (let i = states.length - 1; i >= 0; i--) if (Math.hypot(states[i].x - x, states[i].y - y) <= R + slack) return states[i];
  return null;
}

// Tamaño del lienzo para que entren todos los estados con su margen.
export function canvasSize(states, minW = 520, minH = 320) {
  let w = minW;
  let h = minH;
  for (const s of states) { w = Math.max(w, s.x + R + CANVAS_PAD + 40); h = Math.max(h, s.y + R + CANVAS_PAD); }
  return { width: w, height: h };
}

// Posición libre para un estado nuevo (grilla de izquierda a derecha).
export function nextFreePosition(states, gap = 120) {
  for (let i = 0; i < 200; i++) {
    const x = 90 + (i % 5) * gap;
    const y = 90 + Math.floor(i / 5) * gap;
    if (!states.some((s) => Math.hypot(s.x - x, s.y - y) < R * 2.2)) return { x, y };
  }
  return { x: 90, y: 90 };
}

// Mantiene a un punto dentro del lienzo (no negativo).
export const clampPoint = (x, y) => ({ x: Math.max(R + 6, x), y: Math.max(R + 6, y) });
