import { useEffect, useState } from "react";
import { GraduationCap, Plus, Settings2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, SubjectCard } from "@/components/faculty/subject-card";
import { SubjectDetail } from "@/components/faculty/subject-detail";
import { SubjectManagerModal } from "@/components/faculty/subject-manager-modal";
import { api } from "@/lib/api";
import { formatGrade, levelLabel, sortSubjects, summarize } from "@/lib/faculty";

const LEVEL_KEY = "dayflow_faculty_level";
const ALL = "all";

function readSavedLevel() {
  try {
    return localStorage.getItem(LEVEL_KEY) ?? ALL;
  } catch (err) {
    // Sin acceso a localStorage (navegación privada, prerender): se arranca en "Todos".
    console.warn("No se pudo leer el nivel guardado de Facultad", err);
    return ALL;
  }
}

function saveLevel(level) {
  try {
    localStorage.setItem(LEVEL_KEY, level);
  } catch (err) {
    console.warn("No se pudo guardar el nivel elegido de Facultad", err);
  }
}

function SubjectGrid({ subjects, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} onClick={() => onOpen(subject.id)} />)}
    </div>
  );
}

function SummaryTile({ label, children }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      {children}
    </div>
  );
}

// Pestaña Facultad: carga sus propios datos, como ShoppingPanel.
export function FacultyPanel() {
  const [subjects, setSubjects] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [level, setLevel] = useState(readSavedLevel);
  const [selectedId, setSelectedId] = useState(null);
  const [manager, setManager] = useState(null); // { initialForm } mientras el modal está abierto

  useEffect(() => {
    let cancelled = false;
    api("/faculty/subjects")
      .then((data) => { if (!cancelled) setSubjects(data); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => { setLoadError(""); setSubjects(null); setReloadKey((key) => key + 1); };
  const chooseLevel = (value) => { setLevel(value); saveLevel(value); };

  const applySubject = (updated) => setSubjects((current) => sortSubjects(current.map((subject) => (subject.id === updated.id ? updated : subject))));
  const saveSubject = (payload, existing) => {
    if (existing) return api(`/faculty/subjects/${existing.id}`, { method: "PATCH", body: JSON.stringify(payload) }).then(applySubject);
    return api("/faculty/subjects", { method: "POST", body: JSON.stringify(payload) }).then((created) => setSubjects((current) => sortSubjects([...current, created])));
  };
  const deleteSubject = (subject) => api(`/faculty/subjects/${subject.id}`, { method: "DELETE" }).then(() => {
    setSubjects((current) => current.filter((item) => item.id !== subject.id));
    if (selectedId === subject.id) setSelectedId(null);
  });
  const reorderSubjects = (levelNumber, ids) => api("/faculty/subjects/order", { method: "PUT", body: JSON.stringify({ level: levelNumber, ids }) }).then(setSubjects);

  const header = (
    <CardHeader
      eyebrow="Facultad"
      title="Mi carrera"
      action={subjects && <button type="button" onClick={() => setManager({ initialForm: null })} aria-label="Administrar materias" title="Administrar materias" className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-zinc-100"><Settings2 size={17} /></button>}
    />
  );

  if (loadError) {
    return (
      <Card>
        {header}
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p role="alert" className="text-sm text-red-600">{loadError}</p>
          <button type="button" onClick={retry} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-950">Reintentar</button>
        </div>
      </Card>
    );
  }
  if (!subjects) {
    return <Card>{header}<p className="py-8 text-center text-sm text-zinc-400">Cargando materias…</p></Card>;
  }

  const levels = [...new Set(subjects.map((subject) => subject.level))];
  // Si el nivel guardado ya no tiene materias, se muestra "Todos".
  const activeLevel = level !== ALL && levels.includes(Number(level)) ? Number(level) : ALL;
  const selected = subjects.find((subject) => subject.id === selectedId);
  const summary = summarize(subjects);
  const modal = manager && (
    <SubjectManagerModal
      subjects={subjects}
      initialForm={manager.initialForm}
      defaultLevel={activeLevel === ALL ? 1 : activeLevel}
      onSave={saveSubject}
      onDelete={deleteSubject}
      onReorder={reorderSubjects}
      close={() => setManager(null)}
    />
  );

  if (selected) {
    return (
      <>
        <SubjectDetail key={selected.id} subject={selected} onBack={() => setSelectedId(null)} onEdit={() => setManager({ initialForm: selected })} onChange={applySubject} />
        {modal}
      </>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        {header}
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <GraduationCap size={40} className="text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no cargaste materias. Empezá por las de tu primer año.</p>
            <button type="button" onClick={() => setManager({ initialForm: {} })} className="flex items-center gap-1 rounded-xl bg-lime-200 px-4 py-2 text-sm font-semibold text-lime-950"><Plus size={15} /> Agregar materia</button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Materias aprobadas">
              <p className="mt-1 text-2xl font-semibold">{summary.approved} <span className="text-base text-zinc-400">/ {summary.total}</span></p>
              <div className="mt-3"><Progress value={summary.total ? (summary.approved / summary.total) * 100 : 0} /></div>
            </SummaryTile>
            <SummaryTile label="Por estado">
              <div className="mt-2 flex flex-wrap gap-1.5">
                {summary.byStatus.map(({ key, count }) => <span key={key} className="flex items-center gap-1"><StatusBadge status={key} /><span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{count}</span></span>)}
              </div>
            </SummaryTile>
            <SummaryTile label="Promedio de finales">
              <p className="mt-1 text-2xl font-semibold">{summary.average === null ? "—" : formatGrade(summary.average)}</p>
            </SummaryTile>
          </div>
        )}
      </Card>

      {subjects.length > 0 && (
        <Card>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por nivel">
            {[ALL, ...levels].map((value) => (
              <button key={value} type="button" onClick={() => chooseLevel(String(value))} aria-pressed={activeLevel === value} className={`rounded-full px-3 py-1.5 text-xs font-medium ${activeLevel === value ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`}>
                {value === ALL ? "Todos" : levelLabel(value)}
              </button>
            ))}
          </div>
          {activeLevel === ALL ? (
            <div className="space-y-6">
              {levels.map((levelNumber) => (
                <section key={levelNumber}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{levelLabel(levelNumber)}</h3>
                  <SubjectGrid subjects={subjects.filter((subject) => subject.level === levelNumber)} onOpen={setSelectedId} />
                </section>
              ))}
            </div>
          ) : (
            <SubjectGrid subjects={subjects.filter((subject) => subject.level === activeLevel)} onOpen={setSelectedId} />
          )}
        </Card>
      )}
      {modal}
    </div>
  );
}
