"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/lib/faculty";

export function SavingModal({ saving, save, remove, close }) {
  const [form, setForm] = useState(saving || { name: "", start: "" });
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const start = Number(form.start) || 0;
    save({ ...form, name: form.name.trim(), start, current: saving ? saving.current : start, gain: saving ? saving.gain : 0, id: form.id || Date.now() });
  };
  return (
    <Modal title={saving ? "Editar ahorro" : "Nuevo ahorro"} close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Nombre del ahorro" className={inputClass} />
          <label className="text-xs text-zinc-500">Monto inicio de mes<input type="number" min="0" value={form.start} onChange={(event) => update("start", event.target.value)} className={`${inputClass} mt-1`} /></label>
        </div>
        <div className="mt-6 flex gap-2">
          {saving && <button type="button" onClick={() => remove(saving.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
