"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { inputClass } from "@/lib/faculty";

// Minúsculas y sin tildes, para que "algebra" encuentre "Álgebra".
const normalize = (text) => String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Selector de materia con buscador. `value` es el id como texto ("" = sin materia).
export function SubjectSearchSelect({ label, value, onChange, subjects }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const selected = subjects.find((subject) => String(subject.id) === String(value));
  const matches = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return subjects;
    return subjects.filter((subject) => normalize(subject.name).includes(needle) || normalize(subject.code).includes(needle));
  }, [subjects, query]);

  const choose = (next) => { onChange(next); setOpen(false); setQuery(""); };
  const optionClass = (active) => `block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${active ? "bg-zinc-100 font-medium dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`;

  return (
    <div ref={rootRef} className="relative text-xs text-zinc-500">
      <span>{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={`${inputClass} mt-1 flex items-center justify-between gap-2 text-left ${selected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>
        <span className="truncate">{selected ? selected.name : "Sin materia"}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="relative p-1">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar materia" aria-label="Buscar materia" className={`${inputClass} pl-8`} />
          </div>
          <div role="listbox" className="scrollbar-thin max-h-56 overflow-y-auto">
            {!query.trim() && <button type="button" role="option" aria-selected={!selected} onClick={() => choose("")} className={optionClass(!selected)}>Sin materia</button>}
            {matches.map((subject) => (
              <button type="button" role="option" aria-selected={String(subject.id) === String(value)} key={subject.id} onClick={() => choose(String(subject.id))} className={optionClass(String(subject.id) === String(value))}>
                {subject.name}
                {subject.level && <span className="ml-2 text-xs font-normal text-zinc-400">{subject.level}° año</span>}
              </button>
            ))}
            {matches.length === 0 && <p className="px-3 py-3 text-center text-sm text-zinc-400">No hay materias con ese nombre</p>}
          </div>
        </div>
      )}
    </div>
  );
}
