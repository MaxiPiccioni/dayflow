import { ArrowLeft, Hourglass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionView } from "@/components/ssl/section-view";
import { useSslProgress } from "@/components/ssl/use-ssl-progress";
import { COMING_UNITS, UNIT2_SECTIONS } from "@/lib/ssl/unit2";
import { countDone } from "@/lib/ssl/progress";

const chip = (active) => `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`;
const UNITS = [2, ...COMING_UNITS];

// Sandbox de Sintaxis y Semántica de los Lenguajes: pestañas por unidad; hoy solo la Unidad 2 tiene práctico.
export function SslSandbox({ onBack }) {
  const store = useSslProgress();
  const { progress, saveFailed, setUi } = store;
  const unit = UNITS.includes(progress.ui.unit) ? progress.ui.unit : 2;
  const sectionId = UNIT2_SECTIONS.some((s) => s.id === progress.ui.section) ? progress.ui.section : UNIT2_SECTIONS[0].id;
  const section = UNIT2_SECTIONS.find((s) => s.id === sectionId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-700"><ArrowLeft size={15} aria-hidden="true" /> Volver a la materia</button>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Sandbox</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-100">Sintaxis y Semántica de los Lenguajes</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Practicá los ejercicios de la guía: ejemplo resuelto, ejercicios de a uno, herramientas para calcular y comprobación de tus respuestas.</p>
        </div>
        {saveFailed && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Este navegador no deja guardar el progreso: todo funciona, pero se pierde al recargar.</p>}
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex w-max gap-2" role="group" aria-label="Unidades">
            {UNITS.map((n) => (
              <button key={n} type="button" aria-pressed={unit === n} onClick={() => setUi("unit", n)} className={chip(unit === n)}>
                Unidad {n}{COMING_UNITS.includes(n) ? " · Próximamente" : ""}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {unit === 2 ? (
        <>
          <Card>
            <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-1">
              <div className="flex w-max gap-2" role="group" aria-label="Tipos de ejercicio de la Unidad 2">
                {UNIT2_SECTIONS.map((s) => (
                  <button key={s.id} type="button" aria-pressed={s.id === sectionId} onClick={() => setUi("section", s.id)} className={chip(s.id === sectionId)}>
                    {s.title} <span className="opacity-60">· {countDone(progress, s.exercises.map((e) => e.id))}/{s.exercises.length}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <SectionView key={section.id} section={section} store={store} />
        </>
      ) : (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Hourglass size={32} className="text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
          <p className="text-lg font-semibold">Unidad {unit}: próximamente</p>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">Todavía no hay ejercicios cargados para esta unidad.</p>
        </Card>
      )}
    </div>
  );
}
