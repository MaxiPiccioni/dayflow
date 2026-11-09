import { CalendarDays, Clock3, Flame, GraduationCap, LayoutDashboard, ShoppingCart, Timer, Wallet } from "lucide-react";

// Pestañas de la app: cada una tiene su ruta.
export const TABS = [
  { id: "resumen", href: "/", label: "Resumen", Icon: LayoutDashboard },
  { id: "calendario", href: "/calendario", label: "Calendario", Icon: CalendarDays },
  { id: "pomodoro", href: "/pomodoro", label: "Pomodoro", Icon: Timer },
  { id: "habitos", href: "/habitos", label: "Hábitos", Icon: Flame },
  { id: "horas", href: "/horas", label: "Horas", Icon: Clock3 },
  { id: "finanzas", href: "/finanzas", label: "Finanzas", Icon: Wallet },
  { id: "compras", href: "/compras", label: "Compras", Icon: ShoppingCart },
  { id: "facultad", href: "/facultad", label: "Facultad", Icon: GraduationCap },
];

// Pestaña activa según la ruta (Facultad incluye el detalle de una materia y su sandbox). Una ruta desconocida no marca ninguna.
export function activeTabId(pathname) {
  if (pathname === "/") return "resumen";
  const first = pathname.split("/")[1];
  return TABS.some((tab) => tab.id === first) ? first : null;
}
