"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/lib/faculty";

export function HabitModal({ habit, save, remove, close }) {
  const [form, setForm] = useState({ name: habit.name || "", target: habit.target || 1, unit: habit.unit || "veces" });
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (event) => {
    event.preventDefault();
    if (form.name.trim()) {
      save({ ...habit, name: form.name.trim(), target: Math.max(1, Math.round(Number(form.target)) || 1), unit: form.unit.trim() || "veces" });
    }
  };
  return (
    <Modal title={habit.id ? "Editar hábito" : "Nuevo hábito"} close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <label className="text-xs text-zinc-500">Nombre del hábito<input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} className={`${inputClass} mt-1`} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">Meta por día<input type="number" min="1" step="1" value={form.target} onChange={(event) => update("target", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-zinc-500">Unidad<input value={form.unit} onChange={(event) => update("unit", event.target.value)} placeholder="vasos, veces, páginas..." className={`${inputClass} mt-1`} /></label>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          {habit.id && <button type="button" onClick={() => remove(habit.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
