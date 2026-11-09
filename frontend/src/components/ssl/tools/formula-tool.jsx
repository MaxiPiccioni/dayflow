import { useMemo, useState } from "react";
import { MathText } from "@/components/ssl/math-text";
import { SymbolField } from "@/components/ssl/symbol-field";
import { fmtWord } from "@/lib/ssl/notation";
import { enumerateFormula } from "@/lib/ssl/languages";
import { inputClass } from "@/lib/faculty";

// Enumerador de lenguajes: de una fórmula lingüística muestra las primeras N cadenas en orden creciente de longitud.
export function FormulaTool({ tool }) {
  const [formula, setFormula] = useState(tool.formula);
  const [count, setCount] = useState(12);
  const result = useMemo(() => enumerateFormula(formula, { limit: Math.min(Math.max(count, 1), 100) }), [formula, count]);

  return (
    <div className="space-y-3">
      <SymbolField
        label="Fórmula lingüística"
        value={formula}
        onChange={setFormula}
        placeholder="0^a 1^(2a) / a ≥ 0"
        hint="Los exponentes se escriben con ^ (o con superíndices); después de / van las condiciones, unidas con ^ (que significa “y”) o con coma."
      />
      <label className="flex items-center gap-2 text-xs text-zinc-500">
        Cantidad de cadenas
        <input type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value) || 1)} className={`${inputClass} w-24`} />
      </label>
      <div role="status" aria-live="polite" className="text-sm">
        {result.error ? (
          <p className="text-red-600">{result.error}</p>
        ) : result.words.length === 0 ? (
          <p className="text-zinc-500">La fórmula no genera ninguna cadena con esas condiciones.</p>
        ) : (
          <>
            <p className="text-xs text-zinc-500">Primeras {result.words.length} cadenas, de menor a mayor longitud:</p>
            <p className="mt-1 break-words font-mono"><MathText text={`{ ${result.words.map(fmtWord).join(", ")}${result.truncated ? ", …" : ""} }`} /></p>
          </>
        )}
      </div>
    </div>
  );
}
