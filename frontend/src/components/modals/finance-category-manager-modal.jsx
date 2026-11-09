"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/lib/faculty";

export function FinanceCategoryManagerModal({ incomeCategories, expenseCategories, addCategory, renameCategory, removeCategory, close }) {
  const [kind, setKind] = useState("income");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const categories = kind === "income" ? incomeCategories : expenseCategories;

  const submitAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await addCategory(kind, name.trim());
      setName("");
    } catch (err) {
      setError(err.message || "No se pudo crear la categoría.");
    }
  };

  const startEdit = (category) => { setEditingId(category.id); setEditingName(category.name); setError(""); };
  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingName.trim()) return;
    try {
      await renameCategory(kind, editingId, editingName.trim());
      setEditingId(null);
    } catch (err) {
      setError(err.message || "No se pudo renombrar la categoría.");
    }
  };

  return (
    <Modal title="Categorías de movimientos" close={close}>
      <div className="mt-5 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button type="button" onClick={() => setKind("income")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${kind === "income" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"}`}>Ingresos</button>
        <button type="button" onClick={() => setKind("expense")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${kind === "expense" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"}`}>Egresos</button>
      </div>
      <form onSubmit={submitAdd} className="mt-4 flex gap-2">
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nueva categoría" className={inputClass} />
        <button type="submit" className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Añadir</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {categories.length ? categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            {editingId === category.id ? (
              <form onSubmit={submitEdit} className="flex flex-1 items-center gap-2">
                <input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} className={`${inputClass} py-1`} />
                <button type="submit" aria-label="Guardar nombre" className="shrink-0 text-lime-700 hover:text-lime-800"><Check size={16} /></button>
                <button type="button" onClick={() => setEditingId(null)} aria-label="Cancelar edición" className="shrink-0 text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
              </form>
            ) : (
              <>
                <span className="text-sm">{category.name}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => startEdit(category)} aria-label={`Editar categoría ${category.name}`} title="Editar categoría" className="p-1 text-zinc-400 hover:text-zinc-600">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => removeCategory(kind, category.id)} aria-label={`Eliminar categoría ${category.name}`} title="Eliminar categoría" className="p-1 text-zinc-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        )) : <p className="py-6 text-center text-sm text-zinc-400">Todavía no tenés categorías de {kind === "income" ? "ingresos" : "egresos"}.</p>}
      </div>
    </Modal>
  );
}
