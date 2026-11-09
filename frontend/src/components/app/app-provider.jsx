"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgenda } from "@/hooks/use-agenda";
import { useFinance } from "@/hooks/use-finance";
import { useHabits } from "@/hooks/use-habits";
import { useHours } from "@/hooks/use-hours";
import { useInitialLoad } from "@/hooks/use-initial-load";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useSummaryLayout } from "@/hooks/use-summary-layout";
import { api } from "@/lib/api";
import { todayIso } from "@/lib/dates";

const AppContext = createContext(null);

// Estado y lógica compartidos por todas las rutas. Vive en el layout, así que al navegar no se pierde ni se vuelve a
// cargar nada y el Pomodoro sigue corriendo.
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp se usa dentro de AppProvider.");
  return value;
}

function Centered({ children }) {
  return <div className="grid min-h-screen place-items-center bg-[#f4f5ef] px-4 dark:bg-zinc-950">{children}</div>;
}

export function AppProvider({ user, logout, children }) {
  const router = useRouter();
  const pomodoro = usePomodoro();
  const agenda = useAgenda();
  const habits = useHabits();
  const finance = useFinance();
  const hours = useHours();
  const summary = useSummaryLayout();
  const [shoppingItems, setShoppingItems] = useState([]);
  const [shoppingCategories, setShoppingCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const { applyLoaded: applyPomodoro } = pomodoro;
  const { applyLoaded: applyAgenda } = agenda;
  const { applyLoaded: applyHabits } = habits;
  const { applyLoaded: applyFinance } = finance;
  const { applyHoursState } = hours;
  const apply = useCallback((data) => {
    applyAgenda(data.dashboard, data.events, data.categories);
    applyHabits(data.dashboard, data.habitsOverview);
    applyFinance(data.dashboard, data.financeIncome, data.financeExpense);
    applyPomodoro(data.pomodoro, data.history);
    applyHoursState(data.hours);
    setShoppingItems(data.shoppingItems);
    setShoppingCategories(data.shoppingCategories);
  }, [applyAgenda, applyHabits, applyFinance, applyPomodoro, applyHoursState]);
  const { loading, loadError, retryLoad } = useInitialLoad(apply);

  // Las materias para los selectores se piden aparte, una sola vez: si Facultad falla, el resto de la app carga igual.
  // Cuando se editan en Facultad, esa pantalla actualiza esta lista con setSubjectOptions (sin otro pedido).
  const setSubjectOptions = useCallback((list) => {
    setSubjects(list.map((subject) => ({ id: subject.id, name: subject.name, code: subject.code, level: subject.level })));
  }, []);
  useEffect(() => {
    let cancelled = false;
    api("/faculty/subjects")
      .then((data) => { if (!cancelled) setSubjectOptions(data); })
      .catch((err) => console.warn("No se pudieron cargar las materias para los selectores", err));
    return () => { cancelled = true; };
  }, [setSubjectOptions]);

  // Acceso directo ?open=tarea o ?open=evento (botón de acción del iPhone): abre el formulario en Calendario.
  const { setDate, setTaskModal, setEventModal } = agenda;
  useEffect(() => {
    const open = new URLSearchParams(window.location.search).get("open");
    if (!open) return;
    const today = todayIso();
    if (open === "tarea" || open === "evento") {
      setDate(today);
      if (open === "tarea") setTaskModal({ date: today });
      else setEventModal({ date: today });
      router.replace("/calendario");
    } else {
      router.replace(window.location.pathname);
    }
  }, [router, setDate, setTaskModal, setEventModal]);

  if (loading && loadError) {
    return (
      <Centered>
        <div className="max-w-sm text-center">
          <p role="alert" className="text-sm text-zinc-600 dark:text-zinc-300">{loadError.message}</p>
          {loadError.retryIn !== null
            ? <p className="mt-2 text-sm text-zinc-400">Reintentando en {loadError.retryIn}s…</p>
            : <button type="button" onClick={retryLoad} className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-950">Reintentar</button>}
        </div>
      </Centered>
    );
  }
  if (loading) return <Centered><p className="text-sm text-zinc-400">Cargando tu día…</p></Centered>;

  const value = {
    user, logout, pomodoro, agenda, habits, finance, hours, summary, subjects, setSubjectOptions,
    shopping: { items: shoppingItems, setItems: setShoppingItems, categories: shoppingCategories, setCategories: setShoppingCategories },
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
