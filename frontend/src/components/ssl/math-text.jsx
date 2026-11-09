import { splitMath } from "@/lib/ssl/notation";

// Muestra texto con exponentes ^{...} como superíndices reales. Respeta los saltos de línea.
export function MathText({ text, className = "" }) {
  return (
    <span className={`whitespace-pre-line break-words ${className}`}>
      {splitMath(text).map((segment, index) => (segment.sup ? <sup key={index} className="text-[0.75em] leading-none">{segment.text}</sup> : <span key={index}>{segment.text}</span>))}
    </span>
  );
}
