"use client";

import { useState } from "react";
import { MachineCanvas } from "@/components/ssl/editor/machine-canvas";
import { LinkPicker } from "@/components/ssl/frame/link-picker";
import { StatePicker } from "@/components/ssl/frame/state-picker";
import { useSession } from "@/components/ssl/frame/session-context";
import { analyze } from "@/lib/ssl/machines/model";

// Lienzo del autómata: ocupa todo el espacio libre; arriba, avisos cortos del modo de edición.
export function SessionCanvas() {
  const s = useSession();
  const { machine, editor } = s;
  const [tapped, setTapped] = useState(null);
  const { warnings, errors } = analyze(machine);
  const hint = !s.readOnly && editor.mode === "link"
    ? (editor.linkFrom ? `Origen: ${editor.linkFrom}. Tocá el estado de destino (el mismo estado hace un bucle).` : "Unir: tocá el estado de origen y después el de destino; en el cuadro que aparece elegís el símbolo.")
    : !s.readOnly && editor.mode === "state" ? "Hacé clic en un lugar vacío del lienzo para agregar un estado." : "";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-1.5 p-2 md:p-3">
      <div className="space-y-1 text-xs" aria-live="polite">
        {hint && <p className="text-zinc-500" role="status">{hint}</p>}
        {s.notice && <p role="alert" className="text-red-600">{s.notice}</p>}
        {errors.map((e) => <p key={e} className="text-red-600">{e}</p>)}
        {warnings.slice(0, 2).map((w) => <p key={w} className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{w}</p>)}
      </div>
      <div className="min-h-[260px] flex-1">
        <MachineCanvas
          fill
          machine={machine}
          mode={editor.mode}
          selection={editor.selection}
          highlight={s.highlight}
          readOnly={s.readOnly}
          onLiveChange={editor.liveMove}
          onCommitDrag={editor.commitDrag}
          onChange={editor.change}
          onSelect={editor.select}
          onDelete={s.doDelete}
          onRequestTransition={(from, to) => s.setPending({ from, to })}
          linkFrom={editor.linkFrom}
          onLinkFrom={editor.setLinkFrom}
          onStateTap={(id) => { if (!s.pending) setTapped(id); }}
          onStateDoubleTap={(id) => { setTapped(null); s.setPending({ from: id, to: id }); }}
        />
      </div>
      {tapped && !s.pending && !s.readOnly && editor.mode === "select" && machine.states.some((x) => x.id === tapped) && (
        <StatePicker
          key={tapped}
          machine={machine}
          id={tapped}
          onApply={(result) => { const message = editor.apply(result); if (message) s.setNotice(message); }}
          onLoop={() => { setTapped(null); s.setPending({ from: tapped, to: tapped }); }}
          onClose={() => setTapped(null)}
        />
      )}
      {s.pending && !s.readOnly && (
        <LinkPicker
          key={`${s.pending.from}>${s.pending.to}`}
          machine={machine}
          from={s.pending.from}
          to={s.pending.to}
          onApply={(result) => { const message = editor.apply(result); if (!message) s.setPending(null); return message; }}
          onCancel={() => s.setPending(null)}
        />
      )}
    </div>
  );
}
