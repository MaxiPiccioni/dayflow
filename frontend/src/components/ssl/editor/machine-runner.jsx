import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { SymbolField } from "@/components/ssl/symbol-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runMachine } from "@/lib/ssl/machines/run";
import { analyze, isTape } from "@/lib/ssl/machines/model";
import { parseWord } from "@/lib/ssl/notation";

const button = "flex items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";
const primary = "border-zinc-900 bg-zinc-900 text-white hover:border-zinc-900 dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950";
const SPEEDS = [["1800", "Lento"], ["900", "Normal"], ["450", "Rápido"], ["180", "Muy rápido"]];

function TapeView({ tape, head, blank }) {
  return (
    <div className="w-0 min-w-full overflow-x-auto pb-1">
      <ol className="flex w-max gap-0.5" aria-label="Cinta">
        {tape.map((symbol, i) => (
          <li key={i} className={`grid h-9 w-9 place-items-center rounded-md border font-mono text-sm ${i === head ? "border-lime-500 bg-lime-200 font-bold text-lime-950 dark:bg-lime-400/30 dark:text-lime-200" : "border-zinc-300 dark:border-zinc-700"}`} aria-current={i === head ? "true" : undefined}>
            {symbol === blank ? <span className="text-zinc-400">{symbol}</span> : symbol}
          </li>
        ))}
      </ol>
      <ol className="flex w-max gap-0.5" aria-hidden="true">
        {tape.map((_, i) => <li key={i} className="h-4 w-9 text-center text-xs text-lime-700 dark:text-lime-400">{i === head ? "▲" : ""}</li>)}
      </ol>
    </div>
  );
}

function StackView({ stack }) {
  const cells = Array.from(stack);
  return (
    <div aria-label={`Pila: ${stack}`} className="inline-flex flex-col-reverse gap-0.5">
      {cells.map((s, i) => (
        <span key={i} className={`grid h-7 min-w-10 place-items-center rounded-md border px-2 font-mono text-sm ${i === cells.length - 1 ? "border-lime-500 bg-lime-100 dark:bg-lime-400/20" : "border-zinc-300 dark:border-zinc-700"}`}>{s}{i === cells.length - 1 && <span className="ml-1 text-[10px] text-zinc-400">tope</span>}</span>
      ))}
    </div>
  );
}

// Árbol de descripciones instantáneas hasta el paso k (en las máquinas deterministas es una sola rama).
function ConfigTree({ run, k }) {
  const { nodes, levels } = run.raw;
  const fmt = (n) => (run.kind === "fa" ? `(${n.state}, ${n.rest === "" ? "λ" : n.rest})` : `(${n.state}, ${n.rest === "" ? "λ" : n.rest}, ${n.stack})`);
  const win = new Set(run.raw.acceptingPath ?? []);
  const children = new Map();
  for (const n of nodes) if (n.parent !== null && n.depth <= k) { if (!children.has(n.parent)) children.set(n.parent, []); children.get(n.parent).push(n.id); }
  const lines = [];
  const walk = (id, depth) => {
    if (lines.length > 300) return;
    lines.push({ id, depth });
    for (const child of children.get(id) ?? []) walk(child, depth + 1);
  };
  if (nodes.length) walk(0, 0);
  const current = new Set(levels[Math.min(k, levels.length - 1)] ?? []);
  return (
    <ul aria-label="Árbol de descripciones instantáneas" className="max-h-64 overflow-auto rounded-xl border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-800">
      {lines.map(({ id, depth }) => (
        <li key={id} style={{ paddingLeft: Math.min(depth, 14) * 14 }} className={`whitespace-nowrap ${current.has(id) ? "font-bold text-lime-700 dark:text-lime-400" : win.has(id) && k >= levels.length - 1 ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"}`}>
          {depth > 0 ? "└ " : ""}{fmt(nodes[id])}
        </li>
      ))}
      {lines.length > 300 && <li className="text-zinc-400">… (se muestran las primeras 300 descripciones)</li>}
    </ul>
  );
}

