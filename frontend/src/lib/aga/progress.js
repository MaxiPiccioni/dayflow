// Progreso del sandbox de Álgebra. Vive solo en localStorage, con clave versionada; si el navegador no deja usarlo
// (navegación privada, sitio bloqueado), todo sigue funcionando y simplemente no se guarda.
export const STORAGE_KEY = "dayflow_aga_v1";

export const emptyProgress = () => ({ v: 1, last: {} });

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Devuelve lo guardado o un progreso vacío si no hay nada, está roto o es de otra versión.
// `last` guarda, por unidad, el último ejercicio abierto: { [unidad]: { id, item } }.
export function loadProgress(storage = getStorage()) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const data = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1 || !isRecord(data.last)) return emptyProgress();
    const last = {};
    for (const [unit, entry] of Object.entries(data.last)) {
      if (isRecord(entry) && typeof entry.id === "string" && Number.isInteger(entry.item)) last[unit] = { id: entry.id, item: entry.item };
    }
    return { v: 1, last };
  } catch {
    return emptyProgress();
  }
}

// Devuelve false si no se pudo guardar.
export function saveProgress(progress, storage = getStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
