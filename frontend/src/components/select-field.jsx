"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { inputClass } from "@/lib/faculty";

// Selector con lista desplegable que usan los formularios de tareas, eventos, finanzas y ahorros.
export function SelectField({ label, value, onChange, options, placeholder = "Seleccionar..." }) {
  const [open, setOpen] = useState(false);
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  const selected = normalized.find((option) => option.value === value);
  return (
    <div className="relative text-xs text-zinc-500">
      <span>{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`${inputClass} mt-1 flex items-center justify-between text-left ${selected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}
      >
        {selected?.label || placeholder}
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {normalized.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${option.value === value ? "bg-zinc-100 font-medium dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
