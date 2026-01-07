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

/** Login en modo demo */
export async function demoLogin(demoKey = "demo") {
  const res = await api.post("/api/auth/dev-login", { demoKey });
  return res.data;
}

/** Logout (demo o CAS) */
export async function logout() {
  await api.get("/api/auth/logout");
}
