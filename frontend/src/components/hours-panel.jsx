import { useEffect, useRef, useState } from "react";
import { Copy, Download, Eye, LockKeyhole, Plus, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Calendar as MonthCalendar } from "@/components/ui/calendar";
import { Modal } from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { api } from "@/lib/api";

const inputClass = "w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-lime-500 dark:border-zinc-700 dark:placeholder:text-zinc-500";
const periodLabel = (start, end) => `${new Date(`${start}T12:00:00`).toLocaleDateString("es-AR")} al ${new Date(`${end}T12:00:00`).toLocaleDateString("es-AR")}`;
const fromApiEntry = (entry) => ({ id: entry.id, date: entry.entry_date, from: entry.from_time, to: entry.to_time, hours: entry.hours === null ? "" : entry.hours, extra: entry.extra, holiday: entry.holiday });
const fromApiPayment = (payment) => ({ id: payment.id, amount: payment.amount, method: payment.method, date: payment.payment_date });
const fromApiClosedPeriod = (item) => ({ id: item.id, start: item.start, end: item.end, rate: item.rate, totalHours: item.total_hours, expected: item.expected, paid: item.paid, balance: item.balance });

const PERIOD_ANCHOR_DAY = 11;
const shiftMonthDate = (dateObj, delta) => { const next = new Date(dateObj); next.setMonth(next.getMonth() + delta); return next; };
const formatDateLocal = (dateObj) => `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
function periodBoundsFor(dateStr) {
  const reference = new Date(`${dateStr}T12:00:00`);
  const start = reference.getDate() >= PERIOD_ANCHOR_DAY ? new Date(reference.getFullYear(), reference.getMonth(), PERIOD_ANCHOR_DAY, 12) : shiftMonthDate(new Date(reference.getFullYear(), reference.getMonth(), PERIOD_ANCHOR_DAY, 12), -1);
  const end = shiftMonthDate(start, 1);
  end.setDate(PERIOD_ANCHOR_DAY - 1);
  return { start: formatDateLocal(start), end: formatDateLocal(end) };
}

const PRINT_MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const PRINT_STATUS_COLORS = { paid: { bg: "#bbf7d0", text: "#052e16" }, pending: { bg: "#fef08a", text: "#422006" }, outside: { bg: "#e4e4e7", text: "#3f3f46" } };
function PrintMonthGrid({ monthStr, dateColors }) {
  const monthDate = new Date(`${monthStr}-01T12:00:00`);
  const monthName = `${PRINT_MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay() + 6) % 7;
  const toDate = (day) => `${monthStr}-${String(day).padStart(2, "0")}`;
  return <div className="hours-print-month"><strong className="mb-2 block text-sm">{monthName}</strong><div className="grid grid-cols-7 gap-1 text-center text-[10px]">{["L", "M", "X", "J", "V", "S", "D"].map((day) => <span key={day} className="p-1 font-semibold">{day}</span>)}{Array.from({ length: firstDay + daysInMonth }, (_, index) => { if (index < firstDay) return <span key={`empty-${index}`} />; const day = index - firstDay + 1; const date = toDate(day); const status = dateColors[date]; const colors = status ? PRINT_STATUS_COLORS[status] : null; return <span key={date} className="rounded-md p-1.5 text-xs" style={colors ? { backgroundColor: colors.bg, color: colors.text } : undefined}>{day}</span>; })}</div></div>;
}

function HoursEntryModal({ entry, date, onSave, onRemove, onClose }) {
  const [form, setForm] = useState(entry || { date, from: "09:00", to: "17:00", hours: "", extra: false, holiday: false });
  const update = (key, value) => setForm({ ...form, [key]: value });
  return <Modal title={entry ? "Editar jornada" : "Nueva jornada"} close={onClose}><div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs text-zinc-500">Fecha<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className={`${inputClass} mt-1`} /></label><label className="text-xs text-zinc-500">Horas manuales<input type="number" min="0" step="0.25" value={form.hours} onChange={(event) => update("hours", event.target.value)} placeholder="Opcional" className={`${inputClass} mt-1`} /></label><label className="text-xs text-zinc-500">Desde<input type="time" value={form.from} onChange={(event) => update("from", event.target.value)} className={`${inputClass} mt-1`} /></label><label className="text-xs text-zinc-500">Hasta<input type="time" value={form.to} onChange={(event) => update("to", event.target.value)} className={`${inputClass} mt-1`} /></label><label className="flex items-center gap-2 text-xs text-zinc-500"><input type="checkbox" checked={form.extra} onChange={(event) => update("extra", event.target.checked)} /> Horas extra</label><label className="flex items-center gap-2 text-xs text-zinc-500"><input type="checkbox" checked={form.holiday} onChange={(event) => update("holiday", event.target.checked)} /> Feriado</label></div><div className="mt-6 flex gap-2">{entry && <button onClick={() => onRemove(entry.id)} className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600">Eliminar</button>}<button onClick={() => onSave(form)} className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar jornada</button></div></Modal>;
}

