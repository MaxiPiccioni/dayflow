"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Settings2, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CategoryBar } from "@/components/finance/category-bar";
import { SavingsCard } from "@/components/finance/savings-card";
import { SelectField } from "@/components/select-field";
import { formatRowDate, monthLabel, monthSortValue, parseRowDate } from "@/lib/dates";
import { EXPENSE_COLORS, HOLDING_COLORS, METHOD_OPTIONS } from "@/lib/finance-options";

const ROW_SORTERS = {
  date: (row) => parseRowDate(row.date),
  type: (row) => row.type,
  amount: (row) => row.amount,
  description: (row) => row.description.toLowerCase(),
  category: (row) => (row.category || "").toLowerCase(),
};

const PAGE_SIZE = 20;

function SortableHead({ label, columnKey, sortKey, sortDir, onSort }) {
  const active = sortKey === columnKey;
  return (
    <TableHead>
      <button type="button" onClick={() => onSort(columnKey)} className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200">
        {label}
        {active ? sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
      </button>
    </TableHead>
  );
}

// Pestaña Finanzas: balance del mes, gráficos, ahorros y tabla de movimientos (en el Resumen, versión compacta).
export function FinanceArchive({ transactions, savings, openFinance, openSaving, openSavingMovements, onDelete, openFinanceCategoryManager, compact = false }) {
  const rows = transactions.map((tx) => ({ id: tx.id, date: formatRowDate(tx.createdAt), month: monthLabel(tx.createdAt), sortValue: monthSortValue(tx.createdAt), type: tx.kind === "income" ? "Ingreso" : "Egreso", amount: tx.amount, description: tx.description, category: tx.category }));
  const nowIso = new Date().toISOString();
  const monthOptions = new Map([[monthLabel(nowIso), monthSortValue(nowIso)]]);
  rows.forEach((row) => { if (!monthOptions.has(row.month)) monthOptions.set(row.month, row.sortValue); });
  const months = [...monthOptions.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label);
  const [month, setMonth] = useState(monthLabel(nowIso));
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const monthRows = rows.filter((row) => row.month === month);
  const balance = monthRows.reduce((sum, row) => sum + (row.type === "Ingreso" ? row.amount : -row.amount), 0);
  const expenseTotals = {};
  monthRows.forEach((row) => {
    if (row.type === "Egreso") {
      const label = row.category || "Sin categoría";
      expenseTotals[label] = (expenseTotals[label] || 0) + row.amount;
    }
  });
  const sortedExpenses = Object.entries(expenseTotals).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  const topExpenses = sortedExpenses.slice(0, 3).map((item, index) => ({ ...item, color: EXPENSE_COLORS[index] }));
  const otherExpenses = sortedExpenses.slice(3).reduce((sum, item) => sum + item.amount, 0);
  const expenseData = otherExpenses > 0 ? [...topExpenses, { category: "Otros", amount: otherExpenses, color: "#a1a1aa" }] : topExpenses;
  const holdingsData = METHOD_OPTIONS.map((option) => ({
    category: option.label,
    amount: Math.max(0, transactions.filter((tx) => tx.method === option.value).reduce((sum, tx) => sum + (tx.kind === "income" ? tx.amount : -tx.amount), 0)),
    color: HOLDING_COLORS[option.value],
  })).filter((item) => item.amount > 0);
  const changeMonth = (value) => { setMonth(value); setPage(1); };
  const updateSearch = (value) => { setSearch(value); setPage(1); };
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };
  const searchTerm = search.trim().toLowerCase();
  const filteredRows = monthRows.filter((row) => [row.date, row.type, row.amount.toLocaleString("es-AR"), row.description, row.category || ""].join(" ").toLowerCase().includes(searchTerm));
  const sortedRows = [...filteredRows].sort((a, b) => {
    const valueA = ROW_SORTERS[sortKey](a);
    const valueB = ROW_SORTERS[sortKey](b);
    const compare = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    return sortDir === "asc" ? compare : -compare;
  });
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const sortProps = { sortKey, sortDir, onSort: toggleSort };
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Balance mensual"
          action={(
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SelectField label="" value={month} onChange={changeMonth} options={months} />
              <button onClick={openFinance} className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white"><Plus size={14} /> Movimiento</button>
              <button type="button" onClick={openFinanceCategoryManager} aria-label="Gestionar categorías de movimientos" title="Gestionar categorías de movimientos" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"><Settings2 size={15} /></button>
            </div>
          )}
        />
        <p className="text-4xl font-semibold">$ {balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
      </Card>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader eyebrow="Distribución" title="Gastos por categoría" />
          {expenseData.length ? <CategoryBar key={month} data={expenseData} /> : <p className="py-8 text-center text-sm text-zinc-400">No hay egresos registrados este mes.</p>}
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader eyebrow="Patrimonio" title="Dinero en posesión" />
          {holdingsData.length ? <CategoryBar key={`holdings-${transactions.length}`} data={holdingsData} /> : <p className="py-8 text-center text-sm text-zinc-400">Todavía no hay datos de dinero en posesión.</p>}
        </Card>
      </div>
      {!compact && <SavingsCard savings={savings} openSaving={openSaving} openMovements={openSavingMovements} />}
      {!compact && (
        <Card>
          <CardHeader eyebrow="Detalle" title="Movimientos del mes" action={<Input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Buscar movimiento..." className="w-48" />} />
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Fecha" columnKey="date" {...sortProps} />
                <SortableHead label="Tipo" columnKey="type" {...sortProps} />
                <SortableHead label="Monto" columnKey="amount" {...sortProps} />
                <SortableHead label="Descripción" columnKey="description" {...sortProps} />
                <SortableHead label="Categoría" columnKey="category" {...sortProps} />
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length ? pageRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-zinc-500">{row.date}</TableCell>
                  <TableCell className={row.type === "Ingreso" ? "text-lime-600" : "text-red-500"}>{row.type}</TableCell>
                  <TableCell className="font-medium">$ {row.amount.toLocaleString("es-AR")}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell className="text-zinc-500">{row.category || "Sin categoría"}</TableCell>
                  <TableCell><button type="button" onClick={() => onDelete(row.id)} aria-label="Eliminar movimiento" className="text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-zinc-400">No se encontraron movimientos.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">{sortedRows.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sortedRows.length)} de ${sortedRows.length}` : "0 resultados"}</span>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
