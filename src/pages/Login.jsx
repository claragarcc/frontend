import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { demoLogin } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

const from = location.state?.from?.pathname || "/home";
  // CAS real (redirige al backend)
  const handleSSOLogin = useCallback(() => {
    setLoading(true);
    const returnTo = encodeURIComponent(window.location.origin + "/home");
    window.location.href = `/api/auth/cas/login?returnTo=${returnTo}`;
  }, []);

  // Demo: crea sesión REAL en backend (cookie)
   const handleDemoLogin = useCallback(async () => {
    try {
      setLoading(true);
      await demoLogin();
      navigate(from, { replace: true });
    } catch (e) {
      console.error("Demo login error:", e);
      alert("No se pudo iniciar sesión en modo demo. Revisa el backend.");
    } finally {
      setLoading(false);
    }
  }, [navigate, from]);


  return (
    <div className="login-scope">
      <div className="login-card">
        <div className="login-accent" />

        <div className="login-body">
          <h1 className="login-title">Tutor Virtual</h1>

          <p className="login-subtitle">
            Accede mediante autenticación institucional UPV (CAS) o utiliza el modo demo para
            desarrollo y pruebas.
          </p>

          <div className="login-info">
            <div>
              <strong className="login-strong">Acceso UPV (CAS):</strong>{" "}
              redirige al sistema de autenticación central.
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <strong className="login-strong">Modo demo:</strong>{" "}
              crea una sesión de prueba para poder usar el sistema sin CAS.
            </div>
          </div>

          <div className="login-buttons">
            <button
              type="button"
              onClick={handleSSOLogin}
              disabled={loading}
              className={`btn-secondary w-full ${loading ? "btn-loading" : ""}`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              {loading ? "Iniciando..." : "Acceder con cuenta UPV"}
            </button>

            <div className="login-divider">O</div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className={`btn-demo w-full ${loading ? "btn-loading" : ""}`}
            >
              {loading ? "Entrando..." : "Entrar en modo demo"}
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
