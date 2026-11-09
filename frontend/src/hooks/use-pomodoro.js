"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { fromApiSettings, toApiSettings } from "@/lib/mappers";
import { notifyPhaseChange, playAlarmSound } from "@/lib/sounds";

const WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

// Estado del Pomodoro: temporizador, configuración, historial y materia que se está estudiando.
// Vive en el Provider de la app para que siga corriendo (y sonando) al cambiar de ruta.
export function usePomodoro() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  const [settings, setSettingsState] = useState({ repetitions: 0, work: 0, breakTime: 0 });
  const [history, setHistory] = useState([]);
  const [studySubjectId, setStudySubjectId] = useState("");

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const secondsRef = useRef(seconds);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);
  const workSecondsRef = useRef(0);
  const studySubjectRef = useRef("");

  const flushPomodoroSeconds = () => {
    const pending = workSecondsRef.current;
    if (pending <= 0) return;
    workSecondsRef.current = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    setHistory((current) => current.map((entry) => (entry.date === todayStr ? { ...entry, seconds: entry.seconds + pending } : entry)));
    api("/pomodoro/log", { method: "POST", body: JSON.stringify({ seconds: pending, subject_id: studySubjectRef.current ? Number(studySubjectRef.current) : null }) }).catch(() => {});
  };

  // Antes de cambiar de materia se guarda el tiempo acumulado, para que cada materia reciba solo el suyo.
  const changeStudySubject = (value) => {
    flushPomodoroSeconds();
    studySubjectRef.current = value;
    setStudySubjectId(value);
  };

  // El temporizador se calcula a partir de marcas de tiempo reales (Date.now()), no de un contador de ticks:
  // así, si el navegador frena o suspende el setInterval mientras la pestaña está en segundo plano
  // (algo frecuente en iPhone/Safari), al volver se recalcula el tiempo real transcurrido y se "pone al día"
  // en vez de quedar desincronizado o directamente detenido.
  useEffect(() => {
    if (!running) return undefined;
    const lastTickRef = { current: Date.now() };
    const advance = () => {
      const now = Date.now();
      let elapsed = Math.floor((now - lastTickRef.current) / 1000);
      if (elapsed <= 0) return;
      lastTickRef.current += elapsed * 1000;
      let currentPhase = phaseRef.current;
      let currentSeconds = secondsRef.current;
      let workGained = 0;
      let rang = false;
      let guard = 0;
      while (elapsed > 0 && guard < 10000) {
        guard += 1;
        if (elapsed < currentSeconds) {
          if (currentPhase === "work") workGained += elapsed;
          currentSeconds -= elapsed;
          elapsed = 0;
        } else {
          if (currentPhase === "work") workGained += currentSeconds;
          elapsed -= currentSeconds;
          currentPhase = currentPhase === "work" ? "break" : "work";
          currentSeconds = (currentPhase === "work" ? settingsRef.current.work : settingsRef.current.breakTime) * 60;
          rang = true;
        }
      }
      if (workGained > 0) {
        workSecondsRef.current += workGained;
        if (workSecondsRef.current >= 60) flushPomodoroSeconds();
      }
      if (rang) {
        playAlarmSound();
        notifyPhaseChange(currentPhase);
      }
      if (currentPhase !== phaseRef.current) {
        phaseRef.current = currentPhase;
        setPhase(currentPhase);
      }
      if (currentSeconds !== secondsRef.current) {
        secondsRef.current = currentSeconds;
        setSeconds(currentSeconds);
      }
    };
    const timer = setInterval(advance, 1000);
    const onVisible = () => { if (document.visibilityState === "visible") advance(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      advance();
      flushPomodoroSeconds();
    };
  }, [running]);

  const setSettings = (next) => {
    setSettingsState(next);
    api("/pomodoro", { method: "PATCH", body: JSON.stringify(toApiSettings(next)) }).catch(() => {});
  };

  const applyLoaded = useCallback((pomodoroData, historyData) => {
    const loadedSettings = fromApiSettings(pomodoroData);
    setSettingsState(loadedSettings);
    setSeconds(loadedSettings.work * 60);
    setHistory(historyData);
  }, []);

  const chartData = history.map((entry) => ({
    day: WEEKDAY_LETTERS[new Date(`${entry.date}T12:00:00`).getDay()],
    minutes: Math.round(entry.seconds / 6) / 10,
  }));

  return { seconds, setSeconds, running, setRunning, phase, setPhase, settings, setSettings, chartData, studySubjectId, changeStudySubject, applyLoaded };
}
