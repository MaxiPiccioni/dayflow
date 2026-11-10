"use client";

import { useMemo, useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { ExerciseBar } from "@/components/ssl/frame/exercise-bar";
import { PartsView } from "@/components/ssl/frame/parts-view";
import { SessionCanvas } from "@/components/ssl/frame/session-canvas";
import { SessionTab } from "@/components/ssl/frame/session-panel";
import { SessionProvider } from "@/components/ssl/frame/session-context";
import { SessionToolbar } from "@/components/ssl/frame/session-toolbar";
import { MathText } from "@/components/ssl/math-text";
import { StepReveal } from "@/components/ssl/step-reveal";
import { TransitionTable } from "@/components/ssl/transition-table";
import { ToolPanel } from "@/components/ssl/tools/tool-panel";
import { GENERIC_TOOLS, OWN_TOOL_ICON, TOOL_DEFAULTS, TOOL_LABEL } from "@/components/ssl/frame/tools";
import { buildItems, hintOf, partsOf } from "@/lib/ssl/items";

const TAB_LABEL = {
  ejecucion: "Ejecución", resultado: "Resultado", tabla: "Tabla", definicion: "Definición", transiciones: "Transiciones", alfabetos: "Alfabetos",
  guardados: "Guardados", herramienta: "Herramienta", respuestas: "Respuestas", apartados: "Apartados", complejidad: "Complejidad", pasos: "Pasos", solucion: "Solución", pista: "Pista",
};

function tabsFor({ item, machine, tool, hasAnswers, multiple, complexity }) {
  const tabs = [];
  // Con varios apartados (o con campos de respuesta) la pestaña de apartados va primera: es donde se contesta.
  if (hasAnswers && (multiple || !machine)) tabs.push(multiple ? "apartados" : "respuestas");
  if (item.kind === "example") tabs.push("pasos");
  if (machine) tabs.push("ejecucion");
  if (item.kind === "exercise" && machine) tabs.push("resultado");
  if (machine) tabs.push("tabla", "definicion", "transiciones", "alfabetos");
  if (item.kind === "exercise" && machine) tabs.push("guardados");
  if (machine && tool) tabs.push("herramienta");
  if (hasAnswers && machine && !multiple) tabs.push("respuestas");
  if (complexity) tabs.push("complejidad");
  if (item.kind === "exercise") tabs.push("solucion", "pista");
  return tabs;
}

function PanelContent({ id, item, parts, partIndex, onPart, tool, hint, answers, onAnswer }) {
  if (id === "pasos") return <div className="space-y-3"><MathText text={item.example.context ?? item.section.context} className="block text-sm leading-relaxed text-zinc-600 dark:text-zinc-300" /><StepReveal steps={item.example.steps} />{item.example.tables && <div className="flex flex-wrap gap-3">{item.example.tables.map((table) => <TransitionTable key={table.name} table={table} />)}</div>}</div>;
  if (id === "herramienta") return tool ? <ToolPanel tool={tool} defaultOpen /> : null;
  if (id === "respuestas" || id === "apartados") return <PartsView exercise={item.exercise} parts={parts} activeIndex={partIndex} answers={answers} onAnswer={onAnswer} onPart={onPart} />;
  if (id === "solucion") {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-xs font-semibold text-zinc-500">Solución de la guía{item.exercise.solutionPage ? ` · pág. ${item.exercise.solutionPage}` : ""}</p>
        {parts.map((part) => (
          <div key={part.id || "unica"}>
            {part.id && <p className="text-xs font-semibold text-lime-700 dark:text-lime-400">{part.id})</p>}
            <MathText text={part.solution ?? `Solución en la guía, pág. ${item.exercise.solutionPage ?? item.exercise.page}.`} className="block font-mono leading-relaxed" />
          </div>
        ))}
        {item.exercise.drawing && item.exercise.solutionPage && <p className="text-xs text-zinc-500">Los dibujos (árboles, grafos) están en la guía, pág. {item.exercise.solutionPage}.</p>}
      </div>
    );
  }
  if (id === "pista") {
    return hint
      ? <div className="space-y-1 text-sm"><p className="text-xs font-semibold text-zinc-500">Pista</p><MathText text={hint} className="block leading-relaxed" /></div>
      : <p className="text-sm text-zinc-500">Todavía no hay una pista cargada para este ejercicio.</p>;
  }
  return <SessionTab id={id} />;
}

