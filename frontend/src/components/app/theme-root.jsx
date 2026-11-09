"use client";

import { useEffect } from "react";
import { useDarkTheme } from "@/lib/theme";

// Aplica el tema claro/oscuro guardado a toda la app (inicio de sesión, rutas y páginas de error).
export function ThemeRoot({ children }) {
  const dark = useDarkTheme();
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return <div className={dark ? "dark" : ""}>{children}</div>;
}
