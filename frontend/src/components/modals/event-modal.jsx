"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { RepeatField } from "@/components/modals/repeat-field";
import { SelectField } from "@/components/select-field";
import { inputClass } from "@/lib/faculty";

const EVENT_COLORS = [["#d9f99d", "Lima"], ["#bfdbfe", "Azul"], ["#fbcfe8", "Rosa"], ["#fde68a", "Amarillo"], ["#ddd6fe", "Lavanda"]];

export function EventModal({ event, date, categories, save, remove, close }) {
  const [form, setForm] = useState(event || { title: "", date, time: "09:00", type: "", color: "#d9f99d", done: false, important: false });
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = (submitEvent) => {
    submitEvent.preventDefault();
    if (!form.title.trim()) return;
    const repeat_days = !event && repeatEnabled && repeatDays.length ? repeatDays : undefined;
    save({ ...form, title: form.title.trim(), id: form.id || Date.now(), done: form.done || false, repeat_days });
  };
  const typeOptions = [{ value: "", label: "Sin categoría" }, ...categories.map((category) => ({ value: category.name, label: category.name }))];
  return (
    <Modal title={event ? "Editar evento" : "Nuevo evento"} close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <input autoFocus value={form.title} onChange={(changeEvent) => update("title", changeEvent.target.value)} placeholder="Nombre del evento" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">Fecha<input type="date" value={form.date} onChange={(changeEvent) => update("date", changeEvent.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-xs text-zinc-500">Horario<input type="time" value={form.time} onChange={(changeEvent) => update("time", changeEvent.target.value)} className={`${inputClass} mt-1`} /></label>
            <SelectField label="Categoría" value={form.type || ""} onChange={(value) => update("type", value)} options={typeOptions} />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Color del evento</p>
            <div className="mt-2 flex gap-3">
              {EVENT_COLORS.map(([color, label]) => (
                <button key={color} type="button" aria-label={label} onClick={() => update("color", color)} className={`h-8 w-8 rounded-full border-2 ${form.color === color ? "border-zinc-900 ring-2 ring-zinc-300" : "border-white"}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
            <span className="text-sm font-medium">Evento importante</span>
            <Switch checked={form.important || false} onChange={(value) => update("important", value)} label="Evento importante" />
          </div>
          {!event && <RepeatField enabled={repeatEnabled} setEnabled={setRepeatEnabled} days={repeatDays} setDays={setRepeatDays} />}
        </div>
        <div className="mt-6 flex gap-2">
          {event && <button type="button" onClick={() => remove(event.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar evento</button>
        </div>
      </form>
    </Modal>
  );
}
