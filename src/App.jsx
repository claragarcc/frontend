import Navbar from './components/Navbar.jsx'
import { Routes, Route } from 'react-router-dom'
import Busqueda from './pages/Busqueda'
import Dashboard from './pages/Dashboard'
import Interacciones from './pages/Interacciones'
import Home from './pages/Home.jsx'
import Ejercicios from './pages/Ejercicios.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-white">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/busqueda" element={<Busqueda />} />
          <Route path="/login" element={<Login />} />

          {/* Privadas */}
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
        </Routes>
      </div>
    </div>
  )
}
