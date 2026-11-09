"use client";

import { useRef, useState } from "react";
import {
  BookOpenCheck, CircleCheckBig, CirclePlus, Eraser, FolderOpen, Download, Lightbulb, Link2, MousePointer2, Pencil, Play, Plus, Redo2,
  RefreshCw, RotateCcw, Save, ShieldAlert, SlidersHorizontal, Square, StepBack, StepForward, Trash2, Undo2, Upload, Flag, Hand, Workflow,
} from "lucide-react";
import { SymbolField } from "@/components/ssl/symbol-field";
import { useSession } from "@/components/ssl/frame/session-context";
import { SPEEDS } from "@/components/ssl/frame/use-machine-session";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isTape } from "@/lib/ssl/machines/model";
import { removeState, setInitial, toggleAccepting } from "@/lib/ssl/machines/model";

const base = "grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-zinc-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 disabled:opacity-35 dark:text-zinc-300";
const idle = "border-transparent hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-lime-400/10";
const on = "border-zinc-900 bg-zinc-900 text-white dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950";

function Tool({ icon: Icon, label, onClick, pressed, disabled, danger = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      className={`${base} ${pressed ? on : idle} ${danger ? "hover:!border-red-400 hover:!text-red-600" : ""} ${className}`}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-0.5 my-0.5 h-px w-6 shrink-0 self-center bg-zinc-200 max-md:h-6 max-md:w-px dark:bg-zinc-700" />;

// Barra de comandos del sandbox: angosta y a la izquierda (en celular, una fila de íconos con scroll propio). Los dos últimos
// botones son Play/Stop (hace funcionar la máquina y la frena) y Pistas.
export function SessionToolbar({ hasHint, onOpenTab, onHint, hintActive, tools = [], activeTool = null, onTool }) {
  const s = useSession();
  const [flyout, setFlyout] = useState(null);
  const fileRef = useRef(null);
  const state = s?.editor.selection.state;
  const selected = !!s && !!state && s.machine.states.some((x) => x.id === state);
  const ro = !s || s.readOnly;
  const canvas = !!s;
  const tape = s && isTape(s.machine);

  const act = (fn, tab) => () => { fn(); if (tab) onOpenTab(tab); };
  const toggleFlyout = (name) => setFlyout((current) => (current === name ? null : name));

  return (
    <div className="relative z-30 shrink-0 border-zinc-200 bg-white/90 max-md:border-b md:border-r dark:border-zinc-800 dark:bg-zinc-950/90">
      <div role="toolbar" aria-label="Comandos del sandbox" className="scrollbar-thin flex gap-1 overflow-x-auto p-1.5 max-md:flex-row md:h-full md:w-[52px] md:flex-col md:overflow-y-auto md:overflow-x-visible">
        {canvas && !ro && (
          <>
            <Tool icon={MousePointer2} label="Mover y elegir estados" pressed={s.editor.mode === "select"} onClick={() => s.editor.setMode("select")} />
            <Tool icon={CirclePlus} label="Agregar estado (clic en el lienzo)" pressed={s.editor.mode === "state"} onClick={() => s.editor.setMode("state")} />
            <Tool icon={Link2} label="Unir estados (origen y destino)" pressed={s.editor.mode === "link"} onClick={() => s.editor.setMode("link")} />
            <Tool icon={Trash2} label="Borrar (clic en un estado o una transición)" pressed={s.editor.mode === "delete"} onClick={() => s.editor.setMode("delete")} />
            <Divider />
            <Tool icon={Plus} label="Estado nuevo" onClick={s.addQuick} />
            <Tool icon={Undo2} label="Deshacer" onClick={s.editor.undo} disabled={!s.editor.canUndo} />
            <Tool icon={Redo2} label="Rehacer" onClick={s.editor.redo} disabled={!s.editor.canRedo} />
            <Divider />
            <Tool icon={Flag} label={selected ? `Estado inicial: ${state}` : "Estado inicial (elegí un estado)"} disabled={!selected} pressed={selected && s.machine.initial === state} onClick={() => s.editor.apply(setInitial(s.machine, state))} />
            <Tool icon={CircleCheckBig} label={selected ? `Alternar aceptación de ${state}` : "Estado de aceptación (elegí un estado)"} disabled={!selected} pressed={selected && s.machine.accepting.includes(state)} onClick={() => s.editor.apply(toggleAccepting(s.machine, state))} />
            <Tool icon={Pencil} label={selected ? `Renombrar ${state}` : "Renombrar (elegí un estado)"} disabled={!selected} onClick={() => onOpenTab("transiciones")} />
            <Tool icon={Eraser} label="Borrar el estado elegido" disabled={!selected} danger onClick={() => { s.editor.apply(removeState(s.machine, state)); s.editor.select({}); }} />
            <Divider />
            <Tool icon={ShieldAlert} label="Completar con estado de error" onClick={act(s.complete, "transiciones")} disabled={s.machine.type === "ap"} />
            {s.config.reference && <Tool icon={BookOpenCheck} label="Cargar la solución en el editor" onClick={act(s.loadReference, "resultado")} />}
            <Tool icon={RotateCcw} label="Empezar de nuevo" onClick={s.clearAll} />
            <Divider />
            <Tool icon={Save} label="Guardar este autómata en el navegador" onClick={act(() => s.saveCurrent(""), "guardados")} />
            <Tool icon={FolderOpen} label="Guardados" onClick={() => onOpenTab("guardados")} />
            <Tool icon={Download} label="Exportar como JSON" onClick={act(() => s.exportJson(""), "guardados")} />
            <Tool icon={Upload} label="Importar un JSON" onClick={() => fileRef.current?.click()} />
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Importar un autómata desde un archivo JSON"
              tabIndex={-1}
              onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) { s.importText(await file.text()); onOpenTab("guardados"); } }}
            />
            <Divider />
          </>
        )}
        {canvas && (
          <>
            <Tool icon={SlidersHorizontal} label="Cadena de entrada, ejemplos y velocidad" pressed={flyout === "run"} onClick={() => toggleFlyout("run")} />
            <Tool icon={s.auto ? Workflow : Hand} label={s.auto ? "Modo automático (pasar a manual)" : "Modo manual (pasar a automático)"} pressed={s.auto} onClick={s.toggleAuto} />
            <Tool icon={StepBack} label="Paso atrás" onClick={act(s.back, "ejecucion")} disabled={!s.started || s.k === 0} />
            <Tool icon={StepForward} label={s.started ? "Paso adelante" : "Empezar paso a paso"} onClick={act(s.forward, "ejecucion")} disabled={s.errors.length > 0 || s.finished} />
            <Tool icon={RefreshCw} label="Reiniciar la ejecución" onClick={s.reset} disabled={!s.started} />
            <Divider />
          </>
        )}
        {canvas && (
          <Tool
            icon={s.playing ? Square : Play}
            label={s.playing ? "Stop: frenar la máquina" : "Play: hacer funcionar la máquina"}
            pressed={s.playing}
            disabled={s.errors.length > 0}
            onClick={act(s.playing ? s.stop : s.togglePlay, "ejecucion")}
          />
        )}
        {!canvas && tools.map((t) => <Tool key={t.id} icon={t.icon} label={t.label} pressed={activeTool === t.id} onClick={() => onTool(t.id)} />)}
        {!canvas && tools.length > 0 && <Divider />}
        <Tool icon={Lightbulb} label="Pistas del ejercicio" pressed={hintActive} onClick={onHint} className={hasHint ? "" : "opacity-70"} />
      </div>

      {flyout === "run" && canvas && (
        <div role="group" aria-label="Ejecución" className="absolute z-40 w-72 max-w-[calc(100vw-1rem)] space-y-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg max-md:left-1 max-md:top-full max-md:mt-1 md:left-full md:top-2 md:ml-2 dark:border-zinc-700 dark:bg-zinc-900">
          <SymbolField
            label={tape ? (s.machine.type === "mt" ? "Entrada (sin los blancos b de los costados)" : "Cadena (se escribe entre ├ y ┤)") : "Cadena de entrada"}
            value={s.input}
            onChange={s.changeInput}
            onEnter={() => { s.togglePlay(); onOpenTab("ejecucion"); setFlyout(null); }}
            placeholder="λ si es vacía"
          />
          {(s.config.runExamples ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cadenas de ejemplo">
              {s.config.runExamples.map((e) => <button key={e} type="button" onClick={() => s.changeInput(e)} className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs dark:bg-zinc-800">{e || "λ"}</button>)}
            </div>
          )}
          <label className="flex items-center gap-1.5 text-xs text-zinc-500">
            Velocidad
            <Select value={s.speed} onValueChange={s.setSpeed}>
              <SelectTrigger className="w-36" aria-label="Velocidad de ejecución"><SelectValue /></SelectTrigger>
              <SelectContent>{SPEEDS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <button type="button" onClick={() => setFlyout(null)} className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs dark:border-zinc-700">Cerrar</button>
        </div>
      )}
    </div>
  );
}
