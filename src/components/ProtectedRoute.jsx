// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const IS_DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

// Clave que guardaremos cuando el usuario pulse "Entrar en modo demo"
const DEMO_KEY = "tv_demo_enabled";

export default function ProtectedRoute({ children }) {
  // 1) En desarrollo, permitimos modo demo si el usuario lo ha activado desde Login
  if (IS_DEV_BYPASS) {
    const demoEnabled = localStorage.getItem(DEMO_KEY) === "true";
    if (demoEnabled) return children;

    // Si no está activado, obligamos a pasar por Login
    return <Navigate to="/login" replace />;
  }

  // 2) Producción / CAS real (más adelante)
  // Aquí es donde luego comprobaremos /api/auth/me
  return <p className="p-6">Verificando sesión…</p>;
}
