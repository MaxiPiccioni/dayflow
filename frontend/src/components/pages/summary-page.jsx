"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { UnifiedAgenda } from "@/components/agenda/unified-agenda";
import { useApp } from "@/components/app/app-provider";
import { FinanceArchive } from "@/components/finance/finance-archive";
import { Habits } from "@/components/habits/habits";
import { HabitsTracker } from "@/components/habits/habits-tracker";
import { HoursPanel } from "@/components/hours-panel";
import { Pomodoro } from "@/components/pomodoro/pomodoro";
import { SummaryColumn } from "@/components/summary/summary-column";
import { todayIso } from "@/lib/dates";
import { quotes } from "@/lib/quotes";

// Ruta "/": widgets del Resumen en dos columnas, reordenables.
export function SummaryPage() {
  const { pomodoro, agenda, habits, finance, hours, summary, subjects } = useApp();
  const quote = useMemo(() => quotes[new Date().getDate() % quotes.length], []);
  const todayStr = todayIso();
  const todayTasks = agenda.tasks.filter((task) => task.date === todayStr);
  const todayEvents = agenda.events.filter((event) => event.date === todayStr);
  const progressTotal = todayTasks.length + todayEvents.length + habits.habits.length;
  const progressDone = todayTasks.filter((task) => task.done).length + todayEvents.filter((event) => event.done).length + habits.habits.filter((habit) => habit.progress >= 100).length;

  const hoursPanel = (
    <HoursPanel
      period={hours.hoursPeriod} setPeriod={hours.setHoursPeriod}
      entries={hours.hourEntries} setEntries={hours.setHourEntries}
      payments={hours.hourPayments} setPayments={hours.setHourPayments}
      closedPeriods={hours.closedPeriods} setClosedPeriods={hours.setClosedPeriods}
      onSaveEntry={hours.saveHourEntry} onRemoveEntry={hours.removeHourEntry}
      compact
    />
  );
  const financePanel = (
    <FinanceArchive
      transactions={finance.transactions} savings={finance.savings}
      openFinance={() => finance.setFinanceOpen(true)} openSaving={finance.openSaving} openSavingMovements={finance.openSavingMovements}
      onDelete={finance.deleteTransaction} openFinanceCategoryManager={() => finance.setFinanceCategoryModalOpen(true)}
      compact
    />
  );
  const habitsBlock = (
    <div className="space-y-5">
      <Habits habits={habits.habits} date={habits.habitDate} setDate={habits.setHabitDate} habitLogs={habits.habitLogs} onSetCount={habits.setHabitCount} openHabit={habits.setHabitModal} />
      <HabitsTracker habits={habits.habits} habitLogs={habits.habitLogs} overview={habits.habitsOverview} />
    </div>
  );

  const widgets = {
    hero: (
      <Card className="bg-zinc-200 dark:bg-zinc-800">
        <CardHeader eyebrow="Tu día" title="En camino" />
        <p className="text-4xl font-semibold leading-tight">Pequeños pasos,<br /><span className="text-lime-600">gran progreso.</span></p>
        <p className="mt-6 border-l-2 border-lime-500 pl-3 text-sm italic text-zinc-700 dark:text-zinc-200">
          “{quote.text}”<span className="mt-2 block text-xs not-italic text-lime-700 dark:text-lime-300">— {quote.author}</span>
        </p>
        <Progress value={progressTotal ? progressDone / progressTotal * 100 : 0} color="bg-lime-500" />
      </Card>
    ),
    pomodoro: (
      <Pomodoro
        settings={pomodoro.settings} setSettings={pomodoro.setSettings} seconds={pomodoro.seconds} setSeconds={pomodoro.setSeconds}
        running={pomodoro.running} setRunning={pomodoro.setRunning} phase={pomodoro.phase} setPhase={pomodoro.setPhase}
        history={pomodoro.chartData} compact subjects={subjects} subjectId={pomodoro.studySubjectId} onSubjectChange={pomodoro.changeStudySubject}
      />
    ),
    calendar: (
      <Card>
        <CardHeader eyebrow="Calendario" title="Tu agenda" />
        <Calendar value={agenda.date} onChange={agenda.setDate} onDoubleClick={agenda.setDayModal} markers={agenda.events.map((event) => ({ date: event.date, color: event.color }))} />
      </Card>
    ),
    agenda: <UnifiedAgenda tasks={agenda.tasks} events={agenda.events} date={agenda.date} toggle={agenda.toggleTask} toggleEvent={agenda.toggleEvent} openTask={agenda.openTask} openEvent={agenda.openEvent} />,
    habits: habitsBlock,
    horas: hoursPanel,
    finanzas: financePanel,
  };

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      {summary.summaryColumns.map((ids, columnIndex) => (
        <SummaryColumn
          key={columnIndex}
          columnIndex={columnIndex}
          ids={ids}
          widgets={widgets}
          onReorder={summary.reorderSummary}
          onDropToColumn={summary.moveSummaryToColumn}
          onDragStateChange={summary.setDraggingWidgetId}
        />
      ))}
    </div>
  );
}
