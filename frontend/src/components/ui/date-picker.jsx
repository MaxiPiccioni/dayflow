"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

function formatDisplayDate(value) {
  if (!value) return "Elegir fecha";
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-AR");
}

export function DatePicker({ value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-left text-sm outline-none focus:border-lime-500 dark:border-zinc-700"
      >
        <CalendarDays size={15} className="shrink-0 text-zinc-400" />
        <span>{formatDisplayDate(value)}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[300px] overflow-hidden rounded-xl bg-white/80 shadow-lg backdrop-blur-md dark:bg-zinc-900/80">
          <Calendar value={value} onChange={(next) => { onChange(next); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}
