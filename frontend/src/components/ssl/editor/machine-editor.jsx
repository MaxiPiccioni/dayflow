import { useState } from "react";
import { CirclePlus, Link2, MousePointer2, Plus, Redo2, Trash2, Undo2 } from "lucide-react";
import { MachineCanvas } from "@/components/ssl/editor/machine-canvas";
import { SymbolField } from "@/components/ssl/symbol-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LABEL_HELP, LABEL_PLACEHOLDER, parseLabel } from "@/lib/ssl/machines/labels";
import { nextFreePosition } from "@/lib/ssl/machines/layout";
import { TYPE_LABEL, addState, addTransition, addTransitions, analyze, formalDefinition, functionLines, isFa, removeState, removeTransition, renameState, setInitial, toggleAccepting, transitionLabel, transitionTable, updateTransition } from "@/lib/ssl/machines/model";
import { inputClass } from "@/lib/faculty";

const button = "flex items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium hover:border-lime-500 disabled:opacity-40 dark:border-zinc-700";
const active = "border-zinc-900 bg-zinc-900 text-white hover:border-zinc-900 dark:border-lime-400 dark:bg-lime-400 dark:text-zinc-950";
const VIEWS = [["grafo", "Grafo"], ["tabla", "Tabla"], ["definicion", "Definición formal"]];

function ModeButton({ mode, current, setMode, icon: Icon, label }) {
  return (
    <button type="button" aria-pressed={current === mode} onClick={() => setMode(mode)} className={`${button} ${current === mode ? active : ""}`}>
      <Icon size={14} aria-hidden="true" /> {label}
    </button>
  );
}

function TransitionRow({ machine, t, editor, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const label = transitionLabel(machine, t);

  const save = () => {
    const parsed = parseLabel(machine, text);
    if (parsed.error) return setError(parsed.error);
    const patch = parsed.symbols ? (parsed.symbols.length === 1 ? { symbol: parsed.symbols[0] } : null) : parsed.fields;
    if (!patch) return setError("Al editar una transición se escribe un solo símbolo.");
    const message = editor.apply(updateTransition(machine, t.id, patch));
    if (message) return setError(message);
    setEditing(false);
    setError("");
  };

  return (
    <li className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800">
      {editing ? (
        <div className="space-y-1.5">
          <p className="font-mono text-xs text-zinc-500">{t.from} → {t.to}</p>
          <SymbolField label="Etiqueta" value={text} onChange={setText} onEnter={save} placeholder={LABEL_PLACEHOLDER[machine.type]} />
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={save} className={`${button} ${active}`}>Guardar</button>
            <button type="button" onClick={() => { setEditing(false); setError(""); }} className={button}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 break-words font-mono"><span className="text-zinc-500">{t.from} → {t.to}</span>  {label}</span>
          {!readOnly && (
            <span className="flex shrink-0 gap-1">
              <button type="button" onClick={() => { setText(label); setEditing(true); }} className="rounded-lg px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label={`Editar la transición ${t.from} a ${t.to} ${label}`}>Editar</button>
              <button type="button" onClick={() => editor.apply(removeTransition(machine, t.id))} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800" aria-label={`Borrar la transición ${t.from} a ${t.to} ${label}`}><Trash2 size={14} /></button>
            </span>
          )}
        </div>
      )}
    </li>
  );
}

// Formulario "De / A / etiqueta": alternativa accesible (y cómoda en celular) a unir estados con el mouse.
function TransitionForm({ machine, editor, pending, setPending }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const fromId = pending?.from ?? from;
  const toId = pending?.to ?? to;
  const ids = machine.states.map((s) => s.id);

  const submit = (event) => {
    event?.preventDefault();
    if (!fromId || !toId) return setError("Elegí el estado de origen y el de destino.");
    const parsed = parseLabel(machine, text);
    if (parsed.error) return setError(parsed.error);
    const result = parsed.symbols ? addTransitions(machine, fromId, toId, parsed.symbols) : addTransition(machine, { from: fromId, to: toId, ...parsed.fields });
    const message = editor.apply(result);
    if (message) return setError(message);
    setError("");
    setText("");
    setPending(null);
    setFrom("");
    setTo("");
  };

  const picker = (label, value, set) => (
    <label className="block text-xs text-zinc-500">
      {label}
      <Select value={value || undefined} onValueChange={set}>
        <SelectTrigger className="mt-1 w-full" aria-label={label}><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>{ids.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
      </Select>
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-semibold text-zinc-500">{pending ? `Nueva transición de ${pending.from} a ${pending.to}` : "Agregar transición"}</p>
      {!pending && <div className="grid grid-cols-2 gap-2">{picker("De", from, setFrom)}{picker("A", to, setTo)}</div>}
      <SymbolField label="Etiqueta" value={text} onChange={setText} onEnter={submit} placeholder={LABEL_PLACEHOLDER[machine.type]} hint={LABEL_HELP[machine.type]} />
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={`${button} ${active}`}><Plus size={14} aria-hidden="true" /> Agregar</button>
        {pending && <button type="button" onClick={() => { setPending(null); setError(""); }} className={button}>Cancelar</button>}
      </div>
    </form>
  );
}

function StatePanel({ machine, editor, id, readOnly }) {
  const [name, setName] = useState(id);
  const [error, setError] = useState("");
  const rename = () => {
    if (name === id) return;
    const message = editor.apply(renameState(machine, id, name));
    if (message) { setError(message); setName(id); } else { setError(""); editor.select({ state: name.trim() }); }
  };
  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-semibold text-zinc-500">Estado elegido</p>
      <label className="block text-xs text-zinc-500">
        Nombre
        <input value={name} onChange={(event) => setName(event.target.value)} onBlur={rename} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} disabled={readOnly} maxLength={12} className={`${inputClass} mt-1 font-mono`} />
      </label>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => editor.apply(setInitial(machine, id))} aria-pressed={machine.initial === id} className={`${button} ${machine.initial === id ? active : ""}`}>Inicial</button>
          <button type="button" onClick={() => editor.apply(toggleAccepting(machine, id))} aria-pressed={machine.accepting.includes(id)} className={`${button} ${machine.accepting.includes(id) ? active : ""}`}>De aceptación</button>
          <button type="button" onClick={() => { editor.apply(removeState(machine, id)); editor.select({}); }} className={`${button} hover:border-red-400 hover:text-red-600`}><Trash2 size={14} aria-hidden="true" /> Borrar</button>
        </div>
      )}
    </div>
  );
}

