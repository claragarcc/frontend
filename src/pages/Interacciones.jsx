import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

const PALABRAS_CLAVE_FIN = ["Enhorabuena, esa es la respuesta correcta"];

export default function Interacciones() {
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [ejercicioActualId, setEjercicioActualId] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [currentInteraccionId, setCurrentInteraccionId] = useState(null);

  const [mostrarPanel, setMostrarPanel] = useState(true);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem("sidebarWidth");
    return savedWidth ? parseInt(savedWidth, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [sidebarInteractions, setSidebarInteractions] = useState([]);

  // ✅ “Nuevo chat” (panel del +)
  const [showPlusPanel, setShowPlusPanel] = useState(false);
  const [queryEj, setQueryEj] = useState("");

  // Modal imagen
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [modalImageAlt, setModalImageAlt] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // ⚠️ MOCK: sustituir por tu auth real
  const MOCK_USER_ID = "681cd8217918fbc4fc7a626f";

  const isMobile = useCallback(() => {
    return typeof window !== "undefined" && window.innerWidth <= 640;
  }, []);

  const ejercicioActual = useMemo(() => {
    return ejerciciosDisponibles.find((e) => e._id === ejercicioActualId) || null;
  }, [ejerciciosDisponibles, ejercicioActualId]);

  const ejerciciosFiltrados = useMemo(() => {
    const q = queryEj.trim().toLowerCase();
    if (!q) return ejerciciosDisponibles;
    return ejerciciosDisponibles.filter((e) => {
      const titulo = (e.titulo || "").toLowerCase();
      const concepto = (e.concepto || "").toLowerCase();
      const nivel = String(e.nivel || "").toLowerCase();
      return titulo.includes(q) || concepto.includes(q) || nivel.includes(q);
    });
  }, [queryEj, ejerciciosDisponibles]);

  const openImageModal = useCallback((imageUrl, imageAlt) => {
    setModalImageUrl(imageUrl);
    setModalImageAlt(imageAlt);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageUrl("");
    setModalImageAlt("");
  }, []);

  // ===== Resize sidebar =====
  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resizeSidebar = useCallback(
    (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 220 && newWidth < 460) setSidebarWidth(newWidth);
    },
    [isResizing]
  );

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

  useEffect(() => {
    localStorage.setItem("sidebarWidth", sidebarWidth.toString());
  }, [sidebarWidth]);

  // Scroll al final del chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChatMessages]);

  const fetchSidebarInteractions = useCallback(async () => {
    if (!MOCK_USER_ID || ejerciciosDisponibles.length === 0) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/user/${MOCK_USER_ID}`
      );

      const interactionsWithDetails = (res.data || []).map((interaccion) => {
        const ej = ejerciciosDisponibles.find((e) => e._id === interaccion.ejercicio_id);
        return {
          id: interaccion._id,
          ejercicioId: interaccion.ejercicio_id,
          titulo: ej ? ej.titulo : `Ejercicio desconocido (${interaccion.ejercicio_id})`,
          concepto: ej ? ej.concepto : "Desconocido",
          nivel: ej ? ej.nivel : "Desconocido",
        };
      });

      setSidebarInteractions(interactionsWithDetails);
    } catch (error) {
      console.error("Error cargando interacciones para el sidebar:", error);
      setSidebarInteractions([]);
    }
  }, [ejerciciosDisponibles, MOCK_USER_ID]);

  const finalizarEjercicioYRedirigir = useCallback(
    async (resueltoALaPrimera = false) => {
      const ej = ejerciciosDisponibles.find((e) => e._id === ejercicioActualId);
      if (!ej?._id || !MOCK_USER_ID || !currentInteraccionId) {
        return navigate("/dashboard");
      }

      setTimeout(async () => {
        try {
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/resultados/finalizar`, {
            userId: MOCK_USER_ID,
            exerciseId: ej._id,
            interaccionId: currentInteraccionId,
            resueltoALaPrimera,
          });
          navigate("/dashboard");
        } catch (error) {
          console.error("Error al finalizar el ejercicio:", error);
          navigate("/dashboard");
        }
      }, 2000);
    },
    [ejercicioActualId, currentInteraccionId, navigate, ejerciciosDisponibles]
  );

  // ===== Inicialización (URL / localStorage / fallback) =====
  useEffect(() => {
    const fetchAndInitialize = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_BACKEND_URL + "/api/ejercicios");
        const ejercicios = res.data || [];
        setEjerciciosDisponibles(ejercicios);

        const queryParams = new URLSearchParams(location.search);
        const idFromUrl = queryParams.get("id");
        const interaccionIdFromUrl = queryParams.get("interaccionId");

        const interaccionIdFromLocalStorage = localStorage.getItem("currentInteraccionId");
        const exerciseIdFromLocalStorage = localStorage.getItem("ejercicioActualId");

        let newCurrentExerciseId = null;
        let newCurrentInteraccionId = null;
        let loadedMessages = [];

        // 1) interaccionId en URL
        if (interaccionIdFromUrl) {
          try {
            const interaccionRes = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccionIdFromUrl}`
            );
            newCurrentInteraccionId = interaccionRes.data._id;
            newCurrentExerciseId = interaccionRes.data.ejercicio_id;
            loadedMessages = interaccionRes.data.conversacion || [];
          } catch (error) {
            console.warn("Interacción URL inválida:", error);
          }
        }

        // 2) interaccionId en localStorage
        if (!newCurrentInteraccionId && interaccionIdFromLocalStorage) {
          try {
            const interaccionRes = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccionIdFromLocalStorage}`
            );
            newCurrentInteraccionId = interaccionRes.data._id;
            newCurrentExerciseId = interaccionRes.data.ejercicio_id;
            loadedMessages = interaccionRes.data.conversacion || [];
          } catch (error) {
            console.warn("Interacción localStorage inválida:", error);
            localStorage.removeItem("currentInteraccionId");
            localStorage.removeItem("ejercicioActualId");
          }
        }

        // 3) exerciseId en URL → busca interacción existente
        if (!newCurrentInteraccionId && idFromUrl && ejercicios.some((e) => e._id === idFromUrl)) {
          try {
            const existing = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/byExerciseAndUser/${idFromUrl}/${MOCK_USER_ID}`
            );
            if (existing.data && existing.data._id) {
              newCurrentInteraccionId = existing.data._id;
              newCurrentExerciseId = idFromUrl;
              loadedMessages = existing.data.conversacion || [];
            } else {
              newCurrentExerciseId = idFromUrl;
            }
          } catch {
            newCurrentExerciseId = idFromUrl;
          }
        }

        // 4) exerciseId en localStorage
        if (
          !newCurrentInteraccionId &&
          !newCurrentExerciseId &&
          exerciseIdFromLocalStorage &&
          ejercicios.some((e) => e._id === exerciseIdFromLocalStorage)
        ) {
          try {
            const existing = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/byExerciseAndUser/${exerciseIdFromLocalStorage}/${MOCK_USER_ID}`
            );
            if (existing.data && existing.data._id) {
              newCurrentInteraccionId = existing.data._id;
              newCurrentExerciseId = exerciseIdFromLocalStorage;
              loadedMessages = existing.data.conversacion || [];
            } else {
              newCurrentExerciseId = exerciseIdFromLocalStorage;
            }
          } catch {
            newCurrentExerciseId = exerciseIdFromLocalStorage;
          }
        }

        // Fallback: primer ejercicio
        if (!newCurrentExerciseId && ejercicios.length > 0) {
          newCurrentExerciseId = ejercicios[0]._id;
        }

        setEjercicioActualId(newCurrentExerciseId);
        setCurrentInteraccionId(newCurrentInteraccionId);
        setCurrentChatMessages(loadedMessages);
      } catch (err) {
        console.error("Error general cargando ejercicios/interacciones:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndInitialize();
  }, [location.search, MOCK_USER_ID]);

  // Persist ejercicioActualId en localStorage y URL
  useEffect(() => {
    if (!ejercicioActualId) return;

    localStorage.setItem("ejercicioActualId", ejercicioActualId);

    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get("id");
    if (idFromUrl !== ejercicioActualId) {
      navigate(`/interacciones?id=${ejercicioActualId}`, { replace: true });
    }
  }, [ejercicioActualId, navigate, location.search]);

  // Persist currentInteraccionId
  useEffect(() => {
    if (currentInteraccionId) localStorage.setItem("currentInteraccionId", currentInteraccionId);
    else localStorage.removeItem("currentInteraccionId");
  }, [currentInteraccionId]);

  // Refresca sidebar cuando ya hay ejercicios
  useEffect(() => {
    if (!loading && ejerciciosDisponibles.length > 0) {
      fetchSidebarInteractions();
    }
  }, [loading, ejerciciosDisponibles, currentInteraccionId, fetchSidebarInteractions]);

  // ===== Acciones =====

  const seleccionarInteraccion = useCallback(
    async (interaccion) => {
      setEjercicioActualId(interaccion.ejercicioId);
      setCurrentInteraccionId(interaccion.id);
      setLoading(true);
      setShowPlusPanel(false);

      try {
        const interaccionRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccion.id}`
        );
        setCurrentChatMessages(interaccionRes.data.conversacion || []);
        navigate(`/interacciones?id=${interaccion.ejercicioId}&interaccionId=${interaccion.id}`, {
          replace: true,
        });

        // ✅ MODO MÓVIL tipo WhatsApp: al entrar al chat, colapsa lista
        if (isMobile()) setMostrarPanel(false);
      } catch (error) {
        console.error("Error al cargar interacción del sidebar:", error);
        alert("No se pudo cargar la conversación. Puede que haya sido eliminada.");
        setCurrentInteraccionId(null);
        setCurrentChatMessages([]);
        navigate(`/interacciones?id=${interaccion.ejercicioId}`, { replace: true });
      } finally {
        setLoading(false);
      }
    },
    [navigate, isMobile]
  );

  const borrarInteraccion = useCallback(
    async (interaccionIdToDelete) => {
      if (!window.confirm("¿Eliminar esta interacción? Se borrará permanentemente.")) return;

      try {
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/interacciones/${interaccionIdToDelete}`
        );

        await fetchSidebarInteractions();

        if (currentInteraccionId === interaccionIdToDelete) {
          setCurrentInteraccionId(null);
          setCurrentChatMessages([]);
          navigate(`/interacciones?id=${ejercicioActualId}`, { replace: true });
        }
      } catch (error) {
        console.error("Error al borrar interacción:", error);
        alert("No se pudo eliminar la interacción. Inténtalo de nuevo.");
      }
    },
    [currentInteraccionId, ejercicioActualId, fetchSidebarInteractions, navigate]
  );

  const startNewChatWithExercise = useCallback(
    (exerciseId) => {
      setEjercicioActualId(exerciseId);
      setCurrentInteraccionId(null);
      setCurrentChatMessages([]);
      setNuevoMensaje("");
      setShowPlusPanel(false);
      setQueryEj("");
      navigate(`/interacciones?id=${exerciseId}`, { replace: true });

      // ✅ MÓVIL: al elegir ejercicio, entra al chat y colapsa lista
      if (isMobile()) setMostrarPanel(false);
    },
    [navigate, isMobile]
  );

  const enviarMensaje = useCallback(async () => {
    const ej = ejerciciosDisponibles.find((e) => e._id === ejercicioActualId);
    if (!nuevoMensaje.trim() || !ej || isSendingMessage) return;

    setIsSendingMessage(true);

    const userMessageContent = nuevoMensaje.trim();
    setCurrentChatMessages((prev) => [...prev, { role: "user", content: userMessageContent }]);
    setNuevoMensaje("");

    try {
      const esPrimerMensaje = !currentInteraccionId;
      let response;

      if (esPrimerMensaje) {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/ollama/chat/start-exercise`,
          { userId: MOCK_USER_ID, exerciseId: ej._id, userMessage: userMessageContent }
        );
        setCurrentInteraccionId(response.data.interaccionId);
        fetchSidebarInteractions();
      } else {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ollama/chat/message`, {
          interaccionId: currentInteraccionId,
          userMessage: userMessageContent,
        });
      }

      const { fullHistory } = response.data;
      setCurrentChatMessages(fullHistory || []);

      if (fullHistory?.length > 0) {
        const ultimo = fullHistory[fullHistory.length - 1].content
          .toLowerCase()
          .replace(".", "");
        const terminado = PALABRAS_CLAVE_FIN.some((k) => ultimo.includes(k.toLowerCase()));
        if (terminado) await finalizarEjercicioYRedirigir(esPrimerMensaje);
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setCurrentChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: No se pudo conectar con el tutor." },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  }, [
    ejerciciosDisponibles,
    ejercicioActualId,
    nuevoMensaje,
    isSendingMessage,
    currentInteraccionId,
    MOCK_USER_ID,
    fetchSidebarInteractions,
    finalizarEjercicioYRedirigir,
  ]);

  // ===== Render =====
  if (loading) {
    return (
      <div className="interacciones-cargando">
        <p>Cargando ejercicios e historial…</p>
      </div>
    );
  }

  if (ejerciciosDisponibles.length === 0) {
    return (
      <div className="interacciones-cargando">
        <p>No hay ejercicios disponibles. Revisa el backend y la colección de ejercicios.</p>
      </div>
    );
  }

  if (!ejercicioActualId || !ejercicioActual) {
    return (
      <div className="interacciones-cargando">
        <p>No se ha podido cargar el ejercicio actual.</p>
      </div>
    );
  }

  const imgSrc = ejercicioActual.imagen
    ? `${import.meta.env.VITE_BACKEND_URL}/static/${ejercicioActual.imagen}`
    : "/placeholder-ejercicio.png";

  return (
    <div className="interacciones-scope">
      {mostrarPanel && (
        <aside className="interacciones-sidebar" style={{ width: `${sidebarWidth}px` }}>
          <div className="interacciones-sidebar-header">
            <h2 className="interacciones-sidebar-title">Chats</h2>

            <div className="sidebar-actions">
              <button
                className="btn-icon"
                title={showPlusPanel ? "Cerrar Nuevo chat" : "Nuevo chat"}
                onClick={() => {
                  setShowPlusPanel((v) => !v);
                  setQueryEj("");
                }}
              >
                ＋
              </button>
            </div>
          </div>

          {/* ✅ Panel “Nuevo chat” claramente distinto */}
          {showPlusPanel && (
            <div className="plus-panel">
              <div className="plus-panel-header">
                <h3 className="plus-panel-title">Nuevo chat</h3>
                <button
                  className="plus-panel-close"
                  title="Cerrar"
                  onClick={() => {
                    setShowPlusPanel(false);
                    setQueryEj("");
                  }}
                >
                  ✕
                </button>
              </div>

              <input
                className="plus-search"
                type="text"
                value={queryEj}
                onChange={(e) => setQueryEj(e.target.value)}
                placeholder="Buscar ejercicio…"
              />

              <div className="plus-list">
                {ejerciciosFiltrados.length > 0 ? (
                  ejerciciosFiltrados.map((e) => (
                    <div
                      key={e._id}
                      className="plus-item"
                      onClick={() => startNewChatWithExercise(e._id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="plus-item-title">{e.titulo}</div>
                      <div className="plus-item-meta">
                        {e.concepto} · Nivel {e.nivel}
                        <span className="plus-item-pill">N{e.nivel}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="plus-empty">No hay ejercicios que coincidan.</div>
                )}
              </div>
            </div>
          )}

          {/* ✅ Lista SOLO de interacciones (estilo WhatsApp: filas) */}
          <div className="sidebar-list">
            {sidebarInteractions.length > 0 ? (
              sidebarInteractions.map((i) => (
                <div
                  key={i.id}
                  className={`sidebar-item ${i.id === currentInteraccionId ? "sidebar-item-active" : ""}`}
                  onClick={() => seleccionarInteraccion(i)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sidebar-item-content">
                    <div className="sidebar-item-title">{i.titulo}</div>
                    <div className="sidebar-item-sub">
                      {i.concepto} · Nivel {i.nivel}
                    </div>
                  </div>

                  <button
                    className="sidebar-item-trash"
                    title="Eliminar interacción"
                    onClick={(e) => {
                      e.stopPropagation();
                      borrarInteraccion(i.id);
                    }}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="sidebar-empty">
                No hay interacciones guardadas. Pulsa “＋” para empezar.
              </div>
            )}
          </div>

          {/* resizer (en móvil queda inofensivo por CSS) */}
          <div className="sidebar-resizer" onMouseDown={startResizing} />
        </aside>
      )}

      {/* ✅ botón colapsar/expandir (en móvil se comporta como WhatsApp) */}
      <button
        onClick={() => setMostrarPanel((v) => !v)}
        className={`sidebar-collapse ${mostrarPanel ? "sidebar-collapse-open" : "sidebar-collapse-closed"}`}
        title={mostrarPanel ? "Contraer lista" : "Volver a lista"}
      >
        {mostrarPanel ? "‹" : "›"}
      </button>

      <main className="chat-wrap">
        <div className="chat-top">
          <img
            src={imgSrc}
            alt={ejercicioActual.titulo || "Ejercicio"}
            className="chat-top-img"
            onClick={() => openImageModal(imgSrc, ejercicioActual.titulo || "Ejercicio")}
          />

          <div className="chat-top-text">
            <h3 className="chat-top-title">{ejercicioActual.titulo}</h3>
            <p className="chat-top-enunciado">{ejercicioActual.enunciado}</p>
          </div>
        </div>

        <div className="chat-body">
          <div ref={scrollRef} className="chat-messages">
            {currentChatMessages.length > 0 ? (
              currentChatMessages.map((m, i) => (
                <div key={i} className={`msg ${m.role === "user" ? "msg-user" : "msg-assistant"}`}>
                  {m.content}
                </div>
              ))
            ) : (
              <p className="chat-empty">No hay mensajes aún. Escribe el primero para empezar.</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
            className="chat-inputbar"
          >
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder={isSendingMessage ? "Pensando…" : "Escribe tu mensaje…"}
              className="chat-text"
              disabled={isSendingMessage || !ejercicioActualId}
            />

            <button
              type="submit"
              className="btn-secondary chat-send"
              disabled={isSendingMessage || !nuevoMensaje.trim() || !ejercicioActualId}
            >
              {isSendingMessage ? "Enviando…" : "Enviar"}
            </button>
          </form>
        </div>
      </main>

      {showImageModal && (
        <div className="img-modal-backdrop" onClick={closeImageModal}>
          <div className="img-modal" onClick={(e) => e.stopPropagation()}>
            <button className="img-modal-close" onClick={closeImageModal} title="Cerrar">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img src={modalImageUrl} alt={modalImageAlt} />
          </div>
        </div>
      )}
    </div>
  );
}
