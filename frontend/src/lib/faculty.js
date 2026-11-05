import {
  Atom,
  Binary,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  ChartLine,
  Code,
  Cog,
  Cpu,
  Database,
  Dna,
  FlaskConical,
  Gavel,
  Globe,
  Landmark,
  Languages,
  Lightbulb,
  Microscope,
  Network,
  Palette,
  Scale,
  Server,
  Sigma,
  Stethoscope,
} from "lucide-react";

// Estilo de los campos de texto de Facultad (mismo que el resto de la app).
export const inputClass = "w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-lime-500 dark:border-zinc-700 dark:placeholder:text-zinc-500";

// Estados de una materia. Solo "aprobada" y "aprobacion_directa" cuentan como aprobadas y admiten
// nota final: las promociones son parciales. Debe coincidir con GRADED_SUBJECT_STATUSES del backend.
export const STATUS = {
  por_cursar: { label: "Por cursar", tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", approved: false, allowsGrade: false },
  cursando: { label: "Cursando", tone: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300", approved: false, allowsGrade: false },
  regular: { label: "Regular", tone: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300", approved: false, allowsGrade: false },
  promocion_practica: { label: "Promoción práctica", tone: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300", approved: false, allowsGrade: false },
  promocion_teorica: { label: "Promoción teórica", tone: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300", approved: false, allowsGrade: false },
  aprobacion_directa: { label: "Aprobación directa", tone: "bg-lime-100 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300", approved: true, allowsGrade: true },
  aprobada: { label: "Aprobada (final)", tone: "bg-lime-300 text-lime-950 dark:bg-lime-400/30 dark:text-lime-200", approved: true, allowsGrade: true },
  libre: { label: "Libre", tone: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300", approved: false, allowsGrade: false },
};
export const STATUS_KEYS = Object.keys(STATUS);
export const DEFAULT_STATUS = "por_cursar";

export const statusInfo = (key) => STATUS[key] ?? STATUS[DEFAULT_STATUS];
export const allowsGrade = (key) => statusInfo(key).allowsGrade;

// Íconos para materias: el backend guarda la clave y acá se traduce. Si la clave no existe, BookOpen.
export const SUBJECT_ICONS = {
  book: BookOpen,
  calculator: Calculator,
  sigma: Sigma,
  code: Code,
  binary: Binary,
  database: Database,
  server: Server,
  network: Network,
  cpu: Cpu,
  chemistry: FlaskConical,
  physics: Atom,
  biology: Dna,
  microscope: Microscope,
  brain: Brain,
  law: Scale,
  gavel: Gavel,
  globe: Globe,
  languages: Languages,
  chart: ChartLine,
  economy: Landmark,
  business: Briefcase,
  building: Building2,
  engineering: Cog,
  design: Palette,
  idea: Lightbulb,
  health: Stethoscope,
};
export const DEFAULT_ICON = "book";
export const iconFor = (key) => SUBJECT_ICONS[key] ?? BookOpen;

// Misma paleta que los eventos de la agenda (modal de evento en app/page.js), con una clave por color.
export const SUBJECT_COLORS = {
  lime: { hex: "#d9f99d", label: "Lima" },
  blue: { hex: "#bfdbfe", label: "Azul" },
  pink: { hex: "#fbcfe8", label: "Rosa" },
  amber: { hex: "#fde68a", label: "Amarillo" },
  lavender: { hex: "#ddd6fe", label: "Lavanda" },
};
export const DEFAULT_COLOR = "lime";
export const colorFor = (key) => (SUBJECT_COLORS[key] ?? SUBJECT_COLORS[DEFAULT_COLOR]).hex;

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
export const levelLabel = (level) => `${level}° año`;

export const formatGrade = (grade) => Number(grade).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Mismo orden que devuelve el backend: nivel, posición y id.
export const sortSubjects = (subjects) => [...subjects].sort((a, b) => a.level - b.level || a.position - b.position || a.id - b.id);

// Créditos de electivas que pide el plan para recibirse.
export const REQUIRED_ELECTIVE_CREDITS = 20;

// La disponibilidad para cursar solo se muestra en materias que todavía no se cursan.
export const showsAvailability = (status) => status === "por_cursar" || status === "libre";

export const MODALITIES = {
  A: "Anual",
  "1C": "1° cuatrimestre",
  "2C": "2° cuatrimestre",
  "1C-2C": "1C y 2C",
  "2C-1C": "2C y 1C",
};
export const MODALITY_KEYS = Object.keys(MODALITIES);

export const KIND_FILTERS = [
  ["all", "Todas"],
  ["curricular", "Curriculares"],
  ["elective", "Electivas"],
];
export const matchesKind = (subject, kind) => kind === "all" || (kind === "elective" ? subject.elective : !subject.elective);

export const REQUIREMENT_LABEL = { aprobada: "aprobada", cursada: "cursada" };

// "19 · Física II" si tiene código; si no, solo el nombre.
export const subjectLabel = (subject) => (subject.code ? `${subject.code} · ${subject.name}` : subject.name);

// Datos del plan en una línea: código, modalidad, horas y si es electiva.
export function planSummary(subject) {
  const parts = [];
  if (subject.code) parts.push(`Código ${subject.code}`);
  if (subject.modality) parts.push(MODALITIES[subject.modality] ?? subject.modality);
  if (subject.weekly_hours) parts.push(`${subject.weekly_hours} h semanales`);
  parts.push(subject.elective ? `Electiva · ${subject.credits} cr` : "Curricular");
  return parts.join(" · ");
}

// Links http/https de un texto libre, sin repetir. Se sacan los signos de puntuación del final.
export function findLinks(text) {
  const found = (text.match(/https?:\/\/[^\s<>"']+/g) ?? []).map((link) => link.replace(/[.,;:!?)\]]+$/, ""));
  return [...new Set(found)];
}

export function summarize(subjects) {
  const byStatus = {};
  subjects.forEach((subject) => { byStatus[subject.status] = (byStatus[subject.status] ?? 0) + 1; });
  const approved = subjects.filter((subject) => statusInfo(subject.status).approved);
  const curricular = subjects.filter((subject) => !subject.elective);
  const grades = approved.map((subject) => subject.grade).filter((grade) => grade !== null && grade !== undefined);
  return {
    // Las electivas no cuentan en "materias aprobadas": suman créditos aparte.
    curricularApproved: curricular.filter((subject) => statusInfo(subject.status).approved).length,
    curricularTotal: curricular.length,
    electiveCredits: approved.filter((subject) => subject.elective).reduce((sum, subject) => sum + (subject.credits ?? 0), 0),
    // Promedio de las notas finales de todas las aprobadas (curriculares y electivas).
    average: grades.length ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : null,
    gradedCount: grades.length,
    availableCount: subjects.filter((subject) => showsAvailability(subject.status) && subject.available).length,
    // Conteo por estado, en el orden de STATUS y solo con los que tienen al menos una materia.
    byStatus: STATUS_KEYS.filter((key) => byStatus[key]).map((key) => ({ key, count: byStatus[key] })),
  };
}
