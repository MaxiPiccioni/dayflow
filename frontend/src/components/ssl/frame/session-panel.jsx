"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Copy, FolderOpen, Trash2, XCircle } from "lucide-react";
import { RunView } from "@/components/ssl/frame/run-view";
import { useSession } from "@/components/ssl/frame/session-context";
import { SettingsPanel, StatePanel, TableView, TransitionForm, TransitionRow } from "@/components/ssl/editor/machine-editor";
import { ComplexityPanel } from "@/components/ssl/editor/complexity-panel";
import { inputClass } from "@/lib/faculty";
import { formalDefinition, functionLines } from "@/lib/ssl/machines/model";

const small = "flex items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";

export function ResultView() {
  const s = useSession();
  const { result } = s;
  return (
    <div className="space-y-3">
      {!result && !s.loadedNote && <p className="text-sm text-zinc-500">{s.config.spec ? "Apretá “Comprobar” (arriba) para verificar tu autómata: se prueban cadenas hasta un largo máximo y se muestran los contraejemplos." : "Este ejercicio no tiene comprobación automática: probalo con el botón Play y comparalo con la solución."}</p>}
      {result && (
        <div role="status" aria-live="polite" className={`rounded-xl px-3 py-2 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"}`}>
          <p className="flex items-start gap-1.5">{result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}<span className="break-words">{result.message}</span></p>
          {result.detail?.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-9 text-xs">{result.detail.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}
      {s.loadedNote && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{s.loadedNote}</p>}
      {s.config.reference && s.config.referenceNote && <p className="text-xs text-zinc-500">{s.config.referenceNote}</p>}
    </div>
  );
}

function SavedView() {
  const s = useSession();
  const [name, setName] = useState("");
  const fileRef = useRef(null);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-500">Guardar, abrir, exportar e importar</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block min-w-32 flex-1 text-xs text-zinc-500">
          Nombre
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mi autómata" maxLength={40} className={`${inputClass} mt-1`} />
        </label>
        <button type="button" onClick={() => s.saveCurrent(name)} className={`${small} border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950`}>Guardar</button>
        <button type="button" onClick={() => s.exportJson(name)} className={small}>Exportar JSON</button>
        <button type="button" onClick={() => fileRef.current?.click()} className={small}>Importar JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label="Elegir el archivo JSON de un autómata" onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) s.importText(await file.text()); }} />
      </div>
      {(s.message || s.store.saveFailed) && <p role="status" className="text-xs text-zinc-600 dark:text-zinc-300">{s.store.saveFailed ? "Este navegador no deja guardar: podés exportar el JSON. " : ""}{s.message}</p>}
      {s.saved.length > 0 ? (
        <ul className="space-y-1">
          {s.saved.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800">
              <span className="min-w-0 break-words font-medium">{item.name} <span className="text-xs font-normal text-zinc-400">{item.savedAt ? new Date(item.savedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : ""}</span></span>
              <span className="flex gap-1">
                <button type="button" onClick={() => s.openSaved(item)} className={small} aria-label={`Abrir ${item.name}`}><FolderOpen size={14} aria-hidden="true" /> Abrir</button>
                <button type="button" onClick={() => s.store.duplicate(item.id)} className={small} aria-label={`Duplicar ${item.name}`}><Copy size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => s.store.remove(item.id)} className={`${small} hover:border-red-400 hover:text-red-600`} aria-label={`Borrar ${item.name}`}><Trash2 size={14} aria-hidden="true" /></button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-zinc-400">Todavía no guardaste autómatas para este ejercicio.</p>}
    </div>
  );
}

function TransitionsView() {
  const s = useSession();
  const { machine, editor } = s;
  const state = editor.selection.state;
  return (
    <div className="space-y-3">
      {state && machine.states.some((x) => x.id === state) && <StatePanel key={state} machine={machine} editor={editor} id={state} readOnly={s.readOnly} />}
      {!s.readOnly && machine.states.length > 0 && <TransitionForm key={s.pending ? `${s.pending.from}>${s.pending.to}` : "form"} machine={machine} editor={editor} pending={s.pending} setPending={s.setPending} />}
      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-500">Transiciones ({machine.transitions.length})</p>
        {machine.transitions.length
          ? <ul className="space-y-1.5">{machine.transitions.map((t) => <TransitionRow key={t.id} machine={machine} t={t} editor={editor} readOnly={s.readOnly} />)}</ul>
          : <p className="text-sm text-zinc-400">Todavía no hay transiciones.</p>}
      </div>
    </div>
  );
}

function DefinitionView() {
  const { machine } = useSession();
  return (
    <div className="space-y-2 font-mono text-sm">
      <p className="break-words font-semibold">{formalDefinition(machine)}</p>
      <ul className="space-y-0.5 text-zinc-600 dark:text-zinc-300">{functionLines(machine).map((line) => <li key={line} className="break-words">{line}</li>)}</ul>
      {!machine.transitions.length && <p className="text-zinc-400">Todavía no hay transiciones.</p>}
    </div>
  );
}

// Contenido de una pestaña del panel que depende de la sesión del autómata.
export function SessionTab({ id }) {
  const s = useSession();
  if (!s) return null;
  switch (id) {
    case "ejecucion": return <RunView />;
    case "tabla": return <TableView machine={s.machine} />;
    case "definicion": return <DefinitionView />;
    case "transiciones": return <TransitionsView />;
    case "alfabetos": return <SettingsPanel key={s.machine.type} machine={s.machine} editor={s.editor} lockAlphabet={!!s.config.lockAlphabet || s.readOnly} />;
    case "resultado": return <ResultView />;
    case "guardados": return <SavedView />;
    case "complejidad": return s.config.complexity ? <ComplexityPanel machine={s.machine} family={s.config.complexity} /> : null;
    default: return null;
  }
}