function TableView({ machine }) {
  if (isFa(machine)) {
    const t = transitionTable(machine);
    return (
      <div className="w-0 min-w-full overflow-x-auto">
        <table className="border-collapse text-center font-mono text-sm">
          <caption className="mb-1 text-left text-xs font-semibold text-zinc-500">Función de transición f</caption>
          <thead>
            <tr>
              <th scope="col" className="border border-zinc-300 bg-zinc-100 px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-800">f</th>
              {t.columns.map((c) => <th key={c} scope="col" className="border border-zinc-300 bg-zinc-100 px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-800">{c === "" ? "λ" : c}</th>)}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-left dark:border-zinc-700 dark:bg-zinc-800">{row.initial ? "→" : ""}{row.accepting ? "*" : ""}{row.id}</th>
                {row.cells.map((cell, i) => <td key={i} className="border border-zinc-300 px-2.5 py-1 dark:border-zinc-700">{cell.length === 0 ? "" : machine.type === "afnd" ? `{${cell.join(", ")}}` : cell[0]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!t.rows.length && <p className="mt-2 text-sm text-zinc-400">Todavía no hay estados.</p>}
      </div>
    );
  }
  const headers = machine.type === "ap" ? ["Estado", "Entrada", "Tope", "Apila", "Estado siguiente"] : ["Estado", "Lee", "Escribe", "Mueve", "Estado siguiente"];
  return (
    <div className="w-0 min-w-full overflow-x-auto">
      <table className="border-collapse text-center font-mono text-sm">
        <thead><tr>{headers.map((h) => <th key={h} scope="col" className="border border-zinc-300 bg-zinc-100 px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-800">{h}</th>)}</tr></thead>
        <tbody>
          {machine.transitions.map((t) => (
            <tr key={t.id}>
              <td className="border border-zinc-300 px-2.5 py-1 dark:border-zinc-700">{t.from}</td>
              <td className="border border-zinc-300 px-2.5 py-1 dark:border-zinc-700">{machine.type === "ap" ? (t.read || "λ") : t.read}</td>
              <td className="border border-zinc-300 px-2.5 py-1 dark:border-zinc-700">{machine.type === "ap" ? (t.pop || "λ") : t.write}</td>
              <td className="border border-zinc-300 px-2.5 py-1 dark:border-zinc-700">{machine.type === "ap" ? (t.push || "λ") : t.move}</td>
              <td className="border border-zinc-300 px-2.5 py-1 dark:border-zinc-700">{t.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!machine.transitions.length && <p className="mt-2 text-sm text-zinc-400">Todavía no hay transiciones.</p>}
    </div>
  );
}

function SettingsPanel({ machine, editor, lockAlphabet }) {
  const [alphabet, setAlphabet] = useState(machine.alphabet.join(", "));
  const [extra, setExtra] = useState(machine.extra.join(", "));
  const toList = (text) => [...new Set(text.split(/[,\s]+/).filter(Boolean).flatMap((x) => Array.from(x).length === 1 ? [x] : Array.from(x)))];
  const commitAlphabet = () => editor.change({ ...machine, alphabet: toList(alphabet) });
  const commitExtra = () => editor.change({ ...machine, extra: toList(extra) });
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <SymbolField label={isFa(machine) || machine.type === "ap" ? "Alfabeto de entrada ΣE" : "Alfabeto de entrada ΣE"} value={alphabet} onChange={setAlphabet} onEnter={commitAlphabet} hint={lockAlphabet ? "Lo fija el ejercicio." : "Se aplica al salir del campo."} className={lockAlphabet ? "pointer-events-none opacity-60" : ""} />
      {!isFa(machine) && <SymbolField label={machine.type === "ap" ? "Símbolos de pila (no terminales y otros)" : "Símbolos auxiliares Ω"} value={extra} onChange={setExtra} onEnter={commitExtra} />}
      {!lockAlphabet && <button type="button" onClick={commitAlphabet} className={`${button} w-fit`}>Aplicar alfabetos</button>}
      {!isFa(machine) && <button type="button" onClick={commitExtra} className={`${button} w-fit`}>Aplicar símbolos</button>}
      {machine.type === "ap" && (
        <>
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input type="checkbox" checked={machine.pushMode === "production"} onChange={(event) => editor.change({ ...machine, pushMode: event.target.checked ? "production" : "natural" })} className="h-4 w-4 accent-lime-600" />
            Analizador sintáctico: las producciones se apilan de forma refleja (X := 0YZ deja #ZY0)
          </label>
          <label className="block text-xs text-zinc-500">
            Condición de aceptación
            <Select value={machine.acceptBy ?? "both"} onValueChange={(value) => editor.change({ ...machine, acceptBy: value })}>
              <SelectTrigger className="mt-1 w-full" aria-label="Condición de aceptación"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Estado final, cadena leída y pila vacía (guía)</SelectItem>
                <SelectItem value="state">Estado final y cadena leída</SelectItem>
                <SelectItem value="empty">Pila vacía y cadena leída</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </>
      )}
    </div>
  );
}

// Editor visual de máquinas: grafo, tabla y definición formal sincronizados. `editor` viene de useMachineEditor.
export function MachineEditor({ editor, readOnly = false, lockAlphabet = false, highlight }) {
  const { machine, mode, selection } = editor;
  const [view, setView] = useState("grafo");
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { warnings, errors } = analyze(machine);

  const addQuick = () => {
    const p = nextFreePosition(machine.states);
    const r = addState(machine, p);
    const message = editor.apply(r);
    if (message) setNotice(message);
    else { setNotice(""); editor.select({ state: r.id }); }
  };

  const doDelete = ({ state, edge }) => {
    if (state) { editor.apply(removeState(machine, state)); editor.select({}); }
    if (edge) { let m = machine; for (const id of edge) { const r = removeTransition(m, id); if (r.machine) m = r.machine; } editor.change(m); editor.select({}); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Herramientas de dibujo">
          {!readOnly && (
            <>
              <ModeButton mode="select" current={mode} setMode={editor.setMode} icon={MousePointer2} label="Mover" />
              <ModeButton mode="state" current={mode} setMode={editor.setMode} icon={CirclePlus} label="Agregar estado" />
              <ModeButton mode="link" current={mode} setMode={editor.setMode} icon={Link2} label="Unir" />
              <ModeButton mode="delete" current={mode} setMode={editor.setMode} icon={Trash2} label="Borrar" />
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!readOnly && (
            <>
              <button type="button" onClick={addQuick} className={button}><Plus size={14} aria-hidden="true" /> Estado</button>
              <button type="button" onClick={editor.undo} disabled={!editor.canUndo} className={button} aria-label="Deshacer"><Undo2 size={14} aria-hidden="true" /></button>
              <button type="button" onClick={editor.redo} disabled={!editor.canRedo} className={button} aria-label="Rehacer"><Redo2 size={14} aria-hidden="true" /></button>
            </>
          )}
        </div>
      </div>

      {!readOnly && mode === "link" && (
        <p className="text-xs text-zinc-500" role="status">{editor.linkFrom ? `Origen: ${editor.linkFrom}. Hacé clic en el estado de destino (el mismo estado hace un bucle).` : "Unir: hacé clic en el estado de origen y después en el de destino."}</p>
      )}
      {!readOnly && mode === "state" && <p className="text-xs text-zinc-500">Hacé clic en un lugar vacío del lienzo para agregar un estado.</p>}
      {notice && <p role="alert" className="text-xs text-red-600">{notice}</p>}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vista del autómata">
        {VIEWS.map(([key, label]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${view === key ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>{label}</button>)}
        <button type="button" aria-expanded={showSettings} onClick={() => setShowSettings((v) => !v)} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Alfabetos y opciones</button>
      </div>

      {showSettings && <SettingsPanel key={machine.type} machine={machine} editor={editor} lockAlphabet={lockAlphabet || readOnly} />}

      {view === "grafo" && (
        <MachineCanvas
          machine={machine}
          mode={mode}
          selection={selection}
          highlight={highlight}
          readOnly={readOnly}
          onLiveChange={editor.liveMove}
          onCommitDrag={editor.commitDrag}
          onChange={editor.change}
          onSelect={editor.select}
          onDelete={doDelete}
          onRequestTransition={(from, to) => setPending({ from, to })}
          linkFrom={editor.linkFrom}
          onLinkFrom={editor.setLinkFrom}
        />
      )}
      {view === "tabla" && <TableView machine={machine} />}
      {view === "definicion" && (
        <div className="space-y-2 rounded-xl border border-zinc-200 p-3 font-mono text-sm dark:border-zinc-800">
          <p className="break-words font-semibold">{formalDefinition(machine)}</p>
          <ul className="space-y-0.5 text-zinc-600 dark:text-zinc-300">{functionLines(machine).map((line) => <li key={line} className="break-words">{line}</li>)}</ul>
          {!machine.transitions.length && <p className="text-zinc-400">Todavía no hay transiciones.</p>}
        </div>
      )}

      {errors.map((e) => <p key={e} className="text-xs text-red-600">{e}</p>)}
      {warnings.map((w) => <p key={w} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{w}</p>)}

      {selection.state && machine.states.some((s) => s.id === selection.state) && <StatePanel key={selection.state} machine={machine} editor={editor} id={selection.state} readOnly={readOnly} />}

      {!readOnly && machine.states.length > 0 && <TransitionForm key={pending ? `${pending.from}>${pending.to}` : "form"} machine={machine} editor={editor} pending={pending} setPending={setPending} />}

      <div>
        <p className="mb-1 text-xs font-semibold text-zinc-500">Transiciones ({machine.transitions.length})</p>
        {machine.transitions.length ? (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {machine.transitions.map((t) => <TransitionRow key={t.id} machine={machine} t={t} editor={editor} readOnly={readOnly} />)}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">Todavía no hay transiciones.</p>
        )}
      </div>
      <p className="text-[11px] text-zinc-400">{TYPE_LABEL[machine.type]} · teclado: Tab para recorrer los estados, flechas para moverlos, Enter para elegirlos y Supr para borrarlos.</p>
    </div>
  );
}
