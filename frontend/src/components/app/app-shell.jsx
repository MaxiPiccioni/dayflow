"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AppModals } from "@/components/app/app-modals";
import { AppProvider, useApp } from "@/components/app/app-provider";
import { daysUntil, formatFullDate, todayIso } from "@/lib/dates";
import { TABS, activeTabId } from "@/lib/nav";
import { setStoredDark, useDarkTheme } from "@/lib/theme";

function countdownFor(events) {
  const todayStr = todayIso();
  const upcoming = events.filter((event) => event.important && event.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!upcoming) return null;
  const daysLeft = daysUntil(upcoming.date);
  if (daysLeft === 0) return `Hoy es ${upcoming.title}`.toUpperCase();
  if (daysLeft === 1) return `Falta un día para ${upcoming.title}`.toUpperCase();
  return `Faltan ${daysLeft} días para ${upcoming.title}`;
}

const roundButton = "grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

function Header({ activeId }) {
  const { user, logout, agenda, summary } = useApp();
  const dark = useDarkTheme();
  const [wave, setWave] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buen día" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const countdownText = countdownFor(agenda.events);
  const { draggingWidgetId, setDraggingWidgetId, removeWidget, setWidgetPickerOpen } = summary;

  const toggleTheme = () => {
    setWave(true);
    setStoredDark(!dark);
    window.setTimeout(() => setWave(false), 500);
  };

  return (
    <>
      {wave && <div className={`theme-wave ${dark ? "theme-wave-dark" : "theme-wave-light"}`} />}
      <header className="app-header flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{formatFullDate(todayIso())}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{greeting}, {user.full_name.split(" ")[0]} <span className="text-lime-600">✦</span></h1>
          {countdownText && <p className="mt-1 text-sm font-semibold text-lime-600">{countdownText}</p>}
        </div>
        <div className="flex items-center gap-2">
          {activeId === "resumen" && (draggingWidgetId ? (
            <button
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); removeWidget(draggingWidgetId); setDraggingWidgetId(null); }}
              aria-label="Soltar aquí para quitar el widget"
              title="Soltar aquí para quitar"
              className="grid h-10 w-10 place-items-center rounded-full border border-red-200 bg-red-50 text-red-500 shadow-sm dark:border-red-900/50 dark:bg-red-500/10"
            >
              <Trash2 size={17} />
            </button>
          ) : (
            <button onClick={() => setWidgetPickerOpen(true)} aria-label="Añadir widgets a Resumen" title="Añadir widgets" className={roundButton}>
              <Plus size={17} />
            </button>
          ))}
          <button onClick={toggleTheme} aria-label="Cambiar tema" className={roundButton}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión" className={roundButton}><LogOut size={17} /></button>
        </div>
      </header>
    </>
  );
}

function Sidebar({ activeId }) {
  return (
    <aside className="app-sidebar hidden w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-[#fbfcf7] p-7 dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Dayflow" width={40} height={40} className="h-10 w-10 rounded-xl" />
        <span className="text-xl font-semibold">dayflow</span>
      </div>
      <nav aria-label="Secciones" className="mt-16 space-y-2 text-sm font-medium">
        {TABS.map(({ id, href, label, Icon }) => (
          <Link
            key={id}
            href={href}
            aria-current={activeId === id ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeId === id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function MobileTabs({ activeId }) {
  return (
    <nav aria-label="Secciones" className="mt-8 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {TABS.map(({ id, href, label, Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={activeId === id ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${activeId === id ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 dark:bg-zinc-900"}`}
        >
          <Icon size={14} />{label}
        </Link>
      ))}
    </nav>
  );
}

function Frame({ children }) {
  const pathname = usePathname();
  const activeId = activeTabId(pathname);
  return (
    <main>
      <div className="min-h-screen bg-[#f4f5ef] text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto flex min-h-screen max-w-[1500px]">
          <Sidebar activeId={activeId} />
          <section className="w-full px-5 py-7 sm:px-8 lg:px-12">
            <Header activeId={activeId} />
            <MobileTabs activeId={activeId} />
            <div key={activeId ?? "otra"} className="tab-panel mt-7">{children}</div>
          </section>
        </div>
      </div>
      <AppModals />
    </main>
  );
}

// Layout de la app: sesión, estado compartido, barra lateral y encabezado. Cada ruta pone solo su contenido.
export function AppShell({ children }) {
  return (
    <AuthGate>
      {(user, logout) => (
        <AppProvider user={user} logout={logout}>
          <Frame>{children}</Frame>
        </AppProvider>
      )}
    </AuthGate>
  );
}
