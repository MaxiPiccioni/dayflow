import { useCallback, useRef, useState } from "react";
import { loadProgress, saveProgress, setAnswer, setDone, setUi } from "@/lib/ssl/progress";

// Progreso del sandbox: respuestas, ejercicios hechos y estado de la vista. Se guarda en localStorage con
// try/catch (lib/ssl/progress); si el navegador no deja, todo funciona igual y saveFailed avisa.
export function useSslProgress() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef(progress);

  const update = useCallback((change) => {
    const next = change(latest.current);
    latest.current = next;
    setProgress(next);
    setSaveFailed(!saveProgress(next));
  }, []);

  return {
    progress,
    saveFailed,
    setAnswer: useCallback((key, text) => update((p) => setAnswer(p, key, text)), [update]),
    setDone: useCallback((id, value) => update((p) => setDone(p, id, value)), [update]),
    setUi: useCallback((key, value) => update((p) => setUi(p, key, value)), [update]),
  };
}
