"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { todayIso } from "@/lib/dates";
import { fromApiEvent, fromApiTask, toApiEvent, toApiTask } from "@/lib/mappers";

// Tareas, eventos y categorías (con sus modales). Las altas, cambios y bajas se aplican al instante y se
// deshacen si el servidor las rechaza.
export function useAgenda() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [date, setDate] = useState(todayIso);
  const [taskModal, setTaskModal] = useState(null);
  const [eventModal, setEventModal] = useState(null);
  const [dayModal, setDayModal] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const applyLoaded = useCallback((dashboardData, eventsData, categoriesData) => {
    setTasks(dashboardData.tasks.map(fromApiTask));
    setEvents(eventsData.map(fromApiEvent));
    setCategories(categoriesData);
  }, []);

  const toggleTask = (id) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
    api(`/tasks/${id}/complete`, { method: "PATCH" }).catch(() => setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task))));
  };
  const openTask = (task, selectedDate = date) => {
    setDate(selectedDate);
    setTaskModal(task || { date: selectedDate });
  };
  const saveTask = (task) => {
    const existing = tasks.find((item) => item.id === task.id);
    const payload = toApiTask(task);
    setTasks(existing ? tasks.map((item) => (item.id === task.id ? task : item)) : [...tasks, task]);
    setTaskModal(null);
    if (existing) {
      api(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        .then((updated) => setTasks((current) => current.map((item) => (item.id === task.id ? fromApiTask(updated) : item))))
        .catch(() => setTasks((current) => current.map((item) => (item.id === task.id ? existing : item))));
    } else {
      api("/tasks", { method: "POST", body: JSON.stringify(payload) })
        .then((created) => setTasks((current) => [...current.filter((item) => item.id !== task.id), ...created.map(fromApiTask)]))
        .catch(() => setTasks((current) => current.filter((item) => item.id !== task.id)));
    }
  };
  const deleteTask = (id) => {
    const previous = tasks;
    setTasks(tasks.filter((task) => task.id !== id));
    setTaskModal(null);
    api(`/tasks/${id}`, { method: "DELETE" }).catch(() => setTasks(previous));
  };

  const addCategory = (name) => api("/categories", { method: "POST", body: JSON.stringify({ name }) })
    .then((created) => setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name))));
  const removeCategory = (id) => {
    const previous = categories;
    const removed = categories.find((category) => category.id === id);
    setCategories(categories.filter((category) => category.id !== id));
    if (removed) {
      setTasks((current) => current.map((task) => (task.category === removed.name ? { ...task, category: null } : task)));
      setEvents((current) => current.map((event) => (event.type === removed.name ? { ...event, type: null } : event)));
    }
    api(`/categories/${id}`, { method: "DELETE" }).catch(() => setCategories(previous));
  };

  const toggleEvent = (id) => {
    const previous = events.find((item) => item.id === id);
    setEvents(events.map((event) => (event.id === id ? { ...event, done: !event.done } : event)));
    api(`/events/${id}/toggle`, { method: "PATCH" }).catch(() => setEvents((current) => current.map((event) => (event.id === id ? previous : event))));
  };
  const openEvent = (event, selectedDate = date) => {
    setDate(selectedDate);
    setEventModal(event || { date: selectedDate });
  };
  const saveEvent = (event) => {
    const existing = events.find((item) => item.id === event.id);
    const payload = toApiEvent(event);
    setEvents(existing ? events.map((item) => (item.id === event.id ? event : item)) : [...events, { ...event, done: false }]);
    setEventModal(null);
    if (existing) {
      api(`/events/${event.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        .then((updated) => setEvents((current) => current.map((item) => (item.id === event.id ? fromApiEvent(updated) : item))))
        .catch(() => setEvents((current) => current.map((item) => (item.id === event.id ? existing : item))));
    } else {
      api("/events", { method: "POST", body: JSON.stringify(payload) })
        .then((created) => setEvents((current) => [...current.filter((item) => item.id !== event.id), ...created.map(fromApiEvent)]))
        .catch(() => setEvents((current) => current.filter((item) => item.id !== event.id)));
    }
  };
  const deleteEvent = (id) => {
    const previous = events;
    setEvents(events.filter((event) => event.id !== id));
    setEventModal(null);
    api(`/events/${id}`, { method: "DELETE" }).catch(() => setEvents(previous));
  };

  return {
    tasks, events, categories, date, setDate,
    taskModal, setTaskModal, eventModal, setEventModal, dayModal, setDayModal, categoryModalOpen, setCategoryModalOpen,
    applyLoaded, toggleTask, openTask, saveTask, deleteTask, addCategory, removeCategory, toggleEvent, openEvent, saveEvent, deleteEvent,
    openCategoryManager: () => setCategoryModalOpen(true),
  };
}
