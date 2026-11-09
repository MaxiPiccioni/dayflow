"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/lib/faculty";

export function CategoryManagerModal({ title = "Categorías", categories, addCategory, removeCategory, close }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await addCategory(name.trim());
      setName("");
    } catch (err) {
      setError(err.message || "No se pudo crear la categoría.");
    }
  };
  return (
    <Modal title={title} close={close}>
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nueva categoría" className={inputClass} />
        <button type="submit" className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Añadir</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {categories.length ? categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <span className="text-sm">{category.name}</span>
            <button type="button" onClick={() => removeCategory(category.id)} aria-label={`Eliminar categoría ${category.name}`} title="Eliminar categoría" className="text-zinc-400 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        )) : <p className="py-6 text-center text-sm text-zinc-400">Todavía no tenés categorías.</p>}
      </div>
    </Modal>
  );
}
