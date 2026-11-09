import { NotFoundView } from "@/components/app/not-found-view";

export const metadata = { title: "Página no encontrada · Dayflow" };

// 404 fuera de la app (por ejemplo, antes de iniciar sesión).
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f5ef] px-5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <NotFoundView />
    </div>
  );
}
