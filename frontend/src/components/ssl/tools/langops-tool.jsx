import { useMemo, useState } from "react";
import { SymbolField } from "@/components/ssl/symbol-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtWord, parseWordList } from "@/lib/ssl/notation";
import { closureLanguage, concatLanguages, enumerateFormula, intersectSets, powerLanguage, sortWords, unionSets } from "@/lib/ssl/languages";
import { inputClass } from "@/lib/faculty";

const OPS = [
  ["union", "A ∪ B (unión)"],
  ["intersect", "A ∩ B (intersección)"],
  ["concat", "A . B (concatenación)"],
  ["concatBA", "B . A (concatenación)"],
  ["power", "Aⁿ (potencia)"],
  ["closure", "A* (clausura)"],
  ["positive", "A⁺ (clausura positiva)"],
];

// Un operando es una fórmula ({ d^n e^m / n ≥ 0 ^ m ≥ 2 }) o una lista de cadenas ({a, b, c}).
function operand(text, maxLen) {
  const clean = text.trim();
  if (!clean) return { words: [] };
  if (/[/|]/.test(clean)) {
    const r = enumerateFormula(clean, { maxLen, limit: Infinity, maxVar: maxLen });
    return r.error ? { error: r.error } : { words: r.words };
  }
  return { words: parseWordList(clean).filter((w) => Array.from(w).length <= maxLen) };
}

// Operaciones entre lenguajes (unión, intersección, concatenación, potencia y clausuras), acotadas por longitud.
export function LangOpsTool({ tool }) {
  const [a, setA] = useState(tool.a);
  const [b, setB] = useState(tool.b);
  const [op, setOp] = useState(tool.op);
  const [n, setN] = useState(tool.n ?? 2);
  const [maxLen, setMaxLen] = useState(10);
  const [count, setCount] = useState(14);

  const result = useMemo(() => {
    const A = operand(a, maxLen);
    const B = operand(b, maxLen);
    if (A.error) return { error: `En A: ${A.error}` };
    if (B.error) return { error: `En B: ${B.error}` };
    let words;
    if (op === "union") words = unionSets(A.words, B.words);
    else if (op === "intersect") words = sortWords(intersectSets(A.words, B.words));
    else if (op === "concat") words = concatLanguages(A.words, B.words, maxLen);
    else if (op === "concatBA") words = concatLanguages(B.words, A.words, maxLen);
    else if (op === "power") words = powerLanguage(A.words, Math.max(0, Math.min(n, 6)), maxLen);
    else words = closureLanguage(A.words, maxLen, op === "positive");
    return { words, sizeA: A.words.length, sizeB: B.words.length };
  }, [a, b, op, n, maxLen]);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <SymbolField label="Lenguaje A (fórmula o lista entre llaves)" value={a} onChange={setA} placeholder="{a, bb}" />
        <SymbolField label="Lenguaje B" value={b} onChange={setB} placeholder="{c, d, e}" />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <label className="block text-xs text-zinc-500 sm:col-span-2">
          Operación
          <Select value={op} onValueChange={setOp}>
            <SelectTrigger className="mt-1 w-full" aria-label="Operación entre lenguajes"><SelectValue /></SelectTrigger>
            <SelectContent>{OPS.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        {op === "power" && (
          <label className="block text-xs text-zinc-500">
            Exponente n
            <input type="number" min={0} max={6} value={n} onChange={(event) => setN(Number(event.target.value) || 0)} className={`${inputClass} mt-1`} />
          </label>
        )}
        <label className="block text-xs text-zinc-500">
          Largo máximo
          <input type="number" min={1} max={16} value={maxLen} onChange={(event) => setMaxLen(Math.min(Math.max(Number(event.target.value) || 1, 1), 16))} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-xs text-zinc-500">
          Cadenas a mostrar
          <input type="number" min={1} max={100} value={count} onChange={(event) => setCount(Math.min(Math.max(Number(event.target.value) || 1, 1), 100))} className={`${inputClass} mt-1`} />
        </label>
      </div>
      <div role="status" aria-live="polite" className="text-sm">
        {result.error ? (
          <p className="text-red-600">{result.error}</p>
        ) : (
          <>
            <p className="text-xs text-zinc-500">Resultado acotado a cadenas de hasta {maxLen} símbolos ({result.words.length} en total), de menor a mayor longitud:</p>
            <p className="mt-1 break-words font-mono">{result.words.length ? `{ ${result.words.slice(0, count).map(fmtWord).join(", ")}${result.words.length > count ? ", …" : ""} }` : "∅"}</p>
          </>
        )}
      </div>
    </div>
  );
}
