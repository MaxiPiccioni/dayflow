import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, FolderOpen, Link as LinkIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/faculty/confirm-dialog";
import { DriveLink } from "@/components/faculty/drive-link";
import { api } from "@/lib/api";
import { inputClass, isGoogleDocsLink, isValidLinkUrl, LINK_ERROR, linkDomain } from "@/lib/faculty";

const smallButton = "grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

// Formulario de archivo (alta y edición): link requerido y nombre opcional (si queda vacío, el dominio).
function LinkForm({ link, onSave, onCancel }) {
  const [url, setUrl] = useState(link?.url ?? "");
  const [title, setTitle] = useState(link?.title ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const cleanUrl = url.trim();
    if (!isValidLinkUrl(cleanUrl)) { setError(LINK_ERROR); return; }
    setBusy(true);
    setError("");
    onSave({ url: cleanUrl, title: title.trim() || linkDomain(cleanUrl) }).catch((err) => { setError(err.message); setBusy(false); });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
      <label className="block text-xs text-zinc-500">
        Link
        <input autoFocus value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://drive.google.com/…" inputMode="url" aria-label="Link del archivo" className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-xs text-zinc-500">
        Nombre (opcional)
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Si lo dejás vacío se usa el dominio" aria-label="Nombre del archivo" className={`${inputClass} mt-1`} />
      </label>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 dark:bg-lime-400 dark:text-zinc-950">{busy ? "Guardando…" : link ? "Guardar cambios" : "Agregar archivo"}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-700">Cancelar</button>
      </div>
    </form>
  );
}

// Vista de una carpeta dentro del detalle: link de Drive de la carpeta y lista de archivos (links).
// Cada cambio va al backend y onChange recibe la materia actualizada.
export function FolderView({ subject, folder, onBack, onChange }) {
  const [form, setForm] = useState(null); // { link } con link null para uno nuevo
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");

  const saveDrive = (url) => api(`/faculty/folders/${folder.id}`, { method: "PATCH", body: JSON.stringify({ drive_url: url }) }).then(onChange);

  const saveLink = (payload) => {
    const request = form.link
      ? api(`/faculty/links/${form.link.id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : api(`/faculty/folders/${folder.id}/links`, { method: "POST", body: JSON.stringify(payload) });
    return request.then((updated) => { onChange(updated); setForm(null); });
  };

  const moveLink = (index, delta) => {
    const ids = folder.links.map((link) => link.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    setError("");
    api(`/faculty/folders/${folder.id}/links/order`, { method: "PUT", body: JSON.stringify({ ids }) }).then(onChange).catch((err) => setError(err.message));
  };

  // El DELETE no devuelve la materia: se arma localmente sin el archivo borrado.
  const deleteLink = () => api(`/faculty/links/${deleteTarget.id}`, { method: "DELETE" }).then(() => {
    onChange({ ...subject, folders: subject.folders.map((item) => (item.id === folder.id ? { ...item, links: item.links.filter((link) => link.id !== deleteTarget.id) } : item)) });
    setDeleteTarget(null);
  });

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"><ArrowLeft size={14} /> Volver a las carpetas</button>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Carpeta</p>
        <h3 className="mt-1 break-words text-lg font-semibold uppercase tracking-wide">{folder.name}</h3>
      </div>

      <DriveLink key={folder.id} url={folder.drive_url} onSave={saveDrive} label={folder.name} />

      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="text-sm font-semibold">Archivos</p>
        {!form && <button type="button" onClick={() => setForm({ link: null })} className="flex items-center gap-1 rounded-xl bg-lime-200 px-3 py-1.5 text-sm font-semibold text-lime-950"><Plus size={14} /> Agregar archivo</button>}
      </div>

      {form && !form.link && <LinkForm key="new" link={null} onSave={saveLink} onCancel={() => setForm(null)} />}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {folder.links.length === 0 && !form ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FolderOpen size={36} className="text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-400">Todavía no hay archivos. Pegá un link de Drive con «Agregar archivo».</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {folder.links.map((link, index) => (
            <li key={link.id}>
              {form?.link?.id === link.id ? (
                <LinkForm key={link.id} link={link} onSave={saveLink} onCancel={() => setForm(null)} />
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
                  {/* Solo se abre como link si es http/https: aunque se guardara otra cosa, nunca va a un href. */}
                  {isValidLinkUrl(link.url) ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                      <LinkFileIcon url={link.url} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{link.title}</span>
                        <span className="block truncate text-xs text-zinc-400">{linkDomain(link.url)}</span>
                      </span>
                    </a>
                  ) : (
                    <span className="flex min-w-0 flex-1 items-center gap-3 px-1 py-1">
                      <LinkIcon size={18} className="shrink-0 text-zinc-400" />
                      <span className="truncate text-sm">{link.title}</span>
                    </span>
                  )}
                  <div className="flex shrink-0 items-center">
                    <button type="button" onClick={() => moveLink(index, -1)} disabled={index === 0} aria-label={`Subir ${link.title}`} className={smallButton}><ChevronUp size={16} /></button>
                    <button type="button" onClick={() => moveLink(index, 1)} disabled={index === folder.links.length - 1} aria-label={`Bajar ${link.title}`} className={smallButton}><ChevronDown size={16} /></button>
                    <button type="button" onClick={() => setForm({ link })} aria-label={`Editar ${link.title}`} className={smallButton}><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeleteTarget(link)} aria-label={`Eliminar ${link.title}`} className={`${smallButton} hover:text-red-500`}><Trash2 size={14} /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`¿Eliminar ${deleteTarget.title}?`}
          message="Se quita el link de esta carpeta. El archivo en sí no se borra de Drive."
          onConfirm={deleteLink}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// Ícono del archivo: documento si es de Google Docs/Drive, link genérico si no.
function LinkFileIcon({ url }) {
  const Icon = isGoogleDocsLink(url) ? FileText : LinkIcon;
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"><Icon size={18} /></span>;
}
