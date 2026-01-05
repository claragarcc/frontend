import Navbar from "./components/Navbar.jsx";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Busqueda from "./pages/Busqueda";
import Dashboard from "./pages/Dashboard";
import Interacciones from "./pages/Interacciones";
import Home from "./pages/Home.jsx";
import Ejercicios from "./pages/Ejercicios.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex flex-col min-h-screen w-screen bg-white">
      {/* Navbar solo fuera del login */}
      {!isLoginPage && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Entrada: SIEMPRE login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Privadas (solo se accede tras login demo o CAS) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/busqueda"
            element={
              <ProtectedRoute>
                <Busqueda />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interacciones"
            element={
              <ProtectedRoute>
                <Interacciones />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ejercicios"
            element={
              <ProtectedRoute>
                <Ejercicios />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}
