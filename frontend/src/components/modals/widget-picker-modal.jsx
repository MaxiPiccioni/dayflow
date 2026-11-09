"use client";

import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function WidgetPickerModal({ available, addWidget, close }) {
  return (
    <Modal title="Añadir widgets a Resumen" close={close}>
      <div className="mt-5 space-y-1">
        {available.length ? available.map((widget) => (
          <div key={widget.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <span className="text-sm">{widget.label}</span>
            <button type="button" onClick={() => addWidget(widget.id)} aria-label={`Añadir widget ${widget.label}`} className="grid h-8 w-8 place-items-center rounded-full text-lime-700 hover:bg-lime-100 dark:hover:bg-lime-500/10">
              <Plus size={16} />
            </button>
          </div>
        )) : <p className="py-6 text-center text-sm text-zinc-400">Ya agregaste todos los widgets disponibles.</p>}
      </div>
    </Modal>
  );
}
