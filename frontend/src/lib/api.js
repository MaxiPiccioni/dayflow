const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function api(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("dayflow_token") : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) throw new Error((await response.json()).detail || "Request failed");
  return response.json();
}
