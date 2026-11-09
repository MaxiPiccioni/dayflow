// Utilidades de fechas de la app. Las fechas viajan como "YYYY-MM-DD" y se calculan a mediodía
// para que los cambios de horario no las muevan de día.
export const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function toIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayIso() {
  return toIso(new Date());
}

export function shiftIsoDate(iso, deltaDays) {
  const shifted = new Date(`${iso}T12:00:00`);
  shifted.setDate(shifted.getDate() + deltaDays);
  return toIso(shifted);
}

export function daysUntil(iso) {
  const today = new Date(`${todayIso()}T12:00:00`);
  const target = new Date(`${iso}T12:00:00`);
  return Math.round((target - today) / 86400000);
}

export function formatFullDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

export const monthLabel = (iso) => {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

export const monthSortValue = (iso) => {
  const d = new Date(iso);
  return d.getFullYear() * 12 + d.getMonth();
};

export const formatRowDate = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export function parseRowDate(value) {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}
