import { createElement } from "react";
import { colorFor, formatGrade, iconFor, statusInfo } from "@/lib/faculty";

export function StatusBadge({ status, className = "" }) {
  const info = statusInfo(status);
  return <span className={`inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.tone} ${className}`}>{info.label}</span>;
}

export function SubjectIcon({ subject, size = 28, className = "" }) {
  // iconFor busca un ícono ya definido en lib/faculty (no crea un componente nuevo en cada render).
  return (
    <span className={`grid place-items-center rounded-2xl text-zinc-900 ${className}`} style={{ backgroundColor: colorFor(subject.color) }}>
      {createElement(iconFor(subject.icon), { size, strokeWidth: 1.75 })}
    </span>
  );
}

// Tarjeta cuadrada de una materia. Sin onClick se muestra como vista previa (formulario).
export function SubjectCard({ subject, onClick }) {
  const hasGrade = subject.grade !== null && subject.grade !== undefined && subject.grade !== "";
  const content = (
    <>
      <SubjectIcon subject={subject} size={34} className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
      <p className="line-clamp-2 w-full break-words text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">{subject.name || "Nombre de la materia"}</p>
      <div className="flex w-full flex-wrap items-center justify-center gap-1">
        <StatusBadge status={subject.status} />
        {hasGrade && <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Nota {formatGrade(subject.grade)}</span>}
      </div>
    </>
  );
  const className = "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-center transition-colors dark:border-zinc-800 dark:bg-zinc-900";
  if (!onClick) return <div className={className}>{content}</div>;
  return (
    <button type="button" onClick={onClick} className={`${className} hover:border-lime-400 focus-visible:border-lime-500 focus-visible:outline-none dark:hover:border-lime-400/60`}>
      {content}
    </button>
  );
}
