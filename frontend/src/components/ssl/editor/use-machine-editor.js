import { useCallback, useEffect, useRef, useState } from "react";
import { canRedo, canUndo, commit, commitFrom, createHistory, redo, replace, undo } from "@/lib/ssl/machines/history";
import { moveState } from "@/lib/ssl/machines/model";

// Estado del editor: máquina con historial (deshacer y rehacer), elección y modo de edición.
// onChange recibe la máquina cada vez que cambia (para guardarla); no se llama en el primer render.
export function useMachineEditor(initial, onChange) {
  const [history, setHistory] = useState(() => createHistory(initial));
  const [selection, setSelection] = useState({});
  const [mode, setMode] = useState("select");
  const [linkFrom, setLinkFrom] = useState(null);
  const first = useRef(true);
  const machine = history.present;

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    onChange?.(machine);
  }, [machine, onChange]);

  const change = useCallback((next) => setHistory((h) => commit(h, next)), []);
  // Un resultado de las operaciones del modelo: { machine } o { error }.
  const apply = useCallback((result) => {
    if (result.error) return result.error;
    setHistory((h) => commit(h, result.machine));
    return "";
  }, []);
  const liveMove = useCallback((id, x, y) => setHistory((h) => replace(h, moveState(h.present, id, x, y))), []);
  const commitDrag = useCallback((snapshot) => setHistory((h) => commitFrom(h, snapshot)), []);
  const reset = useCallback((next) => { setHistory(createHistory(next)); setSelection({}); setLinkFrom(null); }, []);

  return {
    machine,
    mode,
    setMode: (m) => { setMode(m); setLinkFrom(null); },
    selection,
    select: setSelection,
    linkFrom,
    setLinkFrom,
    change,
    apply,
    liveMove,
    commitDrag,
    reset,
    undo: () => setHistory((h) => undo(h)),
    redo: () => setHistory((h) => redo(h)),
    canUndo: canUndo(history),
    canRedo: canRedo(history),
  };
}