// Lo que se ve de un ejercicio (o de un inciso): barra del ejercicio, comandos, lienzo y panel derecho. Se vuelve a crear al
// cambiar de ejercicio o de inciso, así cada uno arranca con su propia sesión.
function Workspace({ items, index, item, parts, partIndex, store, onGo, onPart, panelOpen, setPanelOpen }) {
  const { progress, setAnswer, setDone } = store;
  const part = parts[partIndex];
  const machine = part.machine ?? null;
  const exercise = item.exercise;
  const partKey = item.kind === "exercise" ? `${exercise.id}.${part.id}` : `ejemplo.${item.example.title}`;
  const ownTool = part.tool ?? (item.kind === "exercise" && exercise.tool && parts.every((p) => !p.tool) ? exercise.tool : null) ?? (item.kind === "example" ? item.section.tool ?? null : item.section.tool ?? null);
  const tool = ownTool;
  // La herramienta elegida en la barra vale para el apartado en el que se eligió; al cambiar de apartado vuelve la propia.
  const [pickedTool, setPickedTool] = useState({ partIndex: -1, id: null });
  const activeTool = pickedTool.partIndex === partIndex ? pickedTool.id : machine ? null : ownTool?.type ?? null;
  const setActiveTool = (id) => setPickedTool({ partIndex, id });
  const tools = machine ? [] : [
    ...GENERIC_TOOLS,
    ...(ownTool && !GENERIC_TOOLS.some((t) => t.id === ownTool.type) ? [{ id: ownTool.type, label: TOOL_LABEL[ownTool.type] ?? "Herramienta del ejercicio", icon: OWN_TOOL_ICON }] : []),
  ];
  const toolConfig = activeTool ? (ownTool?.type === activeTool ? ownTool : { type: activeTool, ...TOOL_DEFAULTS[activeTool] }) : null;
  const hasAnswers = item.kind === "exercise" && parts.some((p) => (p.checks ?? []).length > 0);
  const multiple = item.kind === "exercise" && parts.length > 1;
  const hint = hintOf(item, part);
  const tabs = tabsFor({ item, machine, tool: machine ? tool : null, hasAnswers, multiple, complexity: machine?.complexity });
  const [tab, setTab] = useState(tabs[0] ?? "solucion");
  const current = tabs.includes(tab) ? tab : tabs[0];
  const openTab = (id) => { setTab(id); setPanelOpen(true); };
  const answersTab = tabs.find((id) => id === "apartados" || id === "respuestas");
  const canCheck = !!machine?.spec || hasAnswers;
  const onCheck = () => openTab(machine?.spec ? "resultado" : hasAnswers && answersTab ? answersTab : current);

  const body = (
    <>
      <ExerciseBar items={items} index={index} item={item} progress={progress} onGo={onGo} onSetDone={setDone} partIndex={partIndex} canCheck={canCheck} onCheck={onCheck} />
      <div className="relative flex min-h-0 flex-1 max-md:flex-col md:flex-row">
        <SessionToolbar tools={tools} activeTool={activeTool} onTool={(id) => setActiveTool(id === activeTool ? null : id)} hasHint={!!hint} hintActive={panelOpen && current === "pista"} onHint={() => openTab(tabs.includes("pista") ? "pista" : current)} onOpenTab={openTab} />
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {machine ? <SessionCanvas /> : (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 md:p-4">
              {toolConfig ? <ToolPanel key={`${partKey}.${toolConfig.type}`} tool={toolConfig} defaultOpen /> : null}
              {!toolConfig && hasAnswers && <p className="text-sm text-zinc-500">Escribí tus respuestas en el panel de la derecha{panelOpen ? "" : " (botón “Panel”)"}. En la barra de la izquierda tenés las herramientas.</p>}
              {!toolConfig && !hasAnswers && <p className="text-sm text-zinc-500">Este ejercicio se resuelve en papel: leé el enunciado y comparalo con la solución del panel. En la barra de la izquierda tenés las herramientas.</p>}
            </div>
          )}
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            aria-expanded={panelOpen}
            aria-controls="sandbox-panel"
            className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-xl border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs font-medium shadow-sm hover:border-lime-500 dark:border-zinc-700 dark:bg-zinc-900/95"
          >
            {panelOpen ? <PanelRightClose size={15} aria-hidden="true" /> : <PanelRightOpen size={15} aria-hidden="true" />} Panel
          </button>
        </main>
        {panelOpen && (
          <aside
            id="sandbox-panel"
            aria-label="Panel del ejercicio"
            className="z-40 flex min-h-0 flex-col border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:h-[52vh] max-md:rounded-t-2xl max-md:border-t md:w-[380px] md:shrink-0 md:border-l md:shadow-none"
          >
            <div role="tablist" aria-label="Secciones del panel" className="scrollbar-thin flex shrink-0 gap-1 overflow-x-auto border-b border-zinc-200 p-1.5 dark:border-zinc-800">
              {tabs.map((id) => (
                <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={id === current} aria-controls={`tabpanel-${id}`} onClick={() => setTab(id)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${id === current ? "bg-zinc-900 text-white dark:bg-lime-400 dark:text-zinc-950" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}>{TAB_LABEL[id]}</button>
              ))}
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Cerrar el panel" className="ml-auto shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 md:hidden">Cerrar</button>
            </div>
            <div role="tabpanel" id={`tabpanel-${current}`} aria-labelledby={`tab-${current}`} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto p-3">
              <PanelContent id={current} item={item} parts={parts} partIndex={partIndex} onPart={onPart} tool={tool} hint={hint} answers={progress.answers} onAnswer={setAnswer} />
            </div>
          </aside>
        )}
      </div>
    </>
  );

  if (!machine) return body;
  return (
    <SessionProvider
      config={machine}
      exerciseKey={partKey}
      savedJson={item.kind === "exercise" ? progress.answers[`${partKey}.machine`] : undefined}
      onSaveWorking={item.kind === "exercise" ? (json) => setAnswer(`${partKey}.machine`, json) : undefined}
    >
      {body}
    </SessionProvider>
  );
}

// Sandbox de una unidad con el marco nuevo: ejercicio arriba, comandos a la izquierda, lienzo y panel derecho retráctil.
export function SandboxFrame({ unit, store }) {
  const { progress, setUi } = store;
  const items = useMemo(() => buildItems(unit), [unit]);
  // En pantallas anchas el panel arranca abierto; en celular, cerrado (se abre como cajón desde abajo).
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  const stored = Number(progress.ui[`unit.${unit.n}.item`]);
  const index = Number.isInteger(stored) && stored >= 0 && stored < items.length ? stored : 0;
  const item = items[index];
  const parts = partsOf(item);
  const storedPart = Number(progress.ui[`${item.key}.part`]);
  const partIndex = Number.isInteger(storedPart) && storedPart >= 0 && storedPart < parts.length ? storedPart : 0;

  const onGo = (next) => setUi(`unit.${unit.n}.item`, Math.min(Math.max(next, 0), items.length - 1));
  const onPart = (next) => setUi(`${item.key}.part`, next);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Workspace key={`${item.key}.${parts.some((p) => p.machine) ? partIndex : 0}`} items={items} index={index} item={item} parts={parts} partIndex={partIndex} store={store} onGo={onGo} onPart={onPart} panelOpen={panelOpen} setPanelOpen={setPanelOpen} />
    </div>
  );
}
