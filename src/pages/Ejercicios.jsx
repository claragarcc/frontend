import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const LOCAL_STORAGE_FILTERS_KEY = "ejerciciosPageFilters";

export default function EjerciciosPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [allEjercicios, setAllEjercicios] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());

  const API = import.meta.env.VITE_BACKEND_URL;
  const MOCK_USER_ID = "681cd8217918fbc4fc7a626f";

  // Filtros
  const [asig, setAsig] = useState("");
  const [conceptosSeleccionados, setConceptosSeleccionados] = useState([]);
  const [nivel, setNivel] = useState(0);

  const opcionesAsignaturas = ["Dispositivos electrónicos", "Teoría de circuitos"];
  const conceptosPorAsignatura = {
    "Dispositivos electrónicos": ["Ley de Ohm", "Polarización", "Semiconductores"],
    "Teoría de circuitos": ["Norton", "Thevenin"],
  };

  const conceptosDisponibles = useMemo(() => {
    return asig ? conceptosPorAsignatura[asig] || [] : [];
  }, [asig]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ejerciciosRes, completedRes] = await Promise.all([
          axios.get(`/api/ejercicios`),
          axios.get(`/api/resultados/completed/${MOCK_USER_ID}`),
        ]);

        const ejerciciosLimpios = (ejerciciosRes.data || []).map((ej) => ({
          ...ej,
          nivel: parseInt(ej.nivel, 10) || 0,
        }));

        setAllEjercicios(ejerciciosLimpios);
        setCompletedIds(new Set(completedRes.data || []));
      } catch (err) {
        console.error("Error al obtener los datos de la página de ejercicios:", err);
      }
    };
    fetchData();
  }, [API, MOCK_USER_ID]);

  useEffect(() => {
    const queryParams = new URLSearchParams(search);
    let loadedAsig = queryParams.get("asig") || "";
    let loadedConceptosRaw = queryParams.get("conceptos");
    let loadedNivel = parseInt(queryParams.get("nivel"), 10) || 0;

    if (!isInitialMount.current && asig !== loadedAsig) {
      setConceptosSeleccionados([]);
    }

    setAsig(loadedAsig);

    if (loadedConceptosRaw) {
      const validConcepts = conceptosPorAsignatura[loadedAsig] || [];
      setConceptosSeleccionados(
        loadedConceptosRaw.split(",").filter((c) => validConcepts.includes(c))
      );
    } else if (isInitialMount.current === false) {
      setConceptosSeleccionados([]);
    }

    setNivel(loadedNivel);

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [search]);

  const toggleConcepto = (c) => {
    setConceptosSeleccionados((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const aplicarFiltros = useCallback(() => {
    const query = new URLSearchParams();
    const currentFilters = { asig, conceptos: conceptosSeleccionados, nivel };

    if (asig) query.set("asig", asig);
    if (conceptosSeleccionados.length > 0)
      query.set("conceptos", conceptosSeleccionados.join(","));
    if (nivel > 0) query.set("nivel", nivel.toString());

    localStorage.setItem(LOCAL_STORAGE_FILTERS_KEY, JSON.stringify(currentFilters));
    navigate(`/ejercicios?${query.toString()}`);
  }, [asig, conceptosSeleccionados, nivel, navigate]);

  const limpiarFiltros = useCallback(() => {
    setAsig("");
    setConceptosSeleccionados([]);
    setNivel(0);
    localStorage.removeItem(LOCAL_STORAGE_FILTERS_KEY);
    navigate("/ejercicios");
  }, [navigate]);

  const ejerciciosFiltrados = useMemo(() => {
    return allEjercicios.filter((ejercicio) => {
      if (asig && ejercicio.asignatura !== asig) return false;
      if (
        conceptosSeleccionados.length > 0 &&
        !conceptosSeleccionados.includes(ejercicio.concepto)
      )
        return false;
      if (nivel > 0 && ejercicio.nivel != nivel) return false;
      return true;
    });
  }, [allEjercicios, asig, conceptosSeleccionados, nivel]);

  const filtrosActivos = useMemo(
    () => asig !== "" || conceptosSeleccionados.length > 0 || nivel > 0,
    [asig, conceptosSeleccionados, nivel]
  );

  const handleRowClick = useCallback(
    (ejercicioId) => navigate(`/interacciones?id=${ejercicioId}`),
    [navigate]
  );

  return (
    <div className="busqueda ejercicios-scope">
      <h2 className="titulo centrado text-2xl font-semibold mb-6">
        {filtrosActivos ? "Ejercicios filtrados" : "Todos los ejercicios"}
      </h2>

      {/* FILTROS */}
      <Disclosure
        as="div"
        className="bg-white shadow-lg rounded-xl max-w-xl mx-auto mt-5 p-6 mb-10 border border-gray-200"
      >
        {({ open }) => (
          <>
            <DisclosureButton
              className={classNames(
                "flex justify-between items-center w-full text-xl font-semibold text-azuloscuro mb-4 pb-2 border-b border-gray-200",
                filtrosActivos ? "text-rojo" : "hover:text-rojo"
              )}
            >
              <span>
                <MagnifyingGlassIcon className="h-6 w-6 inline-block mr-2" />
                Filtrar
              </span>
              {open ? (
                <ChevronUpIcon className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-6 w-6 text-gray-500" />
              )}
            </DisclosureButton>

            <DisclosurePanel className="pt-2">
              <div className="mb-4">
                <label className="block font-medium mb-2 text-dark">Asignatura</label>
                <select
                  className="w-full p-2 rounded border border-gray-300"
                  value={asig}
                  onChange={(e) => setAsig(e.target.value)}
                >
                  <option value="">Todas las asignaturas</option>
                  {opcionesAsignaturas.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2 text-dark">Conceptos</label>
                <div className="flex flex-wrap gap-4 justify-center">
                  {conceptosDisponibles.map((concepto) => (
                    <label
                      key={concepto}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={conceptosSeleccionados.includes(concepto)}
                        onChange={() => toggleConcepto(concepto)}
                        className="form-checkbox h-4 w-4 text-rojo rounded"
                      />
                      {concepto}
                    </label>
                  ))}
                </div>

                {conceptosDisponibles.length === 0 && asig && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    No hay conceptos para esta asignatura.
                  </p>
                )}
                {!asig && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Selecciona una asignatura para ver los conceptos.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2 text-dark">
                  Nivel de dificultad ({nivel === 0 ? "Todos" : nivel})
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={nivel}
                  onChange={(e) => setNivel(parseInt(e.target.value))}
                  className="w-full accent-rojo"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Todos</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center items-center space-x-4 mt-6">
                <button
                  onClick={aplicarFiltros}
                  className="btn-secondary text-white bg-azul rounded-lg hover:bg-rojo transition-colors py-2 px-4"
                >
                  Aplicar filtros
                </button>
                {filtrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="btn-secondary text-white bg-azuloscuro rounded-lg hover:bg-rojo transition-colors py-2 px-4"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>

      {/* LISTA */}
      {ejerciciosFiltrados.length === 0 ? (
        <div className="mensaje-vacio text-center p-4 text-gray-600 mt-8">
          <p>
            {filtrosActivos
              ? "No se encontraron ejercicios con los filtros seleccionados."
              : "Cargando ejercicios..."}
          </p>
        </div>
      ) : (
        <div className="ej-list max-w-4xl mx-auto mt-8">
          {/* CABECERA SOLO DESKTOP */}
          <div className="ej-head">
            <div className="ej-col ej-col-toggle" />
            <div className="ej-col ej-col-title">Título</div>
            <div className="ej-col ej-col-asig">Asignatura</div>
            <div className="ej-col ej-col-concept">Concepto</div>
            <div className="ej-col ej-col-level">Nivel</div>
            <div className="ej-col ej-col-done" />
          </div>

          <div className="ej-body">
            {ejerciciosFiltrados.map((ejercicio) => (
              <Disclosure as="div" key={ejercicio._id} className="ej-item">
                {({ open }) => (
                  <>
                    <div
                      className={classNames(
                        "ej-row",
                        open ? "ej-row-open" : ""
                      )}
                    >
                      {/* Toggle */}
                      <DisclosureButton className="ej-toggle">
                        <span className="sr-only">Ver detalles</span>
                        {open ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </DisclosureButton>

                      {/* Zona clicable */}
                      <div
                        className="ej-main"
                        onClick={() => handleRowClick(ejercicio._id)}
                        role="button"
                        tabIndex={0}
                      >
                        {/* MÓVIL: título + metainfo debajo */}
                        <div className="ej-title">
                          {ejercicio.titulo}
                        </div>

                        <div className="ej-meta">
                          <span className="ej-meta-item">{ejercicio.asignatura}</span>
                          <span className="ej-meta-sep">·</span>
                          <span className="ej-meta-item">{ejercicio.concepto}</span>
                        </div>

                        {/* DESKTOP: columnas separadas (se ven vía CSS) */}
                        <div className="ej-asig">{ejercicio.asignatura}</div>
                        <div className="ej-concept">{ejercicio.concepto}</div>
                      </div>

                      {/* Nivel + completado */}
                      <div className="ej-right">
                        <span className="ej-level-pill">{ejercicio.nivel}</span>
                        {completedIds.has(ejercicio._id) && (
                          <span className="ej-done" title="Ejercicio completado">
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                    </div>

                    <DisclosurePanel className="ej-panel">
  <div className="ej-panel-layout">

    <div className="ej-panel-media">
      {ejercicio.imagen && (
        <img
          src={`${API}/static/${ejercicio.imagen}`}
          alt={ejercicio.titulo}
          className="ej-panel-img"
        />
      )}
    </div>

    <div className="ej-panel-content">
      <h4 className="ej-panel-title">Enunciado</h4>
      <p className="ej-panel-text">{ejercicio.enunciado}</p>

      <div className="ej-panel-actions">
        <button
          className="ej-start-btn"
          onClick={() => handleRowClick(ejercicio._id)}
        >
          Comenzar ›
        </button>
      </div>
    </div>

  </div>
</DisclosurePanel>

                  </>
                )}
              </Disclosure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
