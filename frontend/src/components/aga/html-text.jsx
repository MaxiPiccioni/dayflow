// Texto de los ejercicios del apunte. Es contenido propio del repo (src/lib/aga/unit*.js) con etiquetas simples como
// <b>, <sub> y <br>, nunca texto de usuarios, por eso se inserta como HTML.
export function HtmlText({ html, className }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
