import FiltroEjercicios from './components/FiltroEjercicios.jsx'
import Navbar from './components/Navbar.jsx'
import { Routes, Route } from 'react-router-dom'
import Busqueda from './pages/Busqueda'
import Dashboard from './pages/Dashboard'
import Interacciones from './pages/Interacciones'
import Home from './pages/Home.jsx'
import Ejercicios from './pages/Ejercicios.jsx'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-white">

      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/filtro" element={<FiltroEjercicios />} />
          <Route path="/" element={<Home />} />
          <Route path="/busqueda" element={<Busqueda />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interacciones" element={<Interacciones />} />
          <Route path="/ejercicios" element={<Ejercicios />} />
        </Routes>
      </div>
    </div>
  )
  
}
