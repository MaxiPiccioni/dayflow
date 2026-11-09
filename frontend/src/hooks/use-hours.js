"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { fromApiClosedPeriod, fromApiEntry, fromApiPayment, toApiEntry } from "@/lib/mappers";

// Horas trabajadas: período abierto, cargas, pagos y períodos cerrados.
export function useHours() {
  const [hoursPeriod, setHoursPeriod] = useState(null);
  const [hourEntries, setHourEntries] = useState([]);
  const [hourPayments, setHourPayments] = useState([]);
  const [closedPeriods, setClosedPeriods] = useState([]);

  const applyHoursState = useCallback((data) => {
    setHoursPeriod(data.period);
    setHourEntries(data.entries.map(fromApiEntry));
    setHourPayments(data.payments.map(fromApiPayment));
    setClosedPeriods(data.closed_periods.map(fromApiClosedPeriod));
  }, []);

  const saveHourEntry = (form) => {
    const previous = hourEntries;
    const existing = hourEntries.find((entry) => entry.date === form.date);
    setHourEntries(existing
      ? hourEntries.map((entry) => (entry.date === form.date ? { ...form, id: existing.id } : entry))
      : [...hourEntries, { ...form, id: `temp-${form.date}` }]);
    return api("/hours/entries", { method: "PUT", body: JSON.stringify(toApiEntry(form)) })
      .then((saved) => setHourEntries((current) => current.map((entry) => (entry.date === form.date ? fromApiEntry(saved) : entry))))
      .catch((err) => { setHourEntries(previous); throw err; });
  };
  const removeHourEntry = (id) => {
    const previous = hourEntries;
    setHourEntries(hourEntries.filter((entry) => entry.id !== id));
    return api(`/hours/entries/${id}`, { method: "DELETE" }).catch((err) => { setHourEntries(previous); throw err; });
  };

  return {
    hoursPeriod, setHoursPeriod, hourEntries, setHourEntries, hourPayments, setHourPayments, closedPeriods, setClosedPeriods,
    applyHoursState, saveHourEntry, removeHourEntry,
  };
}
