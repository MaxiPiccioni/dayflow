// Progreso del sandbox SSL. Vive solo en localStorage, con clave versionada; si el navegador no deja usarlo
// (navegación privada, sitio bloqueado), todo sigue funcionando y simplemente no se guarda.
export const STORAGE_KEY = "dayflow_ssl_v1";

export const emptyProgress = () => ({ v: 1, done: {}, answers: {}, ui: {} });

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Devuelve el progreso guardado o uno vacío si no hay nada, está roto o es de otra versión.
export function loadProgress(storage = getStorage()) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const data = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1) return emptyProgress();
    return {
      v: 1,
      done: isRecord(data.done) ? Object.fromEntries(Object.entries(data.done).filter(([, value]) => value === true)) : {},
      answers: isRecord(data.answers) ? Object.fromEntries(Object.entries(data.answers).filter(([, value]) => typeof value === "string")) : {},
      ui: isRecord(data.ui) ? data.ui : {},
    };
  } catch (err) {
    console.warn("No se pudo leer el progreso del sandbox SSL", err);
    return emptyProgress();
  }
}

// Guarda el progreso. Devuelve false si no se pudo (cuota llena, almacenamiento bloqueado…).
export function saveProgress(progress, storage = getStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (err) {
    console.warn("No se pudo guardar el progreso del sandbox SSL", err);
    return false;
  }
}

export const setDone = (progress, id, value) => {
  const done = { ...progress.done };
  if (value) done[id] = true;
  else delete done[id];
  return { ...progress, done };
};

export const setAnswer = (progress, key, text) => {
  const answers = { ...progress.answers };
  if (text) answers[key] = text;
  else delete answers[key];
  return { ...progress, answers };
};

export const setUi = (progress, key, value) => ({ ...progress, ui: { ...progress.ui, [key]: value } });

// Cuántos de los ids dados están marcados como hechos.
export const countDone = (progress, ids) => ids.filter((id) => progress.done[id]).length;
