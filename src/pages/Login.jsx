import React, { useState } from 'react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'; // Icono para el botón SSO

// Definición de colores basada en la paleta de UPV (#E72621)
const UPV_RED = '#E72621'; 
const GRAY_DARK = '#454E55'; // Gris Oscuro para texto y fondos secundarios
const GRAY_LIGHT = '#F4F5F7'; // Fondo sutil

export default function App() {
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Placeholder para la URL de tu aplicación. ESTA DEBE SER TU URL FINAL (callback)
    // En tu backend, esta ruta recibirá el 'code' de CAS.
    const APP_BASE_URL = "http://localhost:3000/auth/cas/callback"; 
    const CAS_DEV_URL = "https://casdev.upv.es";

    const handleSSOLogin = () => {
        setIsRedirecting(true);
        
        // 1. Codificar la URL a la que CAS debe devolvernos después del éxito.
        const REDIRECT_SERVICE = encodeURIComponent(APP_BASE_URL);
        
        // 2. Construir la URL completa de CAS. Esta es la URL de redirección clave.
        const CAS_LOGIN_URL = `${CAS_DEV_URL}/cas/login?service=${REDIRECT_SERVICE}`;

        console.log("Iniciando redirección a CAS:", CAS_LOGIN_URL);
        
        // En un entorno de producción, descomentarías la línea de abajo para
        // redirigir realmente al usuario. Por ahora, solo es una simulación.
        // window.location.href = CAS_LOGIN_URL;

        showMessage("Redirigiendo a CAS para la autenticación...", false);

        // Simulación de la redirección externa con un breve retraso
        setTimeout(() => {
            // Aquí simularíamos la redirección
            showMessage("Simulación: Redireccionado a la página de login de la UPV.", false);
            setIsRedirecting(false);
        }, 1500);
    };

    // Función para mostrar mensajes
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
            style={{ backgroundColor: GRAY_LIGHT }} // Fondo gris claro
        >
            <style>
                {`
                    /* Estilos para el color de énfasis de UPV */
                    .bg-upv-red {
                        background-color: ${UPV_RED};
                    }
                    .hover\\:bg-upv-red-dark:hover {
                        background-color: #c91e19; /* Tono más oscuro de UPV_RED */
                    }
                    /* Animación sutil del botón */
                    @keyframes pulse-sso {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.02); }
                    }
                `}
            </style>
            
            {/* Custom Message Box (Reemplazo de alert) */}
            <div id="message-box" className="hidden fixed top-0 left-0 w-full justify-center p-4 z-50 transition duration-300 ease-in-out">
                <div className="text-white px-6 py-3 rounded-lg shadow-xl font-medium transform">
                    <span id="message-text"></span>
                </div>
            </div>

            <div className="w-full max-w-md">
                <header className="text-center mb-8">
                    <h1 
                        className="text-4xl font-extrabold"
                        style={{ color: UPV_RED }} // Título en el color institucional
                    >
                        Tutor Virtual
                    </h1>
                    <p 
                        className="mt-2 text-base"
                        style={{ color: GRAY_DARK }} // Subtítulo en gris oscuro
                    >
                        Accede a tus ejercicios utilizando tu cuenta institucional UPV.
                    </p>
                </header>

                {/* Tarjeta de Login - Estilo limpio y redondeado */}
                <div 
                    className="bg-white p-8 md:p-10 shadow-xl rounded-xl text-center"
                >
                    <h2 className="text-2xl font-semibold mb-8" style={{ color: GRAY_DARK }}>
                        Acceso Institucional
                    </h2>
                    
                    <p className="text-slate-600 mb-6">
                        Serás redirigido al sistema de autenticación central de la Universitat Politècnica de València (CAS).
                    </p>

                    {/* Botón Principal (Rojo UPV) para SSO */}
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
                        {isRedirecting ? 'Iniciando Redirección...' : 'Acceder con Cuenta UPV'}
                    </button>
                    
                    <div className="mt-8 text-center text-sm text-slate-500">
                        La gestión de credenciales (usuario y contraseña) es responsabilidad del servicio CAS.
                    </div>
                </div>
            </div>
        </div>
    );
}
