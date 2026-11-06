import { useState } from "react";

// Confirmación para borrados. onConfirm devuelve una promesa: si falla, el error queda en el diálogo.
export function ConfirmDialog({ title, message, confirmLabel = "Eliminar", onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirm = () => {
    setBusy(true);
    setError("");
    onConfirm().catch((err) => {
      setError(err.message);
      setBusy(false);
    });
  };
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal-panel scrollbar-thin" role="dialog" aria-modal="true" aria-labelledby="faculty-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="faculty-confirm-title" className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">Cancelar</button>
          <button type="button" onClick={confirm} disabled={busy} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Eliminando…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
