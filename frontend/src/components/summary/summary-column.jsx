"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";

// Tarjeta del Resumen que se puede arrastrar (por el botón de la esquina) para reordenarla.
function DraggableCard({ id, onReorder, onDragStateChange, children }) {
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const onDragStart = (event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDragging(true);
    onDragStateChange?.(id);
  };
  const onDragEnd = () => { setDragging(false); onDragStateChange?.(null); };
  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dragOver) setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const draggedId = event.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== id) onReorder(draggedId, id);
  };
  return (
    <div
      className={`relative rounded-2xl transition-[opacity,box-shadow] duration-150 ${dragging ? "opacity-40" : ""} ${dragOver ? "ring-2 ring-lime-400 ring-offset-2 ring-offset-[#f4f5ef] dark:ring-offset-zinc-950" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-label="Arrastrar para reordenar"
        title="Arrastrar para reordenar"
        className="absolute -right-2 -top-2 grid h-7 w-7 cursor-grab place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm hover:text-zinc-600 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-300"
      >
        <MoreVertical size={14} />
      </button>
    </div>
  );
}

// Zona al final de cada columna para soltar un widget ahí.
function ColumnDropZone({ columnIndex, onDropToColumn }) {
  const [dragOver, setDragOver] = useState(false);
  const onDragOver = (event) => {
    event.preventDefault();
    if (!dragOver) setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const draggedId = event.dataTransfer.getData("text/plain");
    if (draggedId) onDropToColumn(draggedId, columnIndex);
  };
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`grid min-h-10 place-items-center rounded-2xl border-2 border-dashed transition-colors ${dragOver ? "border-lime-400 bg-lime-100/40 dark:bg-lime-500/10" : "border-transparent"}`}
    >
      {dragOver && <span className="text-xs font-medium text-lime-600">Soltar al final de esta columna</span>}
    </div>
  );
}

export function SummaryColumn({ columnIndex, ids, widgets, onReorder, onDropToColumn, onDragStateChange }) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      {ids.map((id) => <DraggableCard key={id} id={id} onReorder={onReorder} onDragStateChange={onDragStateChange}>{widgets[id]}</DraggableCard>)}
      <ColumnDropZone columnIndex={columnIndex} onDropToColumn={onDropToColumn} />
    </div>
  );
}
