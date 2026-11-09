import { useState } from "react";
import { Gauge } from "lucide-react";
import { analyzeComplexity, complexityFamilies } from "@/lib/ssl/machines/complexity";

const button = "flex items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:border-lime-500 dark:border-zinc-700";

// Mide con el simulador cuántos pasos (T) y cuántas celdas (E) usa la máquina del editor con cadenas de largo creciente
// y ajusta un polinomio exacto, como en el método experimental de la guía (ejercicio 22).
export function ComplexityPanel({ machine, family }) {
  const [result, setResult] = useState(null);
  const info = complexityFamilies[family];
  if (!info) return null;
  const run = () => {
    try {
      setResult(analyzeComplexity(machine, family));
    } catch (err) {
      setResult({ rows: [], error: err.message });
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-500">Complejidad de tu máquina · cadenas {info.label}</p>
        <button type="button" onClick={run} className={button}><Gauge size={14} aria-hidden="true" /> Medir T(n) y E(n)</button>
      </div>
      {result?.error && <p role="status" className="text-sm text-red-700 dark:text-red-300">{result.error}</p>}
      {result && !result.error && (
        <div className="space-y-2" role="status" aria-live="polite">
          <div className="w-0 min-w-full overflow-x-auto">
            <table className="w-full min-w-64 border-collapse text-sm">
              <caption className="sr-only">Pasos y celdas de cinta según el largo n de la cadena</caption>
              <thead><tr className="text-left text-xs text-zinc-500"><th className="px-2 py-1">n</th><th className="px-2 py-1">Cadena</th><th className="px-2 py-1">T(n) pasos</th><th className="px-2 py-1">E(n) celdas</th></tr></thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.input} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-2 py-1 font-mono">{row.n}</td>
                    <td className="max-w-40 truncate px-2 py-1 font-mono" title={row.input}>{row.input}</td>
                    <td className="px-2 py-1 font-mono">{row.steps}</td>
                    <td className="px-2 py-1 font-mono">{row.cells}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {[["T(n)", result.time], ["E(n)", result.space]].map(([name, fit]) => fit && (
            <p key={name} className="break-words text-sm">
              <span className="font-semibold">{name} = </span><span className="font-mono">{fit.text}</span>
              <span className="ml-2 text-xs text-zinc-500">{fit.verified ? `(el polinomio, ajustado con los primeros cuatro puntos, predice bien los otros ${fit.extra})` : "(no coincide con los demás puntos: puede no ser un polinomio de grado 3 o menos)"}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
