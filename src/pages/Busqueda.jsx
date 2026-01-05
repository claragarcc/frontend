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
    axios
      .get(`${API}/api/ejercicios`)
      .then((res) => setEjercicios(res.data))
      .catch((err) => console.error("Error al obtener ejercicios:", err));
  }, [API]);

  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const asignatura = queryParams.get("asig");
  const conceptos = queryParams.get("conceptos")?.split(",") || [];
  const niveles = queryParams.get("niveles")?.split(",").map((n) => parseInt(n)) || [];

  const ejerciciosFiltrados = ejercicios.filter((ejercicio) => {
    if (asignatura && ejercicio.asignatura !== asignatura) return false;
    if (conceptos.length > 0 && !conceptos.includes(ejercicio.concepto)) return false;
    if (niveles.length > 0 && !niveles.includes(ejercicio.nivel)) return false;
    return true;
  });

  // Helpers
  const irAChat = (id) => navigate(`/interacciones?id=${id}`);

  const TablaEjercicios = ({ items }) => {
    return (
      <div className="tabla-wrap">
        <div className="tabla-ejercicios">
          <div className="tabla-head">
            <div className="th titulo-col">TÍTULO</div>
            <div className="th">ASIGNATURA</div>
            <div className="th">CONCEPTO</div>
            <div className="th nivel-col">NIVEL</div>
          </div>

          <div className="tabla-body">
            {items.map((e) => (
              <button
                key={e._id}
                type="button"
                className="fila"
                onClick={() => irAChat(e._id)}
                title="Abrir ejercicio"
              >
                <div className="td titulo-col">
                  <span className="fila-titulo">{e.titulo}</span>
                </div>

                <div className="td">
                  <span className="fila-sub">{e.asignatura}</span>
                </div>

                <div className="td">
                  <span className="fila-sub">{e.concepto}</span>
                </div>

                <div className="td nivel-col">
                  <span className="nivel-pill">Nivel {e.nivel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Caso: sin filtros -> “Todos los ejercicios”
  if (!asignatura && conceptos.length === 0 && niveles.length === 0) {
    // Lo sacamos directo en tabla (sin agrupar) para que sea más moderno y menos “bloques”
    const ordenados = [...ejercicios].sort((a, b) => {
      // Orden suave: asignatura -> concepto -> nivel -> titulo
      if (a.asignatura !== b.asignatura) return a.asignatura.localeCompare(b.asignatura);
      if (a.concepto !== b.concepto) return a.concepto.localeCompare(b.concepto);
      if (a.nivel !== b.nivel) return a.nivel - b.nivel;
      return a.titulo.localeCompare(b.titulo);
    });

    return (
      <div className="busqueda busqueda-scope">
        <div className="busqueda-header">
          <div className="busqueda-title-wrap">
            <h2 className="busqueda-title">Todos los ejercicios</h2>
            <div className="busqueda-acento" />
          </div>

          <button
            onClick={() => navigate("/filtro")}
            className="btn-secundario busqueda-btn-filtro"
            title="Filtrar ejercicios"
          >
            <MagnifyingGlassIcon className="icono-filtro" />
            <span className="texto-filtro">Filtrar</span>
          </button>
        </div>

        {ordenados.length === 0 ? (
          <div className="mensaje-vacio">
            <p>No hay ejercicios disponibles todavía.</p>
          </div>
        ) : (
          <TablaEjercicios items={ordenados} />
        )}
      </div>
    );
  }

  // Caso: con filtros -> “Ejercicios disponibles”
  return (
    <div className="busqueda busqueda-scope">
      <div className="busqueda-header">
        <div className="busqueda-title-wrap">
          <h2 className="busqueda-title">Ejercicios disponibles</h2>
          <div className="busqueda-acento" />
        </div>

        <button
          onClick={() => navigate("/filtro")}
          className="btn-secundario busqueda-btn-filtro"
          title="Modificar filtros"
        >
          <MagnifyingGlassIcon className="icono-filtro" />
          <span className="texto-filtro">Modificar filtros</span>
        </button>
      </div>

      {ejerciciosFiltrados.length === 0 ? (
        <div className="mensaje-vacio">
          <p>No se encontraron ejercicios con los filtros seleccionados.</p>
        </div>
      ) : (
        <TablaEjercicios items={ejerciciosFiltrados} />
      )}

      <div className="contenedor-boton-filtrar">
        <button onClick={() => navigate("/filtro")} className="btn">
          Filtrar ejercicios
        </button>
      </div>
    </div>
  );
}
