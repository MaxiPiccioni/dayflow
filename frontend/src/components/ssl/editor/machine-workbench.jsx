import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, Download, FolderOpen, Save, Trash2, Upload, XCircle } from "lucide-react";
import { MachineEditor } from "@/components/ssl/editor/machine-editor";
import { ComplexityPanel } from "@/components/ssl/editor/complexity-panel";
import { MachineRunner } from "@/components/ssl/editor/machine-runner";
import { useMachineEditor } from "@/components/ssl/editor/use-machine-editor";
import { useMachineStore } from "@/components/ssl/editor/use-machine-store";
import { checkMachine } from "@/lib/ssl/machines/check-machine";
import { cloneMachine, createMachine, importMachine } from "@/lib/ssl/machines/model";
import { itemsFor } from "@/lib/ssl/machines/store";
import { inputClass } from "@/lib/faculty";

const button = "flex items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";
const primary = "border-zinc-900 bg-zinc-900 text-white hover:border-zinc-900 dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950";

// Máquina inicial: la última guardada de este ejercicio, el preset del ejercicio o una vacía del tipo pedido.
function startingMachine(config, savedJson) {
  if (savedJson) {
    const r = importMachine(savedJson);
    if (r.machine && r.machine.type === config.type) return r.machine;
  }
  if (config.initial) return cloneMachine(config.initial);
  return createMachine(config.type, { alphabet: config.alphabet ?? [], extra: config.extra ?? [], bottom: config.bottom, blank: config.blank, pushMode: config.pushMode, name: config.name ?? "" });
}

function download(name, text) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^\w-]+/g, "_") || "automata"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return "";
  } catch (err) {
    return `No se pudo exportar: ${err.message}`;
  }
}

function SavedPanel({ exerciseKey, machine, editor, config }) {
  const { store, saveFailed, save, remove, duplicate } = useMachineStore();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const fileRef = useRef(null);
  const items = itemsFor(store, exerciseKey);

  const importText = (text) => {
    const r = importMachine(text);
    if (r.error) return setMessage(r.error);
    if (r.machine.type !== config.type) return setMessage(`El archivo es un ${r.machine.type.toUpperCase()} y este ejercicio pide otro tipo de máquina.`);
    editor.change(r.machine);
    setMessage("Autómata importado.");
  };

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-semibold text-zinc-500">Guardar, abrir, exportar e importar</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block min-w-40 flex-1 text-xs text-zinc-500">
          Nombre
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mi autómata" maxLength={40} className={`${inputClass} mt-1`} />
        </label>
        <button type="button" onClick={() => { save({ name: name || machine.name || "Mi autómata", exerciseKey, machine }); setMessage("Guardado en este navegador."); }} className={`${button} ${primary}`}><Save size={14} aria-hidden="true" /> Guardar</button>
        <button type="button" onClick={() => setMessage(download(name || machine.name, JSON.stringify(machine, null, 2)))} className={button}><Download size={14} aria-hidden="true" /> Exportar JSON</button>
        <button type="button" onClick={() => fileRef.current?.click()} className={button}><Upload size={14} aria-hidden="true" /> Importar JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Importar un autómata desde un archivo JSON" onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) importText(await file.text()); }} />
      </div>
      {(message || saveFailed) && <p role="status" className="text-xs text-zinc-600 dark:text-zinc-300">{saveFailed ? "Este navegador no deja guardar: podés exportar el JSON. " : ""}{message}</p>}
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800">
              <span className="min-w-0 break-words font-medium">{item.name} <span className="text-xs font-normal text-zinc-400">{item.savedAt ? new Date(item.savedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : ""}</span></span>
              <span className="flex gap-1">
                <button type="button" onClick={() => { editor.change(cloneMachine(item.machine)); setMessage(`Abierto: ${item.name}`); }} className={button} aria-label={`Abrir ${item.name}`}><FolderOpen size={14} aria-hidden="true" /> Abrir</button>
                <button type="button" onClick={() => duplicate(item.id)} className={button} aria-label={`Duplicar ${item.name}`}><Copy size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => remove(item.id)} className={`${button} hover:border-red-400 hover:text-red-600`} aria-label={`Borrar ${item.name}`}><Trash2 size={14} aria-hidden="true" /></button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-zinc-400">Todavía no guardaste autómatas para este ejercicio.</p>}
    </div>
  );
}

