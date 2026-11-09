import { useMemo, useState } from "react";
import { MachineWorkbench } from "@/components/ssl/editor/machine-workbench";
import { SymbolField } from "@/components/ssl/symbol-field";
import { GrammarFields } from "@/components/ssl/tools/grammar-fields";
import { buildAsa, buildAsd, buildGreibachAsd, isGreibach } from "@/lib/ssl/machines/analyzers";
import { runAp } from "@/lib/ssl/machines/run-ap";
import { formatGrammar, parseGrammar } from "@/lib/ssl/grammar";
import { toGreibach } from "@/lib/ssl/transform";
import { parseWord } from "@/lib/ssl/notation";

const KINDS = [["asd", "Descendente (ASD)"], ["asa", "Ascendente (ASA)"], ["gnf", "Descendente para Greibach"]];

function build(kind, g) {
  if (kind === "asd") return { machine: buildAsd(g) };
  if (kind === "asa") return { machine: buildAsa(g) };
  if (isGreibach(g)) return { machine: buildGreibachAsd(g), grammar: g, converted: false };
  const r = toGreibach(g);
  if (!r.grammar) throw new Error(r.error ?? "No se pudo llevar la gramática a la Forma Normal de Greibach.");
  return { machine: buildGreibachAsd(r.grammar), grammar: r.grammar, converted: true };
}

// Esfuerzo de un analizador para una cadena: nodos del árbol, profundidad y factor de ramificación medio.
function effort(machine, word) {
  const r = runAp(machine, word, { maxNodes: 8000 });
  const children = new Map();
  for (const n of r.nodes) if (n.parent !== null) children.set(n.parent, (children.get(n.parent) ?? 0) + 1);
  const internal = children.size || 1;
  return { nodes: r.nodes.length, depth: r.levels.length - 1, branching: (r.nodes.length - 1) / internal, accepted: r.accepted, steps: r.table.length - 1 };
}

// Genera el analizador sintáctico de una gramática (ASD, ASA o ASD para Greibach), lo muestra en el editor,
// lo ejecuta sobre una cadena y compara el esfuerzo de los analizadores.
export function AnalyzerTool({ tool }) {
  const [fields, setFields] = useState(tool.grammar);
  const [kind, setKind] = useState(tool.kind ?? "asd");
  const [input, setInput] = useState(tool.input ?? "");
  const parsed = useMemo(() => parseGrammar(fields), [fields]);
  const word = parseWord(input);

  const built = useMemo(() => {
    if (!parsed.grammar) return null;
    try { return build(kind, parsed.grammar); } catch (err) { return { error: err.message }; }
  }, [parsed, kind]);

  const comparison = useMemo(() => {
    if (!parsed.grammar) return null;
    const rows = [];
    for (const [k, label] of KINDS) {
      try {
        const b = build(k, parsed.grammar);
        rows.push({ label, ...effort(b.machine, word) });
      } catch {
        rows.push({ label, error: true });
      }
    }
    return rows;
  }, [parsed, word]);

  return (
    <div className="space-y-4">
      <GrammarFields fields={fields} onChange={setFields} />
      {parsed.error && <p role="alert" className="text-sm text-red-600">{parsed.error}</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de analizador sintáctico">
        {KINDS.map(([k, label]) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${kind === k ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>{label}</button>)}
      </div>
      <SymbolField label="Cadena a analizar" value={input} onChange={setInput} placeholder="cabcbac" />
      {built?.error && <p role="alert" className="text-sm text-red-600">{built.error}</p>}
      {built?.converted && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">La gramática no estaba en Forma Normal de Greibach: se la llevó a FNG con el procedimiento de la Unidad 2 y el analizador se construye sobre esa gramática:<br /><span className="font-mono whitespace-pre-wrap">{formatGrammar(built.grammar, "G'", "P'")}</span></p>}
      {built?.machine && (
        <MachineWorkbench
          key={`${kind}|${JSON.stringify(fields)}`}
          config={{ type: "ap", initial: built.machine, readOnly: true, lockAlphabet: true, runExamples: word ? [word] : [] }}
          exerciseKey={`analizador.${kind}`}
        />
      )}
      {comparison && word && (
        <div className="w-0 min-w-full overflow-x-auto">
          <table className="border-collapse text-center text-xs">
            <caption className="mb-1 text-left text-xs font-semibold text-zinc-500">Esfuerzo de cada analizador para {word} (árbol de descripciones instantáneas completo)</caption>
            <thead><tr>{["Analizador", "¿Acepta?", "Nodos del árbol", "Profundidad", "Ramificación media", "Pasos del camino"].map((h) => <th key={h} scope="col" className="border border-zinc-300 bg-zinc-100 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800">{h}</th>)}</tr></thead>
            <tbody>
              {comparison.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="border border-zinc-300 px-2 py-1 text-left dark:border-zinc-700">{r.label}</th>
                  {r.error ? <td colSpan={5} className="border border-zinc-300 px-2 py-1 text-zinc-400 dark:border-zinc-700">no se pudo construir</td> : (
                    <>
                      <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-700">{r.accepted ? "sí" : "no"}</td>
                      <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-700">{r.nodes}</td>
                      <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-700">{r.depth}</td>
                      <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-700">{r.branching.toFixed(2)}</td>
                      <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-700">{r.accepted ? r.steps : "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-zinc-400">El mejor analizador es el que valida con menor factor de ramificación medio y menor profundidad.</p>
        </div>
      )}
    </div>
  );
}
