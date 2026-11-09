import { describe, expect, it } from "vitest";
import { parseLabel } from "./labels.js";
import { canRedo, canUndo, commit, createHistory, redo, replace, undo } from "./history.js";
import { MACHINES_KEY, deleteItem, duplicateItem, emptyStore, itemsFor, loadStore, saveItem, saveStore } from "./store.js";
import { addState, createMachine } from "./model.js";

const afnd = createMachine("afnd");
const ap = createMachine("ap");
const mt = createMachine("mt");

describe("etiquetas", () => {
  it("AF: símbolos y λ", () => {
    expect(parseLabel(afnd, "0, 1").symbols).toEqual(["0", "1"]);
    expect(parseLabel(afnd, "lambda").symbols).toEqual([""]);
    expect(parseLabel(afnd, "ab").error).toMatch(/más de un símbolo/);
    expect(parseLabel(afnd, "  ").error).toBeTruthy();
  });
  it("AP: entrada, tope / apila", () => {
    expect(parseLabel(ap, "a,λ/ b").fields).toEqual({ read: "a", pop: "", push: "b" });
    expect(parseLabel(ap, "λ,S/ AaB").fields).toEqual({ read: "", pop: "S", push: "AaB" });
    expect(parseLabel(ap, "λ,#/ #S").fields).toEqual({ read: "", pop: "#", push: "#S" });
    expect(parseLabel(ap, ")(,/").error).toBeTruthy();
    expect(parseLabel(ap, "a,b").error).toMatch(/barra/);
    expect(parseLabel(ap, "a/ b").error).toMatch(/dos cosas/);
  });
  it("ALA y MT: lee / escribe, movimiento", () => {
    expect(parseLabel(mt, "0/ 1,D").fields).toEqual({ read: "0", write: "1", move: "D" });
    expect(parseLabel(mt, "b/ P,P").fields).toEqual({ read: "b", write: "P", move: "P" });
    expect(parseLabel(mt, "0/ 1,X").error).toMatch(/movimiento/);
    expect(parseLabel(mt, "00/ 1,D").error).toBeTruthy();
    expect(parseLabel(mt, "0/ 1").error).toBeTruthy();
  });
});

describe("historial (deshacer y rehacer)", () => {
  it("registra, deshace y rehace", () => {
    let h = createHistory("a");
    h = commit(h, "b");
    h = commit(h, "c");
    expect(canUndo(h)).toBe(true);
    h = undo(h);
    expect(h.present).toBe("b");
    expect(canRedo(h)).toBe(true);
    h = redo(h);
    expect(h.present).toBe("c");
    h = undo(undo(h));
    h = commit(h, "z");
    expect(canRedo(h)).toBe(false);
    expect(undo(createHistory("x")).present).toBe("x");
  });
  it("no agrega pasos si no cambió y replace no deja historia", () => {
    const h = createHistory("a");
    expect(commit(h, "a")).toBe(h);
    expect(replace(h, "b").past).toEqual([]);
  });
});

describe("autómatas guardados", () => {
  const fake = (initial = {}) => { const data = { ...initial }; return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; }, data }; };
  const machine = addState(createMachine("afd"), { id: "p" }).machine;
  it("guarda, reemplaza por nombre, duplica y borra", () => {
    let store = saveItem(emptyStore(), { name: "Mi AFD", exerciseKey: "u3-e2", machine, savedAt: "t1" });
    store = saveItem(store, { name: "Mi AFD", exerciseKey: "u3-e2", machine, savedAt: "t2" });
    expect(store.items).toHaveLength(1);
    expect(store.items[0].savedAt).toBe("t2");
    store = duplicateItem(store, store.items[0].id, "t3");
    expect(store.items.map((i) => i.name)).toEqual(["Mi AFD", "Mi AFD (copia)"]);
    expect(itemsFor(store, "u3-e2")).toHaveLength(2);
    expect(itemsFor(store, "otro")).toHaveLength(0);
    expect(deleteItem(store, store.items[0].id).items).toHaveLength(1);
  });
  it("persiste en localStorage y tolera que falle", () => {
    const storage = fake();
    const store = saveItem(emptyStore(), { name: "A", exerciseKey: "k", machine, savedAt: "t" });
    expect(saveStore(store, storage)).toBe(true);
    expect(loadStore(storage).items[0].machine.states[0].id).toBe("p");
    expect(JSON.parse(storage.data[MACHINES_KEY]).v).toBe(1);
    const broken = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
    expect(loadStore(broken)).toEqual(emptyStore());
    expect(saveStore(store, broken)).toBe(false);
    expect(loadStore(fake({ [MACHINES_KEY]: "{no" }))).toEqual(emptyStore());
    expect(loadStore(fake({ [MACHINES_KEY]: JSON.stringify({ v: 9, items: [] }) }))).toEqual(emptyStore());
  });
});

describe("edición transitoria", () => {
  it("un arrastre largo es un solo paso de historial", async () => {
    const { commitFrom } = await import("./history.js");
    let h = createHistory("a0");
    const snapshot = h.present;
    h = replace(h, "a1");
    h = replace(h, "a2");
    h = commitFrom(h, snapshot);
    expect(h.past).toEqual(["a0"]);
    expect(undo(h).present).toBe("a0");
    expect(commitFrom(createHistory("x"), "x").past).toEqual([]);
  });
});
