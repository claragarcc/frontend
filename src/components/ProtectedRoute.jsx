import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ok | no
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const resp = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // ✅ cookie de sesión
        });

        if (cancelled) return;
        setStatus(resp.ok ? "ok" : "no");
      } catch (e) {
        if (cancelled) return;
        setStatus("no");
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <p className="p-6">Verificando sesión…</p>;
  }

  if (status === "no") {
    // opcional: guardamos dónde querías entrar para volver después
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
