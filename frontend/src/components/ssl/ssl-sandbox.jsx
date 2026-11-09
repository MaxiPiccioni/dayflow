"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hourglass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SandboxFrame } from "@/components/ssl/frame/sandbox-frame";
import { SandboxPopup } from "@/components/ssl/frame/sandbox-popup";
import { useSslProgress } from "@/components/ssl/use-ssl-progress";
import { UNITS, isActive, unitByNumber } from "@/lib/ssl/units";

function SoonUnit({ unit }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center p-4">
      <Card className="flex flex-col items-center gap-2 py-10 text-center">
        <Hourglass size={32} className="text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
        <p className="text-lg font-semibold">Unidad {unit.n}: próximamente</p>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{unit.title}. Todavía no hay ejercicios cargados para esta unidad.</p>
      </Card>
    </div>
  );
}

// Sandbox de Sintaxis y Semántica de los Lenguajes: un popup a pantalla completa por materia. La unidad abierta es una
// ruta (/facultad/[id]/sandbox/[unidad]); sin unidad en la ruta se muestra la última que se usó. Cerrarlo vuelve a la materia.
export function SslSandbox({ subjectId, unitNumber }) {
  const router = useRouter();
  const store = useSslProgress();
  const { progress, saveFailed, setUi } = store;
  const unit = unitByNumber(unitNumber ?? progress.ui.unit) ?? UNITS[0];
  // La unidad abierta por la ruta queda como "la última que se usó".
  useEffect(() => {
    if (unitNumber !== undefined && progress.ui.unit !== unitNumber) setUi("unit", unitNumber);
  }, [unitNumber, progress.ui.unit, setUi]);

  const close = () => router.push(`/facultad/${subjectId}`);
  const unitSelect = (
    <Select value={String(unit.n)} onValueChange={(value) => router.push(`/facultad/${subjectId}/sandbox/${value}`, { scroll: false })}>
      <SelectTrigger className="w-44 max-sm:w-32" aria-label="Elegir unidad"><SelectValue /></SelectTrigger>
      <SelectContent>
        {UNITS.map((u) => <SelectItem key={u.n} value={String(u.n)}>Unidad {u.n}{isActive(u) ? "" : " · Próximamente"}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <SandboxPopup title="Sandbox · Sintaxis y Semántica" onClose={close} headerExtra={unitSelect}>
      {saveFailed && <p role="status" className="shrink-0 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Este navegador no deja guardar el progreso: todo funciona, pero se pierde al recargar.</p>}
      {!isActive(unit) ? <SoonUnit unit={unit} /> : <SandboxFrame key={unit.n} unit={unit} store={store} />}
    </SandboxPopup>
  );
}
