"use client";

import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function SavingsCard({ savings, openSaving, openMovements }) {
  return (
    <Card>
      <CardHeader eyebrow="Patrimonio" title="Ahorros" action={<button onClick={() => openSaving(null)} className="flex items-center gap-1 text-sm font-semibold text-lime-700"><Plus size={16} /> Ahorro</button>} />
      <Table>
        <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Inicio de mes</TableHead><TableHead>Monto actual</TableHead><TableHead>Ganancia</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {savings.length ? savings.map((saving) => (
            <TableRow key={saving.id} onDoubleClick={() => openSaving(saving)} className="cursor-pointer">
              <TableCell className="font-medium">{saving.name}</TableCell>
              <TableCell>$ {saving.start.toLocaleString("es-AR")}</TableCell>
              <TableCell>$ {saving.current.toLocaleString("es-AR")}</TableCell>
              <TableCell className={saving.gain >= 0 ? "text-lime-600" : "text-red-500"}>{saving.gain >= 0 ? "+" : "−"}$ {Math.abs(saving.gain).toLocaleString("es-AR")}</TableCell>
              <TableCell><button type="button" onClick={(event) => { event.stopPropagation(); openMovements(saving); }} className="flex items-center gap-1 text-xs font-semibold text-lime-700"><Plus size={14} /> Movimiento</button></TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-zinc-400">No agregaste ahorros todavía.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  );
}
