import { useEffect, useState } from "react";
import { GraduationCap, Plus, Settings2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, SubjectCard } from "@/components/faculty/subject-card";
import { SubjectDetail } from "@/components/faculty/subject-detail";
import { SubjectManagerModal } from "@/components/faculty/subject-manager-modal";
import { api } from "@/lib/api";
import { ALL_FILTER, ELECTIVES_FILTER, FACULTY_FILTERS, facultyGroups, formatGrade, isValidFilter, REQUIRED_ELECTIVE_CREDITS, sortSubjects, summarize } from "@/lib/faculty";

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

function SubjectGrid({ subjects, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} onClick={() => onOpen(subject.id)} />)}
    </div>
  );
}

function StatTile({ label, value, detail, progress, className = "" }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold leading-none text-zinc-950 dark:text-zinc-50">{value}</p>
      {progress !== undefined && <div className="mt-2.5"><Progress value={progress} /></div>}
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
  const [filter, setFilter] = useState(readFilter);
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

  const groups = facultyGroups(subjects, filter);
  const filterIsLevel = filter !== ALL_FILTER && filter !== ELECTIVES_FILTER;
  const selected = subjects.find((subject) => subject.id === selectedId);
  const summary = summarize(subjects);
  const modal = manager && (
    <SubjectManagerModal
      subjects={subjects}
      initialForm={manager.initialForm}
      defaultLevel={filterIsLevel ? Number(filter) : 1}
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            label="Carrera"
            value={`${summary.careerPercent} %`}
            detail={summary.curricularTotal ? `${summary.curricularApproved} de ${summary.curricularTotal} materias` : "Cargá tus materias"}
            progress={summary.careerPercent}
            className="col-span-2 lg:col-span-1"
          />
          <StatTile label="Materias aprobadas" value={summary.curricularApproved} detail={`de ${summary.curricularTotal}`} />
          <StatTile label="Créditos de electivas" value={summary.electiveCredits} detail={`de ${REQUIRED_ELECTIVE_CREDITS} requeridos`} />
          <StatTile label="Promedio" value={summary.average === null ? "—" : formatGrade(summary.average)} detail={`${summary.gradedCount} con nota`} />
          <StatTile label="Disponibles para cursar" value={summary.availableCount} />
        </div>
        {subjects.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <GraduationCap size={40} className="text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no cargaste materias. Empezá por las de tu primer año.</p>
            <button type="button" onClick={() => setManager({ initialForm: {} })} className="flex items-center gap-1 rounded-xl bg-lime-200 px-4 py-2 text-sm font-semibold text-lime-950"><Plus size={15} /> Agregar materia</button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2" aria-label="Materias por estado">
            {summary.byStatus.map(({ key, count }) => (
              <span key={key} className="flex items-center gap-1">
                <StatusBadge status={key} />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{count}</span>
              </span>
            ))}
          </div>
        )}
      </Card>

      {subjects.length > 0 && (
        <Card>
          {/* En celular la fila scrollea dentro de su contenedor, sin generar scroll en la página. */}
          <div className="scrollbar-thin -mx-1 mb-4 overflow-x-auto px-1 pb-1">
            <div className="flex w-max gap-2" role="group" aria-label="Filtrar materias">
              {FACULTY_FILTERS.map(([value, label]) => (
                <button key={value} type="button" onClick={() => chooseFilter(value)} aria-pressed={filter === value} className={`shrink-0 ${chipClass(filter === value)}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {groups.every((group) => group.items.length === 0) ? (
            <p className="py-6 text-center text-sm text-zinc-400">{filter === ELECTIVES_FILTER ? "Todavía no cargaste electivas." : filterIsLevel ? `No hay materias cargadas en ${groups[0].title}.` : "No hay materias para mostrar."}</p>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.key}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{group.title}</h3>
                  <SubjectGrid subjects={group.items} onOpen={openSubject} />
                </section>
              ))}
            </div>
          )}
        </Card>
      )}
      {modal}
    </div>
  );
}
