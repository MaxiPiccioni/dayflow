import { useEffect, useId, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { inputClass, levelLabel, subjectLabel } from "@/lib/faculty";

// Para buscar sin importar mayúsculas ni tildes ("algebra" encuentra "Álgebra").
const normalize = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Selector múltiple de correlativas con búsqueda por nombre o código.
// `disabled` mapea id -> motivo (por ejemplo "incluida en aprobada").
export function RequirementPicker({ label, candidates, selected, onChange, disabled = {} }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const byId = new Map(candidates.map((subject) => [subject.id, subject]));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const needle = normalize(query.trim());
  const visible = candidates.filter((subject) => !needle || normalize(subject.name).includes(needle) || normalize(subject.code ?? "").includes(needle));
  const levels = [...new Set(visible.map((subject) => subject.level))];

  return (
    <div ref={rootRef} className="relative">
      <p className="text-xs text-zinc-500">{label}</p>
      {candidates.length === 0 ? (
        <p className="mt-1 rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700">Cargá primero las materias correlativas</p>
      ) : (
        <>
          {selected.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {selected.filter((id) => byId.has(id)).map((id) => (
                <span key={id} className="flex max-w-full items-center gap-1 rounded-full bg-lime-100 py-1 pl-2.5 pr-1 text-xs font-medium text-lime-900 dark:bg-lime-400/15 dark:text-lime-200">
                  <span className="truncate">{subjectLabel(byId.get(id))}</span>
                  <button type="button" onClick={() => toggle(id)} aria-label={`Quitar ${byId.get(id).name}`} className="grid h-5 w-5 shrink-0 place-items-center rounded-full hover:bg-lime-200 dark:hover:bg-lime-400/20">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
            placeholder="Buscar por nombre o código"
            aria-label={label}
            aria-expanded={open}
            aria-controls={listId}
            role="combobox"
            className={`${inputClass} mt-1`}
          />
          {open && (
            <div id={listId} role="listbox" aria-multiselectable="true" aria-label={label} className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {visible.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">No hay materias que coincidan.</p>}
              {levels.map((level) => (
                <div key={level}>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{levelLabel(level)}</p>
                  {visible.filter((subject) => subject.level === level).map((subject) => {
                    const reason = disabled[subject.id];
                    const isSelected = selected.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={Boolean(reason)}
                        disabled={Boolean(reason)}
                        onClick={() => toggle(subject.id)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800"
                      >
                        <span className="min-w-0 truncate">{subjectLabel(subject)}</span>
                        {reason ? <span className="shrink-0 text-[11px] text-zinc-400">{reason}</span> : isSelected && <Check size={15} className="shrink-0 text-lime-600" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
