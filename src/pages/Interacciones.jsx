import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getCurrentUser } from "../services/auth";
import { api } from "../services/api";

const PALABRAS_CLAVE_FIN = ["Enhorabuena, esa es la respuesta correcta"];

export default function Interacciones() {
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [ejercicioActualId, setEjercicioActualId] = useState(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [currentInteraccionId, setCurrentInteraccionId] = useState(null);

  // ✅ usuario real desde sesión
  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ Vista móvil real (no función)
  const [isMobileView, setIsMobileView] = useState(false);

  // ✅ Panel (lista chats)
  const [mostrarPanel, setMostrarPanel] = useState(true);

  // Sidebar width (solo desktop)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem("sidebarWidth");
    return savedWidth ? parseInt(savedWidth, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [sidebarInteractions, setSidebarInteractions] = useState([]);

  // “Nuevo chat”
  const [showPlusPanel, setShowPlusPanel] = useState(false);
  const [queryEj, setQueryEj] = useState("");

  // Modal imagen
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [modalImageAlt, setModalImageAlt] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // ✅ Detectar móvil y actualizar en resize
  useEffect(() => {
    const compute = () => setIsMobileView(window.innerWidth <= 640);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // ✅ Inicializa mostrarPanel según dispositivo (en desktop sí, en móvil depende)
  useEffect(() => {
    if (isMobileView) {
      // En móvil: por defecto mostramos lista SOLO si no hay ejercicio seleccionado aún
      // (luego lo ajustamos también al leer la URL)
      // No forzamos aquí, lo decide la init.
    } else {
      // En escritorio: lista visible por defecto
      setMostrarPanel(true);
    }
  }, [isMobileView]);

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

  // ===== Resize sidebar (solo desktop) =====
  const startResizing = useCallback((e) => {
    if (isMobileView) return;
    setIsResizing(true);
    e.preventDefault();
  }, [isMobileView]);

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

  // ✅ 1) Cargar usuario desde sesión
  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await getCurrentUser();
        if (me?.authenticated && me?.user?.id) setUserId(me.user.id);
        else setUserId(null);
      } catch {
        setUserId(null);
      } finally {
        setAuthChecked(true);
      }
    };
    loadUser();
  }, []);

  const fetchSidebarInteractions = useCallback(async () => {
    if (!userId || ejerciciosDisponibles.length === 0) return;

    try {
      const res = await api.get(`/api/interacciones/user/${userId}`);
      const lista = Array.isArray(res.data) ? res.data : [];

      const interactionsWithDetails = lista.map((interaccion) => {
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
  }, [ejerciciosDisponibles, userId]);

  const finalizarEjercicioYRedirigir = useCallback(
    async (resueltoALaPrimera = false) => {
      const ej = ejerciciosDisponibles.find((e) => e._id === ejercicioActualId);
      if (!ej?._id || !userId || !currentInteraccionId) return navigate("/dashboard");

      setTimeout(async () => {
        try {
          await api.post("/api/resultados/finalizar", {
            userId,
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
    [ejercicioActualId, currentInteraccionId, navigate, ejerciciosDisponibles, userId]
  );

  // ===== Inicialización (URL / localStorage / fallback) =====
  useEffect(() => {
    const fetchAndInitialize = async () => {
      try {
        if (!authChecked) return;

        const res = await api.get("/api/ejercicios");
        const ejercicios = Array.isArray(res.data) ? res.data : [];
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
            const interaccionRes = await api.get(`/api/interacciones/${interaccionIdFromUrl}`);
            newCurrentInteraccionId = interaccionRes.data?._id || null;
            newCurrentExerciseId = interaccionRes.data?.ejercicio_id || null;
            loadedMessages = interaccionRes.data?.conversacion || [];
          } catch (error) {
            console.warn("Interacción URL inválida:", error);
          }
        }

        // 2) interaccionId en localStorage
        if (!newCurrentInteraccionId && interaccionIdFromLocalStorage) {
          try {
            const interaccionRes = await api.get(`/api/interacciones/${interaccionIdFromLocalStorage}`);
            newCurrentInteraccionId = interaccionRes.data?._id || null;
            newCurrentExerciseId = interaccionRes.data?.ejercicio_id || null;
            loadedMessages = interaccionRes.data?.conversacion || [];
          } catch (error) {
            console.warn("Interacción localStorage inválida:", error);
            localStorage.removeItem("currentInteraccionId");
            localStorage.removeItem("ejercicioActualId");
          }
        }

        // 3) exerciseId en URL → busca interacción existente
        if (!newCurrentInteraccionId && userId && idFromUrl && ejercicios.some((e) => e._id === idFromUrl)) {
          try {
            const existing = await api.get(`/api/interacciones/byExerciseAndUser/${idFromUrl}/${userId}`);
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
          userId &&
          exerciseIdFromLocalStorage &&
          ejercicios.some((e) => e._id === exerciseIdFromLocalStorage)
        ) {
          try {
            const existing = await api.get(
              `/api/interacciones/byExerciseAndUser/${exerciseIdFromLocalStorage}/${userId}`
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

        // Fallback
        if (!newCurrentExerciseId && ejercicios.length > 0) {
          newCurrentExerciseId = ejercicios[0]._id;
        }

        setEjercicioActualId(newCurrentExerciseId);
        setCurrentInteraccionId(newCurrentInteraccionId);
        setCurrentChatMessages(Array.isArray(loadedMessages) ? loadedMessages : []);
      } catch (err) {
        console.error("Error general cargando ejercicios/interacciones:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndInitialize();
  }, [location.search, userId, authChecked]);

  // ✅ Ajuste clave móvil: si vienes desde Ejercicios con id/interaccionId, abre CHAT (no lista)
  useEffect(() => {
    if (!isMobileView) return;

    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get("id");
    const interaccionIdFromUrl = queryParams.get("interaccionId");

    // Si hay un objetivo claro, mostramos chat
    if (idFromUrl || interaccionIdFromUrl) {
      setMostrarPanel(false);
    } else {
      // Si no hay nada seleccionado aún, muestra lista
      setMostrarPanel(true);
    }
  }, [isMobileView, location.search]);

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

  // Refresca sidebar
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
        const interaccionRes = await api.get(`/api/interacciones/${interaccion.id}`);
        const conv = Array.isArray(interaccionRes.data?.conversacion) ? interaccionRes.data.conversacion : [];
        setCurrentChatMessages(conv);

        navigate(`/interacciones?id=${interaccion.ejercicioId}&interaccionId=${interaccion.id}`, {
          replace: true,
        });

        // ✅ En móvil, al elegir chat -> ir a chat
        if (isMobileView) setMostrarPanel(false);
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
    [navigate, isMobileView]
  );

  const borrarInteraccion = useCallback(
    async (interaccionIdToDelete) => {
      if (!window.confirm("¿Eliminar esta interacción? Se borrará permanentemente.")) return;

      try {
        await api.delete(`/api/interacciones/${interaccionIdToDelete}`);
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

      // ✅ En móvil, al empezar chat -> ir a chat
      if (isMobileView) setMostrarPanel(false);
    },
    [navigate, isMobileView]
  );

  const enviarMensaje = useCallback(async () => {
    const ej = ejerciciosDisponibles.find((e) => e._id === ejercicioActualId);
    if (!nuevoMensaje.trim() || !ej || isSendingMessage) return;

    if (!userId) {
      alert("No hay sesión iniciada. Vuelve a Login y entra en modo demo (o CAS cuando esté disponible).");
      return;
    }

    setIsSendingMessage(true);

    const userMessageContent = nuevoMensaje.trim();
    setCurrentChatMessages((prev) => [...prev, { role: "user", content: userMessageContent }]);
    setNuevoMensaje("");

    try {
      const esPrimerMensaje = !currentInteraccionId;
      let response;

      if (esPrimerMensaje) {
        response = await api.post("/api/ollama/chat/start-exercise", {
          userId,
          exerciseId: ej._id,
          userMessage: userMessageContent,
        });
        setCurrentInteraccionId(response.data?.interaccionId || null);
        fetchSidebarInteractions();
      } else {
        response = await api.post("/api/ollama/chat/message", {
          interaccionId: currentInteraccionId,
          userMessage: userMessageContent,
        });
      }

      const fullHistory = response.data?.fullHistory;
      setCurrentChatMessages(Array.isArray(fullHistory) ? fullHistory : []);

      if (Array.isArray(fullHistory) && fullHistory.length > 0) {
        const ultimo = String(fullHistory[fullHistory.length - 1]?.content || "")
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
    userId,
    fetchSidebarInteractions,
    finalizarEjercicioYRedirigir,
  ]);

  // ===== Render =====
  if (!authChecked) {
    return (
      <div className="interacciones-cargando">
        <p>Comprobando sesión…</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="interacciones-cargando">
        <p>No hay sesión iniciada.</p>
        <p>Vuelve a Login y entra en modo demo (o CAS cuando esté disponible).</p>
      </div>
    );
  }

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

  const imgSrc = ejercicioActual.imagen ? `/static/${ejercicioActual.imagen}` : "/placeholder-ejercicio.png";

  return (
    <div className="interacciones-scope">
      {/* ===== LISTA (sidebar) ===== */}
      {mostrarPanel && (
        <aside
          className="interacciones-sidebar"
          style={{ width: isMobileView ? "100%" : `${sidebarWidth}px` }}
        >
          <div className="interacciones-sidebar-header">
            <h2 className="interacciones-sidebar-title">Chats</h2>

            <div className="sidebar-actions">
              {/* ✅ En móvil: botón cerrar lista (volver al chat) */}
              {isMobileView && (
                <button
                  className="btn-icon"
                  title="Volver al chat"
                  onClick={() => setMostrarPanel(false)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}

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
              <div className="sidebar-empty">No hay interacciones guardadas. Pulsa “＋” para empezar.</div>
            )}
          </div>

          {/* Resizer solo desktop */}
          {!isMobileView && <div className="sidebar-resizer" onMouseDown={startResizing} />}
        </aside>
      )}

      {/* ===== CHAT ===== */}
      <main className="chat-wrap">
        <div className="chat-top">
          {/* ✅ Botón claro en móvil para abrir lista (tipo WhatsApp) */}
          {isMobileView && !mostrarPanel && (
            <button
              className="mobile-open-chats"
              onClick={() => setMostrarPanel(true)}
              title="Ver chats"
              type="button"
            >
              Chats
            </button>
          )}

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

      {/* Modal imagen */}
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
