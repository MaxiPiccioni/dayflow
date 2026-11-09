import { useId, useRef, useState } from "react";
import { Keyboard } from "lucide-react";
import { SYMBOL_KEYS } from "@/lib/ssl/notation";
import { inputClass } from "@/lib/faculty";

// Campo de texto con un teclado de símbolos (λ Σ α β γ δ ∪ ∩ ⁻¹ → ^ ≥ …) que inserta donde está el cursor.
export function SymbolField({ label, value, onChange, multiline = false, rows = 3, placeholder, hint, onEnter, className = "", labelClassName = "text-xs text-zinc-500" }) {
  const id = useId();
  const panelId = `${id}-symbols`;
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  const insert = (symbol) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    onChange(value.slice(0, start) + symbol + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  };

  const shared = {
    id,
    value,
    placeholder,
    spellCheck: false,
    autoComplete: "off",
    autoCapitalize: "off",
    onChange: (event) => onChange(event.target.value),
  };
  const fieldClass = `${inputClass} font-mono`;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className={labelClassName}>{label}</label>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={panelId} className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
          <Keyboard size={13} aria-hidden="true" /> Símbolos
        </button>
      </div>
      {multiline ? (
        <textarea {...shared} ref={ref} rows={rows} className={`${fieldClass} resize-y`} />
      ) : (
        <input {...shared} ref={ref} type="text" className={fieldClass} onKeyDown={(event) => { if (event.key === "Enter" && onEnter) { event.preventDefault(); onEnter(); } }} />
      )}
      {hint && <p className="mt-1 text-[11px] text-zinc-400">{hint}</p>}
      {open && (
        <div id={panelId} role="group" aria-label="Teclado de símbolos" className="mt-1.5 flex flex-wrap gap-1 rounded-xl bg-zinc-50 p-1.5 dark:bg-zinc-800/60">
          {SYMBOL_KEYS.map(([symbol, description]) => (
            <button
              key={symbol}
              type="button"
              title={description}
              aria-label={description}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insert(symbol)}
              className="min-w-8 rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-sm text-zinc-800 hover:border-lime-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
