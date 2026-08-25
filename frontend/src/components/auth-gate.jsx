"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";

const inputClass = "w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-lime-500 dark:border-zinc-700";

export function AuthGate({ children }) {
  const [status, setStatus] = useState(() => (typeof window !== "undefined" && localStorage.getItem("dayflow_token") ? "checking" : "anon"));
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "checking") return;
    api("/auth/me").then((me) => { setUser(me); setStatus("authed"); }).catch(() => { localStorage.removeItem("dayflow_token"); setStatus("anon"); });
  }, [status]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const logout = () => {
    localStorage.removeItem("dayflow_token");
    setUser(null);
    setForm({ email: "", password: "", fullName: "" });
    setMode("login");
    setStatus("anon");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : { email: form.email, password: form.password, full_name: form.fullName };
      const { access_token } = await api(path, { method: "POST", body: JSON.stringify(payload) });
      localStorage.setItem("dayflow_token", access_token);
      const me = await api("/auth/me");
      setUser(me);
      setStatus("authed");
    } catch (err) {
      setError(err.message || "Ocurrió un error, probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking") {
    return <div className="grid min-h-screen place-items-center bg-[#f4f5ef] dark:bg-zinc-950"><p className="text-sm text-zinc-400">Cargando…</p></div>;
  }

  if (status === "anon") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f5ef] px-4 dark:bg-zinc-950">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center gap-3">
            <Image src="/logo.png" alt="Dayflow" width={40} height={40} className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">dayflow</span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
          <p className="mt-1 text-sm text-zinc-500">{mode === "login" ? "Ingresá con tu email y contraseña." : "Registrate para empezar a organizar tu día."}</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "register" && (
              <input required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Nombre completo" className={inputClass} />
            )}
            <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Email" className={inputClass} />
            <input required type="password" minLength={8} value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="Contraseña (mínimo 8 caracteres)" className={inputClass} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="mt-5 w-full text-center text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
          </button>
        </div>
      </div>
    );
  }

  return children(user, logout);
}
