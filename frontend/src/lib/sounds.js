// Sonidos y avisos del Pomodoro (Web Audio y notificaciones del navegador).
let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.45, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

export function playAlarmSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];
  const chimeSpan = notes.length * 0.22 + 1.1;
  [0, 1].forEach((repeat) => {
    const repeatStart = now + repeat * chimeSpan;
    notes.forEach((freq, index) => {
      const start = repeatStart + index * 0.22;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      const partial = ctx.createOscillator();
      partial.type = "sine";
      partial.frequency.setValueAtTime(freq * 2, start);
      const partialGain = ctx.createGain();
      partialGain.gain.value = 0.16;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.55, start + 0.05);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      osc.connect(envelope);
      partial.connect(partialGain).connect(envelope);
      envelope.connect(ctx.destination);
      osc.start(start);
      partial.start(start);
      osc.stop(start + 0.95);
      partial.stop(start + 0.95);
    });
  });
}

export function notifyPhaseChange(nextPhase) {
  if (typeof document === "undefined" || document.visibilityState !== "hidden") return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(nextPhase === "work" ? "Terminó el descanso" : "¡Bien! Tomate un descanso", { body: "Pomodoro", tag: "pomodoro" });
  } catch {
    /* Notification puede fallar en algunos navegadores, no es crítico */
  }
}
