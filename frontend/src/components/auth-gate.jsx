"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AuthGate({ children }) {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f5ef] dark:bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-300 dark:text-zinc-700" size={22} />
      </div>
    );
  }

  if (status === "anon") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f4f5ef] dark:bg-zinc-950">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[120%] -translate-x-1/2 rounded-full bg-lime-300/40 blur-3xl dark:bg-lime-500/10" />
        <div className="relative flex min-h-screen flex-col justify-center px-5 py-10 sm:items-center">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex flex-col items-center text-center">
              <Image src="/logo.png" alt="Dayflow" width={56} height={56} className="h-14 w-14 rounded-2xl shadow-sm" />
              <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">dayflow</h1>
              <p className="mt-1 text-sm text-zinc-500">Tu día, en equilibrio.</p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
              <Tabs value={mode} onValueChange={(value) => { setMode(value); setError(""); }}>
                <TabsList className="grid w-full grid-cols-2 bg-zinc-100 dark:bg-zinc-800">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-950 dark:data-[state=active]:text-zinc-100">Iniciar sesión</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-950 dark:data-[state=active]:text-zinc-100">Crear cuenta</TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <Input id="fullName" required autoFocus value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Ada Lovelace" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" required type="email" inputMode="email" autoFocus={mode === "login"} value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="vos@ejemplo.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input id="password" required type={showPassword ? "text" : "password"} minLength={8} value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="Mínimo 8 caracteres" className="pr-10" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

                <Button type="submit" disabled={busy} size="lg" className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-lime-400 dark:text-zinc-950 dark:hover:bg-lime-300">
                  {busy && <Loader2 className="animate-spin" size={16} />}
                  {busy ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
              <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300">
                {mode === "login" ? "Registrate" : "Iniciá sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children(user, logout);
}
