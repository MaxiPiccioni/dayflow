"use client";

import { GraduationCap, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FacultyHeader } from "@/components/faculty/faculty-frame";
import { useFaculty } from "@/components/faculty/faculty-provider";
import { StatusBadge, SubjectCard } from "@/components/faculty/subject-card";
import { ALL_FILTER, ELECTIVES_FILTER, FACULTY_FILTERS, facultyGroups, formatGrade, REQUIRED_ELECTIVE_CREDITS, summarize } from "@/lib/faculty";

function SubjectGrid({ subjects }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} href={`/facultad/${subject.id}`} />)}
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

// Ruta "/facultad": resumen de la carrera, filtro por año y las materias.
export function FacultyHome() {
  const { subjects, filter, chooseFilter, setManager } = useFaculty();
  const groups = facultyGroups(subjects, filter);
  const filterIsLevel = filter !== ALL_FILTER && filter !== ELECTIVES_FILTER;
  const summary = summarize(subjects);

  return (
    <div className="space-y-5">
      <Card>
        <FacultyHeader />
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
                  <SubjectGrid subjects={group.items} />
                </section>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
