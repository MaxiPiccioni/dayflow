import Link from "next/link";
import { Compass } from "lucide-react";

// Contenido de la página 404: dentro de la app (con barra lateral) o suelto, según dónde se use.
export function NotFoundView() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Compass size={40} className="text-zinc-300 dark:text-zinc-600" aria-hidden="true" />
      <h2 className="text-2xl font-semibold">Esta página no existe</h2>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">El enlace está mal escrito o la materia ya no está.</p>
      <Link href="/" className="mt-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-lime-400 dark:text-zinc-950">Volver al Resumen</Link>
    </div>
  );
}