// Ejecutor visual: campo de entrada, modo manual o automático, paso adelante y atrás, reinicio y velocidad.
// onHighlight recibe { states, edges } del paso actual para resaltarlos en el grafo.
export function MachineRunner({ machine, onHighlight, initialInput = "", examples = [] }) {
  const [input, setInput] = useState(initialInput);
  const [auto, setAuto] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("900");
  const [k, setK] = useState(0);
  const [started, setStarted] = useState(false);
  const { errors } = analyze(machine);
  const word = parseWord(input);

  const run = useMemo(() => {
    if (!started || errors.length) return null;
    try { return runMachine(machine, word); } catch (err) { return { error: err.message }; }
  }, [started, machine, word, errors.length]);

  const last = run && !run.error ? run.total - 1 : 0;
  const finished = !!run && !run.error && k >= last;
  const step = useMemo(() => (run && !run.error ? run.at(k) : null), [run, k]);

  useEffect(() => {
    onHighlight?.(started && step ? { states: step.states, edges: step.edges } : null);
  }, [step, started, onHighlight]);

  useEffect(() => {
    if (!playing || !run || run.error) return undefined;
    if (k >= last) return undefined;
    const timer = setTimeout(() => setK((v) => v + 1), Number(speed));
    return () => clearTimeout(timer);
  }, [playing, k, last, run, speed]);

  const reset = () => { setStarted(false); setPlaying(false); setK(0); };
  const begin = () => { setStarted(true); setK(0); };
  const forward = () => {
    if (!started) { begin(); return; }
    setK((v) => Math.min(v + 1, last));
  };
  const back = () => { setPlaying(false); setK((v) => Math.max(v - 1, 0)); };
  const togglePlay = () => {
    if (!started) { begin(); setPlaying(true); return; }
    if (finished) { setK(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  };
  const changeInput = (value) => { setInput(value); setStarted(false); setPlaying(false); setK(0); };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-semibold text-zinc-500">Ejecutar</p>
      <SymbolField label={isTape(machine) ? (machine.type === "mt" ? "Entrada (sin los blancos b de los costados)" : "Cadena (se escribe entre ├ y ┤)") : "Cadena de entrada"} value={input} onChange={changeInput} onEnter={auto ? togglePlay : forward} placeholder="λ si es vacía" />
      {examples.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cadenas de ejemplo">
          {examples.map((e) => <button key={e} type="button" onClick={() => changeInput(e)} className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs dark:bg-zinc-800">{e || "λ"}</button>)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" aria-pressed={auto} onClick={() => { setAuto((v) => !v); setPlaying(false); }} className={`${button} ${auto ? primary : ""}`}>Modo: {auto ? "automático" : "manual"}</button>
        {auto ? (
          <button type="button" onClick={togglePlay} disabled={errors.length > 0} className={`${button} ${primary}`}>{playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />} {playing ? "Pausa" : finished ? "Repetir" : "Play"}</button>
        ) : (
          <button type="button" onClick={forward} disabled={errors.length > 0 || finished} className={`${button} ${primary}`}><StepForward size={14} aria-hidden="true" /> {started ? "Paso adelante" : "Empezar"}</button>
        )}
        <button type="button" onClick={back} disabled={!started || k === 0} className={button}><StepBack size={14} aria-hidden="true" /> Paso atrás</button>
        <button type="button" onClick={reset} disabled={!started} className={button}><RotateCcw size={14} aria-hidden="true" /> Reiniciar</button>
        {auto && (
          <label className="flex items-center gap-1.5 text-xs text-zinc-500">
            Velocidad
            <Select value={speed} onValueChange={setSpeed}>
              <SelectTrigger className="w-32" aria-label="Velocidad de ejecución"><SelectValue /></SelectTrigger>
              <SelectContent>{SPEEDS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </label>
        )}
      </div>
      {errors.length > 0 && <p className="text-xs text-red-600">{errors[0]} Corregilo para poder ejecutar.</p>}
      {run?.error && <p role="alert" className="text-sm text-red-600">{run.error}</p>}

      {run && !run.error && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500" aria-live="polite">Paso {k} de {last}</p>
          {run.kind === "tape" && <TapeView tape={step.tape} head={step.head} blank={machine.blank} />}
          <div>
            <p className="mb-1 text-xs font-semibold text-zinc-500">{run.kind === "tape" ? "Estado actual" : step.lines.length > 1 ? "Descripciones instantáneas activas" : "Descripción instantánea actual"}</p>
            <ul className="space-y-0.5 font-mono text-sm" aria-live="polite">{step.lines.slice(0, 12).map((line, i) => <li key={i}>{line}</li>)}{step.lines.length > 12 && <li className="text-zinc-400">… y {step.lines.length - 12} más</li>}</ul>
          </div>
          {run.kind === "ap" && step.stacks?.length > 0 && (
            <div className="flex flex-wrap items-end gap-4">
              {step.stacks.slice(0, 4).map((s, i) => <StackView key={i} stack={s} />)}
            </div>
          )}
          {run.kind === "tape" && (
            <div className="max-h-40 overflow-auto rounded-xl border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-800">
              {run.raw.steps.slice(0, k + 1).map((s) => <p key={s.n} className={s.n === k ? "font-bold text-lime-700 dark:text-lime-400" : "text-zinc-500"}>{String(s.n).padStart(2, "0")} {s.state}: {s.tape.join("")}</p>)}
            </div>
          )}
          {run.kind !== "tape" && <ConfigTree run={run} k={k} />}
          {finished && (
            <p role="status" className={`rounded-xl px-3 py-2 text-sm font-medium ${run.outcome === "reconocida" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : run.outcome === "error" ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"}`}>
              {run.message}
            </p>
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
      )}
    </div>
  );
}
