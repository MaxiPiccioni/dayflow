const authors = ["Aristóteles", "Marie Curie", "Nikola Tesla", "Maya Angelou", "Peter Drucker", "Ada Lovelace", "Carl Sagan", "James Clear", "Eleanor Roosevelt", "Katherine Johnson"];
const seeds = ["La constancia convierte una intención pequeña en una vida distinta.", "Cada bloque de atención es una inversión en tu futuro.", "El progreso no necesita ruido para estar ocurriendo.", "Una decisión clara hoy libera energía para mañana.", "La práctica paciente hace visible lo que antes parecía imposible."];

export const quotes = Array.from({ length: 500 }, (_, index) => ({ text: seeds[index % seeds.length], author: authors[index % authors.length] }));
