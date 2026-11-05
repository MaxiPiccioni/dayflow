import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/faculty/confirm-dialog";
import { StatusBadge, SubjectIcon } from "@/components/faculty/subject-card";
import { SubjectForm } from "@/components/faculty/subject-form";
import { levelLabel } from "@/lib/faculty";

const smallButton = "grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

// Administración de materias. `initialForm` abre directo el formulario ({} para una nueva o la materia a editar);
// en ese caso, cancelar cierra el modal en vez de volver a la lista.
export function SubjectManagerModal({ subjects, initialForm = null, defaultLevel, onSave, onDelete, onReorder, close }) {
  const [form, setForm] = useState(initialForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const directForm = initialForm !== null;

  const levels = [...new Set(subjects.map((subject) => subject.level))];
  const editing = form && form.id ? form : null;

  const save = (payload) => onSave(payload, editing).then(() => (directForm ? close() : setForm(null)));

  const move = (level, index, delta) => {
    const ids = subjects.filter((subject) => subject.level === level).map((subject) => subject.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    setError("");
    onReorder(level, ids).catch((err) => setError(err.message));
  };

  const title = form ? (editing ? "Editar materia" : "Agregar materia") : "Administrar materias";

  // El diálogo de confirmación va fuera del Modal: el panel animado con transform encerraría su overlay fijo.
  return (
    <>
      <Modal title={title} close={close}>
        {form ? (
          <SubjectForm key={editing?.id ?? "new"} subject={editing} defaultLevel={defaultLevel} onSave={save} onCancel={() => (directForm ? close() : setForm(null))} />
        ) : (
          <div className="mt-5 space-y-5">
            <button type="button" onClick={() => setForm({})} className="flex w-full items-center justify-center gap-1 rounded-xl bg-lime-200 px-4 py-2 text-sm font-semibold text-lime-950"><Plus size={15} /> Agregar materia</button>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {subjects.length === 0 && <p className="text-center text-sm text-zinc-400">Todavía no cargaste materias.</p>}
            {levels.map((level) => {
              const inLevel = subjects.filter((subject) => subject.level === level);
              return (
                <section key={level}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{levelLabel(level)}</h3>
                  <ul className="space-y-2">
                    {inLevel.map((subject, index) => (
                      <li key={subject.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
                        <SubjectIcon subject={subject} size={18} className="h-9 w-9 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{subject.name}</p>
                          <StatusBadge status={subject.status} />
                        </div>
                        <div className="flex shrink-0 items-center">
                          <button type="button" onClick={() => move(level, index, -1)} disabled={index === 0} aria-label={`Subir ${subject.name}`} className={smallButton}><ChevronUp size={16} /></button>
                          <button type="button" onClick={() => move(level, index, 1)} disabled={index === inLevel.length - 1} aria-label={`Bajar ${subject.name}`} className={smallButton}><ChevronDown size={16} /></button>
                          <button type="button" onClick={() => setForm(subject)} aria-label={`Editar ${subject.name}`} className={smallButton}><Pencil size={14} /></button>
                          <button type="button" onClick={() => setDeleteTarget(subject)} aria-label={`Eliminar ${subject.name}`} className={`${smallButton} hover:text-red-500`}><Trash2 size={14} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Modal>
      {deleteTarget && (
        <ConfirmDialog
          title={`¿Eliminar ${deleteTarget.name}?`}
          message={`Se van a borrar la materia y sus ${deleteTarget.folders.length} carpetas. Esta acción no se puede deshacer.`}
          onConfirm={() => onDelete(deleteTarget).then(() => setDeleteTarget(null))}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
