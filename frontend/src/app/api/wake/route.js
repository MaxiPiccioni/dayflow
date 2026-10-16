// Endpoint para el cronjob: despierta el frontend (esta request) y el backend + DB (via /health).
// Siempre responde 200: si el backend esta arrancando en frio, cron-job.org no debe contarlo como fallo
// (varios fallos seguidos deshabilitan el job).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BACKEND_TIMEOUT_MS = 20000;

export const dynamic = "force-dynamic";

export async function GET() {
  let backend;
  try {
    const res = await fetch(`${API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    backend = res.ok ? "ok" : res.status;
  } catch {
    backend = "waking";
  }
  return Response.json({ frontend: "ok", backend });
}
