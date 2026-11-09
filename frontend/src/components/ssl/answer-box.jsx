import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { SymbolField } from "@/components/ssl/symbol-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkAnswer } from "@/lib/ssl/check";
import { RECURSION_OPTIONS } from "@/lib/ssl/grammar";
import { inputClass } from "@/lib/faculty";

const YES_NO = [["si", "Sí"], ["no", "No"]];
const TYPE_OPTIONS = [
  ["0", "Tipo 0 · Estructurada por frases"],
  ["1", "Tipo 1 · Dependiente del contexto"],
  ["2", "Tipo 2 · Independiente del contexto"],
  ["3", "Tipo 3 · Regular"],
];

// Qué control corresponde a cada tipo de comprobación.
const OPTIONS = { "grammar-type": TYPE_OPTIONS, "recursion-type": RECURSION_OPTIONS, recursion: YES_NO, ambiguity: YES_NO, equivalent: YES_NO, "dfa-equivalent": YES_NO };
const MULTILINE = new Set(["wordset", "grammar-language", "language-words", "grammar", "regex-words"]);
const PLACEHOLDER = {
  wordset: "a, b, ab …",
  "grammar-language": "01, 0011, …",
  "language-words": "ee, dee, …",
  "regex-words": "λ, 0, 11, …",
  grammar: "S := aA | b\nA := …",
  regex: "1(0+1)*0",
  derivation: "S → aA → ab",
  expr: "aabaab",
  text: "aabaab",
  number: "3",
  "clean-field": "A, B …",
};

// Una respuesta del usuario con su botón "Comprobar". El texto se guarda en el progreso; el veredicto no.
export function AnswerBox({ check, value, onChange }) {
  const [result, setResult] = useState(null);
  const { spec, label } = check;
  const options = spec.kind === "choice" ? spec.options : OPTIONS[spec.kind];
  const labelText = label ?? "Tu respuesta";

  const run = () => setResult(checkAnswer(spec, value));
  const change = (next) => { setResult(null); onChange(next); };

  return (
    <div className="space-y-2">
      {options ? (
        <label className="block text-xs text-zinc-500">
          {labelText}
          <Select value={value || undefined} onValueChange={change}>
            <SelectTrigger className="mt-1 w-full sm:w-96" aria-label={labelText}><SelectValue placeholder="Elegí una opción" /></SelectTrigger>
            <SelectContent>{options.map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent>
          </Select>
        </label>
      ) : spec.kind === "number" ? (
        <label className="block text-xs text-zinc-500">
          {labelText}
          <input type="text" inputMode="decimal" value={value} onChange={(event) => change(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") run(); }} placeholder={PLACEHOLDER.number} className={`${inputClass} mt-1 w-32 font-mono`} />
        </label>
      ) : (
        <SymbolField label={labelText} value={value} onChange={change} multiline={MULTILINE.has(spec.kind)} rows={3} placeholder={PLACEHOLDER[spec.kind]} onEnter={run} />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-950">Comprobar</button>
        <div role="status" aria-live="polite" className="min-w-0 flex-1 text-sm">
          {result && (
            <div className={result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}>
              <p className="flex items-start gap-1.5">
                {result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
                <span className="break-words">{result.message}</span>
              </p>
              {result.detail?.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-9 text-xs text-zinc-500 dark:text-zinc-400">{result.detail.map((line) => <li key={line}>{line}</li>)}</ul>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
