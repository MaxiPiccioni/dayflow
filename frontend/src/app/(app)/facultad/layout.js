import { FacultyFrame } from "@/components/faculty/faculty-frame";
import { FacultyProvider } from "@/components/faculty/faculty-provider";

export const metadata = { title: "Facultad · Dayflow" };

// Facultad, el detalle de una materia y su sandbox comparten las materias cargadas.
export default function FacultyLayout({ children }) {
  return (
    <FacultyProvider>
      <FacultyFrame>{children}</FacultyFrame>
    </FacultyProvider>
  );
}
