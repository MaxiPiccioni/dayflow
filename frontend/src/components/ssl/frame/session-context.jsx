"use client";

import { createContext, useContext } from "react";
import { useMachineSession } from "@/components/ssl/frame/use-machine-session";

const SessionContext = createContext(null);

// Reparte la sesión de un autómata entre la barra lateral, el lienzo, la barra del ejercicio y el panel derecho.
export function SessionProvider({ config, exerciseKey, savedJson, onSaveWorking, children }) {
  const session = useMachineSession({ config, exerciseKey, savedJson, onSaveWorking });
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

// null cuando el ejercicio no tiene autómata (por ejemplo, solo una herramienta o respuestas escritas).
export const useSession = () => useContext(SessionContext);
