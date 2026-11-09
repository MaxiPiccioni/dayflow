// Widgets del Resumen y su distribución en dos columnas (se recuerda en localStorage).
export const WIDGET_META = [
  { id: "hero", label: "Tu día" },
  { id: "calendar", label: "Calendario" },
  { id: "agenda", label: "Tareas y eventos" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "habits", label: "Hábitos" },
  { id: "horas", label: "Horas" },
  { id: "finanzas", label: "Finanzas" },
];
export const DEFAULT_SUMMARY_LAYOUT = [["hero", "pomodoro"], ["calendar", "agenda", "habits"]];
export const SUMMARY_LAYOUT_KEY = "dayflow_summary_layout";

export function loadSummaryLayout() {
  if (typeof window === "undefined") return DEFAULT_SUMMARY_LAYOUT;
  try {
    const stored = JSON.parse(localStorage.getItem(SUMMARY_LAYOUT_KEY));
    if (!Array.isArray(stored) || stored.length !== 2 || !stored.every(Array.isArray)) return DEFAULT_SUMMARY_LAYOUT;
    const validIds = new Set(WIDGET_META.map((widget) => widget.id));
    return stored.map((column) => column.filter((id) => validIds.has(id)));
  } catch {
    return DEFAULT_SUMMARY_LAYOUT;
  }
}
