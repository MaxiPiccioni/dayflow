import { useMemo, useState } from "react";
import { SymbolField } from "@/components/ssl/symbol-field";
import { compileRegex, enumerateRegex } from "@/lib/ssl/regex";
import { fmtWord, parseWord } from "@/lib/ssl/notation";
import { inputClass } from "@/lib/faculty";

// Probador de expresiones regulares: dice si una cadena pertenece al lenguaje y enumera sus primeras cadenas.
export function RegexTool({ tool }) {
  const [regex, setRegex] = useState(tool.regex);
  const [word, setWord] = useState("");
  const [count, setCount] = useState(12);

  const compiled = useMemo(() => compileRegex(regex), [regex]);
  const listing = useMemo(() => (compiled.error ? null : enumerateRegex(regex, { count: Math.min(Math.max(count, 1), 100) })), [compiled, regex, count]);
  const verdict = compiled.error || word.trim() === "" ? null : compiled.test(parseWord(word));

  return (
    <div className="space-y-3">
      <SymbolField
        label="Expresión regular"
        value={regex}
        onChange={setRegex}
        placeholder="(11+0)*"
        hint="+ es la unión, * la clausura de Kleene, ⁺ la clausura positiva y λ la cadena vacía."
      />
      {compiled.error ? (
        <p role="alert" className="text-sm text-red-600">{compiled.error}</p>
      ) : (
        <>
          <div>
            <SymbolField label="Probar una cadena" value={word} onChange={setWord} placeholder="0110" />
            <p role="status" aria-live="polite" className="mt-1.5 text-sm">
              {verdict === null ? <span className="text-zinc-400">Escribí una cadena para ver si pertenece al lenguaje.</span> : verdict ? <span className="font-medium text-emerald-600 dark:text-emerald-400">{fmtWord(parseWord(word))} pertenece al lenguaje.</span> : <span className="font-medium text-red-600">{fmtWord(parseWord(word))} no pertenece al lenguaje.</span>}
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              Cantidad de cadenas
              <input type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value) || 1)} className={`${inputClass} w-24`} />
            </label>
            <p className="mt-1.5 break-words font-mono text-sm" aria-live="polite">
              {listing.words.length ? `{ ${listing.words.map(fmtWord).join(", ")}${listing.truncated || listing.words.length >= count ? ", …" : ""} }` : "∅"}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">Alfabeto: {`{${listing.alphabet.join(", ")}}`} · de menor a mayor longitud.</p>
          </div>
        </>
      )}
    </div>
  );
}
