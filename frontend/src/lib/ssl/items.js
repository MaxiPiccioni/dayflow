// Los "puntos" por los que se navega en el sandbox de una unidad: el ejemplo resuelto de cada sección y sus ejercicios,
// en el orden de la guía. Anterior, Siguiente y el índice recorren esta lista.
export function buildItems(unit) {
  const items = [];
  for (const section of unit.sections) {
    items.push({ kind: "example", key: `${section.id}.example`, section, example: section.example });
    for (const exercise of section.exercises) items.push({ kind: "exercise", key: exercise.id, section, exercise });
  }
  return items;
}

export const itemLabel = (item) => (item.kind === "example" ? `Ejemplo · ${item.section.title}` : `Ejercicio ${item.exercise.number} · ${item.section.title}`);

// Pista de un ejercicio (o de su parte). Los ejemplos no tienen.
export const hintOf = (item, part) => (item.kind === "exercise" ? part?.hint ?? item.exercise.hint ?? "" : "");

// Partes de un punto: los ejemplos tienen una sola (la máquina o la herramienta del ejemplo).
export function partsOf(item) {
  if (item.kind === "exercise") return item.exercise.parts;
  const { example } = item;
  return [{ id: "", prompt: "", machine: example.machine ? { ...example.machine, readOnly: true, spec: null, reference: null } : null, tool: example.tool ?? null }];
}
