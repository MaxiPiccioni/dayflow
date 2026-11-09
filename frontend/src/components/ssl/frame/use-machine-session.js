"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMachineEditor } from "@/components/ssl/editor/use-machine-editor";
import { useMachineStore } from "@/components/ssl/editor/use-machine-store";
import { checkMachine } from "@/lib/ssl/machines/check-machine";
import { completeWithError } from "@/lib/ssl/machines/complete";
import { addState, analyze, cloneMachine, createMachine, importMachine, removeState, removeTransition } from "@/lib/ssl/machines/model";
import { nextFreePosition } from "@/lib/ssl/machines/layout";
import { runMachine } from "@/lib/ssl/machines/run";
import { itemsFor } from "@/lib/ssl/machines/store";
import { parseWord } from "@/lib/ssl/notation";

export const SPEEDS = [["1800", "Lento"], ["900", "Normal"], ["450", "Rápido"], ["180", "Muy rápido"]];

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

// Todo lo de un autómata en un ejercicio: editor con historial, ejecución paso a paso, comprobación, solución cargable,
// guardados y avisos. Lo comparten la barra lateral, el lienzo y el panel derecho del sandbox.
export function useMachineSession({ config, exerciseKey, savedJson, onSaveWorking }) {
  const initial = useMemo(() => startingMachine(config, savedJson), [config, savedJson]);
  // Guardado de la copia de trabajo con un pequeño retraso (arrastrar un estado cambia la máquina muchas veces).
  // Si se cierra o cambia de ejercicio antes de que venza, al desmontar se guarda igual lo pendiente.
  const timer = useRef(null);
  const pendingSave = useRef(null);
  const saveRef = useRef(onSaveWorking);
  useEffect(() => { saveRef.current = onSaveWorking; }, [onSaveWorking]);
  const onMachineChange = useCallback((m) => {
    clearTimeout(timer.current);
    pendingSave.current = JSON.stringify(m);
    timer.current = setTimeout(() => { const json = pendingSave.current; pendingSave.current = null; if (json) saveRef.current?.(json); }, 400);
  }, []);
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (pendingSave.current) { saveRef.current?.(pendingSave.current); pendingSave.current = null; }
  }, []);

  const editor = useMachineEditor(initial, onMachineChange);
  const store = useMachineStore();
  const { machine } = editor;
  const readOnly = !!config.readOnly;
  const [pending, setPending] = useState(null); // { from, to } mientras se arma una transición nueva
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);
  const [loadedNote, setLoadedNote] = useState("");
  const [message, setMessage] = useState("");

  // Ejecución
  const [input, setInput] = useState(config.runExamples?.[0] ?? "");
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
  const highlight = started && step ? { states: step.states, edges: step.edges } : null;

  useEffect(() => {
    if (!playing || !run || run.error) return undefined;
    if (k >= last) return undefined;
    const t = setTimeout(() => setK((v) => v + 1), Number(speed));
    return () => clearTimeout(t);
  }, [playing, k, last, run, speed]);

  const reset = () => { setStarted(false); setPlaying(false); setK(0); };
  const begin = () => { setStarted(true); setK(0); };
  const forward = () => {
    if (!started) { begin(); return; }
    setK((v) => Math.min(v + 1, last));
  };
  const back = () => { setPlaying(false); setK((v) => Math.max(v - 1, 0)); };
  // Un solo botón Play/Stop: en modo manual da un paso, en automático corre o frena.
  const togglePlay = () => {
    setAuto(true);
    if (!started) { begin(); setPlaying(true); return; }
    if (finished) { setK(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  };
  const stop = () => setPlaying(false);
  const changeInput = (value) => { setInput(value); setStarted(false); setPlaying(false); setK(0); };
  const toggleAuto = () => { setAuto((v) => !v); setPlaying(false); };

  // Edición
  const addQuick = () => {
    const r = addState(machine, nextFreePosition(machine.states));
    const error = editor.apply(r);
    if (error) setNotice(error);
    else { setNotice(""); editor.select({ state: r.id }); }
  };
  const doDelete = ({ state, edge }) => {
    if (state) { editor.apply(removeState(machine, state)); editor.select({}); }
    if (edge) {
      let m = machine;
      for (const id of edge) { const r = removeTransition(m, id); if (r.machine) m = r.machine; }
      editor.change(m);
      editor.select({});
    }
  };
  const complete = () => {
    const error = editor.apply(completeWithError(machine));
    setNotice(error);
    return error;
  };

  // Comprobación y solución
  const verify = () => { setResult(config.spec ? checkMachine(machine, config.spec) : null); };
  const loadReference = () => {
    // Antes de pisar el dibujo del estudiante se guarda una copia, para no perder su trabajo.
    if (machine.states.length) store.save({ name: "Mi intento (antes de cargar la solución)", exerciseKey, machine });
    editor.change(cloneMachine(config.reference));
    setResult(null);
    setLoadedNote(config.referenceSource === "guia" ? "Se cargó la solución de la guía. Tu dibujo anterior quedó guardado como “Mi intento”." : "Se cargó una solución propuesta por el sandbox (la guía solo trae el dibujo). Tu dibujo anterior quedó guardado como “Mi intento”.");
  };
  const clearAll = () => { editor.change(startingMachine({ ...config, initial: config.initial }, null)); setResult(null); setLoadedNote(""); };

  // Guardados, exportar e importar
  const saveCurrent = (name) => { store.save({ name: name || machine.name || "Mi autómata", exerciseKey, machine }); setMessage("Guardado en este navegador."); };
  const exportJson = (name) => setMessage(download(name || machine.name, JSON.stringify(machine, null, 2)));
  const importText = (text) => {
    const r = importMachine(text);
    if (r.error) return setMessage(r.error);
    if (r.machine.type !== config.type) return setMessage(`El archivo es un ${r.machine.type.toUpperCase()} y este ejercicio pide otro tipo de máquina.`);
    editor.change(r.machine);
    setMessage("Autómata importado.");
  };
  const openSaved = (item) => { editor.change(cloneMachine(item.machine)); setMessage(`Abierto: ${item.name}`); };
  const saved = itemsFor(store.store, exerciseKey);

  return {
    config, exerciseKey, readOnly, editor, machine, store, saved,
    pending, setPending, notice, setNotice, result, loadedNote, message, setMessage,
    errors, input, changeInput, auto, toggleAuto, playing, speed, setSpeed, k, last, started, finished, run, step, highlight,
    reset, forward, back, togglePlay, stop, begin,
    addQuick, doDelete, complete, verify, loadReference, clearAll, saveCurrent, exportJson, importText, openSaved,
  };
}
