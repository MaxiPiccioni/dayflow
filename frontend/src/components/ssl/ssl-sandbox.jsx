import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Hourglass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionView } from "@/components/ssl/section-view";
import { useSslProgress } from "@/components/ssl/use-ssl-progress";
import { UNITS, isActive, unitByNumber } from "@/lib/ssl/units";
import { countDone } from "@/lib/ssl/progress";

const chip = (active) => `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`;

// Sandbox de Sintaxis y Semántica de los Lenguajes: una ruta por unidad (/facultad/[id]/sandbox/[unidad]).
// Sin unidad en la ruta se muestra la última que se usó. La sección dentro de la unidad sigue siendo una pestaña interna.
export function SslSandbox({ subjectId, unitNumber }) {
  const store = useSslProgress();
  const { progress, saveFailed, setUi } = store;
  const unit = unitByNumber(unitNumber ?? progress.ui.unit) ?? UNITS[0];
  // La unidad abierta por la ruta queda como "la última que se usó".
  useEffect(() => {
    if (unitNumber !== undefined && progress.ui.unit !== unitNumber) setUi("unit", unitNumber);
  }, [unitNumber, progress.ui.unit, setUi]);
  const active = isActive(unit);
  // La Unidad 2 conserva su clave de siempre ("section"); las demás usan "section.N".
  const sectionKey = unit.n === 2 ? "section" : `section.${unit.n}`;
  const section = unit.sections.find((s) => s.id === progress.ui[sectionKey]) ?? unit.sections[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/facultad/${subjectId}`} className="flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-700"><ArrowLeft size={15} aria-hidden="true" /> Volver a la materia</Link>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Sandbox</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-100">Sintaxis y Semántica de los Lenguajes</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Practicá los ejercicios de la guía: ejemplo resuelto, ejercicios de a uno, herramientas para calcular, editor de autómatas y comprobación de tus respuestas.</p>
        </div>
        {saveFailed && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Este navegador no deja guardar el progreso: todo funciona, pero se pierde al recargar.</p>}
        <div className="scrollbar-thin w-0 min-w-full overflow-x-auto pb-1">
          <div className="flex w-max gap-2" role="group" aria-label="Unidades">
            {UNITS.map((u) => (
              <Link key={u.n} href={`/facultad/${subjectId}/sandbox/${u.n}`} scroll={false} aria-current={unit.n === u.n ? "page" : undefined} className={chip(unit.n === u.n)}>
                Unidad {u.n}{isActive(u) ? "" : " · Próximamente"}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {active ? (
        <>
          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Unidad {unit.n} · {unit.title}</p>
            <div className="scrollbar-thin w-0 min-w-full overflow-x-auto pb-1">
              <div className="flex w-max gap-2" role="group" aria-label={`Tipos de ejercicio de la Unidad ${unit.n}`}>
                {unit.sections.map((s) => (
                  <button key={s.id} type="button" aria-pressed={s.id === section.id} onClick={() => setUi(sectionKey, s.id)} className={chip(s.id === section.id)}>
                    {s.title} <span className="opacity-60">· {countDone(progress, s.exercises.map((e) => e.id))}/{s.exercises.length}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <SectionView key={`${unit.n}.${section.id}`} section={section} store={store} />
        </>
      ) : (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Hourglass size={32} className="text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
          <p className="text-lg font-semibold">Unidad {unit.n}: próximamente</p>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{unit.title}. Todavía no hay ejercicios cargados para esta unidad.</p>
        </Card>
      )}
    </div>
  );
}
