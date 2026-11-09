"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { todayIso } from "@/lib/dates";

function fetchEverything() {
  return Promise.all([
    api(`/dashboard?client_today=${todayIso()}`),
    api("/events"),
    api("/pomodoro"),
    api("/hours"),
    api("/pomodoro/history"),
    api("/categories"),
    api("/categories?scope=finance&kind=income"),
    api("/categories?scope=finance&kind=expense"),
    api(`/habits/overview?client_today=${todayIso()}`),
    api("/shopping-items"),
    api("/categories?scope=shopping"),
  ]).then(([dashboard, events, pomodoro, hours, history, categories, financeIncome, financeExpense, habitsOverview, shoppingItems, shoppingCategories]) => (
    { dashboard, events, pomodoro, hours, history, categories, financeIncome, financeExpense, habitsOverview, shoppingItems, shoppingCategories }
  ));
}

// Carga inicial de la app, una sola vez por sesión. Solo un 401 cierra la sesión: api.js borra el token y avisa a
// AuthGate. Un 429 con Retry-After de 10 s o menos se reintenta solo una vez; cualquier otro error (429 largo,
// 502, red) muestra "Reintentar". `apply` recibe todos los datos juntos al final, así nunca se mezclan datos viejos
// y nuevos. `apply` tiene que ser estable (no cambiar entre renders).
export function useInitialLoad(apply) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); // { message, retryIn } si falla la carga inicial
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    let countdown;
    const load = (autoRetried) => fetchEverything().then((data) => {
      if (cancelled) return;
      apply(data);
      setLoadError(null);
      setLoading(false);
    }).catch((err) => {
      if (cancelled || err.status === 401) return;
      if (err.status === 429 && !autoRetried && err.retryAfter !== null && err.retryAfter <= 10) {
        setLoadError({ message: err.message, retryIn: err.retryAfter });
        countdown = setInterval(() => setLoadError((current) => (current && current.retryIn > 1 ? { ...current, retryIn: current.retryIn - 1 } : current)), 1000);
        retryTimer = setTimeout(() => { clearInterval(countdown); load(true); }, err.retryAfter * 1000);
        return;
      }
      setLoadError({ message: err.message, retryIn: null });
    });
    load(false);
    return () => { cancelled = true; clearTimeout(retryTimer); clearInterval(countdown); };
  }, [loadAttempt, apply]);

  const retryLoad = () => {
    setLoadError(null);
    setLoadAttempt((attempt) => attempt + 1);
  };

  return { loading, loadError, retryLoad };
}
