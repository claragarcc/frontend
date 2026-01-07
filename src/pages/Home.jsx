import { Link } from "react-router-dom";
import { ArrowRightIcon, CpuChipIcon, VariableIcon } from '@heroicons/react/24/outline';
import { useEffect } from "react";
import { getCurrentUser } from "../services/auth";





const buildSubjectUrl = (subjectName) => {
  const params = new URLSearchParams();
  params.set('asig', subjectName);
  return `/ejercicios?${params.toString()}`;
};


export default function Home() {
  useEffect(() => {
    getCurrentUser().then((data) => {
      console.log("USUARIO ACTUAL:", data);
    });
  }, []);
  return (
    // Ya no necesitamos que el contenedor principal sea relativo
    <div className="home-scope">
      {/* ✅ Cabecera tradicional, limpia y en la parte superior */}
      <header className="main-header">
        <h1 className="main-title">Tutor Virtual</h1>
        <p className="main-subtitle">
          Selecciona una asignatura y comienza tu camino hacia el dominio.
        </p>
      </header>
      
      <div className="flex flex-col md:flex-row min-h-[80vh] bg-white">

        {/* Panel Izquierdo: Dispositivos Electrónicos (Activo) */}
        <Link
          to={buildSubjectUrl("Dispositivos electrónicos")}
          // ✅ Se ha añadido la clase para el borde derecho
          className="group split-panel bg-slate-50 text-slate-900 border-r border-slate-200"
        >
          <div className="split-content">
            <CpuChipIcon className="h-16 w-16 mb-4 text-slate-400 group-hover:text-custom-red transition-colors duration-300" />
            <h2 className="panel-title">
              Dispositivos electrónicos
            </h2>
            <p className="panel-subtitle">
              Fundamentos de la Ley de Ohm, polarización de componentes y semiconductores.
            </p>
            <div className="cta-button">
                Explorar asignatura <ArrowRightIcon className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Panel Derecho: Teoría de Circuitos (Próximamente) */}
        <div
          className="group split-panel bg-slate-200 text-slate-500 cursor-not-allowed"
        >
          <div className="split-content">
            <VariableIcon className="h-16 w-16 mb-4 text-slate-400" />
            <h2 className="panel-title">
              Teoría de circuitos
            </h2>
            <p className="panel-subtitle">
              Análisis avanzado de circuitos, teoremas de Norton, Thevenin y más.
            </p>
            <div className="cta-button-disabled">
                Próximamente
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}