"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/app/app-provider";
import { api } from "@/lib/api";
import { ALL_FILTER, isValidFilter, sortSubjects } from "@/lib/faculty";

const FILTER_KEY = "dayflow_faculty_filter";
// Claves de los filtros anteriores (nivel y tipo por separado), que ya no se usan.
const OLD_KEYS = ["dayflow_faculty_level", "dayflow_faculty_kind"];

function readFilter() {
  try {
    OLD_KEYS.forEach((key) => localStorage.removeItem(key));
    const saved = localStorage.getItem(FILTER_KEY);
    return isValidFilter(saved) ? saved : ALL_FILTER;
  } catch (err) {
    // Sin acceso a localStorage (navegación privada, prerender): se arranca en "Todas".
    console.warn("No se pudo leer el filtro de Facultad", err);
    return ALL_FILTER;
  }
}

function saveFilter(value) {
  try {
    localStorage.setItem(FILTER_KEY, value);
  } catch (err) {
    console.warn("No se pudo guardar el filtro de Facultad", err);
  }
}

const FacultyContext = createContext(null);

export function useFaculty() {
  const value = useContext(FacultyContext);
  if (!value) throw new Error("useFaculty se usa dentro de FacultyProvider.");
  return value;
}

// Estado de Facultad compartido por /facultad, el detalle de una materia y su sandbox: se carga una vez al entrar a
// Facultad y se conserva al ir de la lista al detalle y de ahí al sandbox.
export function FacultyProvider({ children }) {
  const router = useRouter();
  const { id: selectedParam } = useParams();
  const { setSubjectOptions } = useApp();
  const [subjects, setSubjects] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState(readFilter);
  const [study, setStudy] = useState({}); // subject_id -> { total_seconds, week_seconds, pending_tasks }
  const [manager, setManager] = useState(null); // { initialForm } mientras el modal está abierto
  const [leavingId, setLeavingId] = useState(null); // materia recién borrada mientras se vuelve a la lista

  useEffect(() => {
    let cancelled = false;
    api("/faculty/subjects")
      .then((data) => { if (!cancelled) setSubjects(data); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Los selectores de materias de las otras pestañas (Pomodoro, Tareas) se actualizan con lo que se edita acá.
  useEffect(() => { if (subjects) setSubjectOptions(subjects); }, [subjects, setSubjectOptions]);

  // El resumen de estudio es secundario: si falla, el detalle se muestra con ceros. Se vuelve a pedir al abrir otra materia.
  useEffect(() => {
    let cancelled = false;
    api("/faculty/study")
      .then((rows) => { if (!cancelled) setStudy(Object.fromEntries(rows.map((row) => [row.subject_id, row]))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedParam]);

  const retry = () => { setLoadError(""); setSubjects(null); setReloadKey((key) => key + 1); };
  const chooseFilter = (value) => { setFilter(value); saveFilter(value); };

  // Cambiar el estado o las correlativas de una materia cambia la disponibilidad y required_by de otras:
  // se aplica al instante lo que devolvió el backend y después se trae la lista completa.
  const refreshSubjects = () => api("/faculty/subjects").then(setSubjects).catch((err) => console.warn("No se pudo actualizar la lista de materias", err));
  const applySubject = (updated) => {
    setSubjects((current) => sortSubjects(current.map((subject) => (subject.id === updated.id ? { ...subject, ...updated } : subject))));
    refreshSubjects();
  };
  const saveSubject = (payload, existing) => {
    if (existing) return api(`/faculty/subjects/${existing.id}`, { method: "PATCH", body: JSON.stringify(payload) }).then(applySubject);
    return api("/faculty/subjects", { method: "POST", body: JSON.stringify(payload) }).then((created) => {
      setSubjects((current) => sortSubjects([...current, created]));
      refreshSubjects();
    });
  };
  // Las anotaciones no cambian nada de otras materias: se aplican sin volver a pedir la lista.
  const applyNotes = useCallback((subjectId, notes) => setSubjects((current) => current.map((subject) => (subject.id === subjectId ? { ...subject, notes } : subject))), []);
  const deleteSubject = (subject) => api(`/faculty/subjects/${subject.id}`, { method: "DELETE" }).then(() => {
    if (String(selectedParam) === String(subject.id)) {
      setLeavingId(subject.id);
      router.replace("/facultad");
    }
    setSubjects((current) => current.filter((item) => item.id !== subject.id));
    refreshSubjects();
  });
  const reorderSubjects = (levelNumber, ids) => api("/faculty/subjects/order", { method: "PUT", body: JSON.stringify({ level: levelNumber, ids }) }).then(setSubjects);

  const value = {
    subjects, loadError, retry, filter, chooseFilter, study, manager, setManager, leavingId,
    applySubject, saveSubject, applyNotes, deleteSubject, reorderSubjects,
  };
  return <FacultyContext.Provider value={value}>{children}</FacultyContext.Provider>;
}
