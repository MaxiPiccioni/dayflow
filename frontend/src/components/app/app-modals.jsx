"use client";

import { useApp } from "@/components/app/app-provider";
import { CategoryManagerModal } from "@/components/modals/category-manager-modal";
import { DayModal } from "@/components/modals/day-modal";
import { EventModal } from "@/components/modals/event-modal";
import { FinanceCategoryManagerModal } from "@/components/modals/finance-category-manager-modal";
import { FinanceModal } from "@/components/modals/finance-modal";
import { HabitModal } from "@/components/modals/habit-modal";
import { SavingModal } from "@/components/modals/saving-modal";
import { SavingMovementsModal } from "@/components/modals/saving-movements-modal";
import { TaskModal } from "@/components/modals/task-modal";
import { WidgetPickerModal } from "@/components/modals/widget-picker-modal";

// Modales compartidos: se abren desde varias pestañas, por eso viven en el layout.
export function AppModals() {
  const { agenda, habits, finance, summary, subjects } = useApp();
  const { taskModal, setTaskModal, eventModal, setEventModal, dayModal, setDayModal, categoryModalOpen, setCategoryModalOpen, date } = agenda;
  const { savingModal, setSavingModal, savingMovementsModal, setSavingMovementsModal } = finance;
  return (
    <>
      {taskModal && <TaskModal task={taskModal.id ? taskModal : null} date={taskModal.date || date} categories={agenda.categories} subjects={subjects} close={() => setTaskModal(null)} save={agenda.saveTask} remove={agenda.deleteTask} />}
      {categoryModalOpen && <CategoryManagerModal categories={agenda.categories} addCategory={agenda.addCategory} removeCategory={agenda.removeCategory} close={() => setCategoryModalOpen(false)} />}
      {habits.habitModal && <HabitModal habit={habits.habitModal} close={() => habits.setHabitModal(null)} save={habits.saveHabit} remove={habits.deleteHabit} />}
      {finance.financeOpen && <FinanceModal incomeCategories={finance.incomeCategories} expenseCategories={finance.expenseCategories} close={() => finance.setFinanceOpen(false)} save={finance.addTransaction} />}
      {savingModal && <SavingModal saving={savingModal.id ? savingModal : null} close={() => setSavingModal(null)} save={finance.saveSaving} remove={finance.deleteSaving} />}
      {savingMovementsModal && <SavingMovementsModal saving={savingMovementsModal} movements={finance.savingMovements} addMovement={finance.addSavingMovement} removeMovement={finance.removeSavingMovement} close={() => setSavingMovementsModal(null)} />}
      {finance.financeCategoryModalOpen && <FinanceCategoryManagerModal incomeCategories={finance.incomeCategories} expenseCategories={finance.expenseCategories} addCategory={finance.addFinanceCategory} renameCategory={finance.renameFinanceCategory} removeCategory={finance.removeFinanceCategory} close={() => finance.setFinanceCategoryModalOpen(false)} />}
      {summary.widgetPickerOpen && <WidgetPickerModal available={summary.availableWidgets} addWidget={summary.addWidget} close={() => summary.setWidgetPickerOpen(false)} />}
      {eventModal && <EventModal event={eventModal.id ? eventModal : null} date={eventModal.date || date} categories={agenda.categories} close={() => setEventModal(null)} save={agenda.saveEvent} remove={agenda.deleteEvent} />}
      {dayModal && <DayModal date={dayModal} tasks={agenda.tasks} events={agenda.events} openTask={agenda.openTask} openEvent={agenda.openEvent} close={() => setDayModal(null)} />}
    </>
  );
}
