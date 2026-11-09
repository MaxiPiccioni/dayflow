"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { RepeatField } from "@/components/modals/repeat-field";
import { SelectField } from "@/components/select-field";
import { SubjectSearchSelect } from "@/components/subject-search-select";
import { inputClass } from "@/lib/faculty";

const PRIORITY_OPTIONS = [{ value: "", label: "Sin importancia" }, { value: "Alta", label: "Alta" }, { value: "Media", label: "Media" }, { value: "Baja", label: "Baja" }];

export function TaskModal({ task, date, categories, subjects = [], save, remove, close }) {
  const [form, setForm] = useState(task || { title: "", date, time: "09:00", category: "", priority: "", notes: "", subject_id: "" });
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    const repeat_days = !task && repeatEnabled && repeatDays.length ? repeatDays : undefined;
    save({ ...form, title: form.title.trim(), id: form.id || Date.now(), done: form.done || false, repeat_days });
  };
  const categoryOptions = [{ value: "", label: "Sin categoría" }, ...categories.map((category) => ({ value: category.name, label: category.name }))];
  return (
    <Modal title={task ? "Detalles de tarea" : "Nueva tarea"} close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <input autoFocus value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="¿Qué necesitas hacer?" className={inputClass} />
          <textarea value={form.notes || ""} onChange={(event) => update("notes", event.target.value)} placeholder="Notas" rows="3" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">Fecha<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-zinc-500">Horario<input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <SelectField label="Categoría" value={form.category || ""} onChange={(value) => update("category", value)} options={categoryOptions} />
            <SelectField label="Importancia" value={form.priority || ""} onChange={(value) => update("priority", value)} options={PRIORITY_OPTIONS} />
            {subjects.length > 0 && (
              <div className="col-span-2">
                <SubjectSearchSelect label="Materia (Facultad)" value={String(form.subject_id || "")} onChange={(value) => update("subject_id", value)} subjects={subjects} />
              </div>
            )}
          </div>
          {!task && <RepeatField enabled={repeatEnabled} setEnabled={setRepeatEnabled} days={repeatDays} setDays={setRepeatDays} />}
        </div>
        <div className="mt-6 flex gap-2">
          {task && <button type="button" onClick={() => remove(task.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
