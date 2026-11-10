"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AlgebraView } from "@/components/aga/algebra-view";
import { ExerciseHeader } from "@/components/aga/exercise-header";
import { MatrixView } from "@/components/aga/matrix-view";
import { PlaneView } from "@/components/aga/plane-view";
import { ResolutionPanel } from "@/components/aga/resolution-panel";
import { useAgaSession } from "@/components/aga/use-aga-session";
import { SandboxPopup } from "@/components/ssl/frame/sandbox-popup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNITS } from "@/lib/aga/index";
import { exerciseTitle } from "@/lib/aga/scene";

const panel = "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";
const arrow = "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";
const PANES = [["center", "Ejercicio"], ["right", "Resolución"]];

// Una unidad del sandbox: el ejercicio, la vista algebraica y el gráfico (o los pasos) en el centro, y la resolución y las
// propiedades a la derecha; en pantallas angostas se ven de a una.
function UnitSandbox({ unit, subjectId, router }) {
  const session = useAgaSession(unit.n);
  const { ex, list, exIndex, mat, sel, objs, item } = session;
  const [pane, setPane] = useState("center");
  const selectedObj = objs.find((o) => o.name === sel);
  const show = (id) => (pane === id ? "" : "max-lg:hidden");

  const unitSelect = (
    <Select value={String(unit.n)} onValueChange={(value) => router.push(`/facultad/${subjectId}/sandbox/${value}`, { scroll: false })}>
      <SelectTrigger className="w-44 max-sm:w-32" aria-label="Elegir unidad"><SelectValue /></SelectTrigger>
      <SelectContent>{UNITS.map((u) => <SelectItem key={u.n} value={String(u.n)}>Unidad {u.n}</SelectItem>)}</SelectContent>
    </Select>
  );
  const picker = (
    <div className="flex min-w-0 items-center gap-1.5">
      <Select value={String(exIndex)} onValueChange={(value) => session.openEx(Number(value))}>
        <SelectTrigger className="w-56 max-sm:w-36" aria-label="Elegir ejercicio"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">
          {list.map((e, i) => <SelectItem key={e.id} value={String(i)}>{e.kind === "ej" ? `Ej ${e.n}` : e.num} · {e.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <button type="button" onClick={() => session.openEx(exIndex - 1)} disabled={exIndex === 0} aria-label="Ejercicio anterior" className={arrow}><ChevronLeft size={16} aria-hidden="true" /></button>
      <button type="button" onClick={() => session.openEx(exIndex + 1)} disabled={exIndex === list.length - 1} aria-label="Ejercicio siguiente" className={arrow}><ChevronRight size={16} aria-hidden="true" /></button>
      <span className="hidden truncate rounded-full border border-zinc-200 px-2 font-mono text-[10.5px] text-zinc-500 lg:inline dark:border-zinc-700">{exerciseTitle(ex)} · {ex.tag}</span>
    </div>
  );

  return (
    <SandboxPopup title="Sandbox · Álgebra y Geometría" onClose={() => router.push(`/facultad/${subjectId}`)} headerExtra={<>{unitSelect}{picker}</>}>
      {session.saveFailed && <p role="status" className="shrink-0 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Este navegador no deja guardar el progreso: todo funciona, pero se pierde al recargar.</p>}
      <div className="grid min-h-0 flex-1 gap-2.5 p-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(250px,310px)]">
        <section aria-label="Ejercicio" className={`${panel} ${show("center")}`}>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ExerciseHeader session={session} />
            <AlgebraView session={session} />
            <div className={`flex flex-col border-t border-zinc-200 dark:border-zinc-800 ${mat ? "" : "h-[55vh] min-h-80"}`}>
              {mat ? <MatrixView obj={selectedObj} objs={objs} dec={!!item.dec} /> : <PlaneView session={session} />}
            </div>
          </div>
        </section>
        <section aria-label="Resolución y propiedades" className={`${panel} ${show("right")}`}><ResolutionPanel session={session} /></section>
      </div>
      <nav aria-label="Paneles" className="grid shrink-0 grid-cols-2 gap-1.5 px-2.5 pb-2.5 lg:hidden">
        {PANES.map(([id, text]) => (
          <button key={id} type="button" aria-pressed={pane === id} onClick={() => setPane(id)} className={`rounded-xl border px-2 py-2 text-sm font-semibold ${pane === id ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 dark:border-zinc-700"}`}>{text}</button>
        ))}
      </nav>
    </SandboxPopup>
  );
}

// Sandbox de Álgebra y Geometría Analítica: un popup a pantalla completa por materia. La unidad abierta es una ruta
// (/facultad/[id]/sandbox/[unidad]); cerrarlo vuelve a la materia.
export function AgaSandbox({ subjectId, unitNumber = 1 }) {
  const router = useRouter();
  const unit = UNITS.find((u) => u.n === unitNumber) ?? UNITS[0];
  return <UnitSandbox key={unit.n} unit={unit} subjectId={subjectId} router={router} />;
}
