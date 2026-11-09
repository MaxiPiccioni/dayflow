"use client";

import { useApp } from "@/components/app/app-provider";
import { Habits } from "@/components/habits/habits";
import { HabitsTracker } from "@/components/habits/habits-tracker";

// Ruta "/habitos".
export function HabitsPage() {
  const { habits } = useApp();
  return (
    <div className="space-y-5">
      <Habits habits={habits.habits} date={habits.habitDate} setDate={habits.setHabitDate} habitLogs={habits.habitLogs} onSetCount={habits.setHabitCount} openHabit={habits.setHabitModal} />
      <HabitsTracker habits={habits.habits} habitLogs={habits.habitLogs} overview={habits.habitsOverview} />
    </div>
  );
}
