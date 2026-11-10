"use client";

import { notFound, useParams } from "next/navigation";
import { useRouteSubject } from "@/components/faculty/faculty-detail-page";
import { AgaSandbox } from "@/components/aga/aga-sandbox";
import { SslSandbox } from "@/components/ssl/ssl-sandbox";
import { UNITS } from "@/lib/ssl/units";
import { UNITS as AGA_UNITS } from "@/lib/aga/index";
import { isAgaSubject } from "@/lib/aga/subject";
import { isSslSubject } from "@/lib/ssl/subject";

// Rutas "/facultad/[id]/sandbox" y "/facultad/[id]/sandbox/[unidad]": el sandbox (SSL o Álgebra) de una materia.
export function FacultySandboxPage() {
  const { unidad } = useParams();
  const subject = useRouteSubject();
  if (!subject) return null;
  if (isAgaSubject(subject)) {
    const agaUnit = unidad === undefined ? undefined : Number(unidad);
    if (agaUnit !== undefined && (String(agaUnit) !== unidad || !AGA_UNITS.some((unit) => unit.n === agaUnit))) notFound();
    return <AgaSandbox subjectId={subject.id} unitNumber={agaUnit} />;
  }
  if (!isSslSubject(subject)) notFound();
  let unitNumber;
  if (unidad !== undefined) {
    unitNumber = Number(unidad);
    if (String(unitNumber) !== unidad || !UNITS.some((unit) => unit.n === unitNumber)) notFound();
  }
  return <SslSandbox subjectId={subject.id} unitNumber={unitNumber} />;
}
