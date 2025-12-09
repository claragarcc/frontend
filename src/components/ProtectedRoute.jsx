// src/components/ProtectedRoute.jsx
import React from "react";

const IS_DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

/**
 * En desarrollo (VITE_DEV_BYPASS_AUTH=true) NO se hace ninguna comprobación.
 * Simplemente se muestran los children.
 * Más adelante, cuando CAS funcione, volveremos a activar la verificación.
 */
export default function ProtectedRoute({ children }) {
  if (IS_DEV_BYPASS) {
    // MODO DEMO / DESARROLLO: sin comprobaciones
    return children;
  }

  // TODO: lógica real de comprobación con /api/auth/me cuando CAS funcione
  return <p className="p-6">Verificando sesión…</p>;
}