function ClosePeriodDialog({ period, onConfirm, onCancel }) {
  return <div className="modal-overlay" onMouseDown={onCancel}><div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="close-period-title" onMouseDown={(event) => event.stopPropagation()}><h2 id="close-period-title" className="text-xl font-semibold">¿Cerrar el período {periodLabel(period.start, period.end)}?</h2><p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">El período quedará archivado con sus totales congelados.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">Cancelar</button><button type="button" onClick={onConfirm} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Cerrar período</button></div></div></div>;
}

function DeletePeriodDialog({ period, onConfirm, onCancel }) {
  return <div className="modal-overlay" onMouseDown={onCancel}><div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-period-title" onMouseDown={(event) => event.stopPropagation()}><h2 id="delete-period-title" className="text-xl font-semibold">¿Eliminar este período archivado?</h2><p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Se va a borrar el registro de {periodLabel(period.start, period.end)}, junto con las jornadas y los pagos registrados en ese rango de fechas. Esta acción no se puede deshacer.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">Cancelar</button><button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Eliminar</button></div></div></div>;
}

function PeriodDetailModal({ period, entries, close }) {
  const [payments, setPayments] = useState(null);
  useEffect(() => { api(`/hours/periods/${period.id}/payments`).then((data) => setPayments(data.map(fromApiPayment))).catch(() => setPayments([])); }, [period.id]);
  const duration = (entry) => { if (entry.holiday) return 4; if (entry.hours !== "" && entry.hours !== undefined) return Number(entry.hours) || 0; const [fromHour, fromMinute] = entry.from.split(":").map(Number); const [toHour, toMinute] = entry.to.split(":").map(Number); return Math.max(0, (toHour * 60 + toMinute - fromHour * 60 - fromMinute) / 60); };
  const value = (entry) => duration(entry) * period.rate * (entry.extra ? 2 : 1);
  const paidTotal = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  const dateColors = {};
  let remainingPaid = paidTotal;
  [...entries].sort((a, b) => a.date.localeCompare(b.date)).forEach((entry) => { const entryValue = value(entry); dateColors[entry.date] = entryValue > 0 && remainingPaid >= entryValue ? "paid" : "pending"; remainingPaid -= entryValue; });
  return <Modal title={`Período · ${periodLabel(period.start, period.end)}`} close={close}>
    <div className="mt-5"><MonthCalendar key={period.start.slice(0, 7)} value={period.start} onChange={() => {}} dateColors={dateColors} /></div>
    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
      <div><p className="text-xs text-zinc-500">Horas totales</p><p className="mt-1 text-xl font-semibold">{period.totalHours.toFixed(2)}</p></div>
      <div><p className="text-xs text-zinc-500">Sueldo esperado</p><p className="mt-1 text-xl font-semibold">$ {period.expected.toLocaleString("es-AR")}</p></div>
      <div><p className="text-xs text-zinc-500">Saldo</p><p className={`mt-1 text-xl font-semibold ${period.balance >= 0 ? "text-red-500" : "text-lime-600"}`}>$ {period.balance.toLocaleString("es-AR")}</p></div>
    </div>
    <div className="mt-6">
      <p className="text-sm font-semibold">Pagos registrados</p>
      {payments === null ? <p className="mt-3 text-sm text-zinc-400">Cargando…</p> : payments.length ? <div className="mt-3 space-y-2">{payments.map((payment) => <div key={payment.id} className="flex justify-between border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800"><span>{payment.date} · {payment.method}</span><strong className="text-lime-600">$ {payment.amount.toLocaleString("es-AR")}</strong></div>)}</div> : <p className="mt-3 text-sm text-zinc-400">No se registraron pagos en este período.</p>}
    </div>
  </Modal>;
}

