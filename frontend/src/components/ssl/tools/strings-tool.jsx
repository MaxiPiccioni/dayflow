import { useMemo, useState } from "react";
import { SymbolField } from "@/components/ssl/symbol-field";
import { fmtWord, parseWord } from "@/lib/ssl/notation";
import { evalStringExpr, innerSubstrings, length, properPrefixes, properSuffixes, reverse } from "@/lib/ssl/strings";

const list = (words) => (words.length ? words.join(", ") : "—");

// Calculadora de cadenas: evalúa expresiones con las cadenas dadas y analiza una palabra.
export function StringsTool({ tool }) {
  const [env, setEnv] = useState(tool.env);
  const [expr, setExpr] = useState("(α . δ)^-1");
  const [word, setWord] = useState(tool.env[tool.focus ?? "α"] ?? "");

  const result = useMemo(() => evalStringExpr(expr, env), [expr, env]);
  const w = parseWord(word);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(env).map(([name, value]) => (
          <SymbolField key={name} label={`${name} =`} value={value} onChange={(next) => setEnv((current) => ({ ...current, [name]: next }))} />
        ))}
      </div>

      <div>
        <SymbolField label="Expresión (. concatena · ^2 potencia · ^-1 reflejo)" value={expr} onChange={setExpr} placeholder="[(β . γ)^-1]^2" />
        <p className="mt-1.5 text-sm" role="status" aria-live="polite">
          {result.error ? <span className="text-red-600">{result.error}</span> : <>Resultado: <span className="font-mono font-semibold">{fmtWord(result.value)}</span> <span className="text-zinc-400">(longitud {length(result.value)})</span></>}
        </p>
      </div>

      <div>
        <SymbolField label="Analizar una cadena" value={word} onChange={setWord} />
        <dl className="mt-2 grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-zinc-500">Longitud</dt><dd className="font-mono">|{fmtWord(w)}| = {length(w)}</dd>
          <dt className="text-zinc-500">Reflejo</dt><dd className="break-all font-mono">{fmtWord(reverse(w))}</dd>
          <dt className="text-zinc-500">Prefijos propios</dt><dd className="break-all font-mono">{list(properPrefixes(w))}</dd>
          <dt className="text-zinc-500">Sufijos propios</dt><dd className="break-all font-mono">{list(properSuffixes(w))}</dd>
          <dt className="text-zinc-500">Ni prefijos ni sufijos</dt><dd className="break-all font-mono">{list(innerSubstrings(w))}</dd>
        </dl>
      </div>
    </div>
  );
}
