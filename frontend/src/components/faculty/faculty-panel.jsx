import { useEffect, useState } from "react";
import { GraduationCap, Plus, Settings2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge, SubjectCard } from "@/components/faculty/subject-card";
import { SubjectDetail } from "@/components/faculty/subject-detail";
import { SubjectManagerModal } from "@/components/faculty/subject-manager-modal";
import { api } from "@/lib/api";
import { formatGrade, KIND_FILTERS, levelLabel, matchesKind, REQUIRED_ELECTIVE_CREDITS, sortSubjects, summarize } from "@/lib/faculty";

const LEVEL_KEY = "dayflow_faculty_level";
const KIND_KEY = "dayflow_faculty_kind";
const ALL = "all";

function readSaved(key) {
  try {
    return localStorage.getItem(key) ?? ALL;
  } catch (err) {
    // Sin acceso a localStorage (navegación privada, prerender): se arranca en "Todos"/"Todas".
    console.warn(`No se pudo leer ${key}`, err);
    return ALL;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`No se pudo guardar ${key}`, err);
  }
}

function SubjectGrid({ subjects, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} onClick={() => onOpen(subject.id)} />)}
    </div>
  );
}

function StatTile({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold leading-none text-zinc-950 dark:text-zinc-50">{value}</p>
      {detail && <p className="mt-1.5 text-xs text-zinc-400">{detail}</p>}
    </div>
  );
}

const chipClass = (active) =>
  `rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`;

// Pestaña Facultad: carga sus propios datos, como ShoppingPanel.
export function FacultyPanel() {
  const [subjects, setSubjects] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [level, setLevel] = useState(() => readSaved(LEVEL_KEY));
  const [kind, setKind] = useState(() => readSaved(KIND_KEY));
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
  const chooseLevel = (value) => { setLevel(value); save(LEVEL_KEY, value); };
  const chooseKind = (value) => { setKind(value); save(KIND_KEY, value); };

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
  const applyNotes = (subjectId, notes) => setSubjects((current) => current.map((subject) => (subject.id === subjectId ? { ...subject, notes } : subject)));
  const openSubject = (subjectId) => {
    setSelectedId(subjectId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteSubject = (subject) => api(`/faculty/subjects/${subject.id}`, { method: "DELETE" }).then(() => {
    setSubjects((current) => current.filter((item) => item.id !== subject.id));
    if (selectedId === subject.id) setSelectedId(null);
    refreshSubjects();
  });
  const reorderSubjects = (levelNumber, ids) => api("/faculty/subjects/order", { method: "PUT", body: JSON.stringify({ level: levelNumber, ids }) }).then(setSubjects);

  const header = (
    <CardHeader
      eyebrow="Facultad"
      title="Mi carrera"
      action={subjects && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setManager({ initialForm: {} })} className="flex items-center gap-1 rounded-xl bg-lime-200 px-3 py-2 text-sm font-semibold text-lime-950"><Plus size={15} /> Agregar materia</button>
          <button type="button" onClick={() => setManager({ initialForm: null })} aria-label="Administrar materias" title="Administrar materias" className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-zinc-100"><Settings2 size={17} /></button>
        </div>
      )}
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

  const activeKind = KIND_FILTERS.some(([value]) => value === kind) ? kind : ALL;
  const visible = subjects.filter((subject) => matchesKind(subject, activeKind));
  const levels = [...new Set(visible.map((subject) => subject.level))];
  // Si el nivel guardado ya no tiene materias (con el tipo elegido), se muestra "Todos".
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
        <SubjectDetail
          key={selected.id}
          subject={selected}
          subjects={subjects}
          onBack={() => setSelectedId(null)}
          onEdit={() => setManager({ initialForm: selected })}
          onChange={applySubject}
          onOpen={openSubject}
          onNotesSaved={applyNotes}
        />
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
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Materias aprobadas" value={summary.curricularApproved} detail={`de ${summary.curricularTotal}`} />
              <StatTile label="Créditos de electivas" value={summary.electiveCredits} detail={`de ${REQUIRED_ELECTIVE_CREDITS} requeridos`} />
              <StatTile label="Promedio" value={summary.average === null ? "—" : formatGrade(summary.average)} detail={`${summary.gradedCount} con nota`} />
              <StatTile label="Disponibles para cursar" value={summary.availableCount} />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2" aria-label="Materias por estado">
              {summary.byStatus.map(({ key, count }) => (
                <span key={key} className="flex items-center gap-1">
                  <StatusBadge status={key} />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{count}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </Card>

      {subjects.length > 0 && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por nivel">
              {[ALL, ...levels].map((value) => (
                <button key={value} type="button" onClick={() => chooseLevel(String(value))} aria-pressed={activeLevel === value} className={chipClass(activeLevel === value)}>
                  {value === ALL ? "Todos" : levelLabel(value)}
                </button>
              ))}
            </div>
            <div className="flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800" role="group" aria-label="Filtrar por tipo">
              {KIND_FILTERS.map(([value, label]) => (
                <button key={value} type="button" onClick={() => chooseKind(value)} aria-pressed={activeKind === value} className={`rounded-full px-3 py-1 text-xs font-medium ${activeKind === value ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">No hay materias de este tipo.</p>
          ) : activeLevel === ALL ? (
            <div className="space-y-6">
              {levels.map((levelNumber) => (
                <section key={levelNumber}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{levelLabel(levelNumber)}</h3>
                  <SubjectGrid subjects={visible.filter((subject) => subject.level === levelNumber)} onOpen={openSubject} />
                </section>
              ))}
            </div>
          ) : (
            <SubjectGrid subjects={visible.filter((subject) => subject.level === activeLevel)} onOpen={openSubject} />
          )}
        </Card>
      )}
      {modal}
    </div>
  );
}
