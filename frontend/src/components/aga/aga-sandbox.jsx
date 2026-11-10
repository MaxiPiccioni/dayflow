"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExercisePanel } from "@/components/aga/exercise-panel";
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
const PANES = [["left", "Ejercicio"], ["center", null], ["right", "Resolución"]];

// Una unidad del sandbox: tres columnas (ejercicio y vista algebraica · gráfico o pasos · resolución y propiedades) que en
// pantallas angostas pasan a verse de a una.
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
      <div className="grid min-h-0 flex-1 gap-2.5 p-2.5 lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)_minmax(250px,310px)]">
        <section aria-label="Ejercicio y vista algebraica" className={`${panel} ${show("left")}`}><ExercisePanel session={session} /></section>
        <section aria-label={mat ? "Pasos y propiedades" : "Vista gráfica"} className={`${panel} ${show("center")}`}>
          {mat ? <MatrixView obj={selectedObj} objs={objs} dec={!!item.dec} /> : <PlaneView session={session} />}
        </section>
        <section aria-label="Resolución y propiedades" className={`${panel} ${show("right")}`}><ResolutionPanel session={session} /></section>
      </div>
      <nav aria-label="Paneles" className="grid shrink-0 grid-cols-3 gap-1.5 px-2.5 pb-2.5 lg:hidden">
        {PANES.map(([id, text]) => (
          <button key={id} type="button" aria-pressed={pane === id} onClick={() => setPane(id)} className={`rounded-xl border px-2 py-2 text-sm font-semibold ${pane === id ? "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950" : "border-zinc-200 dark:border-zinc-700"}`}>{text ?? (mat ? "Pasos" : "Gráfico")}</button>
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
