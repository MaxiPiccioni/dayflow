import { importMachine } from "./model.js";

// Autómatas guardados por el usuario (nombre y ejercicio). Solo en localStorage, con clave versionada y
// try/catch: si el navegador no deja, todo sigue funcionando sin guardar.
export const MACHINES_KEY = "dayflow_ssl_machines_v1";
const MAX_ITEMS = 200;

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export const emptyStore = () => ({ v: 1, items: [] });

export function loadStore(storage = getStorage()) {
  try {
    const raw = storage?.getItem(MACHINES_KEY);
    if (!raw) return emptyStore();
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !Array.isArray(data.items)) return emptyStore();
    const items = [];
    for (const item of data.items) {
      const imported = importMachine(item.machine);
      if (typeof item.id === "string" && typeof item.name === "string" && imported.machine) {
        items.push({ id: item.id, name: item.name, exerciseKey: typeof item.exerciseKey === "string" ? item.exerciseKey : "", savedAt: String(item.savedAt ?? ""), machine: imported.machine });
      }
    }
    return { v: 1, items };
  } catch (err) {
    console.warn("No se pudieron leer los autómatas guardados", err);
    return emptyStore();
  }
}

export function saveStore(store, storage = getStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(MACHINES_KEY, JSON.stringify(store));
    return true;
  } catch (err) {
    console.warn("No se pudieron guardar los autómatas", err);
    return false;
  }
}

const newId = (store) => {
  let n = store.items.length + 1;
  while (store.items.some((i) => i.id === `m${n}`)) n++;
  return `m${n}`;
};

// Guarda un autómata con ese nombre en el ejercicio; si ya existe uno igual, lo reemplaza.
export function saveItem(store, { name, exerciseKey, machine, savedAt }) {
  const clean = name.trim() || "Sin nombre";
  const existing = store.items.find((i) => i.exerciseKey === exerciseKey && i.name === clean);
  if (existing) return { ...store, items: store.items.map((i) => (i === existing ? { ...i, machine, savedAt } : i)) };
  return { ...store, items: [...store.items, { id: newId(store), name: clean, exerciseKey, machine, savedAt }].slice(-MAX_ITEMS) };
}

export const deleteItem = (store, id) => ({ ...store, items: store.items.filter((i) => i.id !== id) });

export function duplicateItem(store, id, savedAt) {
  const item = store.items.find((i) => i.id === id);
  if (!item) return store;
  let name = `${item.name} (copia)`;
  while (store.items.some((i) => i.exerciseKey === item.exerciseKey && i.name === name)) name += " 2";
  return { ...store, items: [...store.items, { ...item, id: newId(store), name, savedAt }] };
}

export const itemsFor = (store, exerciseKey) => store.items.filter((i) => i.exerciseKey === exerciseKey);
