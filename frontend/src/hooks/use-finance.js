"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { fromApiSaving, fromApiSavingMovement, fromApiTransaction, toApiSaving } from "@/lib/mappers";

// Movimientos, ahorros y categorías de finanzas (con sus modales).
export function useFinance() {
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [financeCategoryModalOpen, setFinanceCategoryModalOpen] = useState(false);
  const [savingModal, setSavingModal] = useState(null);
  const [savingMovementsModal, setSavingMovementsModal] = useState(null);
  const [savingMovements, setSavingMovements] = useState([]);

  const applyLoaded = useCallback((dashboardData, incomeData, expenseData) => {
    setTransactions(dashboardData.transactions.map(fromApiTransaction));
    setSavings(dashboardData.savings.map(fromApiSaving));
    setIncomeCategories(incomeData);
    setExpenseCategories(expenseData);
  }, []);

  const addTransaction = (item) => {
    const tempId = Date.now();
    setTransactions([...transactions, { id: tempId, description: item.description, amount: item.amount, kind: item.kind, category: item.category, method: item.method, createdAt: new Date().toISOString() }]);
    setFinanceOpen(false);
    api("/transactions", { method: "POST", body: JSON.stringify({ description: item.description, amount: item.amount, kind: item.kind, category: item.category, method: item.method }) })
      .then((created) => setTransactions((current) => current.map((entry) => (entry.id === tempId ? fromApiTransaction(created) : entry))))
      .catch(() => setTransactions((current) => current.filter((entry) => entry.id !== tempId)));
  };
  const deleteTransaction = (id) => {
    const previous = transactions;
    setTransactions(transactions.filter((item) => item.id !== id));
    api(`/transactions/${id}`, { method: "DELETE" }).catch(() => setTransactions(previous));
  };

  const openSaving = (saving) => setSavingModal(saving || { name: "", start: "" });
  const saveSaving = (saving) => {
    const existing = savings.find((item) => item.id === saving.id);
    setSavings(existing ? savings.map((item) => (item.id === saving.id ? saving : item)) : [...savings, saving]);
    setSavingModal(null);
    if (existing) {
      api(`/savings/${saving.id}`, { method: "PATCH", body: JSON.stringify(toApiSaving(saving)) })
        .then((updated) => setSavings((current) => current.map((item) => (item.id === saving.id ? fromApiSaving(updated) : item))))
        .catch(() => setSavings((current) => current.map((item) => (item.id === saving.id ? existing : item))));
    } else {
      api("/savings", { method: "POST", body: JSON.stringify(toApiSaving(saving)) })
        .then((created) => setSavings((current) => current.map((item) => (item.id === saving.id ? fromApiSaving(created) : item))))
        .catch(() => setSavings((current) => current.filter((item) => item.id !== saving.id)));
    }
  };
  const deleteSaving = (id) => {
    const previous = savings;
    setSavings(savings.filter((item) => item.id !== id));
    setSavingModal(null);
    api(`/savings/${id}`, { method: "DELETE" }).catch(() => setSavings(previous));
  };

  const openSavingMovements = (saving) => {
    setSavingMovementsModal(saving);
    setSavingMovements([]);
    api(`/savings/${saving.id}/movements`).then((data) => setSavingMovements(data.map(fromApiSavingMovement))).catch(() => {});
  };
  const addSavingMovement = (amount) => api(`/savings/${savingMovementsModal.id}/movements`, { method: "POST", body: JSON.stringify({ amount }) }).then((updated) => {
    setSavings((current) => current.map((item) => (item.id === savingMovementsModal.id ? fromApiSaving(updated) : item)));
    setSavingMovementsModal((current) => ({ ...current, current: updated.current_amount, gain: updated.gain }));
    return api(`/savings/${savingMovementsModal.id}/movements`).then((data) => setSavingMovements(data.map(fromApiSavingMovement)));
  });
  const removeSavingMovement = (movementId) => api(`/savings/${savingMovementsModal.id}/movements/${movementId}`, { method: "DELETE" }).then((updated) => {
    setSavings((current) => current.map((item) => (item.id === savingMovementsModal.id ? fromApiSaving(updated) : item)));
    setSavingMovementsModal((current) => ({ ...current, current: updated.current_amount, gain: updated.gain }));
    setSavingMovements((current) => current.filter((item) => item.id !== movementId));
  });

  const financeCategorySetter = (kind) => (kind === "income" ? setIncomeCategories : setExpenseCategories);
  const financeCategoryList = (kind) => (kind === "income" ? incomeCategories : expenseCategories);
  const addFinanceCategory = (kind, name) => api("/categories", { method: "POST", body: JSON.stringify({ name, scope: "finance", kind }) })
    .then((created) => financeCategorySetter(kind)((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name))));
  const renameFinanceCategory = (kind, id, name) => api(`/categories/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }).then((updated) => {
    financeCategorySetter(kind)((current) => current.map((category) => (category.id === id ? updated : category)).sort((a, b) => a.name.localeCompare(b.name)));
    const previousName = financeCategoryList(kind).find((category) => category.id === id)?.name;
    if (previousName) setTransactions((current) => current.map((tx) => (tx.category === previousName && tx.kind === kind ? { ...tx, category: name } : tx)));
  });
  const removeFinanceCategory = (kind, id) => {
    const list = financeCategoryList(kind);
    const setter = financeCategorySetter(kind);
    const removed = list.find((category) => category.id === id);
    setter(list.filter((category) => category.id !== id));
    if (removed) setTransactions((current) => current.map((tx) => (tx.category === removed.name && tx.kind === kind ? { ...tx, category: null } : tx)));
    api(`/categories/${id}`, { method: "DELETE" }).catch(() => setter(list));
  };

  return {
    transactions, savings, incomeCategories, expenseCategories,
    financeOpen, setFinanceOpen, financeCategoryModalOpen, setFinanceCategoryModalOpen,
    savingModal, setSavingModal, savingMovementsModal, setSavingMovementsModal, savingMovements,
    applyLoaded, addTransaction, deleteTransaction, openSaving, saveSaving, deleteSaving,
    openSavingMovements, addSavingMovement, removeSavingMovement,
    addFinanceCategory, renameFinanceCategory, removeFinanceCategory,
  };
}
