import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline"; // Importa XMarkIcon para cerrar el modal

const PALABRAS_CLAVE_FIN = ["Enhorabuena, esa es la respuesta correcta"];
// NOTA: <CheckIcon class="h-6 w-6 text-gray-500" /> estaba aquí suelto, lo he quitado ya que no parece parte del JSX renderizado.

export default function Interacciones() {
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [ejercicioActualId, setEjercicioActualId] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [currentInteraccionId, setCurrentInteraccionId] = useState(null);

  const [mostrarPanel, setMostrarPanel] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem("sidebarWidth");
    return savedWidth ? parseInt(savedWidth, 10) : 256;
  });
  const [isResizing, setIsResizing] = useState(false);

  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [sidebarInteractions, setSidebarInteractions] = useState([]);

  // --- Nuevo estado para el modal de la imagen ---
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [modalImageAlt, setModalImageAlt] = useState("");
  // --- Fin nuevo estado ---

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // --- MOCK userId (REEMPLAZA ESTO CON TU LÓGICA DE AUTENTICACIÓN REAL) ---
  const MOCK_USER_ID = "681cd8217918fbc4fc7a626f"; // Reemplaza con un ID de usuario válido de tu BBDD


  const finalizarEjercicioYRedirigir = useCallback(async (resueltoALaPrimera = false) => {
        const ejercicioActual = ejerciciosDisponibles.find(e => e._id === ejercicioActualId);
        if (!ejercicioActual?._id || !MOCK_USER_ID || !currentInteraccionId) {
            return navigate('/dashboard');
        }
        setTimeout(async () => {
            try {
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resultados/finalizar`, {
                    userId: MOCK_USER_ID,
                    exerciseId: ejercicioActual._id,
                    interaccionId: currentInteraccionId,
                    resueltoALaPrimera: resueltoALaPrimera,
                });
                navigate('/dashboard');
            } catch (error) {
                console.error("Error al finalizar el ejercicio:", error);
                navigate('/dashboard');
            }
        }, 2000);
    }, [ejercicioActualId, currentInteraccionId, navigate, ejerciciosDisponibles]);





  useEffect(() => {
    const fetchAndInitialize = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_BACKEND_URL + "/api/ejercicios");
        const ejercicios = res.data;
        setEjerciciosDisponibles(ejercicios);

        const queryParams = new URLSearchParams(location.search);
        const idFromUrl = queryParams.get("id"); // Este es el ID del EJERCICIO
        const interaccionIdFromUrl = queryParams.get("interaccionId"); // ID de interacción si viene de la URL

        const interaccionIdFromLocalStorage = localStorage.getItem("currentInteraccionId");
        const exerciseIdFromLocalStorage = localStorage.getItem("ejercicioActualId");

        let newCurrentExerciseId = null;
        let newCurrentInteraccionId = null;
        let loadedMessages = [];

        // --- Prioridad 1: Si hay un interaccionId en la URL, carga esa interacción ---
        if (interaccionIdFromUrl) {
          try {
            const interaccionRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccionIdFromUrl}`);
            newCurrentInteraccionId = interaccionRes.data._id;
            newCurrentExerciseId = interaccionRes.data.ejercicio_id;
            loadedMessages = interaccionRes.data.conversacion;
            console.log("Cargado por interaccionId en URL:", newCurrentInteraccionId);
          } catch (error) {
            console.warn("Interacción de la URL no encontrada o error al cargarla:", error);
            // Si falla, se ignora y se pasa a la siguiente lógica
          }
        }

        // --- Prioridad 2: Si no hay interaccionId en URL, pero hay en localStorage ---
        if (!newCurrentInteraccionId && interaccionIdFromLocalStorage) {
          try {
            const interaccionRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccionIdFromLocalStorage}`);
            newCurrentInteraccionId = interaccionRes.data._id;
            newCurrentExerciseId = interaccionRes.data.ejercicio_id;
            loadedMessages = interaccionRes.data.conversacion;
            console.log("Cargado por interaccionId en localStorage:", newCurrentInteraccionId);
          } catch (error) {
            console.warn("Interacción de localStorage no encontrada o error al cargarla:", error);
            localStorage.removeItem("currentInteraccionId"); // Limpiar interaccion inválida
            localStorage.removeItem("ejercicioActualId"); // Limpiar exerciseId asociado
          }
        }

        // --- Prioridad 3: Si no hay interaccionId, pero hay un ejercicioId en la URL ---
        // Intentar encontrar una interacción existente para ese ejercicio y usuario
        if (!newCurrentInteraccionId && idFromUrl && ejercicios.some(e => e._id === idFromUrl)) {
          try {
            const existingInteraccionRes = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/byExerciseAndUser/${idFromUrl}/${MOCK_USER_ID}`
            );
            if (existingInteraccionRes.data && existingInteraccionRes.data._id) {
              newCurrentInteraccionId = existingInteraccionRes.data._id;
              newCurrentExerciseId = idFromUrl;
              loadedMessages = existingInteraccionRes.data.conversacion;
              console.log("Cargado por exerciseId en URL (interacción existente):", newCurrentInteraccionId);
            } else {
              newCurrentExerciseId = idFromUrl;
              console.log("ExerciseId en URL, no hay interacción existente, se creará una nueva.");
            }
          } catch (error) {
            // Manejar específicamente el 200 con mensaje de "no encontrado" del backend
            if (error.response && error.response.status === 200 && error.response.data.message === "No se encontró interacción para este ejercicio y usuario.") {
              newCurrentExerciseId = idFromUrl;
              console.log("ExerciseId en URL, no hay interacción existente, se creará una nueva.");
            } else {
              console.error("Error al buscar interacción existente por exerciseId en URL:", error);
              newCurrentExerciseId = idFromUrl; // A pesar del error, seguimos con el ejercicio
            }
          }
        }

        // --- Prioridad 4: Si no hay interaccionId ni exerciseId en URL, pero hay exerciseId en localStorage ---
        // Intentar encontrar una interacción existente para ese ejercicio y usuario
        if (!newCurrentInteraccionId && !newCurrentExerciseId && exerciseIdFromLocalStorage && ejercicios.some(e => e._id === exerciseIdFromLocalStorage)) {
          try {
            const existingInteraccionRes = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/byExerciseAndUser/${exerciseIdFromLocalStorage}/${MOCK_USER_ID}`
            );
            if (existingInteraccionRes.data && existingInteraccionRes.data._id) {
              newCurrentInteraccionId = existingInteraccionRes.data._id;
              newCurrentExerciseId = exerciseIdFromLocalStorage;
              loadedMessages = existingInteraccionRes.data.conversacion;
              console.log("Cargado por exerciseId en localStorage (interacción existente):", newCurrentInteraccionId);
            } else {
              newCurrentExerciseId = exerciseIdFromLocalStorage;
              console.log("ExerciseId en localStorage, no hay interacción existente, se creará una nueva.");
            }
          } catch (error) {
            if (error.response && error.response.status === 200 && error.response.data.message === "No se encontró interacción para este ejercicio y usuario.") {
              newCurrentExerciseId = exerciseIdFromLocalStorage;
              console.log("ExerciseId en localStorage, no hay interacción existente, se creará una nueva.");
            } else {
              console.error("Error al buscar interacción existente por exerciseId en localStorage:", error);
              newCurrentExerciseId = exerciseIdFromLocalStorage; // A pesar del error, seguimos con el ejercicio
            }
          }
        }

        // Si al final de todo no tenemos un ejercicio actual, y hay ejercicios disponibles, selecciona el primero
        if (!newCurrentExerciseId && ejercicios.length > 0) {
          newCurrentExerciseId = ejercicios[0]._id;
          console.log("Ningún ejercicio o interacción cargada, seleccionando el primer ejercicio disponible.");
        }

        setEjercicioActualId(newCurrentExerciseId);
        setCurrentInteraccionId(newCurrentInteraccionId);
        setCurrentChatMessages(loadedMessages);

      } catch (err) {
        console.error("Error general cargando ejercicios o interacciones en la inicialización:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndInitialize();
  }, [location.search, MOCK_USER_ID]); // Dependencias: location.search y MOCK_USER_ID

  // Sincroniza el ID del ejercicio actual en localStorage y la URL.
  useEffect(() => {
    if (ejercicioActualId) {
      localStorage.setItem("ejercicioActualId", ejercicioActualId);
      const queryParams = new URLSearchParams(location.search);
      const idFromUrl = queryParams.get("id");
      // Evita navegar si el ID del ejercicio ya está en la URL
      if (idFromUrl !== ejercicioActualId) {
        navigate(`/interacciones?id=${ejercicioActualId}`, { replace: true });
      }
    } else {
      localStorage.removeItem("ejercicioActualId");
    }
  }, [ejercicioActualId, navigate, location.search]);

  // Sincroniza el ID de la interacción actual en localStorage
  useEffect(() => {
    if (currentInteraccionId) {
      localStorage.setItem("currentInteraccionId", currentInteraccionId);
    } else {
      localStorage.removeItem("currentInteraccionId");
    }
  }, [currentInteraccionId]);

  // Sincroniza el ancho de la barra lateral en localStorage
  useEffect(() => {
    localStorage.setItem("sidebarWidth", sidebarWidth.toString());
  }, [sidebarWidth]);

  // --- Lógica de redimensionamiento de la barra lateral ---
  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resizeSidebar = useCallback((e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 400) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resizeSidebar);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resizeSidebar, stopResizing]);

  // --- Derivación de estado con useMemo para optimización ---
  const ejercicioActual = useMemo(() =>
    ejerciciosDisponibles.find(e => e._id === ejercicioActualId),
    [ejerciciosDisponibles, ejercicioActualId]
  );

  const fetchSidebarInteractions = useCallback(async () => {
    if (!MOCK_USER_ID || ejerciciosDisponibles.length === 0) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interacciones/user/${MOCK_USER_ID}`);
      const interactionsWithDetails = res.data.map(interaccion => {
        const ejercicio = ejerciciosDisponibles.find(e => e._id === interaccion.ejercicio_id);
        const titulo = ejercicio ? ejercicio.titulo : `Ejercicio Desconocido (${interaccion.ejercicio_id})`;
        const concepto = ejercicio ? ejercicio.concepto : 'Desconocido'; // Get concept
        const nivel = ejercicio ? ejercicio.nivel : 'Desconocido';     // Get level
        return {
          id: interaccion._id,
          ejercicioId: interaccion.ejercicio_id,
          titulo: titulo,
          concepto: concepto, // Add concept
          nivel: nivel,       // Add level
        };
      });
      setSidebarInteractions(interactionsWithDetails);
    } catch (error) {
      console.error("Error cargando interacciones para el sidebar:", error);
      setSidebarInteractions([]);
    }
  }, [ejerciciosDisponibles, MOCK_USER_ID]);

  useEffect(() => {
    if (!loading && ejerciciosDisponibles.length > 0) {
      fetchSidebarInteractions();
    }
  }, [loading, ejerciciosDisponibles, MOCK_USER_ID, currentInteraccionId, fetchSidebarInteractions]);

  // Scroll al final del chat cuando los mensajes cambian
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChatMessages]);

  // --- Funciones ---

  const enviarMensaje = async () => {
        const ejercicioActual = ejerciciosDisponibles.find(e => e._id === ejercicioActualId);
        if (!nuevoMensaje.trim() || !ejercicioActual || isSendingMessage) return;
        
        setIsSendingMessage(true);
        const userMessageContent = nuevoMensaje.trim();
        setCurrentChatMessages(prev => [...prev, { role: "user", content: userMessageContent }]);
        setNuevoMensaje("");

        try {
            const esPrimerMensaje = !currentInteraccionId;
            let response;

            if (esPrimerMensaje) {
                response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ollama/chat/start-exercise`, { userId: MOCK_USER_ID, exerciseId: ejercicioActual._id, userMessage: userMessageContent });
                setCurrentInteraccionId(response.data.interaccionId);
                fetchSidebarInteractions();
            } else {
                response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ollama/chat/message`, { interaccionId: currentInteraccionId, userMessage: userMessageContent });
            }
            
            const { fullHistory } = response.data;
            setCurrentChatMessages(fullHistory);

            if (fullHistory?.length > 0) {
                // Convertimos a minúsculas y quitamos puntos para que sea más robusto
                const ultimoMensajeTutor = fullHistory[fullHistory.length - 1].content.toLowerCase().replace('.', '');
                const ejercicioTerminado = PALABRAS_CLAVE_FIN.some(keyword => ultimoMensajeTutor.includes(keyword));

                if (ejercicioTerminado) {
                    await finalizarEjercicioYRedirigir(esPrimerMensaje);
                }
            }
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
            setCurrentChatMessages(prev => [...prev, { role: "assistant", content: "Error: No se pudo conectar con el tutor." }]);
        } finally {
            setIsSendingMessage(false);
        }
    };


  const seleccionarInteraccion = useCallback(async (interaccion) => {
    setEjercicioActualId(interaccion.ejercicioId);
    setModoSeleccion(false);
    setCurrentInteraccionId(interaccion.id);
    setLoading(true);

    try {
      const interaccionRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccion.id}`);
      setCurrentChatMessages(interaccionRes.data.conversacion);
      navigate(`/interacciones?id=${interaccion.ejercicioId}&interaccionId=${interaccion.id}`, { replace: true });
    } catch (error) {
      console.error("Error al cargar interacción específica del sidebar:", error);
      alert("No se pudo cargar la conversación. Puede que haya sido eliminada.");
      // Fallback: clear current interaction and try to load default or first exercise
      setCurrentInteraccionId(null);
      setCurrentChatMessages([]);
      // Attempt to re-initialize to a valid state
      if (ejerciciosDisponibles.length > 0) {
        seleccionarEjercicio(ejerciciosDisponibles[0]._id);
      } else {
        navigate("/interacciones", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [MOCK_USER_ID, ejerciciosDisponibles, navigate]);

  const seleccionarEjercicio = useCallback(async (id) => {
    setEjercicioActualId(id);
    setModoSeleccion(false);
    setCurrentInteraccionId(null); // Resetear interaccionId al cambiar de ejercicio
    setCurrentChatMessages([]); // Limpiar mensajes del chat anterior
    setLoading(true); // Mostrar loading mientras se busca la interacción

    try {
      const existingInteraccionRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/byExerciseAndUser/${id}/${MOCK_USER_ID}`
      );

      if (existingInteraccionRes.data && existingInteraccionRes.data._id) {
        setCurrentInteraccionId(existingInteraccionRes.data._id);
        setCurrentChatMessages(existingInteraccionRes.data.conversacion);
        console.log("Cargando interacción existente:", existingInteraccionRes.data._id);
        navigate(`/interacciones?id=${id}&interaccionId=${existingInteraccionRes.data._id}`, { replace: true });
      } else {
        console.log("No existe interacción para este ejercicio. Se creará una nueva al enviar el primer mensaje.");
        navigate(`/interacciones?id=${id}`, { replace: true });
      }
    } catch (error) {
      if (error.response && error.response.status === 200 && error.response.data.message === "No se encontró interacción para este ejercicio y usuario.") {
        console.log("No hay interacción previa para este ejercicio y usuario.");
        navigate(`/interacciones?id=${id}`, { replace: true });
      } else {
        console.error("Error al buscar interacción existente:", error);
        // Even if there's an error, we set the exercise and allow starting a new interaction
        navigate(`/interacciones?id=${id}`, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [MOCK_USER_ID, navigate]);

  const borrarInteraccion = useCallback(async (interaccionIdToDelete) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta interacción? Esto la borrará permanentemente.")) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccionIdToDelete}`);
      console.log("Interacción eliminada del backend:", interaccionIdToDelete);

      await fetchSidebarInteractions(); // Refrescar la lista de interacciones del sidebar

      if (currentInteraccionId === interaccionIdToDelete) {
        setCurrentInteraccionId(null);
        setCurrentChatMessages([]);
        setEjercicioActualId(null); // Clear current exercise as well

        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interacciones/user/${MOCK_USER_ID}`);
        const updatedInteractions = res.data;

        if (updatedInteractions.length > 0) {
          const firstAvailableInteraccion = updatedInteractions[0];
          // Use the `seleccionarInteraccion` or `seleccionarEjercicio` for proper state update and navigation
          seleccionarInteraccion(firstAvailableInteraccion);
        } else if (ejerciciosDisponibles.length > 0) {
          seleccionarEjercicio(ejerciciosDisponibles[0]._id);
        } else {
          navigate("/interacciones", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error al borrar interacción:", error);
      alert("Error al eliminar la interacción. Inténtalo de nuevo.");
    }
  }, [currentInteraccionId, ejerciciosDisponibles, navigate, seleccionarEjercicio, seleccionarInteraccion, MOCK_USER_ID, fetchSidebarInteractions]);

  // --- Función para abrir el modal de imagen ---
  const openImageModal = useCallback((imageUrl, imageAlt) => {
    setModalImageUrl(imageUrl);
    setModalImageAlt(imageAlt);
    setShowImageModal(true);
  }, []);

  // --- Función para cerrar el modal de imagen ---
  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageUrl("");
    setModalImageAlt("");
  }, []);


  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600 text-lg">
        Cargando ejercicios e historial...
      </div>
    );
  }

  if (!ejercicioActualId && ejerciciosDisponibles.length === 0) {
    return (
      <div className="p-10 text-center text-gray-600 text-lg">
        <p className="mb-4">No hay ejercicios disponibles para seleccionar. Por favor, asegúrate de que el backend está funcionando y tiene ejercicios.</p>
      </div>
    );
  }

  // Handle the case where ejercicioActualId is null but there are available exercises
  if (!ejercicioActualId && ejerciciosDisponibles.length > 0) {
    return (
      <div className="p-10 text-center text-gray-600 text-lg">
        <p className="mb-4">¡Bienvenido! Para empezar, selecciona un ejercicio:</p>
        <ul className="grid gap-2 max-w-md mx-auto">
          {ejerciciosDisponibles.map((e) => (
            <li
              key={e._id}
              onClick={() => seleccionarEjercicio(e._id)}
              className="p-2 rounded bg-white hover:bg-gray-200 cursor-pointer text-sm shadow-sm"
            >
              <div>{e.titulo}</div>
              <p className="italic text-red-500 text-xs">{e.concepto} - Nivel: {e.nivel}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }


  return (
    <div className="interacciones flex h-screen relative">
      {mostrarPanel && (
        <aside
          className="panel-interacciones bg-gray-100 p-4 border-r overflow-y-auto flex flex-col relative"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="panel-header flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Interacciones</h2>
            <button
              className="btn-mas text-2xl font-bold text-gray-600 hover:text-gray-900"
              title="Nueva interacción / Seleccionar ejercicio"
              onClick={() => {
                setModoSeleccion(!modoSeleccion);
                if (modoSeleccion) { // Si estamos saliendo del modo selección, refrescamos el sidebar por si se creó una nueva
                  fetchSidebarInteractions();
                }
              }}
            >
              ＋
            </button>
          </div>

          {modoSeleccion ? (
            <ul className="lista-ejercicios space-y-2 flex-1 overflow-y-auto">
              {ejerciciosDisponibles.map((e) => (
                <li
                  key={e._id}
                  onClick={() => seleccionarEjercicio(e._id)}
                  className="item-ejercicio p-2 rounded bg-white hover:bg-gray-200 cursor-pointer text-sm shadow-sm"
                >
                  <div>{e.titulo}</div>
                  <p className="italic text-red-500 text-xs">{e.concepto} - Nivel: {e.nivel}</p>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="lista-interacciones space-y-2 flex-1 overflow-y-auto">
              {sidebarInteractions.length > 0 ? (
                sidebarInteractions.map((i) => (
                  <li
                    key={i.id}
                    className={`item-ejercicio flex justify-between items-center p-2 rounded bg-white cursor-pointer text-sm shadow-sm ${i.id === currentInteraccionId ? "bg-red-100 border-l-4 border-red-500" : ""}`}
                    onClick={() => seleccionarInteraccion(i)} // Use the new handler for interactions
                  >
                    <div className="flex-1 mr-2">
                      <div>{i.titulo}</div>
                      <p className="italic text-red-500 text-xs">{i.concepto} - Nivel: {i.nivel}</p> {/* Added concept and level */}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        borrarInteraccion(i.id);
                      }}
                      className="ml-2 icon-button hover:text-red-700 p-1 rounded-full transition-colors"
                      title="Eliminar interacción"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm mt-4">
                  No hay interacciones guardadas. ¡Selecciona un ejercicio para empezar!
                </p>
              )}
            </ul>
          )}

          <div
            className="resizer absolute top-0 bottom-0 right-0 w-2 cursor-col-resize bg-gray-300 hover:bg-gray-400 z-10"
            onMouseDown={startResizing}
          ></div>
        </aside>
      )}

      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className={`fixed top-1/2 -translate-y-1/2 p-2 rounded-r-lg bg-gray-200 hover:bg-gray-300 shadow-md z-20 transition-all duration-300
          ${mostrarPanel ? 'left-[var(--sidebar-width)] ml-[-12px]' : 'left-0'}`}
        style={{ '--sidebar-width': `${sidebarWidth}px` }}
        title={mostrarPanel ? "Contraer panel" : "Expandir panel"}
      >
        {mostrarPanel ? "‹" : "›"}
      </button>

      <main className="chat-main flex-1 flex flex-col bg-white overflow-hidden">
        <div className="chat-header p-4 border-b flex items-center bg-gray-50">
          {/* Imagen del ejercicio con onClick para abrir el modal */}
          <img
            src={ejercicioActual.imagen ? `${import.meta.env.VITE_BACKEND_URL}/static/${ejercicioActual.imagen}` : '/placeholder-ejercicio.png'}
            alt={ejercicioActual.titulo || "Ejercicio"}
            className="chat-img w-16 h-16 rounded-full mr-4 object-cover cursor-pointer hover:scale-110 transition-transform duration-200" // Added cursor and hover effect
            onClick={() => openImageModal(
              ejercicioActual.imagen ? `${import.meta.env.VITE_BACKEND_URL}/static/${ejercicioActual.imagen}` : '/placeholder-ejercicio.png',
              ejercicioActual.titulo || "Ejercicio"
            )}
          />
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-start mb-1">
              <h3 className="chat-titulo text-xl font-bold">{ejercicioActual.titulo}</h3>
            </div>
            <p className="chat-enunciado text-gray-700 text-sm">{ejercicioActual.enunciado}</p>
          </div>
        </div>

        <div className="chat-cuerpo flex-1 flex flex-col p-4 overflow-hidden">
          <div ref={scrollRef} className="chat-mensajes flex-1 overflow-y-auto space-y-3 p-2">
            {currentChatMessages.length > 0 ? (
              currentChatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`mensaje max-w-[70%] p-3 rounded-lg ${m.role === "user" ? "mensaje-usuario bg-blue-500 text-white ml-auto" : "mensaje-sistema bg-gray-200 text-gray-800 mr-auto"}`}
                >
                  {m.content}
                </div>
              ))
            ) : (
              <p className="mensaje-vacio text-center text-gray-500 mt-10">
                No hay mensajes aún. ¡Escribe el primero para empezar a chatear con el tutor!
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
            className="chat-input flex items-center mt-4 border-t pt-4"
          >
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder={isSendingMessage ? "Pensando..." : "Escribe tu mensaje..."}
              className="input-mensaje flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSendingMessage || !ejercicioActualId}
            />
            <button
              type="submit"
              className="btn-enviar bg-green-500 text-white px-5 py-3 ml-3 rounded-lg hover:bg-green-600 transition-colors"
              disabled={isSendingMessage || !nuevoMensaje.trim() || !ejercicioActualId}
            >
              {isSendingMessage ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>
      </main>

      {/* --- Modal para ver la imagen en grande --- */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeImageModal} // Cierra el modal al hacer clic fuera de la imagen
        >
          <div className="relative p-4 max-w-screen-lg max-h-screen-lg flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 z-50"
              title="Cerrar"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img
              src={modalImageUrl}
              alt={modalImageAlt}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
      {/* --- Fin Modal --- */}
    </div>
  );
}