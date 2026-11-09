"use client";

import { Plus, Settings2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { useFaculty } from "@/components/faculty/faculty-provider";
import { SubjectManagerModal } from "@/components/faculty/subject-manager-modal";
import { ELECTIVES_FILTER, ALL_FILTER } from "@/lib/faculty";

export function FacultyHeader() {
  const { subjects, setManager } = useFaculty();
  return (
    <CardHeader
      eyebrow="Facultad"
      title="Mi carrera"
      action={subjects && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setManager({ initialForm: {} })} className="flex items-center gap-1 rounded-xl bg-lime-200 px-3 py-2 text-sm font-semibold text-lime-950"><Plus size={15} /> Agregar materia</button>
          <button type="button" onClick={() => setManager({ initialForm: null })} aria-label="Administrar materias" title="Administrar materias" className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-zinc-100"><Settings2 size={17} /></button>
        </div>
      )}
    />
  );
}

// Marco de /facultad/*: mientras las materias no cargan (o fallan) muestra el estado en una tarjeta y, cuando están,
// deja pasar la ruta y agrega el modal de administración de materias.
export function FacultyFrame({ children }) {
  const { subjects, loadError, retry, filter, manager, setManager, saveSubject, deleteSubject, reorderSubjects } = useFaculty();

  if (loadError) {
    return (
      <Card>
        <FacultyHeader />
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p role="alert" className="text-sm text-red-600">{loadError}</p>
          <button type="button" onClick={retry} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-950">Reintentar</button>
        </div>
      </Card>
    );
  }
  if (!subjects) {
    return <Card><FacultyHeader /><p className="py-8 text-center text-sm text-zinc-400">Cargando materias…</p></Card>;
  }

  const filterIsLevel = filter !== ALL_FILTER && filter !== ELECTIVES_FILTER;
  return (
    <>
      {children}
      {manager && (
        <SubjectManagerModal
          subjects={subjects}
          initialForm={manager.initialForm}
          defaultLevel={filterIsLevel ? Number(filter) : 1}
          onSave={saveSubject}
          onDelete={deleteSubject}
          onReorder={reorderSubjects}
          close={() => setManager(null)}
        />
      )}
    </>
  );
}
