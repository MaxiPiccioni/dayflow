import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Folder, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/faculty/confirm-dialog";
import { StatusBadge, SubjectIcon } from "@/components/faculty/subject-card";
import { api } from "@/lib/api";
import { allowsGrade, formatGrade, inputClass, levelLabel, STATUS, STATUS_KEYS } from "@/lib/faculty";

const smallButton = "grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

// Detalle de una materia dentro del panel. Cada cambio va al backend y onChange recibe la materia actualizada.
export function SubjectDetail({ subject, onBack, onEdit, onChange }) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [gradeDraft, setGradeDraft] = useState(null);
  const [openFolderId, setOpenFolderId] = useState(null);
  const [newFolder, setNewFolder] = useState("");
  const [renaming, setRenaming] = useState(null); // { id, name }
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Manda el pedido y aplica la materia que devuelve el backend; si falla, el mensaje queda en pantalla.
  const run = (request, after) => {
    setError("");
    request.then((updated) => { onChange(updated); after?.(updated); }).catch((err) => setError(err.message));
  };

  const changeStatus = (status) => {
    const hadGrade = subject.grade !== null;
    setNotice("");
    run(api(`/faculty/subjects/${subject.id}`, { method: "PATCH", body: JSON.stringify({ status }) }), (updated) => {
      if (hadGrade && updated.grade === null) setNotice(`Se borró la nota final (${formatGrade(subject.grade)}) porque "${STATUS[status].label}" no admite nota.`);
      setGradeDraft(null);
    });
  };

  const saveGrade = () => {
    if (gradeDraft === null) return;
    const grade = gradeDraft === "" ? null : Number(gradeDraft);
    if (grade === subject.grade) { setGradeDraft(null); return; }
    run(api(`/faculty/subjects/${subject.id}`, { method: "PATCH", body: JSON.stringify({ grade }) }), () => setGradeDraft(null));
  };

  const addFolder = (event) => {
    event.preventDefault();
    run(api(`/faculty/subjects/${subject.id}/folders`, { method: "POST", body: JSON.stringify({ name: newFolder }) }), () => setNewFolder(""));
  };

  const saveRename = (event) => {
    event.preventDefault();
    run(api(`/faculty/folders/${renaming.id}`, { method: "PATCH", body: JSON.stringify({ name: renaming.name }) }), () => setRenaming(null));
  };

  const moveFolder = (index, delta) => {
    const ids = subject.folders.map((folder) => folder.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    run(api(`/faculty/subjects/${subject.id}/folders/order`, { method: "PUT", body: JSON.stringify({ ids }) }));
  };

  // El DELETE no devuelve la materia: se arma localmente sin la carpeta borrada.
  const deleteFolder = () => api(`/faculty/folders/${deleteTarget.id}`, { method: "DELETE" }).then(() => {
    onChange({ ...subject, folders: subject.folders.filter((folder) => folder.id !== deleteTarget.id) });
    if (openFolderId === deleteTarget.id) setOpenFolderId(null);
    setDeleteTarget(null);
  });

  const openFolder = subject.folders.find((folder) => folder.id === openFolderId);
  const gradeAllowed = allowsGrade(subject.status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-700"><ArrowLeft size={15} /> Volver</button>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-950"><Pencil size={14} /> Editar materia</button>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SubjectIcon subject={subject} size={36} className="h-20 w-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{levelLabel(subject.level)}</p>
            <h2 className="mt-1 break-words text-xl font-semibold text-zinc-950 dark:text-zinc-100">{subject.name}</h2>
            <div className="mt-1"><StatusBadge status={subject.status} /></div>
          </div>
          <div className="grid gap-3 sm:w-64">
            <label className="block text-xs text-zinc-500">
              Estado
              <Select value={subject.status} onValueChange={changeStatus}>
                <SelectTrigger className="mt-1 w-full" aria-label="Estado de la materia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_KEYS.map((key) => <SelectItem key={key} value={key}>{STATUS[key].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            {gradeAllowed && (
              <label className="block text-xs text-zinc-500">
                Nota final
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.01"
                  placeholder="Sin nota"
                  value={gradeDraft ?? (subject.grade ?? "")}
                  onChange={(event) => setGradeDraft(event.target.value)}
                  onBlur={saveGrade}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  className={`${inputClass} mt-1`}
                />
              </label>
            )}
          </div>
        </div>
        {notice && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">{notice}</p>}
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      </Card>

      <Card>
        {openFolder ? (
          <div>
            <button type="button" onClick={() => setOpenFolderId(null)} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"><ArrowLeft size={14} /> Carpetas</button>
            <div className="mt-6 flex flex-col items-center gap-3 py-10 text-center">
              <FolderOpen size={40} className="text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-semibold uppercase tracking-wide">{openFolder.name}</p>
              <p className="text-sm text-zinc-400">Esta carpeta todavía no tiene contenido</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Carpetas</p>
                <h3 className="mt-1 text-lg font-semibold">{subject.folders.length} {subject.folders.length === 1 ? "carpeta" : "carpetas"}</h3>
              </div>
              <form onSubmit={addFolder} className="flex w-full gap-2 sm:w-auto">
                <input value={newFolder} onChange={(event) => setNewFolder(event.target.value)} required maxLength={60} placeholder="Nueva carpeta" className={`${inputClass} sm:w-48`} />
                <button type="submit" aria-label="Agregar carpeta" className="grid shrink-0 place-items-center rounded-xl bg-zinc-900 px-3 text-white dark:bg-lime-400 dark:text-zinc-950"><Plus size={16} /></button>
              </form>
            </div>
            {subject.folders.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {subject.folders.map((folder, index) => (
                  <div key={folder.id} className="flex flex-col rounded-2xl border border-zinc-200 p-2 dark:border-zinc-800">
                    {renaming?.id === folder.id ? (
                      <form onSubmit={saveRename} className="flex aspect-square flex-col justify-center gap-2">
                        <input autoFocus value={renaming.name} onChange={(event) => setRenaming({ ...renaming, name: event.target.value })} required maxLength={60} aria-label="Nuevo nombre de la carpeta" className={inputClass} />
                        <div className="flex gap-1">
                          <button type="submit" className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs font-semibold text-white dark:bg-lime-400 dark:text-zinc-950">Guardar</button>
                          <button type="button" onClick={() => setRenaming(null)} className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-xs dark:border-zinc-700">Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      <button type="button" onClick={() => setOpenFolderId(folder.id)} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                        <Folder size={40} strokeWidth={1.5} className="text-lime-600 dark:text-lime-400" />
                        <span className="line-clamp-2 break-words px-1 text-xs font-semibold uppercase tracking-wide">{folder.name}</span>
                      </button>
                    )}
                    <div className="mt-1 flex justify-center gap-0.5">
                      <button type="button" onClick={() => moveFolder(index, -1)} disabled={index === 0} aria-label={`Subir ${folder.name}`} className={smallButton}><ChevronUp size={15} /></button>
                      <button type="button" onClick={() => moveFolder(index, 1)} disabled={index === subject.folders.length - 1} aria-label={`Bajar ${folder.name}`} className={smallButton}><ChevronDown size={15} /></button>
                      <button type="button" onClick={() => setRenaming({ id: folder.id, name: folder.name })} aria-label={`Renombrar ${folder.name}`} className={smallButton}><Pencil size={13} /></button>
                      <button type="button" onClick={() => setDeleteTarget(folder)} aria-label={`Eliminar ${folder.name}`} className={`${smallButton} hover:text-red-500`}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-zinc-400">Esta materia no tiene carpetas. Agregá una arriba.</p>
            )}
          </>
        )}
      </Card>

      {deleteTarget && (
        <ConfirmDialog
          title={`¿Eliminar la carpeta ${deleteTarget.name}?`}
          message="La carpeta se va a borrar de esta materia."
          onConfirm={deleteFolder}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
