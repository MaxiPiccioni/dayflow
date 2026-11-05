import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequirementPicker } from "@/components/faculty/requirement-picker";
import { SubjectCard } from "@/components/faculty/subject-card";
import {
  allowsGrade,
  DEFAULT_COLOR,
  DEFAULT_ICON,
  DEFAULT_STATUS,
  inputClass,
  LEVELS,
  levelLabel,
  MODALITIES,
  MODALITY_KEYS,
  sortSubjects,
  STATUS,
  STATUS_KEYS,
  SUBJECT_COLORS,
  SUBJECT_ICONS,
} from "@/lib/faculty";

// Radix Select no admite un valor vacío: "none" representa "sin modalidad".
const NO_MODALITY = "none";
const asText = (value) => (value === null || value === undefined ? "" : String(value));

const toForm = (subject, defaultLevel) => ({
  name: subject?.name ?? "",
  level: String(subject?.level ?? defaultLevel ?? 1),
  status: subject?.status ?? DEFAULT_STATUS,
  grade: asText(subject?.grade),
  icon: subject?.icon ?? DEFAULT_ICON,
  color: subject?.color ?? DEFAULT_COLOR,
  code: subject?.code ?? "",
  modality: subject?.modality ?? NO_MODALITY,
  weeklyHours: asText(subject?.weekly_hours),
  elective: subject?.elective ?? false,
  credits: asText(subject?.credits),
  requiresAprobada: subject?.requires_aprobada ?? [],
  requiresCursada: subject?.requires_cursada ?? [],
});

// Formulario de alta y edición. onSave(payload, { addAnother }) devuelve una promesa; si falla, el error
// del backend (409, 422, ciclo de correlativas) se muestra acá.
export function SubjectForm({ subject, subjects, defaultLevel, onSave, onCancel }) {
  const [form, setForm] = useState(() => toForm(subject, defaultLevel));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastAdded, setLastAdded] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const gradeAllowed = allowsGrade(form.status);
  const gradeWillBeCleared = !gradeAllowed && subject?.grade !== null && subject?.grade !== undefined;
  const candidates = sortSubjects(subjects.filter((item) => item.id !== subject?.id));
  // Una materia exigida como aprobada ya está incluida como cursada.
  const includedInAprobada = Object.fromEntries(form.requiresAprobada.map((id) => [id, "incluida en aprobada"]));

  const setRequiresAprobada = (ids) => setForm((current) => ({ ...current, requiresAprobada: ids, requiresCursada: current.requiresCursada.filter((id) => !ids.includes(id)) }));

  const buildPayload = () => ({
    name: form.name,
    level: Number(form.level),
    status: form.status,
    grade: gradeAllowed && form.grade !== "" ? Number(form.grade) : null,
    icon: form.icon,
    color: form.color,
    code: form.code.trim() || null,
    modality: form.modality === NO_MODALITY ? null : form.modality,
    weekly_hours: form.weeklyHours === "" ? null : Number(form.weeklyHours),
    elective: form.elective,
    credits: form.elective && form.credits !== "" ? Number(form.credits) : null,
    requires_aprobada: form.requiresAprobada,
    requires_cursada: form.requiresCursada,
  });

  const save = (addAnother) => {
    setSaving(true);
    setError("");
    setLastAdded("");
    onSave(buildPayload(), { addAnother })
      .then(() => {
        if (!addAnother) return;
        // Se conserva el nivel para cargar rápido varias materias del mismo año.
        setLastAdded(form.name.trim());
        setForm(toForm(null, form.level));
        setSaving(false);
      })
      .catch((err) => {
        setError(err.message);
        setSaving(false);
      });
  };

  const submit = (event) => {
    event.preventDefault();
    save(event.nativeEvent.submitter?.value === "add-another");
  };

  const preview = { ...form, level: Number(form.level), grade: gradeAllowed && form.grade !== "" ? Number(form.grade) : null, elective: form.elective, credits: form.credits === "" ? null : Number(form.credits), code: form.code.trim() || null };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      {lastAdded && <p className="rounded-xl bg-lime-50 px-3 py-2 text-sm text-lime-800 dark:bg-lime-400/10 dark:text-lime-200">Se agregó {lastAdded}. Cargá la siguiente.</p>}
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <label className="block text-xs text-zinc-500">
              Nombre
              <input value={form.name} onChange={(event) => update("name", event.target.value)} required maxLength={120} placeholder="Ej: Análisis Matemático I" className={`${inputClass} mt-1`} />
            </label>
            <label className="block text-xs text-zinc-500">
              Código
              <input value={form.code} onChange={(event) => update("code", event.target.value)} maxLength={10} placeholder="Opcional" className={`${inputClass} mt-1`} />
            </label>
          </div>
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

      <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <legend className="sr-only">Datos del plan</legend>
        <label className="col-span-2 block text-xs text-zinc-500">
          Modalidad
          <Select value={form.modality} onValueChange={(value) => update("modality", value)}>
            <SelectTrigger className="mt-1 w-full" aria-label="Modalidad">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_MODALITY}>Sin especificar</SelectItem>
              {MODALITY_KEYS.map((key) => <SelectItem key={key} value={key}>{MODALITIES[key]}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="block text-xs text-zinc-500">
          Horas semanales
          <input type="number" min="1" max="20" value={form.weeklyHours} onChange={(event) => update("weeklyHours", event.target.value)} placeholder="Opcional" className={`${inputClass} mt-1`} />
        </label>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.elective} onChange={(event) => update("elective", event.target.checked)} className="h-4 w-4 accent-lime-500" />
            Electiva
          </label>
        </div>
        {form.elective && (
          <label className="block text-xs text-zinc-500">
            Créditos
            <input type="number" min="1" max="20" required value={form.credits} onChange={(event) => update("credits", event.target.value)} placeholder="1 a 20" className={`${inputClass} mt-1`} />
          </label>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <RequirementPicker label="Necesita tener aprobada" candidates={candidates} selected={form.requiresAprobada} onChange={setRequiresAprobada} />
        <RequirementPicker label="Necesita haber cursado" candidates={candidates} selected={form.requiresCursada} onChange={(ids) => update("requiresCursada", ids)} disabled={includedInAprobada} />
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
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">Cancelar</button>
        {!subject && (
          <button type="submit" value="add-another" disabled={saving} className="rounded-xl border border-zinc-900 px-4 py-2 text-sm font-semibold disabled:opacity-60 dark:border-lime-400 dark:text-lime-300">
            Guardar y agregar otra
          </button>
        )}
        <button type="submit" value="save" disabled={saving} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-lime-400 dark:text-zinc-950">
          {saving ? "Guardando…" : subject ? "Guardar cambios" : "Agregar materia"}
        </button>
      </div>
    </form>
  );
}
