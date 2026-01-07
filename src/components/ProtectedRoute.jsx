// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const IS_DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
const DEMO_FLAG_KEY = "tv_demo_enabled";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:80";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | no

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const resp = await fetch(`${BACKEND}/api/auth/me`, {
          method: "GET",
          credentials: "include", // 🔴 CLAVE: envía/recibe cookie de sesión
        });

        if (cancelled) return;
        setStatus(resp.ok ? "ok" : "no");
      } catch (e) {
        if (cancelled) return;
        // Error de red típico cuando en móvil el BACKEND apunta a localhost
        setStatus("no");
      }
    }

    // En desarrollo, solo dejamos intentar pasar si el usuario activó demo desde Login
    if (IS_DEV_BYPASS) {
      const demoEnabled = localStorage.getItem(DEMO_FLAG_KEY) === "true";
      if (!demoEnabled) {
        setStatus("no");
        return () => {
          cancelled = true;
        };
      }
    }

    // En demo y en CAS: verificamos sesión real
    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <p className="p-6">Verificando sesión…</p>;
  }

  if (status === "no") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
