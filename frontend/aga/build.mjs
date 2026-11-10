// Arma public/aga/index.html concatenando las partes del sandbox de Álgebra (orden importa: p4_ui arranca la app).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(join(dir, name), "utf8");
const parts = ["p2_engine.js", "p2b_matrix.js", "p3_data.js", "p5_unit2.js", "p4b_mat.js", "p4_ui.js"];
// Dayflow guarda el tema en localStorage ("dayflow_theme"); el sandbox lo respeta (si no hay valor, sigue al sistema).
const theme = `try{var t=localStorage.getItem('dayflow_theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;
const html = `${read("p1_head.html")}<script>${theme}</script>\n<script>\n${parts.map(read).join("\n")}\n</script>\n`;
const out = join(dir, "..", "public", "aga", "index.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`public/aga/index.html (${html.length} bytes)`);
