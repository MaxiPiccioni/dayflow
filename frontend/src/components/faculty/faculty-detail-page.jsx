"use client";

import { notFound, useParams } from "next/navigation";
import { useFaculty } from "@/components/faculty/faculty-provider";
import { SubjectDetail } from "@/components/faculty/subject-detail";

// Busca la materia de la ruta /facultad/[id]. Si no existe, 404 (salvo que acabe de borrarse y se esté volviendo a la lista).
export function useRouteSubject() {
  const { id } = useParams();
  const { subjects, leavingId } = useFaculty();
  const subject = subjects.find((item) => String(item.id) === id);
  if (!subject && String(leavingId) !== id) notFound();
  return subject ?? null;
}

// Ruta "/facultad/[id]": detalle de una materia.
export function FacultyDetailPage() {
  const subject = useRouteSubject();
  const { subjects, study, setManager, applySubject, applyNotes } = useFaculty();
  if (!subject) return null;
  return (
    <SubjectDetail
      key={subject.id}
      subject={subject}
      subjects={subjects}
      onEdit={() => setManager({ initialForm: subject })}
      onChange={applySubject}
      onNotesSaved={applyNotes}
      study={study[subject.id]}
    />
  );
}
