// Notación de la cátedra: λ para la cadena vacía, Σ para alfabetos, ":=" en producciones, "/" como "tal que".
// En los datos, un exponente se escribe ^{...} y se muestra como superíndice (ver splitMath).
export const LAMBDA = "λ";

// Teclado de símbolos: [símbolo a insertar, descripción accesible].
export const SYMBOL_KEYS = [
  ["λ", "lambda (cadena vacía)"],
  ["Σ", "sigma"],
  ["α", "alfa"],
  ["β", "beta"],
  ["γ", "gamma"],
  ["δ", "delta"],
  ["∪", "unión"],
  ["∩", "intersección"],
  ["⁻¹", "reflejo"],
  ["ⁿ", "exponente n"],
  ["ᵐ", "exponente m"],
  ["²", "al cuadrado"],
  ["³", "al cubo"],
  ["*", "clausura (estrella)"],
  ["⁺", "clausura positiva"],
  ["→", "deriva en un paso"],
  [":=", "produce"],
  ["^", "y (conjunción) o exponente"],
  ["≥", "mayor o igual"],
  ["≤", "menor o igual"],
  ["≠", "distinto"],
  ["∈", "pertenece"],
];

const SUPER = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", n: "ⁿ", m: "ᵐ", i: "ⁱ", j: "ʲ", k: "ᵏ", r: "ʳ", a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", s: "ˢ", t: "ᵗ", x: "ˣ", y: "ʸ", z: "ᶻ" };
const UNSUPER = Object.fromEntries(Object.entries(SUPER).map(([plain, sup]) => [sup, plain]));
const SUPER_RUN = new RegExp(`[${Object.values(SUPER).join("")}]+`, "g");

// "aⁿ¹" -> "a^(n1)": pasa los superíndices Unicode a la forma con ^ que entienden los parsers.
export function unsuper(text) {
  return text.replace(SUPER_RUN, (run) => {
    const plain = Array.from(run).map((ch) => UNSUPER[ch]).join("");
    return /^-?[0-9a-z]$/.test(plain) ? `^${plain}` : `^(${plain})`;
  });
}

// Tolera cómo se suele escribir en teclado: lambda, >=, <=, ->, etc.
export function normalizeInput(text) {
  return String(text)
    .replace(/\b(lambda|Lambda|LAMBDA)\b/g, LAMBDA)
    .replace(/[εΛ]/g, LAMBDA)
    .replace(/>=/g, "≥")
    .replace(/<=/g, "≤")
    .replace(/!=|<>/g, "≠")
    .replace(/->|=>/g, "→");
}

// Parte un texto con exponentes ^{...} en segmentos { text, sup } para mostrarlos como superíndices reales.
export function splitMath(text) {
  const out = [];
  const re = /\^\{([^}]*)\}/g;
  let last = 0;
  let match;
  while ((match = re.exec(text))) {
    if (match.index > last) out.push({ text: text.slice(last, match.index), sup: false });
    out.push({ text: match[1], sup: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last), sup: false });
  return out;
}

// Versión en texto plano (para etiquetas accesibles y comparaciones): ^{n} -> ⁿ cuando existe el superíndice.
export function plainMath(text) {
  return text.replace(/\^\{([^}]*)\}/g, (_, inner) => Array.from(inner).map((ch) => SUPER[ch] ?? ch).join(""));
}

// Cadena vacía <-> "λ". Una palabra se guarda como string normal; la vacía es "".
export const fmtWord = (word) => (word === "" ? LAMBDA : word);
export const parseWord = (text) => {
  const trimmed = normalizeInput(text).trim();
  return trimmed === LAMBDA ? "" : trimmed;
};
export const symbolsOf = (text) => Array.from(text);

// "a, b, aa" / "{a b}" -> ["a","b","aa"] (λ se convierte en ""). Separa por coma, punto y coma o espacios.
export function parseWordList(text) {
  const cleaned = normalizeInput(text).replace(/[{}]/g, " ").replace(/[….]{2,}/g, " ");
  return cleaned.split(/[\s,;]+/).filter(Boolean).map((token) => (token === LAMBDA ? "" : token));
}
