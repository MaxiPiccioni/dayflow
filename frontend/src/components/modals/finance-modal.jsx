"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SelectField } from "@/components/select-field";
import { METHOD_OPTIONS } from "@/lib/finance-options";
import { inputClass } from "@/lib/faculty";

export function FinanceModal({ incomeCategories, expenseCategories, save, close }) {
  const [form, setForm] = useState({ description: "", amount: "", kind: "expense", category: expenseCategories[0]?.name || "", method: "Efectivo" });
  const update = (key, value) => {
    if (key === "kind") {
      const list = value === "income" ? incomeCategories : expenseCategories;
      setForm({ ...form, kind: value, category: list[0]?.name || "" });
    } else {
      setForm({ ...form, [key]: value });
    }
  };
  const submit = (event) => {
    event.preventDefault();
    if (Number(form.amount) > 0 && form.description.trim()) {
      save({ ...form, amount: Number(form.amount), description: form.description.trim(), id: Date.now() });
    }
  };
  const categoryOptions = (form.kind === "income" ? incomeCategories : expenseCategories).map((category) => ({ value: category.name, label: category.name }));
  return (
    <Modal title="Nuevo movimiento" close={close}>
      <form onSubmit={submit}>
        <div className="mt-5 space-y-3">
          <input autoFocus value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Descripción" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">Monto<input type="number" min="0" value={form.amount} onChange={(event) => update("amount", event.target.value)} className={`${inputClass} mt-1`} /></label>
            <SelectField label="Tipo" value={form.kind} onChange={(value) => update("kind", value)} options={[{ value: "expense", label: "Egreso" }, { value: "income", label: "Ingreso" }]} />
            <SelectField label="Categoría" value={form.category} onChange={(value) => update("category", value)} options={categoryOptions} />
            <SelectField label="Método" value={form.method} onChange={(value) => update("method", value)} options={METHOD_OPTIONS} />
          </div>
        </div>
        <button type="submit" className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white">Guardar movimiento</button>
      </form>
    </Modal>
  );
}
