"use client";

import { useApp } from "@/components/app/app-provider";
import { HoursPanel } from "@/components/hours-panel";

// Ruta "/horas".
export function HoursPage() {
  const { hours } = useApp();
  return (
    <HoursPanel
      period={hours.hoursPeriod} setPeriod={hours.setHoursPeriod}
      entries={hours.hourEntries} setEntries={hours.setHourEntries}
      payments={hours.hourPayments} setPayments={hours.setHourPayments}
      closedPeriods={hours.closedPeriods} setClosedPeriods={hours.setClosedPeriods}
      onSaveEntry={hours.saveHourEntry} onRemoveEntry={hours.removeHourEntry}
    />
  );
}
