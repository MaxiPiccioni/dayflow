"use client";

import { notFound, useParams } from "next/navigation";
import { useRouteSubject } from "@/components/faculty/faculty-detail-page";
import { SslSandbox } from "@/components/ssl/ssl-sandbox";
import { UNITS } from "@/lib/ssl/units";
import { isSslSubject } from "@/lib/ssl/subject";

// Rutas "/facultad/[id]/sandbox" y "/facultad/[id]/sandbox/[unidad]": el sandbox de SSL de una materia.
export function FacultySandboxPage() {
  const { unidad } = useParams();
  const subject = useRouteSubject();
  if (!subject) return null;
  if (!isSslSubject(subject)) notFound();
  let unitNumber;
  if (unidad !== undefined) {
    unitNumber = Number(unidad);
    if (String(unitNumber) !== unidad || !UNITS.some((unit) => unit.n === unitNumber)) notFound();
  }
  return <SslSandbox subjectId={subject.id} unitNumber={unitNumber} />;
}
