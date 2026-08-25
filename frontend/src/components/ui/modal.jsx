import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function Modal({ title, close, children }) {
  const [closing, setClosing] = useState(false);
  const requestClose = () => { if (closing) return; setClosing(true); window.setTimeout(close, 350); };
  useEffect(() => { const onKeyDown = (event) => { if (event.key === "Escape" && !closing) { setClosing(true); window.setTimeout(close, 350); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [close, closing]);
  return <div className={`modal-overlay ${closing ? "modal-overlay-out" : ""}`} onMouseDown={requestClose}><div className={`modal-panel ${closing ? "modal-panel-out" : ""}`} onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2><button onClick={requestClose} aria-label="Cerrar"><X size={18} /></button></div>{children}</div></div>;
}
