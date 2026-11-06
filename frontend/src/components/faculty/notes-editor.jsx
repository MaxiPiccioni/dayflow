import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { findLinks, inputClass } from "@/lib/faculty";

const SAVE_DELAY_MS = 800;
const STATUS_TEXT = { dirty: "Cambios sin guardar", saving: "Guardando…", saved: "Guardado" };

// Anotaciones de una materia con guardado automático. Se monta con key por materia, así que al salir
// del detalle (o pasar a otra materia) se desmonta y guarda lo que haya quedado pendiente.
export function NotesEditor({ subjectId, initialNotes, onSaved }) {
  const [draft, setDraft] = useState(initialNotes);
  const [status, setStatus] = useState("idle"); // idle | dirty | saving | saved | error
  const [error, setError] = useState("");
  const savedRef = useRef(initialNotes);
  const draftRef = useRef(initialNotes);
  const onSavedRef = useRef(onSaved);
  const textareaRef = useRef(null);

  useEffect(() => { onSavedRef.current = onSaved; }, [onSaved]);

  const request = useCallback((text) => api(`/faculty/subjects/${subjectId}/notes`, { method: "PATCH", body: JSON.stringify({ notes: text }) }).then((data) => {
    savedRef.current = data.notes;
    onSavedRef.current(data.notes);
    return data;
  }), [subjectId]);

  const save = useCallback((text) => {
    setStatus("saving");
    setError("");
    request(text)
      .then((data) => setStatus(draftRef.current === data.notes ? "saved" : "dirty"))
      .catch((err) => { setError(err.message); setStatus("error"); });
  }, [request]);

  // Guardado automático: un pedido 800 ms después de la última tecla, no uno por tecla.
  useEffect(() => {
    if (draft === savedRef.current) return undefined;
    const timer = window.setTimeout(() => save(draft), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft, save]);

  // Al desmontar (salir del detalle) se guarda lo pendiente.
  useEffect(() => () => {
    if (draftRef.current === savedRef.current) return;
    request(draftRef.current).catch((err) => console.warn("No se pudieron guardar las anotaciones al salir", err));
  }, [request]);

  // El textarea crece con el contenido.
  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [draft]);

  const change = (event) => {
    setDraft(event.target.value);
    draftRef.current = event.target.value;
    setStatus("dirty");
  };

  const links = findLinks(draft);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Anotaciones</p>
        {status === "error" ? (
          <span className="flex items-center gap-2 text-xs text-red-600">
            <span role="alert">No se guardó: {error}</span>
            <button type="button" onClick={() => save(draftRef.current)} className="rounded-lg border border-red-200 px-2 py-0.5 font-semibold dark:border-red-800">Reintentar</button>
          </span>
        ) : (
          <span aria-live="polite" className="text-xs text-zinc-400">{STATUS_TEXT[status] ?? ""}</span>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={change}
        maxLength={5000}
        rows={3}
        aria-label="Anotaciones"
        placeholder="Links, horarios, palabras sueltas…"
        className={`${inputClass} min-h-20 resize-none overflow-hidden leading-relaxed`}
      />
      {links.length > 0 && (
        <ul className="mt-2 space-y-1">
          {links.map((link) => (
            <li key={link} className="min-w-0">
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-sm text-lime-700 underline underline-offset-2 hover:text-lime-900 dark:text-lime-300 dark:hover:text-lime-200">
                <ExternalLink size={13} className="shrink-0" />
                <span className="truncate">{link}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
