import { useSyncExternalStore } from "react";

// Tema claro/oscuro: se guarda en localStorage y se avisa a los suscriptores con un evento propio.
const THEME_EVENT = "dayflow-theme-change";

function subscribeTheme(callback) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}
const getThemeSnapshot = () => localStorage.getItem("dayflow_theme") === "dark";
const getThemeServerSnapshot = () => false;

export function setStoredDark(value) {
  localStorage.setItem("dayflow_theme", value ? "dark" : "light");
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useDarkTheme() {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
}
