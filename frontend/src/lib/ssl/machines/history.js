// Historial para deshacer y rehacer los cambios del editor.
const LIMIT = 100;

export const createHistory = (present) => ({ past: [], present, future: [] });

// Registra un cambio. Si no cambió nada (misma referencia), no agrega un paso.
export function commit(history, next) {
  if (next === history.present) return history;
  return { past: [...history.past, history.present].slice(-LIMIT), present: next, future: [] };
}

// Reemplaza el presente sin agregar un paso (por ejemplo al arrastrar un estado).
export const replace = (history, next) => ({ ...history, present: next });

export function undo(history) {
  if (!history.past.length) return history;
  const previous = history.past[history.past.length - 1];
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redo(history) {
  if (!history.future.length) return history;
  const [next, ...rest] = history.future;
  return { past: [...history.past, history.present], present: next, future: rest };
}

export const canUndo = (history) => history.past.length > 0;
export const canRedo = (history) => history.future.length > 0;
