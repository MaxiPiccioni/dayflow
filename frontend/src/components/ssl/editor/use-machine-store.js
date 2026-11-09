import { useCallback, useRef, useState } from "react";
import { deleteItem, duplicateItem, loadStore, saveItem, saveStore } from "@/lib/ssl/machines/store";

// Autómatas guardados por el usuario (solo en este navegador). saveFailed avisa si no se pudo guardar.
export function useMachineStore() {
  const [store, setStore] = useState(() => loadStore());
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef(store);

  const update = useCallback((change) => {
    const next = change(latest.current);
    latest.current = next;
    setStore(next);
    setSaveFailed(!saveStore(next));
  }, []);

  return {
    store,
    saveFailed,
    save: useCallback((entry) => update((s) => saveItem(s, { ...entry, savedAt: new Date().toISOString() })), [update]),
    remove: useCallback((id) => update((s) => deleteItem(s, id)), [update]),
    duplicate: useCallback((id) => update((s) => duplicateItem(s, id, new Date().toISOString())), [update]),
  };
}
