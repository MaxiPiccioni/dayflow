import { useState } from "react";
import { MathText } from "@/components/ssl/math-text";

const smallButton = "rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";

// Pasos de un procedimiento que se van mostrando de a uno. steps: [{ title, text? , lines? }].
export function StepReveal({ steps, startAt = 1 }) {
  const [shown, setShown] = useState(Math.min(startAt, steps.length));
  const visible = steps.slice(0, shown);
  const done = shown >= steps.length;

  return (
    <div>
      <ol className="space-y-2.5">
        {visible.map((step, index) => (
          <li key={index} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Paso {index + 1} · {step.title}</p>
            {step.text && <MathText text={step.text} className="mt-1 block text-sm leading-relaxed" />}
            {step.lines?.length > 0 && <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{step.lines.join("\n")}</pre>}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setShown((n) => Math.min(n + 1, steps.length))} disabled={done} className={smallButton}>Siguiente paso</button>
        <button type="button" onClick={() => setShown(steps.length)} disabled={done} className={smallButton}>Mostrar todo</button>
        <button type="button" onClick={() => setShown(1)} disabled={shown === 1} className={smallButton}>Empezar de nuevo</button>
        <span className="text-xs text-zinc-400" aria-live="polite">{shown} de {steps.length}</span>
      </div>
    </div>
  );
}
