import Navbar from "./components/Navbar.jsx";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Busqueda from "./pages/Busqueda";
import Dashboard from "./pages/Dashboard";
import Interacciones from "./pages/Interacciones";
import Home from "./pages/Home.jsx";
import Ejercicios from "./pages/Ejercicios.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isInteraccionesPage = location.pathname === "/interacciones";

  const showNavbar = !isLoginPage;
  const showFooter = !isLoginPage && !isInteraccionesPage;

  return (
    <div className="flex flex-col min-h-screen w-screen bg-white">
      {showNavbar && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Entrada */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Privadas */}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showFooter && <Footer />}
    </div>
  );
}
