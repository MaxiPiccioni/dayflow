const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const TOKEN_KEY = "dayflow_token";
// Se dispara cuando el servidor rechaza el token (vencido o inválido).
export const AUTH_EXPIRED_EVENT = "dayflow-auth-expired";

export class ApiError extends Error {
  constructor(message, { status = 0, network = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.network = network;
  }
}

const GENERIC_MESSAGES = {
  429: "Demasiados intentos. Probá de nuevo en unos minutos.",
  502: "El servidor está despertando. Probá de nuevo en unos segundos.",
  503: "El servidor está despertando. Probá de nuevo en unos segundos.",
  504: "El servidor tardó demasiado en responder. Probá de nuevo.",
};

function genericMessage(status) {
  if (GENERIC_MESSAGES[status]) return GENERIC_MESSAGES[status];
  return status >= 500 ? "Ocurrió un error en el servidor. Probá de nuevo." : "No se pudo completar la solicitud.";
}

// FastAPI devuelve `detail` como texto, o como lista de errores en las validaciones (422).
// Si el cuerpo no es JSON (por ejemplo una página 502 de Render), se usa un mensaje genérico.
async function readErrorMessage(response) {
  try {
    const body = await response.json();
    const { detail } = body ?? {};
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  } catch {
    // Cuerpo vacío o no JSON: se cae al mensaje genérico.
  }
  return genericMessage(response.status);
}

export async function api(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.", { network: true });
  }

  if (!response.ok) {
    // Un 401 con token guardado significa sesión vencida o token inválido.
    // Un 401 sin token (login con datos incorrectos) se muestra como error normal.
    if (response.status === 401 && token && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(await readErrorMessage(response), { status: response.status });
  }
  if (response.status === 204) return null;
  return response.json();
}
