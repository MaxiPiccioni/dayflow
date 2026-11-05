import { CheckCircle2, Circle } from "lucide-react";
import { StatusBadge, SubjectIcon } from "@/components/faculty/subject-card";
import { REQUIREMENT_LABEL, showsAvailability, subjectLabel } from "@/lib/faculty";

const rowClass = "flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-2 text-left hover:border-lime-400 dark:border-zinc-800 dark:hover:border-lime-400/60";

// Correlativas de una materia ("Aprobadas requeridas" y "Cursadas requeridas") y las materias que la
// tienen como correlativa ("Es correlativa de"). Cada fila abre el detalle de esa materia.
export function SubjectRequirements({ subject, subjects, onOpen }) {
  const byId = new Map(subjects.map((item) => [item.id, item]));
  const isMissing = (id, kind) => subject.missing.some((item) => item.id === id && item.kind === kind);
  const groups = [
    ["Aprobadas requeridas", "aprobada", subject.requires_aprobada],
    ["Cursadas requeridas", "cursada", subject.requires_cursada],
  ];
  const requiredBy = subject.required_by.map((id) => byId.get(id)).filter(Boolean);
  const hasRequirements = subject.requires_aprobada.length + subject.requires_cursada.length > 0;

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Correlativas</p>
        {showsAvailability(subject.status) && (
          subject.available ? (
            <p className="mt-2 flex items-center gap-2 rounded-xl bg-lime-50 px-3 py-2 text-sm font-medium text-lime-800 dark:bg-lime-400/10 dark:text-lime-200">
              <span className="h-2 w-2 rounded-full bg-lime-500" /> Disponible para cursar
            </p>
          ) : (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
              Te falta: {subject.missing.map((item) => `${item.name} (${REQUIREMENT_LABEL[item.kind]})`).join(", ")}
            </p>
          )
        )}
        {!hasRequirements && <p className="mt-2 text-sm text-zinc-400">No tiene correlativas.</p>}
        {groups.map(([title, kind, ids]) => ids.length > 0 && (
          <div key={kind} className="mt-3">
            <p className="mb-2 text-sm font-semibold">{title}</p>
            <ul className="space-y-2">
              {ids.map((id) => byId.get(id)).filter(Boolean).map((required) => {
                const met = !isMissing(required.id, kind);
                return (
                  <li key={required.id}>
                    <button type="button" onClick={() => onOpen(required.id)} className={rowClass}>
                      <SubjectIcon subject={required} size={16} className="h-8 w-8 shrink-0 rounded-xl" />
                      <span className="min-w-0 flex-1 truncate text-sm">{subjectLabel(required)}</span>
                      <StatusBadge status={required.status} />
                      {met ? (
                        <CheckCircle2 size={17} aria-label="Cumplida" className="shrink-0 text-lime-600 dark:text-lime-400" />
                      ) : (
                        <Circle size={17} aria-label="Falta" className="shrink-0 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Es correlativa de</p>
        {requiredBy.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">Ninguna materia la tiene como correlativa.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {requiredBy.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onOpen(item.id)} className={rowClass}>
                  <SubjectIcon subject={item} size={16} className="h-8 w-8 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1 truncate text-sm">{subjectLabel(item)}</span>
                  <StatusBadge status={item.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
