import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectCard } from "@/components/faculty/subject-card";
import { allowsGrade, DEFAULT_COLOR, DEFAULT_ICON, DEFAULT_STATUS, LEVELS, levelLabel, STATUS, STATUS_KEYS, SUBJECT_COLORS, SUBJECT_ICONS } from "@/lib/faculty";

export const inputClass = "w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-lime-500 dark:border-zinc-700 dark:placeholder:text-zinc-500";

const toForm = (subject, defaultLevel) => ({
  name: subject?.name ?? "",
  level: String(subject?.level ?? defaultLevel ?? 1),
  status: subject?.status ?? DEFAULT_STATUS,
  grade: subject?.grade === null || subject?.grade === undefined ? "" : String(subject.grade),
  icon: subject?.icon ?? DEFAULT_ICON,
  color: subject?.color ?? DEFAULT_COLOR,
});

// Formulario de alta y edición. onSave devuelve una promesa; si falla, el error del backend se muestra acá.
export function SubjectForm({ subject, defaultLevel, onSave, onCancel }) {
  const [form, setForm] = useState(() => toForm(subject, defaultLevel));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const gradeAllowed = allowsGrade(form.status);
  const gradeWillBeCleared = !gradeAllowed && subject?.grade !== null && subject?.grade !== undefined;

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      level: Number(form.level),
      status: form.status,
      grade: gradeAllowed && form.grade !== "" ? Number(form.grade) : null,
      icon: form.icon,
      color: form.color,
    };
    setSaving(true);
    setError("");
    onSave(payload).catch((err) => {
      setError(err.message);
      setSaving(false);
    });
  };

  const preview = { ...form, level: Number(form.level), grade: gradeAllowed && form.grade !== "" ? Number(form.grade) : null };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <div className="space-y-3">
          <label className="block text-xs text-zinc-500">
            Nombre
            <input value={form.name} onChange={(event) => update("name", event.target.value)} required maxLength={120} placeholder="Ej: Análisis Matemático I" className={`${inputClass} mt-1`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-zinc-500">
              Nivel
              <Select value={form.level} onValueChange={(value) => update("level", value)}>
                <SelectTrigger className="mt-1 w-full" aria-label="Nivel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => <SelectItem key={level} value={String(level)}>{levelLabel(level)}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs text-zinc-500">
              Estado
              <Select value={form.status} onValueChange={(value) => update("status", value)}>
                <SelectTrigger className="mt-1 w-full" aria-label="Estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_KEYS.map((key) => <SelectItem key={key} value={key}>{STATUS[key].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
          </div>
          {gradeAllowed ? (
            <label className="block text-xs text-zinc-500">
              Nota final (opcional)
              <input type="number" min="1" max="10" step="0.01" value={form.grade} onChange={(event) => update("grade", event.target.value)} placeholder="De 1 a 10" className={`${inputClass} mt-1`} />
            </label>
          ) : gradeWillBeCleared ? (
            <p className="text-xs text-amber-600">Con este estado la materia no admite nota final: al guardar se borra la nota.</p>
          ) : null}
        </div>
        <div className="mx-auto w-36 sm:w-full">
          <p className="mb-1 text-xs text-zinc-500">Vista previa</p>
          <SubjectCard subject={preview} />
        </div>
      </div>

      <fieldset>
        <legend className="text-xs text-zinc-500">Ícono</legend>
        <div className="mt-2 grid grid-cols-7 gap-2 sm:grid-cols-9">
          {Object.entries(SUBJECT_ICONS).map(([key, Icon]) => (
            <button key={key} type="button" onClick={() => update("icon", key)} aria-label={`Ícono ${key}`} aria-pressed={form.icon === key} className={`grid aspect-square place-items-center rounded-xl border transition-colors ${form.icon === key ? "border-lime-500 bg-lime-100 text-lime-900 dark:bg-lime-400/20 dark:text-lime-200" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"}`}>
              <Icon size={18} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs text-zinc-500">Color</legend>
        <div className="mt-2 flex gap-3">
          {Object.entries(SUBJECT_COLORS).map(([key, color]) => (
            <button key={key} type="button" onClick={() => update("color", key)} aria-label={color.label} aria-pressed={form.color === key} className={`h-8 w-8 rounded-full border-2 ${form.color === key ? "border-zinc-900 dark:border-white" : "border-transparent"}`} style={{ backgroundColor: color.hex }} />
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">Cancelar</button>
        <button type="submit" disabled={saving} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-lime-400 dark:text-zinc-950">{saving ? "Guardando…" : subject ? "Guardar cambios" : "Agregar materia"}</button>
      </div>
    </form>
  );
}
