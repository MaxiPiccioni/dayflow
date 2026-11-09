import { AppShell } from "@/components/app/app-shell";

// Todas las pantallas de la app comparten sesión, estado, barra lateral y encabezado.
export default function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
