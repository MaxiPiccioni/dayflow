import { useMemo, useState } from "react";
import { DerivationTree } from "@/components/ssl/derivation-tree";
import { StepReveal } from "@/components/ssl/step-reveal";
import { SymbolField } from "@/components/ssl/symbol-field";
import { GrammarFields } from "@/components/ssl/tools/grammar-fields";
import { fmtWord } from "@/lib/ssl/notation";
import { allDerivations, analyzeRecursion, classify, compareGrammars, detectAmbiguity, findDerivations, formatDerivation, formatRule, generateLanguage, parseGrammar, parseTrees, recursionLabel, showForm } from "@/lib/ssl/grammar";
import { inputClass } from "@/lib/faculty";

const TABS = [
  ["classify", "Tipo (Chomsky)"],
  ["derive", "Derivaciones"],
  ["tree", "Árbol"],
  ["ambiguity", "Ambigüedad"],
  ["recursion", "Recursividad"],
  ["compare", "Equivalencia"],
];

const chip = (active) => `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`;

function LenInput({ label, value, onChange, max = 10 }) {
  return (
    <label className="flex items-center gap-2 text-xs text-zinc-500">
      {label}
      <input type="number" min={1} max={max} value={value} onChange={(event) => onChange(Math.min(Math.max(Number(event.target.value) || 1, 1), max))} className={`${inputClass} w-20`} />
    </label>
  );
}

const Verdict = ({ ok, children }) => <p className={`text-sm font-semibold ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"}`}>{children}</p>;

// Derivación como pasos: cada paso muestra la forma sentencial y la producción que se aplicó.
function derivationSteps(g, path) {
  return path.map((step, index) => ({
    title: index === 0 ? "Se parte del axioma" : `Se aplica ${formatRule(g.productions[step.prod])}`,
    text: index === 0 ? showForm(step.form) : `→ ${showForm(step.form)}`,
  }));
}

