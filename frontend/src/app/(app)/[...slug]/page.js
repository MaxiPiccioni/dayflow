import { notFound } from "next/navigation";

// Cualquier URL que no sea una ruta de la app muestra el 404 con el estilo de la app.
export default function Page() {
  notFound();
}
