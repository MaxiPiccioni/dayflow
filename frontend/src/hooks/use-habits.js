"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { fromApiHabit, fromApiHabitOverview } from "@/lib/mappers";

// Hábitos, sus registros por día y el resumen general del tracker.
export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [habitDate, setHabitDate] = useState(todayIso);
  const [habitLogs, setHabitLogs] = useState({});
  const [habitsOverview, setHabitsOverview] = useState([]);
  const [habitModal, setHabitModal] = useState(null);

  const applyLoaded = useCallback((dashboardData, overviewData) => {
    setHabits(dashboardData.habits.map(fromApiHabit));
    setHabitsOverview(overviewData.map(fromApiHabitOverview));
  }, []);

  // Los registros de cada hábito se piden solo cuando cambia el conjunto de hábitos, no en cada cambio de cuenta.
  const habitIdsKey = habits.map((habit) => habit.id).join(",");
  useEffect(() => {
    if (!habitIdsKey) return;
    Promise.all(habits.map((habit) => api(`/habits/${habit.id}/logs`).then((logs) => [habit.id, logs]))).then((entries) => {
      const map = {};
      entries.forEach(([id, logs]) => {
        map[id] = {};
        logs.forEach((log) => { map[id][log.log_date] = log.count; });
      });
      setHabitLogs((current) => ({ ...current, ...map }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se pide de nuevo solo si cambia el conjunto de hábitos, no en cada cambio de cuenta
  }, [habitIdsKey]);

  const setHabitCount = (habitId, dateStr, nextCount) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) return;
    const previousHabits = habits;
    const previousLogs = habitLogs;
    setHabitLogs((current) => ({ ...current, [habitId]: { ...(current[habitId] || {}), [dateStr]: nextCount } }));
    if (dateStr === todayIso()) {
      const progress = habit.target ? Math.round((nextCount / habit.target) * 100) : 0;
      setHabits((current) => current.map((item) => (item.id === habitId ? { ...item, count: nextCount, progress } : item)));
    }
    api(`/habits/${habitId}/logs/${dateStr}?client_today=${todayIso()}`, { method: "PUT", body: JSON.stringify({ count: nextCount }) })
      .then((updated) => setHabits((current) => current.map((item) => (item.id === habitId ? fromApiHabit(updated) : item))))
      .catch(() => { setHabits(previousHabits); setHabitLogs(previousLogs); });
  };

  const saveHabit = (habit) => {
    const existing = habits.find((item) => item.id === habit.id);
    setHabits(existing ? habits.map((item) => (item.id === habit.id ? habit : item)) : [...habits, habit]);
    setHabitModal(null);
    const body = JSON.stringify({ name: habit.name, target: habit.target, unit: habit.unit });
    if (existing) {
      api(`/habits/${habit.id}?client_today=${todayIso()}`, { method: "PATCH", body })
        .then((updated) => setHabits((current) => current.map((item) => (item.id === habit.id ? fromApiHabit(updated) : item))))
        .catch(() => setHabits((current) => current.map((item) => (item.id === habit.id ? existing : item))));
    } else {
      api(`/habits?client_today=${todayIso()}`, { method: "POST", body })
        .then((created) => setHabits((current) => current.map((item) => (item.id === habit.id ? fromApiHabit(created) : item))))
        .catch(() => setHabits((current) => current.filter((item) => item.id !== habit.id)));
    }
  };

  const deleteHabit = (id) => {
    const previous = habits;
    setHabits(habits.filter((habit) => habit.id !== id));
    setHabitModal(null);
    api(`/habits/${id}`, { method: "DELETE" }).catch(() => setHabits(previous));
  };

  return { habits, habitDate, setHabitDate, habitLogs, habitsOverview, habitModal, setHabitModal, applyLoaded, setHabitCount, saveHabit, deleteHabit };
}
