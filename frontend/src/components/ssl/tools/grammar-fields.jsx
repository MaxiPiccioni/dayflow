import { SymbolField } from "@/components/ssl/symbol-field";

// Editor de G = (ΣT, ΣN, S, P). ΣT, ΣN y el axioma pueden quedar vacíos: se infieren de las producciones.
export function GrammarFields({ fields, onChange, name = "G" }) {
  const set = (key) => (value) => onChange({ ...fields, [key]: value });
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <SymbolField label={`ΣT de ${name} (terminales)`} value={fields.terminals ?? ""} onChange={set("terminals")} placeholder="se infiere" />
        <SymbolField label={`ΣN de ${name} (no terminales)`} value={fields.nonterminals ?? ""} onChange={set("nonterminals")} placeholder="se infiere" />
        <SymbolField label="Axioma" value={fields.axiom ?? ""} onChange={set("axiom")} placeholder="S" />
      </div>
      <SymbolField
        label={`Producciones de ${name} (una por línea, alternativas con |)`}
        value={fields.productions ?? ""}
        onChange={set("productions")}
        multiline
        rows={5}
        placeholder="S := aA | b"
        hint="Terminales en minúscula o dígitos, no terminales en mayúscula. λ es la cadena vacía."
      />
    </div>
  );
}
