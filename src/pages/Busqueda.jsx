import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import axios from "axios";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function BusquedaEjercicios() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [ejercicios, setEjercicios] = useState([]);
  const API = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    axios.get(`${API}/api/ejercicios`)
      .then(res => setEjercicios(res.data))
      .catch(err => console.error("Error al obtener ejercicios:", err));
  }, []);

  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const asignatura = queryParams.get("asig");
  const conceptos = queryParams.get("conceptos")?.split(",") || [];
  const niveles = queryParams.get("niveles")?.split(",").map(n => parseInt(n)) || [];

  const ejerciciosFiltrados = ejercicios.filter(ejercicio => {
    if (asignatura && ejercicio.asignatura !== asignatura) return false;
    if (conceptos.length > 0 && !conceptos.includes(ejercicio.concepto)) return false;
    if (niveles.length > 0 && !niveles.includes(ejercicio.nivel)) return false;
    return true;
  });

  const ejerciciosPorConcepto = conceptos.reduce((acc, concepto) => {
    acc[concepto] = ejerciciosFiltrados.filter(e => e.concepto === concepto);
    return acc;
  }, {});

  const ejerciciosPorNivel = niveles.reduce((acc, nivel) => {
    acc[nivel] = ejerciciosFiltrados.filter(e => e.nivel === nivel);
    return acc;
  }, {});

  if (!asignatura && conceptos.length === 0 && niveles.length === 0) {
    const agrupado = ejercicios.reduce((acc, ej) => {
      if (!acc[ej.asignatura]) acc[ej.asignatura] = {};
      if (!acc[ej.asignatura][ej.concepto]) acc[ej.asignatura][ej.concepto] = {};
      if (!acc[ej.asignatura][ej.concepto][ej.nivel]) acc[ej.asignatura][ej.concepto][ej.nivel] = [];
      acc[ej.asignatura][ej.concepto][ej.nivel].push(ej);
      return acc;
    }, {});

    return (
      <div className="busqueda">
        <div className="encabezado-busqueda">
          <h2 className="titulo">Todos los ejercicios</h2>
          <button
            onClick={() => navigate("/filtro")}
            className="btn-secundario"
            title="Filtrar ejercicios"
          >
            <MagnifyingGlassIcon className="icono-filtro" />
            <span className="texto-filtro">Filtrar</span>
          </button>
        </div>

        {Object.entries(agrupado).map(([asig, conceptos]) => (
          <div key={asig} className="bloque-asignatura">
            <h3 className="subtitulo-asignatura">{asig}</h3>
            {Object.entries(conceptos).map(([concepto, nivelesObj]) => (
              <div key={concepto} className="bloque-concepto">
                <h4 className="subtitulo-concepto">{concepto}</h4>
                <div className="contenedor-ejercicios">
                  {[1, 2, 3, 4, 5].map((nivel) => {
                    const ejercicios = nivelesObj[nivel] || [];
                    return ejercicios.length > 0 ? (
                      <div key={nivel} className="card">
                        <h5 className="nivel">Nivel {nivel}</h5>
                        {ejercicios.map((e) => (
                          <div
                            key={e._id}
                            className="enlace-ejercicio"
                            onClick={() => navigate(`/interacciones?id=${e._id}`)}
                          >
                            {e.titulo}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="contenedor-boton-filtrar">
          <button onClick={() => navigate("/filtro")} className="btn">
            Filtrar ejercicios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="busqueda">
      <h2 className="titulo centrado">Ejercicios disponibles</h2>
      {ejerciciosFiltrados.length === 0 ? (
        <div className="mensaje-vacio">
          <p>No se encontraron ejercicios con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="contenedor-ejercicios-filtrados">
          {conceptos.length > 0 && niveles.length === 0 &&
            Object.entries(ejerciciosPorConcepto).map(([concepto, ejercicios]) => (
              <div key={concepto}>
                <h3 className="subtitulo-concepto">{concepto}</h3>
                <div className="contenedor-ejercicios">
                  {[1, 2, 3, 4, 5].map(nivel => {
                    const ejerciciosNivel = ejercicios.filter(e => e.nivel === nivel);
                    return ejerciciosNivel.length > 0 ? (
                      <div key={nivel} className="card">
                        <h4 className="nivel">Nivel {nivel}</h4>
                        {ejerciciosNivel.map(e => (
                          <div
                            key={e._id}
                            className="enlace-ejercicio"
                            onClick={() => navigate(`/interacciones?id=${e._id}`)}
                          >
                            {e.titulo}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}

          {conceptos.length > 0 && niveles.length === 1 && (
            <div className="contenedor-ejercicios">
              {conceptos.map((concepto) => {
                const ejerciciosDelConcepto = ejerciciosFiltrados.filter(e => e.concepto === concepto);
                if (ejerciciosDelConcepto.length === 0) return null;

                return (
                  <div key={concepto}>
                    <h3 className="subtitulo-concepto">{concepto}</h3>
                    <div className="contenedor-ejercicios">
                      {ejerciciosDelConcepto.map((e) => (
                        <div
                          key={e._id}
                          className="card card-clickable"
                          onClick={() => navigate(`/interacciones?id=${e._id}`)}
                        >
                          <p className="titulo-ejercicio">{e.titulo}</p>
                          <p className="nivel-ejercicio">Nivel {e.nivel}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {niveles.length > 0 && conceptos.length === 0 &&
            Object.entries(ejerciciosPorNivel).map(([nivel, ejercicios]) => (
              <div key={nivel}>
                <h3 className="subtitulo-nivel">Nivel {nivel}</h3>
                <div className="contenedor-ejercicios">
                  {[...new Set(ejercicios.map(e => e.concepto))].map(concepto => {
                    const ejerciciosConcepto = ejercicios.filter(e => e.concepto === concepto);
                    return ejerciciosConcepto.length > 0 ? (
                      <div key={concepto} className="card">
                        <h4 className="subtitulo-concepto">{concepto}</h4>
                        {ejerciciosConcepto.map(e => (
                          <div
                            key={e._id}
                            className="enlace-ejercicio"
                            onClick={() => navigate(`/interacciones?id=${e._id}`)}
                          >
                            {e.titulo}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="contenedor-boton-filtrar">
        <button onClick={() => navigate("/filtro")} className="btn">
          Filtrar ejercicios
        </button>
      </div>
    </div>
  );
}
