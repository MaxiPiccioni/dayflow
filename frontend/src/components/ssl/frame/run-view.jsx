"use client";

import { ConfigTree, StackView, TapeView } from "@/components/ssl/editor/machine-runner";
import { useSession } from "@/components/ssl/frame/session-context";

// Contenido de la pestaña "Ejecución": la cadena y su descripción instantánea, el árbol, la pila o la cinta.
export function RunView() {
  const s = useSession();
  const { run, step, k, last, finished, machine } = s;
  if (s.errors.length > 0) return <p className="text-sm text-red-600">{s.errors[0]} Corregilo para poder ejecutar.</p>;
  if (!s.started) {
    return <p className="text-sm text-zinc-500">Apretá Play para que la máquina funcione sola, o “Paso adelante” (modo manual) para avanzar de a un paso con la cadena <span className="font-mono">{s.input || "λ"}</span>. La cadena se cambia en el botón de ajustes de la barra lateral.</p>;
  }
  if (run?.error) return <p role="alert" className="text-sm text-red-600">{run.error}</p>;
  if (!run) return null;
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500" aria-live="polite">Cadena <span className="font-mono">{s.input || "λ"}</span> · paso {k} de {last}</p>
      {run.kind === "tape" && <TapeView tape={step.tape} head={step.head} blank={machine.blank} />}
      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-500">{run.kind === "tape" ? "Estado actual" : step.lines.length > 1 ? "Descripciones instantáneas activas" : "Descripción instantánea actual"}</p>
        <ul className="space-y-0.5 font-mono text-sm" aria-live="polite">{step.lines.slice(0, 12).map((line, i) => <li key={i}>{line}</li>)}{step.lines.length > 12 && <li className="text-zinc-400">… y {step.lines.length - 12} más</li>}</ul>
      </div>
      {run.kind === "ap" && step.stacks?.length > 0 && (
        <div className="flex flex-wrap items-end gap-4">{step.stacks.slice(0, 4).map((stack, i) => <StackView key={i} stack={stack} />)}</div>
      )}
      {run.kind === "tape" && (
        <div className="max-h-40 overflow-auto rounded-xl border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-800">
          {run.raw.steps.slice(0, k + 1).map((t) => <p key={t.n} className={t.n === k ? "font-bold text-lime-700 dark:text-lime-400" : "text-zinc-500"}>{String(t.n).padStart(2, "0")} {t.state}: {t.tape.join("")}</p>)}
        </div>
      )}
      {run.kind !== "tape" && <ConfigTree run={run} k={k} />}
      {finished && (
        <p role="status" className={`rounded-xl px-3 py-2 text-sm font-medium ${run.outcome === "reconocida" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : run.outcome === "error" ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}`}>{run.message}</p>
      )}
      {run.kind === "ap" && run.accepted && finished && (
        <div className="w-0 min-w-full overflow-x-auto">
          <table className="border-collapse text-center font-mono text-xs">
            <caption className="mb-1 text-left text-xs font-semibold text-zinc-500">Tabla operativa (el camino que lleva a la aceptación)</caption>
            <thead><tr>{["N.º", "Estado", "Cadena a leer", "Contenido de pila"].map((h) => <th key={h} scope="col" className="border border-zinc-300 bg-zinc-100 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800">{h}</th>)}</tr></thead>
            <tbody>{run.raw.table.map((r) => <tr key={r.n}><td className="border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">{r.n}</td><td className="border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">{r.state}</td><td className="border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">{r.rest === "" ? "-" : r.rest}</td><td className="border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">{r.stack}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {run.truncated && <p className="text-xs text-amber-700 dark:text-amber-300">La búsqueda se cortó por tamaño: el árbol puede estar incompleto.</p>}
    </div>
  );
}
