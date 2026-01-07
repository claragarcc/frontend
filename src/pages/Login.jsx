import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { demoLogin } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [demoKey, setDemoKey] = useState("demo");

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
      const key = (demoKey || "demo").trim() || "demo";

      // crea sesión en backend
      await demoLogin(key);

      // navega ya con sesión creada
      navigate("/home", { replace: true });
    } catch (e) {
      console.error("Demo login error:", e);
      alert("No se pudo iniciar sesión en modo demo. Revisa el backend.");
    } finally {
      setLoading(false);
    }
  }, [demoKey, navigate]);

  return (
    <div className="login-scope">
      <div className="login-card">
        <div className="login-accent" />

        <div className="login-body">
          <h1 className="login-title">Tutor Virtual</h1>

          <p className="login-subtitle">
            Accede mediante autenticación institucional UPV (CAS) o utiliza el modo demo para
            desarrollo y demostración.
          </p>

          <div className="login-info">
            <div>
              <strong className="login-strong">Acceso UPV (CAS):</strong>{" "}
              redirige al sistema de autenticación central y, al volver, el backend crea la sesión.
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

            <label className="w-full" style={{ display: "block", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Clave demo (para distinguir usuarios)
              </span>
              <input
                type="text"
                value={demoKey}
                onChange={(e) => setDemoKey(e.target.value)}
                className="w-full"
                style={{
                  marginTop: "0.25rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "0.6rem",
                  border: "1px solid #d1d5db",
                  outline: "none",
                }}
                placeholder="ej: clara, juan, prueba123…"
                disabled={loading}
              />
            </label>

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
