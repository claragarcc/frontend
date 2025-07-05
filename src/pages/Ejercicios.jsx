import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

// Importa los componentes de Headless UI para el acordeón de filtros y las filas de la tabla
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
// Iconos para el acordeón de las filas de la tabla y para el botón de filtro
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/20/solid';

// Función auxiliar para combinar clases de Tailwind (si no la tienes ya globalmente)
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Clave para localStorage
const LOCAL_STORAGE_FILTERS_KEY = "ejerciciosPageFilters";

export default function EjerciciosPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [allEjercicios, setAllEjercicios] = useState([]);
  const API = import.meta.env.VITE_BACKEND_URL;

  // --- ESTADOS Y LÓGICA DE FILTRADO ---
  const [asig, setAsig] = useState("");
  const [conceptosSeleccionados, setConceptosSeleccionados] = useState([]);
  const [nivel, setNivel] = useState(0); // 0 para "todos los niveles", 1-5 para nivel específico

  const opcionesAsignaturas = ["Teoría de circuitos", "Dispositivos electrónicos"];
  const conceptosPorAsignatura = {
    "Teoría de circuitos": ["Ley de Ohm", "Norton", "Thevenin"],
    "Dispositivos electrónicos": ["Polarización", "Semiconductores", "Ley de Ohm"]
  };

  // Conceptos disponibles basados en la asignatura seleccionada
  const conceptosDisponibles = useMemo(() => {
    return asig ? conceptosPorAsignatura[asig] || [] : [];
  }, [asig]);

  // Ref para controlar si es la carga inicial del componente
  const isInitialMount = useRef(true);

  // EFECTO 1: Sincronizar estado local con queryParams O localStorage en la carga inicial
  // Prioridad: URL > localStorage
  useEffect(() => {
    const queryParams = new URLSearchParams(search);
    let loadedAsig = "";
    let loadedConceptos = [];
    let loadedNivel = 0;

    // Primero, intenta cargar desde la URL (query params)
    const urlAsig = queryParams.get("asig") || "";
    const urlConceptosRaw = queryParams.get("conceptos");
    const urlNivel = parseInt(queryParams.get("nivel"), 10) || 0;

    if (urlAsig || urlConceptosRaw || urlNivel > 0) {
      // Si hay algo en la URL, usa los de la URL
      loadedAsig = urlAsig;
      if (urlConceptosRaw) {
        const validConceptsForUrlAsig = conceptosPorAsignatura[urlAsig] || [];
        loadedConceptos = urlConceptosRaw.split(",").filter(c => validConceptsForUrlAsig.includes(c));
      }
      loadedNivel = urlNivel;
    } else {
      // Si no hay nada en la URL, intenta cargar desde localStorage
      const storedFilters = localStorage.getItem(LOCAL_STORAGE_FILTERS_KEY);
      if (storedFilters) {
        try {
          const parsedFilters = JSON.parse(storedFilters);
          loadedAsig = parsedFilters.asig || "";
          loadedConceptos = parsedFilters.conceptos || [];
          loadedNivel = parsedFilters.nivel || 0;

          // Opcional: Reaplicar estos filtros a la URL si se cargaron de localStorage
          // Esto asegura que la URL esté siempre "correcta" después de cargar de localStorage
          const newQuery = new URLSearchParams();
          if (loadedAsig) newQuery.set("asig", loadedAsig);
          if (loadedConceptos.length > 0) newQuery.set("conceptos", loadedConceptos.join(","));
          if (loadedNivel > 0) newQuery.set("nivel", loadedNivel.toString());
          navigate(`?${newQuery.toString()}`, { replace: true }); // Usar replace para no añadir al historial
        } catch (e) {
          console.error("Error parsing filters from localStorage", e);
          localStorage.removeItem(LOCAL_STORAGE_FILTERS_KEY); // Limpiar datos corruptos
        }
      }
    }

    setAsig(loadedAsig);
    setConceptosSeleccionados(loadedConceptos);
    setNivel(loadedNivel);

    // Marcar que la carga inicial ha terminado después de la primera sincronización
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [search, navigate]); // Depende de search y navigate

  // EFECTO 2: Resetear conceptos seleccionados si la asignatura cambia manualmente
  useEffect(() => {
    if (!isInitialMount.current) {
      // Comparar 'asig' actual con 'asig' en la URL
      const queryParams = new URLSearchParams(search);
      const urlAsigFromCurrentSearch = queryParams.get("asig") || "";

      // Si 'asig' en el estado no coincide con 'asig' en la URL,
      // significa que el usuario la ha cambiado manualmente.
      if (asig !== urlAsigFromCurrentSearch) {
        setConceptosSeleccionados([]);
      }
    }
  }, [asig, search]); // Depende de 'asig' y 'search'


  const toggleConcepto = (c) => {
    setConceptosSeleccionados(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const aplicarFiltros = useCallback(() => {
    const query = new URLSearchParams();
    const currentFilters = {};

    if (asig) {
      query.set("asig", asig);
      currentFilters.asig = asig;
    }
    if (conceptosSeleccionados.length > 0) {
      query.set("conceptos", conceptosSeleccionados.join(","));
      currentFilters.conceptos = conceptosSeleccionados;
    }
    if (nivel > 0) {
      query.set("nivel", nivel.toString());
      currentFilters.nivel = nivel;
    }

    // Guardar en localStorage
    localStorage.setItem(LOCAL_STORAGE_FILTERS_KEY, JSON.stringify(currentFilters));

    navigate(`/ejercicios?${query.toString()}`);
  }, [asig, conceptosSeleccionados, nivel, navigate]);

  const limpiarFiltros = useCallback(() => {
    setAsig("");
    setConceptosSeleccionados([]);
    setNivel(0);
    
    // Limpiar localStorage
    localStorage.removeItem(LOCAL_STORAGE_FILTERS_KEY);

    navigate("/ejercicios"); // Navega a la ruta base sin filtros
  }, [navigate]);

  // Carga todos los ejercicios desde el backend una sola vez
  useEffect(() => {
    axios.get(`${API}/api/ejercicios`)
      .then(res => {
        setAllEjercicios(res.data);
      })
      .catch(err => console.error("Error al obtener ejercicios:", err));
  }, [API]);

  // Filtra los ejercicios basándose en el estado local (sincronizado con URL/localStorage)
  const ejerciciosFiltrados = useMemo(() => {
    let currentFiltered = [...allEjercicios];

    if (asig) {
      currentFiltered = currentFiltered.filter(ejercicio => ejercicio.asignatura === asig);
    }
    if (conceptosSeleccionados.length > 0) {
      currentFiltered = currentFiltered.filter(ejercicio => conceptosSeleccionados.includes(ejercicio.concepto));
    }
    if (nivel > 0) {
      currentFiltered = currentFiltered.filter(ejercicio => ejercicio.nivel === nivel);
    }
    return currentFiltered;
  }, [allEjercicios, asig, conceptosSeleccionados, nivel]);

  // Determinar si hay filtros aplicados para el estilo del botón
  const filtrosActivos = useMemo(() => {
    return asig !== "" || conceptosSeleccionados.length > 0 || nivel > 0;
  }, [asig, conceptosSeleccionados, nivel]);

  // Función para manejar el clic en la fila del ejercicio (para navegar a interacciones)
  const handleRowClick = useCallback((ejercicioId) => {
    console.log(`Navegando a /interacciones?id=${ejercicioId} para nueva interacción`);
    // Puedes dejarlo así, porque los filtros ya se guardarán en localStorage
    navigate(`/interacciones?id=${ejercicioId}`); 
  }, [navigate]);


  return (
    <div className="busqueda p-4">
      <h2 className="titulo centrado text-2xl font-bold mb-6">
        {filtrosActivos ? "Ejercicios filtrados" : "Todos los ejercicios"}
      </h2>

      {/* --- Controles de Filtro en un Acordeón --- */}
      <Disclosure as="div" className="bg-white shadow-lg rounded-xl max-w-xl mx-auto mt-5 p-6 mb-10 border border-gray-200">
        {({ open }) => (
          <>
            <DisclosureButton
              className={classNames(
                "flex justify-between items-center w-full text-xl font-bold text-azuloscuro mb-4 pb-2 border-b border-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-rojo focus-visible:ring-opacity-75",
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
              {/* Asignatura */}
              <div className="mb-4">
                <label className="block font-medium mb-2 text-dark">Asignatura</label>
                <select
                  className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rojo"
                  value={asig}
                  onChange={e => setAsig(e.target.value)}
                >
                  <option value="">Todas las asignaturas</option>
                  {opcionesAsignaturas.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              {/* Conceptos */}
              <div className="mb-4">
                <label className="block font-medium mb-2 text-dark">Conceptos</label>
                <div className="flex flex-wrap gap-4 justify-center">
                  {conceptosDisponibles.map(concepto => (
                    <label key={concepto} className="flex items-center gap-2 text-sm text-gray-700">
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
                  <p className="text-sm text-gray-500 text-center mt-2">No hay conceptos para esta asignatura.</p>
                )}
                {!asig && (
                  <p className="text-sm text-gray-500 text-center mt-2">Selecciona una asignatura para ver los conceptos.</p>
                )}
              </div>

              {/* Nivel */}
              <div className="mb-4">
                <label className="block font-medium mb-2 text-dark">Nivel de dificultad ({nivel === 0 ? "Todos" : nivel})</label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={nivel}
                  onChange={(e) => setNivel(parseInt(e.target.value, 10))}
                  className="w-full accent-rojo"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Todos</span>
                  {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div className="flex justify-center items-center space-x-4 mt-6">
                <button
                  onClick={aplicarFiltros}
                  className="btn-secondary text-white bg-azul rounded-lg hover:bg-rojo transition-colors py-2 px-4"
                >
                  Aplicar filtros
                </button>
                {(filtrosActivos) && (
                  <button
                    onClick={limpiarFiltros}
                    className="btn text-white bg-azuloscuro rounded-lg hover:bg-rojo transition-colors py-2 px-4"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>

      {ejerciciosFiltrados.length === 0 && !filtrosActivos ? (
        <div className="mensaje-vacio text-center p-4 text-gray-600 mt-8">
          <p>Cargando ejercicios...</p>
        </div>
      ) : ejerciciosFiltrados.length === 0 && filtrosActivos ? (
        <div className="mensaje-vacio text-center p-4 text-gray-600 mt-8">
          <p>No se encontraron ejercicios con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto mt-8 border border-gray-200 shadow-md rounded-lg overflow-hidden">
          <div className="flex items-center bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">
            <div className="w-12 flex-shrink-0"></div>
            <div className="flex-1 min-w-0 px-4">Título</div>
            <div className="w-48 flex-shrink-0 px-4 hidden sm:block">Asignatura</div>
            <div className="w-48 flex-shrink-0 px-4 hidden md:block">Concepto</div>
            <div className="w-24 flex-shrink-0 text-center px-4">Nivel</div>
            <div className="w-20 flex-shrink-0 text-center px-4">Estado</div>
          </div>

          <div className="divide-y divide-gray-200">
            {ejerciciosFiltrados.map((ejercicio) => (
              <Disclosure as="div" key={ejercicio._id}>
                {({ open }) => (
                  <>
                    <div className="flex items-center w-full bg-white hover:bg-gray-50 transition-colors duration-150 pr-4">
                      <DisclosureButton className="flex-shrink-0 p-4 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-rojo">
                        <span className="sr-only">Ver detalles</span>
                        {open ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                        )}
                      </DisclosureButton>

                      <div
                        className="flex flex-1 items-center cursor-pointer py-4"
                        onClick={() => handleRowClick(ejercicio._id)}
                      >
                        <div className="flex-1 min-w-0 px-4">
                          <span className="font-semibold text-azuloscuro">{ejercicio.titulo}</span>
                        </div>
                        <div className="w-48 flex-shrink-0 px-4 hidden sm:block">{ejercicio.asignatura}</div>
                        <div className="w-48 flex-shrink-0 px-4 hidden md:block">{ejercicio.concepto}</div>
                      </div>

                      <div className="w-24 flex-shrink-0 text-center px-4">
                        {typeof ejercicio.nivel === 'number' && ejercicio.nivel >= 1 && ejercicio.nivel <= 5 ? (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-rojo rounded-full">
                            {ejercicio.nivel}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </div>

                      <div className="w-20 flex-shrink-0 text-center px-4">
                        {ejercicio.completado && (
                          <CheckIcon className="h-5 w-5 text-green-500" title="Ejercicio completado" />
                        )}
                      </div>
                    </div>

                    <DisclosurePanel as="div" className="bg-gray-50 px-6 py-4">
                      <div className="flex flex-col gap-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                        {ejercicio.enunciado && (
                          <div className="text-sm">
                            <h4 className="font-semibold text-gray-800 text-md mb-1">Enunciado:</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">{ejercicio.enunciado}</p>
                          </div>
                        )}

                        {ejercicio.fotoURL && (
                          <div className="text-sm">
                            <h4 className="font-semibold text-gray-800 text-md mb-1">Imagen del Ejercicio:</h4>
                            <img
                              src={ejercicio.fotoURL}
                              alt={`Enunciado del ejercicio ${ejercicio.titulo}`}
                              className="max-w-md h-auto rounded-md shadow-sm border border-gray-200 mx-auto"
                            />
                          </div>
                        )}
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