import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepReveal } from "@/components/ssl/step-reveal";
import { GrammarFields } from "@/components/ssl/tools/grammar-fields";
import { fmtWord } from "@/lib/ssl/notation";
import { findDerivations, formatDerivation, formatGrammar, generateLanguage, parseGrammar } from "@/lib/ssl/grammar";
import { cleanGrammar, eliminateLeftRecursion, toChomsky, toGreibach, wellFormed } from "@/lib/ssl/transform";

const MODES = {
  clean: { title: "Gramática limpia", run: cleanGrammar },
  wellformed: { title: "Gramática bien formada", run: wellFormed },
  leftrec: { title: "Sin recursividad por izquierda", run: eliminateLeftRecursion },
  fnc: { title: "Forma Normal de Chomsky", run: toChomsky },
  fng: { title: "Forma Normal de Greibach", run: toGreibach },
};

// Dos cadenas cortas del lenguaje para derivar antes y después de la transformación (ejercicio 24).
function SamplePair({ before, after }) {
  const words = useMemo(() => generateLanguage(before, 6).words.filter((w) => w.length >= 2).slice(0, 2), [before]);
  if (!words.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-zinc-500">Derivar antes y después</p>
      <div className="space-y-2 text-sm">
        {words.map((word) => {
          const a = findDerivations(before, word, { limit: 1 }).derivations[0];
          const b = findDerivations(after, word, { limit: 1 }).derivations[0];
          return (
            <div key={word} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Cadena <span className="font-mono">{fmtWord(word)}</span></p>
              <p className="mt-1 break-words font-mono"><span className="text-zinc-400">Antes:</span> {a ? formatDerivation(a) : "—"}</p>
              <p className="mt-1 break-words font-mono"><span className="text-zinc-400">Después:</span> {b ? formatDerivation(b) : "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Aplica un procedimiento (limpiar, bien formar, quitar recursividad por izquierda, FNC o FNG) mostrando cada paso.
export function TransformTool({ tool }) {
  const [modeKey, setModeKey] = useState(tool.mode);
  const mode = MODES[modeKey];
  const [fields, setFields] = useState(tool.grammar);
  const parsed = useMemo(() => parseGrammar(fields), [fields]);
  const outcome = useMemo(() => {
    if (!parsed.grammar) return null;
    try {
      return mode.run(parsed.grammar);
    } catch (err) {
      return { error: err.message, steps: [] };
    }
  }, [parsed, mode]);

  return (
    <div className="space-y-4">
      <label className="block text-xs text-zinc-500">
        Transformación
        <Select value={modeKey} onValueChange={setModeKey}>
          <SelectTrigger className="mt-1 w-full sm:w-80" aria-label="Transformación de la gramática"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(MODES).map(([key, { title }]) => <SelectItem key={key} value={key}>{title}</SelectItem>)}</SelectContent>
        </Select>
      </label>
      <GrammarFields fields={fields} onChange={setFields} />
      {parsed.error && <p role="alert" className="text-sm text-red-600">{parsed.error}</p>}
      {outcome && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-500">Procedimiento: {mode.title}</p>
            {outcome.steps.length > 0 && <StepReveal key={JSON.stringify(fields) + modeKey} steps={outcome.steps} />}
          </div>
          {(outcome.error || outcome.empty) && <p role="status" className="text-sm text-red-600">{outcome.error ?? "La gramática no genera ninguna cadena."}</p>}
          {outcome.warnings?.map((warning) => <p key={warning} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">{warning}</p>)}
          {outcome.grammar && (
            <div className="rounded-xl border border-lime-500/50 bg-lime-50/50 p-3 dark:bg-lime-400/5">
              <p className="mb-1 text-xs font-semibold text-zinc-500">Resultado</p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{formatGrammar(outcome.grammar, "G'", "P'")}</pre>
              {outcome.valid === false && <p className="mt-1 text-xs text-red-600">El resultado no cumple la forma pedida.</p>}
            </div>
          )}
          {modeKey === "fnc" && outcome.grammar && <SamplePair before={parsed.grammar} after={outcome.grammar} />}
        </div>
      )}
    </div>
  );
}
