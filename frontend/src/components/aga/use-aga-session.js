"use client";

import { useCallback, useMemo, useState } from "react";
import { EX, unitByNumber } from "@/lib/aga/index";
import { loadProgress, saveProgress } from "@/lib/aga/progress";
import { evalCommands, newScene, nextName, optOf, tryCommand, withOpt } from "@/lib/aga/scene";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Estado de una unidad del sandbox de Álgebra: ejercicio e inciso abiertos, la escena de cada inciso (órdenes, estilos y vista),
// la selección, la herramienta del plano y la pestaña del panel derecho. Recuerda el último ejercicio abierto de cada unidad.
export function useAgaSession(unitNumber) {
  const unit = unitByNumber(unitNumber);
  const list = useMemo(() => EX.filter((e) => e.unit === unitNumber), [unitNumber]);
  const [saveFailed, setSaveFailed] = useState(false);
  const [pos, setPos] = useState(() => {
    const last = loadProgress().last[unitNumber];
    const exIndex = Math.max(0, list.findIndex((e) => e.id === last?.id));
    return { exIndex, itemIndex: list[exIndex]?.items[last?.item] ? last.item : 0 };
  });
  const [scenes, setScenes] = useState({});
  const [resets, setResets] = useState({}); // veces que se restableció cada inciso (para volver a encuadrar el plano)
  const [sel, setSel] = useState(null);
  const [tool, setTool] = useState("move");
  const [tab, setTab] = useState("sol");
  const [revealed, setRevealed] = useState({});
  const [editing, setEditing] = useState(null);

  const ex = list[pos.exIndex];
  const item = ex.items[pos.itemIndex];
  const key = `${ex.id}:${pos.itemIndex}`;
  const scene = scenes[key] ?? newScene(item);
  const objs = useMemo(() => evalCommands(scene.cmds), [scene.cmds]);
  const mat = !!unit.mat;

  // En matrices siempre hay un objeto elegido: el del foco del inciso o el último.
  const focusName = item.focus && objs.find((o) => o.name === item.focus)?.name;
  const selected = mat && !objs.some((o) => o.name === sel) ? focusName ?? objs[objs.length - 1]?.name ?? null : sel;

  const opt = useCallback((name) => optOf(scene, name), [scene]);
  const updateScene = useCallback((fn) => setScenes((all) => ({ ...all, [key]: fn(all[key] ?? newScene(item)) })), [key, item]);

  // Recuerda el último ejercicio abierto de la unidad.
  const remember = (id, itemIndex) => {
    const next = loadProgress();
    next.last[unitNumber] = { id, item: itemIndex };
    setSaveFailed(!saveProgress(next));
  };

  const clearTransient = () => { setSel(null); setEditing(null); setTab("sol"); };
  const openEx = (index, itemIndex = 0) => {
    const exIndex = clamp(index, 0, list.length - 1);
    setPos({ exIndex, itemIndex });
    remember(list[exIndex].id, itemIndex);
    clearTransient();
  };
  const openItem = (index) => { setPos((p) => ({ ...p, itemIndex: index })); remember(ex.id, index); clearTransient(); };

  const addCommand = (text) => {
    const error = tryCommand(scene.cmds, text);
    if (error) return error;
    const cmds = [...scene.cmds, text];
    updateScene((s) => ({ ...s, cmds }));
    const added = evalCommands(cmds);
    setSel(added[added.length - 1].name);
    return null;
  };
  const addCreated = (cmd, name) => { if (!tryCommand(scene.cmds, cmd)) { updateScene((s) => ({ ...s, cmds: [...s.cmds, cmd] })); setSel(name); } };

  return {
    unit, mat, list, ex, item, itemIndex: pos.itemIndex, exIndex: pos.exIndex, sceneKey: `${key}#${resets[key] ?? 0}`,
    scene, objs, sel: selected, tool, tab, editing, saveFailed,
    revealed: !!revealed[key],
    openEx, openItem,
    setTool, setTab, setEditing,
    select: (name, openProps = false) => { setSel(name); if (openProps && name) setTab("prop"); },
    reveal: () => setRevealed((r) => ({ ...r, [key]: true })),
    reset: () => {
      setScenes((all) => { const { [key]: _removed, ...rest } = all; return rest; });
      setResets((r) => ({ ...r, [key]: (r[key] ?? 0) + 1 }));
      setSel(null); setEditing(null);
    },
    addCommand,
    addPoint: (x, y) => { const name = nextName(objs, "p"); addCreated(`${name}=(${x},${y})`, name); },
    addVector: (a, b) => { const name = nextName(objs, "v"); addCreated(`${name}=Vector((${a.x},${a.y}),(${b.x},${b.y}))`, name); },
    deleteRow: (index) => { updateScene((s) => ({ ...s, cmds: s.cmds.filter((_, i) => i !== index) })); setSel(null); },
    commitEdit: (index, value) => {
      updateScene((s) => ({ ...s, cmds: s.cmds.map((cmd, i) => (i === index ? cmd.match(/^[!~]*/)[0] + value : cmd)) }));
      setEditing(null);
    },
    setOpt: (name, patch) => updateScene((s) => withOpt(s, name, patch)),
    setComp: (comp) => updateScene((s) => ({ ...s, comp })),
    setView: (view) => updateScene((s) => ({ ...s, view })),
    opt,
  };
}
