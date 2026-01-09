// Home.jsx
import { Link } from "react-router-dom";
import { ArrowRightIcon, CpuChipIcon, VariableIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { getCurrentUser } from "../services/auth";

const buildSubjectUrl = (subjectName) => {
  const params = new URLSearchParams();
  params.set("asig", subjectName);
  return `/ejercicios?${params.toString()}`;
};

export default function Home() {
  useEffect(() => {
    getCurrentUser().then((data) => {
      console.log("USUARIO ACTUAL:", data);
    });
  }, []);

  return (
    <div className="home-scope">
      {/* Cabecera */}
      <header className="main-header">
        <h1 className="main-title">Tutor Virtual</h1>
        <p className="main-subtitle">
          Selecciona una asignatura y comienza tu camino hacia el dominio.
        </p>
      </header>

      {/* ✅ IMPORTANTE: usamos tus clases home-split-wrap + home-split
          (quitamos el flex+bg-white que te estaba rompiendo el CSS responsive) */}
      <div className="home-split-wrap">
        <div className="home-split">
          {/* Panel Izquierdo: Dispositivos Electrónicos (Activo) */}
          <Link
            to={buildSubjectUrl("Dispositivos electrónicos")}
            className="group split-panel is-active"
          >
            <div className="split-content">
              <CpuChipIcon className="h-16 w-16 mb-4 text-slate-400" />

              <h2 className="panel-title">Dispositivos electrónicos</h2>

              <p className="panel-subtitle">
                Fundamentos de la Ley de Ohm, polarización de componentes y semiconductores.
              </p>

              {/* ✅ CTA: con el CSS corregido se ve SIEMPRE en móvil */}
              <div className="cta-button">
                Explorar asignatura <ArrowRightIcon className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Panel Derecho: Teoría de Circuitos (Próximamente) */}
          <div className="group split-panel is-disabled cursor-not-allowed">
            <div className="split-content">
              <VariableIcon className="h-16 w-16 mb-4 text-slate-400" />

              <h2 className="panel-title">Teoría de circuitos</h2>

              <p className="panel-subtitle">
                Análisis avanzado de circuitos, teoremas de Norton, Thevenin y más.
              </p>

              <div className="cta-button-disabled">Próximamente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
