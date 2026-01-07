// src/pages/Login.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const DEMO_FLAG_KEY = "tv_demo_enabled";
const DEMO_USER_KEY = "tv_demo_key";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:80";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // CAS real (redirige al backend, que inicia CAS)
  const handleSSOLogin = useCallback(() => {
    setLoading(true);
    const returnTo = encodeURIComponent(window.location.origin + "/home");
    window.location.href = `${BACKEND}/api/auth/cas/login?returnTo=${returnTo}`;
  }, []);

  // Demo (crea SESIÓN real en backend con cookie, y luego navega)
  const handleDemoLogin = useCallback(async () => {
    try {
      setLoading(true);

      // demoKey estable por navegador (como espera tu backend)
      let demoKey = localStorage.getItem(DEMO_USER_KEY);
      if (!demoKey) {
        demoKey = (globalThis.crypto?.randomUUID?.() || Math.random().toString(16).slice(2))
          .replace(/-/g, "")
          .slice(0, 32);
        localStorage.setItem(DEMO_USER_KEY, demoKey);
      }

      const resp = await fetch(`${BACKEND}/api/auth/dev-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔴 CLAVE: guarda cookie de sesión
        body: JSON.stringify({ demoKey }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`DEV login falló (${resp.status}): ${txt}`);
      }

      // Marcador local opcional (no autentica por sí mismo, solo para UX)
      localStorage.setItem(DEMO_FLAG_KEY, "true");

      navigate("/home", { replace: true });
    } catch (e) {
      console.error(e);
      alert(
        "No se pudo iniciar el modo demo.\n\n" +
          "Comprueba que DEV_BYPASS_AUTH=true en el backend y que VITE_BACKEND_URL sea accesible desde el móvil (no 'localhost')."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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
              crea una sesión en el backend sin CAS para poder desarrollar y mostrar el sistema.
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
