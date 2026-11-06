import { useId, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { ALL_FILTER, facultyGroups, inputClass, subjectLabel } from "@/lib/faculty";

// Para buscar sin importar mayúsculas ni tildes ("algebra" encuentra "Álgebra").
const normalize = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Selector múltiple de correlativas: un botón visible que abre debajo la búsqueda y la lista; las elegidas
// quedan como chips. `disabled` mapea id -> motivo (por ejemplo "incluida en aprobada").
export function RequirementPicker({ label, candidates, selected, onChange, disabled = {} }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelId = useId();

  const byId = new Map(candidates.map((subject) => [subject.id, subject]));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const needle = normalize(query.trim());
  const visible = candidates.filter((subject) => !needle || normalize(subject.name).includes(needle) || normalize(subject.code ?? "").includes(needle));
  // Mismos grupos que el filtro "Todas": curriculares por año y las electivas al final.
  const groups = facultyGroups(visible, ALL_FILTER);
  const chosen = selected.filter((id) => byId.has(id));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 hover:border-lime-500 hover:text-zinc-950 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-lime-400"
      >
        <span className="flex items-center gap-1.5"><Plus size={15} className="shrink-0 text-lime-600 dark:text-lime-400" />{label}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
          {chosen.length > 0 && `${chosen.length} elegida${chosen.length === 1 ? "" : "s"}`}
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div id={panelId} className="mt-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
          {candidates.length === 0 ? (
            <p className="px-1 py-2 text-xs text-zinc-400">Cargá primero las materias correlativas</p>
          ) : (
            <>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
                placeholder="Buscar por nombre o código"
                aria-label={`Buscar: ${label}`}
                autoFocus
                className={inputClass}
              />
              <div role="listbox" aria-multiselectable="true" aria-label={label} className="scrollbar-thin mt-2 max-h-56 overflow-y-auto pr-1">
                {groups.length === 0 && <p className="px-2 py-2 text-xs text-zinc-400">No hay materias que coincidan.</p>}
                {groups.map((group) => (
                  <div key={group.key}>
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{group.title}</p>
                    {group.items.map((subject) => {
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
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800"
                        >
                          <span className="min-w-0 truncate">{subjectLabel(subject)}</span>
                          {reason ? <span className="shrink-0 text-[11px] text-zinc-400">{reason}</span> : isSelected && <Check size={15} className="shrink-0 text-lime-600" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">Listo</button>
              </div>
            </>
          )}
        </div>
      )}

      {chosen.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chosen.map((id) => (
            <span key={id} className="flex max-w-full items-center gap-1 rounded-full bg-lime-100 py-1 pl-2.5 pr-1 text-xs font-medium text-lime-900 dark:bg-lime-400/15 dark:text-lime-200">
              <span className="truncate">{subjectLabel(byId.get(id))}</span>
              <button type="button" onClick={() => toggle(id)} aria-label={`Quitar ${byId.get(id).name}`} className="grid h-5 w-5 shrink-0 place-items-center rounded-full hover:bg-lime-200 dark:hover:bg-lime-400/20">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
