"use client";

import { useApp } from "@/components/app/app-provider";
import { Pomodoro } from "@/components/pomodoro/pomodoro";

// Ruta "/pomodoro". El temporizador vive en el Provider, así que sigue corriendo al ir a otras rutas.
export function PomodoroPage() {
  const { pomodoro, subjects } = useApp();
  return (
    <Pomodoro
      settings={pomodoro.settings} setSettings={pomodoro.setSettings} seconds={pomodoro.seconds} setSeconds={pomodoro.setSeconds}
      running={pomodoro.running} setRunning={pomodoro.setRunning} phase={pomodoro.phase} setPhase={pomodoro.setPhase}
      history={pomodoro.chartData} subjects={subjects} subjectId={pomodoro.studySubjectId} onSubjectChange={pomodoro.changeStudySubject}
    />
  );
}
