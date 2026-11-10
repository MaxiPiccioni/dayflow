"use client";

import { useRouter } from "next/navigation";
import { SandboxPopup } from "@/components/ssl/frame/sandbox-popup";

// Sandbox de Álgebra y Geometría Analítica: popup a pantalla completa que muestra la app estática de /aga (ver frontend/aga).
export function AgaSandbox({ subjectId }) {
  const router = useRouter();
  return (
    <SandboxPopup title="Sandbox · Álgebra y Geometría Analítica" onClose={() => router.push(`/facultad/${subjectId}`)}>
      <iframe src="/aga/index.html" title="Sandbox de Álgebra y Geometría Analítica" className="min-h-0 w-full flex-1 border-0" />
    </SandboxPopup>
  );
}
