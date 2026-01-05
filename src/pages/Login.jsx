import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const DEMO_KEY = "tv_demo_enabled";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // CAS real (redirige al backend, que inicia CAS)
  const handleSSOLogin = useCallback(() => {
    setLoading(true);
    const returnTo = encodeURIComponent(window.location.origin + "/home");
    window.location.href = `${BACKEND}/api/auth/cas/login?returnTo=${returnTo}`;
  }, []);

  // Demo (habilita acceso en desarrollo sin CAS)
  const handleDemoLogin = useCallback(() => {
    localStorage.setItem(DEMO_KEY, "true");
    navigate("/home");
  }, [navigate]);

  return (
    <div className="login-scope">
      <div className="login-card">
        <div className="login-accent" />

        <div className="login-body">
          <h1 className="login-title">Tutor Virtual</h1>

          <p className="login-subtitle">
            Accede mediante autenticación institucional UPV (CAS) o utiliza el modo demo
            para desarrollo y demostración.
          </p>

          <div className="login-info">
            <div>
              <strong style={{ color: "var(--color-text-main)" }}>Acceso UPV (CAS):</strong>{" "}
              redirige al sistema de autenticación central y, al volver, el backend crea la sesión.
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <strong style={{ color: "var(--color-text-main)" }}>Modo demo:</strong>{" "}
              permite acceder sin CAS en local para poder desarrollar y mostrar el sistema.
            </div>
          </div>

          <div className="login-buttons">
            <button
              type="button"
              onClick={handleSSOLogin}
              disabled={loading}
              className={`btn-secondary w-full ${loading ? "btn-loading" : ""}`}
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
              {loading ? "Iniciando..." : "Acceder con cuenta UPV"}
            </button>

            <div className="login-divider">O</div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className={`btn-demo w-full ${loading ? "btn-loading" : ""}`}
            >
              Entrar en modo demo
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            En producción se desactiva el modo demo y se utiliza exclusivamente CAS.
          </p>
        </div>
      </div>
    </div>
  );
}
