"use client";

import { useEffect, useState } from "react";
import { SUMMARY_LAYOUT_KEY, WIDGET_META, loadSummaryLayout } from "@/lib/summary-layout";

// Distribución de los widgets del Resumen (dos columnas) y el estado del arrastre.
export function useSummaryLayout() {
  const [summaryColumns, setSummaryColumns] = useState(loadSummaryLayout);
  const [draggingWidgetId, setDraggingWidgetId] = useState(null);
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);

  useEffect(() => { localStorage.setItem(SUMMARY_LAYOUT_KEY, JSON.stringify(summaryColumns)); }, [summaryColumns]);

  // Al arrastrar cerca del borde de la ventana, la página se desplaza sola.
  useEffect(() => {
    if (!draggingWidgetId) return undefined;
    const EDGE = 100;
    const MAX_SPEED = 22;
    const onDragOverWindow = (event) => {
      const y = event.clientY;
      if (y < EDGE) window.scrollBy(0, -MAX_SPEED * (1 - y / EDGE));
      else if (y > window.innerHeight - EDGE) window.scrollBy(0, MAX_SPEED * (1 - (window.innerHeight - y) / EDGE));
    };
    window.addEventListener("dragover", onDragOverWindow);
    return () => window.removeEventListener("dragover", onDragOverWindow);
  }, [draggingWidgetId]);

  const reorderSummary = (draggedId, targetId) => setSummaryColumns((current) => {
    const next = current.map((column) => column.filter((item) => item !== draggedId));
    const targetColumnIndex = next.findIndex((column) => column.includes(targetId));
    if (targetColumnIndex === -1) return current;
    const targetColumn = [...next[targetColumnIndex]];
    targetColumn.splice(targetColumn.indexOf(targetId), 0, draggedId);
    next[targetColumnIndex] = targetColumn;
    return next;
  });
  const moveSummaryToColumn = (draggedId, columnIndex) => setSummaryColumns((current) => {
    const next = current.map((column) => column.filter((item) => item !== draggedId));
    next[columnIndex] = [...next[columnIndex], draggedId];
    return next;
  });
  const addWidget = (id) => setSummaryColumns((current) => {
    const shorterIndex = current[0].length <= current[1].length ? 0 : 1;
    const next = current.map((column) => [...column]);
    next[shorterIndex].push(id);
    return next;
  });
  const removeWidget = (id) => setSummaryColumns((current) => current.map((column) => column.filter((item) => item !== id)));

  const presentWidgetIds = new Set(summaryColumns.flat());
  const availableWidgets = WIDGET_META.filter((widget) => !presentWidgetIds.has(widget.id));

  return { summaryColumns, draggingWidgetId, setDraggingWidgetId, widgetPickerOpen, setWidgetPickerOpen, availableWidgets, reorderSummary, moveSummaryToColumn, addWidget, removeWidget };
}
