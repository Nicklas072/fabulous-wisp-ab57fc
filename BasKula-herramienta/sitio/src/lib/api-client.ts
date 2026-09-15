"use client";

// ═══════════════════════════════════════════════════════════════
// Helpers de API para el navegador (cliente y administrador)
//
// El sitio puede mostrarse en contextos donde el navegador bloquea
// cookies (iframes, previews embebidos). Para que TODO funcione
// siempre:
//   - adminFetch() adjunta el PIN de localStorage como header
//     x-admin-pin en cada petición a /api/admin/*
//   - clientFetch() adjunta el código de cliente de localStorage
//     como header x-client-code en cada petición a /api/client/*
// El servidor acepta cookie O header (ver lib/admin-auth.ts y las
// rutas de cliente).
// ═══════════════════════════════════════════════════════════════

const ADMIN_PIN_KEY = "pb_admin_pin";
const CLIENT_CODE_KEY = "pb_client_code";

// ---------- Admin ----------

// El PIN vive en localStorage (no sessionStorage): así la sesión del
// panel SOBREVIVE a la navegación por el catálogo público, a pestañas
// nuevas y a cerrar/abrir el navegador — el dueño entra una vez y
// alterna panel ⇄ catálogo sin volver a ingresar la clave.

export function setAdminPin(pin: string) {
  try {
    localStorage.setItem(ADMIN_PIN_KEY, pin);
    // Limpiar la copia vieja de sessionStorage (si existiera)
    sessionStorage.removeItem(ADMIN_PIN_KEY);
  } catch {
    /* storage bloqueado */
  }
}

export function getAdminPin(): string {
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || sessionStorage.getItem(ADMIN_PIN_KEY) || "";
  } catch {
    return "";
  }
}

export function clearAdminPin() {
  try {
    localStorage.removeItem(ADMIN_PIN_KEY);
    sessionStorage.removeItem(ADMIN_PIN_KEY);
  } catch {
    /* ignore */
  }
}

export async function adminFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const pin = getAdminPin();
  if (pin) headers.set("x-admin-pin", pin);
  return fetch(url, { ...init, headers });
}

// ---------- Cliente identificado ----------

// Normaliza un código de cliente a su forma canónica:
// mayúsculas, sin espacios, sin tildes y solo [A-Z0-9-].
// Se usa al escribir el código (crear / editar / iniciar sesión)
// para que "caf 22", "Café 22" y "c2272" nunca sean códigos distintos.
export function normalizeClientCode(raw: string): string {
  return (raw || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

export function setClientCode(code: string) {
  try {
    localStorage.setItem(CLIENT_CODE_KEY, code);
  } catch {
    /* storage bloqueado */
  }
}

export function getClientCode(): string {
  try {
    return localStorage.getItem(CLIENT_CODE_KEY) || "";
  } catch {
    return "";
  }
}

export function clearClientCode() {
  try {
    localStorage.removeItem(CLIENT_CODE_KEY);
  } catch {
    /* ignore */
  }
}

export async function clientFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const code = getClientCode();
  if (code) headers.set("x-client-code", code);
  return fetch(url, { ...init, headers });
}
