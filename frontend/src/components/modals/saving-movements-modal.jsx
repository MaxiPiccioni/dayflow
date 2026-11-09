"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { SelectField } from "@/components/select-field";
import { formatRowDate } from "@/lib/dates";
import { inputClass } from "@/lib/faculty";

const KIND_OPTIONS = [{ value: "deposit", label: "Depósito" }, { value: "withdraw", label: "Retiro" }, { value: "total", label: "Total a fin de mes" }];

export function SavingMovementsModal({ saving, movements, addMovement, removeMovement, close }) {
  const [kind, setKind] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const isTotal = kind === "total";
  const submit = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (amount === "" || Number.isNaN(value)) return;
    let delta = value;
    if (isTotal) delta = value - saving.current;
    else if (kind === "withdraw") delta = -value;
    if (!delta) return;
    setError("");
    try {
      await addMovement(delta);
      setAmount("");
    } catch (err) {
      setError(err.message || "No se pudo registrar el movimiento.");
    }
  };
  return (
    <Modal title={`Movimientos · ${saving.name}`} close={close}>
      <div className="mt-2 grid grid-cols-2 gap-3 text-center">
        <div><p className="text-xs text-zinc-500">Inicio de mes</p><p className="mt-1 text-xl font-semibold">$ {saving.start.toLocaleString("es-AR")}</p></div>
        <div><p className="text-xs text-zinc-500">Monto actual</p><p className="mt-1 text-xl font-semibold">$ {saving.current.toLocaleString("es-AR")}</p></div>
      </div>
      <form onSubmit={submit} className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2">
        <SelectField label="" value={kind} onChange={setKind} options={KIND_OPTIONS} />
        <input type="number" min={isTotal ? undefined : "0"} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={isTotal ? "Monto total" : "Monto"} className={`${inputClass} self-end`} />
        <button type="submit" aria-label="Registrar movimiento" className="self-end rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /></button>
      </form>
      {isTotal && <p className="mt-2 text-xs text-zinc-500">Se registrará la diferencia con el monto actual como un movimiento (por ejemplo, el interés generado este mes).</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {movements.length ? movements.map((movement) => (
          <div key={movement.id} className="flex items-center justify-between border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800">
            <span className="text-zinc-500">{formatRowDate(movement.date)}</span>
            <div className="flex items-center gap-3">
              <strong className={movement.amount >= 0 ? "text-lime-600" : "text-red-500"}>{movement.amount >= 0 ? "+" : "−"}$ {Math.abs(movement.amount).toLocaleString("es-AR")}</strong>
              <button type="button" onClick={() => removeMovement(movement.id)} aria-label="Eliminar movimiento" title="Eliminar movimiento" className="text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        )) : <p className="py-4 text-center text-sm text-zinc-400">Todavía no hay movimientos este mes.</p>}
      </div>
    </Modal>
  );
}
