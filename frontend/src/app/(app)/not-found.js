import { NotFoundView } from "@/components/app/not-found-view";

export const metadata = { title: "Página no encontrada · Dayflow" };

// 404 dentro de la app: conserva la barra lateral y el encabezado.
export default function NotFound() {
  return <NotFoundView />;
}
