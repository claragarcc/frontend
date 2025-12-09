import React, { useState, useCallback } from 'react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

// Paleta de colores institucional UPV
const UPV_RED = '#E72621';
const GRAY_DARK = '#454E55';
const GRAY_LIGHT = '#F4F5F7';

// Lee la URL del backend (por defecto: http://localhost:9000)
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

export default function Login() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * handleSSOLogin()
   * ----------------
   * Esta función se ejecuta al pulsar el botón “Acceder con cuenta UPV”.
   * Redirige al backend del Tutor Virtual (por ejemplo http://localhost:9000)
   * que inicia el flujo OAuth2 con CAS. El backend será quien contacte
   * con CAS, gestione el intercambio del código de autorización y cree la sesión.
   */
  const handleSSOLogin = useCallback(() => {
    setIsRedirecting(true);
    const returnTo = encodeURIComponent(window.location.href); // Página actual para volver después del login
    // Redirección REAL al backend → /api/auth/cas/login
    window.location.href = `${BACKEND}/api/auth/cas/login?returnTo=${returnTo}`;
  }, []);

  /**
   * showMessage()
   * -------------
   * Utilidad para mostrar mensajes temporales (éxito/error) sin alert().
   * Aunque no es esencial para el login, se conserva por si se usa en otros flujos.
   */
  const showMessage = (message, isError = false) => {
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    if (messageBox && messageText) {
      messageBox.classList.remove('bg-red-500', 'bg-green-500');
      messageText.textContent = message;
      messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500', 'flex');
      messageBox.classList.remove('hidden');
      setTimeout(() => {
        messageBox.classList.add('hidden');
        messageBox.classList.remove('flex');
      }, 4000);
    } else {
      console.log("Message Box Fallback:", message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: GRAY_LIGHT }}
    >
      {/* Estilos embebidos (colores y animación del botón) */}
      <style>
        {`
          .bg-upv-red { background-color: ${UPV_RED}; }
          .hover\\:bg-upv-red-dark:hover { background-color: #c91e19; }
          @keyframes pulse-sso {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
        `}
      </style>

      {/* Message Box superior */}
      <div
        id="message-box"
        className="hidden fixed top-0 left-0 w-full justify-center p-4 z-50 transition duration-300 ease-in-out"
      >
        <div className="text-white px-6 py-3 rounded-lg shadow-xl font-medium transform">
          <span id="message-text"></span>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="w-full max-w-md">
        {/* Cabecera */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold" style={{ color: UPV_RED }}>
            Tutor Virtual
          </h1>
          <p className="mt-2 text-base" style={{ color: GRAY_DARK }}>
            Accede a tus ejercicios utilizando tu cuenta institucional UPV.
          </p>
        </header>

        {/* Tarjeta de Login */}
        <div className="bg-white p-8 md:p-10 shadow-xl rounded-xl text-center">
          <h2
            className="text-2xl font-semibold mb-8"
            style={{ color: GRAY_DARK }}
          >
            Acceso Institucional
          </h2>

          <p className="text-slate-600 mb-6">
            Serás redirigido al sistema de autenticación central de la Universitat
            Politècnica de València (CAS).
          </p>

          {/* Botón principal de acceso */}
          <button
            type="button"
            onClick={handleSSOLogin}
            disabled={isRedirecting}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 font-bold text-white rounded-lg transition duration-300 ease-in-out shadow-lg transform active:scale-[0.99] ${
              isRedirecting
                ? 'bg-slate-400 cursor-wait'
                : 'bg-upv-red hover:bg-upv-red-dark animation-pulse-sso'
            }`}
            style={{ animation: isRedirecting ? 'none' : 'pulse-sso 2s infinite' }}
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {isRedirecting
              ? 'Iniciando Redirección...'
              : 'Acceder con Cuenta UPV'}
          </button>

          <div className="mt-8 text-center text-sm text-slate-500">
            La gestión de credenciales (usuario y contraseña) es responsabilidad
            del servicio CAS.
          </div>
        </div>
      </div>
    </div>
  );
}
