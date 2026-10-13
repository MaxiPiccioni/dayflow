// Endpoint para el cronjob: despierta el frontend (esta request) y el backend + DB (via /health).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return Response.json({ frontend: "ok", backend: res.ok ? "ok" : res.status }, { status: res.ok ? 200 : 502 });
  } catch {
    return Response.json({ frontend: "ok", backend: "unreachable" }, { status: 502 });
  }
}
