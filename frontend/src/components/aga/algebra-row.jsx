"use client";

import { X } from "lucide-react";
import { MatrixSmall } from "@/components/aga/matrix-table";
import { fmtVal, isM } from "@/lib/aga/engine";

const MATRIX_WORDS = /Nula|Identidad|Inversa|Rref|MatP|Rango|Tipo|Igual|Traza|Det|EsReducida|Equivalentes|cos|sin|√/g;
const VECTOR_WORDS = /cos|sin|tan|sqrt|Vector|Norma|Unitario|Trasladar|Extremo|Suma|Comp|Rango|CL|Dependencia/g;

const Name = ({ children }) => <i className="font-serif text-[15px] font-medium">{children}</i>;
const Definition = ({ children }) => <div className="break-words font-mono text-[11px] text-zinc-500">{children}</div>;

function RowBody({ obj, dec }) {
  if (obj.err) return <><div className="font-mono text-[12.5px]"><Name>{obj.name}</Name></div><div className="text-[11.5px] text-red-500">{obj.err}</div><Definition>{obj.cmd}</Definition></>;
  if (isM(obj.v)) {
    const showCmd = /[A-Za-z]/.test(obj.cmd.replace(MATRIX_WORDS, ""));
    return <><div className="font-mono text-[12.5px]"><Name>{obj.name}</Name> =</div><div className="max-w-full overflow-x-auto"><MatrixSmall v={obj.v} /></div>{showCmd && <Definition>{obj.cmd}</Definition>}</>;
  }
  const f = fmtVal(obj.v, dec);
  const showCmd = /[A-Za-z]/.test(obj.cmd.replace(VECTOR_WORDS, "").replace(/[0-9]/g, ""));
  return <><div className="break-words font-mono text-[12.5px]"><Name>{obj.name}</Name> = {f.main}</div>{f.approx && <div className="font-mono text-[11px] text-zinc-500">{f.approx}</div>}{showCmd && <Definition>{obj.cmd}</Definition>}</>;
}

// Una fila de la vista algebraica: punto de color (mostrar u ocultar), valor o error, y borrar. Doble clic edita la orden.
export function AlgebraRow({ obj, color, drawable, selected, editing, visible, dec, onSelect, onToggle, onDelete, onEdit, onCommit, onCancel }) {
  return (
    <div
      aria-selected={selected}
      onClick={(event) => { if (!event.target.closest("input")) onSelect(); }}
      onDoubleClick={onEdit}
      className={`group flex items-start gap-2 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800 ${selected ? "bg-lime-100/70 dark:bg-lime-400/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
    >
      <button
        type="button"
        disabled={!drawable}
        onClick={(event) => { event.stopPropagation(); onToggle(); }}
        aria-label={`Mostrar u ocultar ${obj.name}`}
        style={{ borderColor: drawable ? color : undefined, backgroundColor: drawable && visible ? color : "transparent" }}
        className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 p-0 ${drawable ? "" : "border-dashed border-zinc-400"}`}
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={obj.raw.replace(/^[!~]+/, "")}
            aria-label="Editar objeto"
            data-keep-escape
            onFocus={(event) => event.target.select()}
            onKeyDown={(event) => { if (event.key === "Enter") onCommit(event.target.value); else if (event.key === "Escape") onCancel(); }}
            onBlur={onCancel}
            className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 font-mono text-[12.5px] dark:border-zinc-700 dark:bg-zinc-950"
          />
        ) : <RowBody obj={obj} dec={dec} />}
      </div>
      <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }} aria-label={`Eliminar ${obj.name}`} className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 hover:text-red-500 focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"><X size={14} aria-hidden="true" /></button>
    </div>
  );
}
