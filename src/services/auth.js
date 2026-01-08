// src/services/auth.js
import { api } from "./api";

/** Devuelve el usuario autenticado actual */
export async function getCurrentUser() {
  try {
    const res = await api.get("/api/auth/me");
    return res.data;
  } catch (error) {
    return { authenticated: false };
  }
}

/** Login en modo demo (sin clave: 1 usuario demo por sesión) */
export async function demoLogin() {
  const res = await api.post("/api/auth/dev-login"); // ✅ sin body
  return res.data;
}

/** Logout (demo o CAS) */
export async function logout() {
  await api.get("/api/auth/logout");
}
