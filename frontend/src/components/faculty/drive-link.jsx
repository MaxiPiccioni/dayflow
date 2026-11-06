import { useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { inputClass, isValidLinkUrl, LINK_ERROR } from "@/lib/faculty";

// Link a la carpeta de Drive (de una materia o de una de sus carpetas). Con link: botón "Abrir en Drive"
// (otra pestaña) más editar y quitar. Sin link: "Agregar link de Drive", que abre un campo para pegarlo.
// onSave(url) recibe la URL o null para quitarla y devuelve una promesa; si falla, el error queda en el formulario.
export function DriveLink({ url, onSave, label = "Drive" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const startEditing = () => { setDraft(url ?? ""); setError(""); setEditing(true); };

  const submit = (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!isValidLinkUrl(value)) { setError(LINK_ERROR); return; }
    setBusy(true);
    setError("");
    onSave(value)
      .then(() => setEditing(false))
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  };

  const remove = () => {
    setBusy(true);
    setError("");
    onSave(null)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="w-full space-y-2">
        <label className="block text-xs text-zinc-500">
          Link de Drive ({label})
          <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="https://drive.google.com/…" inputMode="url" aria-label={`Link de Drive (${label})`} className={`${inputClass} mt-1`} />
        </label>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 dark:bg-lime-400 dark:text-zinc-950">{busy ? "Guardando…" : "Guardar link"}</button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700">Cancelar</button>
        </div>
      </form>
    );
  }

  // Si por algún motivo lo guardado no es http/https, no se muestra como link: solo se puede reemplazar o quitar.
  const openable = url && isValidLinkUrl(url);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {openable && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-xl bg-lime-200 px-3 py-2 text-sm font-semibold text-lime-950 hover:bg-lime-300">
          <ExternalLink size={15} /> Abrir en Drive
        </a>
      )}
      {!url && (
        <button type="button" onClick={startEditing} className="flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:border-lime-500 hover:text-zinc-950 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-lime-400">
          <Plus size={15} /> Agregar link de Drive
        </button>
      )}
      {url && (
        <>
          <button type="button" onClick={startEditing} disabled={busy} aria-label={`Editar link de Drive (${label})`} title="Editar link" className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:hover:text-zinc-100"><Pencil size={14} /></button>
          <button type="button" onClick={remove} disabled={busy} aria-label={`Quitar link de Drive (${label})`} title="Quitar link" className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-red-500 disabled:opacity-50 dark:border-zinc-700"><Trash2 size={14} /></button>
        </>
      )}
      {error && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