function ClassifyPane({ g }) {
  const c = classify(g);
  return (
    <div className="space-y-2 text-sm">
      <Verdict>{c.name}</Verdict>
      <ul className="list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">{c.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
    </div>
  );
}

function DerivePane({ g, initialTarget }) {
  const [maxLen, setMaxLen] = useState(6);
  const [target, setTarget] = useState(initialTarget ?? "");
  const language = useMemo(() => generateLanguage(g, maxLen), [g, maxLen]);
  const paths = useMemo(() => allDerivations(g, maxLen, { limit: 24 }), [g, maxLen]);
  const found = useMemo(() => (target.trim() ? findDerivations(g, target.trim() === "λ" ? "" : target.trim(), { limit: 4 }) : null), [g, target]);
  const shownWords = language.words.slice(0, 40);

  return (
    <div className="space-y-4">
      <LenInput label="Largo máximo de las cadenas" value={maxLen} onChange={setMaxLen} />
      <div className="text-sm">
        <p className="text-xs text-zinc-500">L(G) acotado a cadenas de hasta {maxLen} símbolos ({language.words.length} cadenas):</p>
        <p className="mt-1 break-words font-mono">{language.words.length ? `{ ${shownWords.map(fmtWord).join(", ")}${language.words.length > shownWords.length || language.truncated ? ", …" : ""} }` : "∅"}</p>
        {language.approximate && <p className="mt-1 text-[11px] text-zinc-400">La gramática tiene reglas que acortan cadenas: la búsqueda es aproximada.</p>}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-500">Todas las derivaciones{paths.truncated ? " (primeras " + paths.paths.length + ")" : ""}</p>
        {paths.paths.length ? (
          <ul className="space-y-1 font-mono text-sm">
            {paths.paths.map((path, index) => <li key={index} className="break-words">{formatDerivation(path)}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">No hay derivaciones que lleguen a una cadena de ese largo.</p>
        )}
      </div>

      <div>
        <SymbolField label="Derivar una cadena paso a paso" value={target} onChange={setTarget} placeholder="abbc" />
        {found && (found.derivations.length ? (
          <div className="mt-2 space-y-3">
            <p className="text-xs text-zinc-500">{found.derivations.length === 1 ? "Una derivación:" : `Derivaciones encontradas (${found.derivations.length}):`}</p>
            <ul className="space-y-1 font-mono text-sm">{found.derivations.map((path, index) => <li key={index} className="break-words">{formatDerivation(path)}</li>)}</ul>
            <StepReveal key={`${target}|${found.derivations[0].length}`} steps={derivationSteps(g, found.derivations[0])} />
          </div>
        ) : (
          <p role="status" className="mt-2 text-sm text-zinc-500">No encontré una derivación de {fmtWord(target.trim())}: puede que no pertenezca al lenguaje (la búsqueda es acotada).</p>
        ))}
      </div>
    </div>
  );
}

function TreePane({ g, initialTarget }) {
  const [target, setTarget] = useState(initialTarget ?? "");
  const word = target.trim() === "λ" ? "" : target.trim();
  const result = useMemo(() => (target.trim() ? parseTrees(g, word, { limit: 3 }) : null), [g, target, word]);
  return (
    <div className="space-y-3">
      <SymbolField label="Cadena" value={target} onChange={setTarget} placeholder="abcde" hint="Se dibuja el árbol de derivación (gramáticas de tipo 2 y 3)." />
      {result?.error && <p role="status" className="text-sm text-zinc-500">{result.error}</p>}
      {result && !result.error && (result.trees.length ? (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">{result.trees.length === 1 ? "Árbol de derivación:" : `${result.trees.length} árboles distintos para esta cadena:`}</p>
          {result.trees.map((tree, index) => <DerivationTree key={index} tree={tree} label={`Árbol ${index + 1} de ${fmtWord(word)}`} />)}
        </div>
      ) : (
        <p role="status" className="text-sm text-zinc-500">{fmtWord(word)} no pertenece al lenguaje de la gramática.</p>
      ))}
    </div>
  );
}

function AmbiguityPane({ g }) {
  const [maxLen, setMaxLen] = useState(6);
  const result = useMemo(() => detectAmbiguity(g, maxLen), [g, maxLen]);
  if (result.error) return <p className="text-sm text-zinc-500">{result.error}</p>;
  return (
    <div className="space-y-3">
      <LenInput label="Revisar cadenas de hasta" value={maxLen} onChange={setMaxLen} max={9} />
      <Verdict ok={!result.ambiguous}>{result.ambiguous ? "La gramática es ambigua." : `No encontré ninguna cadena con dos árboles distintos (revisé ${result.checked} cadenas de hasta ${maxLen} símbolos).`}</Verdict>
      {result.examples.map((example) => (
        <div key={example.word} className="space-y-2">
          <p className="text-sm">La cadena <span className="font-mono font-semibold">{fmtWord(example.word)}</span> tiene {example.trees.length >= 3 ? "al menos " : ""}{example.trees.length} árboles de derivación diferentes:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {example.trees.slice(0, 2).map((tree, index) => <DerivationTree key={index} tree={tree} label={`Árbol ${index + 1} de ${example.word}`} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecursionPane({ g }) {
  const analysis = analyzeRecursion(g);
  if (analysis.error) return <p className="text-sm text-zinc-500">{analysis.error}</p>;
  return (
    <div className="space-y-2 text-sm">
      <Verdict>{recursionLabel(analysis)}</Verdict>
      {analysis.findings.map((finding) => (
        <div key={finding.symbol} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <p><span className="font-mono font-semibold">{finding.symbol}</span>: recursividad {finding.kind}{finding.kind === "directa" ? ` (${finding.side === "central" ? "el símbolo queda en el medio" : `por ${finding.side}`})` : ` a través de ${finding.cycle.join(" → ")} → ${finding.symbol}`}</p>
          <p className="mt-1 font-mono text-zinc-600 dark:text-zinc-300">Reglas: {finding.rules.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}

function ComparePane({ g, other }) {
  const [fields, setFields] = useState(other ?? { productions: "" });
  const [maxLen, setMaxLen] = useState(8);
  const parsed = useMemo(() => parseGrammar(fields), [fields]);
  const result = useMemo(() => (parsed.grammar ? compareGrammars(g, parsed.grammar, maxLen) : null), [g, parsed, maxLen]);
  return (
    <div className="space-y-3">
      <GrammarFields fields={fields} onChange={setFields} name="G2" />
      <LenInput label="Comparar cadenas de hasta" value={maxLen} onChange={setMaxLen} />
      {parsed.error && <p role="alert" className="text-sm text-red-600">En G2: {parsed.error}</p>}
      {result && (
        <div className="space-y-1.5 text-sm" role="status" aria-live="polite">
          <Verdict ok={result.equal}>{result.equal ? `Generan las mismas cadenas hasta largo ${maxLen}: parecen equivalentes.` : "No son equivalentes: generan lenguajes distintos."}</Verdict>
          {result.onlyA.length > 0 && <p>Solo G1 genera: <span className="font-mono">{result.onlyA.slice(0, 8).map(fmtWord).join(", ")}</span></p>}
          {result.onlyB.length > 0 && <p>Solo G2 genera: <span className="font-mono">{result.onlyB.slice(0, 8).map(fmtWord).join(", ")}</span></p>}
          <p className="text-[11px] text-zinc-400">La comparación es acotada por largo: sirve para refutar la equivalencia, no para demostrarla.</p>
        </div>
      )}
    </div>
  );
}

// Herramienta de gramáticas: editor de G, clasificación de Chomsky, derivaciones, árbol, ambigüedad, recursividad y equivalencia.
export function GrammarTool({ tool }) {
  const [fields, setFields] = useState(tool.grammar);
  const [tab, setTab] = useState(tool.tab ?? "classify");
  const parsed = useMemo(() => parseGrammar(fields), [fields]);
  const g = parsed.grammar;

  return (
    <div className="space-y-3">
      <GrammarFields fields={fields} onChange={setFields} />
      {parsed.error ? (
        <p role="alert" className="text-sm text-red-600">{parsed.error}</p>
      ) : (
        <>
          <div className="scrollbar-thin w-0 min-w-full overflow-x-auto pb-1">
            <div className="flex w-max gap-2" role="group" aria-label="Qué querés ver de la gramática">
              {TABS.map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)} className={chip(tab === key)}>{label}</button>)}
            </div>
          </div>
          <div>
            {tab === "classify" && <ClassifyPane g={g} />}
            {tab === "derive" && <DerivePane g={g} initialTarget={tool.target} />}
            {tab === "tree" && <TreePane g={g} initialTarget={tool.target} />}
            {tab === "ambiguity" && <AmbiguityPane g={g} />}
            {tab === "recursion" && <RecursionPane g={g} />}
            {tab === "compare" && <ComparePane g={g} other={tool.compare} />}
          </div>
        </>
      )}
    </div>
  );
}
