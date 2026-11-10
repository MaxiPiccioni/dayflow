// Detecta la materia "Álgebra y Geometría Analítica" por nombre, sin importar tildes ni mayúsculas.
const normalize = (text) => String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export const isAgaSubject = (subject) => normalize(subject?.name).includes("algebra y geometria analitica");
