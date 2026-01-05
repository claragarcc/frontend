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
    
    // --- ESTADO AÑADIDO: Para guardar los IDs de los ejercicios que el usuario ya ha completado ---
    const [completedIds, setCompletedIds] = useState(new Set());
    
    const API = import.meta.env.VITE_BACKEND_URL;
    // Este ID debe coincidir con el que usas en Interacciones.jsx para que los datos sean consistentes
    const MOCK_USER_ID = "681cd8217918fbc4fc7a626f";

    // --- ESTADOS Y LÓGICA DE FILTRADO (Tu código original) ---
    const [asig, setAsig] = useState("");
    const [conceptosSeleccionados, setConceptosSeleccionados] = useState([]);
    const [nivel, setNivel] = useState(0);

    const opcionesAsignaturas = ["Dispositivos electrónicos", "Teoría de circuitos"];
    const conceptosPorAsignatura = {
        "Dispositivos electrónicos": ["Ley de Ohm","Polarización", "Semiconductores"],
        "Teoría de circuitos": [ "Norton", "Thevenin"]
    };

    const conceptosDisponibles = useMemo(() => {
        return asig ? conceptosPorAsignatura[asig] || [] : [];
    }, [asig]);

    const isInitialMount = useRef(true);

    // --- EFECTO MODIFICADO: Ahora carga tanto la lista de ejercicios como el estado de completado ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hacemos las dos llamadas a la API en paralelo para más eficiencia
                const [ejerciciosRes, completedRes] = await Promise.all([
                    axios.get(`${API}/api/ejercicios`),
                    axios.get(`${API}/api/resultados/completed/${MOCK_USER_ID}`) // Nueva llamada a la API
                ]);

                const ejerciciosLimpios = (ejerciciosRes.data || []).map(ej => ({
                    ...ej,
                    nivel: parseInt(ej.nivel, 10) || 0
                }));

                setAllEjercicios(ejerciciosLimpios);
                setCompletedIds(new Set(completedRes.data || [])); // Guardamos los IDs de ejercicios completados

            } catch (err) {
                console.error("Error al obtener los datos de la página de ejercicios:", err);
            }
        };
        fetchData();
    }, [API, MOCK_USER_ID]);

    // EFECTO para sincronizar filtros desde la URL o localStorage (Tu código original)
    useEffect(() => {
        const queryParams = new URLSearchParams(search);
        let loadedAsig = queryParams.get("asig") || "";
        let loadedConceptosRaw = queryParams.get("conceptos");
        let loadedNivel = parseInt(queryParams.get("nivel"), 10) || 0;

        if (!isInitialMount.current && asig !== loadedAsig) {
            setConceptosSeleccionados([]);
        }

        setAsig(loadedAsig);
        if(loadedConceptosRaw) {
            const validConcepts = conceptosPorAsignatura[loadedAsig] || [];
            setConceptosSeleccionados(loadedConceptosRaw.split(",").filter(c => validConcepts.includes(c)));
        } else if (isInitialMount.current === false) {
             setConceptosSeleccionados([]);
        }
        setNivel(loadedNivel);
        
        if (isInitialMount.current) {
            isInitialMount.current = false;
        }

    }, [search]);
    
    const toggleConcepto = (c) => {
        setConceptosSeleccionados(prev =>
            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
        );
    };

    const aplicarFiltros = useCallback(() => {
        const query = new URLSearchParams();
        const currentFilters = { asig, conceptos: conceptosSeleccionados, nivel };

        if (asig) { query.set("asig", asig); }
        if (conceptosSeleccionados.length > 0) { query.set("conceptos", conceptosSeleccionados.join(",")); }
        if (nivel > 0) { query.set("nivel", nivel.toString()); }

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
        return allEjercicios.filter(ejercicio => {
            if (asig && ejercicio.asignatura !== asig) return false;
            if (conceptosSeleccionados.length > 0 && !conceptosSeleccionados.includes(ejercicio.concepto)) return false;
            if (nivel > 0 && ejercicio.nivel != nivel) return false;
            return true;
        });
    }, [allEjercicios, asig, conceptosSeleccionados, nivel]);

    const filtrosActivos = useMemo(() => asig !== "" || conceptosSeleccionados.length > 0 || nivel > 0, [asig, conceptosSeleccionados, nivel]);
    const handleRowClick = useCallback((ejercicioId) => navigate(`/interacciones?id=${ejercicioId}`), [navigate]);

    return (
        <div className="busqueda p-4">
            <h2 className="titulo centrado text-2xl font-semibold mb-6">
                {filtrosActivos ? "Ejercicios filtrados" : "Todos los ejercicios"}
            </h2>

            <Disclosure as="div" className="bg-white shadow-lg rounded-xl max-w-xl mx-auto mt-5 p-6 mb-10 border border-gray-200">
                {({ open }) => (
                    <>
                        <DisclosureButton className={classNames("flex justify-between items-center w-full text-xl font-semibold text-azuloscuro mb-4 pb-2 border-b border-gray-200", filtrosActivos ? "text-rojo" : "hover:text-rojo")}>
                            <span><MagnifyingGlassIcon className="h-6 w-6 inline-block mr-2" />Filtrar</span>
                            {open ? <ChevronUpIcon className="h-6 w-6 text-gray-500" /> : <ChevronDownIcon className="h-6 w-6 text-gray-500" />}
                        </DisclosureButton>
                        <DisclosurePanel className="pt-2">
                            <div className="mb-4">
                                <label className="block font-medium mb-2 text-dark">Asignatura</label>
                                <select className="w-full p-2 rounded border border-gray-300" value={asig} onChange={e => setAsig(e.target.value)}>
                                    <option value="">Todas las asignaturas</option>
                                    {opcionesAsignaturas.map(op => <option key={op} value={op}>{op}</option>)}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block font-medium mb-2 text-dark">Conceptos</label>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    {conceptosDisponibles.map(concepto => (
                                        <label key={concepto} className="flex items-center gap-2 text-sm text-gray-700">
                                            <input type="checkbox" checked={conceptosSeleccionados.includes(concepto)} onChange={() => toggleConcepto(concepto)} className="form-checkbox h-4 w-4 text-rojo rounded" />
                                            {concepto}
                                        </label>
                                    ))}
                                </div>
                                {conceptosDisponibles.length === 0 && asig && <p className="text-sm text-gray-500 text-center mt-2">No hay conceptos para esta asignatura.</p>}
                                {!asig && <p className="text-sm text-gray-500 text-center mt-2">Selecciona una asignatura para ver los conceptos.</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block font-medium mb-2 text-dark">Nivel de dificultad ({nivel === 0 ? "Todos" : nivel})</label>
                                <input type="range" min={0} max={5} value={nivel} onChange={(e) => setNivel(parseInt(e.target.value))} className="w-full accent-rojo" />
                                <div className="flex justify-between text-sm text-gray-500 mt-1">
                                    <span>Todos</span>
                                    {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
                                </div>
                            </div>
                            <div className="flex justify-center items-center space-x-4 mt-6">
                                <button onClick={aplicarFiltros} className="btn-secondary text-white bg-azul rounded-lg hover:bg-rojo transition-colors py-2 px-4">Aplicar filtros</button>
                                {filtrosActivos && <button onClick={limpiarFiltros} className="btn-secondary text-white bg-azuloscuro rounded-lg hover:bg-rojo transition-colors py-2 px-4">Limpiar filtros</button>}
                            </div>
                        </DisclosurePanel>
                    </>
                )}
            </Disclosure>

            {ejerciciosFiltrados.length === 0 ? (
                <div className="mensaje-vacio text-center p-4 text-gray-600 mt-8">
                    <p>{filtrosActivos ? "No se encontraron ejercicios con los filtros seleccionados." : "Cargando ejercicios..."}</p>
                </div>
            ) : (
                <div className="w-full max-w-4xl mx-auto mt-8 border border-gray-200 shadow-md rounded-lg overflow-hidden">
                    <div className="flex items-center bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider px-4 py-3">
                        <div className="w-12 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 px-4">Título</div>
                        <div className="w-48 flex-shrink-0 px-4 hidden sm:block">Asignatura</div>
                        <div className="w-48 flex-shrink-0 px-4 hidden md:block">Concepto</div>
                        <div className="w-24 flex-shrink-0 text-center px-4">Nivel</div>
                        <div className="w-20 flex-shrink-0 text-center px-4"></div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {ejerciciosFiltrados.map((ejercicio) => (
                            <Disclosure as="div" key={ejercicio._id}>
                                {({ open }) => (
                                    <>
                                        <div className="flex items-center w-full bg-white hover:bg-gray-50 transition-colors duration-150 pr-4">
                                            <DisclosureButton className="flex-shrink-0 p-4 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-rojo">
                                                <span className="sr-only">Ver detalles</span>
                                                {open ? <ChevronUpIcon className="h-5 w-5 text-gray-600" /> : <ChevronDownIcon className="h-5 w-5 text-gray-600" />}
                                            </DisclosureButton>
                                            <div className="flex flex-1 items-center cursor-pointer py-4" onClick={() => handleRowClick(ejercicio._id)}>
                                                <div className="flex-1 min-w-0 px-4"><span className="font-semibold text-azuloscuro">{ejercicio.titulo}</span></div>
                                                <div className="w-48 flex-shrink-0 px-4 hidden sm:block">{ejercicio.asignatura}</div>
                                                <div className="w-48 flex-shrink-0 px-4 hidden md:block">{ejercicio.concepto}</div>
                                            </div>
                                            <div className="w-24 flex-shrink-0 text-center px-4">
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-black bg-rojo rounded-full">{ejercicio.nivel}</span>
                                            </div>
                                            {/* --- ESTA ES LA LÍNEA MODIFICADA --- */}
                                            <div className="w-20 flex-shrink-0 text-center px-4">
                                                {completedIds.has(ejercicio._id) && (
                                                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" title="Ejercicio completado" />
                                                )}
                                            </div>
                                        </div>
                                        <DisclosurePanel as="div" className="bg-gray-50 px-6 py-4">
                                            <div className="flex flex-col gap-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                                                {ejercicio.enunciado && <div className="text-sm"><h4 className="font-semibold text-gray-800 text-md mb-1">Enunciado:</h4><p className="text-gray-700 whitespace-pre-wrap">{ejercicio.enunciado}</p></div>}
                                                {ejercicio.imagen && <div className="text-sm mt-4"><h4 className="font-semibold text-gray-800 text-md mb-1">Imagen del Ejercicio:</h4><img src={`${API}/static/${ejercicio.imagen}`} alt={`Enunciado del ejercicio ${ejercicio.titulo}`} className="max-w-md h-auto rounded-md shadow-sm border border-gray-200 mx-auto"/></div>}
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