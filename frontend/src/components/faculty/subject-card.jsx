import { createElement } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { colorFor, formatGrade, iconFor, showsAvailability, statusInfo } from "@/lib/faculty";

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

// Tarjeta cuadrada de una materia. Sin href se muestra como vista previa (formulario); con href es un enlace al detalle.
export function SubjectCard({ subject, href }) {
  const hasGrade = subject.grade !== null && subject.grade !== undefined && subject.grade !== "";
  // La vista previa no trae disponibilidad (la calcula el servidor): ahí no se muestra.
  const availability = showsAvailability(subject.status) && typeof subject.available === "boolean" ? subject.available : null;
  const content = (
    <>
      {subject.code && <span className="absolute left-3 top-2.5 text-[11px] font-semibold text-zinc-400">{subject.code}</span>}
      {availability === false && (
        <span className="absolute right-2.5 top-2.5 text-zinc-400" title="Te faltan correlativas">
          <Lock size={14} aria-label="No disponible para cursar" />
        </span>
      )}
      {availability === true && (
        <span className="absolute right-2.5 top-2 flex items-center gap-1 text-[10px] font-semibold text-lime-700 dark:text-lime-300">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-500" /> Disponible
        </span>
      )}
      <SubjectIcon subject={subject} size={30} className="h-14 w-14 shrink-0 sm:h-[4.5rem] sm:w-[4.5rem]" />
      <p className="line-clamp-2 w-full break-words text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">{subject.name || "Nombre de la materia"}</p>
      <div className="flex w-full flex-wrap items-center justify-center gap-1">
        <StatusBadge status={subject.status} />
        {subject.elective && <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">Electiva{subject.credits ? ` · ${subject.credits} cr` : ""}</span>}
        {hasGrade && <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Nota {formatGrade(subject.grade)}</span>}
      </div>
    </>
  );
  const className = "relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 pt-6 text-center transition-colors dark:border-zinc-800 dark:bg-zinc-900";
  if (!href) return <div className={className}>{content}</div>;
  return (
    <Link href={href} className={`${className} hover:border-lime-400 focus-visible:border-lime-500 focus-visible:outline-none dark:hover:border-lime-400/60`}>
      {content}
    </Link>
  );
}
