// Detecta la materia "Sintaxis y Semántica de los Lenguajes" por nombre, sin importar tildes ni mayúsculas.
const normalize = (text) => String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export const isSslSubject = (subject) => normalize(subject?.name).includes("sintaxis y semantica de los lenguajes");