function PaymentSelect({ value, onChange }) { const [open, setOpen] = useState(false); return <div className="relative"><button type="button" onClick={() => setOpen(!open)} className={`${inputClass} flex items-center justify-between text-left`}>{value}<span>⌄</span></button>{open && <div className="absolute z-10 mt-1 w-full rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">{["Transferencia", "Efectivo", "Otro"].map((option) => <button type="button" key={option} onClick={() => { onChange(option); setOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">{option}</button>)}</div>}</div>; }

function Saldos({ payments, addPayment, removePayment, readOnly }) { const [amount, setAmount] = useState(""); const [method, setMethod] = useState("Transferencia"); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const submit = () => { if (Number(amount) <= 0) return; addPayment({ amount: Number(amount), method, date }); setAmount(""); }; return <Card className="hours-saldos"><CardHeader eyebrow="Pagos recibidos" title="Saldos" />{readOnly ? <p className="text-sm text-amber-600">Este período está cerrado. Reabrilo para modificar los pagos.</p> : <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"><input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Monto" className={inputClass} /><DatePicker value={date} onChange={setDate} /><PaymentSelect value={method} onChange={setMethod} /><button onClick={submit} aria-label="Agregar pago" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /></button></div>}{payments.length ? <div className="mt-5 space-y-2">{payments.map((payment) => <div key={payment.id} className="flex items-center justify-between border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800"><span>{payment.date} · {payment.method}</span><div className="flex items-center gap-3"><strong className="text-lime-600">$ {payment.amount.toLocaleString("es-AR")}</strong>{!readOnly && <button onClick={() => removePayment(payment.id)} aria-label="Eliminar pago" title="Eliminar pago" className="text-zinc-400 hover:text-red-500"><X size={14} /></button>}</div></div>)}</div> : <p className="mt-4 text-sm text-zinc-400">Todavía no registraste pagos.</p>}</Card>; }

export function HoursPanel({ period, setPeriod, payments, setPayments, entries, setEntries, closedPeriods, setClosedPeriods, onSaveEntry, onRemoveEntry }) {
  const [selectedDate, setSelectedDate] = useState(period.start);
  const [entryModal, setEntryModal] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const loadedStartRef = useRef(period.start);

  useEffect(() => {
    const bounds = periodBoundsFor(selectedDate);
    if (bounds.start === loadedStartRef.current) return undefined;
    let cancelled = false;
    setPeriodLoading(true);
    api(`/hours?reference_date=${bounds.start}`).then((data) => {
      if (cancelled) return;
      loadedStartRef.current = data.period.start;
      setPeriod(data.period);
      setPayments(data.payments.map(fromApiPayment));
      setClosedPeriods(data.closed_periods.map(fromApiClosedPeriod));
      setPeriodLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedDate, setPeriod, setPayments, setClosedPeriods]);

  const inPeriod = entries.filter((entry) => entry.date >= period.start && entry.date <= period.end);
  const duration = (entry) => { if (entry.holiday) return 4; if (entry.hours !== "" && entry.hours !== undefined) return Number(entry.hours) || 0; const [fromHour, fromMinute] = entry.from.split(":").map(Number); const [toHour, toMinute] = entry.to.split(":").map(Number); return Math.max(0, (toHour * 60 + toMinute - fromHour * 60 - fromMinute) / 60); };
  const value = (entry) => duration(entry) * period.rate * (entry.extra ? 2 : 1);
  const totalHours = inPeriod.reduce((sum, entry) => sum + duration(entry), 0);
  const expected = inPeriod.reduce((sum, entry) => sum + value(entry), 0);
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = expected - paid;
  const dateColors = {};
  let remainingPaid = paid;
  [...inPeriod].sort((a, b) => a.date.localeCompare(b.date)).forEach((entry) => { const entryValue = value(entry); dateColors[entry.date] = entryValue > 0 && remainingPaid >= entryValue ? "paid" : "pending"; remainingPaid -= entryValue; });
  entries.forEach((entry) => { if (!(entry.date in dateColors)) dateColors[entry.date] = "outside"; });
  const printMonths = [...new Set([period.start.slice(0, 7), period.end.slice(0, 7)])];

  const saveEntry = (form) => { onSaveEntry(form); setEntryModal(null); };
  const removeEntry = (id) => { onRemoveEntry(id); setEntryModal(null); };
  const duplicate = () => { const current = entries.find((entry) => entry.date === selectedDate); if (!current) return; const next = new Date(`${selectedDate}T12:00:00`); next.setDate(next.getDate() + 1); const nextDate = next.toISOString().slice(0, 10); onSaveEntry({ ...current, date: nextDate }); setSelectedDate(nextDate); };
  const exportPdf = () => { document.body.classList.add("print-hours"); window.print(); window.setTimeout(() => document.body.classList.remove("print-hours"), 500); };

  const updateRate = (rateValue) => { const rate = Number(rateValue); setPeriod((current) => ({ ...current, rate })); api("/hours/period", { method: "PATCH", body: JSON.stringify({ rate, reference_date: period.start }) }).catch(() => {}); };
  const addPayment = (payment) => { const tempId = `temp-${Date.now()}`; setPayments([...payments, { ...payment, id: tempId }]); api("/hours/payments", { method: "POST", body: JSON.stringify({ amount: payment.amount, method: payment.method, payment_date: payment.date, reference_date: period.start }) }).then((data) => { loadedStartRef.current = data.period.start; setPeriod(data.period); setPayments(data.payments.map(fromApiPayment)); setClosedPeriods(data.closed_periods.map(fromApiClosedPeriod)); }).catch(() => setPayments((current) => current.filter((item) => item.id !== tempId))); };
  const removePayment = (id) => { const previous = payments; setPayments(payments.filter((item) => item.id !== id)); api(`/hours/payments/${id}`, { method: "DELETE" }).catch(() => setPayments(previous)); };
  const finishClosePeriod = async () => { const data = await api("/hours/close", { method: "POST", body: JSON.stringify({ reference_date: period.start }) }); loadedStartRef.current = data.period.start; setPeriod(data.period); setPayments(data.payments.map(fromApiPayment)); setClosedPeriods(data.closed_periods.map(fromApiClosedPeriod)); setSelectedDate(data.period.start); };
  const reopenPeriod = async (item) => { const data = await api(`/hours/periods/${item.id}/reopen`, { method: "POST" }); loadedStartRef.current = data.period.start; setPeriod(data.period); setPayments(data.payments.map(fromApiPayment)); setClosedPeriods(data.closed_periods.map(fromApiClosedPeriod)); setSelectedDate(data.period.start); };
  const deletePeriod = (periodId) => { api(`/hours/periods/${periodId}`, { method: "DELETE" }).then((data) => { setEntries(data.entries.map(fromApiEntry)); setClosedPeriods(data.closed_periods.map(fromApiClosedPeriod)); if (period.id === periodId) { loadedStartRef.current = data.period.start; setPeriod(data.period); setPayments(data.payments.map(fromApiPayment)); setSelectedDate(data.period.start); } }); };

  return <div className="hours-module space-y-5"><Card className="hours-calendar-card"><CardHeader eyebrow={periodLoading ? "Actualizando período…" : "Período de pago"} title={`Horas · ${periodLabel(period.start, period.end)}`} action={<div className="flex flex-wrap gap-2"><button onClick={exportPdf} disabled={periodLoading} title={periodLoading ? "Esperá a que termine de cargar el período" : "Exportar este período a PDF"} className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium disabled:opacity-40"><Download size={14} /> Exportar PDF</button>{period.closed ? <button onClick={() => reopenPeriod(period)} className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white">Reabrir para editar</button> : <button onClick={() => setConfirmClose(true)} className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white"><LockKeyhole size={14} /> Cerrar período</button>}</div>} /><div className="hours-screen-calendar"><MonthCalendar key={selectedDate.slice(0, 7)} value={selectedDate} onChange={setSelectedDate} onMonthChange={(monthStr) => { const [year, monthNumber] = monthStr.split("-").map(Number); const day = Math.min(Number(selectedDate.slice(8, 10)), new Date(year, monthNumber, 0).getDate()); setSelectedDate(`${monthStr}-${String(day).padStart(2, "0")}`); }} onDoubleClick={(selected) => setEntryModal(entries.find((entry) => entry.date === selected) || { date: selected })} dateColors={dateColors} /></div><div className="hours-print-calendars hidden gap-8">{printMonths.map((monthStr) => <PrintMonthGrid key={monthStr} monthStr={monthStr} dateColors={dateColors} />)}</div><div className="mt-4 flex flex-wrap gap-2 hours-actions"><button onClick={() => setEntryModal({ date: selectedDate })} className="flex items-center gap-1 rounded-xl bg-lime-200 px-4 py-2 text-sm font-semibold text-lime-950"><Plus size={15} /> Registrar día</button><button onClick={duplicate} disabled={!entries.some((entry) => entry.date === selectedDate)} className="flex items-center gap-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"><Copy size={15} /> Duplicar día</button></div><div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 hours-legend"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-lime-200 dark:bg-lime-500/60" /> Pagada</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-yellow-200 dark:bg-yellow-500/60" /> Pendiente de pago</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-400/60" /> Fuera del período actual</span></div></Card><Card className="hours-summary"><CardHeader eyebrow="Resumen" title="Horas totales del período" /><p className="text-4xl font-semibold">{totalHours.toFixed(2)} <span className="text-xl text-zinc-400">horas</span></p><p className="mt-2 text-sm text-zinc-500">{inPeriod.length} jornadas en este período</p></Card><Saldos payments={payments} addPayment={addPayment} removePayment={removePayment} readOnly={period.closed} /><Card className="hours-calculator"><CardHeader eyebrow="Calculadora" title="Sueldo del período" /><div className="grid gap-4 sm:grid-cols-3"><label className="text-xs text-zinc-500">Monto por hora<input type="number" min="0" value={period.rate} disabled={period.closed} onChange={(event) => updateRate(event.target.value)} className={`${inputClass} mt-1 ${period.closed ? "opacity-50" : ""}`} /></label><div><p className="text-xs text-zinc-500">Sueldo esperado</p><p className="mt-2 text-2xl font-semibold">$ {expected.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p></div><div><p className="text-xs text-zinc-500">Saldos</p><p className={`mt-2 text-2xl font-semibold ${balance >= 0 ? "text-red-500" : "text-lime-600"}`}>$ {balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p></div></div><div className="mt-5 flex items-end gap-3"><div className="flex-1"><p className="text-xs text-zinc-500">Total pagado</p><p className="mt-1 text-2xl font-semibold">$ {paid.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p></div><p className="pb-2 text-xs text-zinc-400">{balance >= 0 ? "Te deben este monto" : "Te pagaron de más"}</p></div></Card><Card className="hours-archive"><CardHeader eyebrow="Archivo" title="Períodos cerrados" />{closedPeriods.length ? closedPeriods.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-zinc-100 py-3 text-sm dark:border-zinc-800"><div><p>{periodLabel(item.start, item.end)} · {item.totalHours.toFixed(2)} h</p><span className={item.balance >= 0 ? "text-red-500" : "text-lime-600"}>Saldo: $ {item.balance.toLocaleString("es-AR")}</span></div><div className="flex items-center gap-3"><button onClick={() => setViewTarget(item)} className="flex items-center gap-1 text-zinc-500"><Eye size={14} /> Ver período</button><button onClick={() => reopenPeriod(item)} className="text-lime-700">Editar período</button><button onClick={() => setDeleteTarget(item)} className="text-red-500">Eliminar</button></div></div>) : <p className="text-sm text-zinc-400">Todavía no cerraste ningún período.</p>}</Card>{entryModal && <HoursEntryModal entry={entryModal.id ? entryModal : null} date={entryModal.date || selectedDate} onClose={() => setEntryModal(null)} onSave={saveEntry} onRemove={removeEntry} />}{confirmClose && <ClosePeriodDialog period={period} onCancel={() => setConfirmClose(false)} onConfirm={() => { finishClosePeriod(); setConfirmClose(false); }} />}{deleteTarget && <DeletePeriodDialog period={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={() => { deletePeriod(deleteTarget.id); setDeleteTarget(null); }} />}{viewTarget && <PeriodDetailModal period={viewTarget} entries={entries.filter((entry) => entry.date >= viewTarget.start && entry.date <= viewTarget.end)} close={() => setViewTarget(null)} />}</div>;
}
