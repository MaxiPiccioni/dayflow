"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])";

// Popup a pantalla completa del sandbox: Escape o la X lo cierran (se vuelve a la materia), el foco queda adentro
// mientras está abierto y la página de atrás no se desplaza.
export function SandboxPopup({ title, onClose, headerExtra, children }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        // Si hay una lista abierta (selectores), Escape solo la cierra a ella.
        if (document.querySelector("[role='listbox']") || event.target.closest?.("[data-keep-escape]")) return;
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !ref.current) return;
      const nodes = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-[#f4f5ef] text-zinc-900 outline-none dark:bg-zinc-950 dark:text-zinc-100"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-white/90 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/90">
        <h2 className="truncate text-sm font-semibold sm:text-base">{title}</h2>
        <div className="flex min-w-0 flex-1 items-center gap-2">{headerExtra}</div>
        <button type="button" onClick={onClose} aria-label="Cerrar el sandbox y volver a la materia" title="Cerrar (Escape)" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 hover:border-lime-500 dark:border-zinc-700">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      {children}
    </div>,
    document.body,
  );
}
