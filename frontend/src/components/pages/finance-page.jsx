"use client";

import { useApp } from "@/components/app/app-provider";
import { FinanceArchive } from "@/components/finance/finance-archive";

// Ruta "/finanzas".
export function FinancePage() {
  const { finance } = useApp();
  return (
    <FinanceArchive
      transactions={finance.transactions} savings={finance.savings}
      openFinance={() => finance.setFinanceOpen(true)} openSaving={finance.openSaving} openSavingMovements={finance.openSavingMovements}
      onDelete={finance.deleteTransaction} openFinanceCategoryManager={() => finance.setFinanceCategoryModalOpen(true)}
    />
  );
}
