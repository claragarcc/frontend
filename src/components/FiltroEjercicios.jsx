import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function FiltroEjercicios() {
  const navigate = useNavigate();
  const [asig, setAsig] = useState("Teoría de circuitos");
  const [conceptosSeleccionados, setConceptosSeleccionados] = useState([]);
  const [nivel, setNivel] = useState(3);

  const opcionesAsignaturas = ["Teoría de circuitos", "Dispositivos electrónicos"];
  const conceptosPorAsignatura = {
    "Teoría de circuitos": ["Ley de Ohm", "Norton", "Thevenin"],
    "Dispositivos electrónicos": ["Polarización", "Semiconductores"]
  };
  const conceptosDisponibles = conceptosPorAsignatura[asig] || [];

  useEffect(() => {
    setConceptosSeleccionados([]);
  }, [asig]);

  const toggleConcepto = (c) => {
    if (conceptosSeleccionados.includes(c)) {
      setConceptosSeleccionados(conceptosSeleccionados.filter(x => x !== c));
    } else {
      setConceptosSeleccionados([...conceptosSeleccionados, c]);
    }
  };

  const aplicarFiltros = () => {
    const query = new URLSearchParams();
    if (asig) query.set("asig", asig);
    if (conceptosSeleccionados.length > 0) query.set("conceptos", conceptosSeleccionados.join(","));
    if (nivel) query.set("niveles", nivel);
    navigate(`/busqueda?${query.toString()}`);
  };

  return (
    <div className="bg-white shadow rounded-xl max-w-xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-bold text-center mb-6 titulo">Filtrar ejercicios</h2>

      {/* Asignatura */}
      <div className="mb-4">
        <label className="block font-medium mb-2 etiqueta">Asignatura</label>
        <select
          className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-rojo"
          value={asig}
          onChange={e => setAsig(e.target.value)}
        >
          {opcionesAsignaturas.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      </div>

      {/* Conceptos */}
      <div className="mb-4">
        <label className="block font-medium mb-2 etiqueta">Conceptos</label>
        <div className="flex flex-wrap gap-4 justify-center">
          {conceptosDisponibles.map(concepto => (
            <label key={concepto} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={conceptosSeleccionados.includes(concepto)}
                onChange={() => toggleConcepto(concepto)}
              />
              {concepto}
            </label>
          ))}
        </div>
      </div>

      {/* Nivel */}
      <div className="mb-4">
        <label className="block font-medium mb-2 etiqueta">Nivel de dificultad</label>
        <input
          type="range"
          min={1}
          max={5}
          value={nivel}
          onChange={(e) => setNivel(parseInt(e.target.value))}
          className="w-full accent-rojo"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
        </div>
      </div>

      {/* Botones */}
      <button
        onClick={aplicarFiltros}
        className="btn-secondary block mx-auto mt-6"
      >
        Buscar ejercicios
      </button>

      <button
        onClick={() => navigate("/busqueda")}
        className="btn block mx-auto mt-2"
      >
        Ver todos los ejercicios
      </button>
    </div>
  );
}