// Un ejercicio con autómata: editor, ejecutor, comprobación, solución cargable y autómatas guardados.
export function MachineWorkbench({ config, exerciseKey, savedJson, onSaveWorking }) {
  const initial = useMemo(() => startingMachine(config, savedJson), [config, savedJson]);
  // Guardado de la copia de trabajo con un pequeño retraso (arrastrar un estado cambia la máquina muchas veces).
  // Si se cambia de sección antes de que venza el retraso, al desmontar se guarda igual lo pendiente.
  const timer = useRef(null);
  const pending = useRef(null);
  const saveRef = useRef(onSaveWorking);
  useEffect(() => { saveRef.current = onSaveWorking; }, [onSaveWorking]);
  const onMachineChange = useCallback((m) => {
    clearTimeout(timer.current);
    pending.current = JSON.stringify(m);
    timer.current = setTimeout(() => { const json = pending.current; pending.current = null; if (json) saveRef.current?.(json); }, 400);
  }, []);
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (pending.current) { saveRef.current?.(pending.current); pending.current = null; }
  }, []);

  const editor = useMachineEditor(initial, onMachineChange);
  const [highlight, setHighlight] = useState(null);
  const [result, setResult] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [loadedNote, setLoadedNote] = useState("");
  const store = useMachineStore();

  const verify = () => { setResult(config.spec ? checkMachine(editor.machine, config.spec) : null); };
  const loadReference = () => {
    // Antes de pisar el dibujo del estudiante se guarda una copia, para no perder su trabajo.
    if (editor.machine.states.length) store.save({ name: "Mi intento (antes de cargar la solución)", exerciseKey, machine: editor.machine });
    editor.change(cloneMachine(config.reference));
    setResult(null);
    setLoadedNote(config.referenceSource === "guia" ? "Se cargó la solución de la guía. Tu dibujo anterior quedó guardado como “Mi intento”." : "Se cargó una solución propuesta por el sandbox (la guía solo trae el dibujo). Tu dibujo anterior quedó guardado como “Mi intento”.");
  };
  const clearAll = () => { editor.change(startingMachine({ ...config, initial: config.initial }, null)); setResult(null); };

  return (
    <div className="space-y-3">
      <MachineEditor editor={editor} readOnly={config.readOnly} lockAlphabet={config.lockAlphabet} highlight={highlight} />
      <MachineRunner machine={editor.machine} onHighlight={setHighlight} examples={config.runExamples ?? []} initialInput={config.runExamples?.[0] ?? ""} />
      {config.complexity && <ComplexityPanel machine={editor.machine} family={config.complexity} />}

      <div className="flex flex-wrap items-center gap-2">
        {config.spec && <button type="button" onClick={verify} className={`${button} ${primary}`}>Comprobar mi autómata</button>}
        {config.reference && <button type="button" onClick={loadReference} className={button}>Cargar la solución en el editor</button>}
        {!config.readOnly && <button type="button" onClick={clearAll} className={button}>Empezar de nuevo</button>}
        <button type="button" onClick={() => setShowSaved((v) => !v)} aria-expanded={showSaved} className={button}>Guardados</button>
      </div>

      {result && (
        <div role="status" aria-live="polite" className={`rounded-xl px-3 py-2 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"}`}>
          <p className="flex items-start gap-1.5">{result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}<span className="break-words">{result.message}</span></p>
          {result.detail?.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-9 text-xs">{result.detail.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}
      {loadedNote && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{loadedNote}</p>}
      {config.reference && config.referenceNote && <p className="text-xs text-zinc-500">{config.referenceNote}</p>}
      {showSaved && <SavedPanel exerciseKey={exerciseKey} machine={editor.machine} editor={editor} config={config} />}
    </div>
  );
}
